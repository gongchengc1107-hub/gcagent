import { app, BrowserWindow, shell, ipcMain, session, dialog } from 'electron'
import { join, resolve, dirname } from 'path'
import { randomUUID } from 'crypto'
import {
  readFileSync,
  writeFileSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'fs'
import { homedir } from 'os'
import { spawn, execFile } from 'child_process'
import type { ChildProcess } from 'child_process'
import net from 'net'
import https from 'https'
import http from 'http'

// node-pty 是 native addon，在 asar 打包环境中可能不存在，延迟加载
let nodePty: typeof import('node-pty') | null = null
try {
  nodePty = await import('node-pty')
} catch {
  // asar 环境中 node-pty 不可用，PTY 功能将被禁用
}

// ─── 本地类型（主进程不依赖渲染层 types）─────────────────────

type MCPStatus = 'connected' | 'disconnected' | 'connecting' | 'needs_auth' | 'failed'

interface MCPServerEntry {
  type: 'local' | 'remote'
  enabled: boolean
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}

interface MCPConfigDisk {
  id: string
  name: string
  type: 'local' | 'remote'
  enabled: boolean
  isBuiltin: boolean
  status: MCPStatus
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
  createdAt: number
  updatedAt: number
}

interface AgentDisk {
  id: string
  name: string
  backendName: string
  emoji: string
  description: string
  enabled: boolean
  mode: 'primary' | 'subagent' | 'all'
  systemPrompt: string
  tools: Record<string, boolean>
  skillIds: string[]
  autoMode: boolean
  isBuiltin: boolean
  isFromDisk: boolean
  createdAt: number
  updatedAt: number
}

/** skill 全局安装目录 */
const SKILLS_DIR = resolve(homedir(), '.config/codemaker/skills')

/** codemaker 配置目录 */
const CODEMAKER_CONFIG_DIR = resolve(homedir(), '.config/codemaker')

/** MCP 配置文件路径 */
const MCP_CONFIG_FILE = resolve(CODEMAKER_CONFIG_DIR, 'mcp.json')

/** 应用启动时记录的工作区根目录 */
const workspaceRoot = process.cwd()

const isDev = !app.isPackaged

/** 是否 Windows 平台 */
const isWindows = process.platform === 'win32'

let mainWindow: BrowserWindow | null = null
let serveProcess: ChildProcess | null = null
let servePort = 4000

/** PTY 实例池，key 为 ptyId */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ptyMap = new Map<string, any>()

// ─── 工具函数 ──────────────────────────────────────────────

/** 读取本地 Codemaker auth 凭证 */
function readLocalAuth(): { username: string; token: string; expire: number } | null {
  const authPath = resolve(homedir(), '.local/share/codemaker/auth.json')
  if (!existsSync(authPath)) return null
  try {
    const raw = JSON.parse(readFileSync(authPath, 'utf-8'))
    const cred = raw['netease-codemaker']
    if (!cred?.access_token || !cred?.access_user) return null
    return {
      username: cred.access_user as string,
      token: cred.access_token as string,
      // expire 可能是秒级（< 1e12）也可能是毫秒级，统一转为毫秒
      expire: typeof cred.expire === 'number'
        ? (cred.expire < 1e12 ? cred.expire * 1000 : cred.expire)
        : 0
    }
  } catch {
    return null
  }
}

/** 寻找可用端口（从 startPort 开始向上探测，上限 65535） */
function findFreePort(startPort: number, maxPort = 65535): Promise<number> {
  if (startPort > maxPort) return Promise.reject(new Error('No free port available'))
  return new Promise((resolve, _reject) => {
    const server = net.createServer()
    server.once('error', () => resolve(findFreePort(startPort + 1, maxPort)))
    server.once('listening', () => {
      const port = (server.address() as net.AddressInfo).port
      server.close(() => resolve(port))
    })
    server.listen(startPort, '127.0.0.1')
  })
}

/** 获取 codemaker 可执行文件路径 */
function getCodemakBin(): string {
  const candidates = isWindows
    ? [
        resolve(process.env.USERPROFILE ?? homedir(), '.codemaker', 'bin', 'codemaker.exe'),
        'codemaker'
      ]
    : [
        resolve(homedir(), '.codemaker/bin/codemaker'),
        '/usr/local/bin/codemaker',
        'codemaker'
      ]
  for (const p of candidates) {
    try {
      if (p !== 'codemaker' && existsSync(p)) return p
    } catch {
      // ignore
    }
  }
  // 所有绝对路径均不存在，回退到 PATH 中的 codemaker
  return 'codemaker'
}

/** 检查指定端口是否已被 codemaker serve 占用 */
async function isPortOccupiedByServe(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' }, () => {
      socket.end()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
    socket.setTimeout(1000, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

/** 启动 codemaker serve 子进程 */
async function startServeProcess(): Promise<void> {
  // 优先尝试使用默认端口 4000，如果已被 serve 占用则直接复用
  const targetPort = 4000
  const occupied = await isPortOccupiedByServe(targetPort)
  if (occupied) {
    if (isDev) console.log(`[codemaker serve] port ${targetPort} already in use, reusing`)
    servePort = targetPort
    return
  }

  servePort = await findFreePort(targetPort)
  const bin = getCodemakBin()

  serveProcess = spawn(bin, ['serve', '--port', String(servePort), '--hostname', '127.0.0.1'], {
    detached: false,
    stdio: 'pipe',
    env: { ...process.env }
  })

  serveProcess.stdout?.on('data', (data: Buffer) => {
    if (isDev) process.stdout.write(`[codemaker serve] ${data}`)
  })
  serveProcess.stderr?.on('data', (data: Buffer) => {
    if (isDev) process.stderr.write(`[codemaker serve] ${data}`)
  })
  serveProcess.on('exit', (code) => {
    if (isDev) console.log(`[codemaker serve] exited with code ${code}`)
    serveProcess = null
  })
}

/** 执行 codemaker 子命令，返回 stdout 字符串 */
function runCLI(args: string[]): Promise<string> {
  const bin = getCodemakBin()
  return new Promise((resolve, reject) => {
    execFile(bin, args, { env: { ...process.env } }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message))
      } else {
        resolve(stdout)
      }
    })
  })
}

