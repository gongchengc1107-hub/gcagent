import { contextBridge, ipcRenderer } from 'electron'

/** 白名单：允许渲染进程调用的 IPC 通道 */
const SEND_CHANNELS = [
  'app:quit',
  'app:minimize',
  'app:maximize',
  'app:toggle-devtools'
] as const

const ON_CHANNELS = [
  'app:theme-changed',
  'app:update-available',
  'shortcut:search',
  /* CLI 安装进度推流 */
  'cli:installProgress',
  /* PTY 数据推流 */
  'pty:data',
  'pty:exit',
] as const

const INVOKE_CHANNELS = [
  'app:get-version',
  'app:get-path',
  /* 认证 */
  'auth:getLocalAuth',
  /* Serve */
  'serve:getPort',
  /* 模型 */
  'models:list',
  /* 统计 */
  'stats:quota',
  'stats:tokenUsage',
  /* 文件 */
  'fs:read-file',
  'fs:write-file',
  'fs:delete-file',
  'fs:list-dir',
  /* MCP */
  'mcp:read-config',
  'mcp:write-config',
  'mcp:check-status',
  /* Shell */
  'shell:open-external',
  /* CLI */
  'cli:execute',
  'cli:checkInstalled',
  'cli:installCli',
  /* PTY */
  'pty:create',
  'pty:write',
  'pty:resize',
  'pty:destroy',
  /* Skill */
  'skill:list',
  'skill:write',
  'skill:delete',
  'skill:install-by-command',
  /* Agent */
  'agent:list-disk',
  'agent:list-cli',
  'agent:write',
  'agent:delete',
] as const

/** 暴露给渲染进程的安全 API */
const electronAPI = {
  /** 发送 IPC 消息到主进程 */
  send: (channel: string, ...args: unknown[]): void => {
    if ((SEND_CHANNELS as readonly string[]).includes(channel)) {
      ipcRenderer.send(channel, ...args)
    }
  },

  /** 监听主进程 IPC 消息 */
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    if ((ON_CHANNELS as readonly string[]).includes(channel)) {
      const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => {
        callback(...args)
      }
      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    }
    return () => {}
  },

  /** 调用主进程方法并等待返回 */
  invoke: async (channel: string, ...args: unknown[]): Promise<unknown> => {
    if ((INVOKE_CHANNELS as readonly string[]).includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    return undefined
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