// ─── 窗口 ─────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    center: true,
    show: false,
    title: 'Codemaker Dashboard',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // 开发模式下自动打开渲染进程 DevTools
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' })
    }
  })

  /* macOS 关闭窗口不退出，隐藏到 Dock */
  mainWindow.on('close', (e) => {
    if (process.platform === 'darwin' && mainWindow) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (/^https?:\/\//.test(details.url)) {
      shell.openExternal(details.url)
    }
    return { action: 'deny' }
  })

  /* ⌘K 全局快捷键 → 通知渲染进程打开搜索面板 */
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.meta && input.key === 'k') {
      mainWindow?.webContents.send('shortcut:search')
    }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── IPC 注册 ─────────────────────────────────────────────

function registerIPC(): void {
  /* ── 认证 ── */
  ipcMain.handle('auth:getLocalAuth', () => readLocalAuth())


  /* ── Serve 端口 ── */
  ipcMain.handle('serve:getPort', () => servePort)

  /* ── 模型列表 ── */
  ipcMain.handle('models:list', async () => {
    try {
      const out = await runCLI(['models'])
      return out
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^[\w-]+\/[\w.-]+$/.test(l))
    } catch {
      return []
    }
  })

  /* ── 统计：quota ── */
  ipcMain.handle('stats:quota', async () => {
    try {
      const out = await runCLI(['quota'])
      return JSON.parse(out)
    } catch {
      return null
    }
  })

  /* ── 统计：token-usage ── */
  ipcMain.handle('stats:tokenUsage', async (_event, args: string[] = []) => {
    try {
      // 只允许 --since=YYYY-MM-DD 格式的参数，防止命令注入
      const safe = args.filter((a) => /^--[\w-]+=[\w-]+$/.test(a))
      const out = await runCLI(['token-usage', '--format', 'json', ...safe])
      return JSON.parse(out)
    } catch {
      return []
    }
  })

  /* ── 文件操作（真实实现） ── */

  /**
   * 路径安全校验：只允许访问 codemaker 配置目录和工作区目录
   * 拒绝包含 .. 的路径穿越
   */
  function isPathAllowed(p: string): boolean {
    if (p.includes('..')) return false
    const normalized = resolve(p)
    return (
      normalized.startsWith(CODEMAKER_CONFIG_DIR + '/') ||
      normalized === CODEMAKER_CONFIG_DIR ||
      normalized.startsWith(workspaceRoot + '/') ||
      normalized === workspaceRoot
    )
  }

  ipcMain.handle('fs:read-file', (_event, p: string): string => {
    if (!isPathAllowed(p)) {
      if (isDev) console.warn('[fs:read-file] path not allowed:', p)
      return ''
    }
    const abs = resolve(p)
    if (!existsSync(abs)) return ''
    try {
      return readFileSync(abs, 'utf-8')
    } catch (e) {
      if (isDev) console.warn('[fs:read-file] error:', e)
      return ''
    }
  })

  ipcMain.handle('fs:write-file', (_event, p: string, content: string): void => {
    if (!isPathAllowed(p)) {
      if (isDev) console.warn('[fs:write-file] path not allowed:', p)
      return
    }
    const abs = resolve(p)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content, 'utf-8')
  })

  ipcMain.handle('fs:delete-file', (_event, p: string): boolean => {
    if (!isPathAllowed(p)) {
      if (isDev) console.warn('[fs:delete-file] path not allowed:', p)
      return false
    }
    const abs = resolve(p)
    if (!existsSync(abs)) return true
    try {
      unlinkSync(abs)
      return true
    } catch {
      return false
    }
  })

  /**
   * 不受 isPathAllowed 限制的文件读取——用于预览 AI agent 写入的文件。
   * 仅允许读取操作（只读），且仅限 .md / .json / .html 扩展名。
   */
  ipcMain.handle('fs:read-file-unrestricted', (_event, p: string): string => {
    if (p.includes('..')) return ''
    const allowed = /\.(md|markdown|json|html|htm)$/i
    if (!allowed.test(p)) {
      if (isDev) console.warn('[fs:read-file-unrestricted] extension not allowed:', p)
      return ''
    }
    const abs = resolve(p)
    if (!existsSync(abs)) return ''
    try {
      return readFileSync(abs, 'utf-8')
    } catch (e) {
      if (isDev) console.warn('[fs:read-file-unrestricted] error:', e)
      return ''
    }
  })

  ipcMain.handle('fs:list-dir', (_event, dir: string): string[] => {
    if (!isPathAllowed(dir)) {
      if (isDev) console.warn('[fs:list-dir] path not allowed:', dir)
      return []
    }
    const abs = resolve(dir)
    if (!existsSync(abs)) return []
    try {
      return readdirSync(abs, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name)
    } catch {
      return []
    }
  })

  /* ── 文件保存对话框（侧边栏文件预览功能使用） ── */

  ipcMain.handle(
    'dialog:showSaveDialog',
    async (
      _event,
      defaultName: string,
      filters: { name: string; extensions: string[] }[]
    ) => {
      if (!mainWindow) return { canceled: true }
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [
          ...filters,
          { name: '所有文件', extensions: ['*'] }
        ]
      })
      return { canceled: result.canceled, filePath: result.filePath }
    }
  )

  /**
   * 不受 isPathAllowed 限制的文件保存——用于用户手动选择路径后的保存操作。
   * 安全性由 dialog.showSaveDialog 保证（用户已显式选择了路径）。
   */
  ipcMain.handle('fs:save-file', (_event, filePath: string, content: string): boolean => {
    try {
      const abs = resolve(filePath)
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, content, 'utf-8')
      if (isDev) console.log('[fs:save-file] saved:', abs)
      return true
    } catch (e) {
      if (isDev) console.warn('[fs:save-file] error:', e)
      return false
    }
  })

  /* ── MCP 配置（真实实现） ── */

  /** 将磁盘 mcpServers 对象转换为 MCPConfig 数组 */
  function parseMCPConfigFile(raw: string): MCPConfigDisk[] {
    try {
      const json = JSON.parse(raw) as { mcpServers?: Record<string, MCPServerEntry> }
      const servers = json.mcpServers ?? {}
      return Object.entries(servers).map(([name, cfg]) => ({
        id: `mcp-disk-${name}`,
        name,
        type: cfg.type ?? (cfg.command ? 'local' : 'remote'),
        enabled: cfg.enabled !== false,
        isBuiltin: false,
        status: 'disconnected' as const,
        command: cfg.command,
        args: cfg.args,
        env: cfg.env,
        url: cfg.url,
        headers: cfg.headers,
        createdAt: 0,
        updatedAt: 0,
      }))
    } catch {
      return []
    }
  }

  ipcMain.handle('mcp:read-config', (): MCPConfigDisk[] => {
    if (!existsSync(MCP_CONFIG_FILE)) return []
    try {
      const raw = readFileSync(MCP_CONFIG_FILE, 'utf-8')
      return parseMCPConfigFile(raw)
    } catch {
      return []
    }
  })

  ipcMain.handle('mcp:write-config', (_event, mcps: MCPConfigDisk[]): void => {
    const custom = mcps.filter((m) => !m.isBuiltin)
    const mcpServers: Record<string, MCPServerEntry> = {}
    for (const m of custom) {
      const entry: MCPServerEntry = {
        type: m.type,
        enabled: m.enabled,
      }
      if (m.type === 'local') {
        if (m.command) entry.command = m.command
        if (m.args?.length) entry.args = m.args
        if (m.env && Object.keys(m.env).length) entry.env = m.env
      } else {
        if (m.url) entry.url = m.url
        if (m.headers && Object.keys(m.headers).length) entry.headers = m.headers
      }
      mcpServers[m.name] = entry
    }
    mkdirSync(CODEMAKER_CONFIG_DIR, { recursive: true })
    writeFileSync(MCP_CONFIG_FILE, JSON.stringify({ mcpServers }, null, 2), 'utf-8')
    if (isDev) console.log('[mcp:write-config] written:', Object.keys(mcpServers))
  })

  /* ── MCP 状态检测（真实实现） ── */

  /**
   * 本地 MCP 真实握手检测
   * 流程：spawn 子进程 → 发送 JSON-RPC initialize → 等待合法响应（8 秒超时）
   * 任何一步失败（命令不存在、进程崩溃、超时、响应非法）均返回 failed
   */
  async function checkLocalMCPStatus(mcp: MCPConfigDisk): Promise<MCPStatus> {
    return new Promise((resolve) => {
      let settled = false
      const settle = (status: MCPStatus) => {
        if (settled) return
        settled = true
        resolve(status)
      }

      // 命令路径不存在时直接返回 failed
      const cmd = mcp.command!
      const args = mcp.args ?? []
      const env = { ...process.env, ...(mcp.env ?? {}) }

      let child: ReturnType<typeof spawn> | null = null
      try {
        child = spawn(cmd, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env,
          // 不使用 shell，避免路径问题掩盖真实错误
          shell: false,
        })
      } catch {
        settle('failed')
        return
      }

      // 8 秒总超时
      const timer = setTimeout(() => {
        child?.kill()
        settle('failed')
      }, 8000)

      // 进程启动失败（命令不存在等）
      child.on('error', () => {
        clearTimeout(timer)
        settle('failed')
      })

      // 进程意外退出
      child.on('exit', (code) => {
        clearTimeout(timer)
        // 正常握手后我们会主动 kill，退出码非 null 但已 settled 则忽略
        if (!settled) settle(code === 0 ? 'failed' : 'failed')
      })

      // 拼接 stdout 数据，等待完整 JSON-RPC 响应
      let buffer = ''
      child.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        // MCP 响应以换行符分隔，逐行尝试解析
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const msg = JSON.parse(trimmed) as Record<string, unknown>
            // MCP initialize 响应：jsonrpc=2.0 且包含 result 字段
            if (
              msg.jsonrpc === '2.0' &&
              ('result' in msg || 'error' in msg)
            ) {
              clearTimeout(timer)
              child?.kill()
              settle('result' in msg ? 'connected' : 'failed')
              return
            }
          } catch {
            // 非 JSON 行，继续等待
          }
        }
      })

      // 发送 MCP JSON-RPC initialize 请求
      const initRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'gcagent-health-check', version: '1.0.0' },
        },
      }) + '\n'

      try {
        child.stdin?.write(initRequest)
      } catch {
        clearTimeout(timer)
        child?.kill()
        settle('failed')
      }
    })
  }

  ipcMain.handle('mcp:check-status', async (_event, mcp: MCPConfigDisk): Promise<MCPStatus> => {
    try {
      if (!mcp.enabled) return 'disconnected'

      // 本地 MCP：通过 stdio 发送 MCP JSON-RPC initialize 握手，验证进程真实可用
      if (mcp.type === 'local' && mcp.command) {
        return await checkLocalMCPStatus(mcp)
      }

      // 远程 MCP：HTTP GET 探测，5 秒超时
      if (mcp.type === 'remote' && mcp.url) {
        return new Promise((resolve) => {
          let settled = false
          const settle = (status: MCPStatus) => {
            if (settled) return
            settled = true
            resolve(status)
          }

          const timer = setTimeout(() => {
            req.destroy()
            settle('failed')
          }, 5000)

          let mod: typeof https | typeof http
          try {
            const parsedUrl = new URL(mcp.url!)
            mod = parsedUrl.protocol === 'https:' ? https : http
          } catch {
            clearTimeout(timer)
            resolve('failed')
            return
          }

          const req = mod.get(mcp.url!, { headers: mcp.headers ?? {} }, (res) => {
            clearTimeout(timer)
            res.resume()
            settle((res.statusCode ?? 0) < 500 ? 'connected' : 'failed')
          })
          req.on('error', () => {
            clearTimeout(timer)
            settle('failed')
          })
        })
      }

      return 'disconnected'
    } catch (e) {
      if (isDev) console.warn('[mcp:check-status] 异常:', e)
      return 'failed'
    }
  })

  /* ── Agent 磁盘操作 ── */

  /** 解析 Agent .md 文件的 frontmatter */
  function parseAgentFrontmatter(content: string, fileName: string): AgentDisk {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)/)
    const fm = match?.[1] ?? ''
    const body = match?.[2]?.trim() ?? ''

    const get = (key: string): string => {
      const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
      return m ? m[1].trim() : ''
    }
    const getList = (key: string): string[] => {
      const m = fm.match(new RegExp(`^${key}:\\s*\\[(.*)\\]`, 'm'))
      if (!m) return []
      return m[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean)
    }
    const getTools = (): Record<string, boolean> => {
      // 支持 tools: bash,read,write 或 tools: {bash: true, read: true}
      const raw = get('tools')
      if (!raw) return {}
      if (raw.startsWith('{')) {
        try { return JSON.parse(raw) } catch { return {} }
      }
      const toolNames = raw.split(',').map((t) => t.trim()).filter(Boolean)
      return Object.fromEntries(toolNames.map((t) => [t, true]))
    }

    const baseName = fileName.replace(/\.md$/, '')
    const name = get('name') || baseName
    const backendName = get('backendName') || baseName
    const emoji = get('emoji') || '🤖'
    const description = get('description') || ''
    const autoMode = get('autoMode') === 'true'
    const enabled = get('enabled') !== 'false'
    const rawMode = get('mode')
    const mode: 'primary' | 'subagent' | 'all' =
      rawMode === 'primary' || rawMode === 'subagent' || rawMode === 'all' ? rawMode : 'primary'
    const skillIds = getList('skillIds')
    const tools = getTools()

    return {
      id: `disk-${backendName}`,
      name,
      backendName,
      emoji,
      description,
      enabled,
      mode,
      systemPrompt: body,
      tools,
      skillIds,
      autoMode,
      isBuiltin: false,
      isFromDisk: true,
      createdAt: 0,
      updatedAt: 0,
    }
  }

  /** 生成 Agent .md 文件内容（frontmatter + 系统提示词正文） */
  function buildAgentFrontmatter(agent: AgentDisk): string {
    const skillIds = JSON.stringify(agent.skillIds ?? [])
    const toolsStr = Object.keys(agent.tools ?? {}).length > 0
      ? Object.entries(agent.tools).map(([k, v]) => `${k}:${v}`).join(',')
      : ''
    const lines = [
      '---',
      `name: ${agent.name}`,
      `backendName: ${agent.backendName}`,
      `emoji: ${agent.emoji}`,
      `description: ${agent.description}`,
      `mode: ${agent.mode ?? 'primary'}`,
      `autoMode: ${agent.autoMode}`,
      `enabled: ${agent.enabled}`,
      `skillIds: ${skillIds}`,
    ]
    if (toolsStr) lines.push(`tools: ${toolsStr}`)
    lines.push('---', '')
    if (agent.systemPrompt) lines.push(agent.systemPrompt, '')
    return lines.join('\n')
  }

  ipcMain.handle('agent:list-disk', (): AgentDisk[] => {
    const agentsDir = join(workspaceRoot, '.agents')
    if (!existsSync(agentsDir)) return []
    try {
      const files = readdirSync(agentsDir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => e.name)
      return files.map((f) => {
        const content = readFileSync(join(agentsDir, f), 'utf-8')
        return parseAgentFrontmatter(content, f)
      })
    } catch {
      return []
    }
  })

  /**
   * 通过 codemaker CLI 列出所有真实 agent
   * 解析 `codemaker agent list` 输出，格式：`名称 (类型)`
   */

  /** CLI agent 内置描述映射表 */
  /** CLI agent 内置描述映射表 */
  const CLI_AGENT_DESCRIPTIONS: Record<string, { description: string; emoji: string }> = {
    build:             { emoji: '⚙️',  description: '通用构建 agent，支持代码编写、调试、文件修改和工具调用' },
    compaction:        { emoji: '🗜️',  description: '上下文压缩 agent，在对话过长时自动精简历史消息' },
    explore:           { emoji: '🔍',  description: '代码探索 agent，专注代码库分析和只读操作，不修改文件' },
    general:           { emoji: '🤖',  description: '通用 agent，适合问答、解释和不涉及文件操作的任务' },
    plan:              { emoji: '📋',  description: '规划 agent，制定执行计划并拆解复杂任务步骤' },
    summary:           { emoji: '📝',  description: '摘要 agent，对会话内容生成结构化摘要' },
    title:             { emoji: '🏷️',  description: '标题 agent，根据对话内容自动生成会话标题' },
    'code-reviewer':   { emoji: '👁️',  description: '代码审查 agent，审查代码质量、安全性和最佳实践' },
    'coding-agent':    { emoji: '💻',  description: '编码 agent，专注于代码实现和重构任务' },
    'product-manager': { emoji: '📊',  description: '产品经理 agent，负责需求分析、PRD 撰写和产品方案设计' },
  }

  ipcMain.handle('agent:list-cli', async (): Promise<AgentDisk[]> => {
    try {
      const out = await runCLI(['agent', 'list'])
      const agents: AgentDisk[] = []
      const lines = out.split('\n')
      for (const line of lines) {
        const match = line.match(/^([\w-]+)\s+\((primary|subagent|all)\)/)
        if (!match) continue
        const backendName = match[1]
        const roleType = match[2] as 'primary' | 'subagent' | 'all'
        const meta = CLI_AGENT_DESCRIPTIONS[backendName]
        const emoji = meta?.emoji ?? (roleType === 'primary' ? '⚙️' : roleType === 'subagent' ? '🤖' : '🌐')
        const description = meta?.description ?? `codemaker ${roleType} agent`
        agents.push({
          id: `cli-${backendName}`,
          name: backendName,
          backendName,
          emoji,
          description,
          enabled: true,
          mode: roleType,
          systemPrompt: '',
          tools: {},
          skillIds: [],
          autoMode: roleType === 'primary',
          isBuiltin: false,
          isFromDisk: true,
          createdAt: 0,
          updatedAt: 0,
        })
      }
      return agents
    } catch (e) {
      if (isDev) console.warn('[agent:list-cli] 失败:', e)
      return []
    }
  })

  ipcMain.handle('agent:write', (_event, agent: AgentDisk): void => {
    const agentsDir = join(workspaceRoot, '.agents')
    mkdirSync(agentsDir, { recursive: true })
    const safeName = (agent.backendName || agent.name)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
    const filePath = join(agentsDir, `${safeName}.md`)
    writeFileSync(filePath, buildAgentFrontmatter(agent), 'utf-8')
    if (isDev) console.log('[agent:write] written:', filePath)
  })

  ipcMain.handle('agent:delete', (_event, backendName: string): boolean => {
    const safeName = backendName.replace(/[^a-z0-9-]/g, '-')
    const filePath = join(workspaceRoot, '.agents', `${safeName}.md`)
    if (!existsSync(filePath)) return true
    try {
      unlinkSync(filePath)
      return true
    } catch {
      return false
    }
  })

  /* ── Shell ── */
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    // 只允许安全协议，防止 file:// 或自定义协议被滥用
    const allowed = /^https?:\/\/|^mailto:/i
    if (allowed.test(url)) {
      shell.openExternal(url)
    }
  })

  /* ── CLI 通用（原有，保留） ── */
  ipcMain.handle('cli:execute', async (_event, _command: string) => ({
    stdout: '',
    stderr: '',
    code: 0
  }))

  /* ── Skill 文件系统 ── */

  /** 确保 skills 目录存在 */
  function ensureSkillsDir(): void {
    if (!existsSync(SKILLS_DIR)) {
      mkdirSync(SKILLS_DIR, { recursive: true })
    }
  }

  /** 解析单个 .md 文件的 frontmatter，返回 name/description */
  function parseSkillFrontmatter(content: string): { name: string; description: string } {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
    if (!match) return { name: '', description: '' }
    const fm = match[1]
    const nameMatch = fm.match(/^name:\s*(.+)$/m)
    const descMatch = fm.match(/^description:\s*([\s\S]*?)(?=\n\w|\n---|$)/m)
    return {
      name: nameMatch ? nameMatch[1].trim() : '',
      description: descMatch ? descMatch[1].replace(/\n\s+/g, ' ').trim() : '',
    }
  }

  type SkillEntry = {
    id: string; name: string; description: string; readme: string
    tags: string[]; triggers: string[]; enabled: boolean
    filePath: string; createdAt: number; updatedAt: number; source: string
  }

  /** 列出 skills 目录下所有 .md 文件，返回解析后的 skill 数组 */
  ipcMain.handle('skill:list', () => {
    ensureSkillsDir()

    /** 从单个目录读取 skill，支持 flat .md 和子目录 SKILL.md 两种格式 */
    function readSkillsFromDir(dir: string, source: 'global' | 'project'): SkillEntry[] {
      if (!existsSync(dir)) return []
      const results: SkillEntry[] = []

      try {
        const entries = readdirSync(dir, { withFileTypes: true })

        for (const entry of entries) {
          // 形式一：flat .md 文件
          if (entry.isFile() && entry.name.endsWith('.md')) {
            const filePath = join(dir, entry.name)
            const content = readFileSync(filePath, 'utf-8')
            const stat = statSync(filePath)
            const { name, description } = parseSkillFrontmatter(content)
            const skillName = name || entry.name.replace(/\.md$/, '')
            results.push({
              id: `${source}-${skillName}`,
              name: skillName,
              description,
              readme: content,
              tags: [],
              triggers: [skillName],
              enabled: true,
              filePath,
              createdAt: stat.birthtimeMs,
              updatedAt: stat.mtimeMs,
              source,
            })
          }

          // 形式二：子目录内的 SKILL.md
          if (entry.isDirectory()) {
            const skillMd = join(dir, entry.name, 'SKILL.md')
            if (existsSync(skillMd)) {
              const content = readFileSync(skillMd, 'utf-8')
              const stat = statSync(skillMd)
              const { name, description } = parseSkillFrontmatter(content)
              const skillName = name || entry.name
              results.push({
                id: `${source}-${skillName}`,
                name: skillName,
                description,
                readme: content,
                tags: [],
                triggers: [skillName],
                enabled: true,
                filePath: skillMd,
                createdAt: stat.birthtimeMs,
                updatedAt: stat.mtimeMs,
                source,
              })
            }
          }
        }
      } catch {
        // 读取失败静默返回已收集的结果
      }

      return results
    }

    try {
      // 全局 skills + 项目 .codemaker/skills，按 id 去重（项目级优先）
      const globalSkills = readSkillsFromDir(SKILLS_DIR, 'global')
      const projectSkillsDir = join(workspaceRoot, '.codemaker', 'skills')
      const projectSkills = readSkillsFromDir(projectSkillsDir, 'project')

      const seen = new Set<string>()
      const merged = []

      // 项目级优先
      for (const s of projectSkills) {
        seen.add(s.name)
        merged.push(s)
      }
      for (const s of globalSkills) {
        if (!seen.has(s.name)) {
          seen.add(s.name)
          merged.push(s)
        }
      }

      return merged
    } catch {
      return []
    }
  })

  /** 写入 skill .md 文件 */
  ipcMain.handle('skill:write', (_event, name: string, content: string) => {
    ensureSkillsDir()
    const safeName = name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_')
    const filePath = join(SKILLS_DIR, `${safeName}.md`)
    writeFileSync(filePath, content, 'utf-8')
    return filePath
  })

  /** 删除 skill .md 文件 */
  ipcMain.handle('skill:delete', (_event, name: string) => {
    const safeName = name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_')
    const filePath = join(SKILLS_DIR, `${safeName}.md`)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
      return true
    }
    return false
  })

  /** 解析各种安装命令格式，提取出实际的 skill 标识（名称或 Git URL） */
  function parseInstallCommand(command: string): string | null {
    const cmd = command.trim()

    // 格式1：skill install <name>  /  codemaker skill install <name>
    const m1 = cmd.match(/^(?:codemaker\s+)?skill\s+install\s+([\w\-@/:.]+(?:\.git)?)$/i)
    if (m1) return m1[1]

    // 格式2：npx skills add <url|name>
    const m2 = cmd.match(/^npx\s+skills?\s+add\s+([\w\-@/:.]+(?:\.git)?)$/i)
    if (m2) return m2[1]

    // 格式3：纯 Git URL（https://...git）
    const m3 = cmd.match(/^(https?:\/\/[\w./-]+(?:\.git)?)$/)
    if (m3) return m3[1]

    // 格式4：纯 skill 名称（如 prd-generate）
    const m4 = cmd.match(/^([\w][\w\-]*)$/)
    if (m4) return m4[1]

    return null
  }

  /** 通过 Git URL 安装 skill：clone 到临时目录，找出 .md 文件复制到 skills 目录 */
  async function installFromGit(gitUrl: string): Promise<string> {
    const os = await import('os')
    const path = await import('path')
    const fs = await import('fs')
    const tmpDir = path.join(os.tmpdir(), `skill-install-${Date.now()}`)
    return new Promise((resolve, reject) => {
      execFile('git', ['clone', '--depth', '1', gitUrl, tmpDir], (err, _stdout, stderr) => {
        if (err) {
          reject(new Error(`git clone 失败：${stderr || err.message}`))
          return
        }
        try {
          // 找出 clone 目录下所有 .md 文件
          const allFiles = fs.readdirSync(tmpDir)
          const mdFiles = allFiles.filter((f: string) => f.endsWith('.md') && f !== 'README.md')
          if (mdFiles.length === 0) {
            reject(new Error('该仓库中未找到 skill .md 文件'))
            return
          }
          ensureSkillsDir()
          let installed = ''
          for (const mdFile of mdFiles) {
            const src = path.join(tmpDir, mdFile)
            const dest = path.join(SKILLS_DIR, mdFile)
            fs.copyFileSync(src, dest)
            installed = mdFile.replace(/\.md$/, '')
          }
          // 清理临时目录
          fs.rmSync(tmpDir, { recursive: true, force: true })
          resolve(installed)
        } catch (e) {
          reject(new Error(`安装失败：${(e as Error).message}`))
        }
      })
    })
  }

  /** 通过命令安装 skill，支持多种命令格式 */
  ipcMain.handle('skill:install-by-command', async (_event, command: string) => {
    const target = parseInstallCommand(command)
    if (!target) {
      throw new Error('无法识别的安装命令，支持格式：\n• skill install <名称>\n• npx skills add <URL>\n• 直接填写 skill 名称或 Git URL')
    }

    // 如果是 Git URL，走 git clone 安装
    if (/^https?:\/\//i.test(target)) {
      const skillName = await installFromGit(target)
      return { success: true, output: `已安装：${skillName}` }
    }

    // 否则尝试从 SkillHub API 拉取（通过 HTTP 下载 .md 文件）
    // SkillHub API 地址：根据 skill 名称拼接
    return new Promise((resolve, reject) => {
      const apiUrl = `https://skills.netease.com/api/skills/${encodeURIComponent(target)}/content`
      https.get(apiUrl, (res) => {
        if (res.statusCode !== 200) {
          // 找不到时回退：尝试直接把名称当 Git 仓库拉取
          const guessedUrl = `https://skills.netease.com/api/git/@${target}.git`
          installFromGit(guessedUrl)
            .then((name) => resolve({ success: true, output: `已安装：${name}` }))
            .catch(() => reject(new Error(`未找到名为 "${target}" 的 skill，请检查名称或直接粘贴 Git URL`)))
          return
        }
        let data = ''
        res.on('data', (chunk: Buffer) => { data += chunk.toString() })
        res.on('end', () => {
          try {
            ensureSkillsDir()
            const safeName = target.replace(/[^a-zA-Z0-9_\-]/g, '_')
            writeFileSync(join(SKILLS_DIR, `${safeName}.md`), data, 'utf-8')
            resolve({ success: true, output: `已安装：${safeName}` })
          } catch (e) {
            reject(new Error((e as Error).message))
          }
        })
      }).on('error', (e: Error) => {
        reject(new Error(`下载失败：${e.message}`))
      })
    })
  })

  /* ── CLI 检测与安装 ── */

  /** 检测 codemaker CLI 是否已安装（用绝对路径，不依赖 PATH） */
  ipcMain.handle('cli:checkInstalled', (): boolean => {
    const bin = getCodemakBin()
    // getCodemakBin() 在未找到时返回候选路径第一位，需额外验证文件存在
    const firstCandidate = isWindows
      ? resolve(process.env.USERPROFILE ?? homedir(), '.codemaker', 'bin', 'codemaker.exe')
      : resolve(homedir(), '.codemaker/bin/codemaker')
    return existsSync(firstCandidate) || (bin !== firstCandidate && bin !== 'codemaker' && existsSync(bin))
  })

  /** 执行安装脚本，实时推送日志到渲染层 */
  ipcMain.handle('cli:installCli', (event): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      let proc: ChildProcess

      if (isWindows) {
        proc = spawn('powershell.exe', [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-Command',
          'irm https://codemaker.netease.com/package/codemaker-cli/install.ps1 | iex'
        ], { env: { ...process.env } })
      } else {
        proc = spawn('bash', [
          '-c',
          'curl -fsSL https://codemaker.netease.com/package/codemaker-cli/install | bash'
        ], { env: { ...process.env } })
      }

      // 安装超时（300s）
      const timer = setTimeout(() => {
        proc.kill()
        reject(new Error('安装超时，请检查网络后重试'))
      }, 300_000)

      proc.stdout?.on('data', (d: Buffer) => {
        // 检查 sender 是否仍有效（macOS 关闭窗口后 webContents 可能已销毁）
        if (!event.sender.isDestroyed()) {
          event.sender.send('cli:installProgress', d.toString())
        }
      })
      proc.stderr?.on('data', (d: Buffer) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('cli:installProgress', d.toString())
        }
      })
      proc.on('close', (code) => {
        clearTimeout(timer)
        if (code === 0) {
          resolve(true)
        } else {
          reject(new Error(`安装脚本退出码：${code}`))
        }
      })
      proc.on('error', (err) => {
        clearTimeout(timer)
        reject(new Error(`启动安装脚本失败：${err.message}`))
      })
    })
  })

  /* ── PTY（内嵌终端）── */

  /** 创建 PTY 实例，启动 codemaker auth login，返回 ptyId */
  ipcMain.handle('pty:create', (_event, cols: number, rows: number): string => {
    if (!nodePty) throw new Error('node-pty 不可用')
    const bin = getCodemakBin()
    const ptyId = `pty-${randomUUID()}`

    // 校验 cols/rows 上界，防止极端值导致 node-pty 内部崩溃
    const safeCols = Math.max(1, Math.min(cols || 80, 500))
    const safeRows = Math.max(1, Math.min(rows || 24, 200))

    const shell = isWindows ? 'powershell.exe' : 'bash'
    const args  = isWindows
      ? ['-NoProfile', '-Command', `& '${bin}' auth login`]
      : ['-c', `"${bin}" auth login`]

    const ptyInstance = nodePty.spawn(shell, args, {
      name: 'xterm-color',
      cols: safeCols,
      rows: safeRows,
      cwd: homedir(),
      env: { ...process.env } as Record<string, string>
    })

    ptyInstance.onData((data) => {
      mainWindow?.webContents.send('pty:data', ptyId, data)
    })

    ptyInstance.onExit(({ exitCode }) => {
      mainWindow?.webContents.send('pty:exit', ptyId, exitCode)
      ptyMap.delete(ptyId)
    })

    ptyMap.set(ptyId, ptyInstance)
    return ptyId
  })

  /** 向 PTY 写入键盘输入 */
  ipcMain.handle('pty:write', (_event, ptyId: string, data: string): void => {
    ptyMap.get(ptyId)?.write(data)
  })

  /** 调整 PTY 尺寸 */
  ipcMain.handle('pty:resize', (_event, ptyId: string, cols: number, rows: number): void => {
    ptyMap.get(ptyId)?.resize(cols, rows)
  })

  /** 销毁 PTY 实例 */
  ipcMain.handle('pty:destroy', (_event, ptyId: string): void => {
    const inst = ptyMap.get(ptyId)
    if (inst) {
      try { inst.kill() } catch { /* ignore */ }
      ptyMap.delete(ptyId)
    }
  })
}

// ─── 生命周期 ──────────────────────────────────────────────

app.whenReady().then(async () => {
  // ─── CSP：仅在生产模式设置，开发模式下跳过（webSecurity: false 已足够） ───
  if (!isDev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* ws://localhost:* http://localhost:* https:",
              "media-src 'self'",
              "object-src 'none'",
              "frame-src 'self' blob: data:"
            ].join('; ')
          ]
        }
      })
    })
  }

  registerIPC()
  await startServeProcess()
  createWindow()

  app.on('activate', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show()
    } else if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  // 清理所有活跃的 PTY 进程，防止变成僵尸进程
  ptyMap.forEach((inst) => { try { inst.kill() } catch { /* ignore */ } })
  ptyMap.clear()
  if (serveProcess) {
    serveProcess.kill()
    serveProcess = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
