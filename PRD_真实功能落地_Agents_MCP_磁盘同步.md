# Agents / MCP / 磁盘同步 真实功能落地 PRD

## 文档信息

| 项目     | 内容                                        |
| -------- | ------------------------------------------- |
| 版本     | v1.0                                        |
| 创建日期 | 2026-04-03                                  |
| 状态     | 草稿（待审核）                              |
| 背景项目 | gcagent — Electron + React 桌面客户端       |

---

## 1. 背景与目标

### 1.1 背景

当前 `Agents`、`MCP 工具管理`、`磁盘同步` 三个模块均为 UI 演示（Mock）状态：

| 模块               | Mock 现状                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| Agents 磁盘同步    | `diskSync.ts` 硬编码假数据，`setTimeout(300ms)` 模拟延迟，无真实文件读取 |
| MCP 配置持久化     | `mcpConfigSync.ts` 只打 `console.log`，配置重启后全部丢失                 |
| MCP 状态检测       | `useMCPStatusPolling.ts` 用随机延迟模拟，永远返回 `connected`             |
| IPC `fs:*` / `mcp:*` 通道 | `electron/main.ts` 中已注册但返回空值（`''` / `[]` / `{}`）      |

用户需要这三个模块具备**真实能力**，而不是 UI 演示。

### 1.2 目标

- **业务目标**：Agents 和 MCP 的增删改配置能跨会话持久化，重启后不丢失
- **用户目标**：用户配置的 MCP 服务和自定义 Agent 能真正落地到 codemaker 的配置体系
- **成功指标**：
  - 添加/删除 MCP 后，关闭再重开应用，配置依然存在
  - 添加自定义 Agent 后，`.agents/` 目录下生成对应 `.md` 文件
  - MCP 状态图标能真实反映服务的连通性（而非永远绿色）

---

## 2. 技术现状分析

### 2.1 已有基础（可复用）

**Electron 主进程已有的基础设施（`electron/main.ts`）：**

```
✅ readLocalAuth()          — 读取 ~/.local/share/codemaker/auth.json
✅ runCLI(args)             — 执行 codemaker CLI 子命令
✅ fs.readFileSync / writeFileSync / existsSync / mkdirSync / readdirSync — 已导入
✅ net 模块                 — 已导入，可用于 TCP 端口探测
✅ ipcMain.handle 框架      — registerIPC() 函数已组织好

已注册但返回空的 IPC 通道（需真实实现）：
⚠️ mcp:read-config         — 目前返回 '[]'（字符串）
⚠️ mcp:write-config        — 目前空操作
⚠️ fs:read-file            — 目前返回 ''
⚠️ fs:write-file           — 目前空操作
⚠️ fs:list-dir             — 目前返回 []
```

**Preload 已暴露（`electron/preload.ts`）：**
- `mcp:read-config`、`mcp:write-config`、`fs:read-file`、`fs:write-file`、`fs:list-dir` 均已在白名单中

### 2.2 缺失的 IPC 通道

需要**新增**到 preload 白名单和 main 注册：

| 通道名              | 用途                       |
| ------------------- | -------------------------- |
| `agent:list-disk`   | 列出 `.agents/*.md` 文件   |
| `agent:write`       | 写入 Agent `.md` 配置文件  |
| `agent:delete`      | 删除 Agent `.md` 配置文件  |
| `mcp:check-status`  | 真实探测单个 MCP 连通性    |

### 2.3 MCP 配置文件位置

codemaker 的 MCP 配置文件路径约定（参考 CLI 惯例）：

```
~/.config/codemaker/mcp.json
```

格式参考（与现有 `MCPConfig` 类型对齐）：

```json
{
  "mcpServers": {
    "web-search": {
      "type": "remote",
      "url": "https://search.codemaker.netease.com/mcp",
      "enabled": true
    },
    "my-local-mcp": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@myorg/mcp-server"],
      "env": {},
      "enabled": true
    }
  }
}
```

### 2.4 Agent 磁盘文件格式

约定读取当前工作区 `.agents/*.md`，格式为：

```markdown
---
name: Code Reviewer
backendName: code-reviewer
emoji: 📝
description: 自动审查 PR 并给出建议
autoMode: false
skillIds: []
---

（可选：Agent 说明 Markdown 正文）
```

---

## 3. 功能需求

### 3.1 功能列表

| 功能点                   | 优先级 | 模块   | 说明                                             |
| ------------------------ | ------ | ------ | ------------------------------------------------ |
| MCP 配置真实读写         | P0     | MCP    | 启动时读取、增删改后写入 `~/.config/codemaker/mcp.json` |
| MCP 状态真实检测         | P1     | MCP    | HTTP ping 远程 / TCP 探测本地，替换 Mock 随机值   |
| Agent 磁盘同步（读取）   | P1     | Agents | 从工作区 `.agents/*.md` 读取并展示                |
| Agent 磁盘写入           | P2     | Agents | 创建/编辑自定义 Agent 时同步写入 `.agents/` 文件  |
| fs:* IPC 真实实现        | P0     | 基础   | `fs:read-file`/`fs:write-file`/`fs:list-dir` 落地 |

---

### 3.2 详细需求

---

#### 3.2.1 P0 — `fs:*` IPC 真实实现（`electron/main.ts`）

**现状**：三个通道均为空实现，导致所有上层功能无法落地。

**需求**：

| IPC 通道       | 参数                              | 返回值            | 行为                                       |
| -------------- | --------------------------------- | ----------------- | ------------------------------------------ |
| `fs:read-file` | `(path: string)`                  | `string`          | 读取文件内容，文件不存在返回空字符串       |
| `fs:write-file`| `(path: string, content: string)` | `void`            | 写入文件内容，自动创建父目录               |
| `fs:list-dir`  | `(dir: string)`                   | `string[]`        | 列出目录下所有文件名（含扩展名），不含子目录 |

**安全约束**：
- `path` 不得包含 `..` 路径穿越
- 仅允许操作以下路径前缀：
  - `~/.config/codemaker/`（codemaker 配置目录）
  - 当前工作区目录（启动时通过 `process.cwd()` 确定，存为变量）

---

#### 3.2.2 P0 — MCP 配置真实持久化

**配置文件路径**：`~/.config/codemaker/mcp.json`

**`mcp:read-config` 实现**：

1. 检查文件是否存在，不存在返回 `[]`
2. 读取并解析 JSON，将 `mcpServers` 对象转换为 `MCPConfig[]` 数组
3. 内置 MCP（`isBuiltin: true`）不从文件读取，仍由前端 store 硬编码提供
4. 解析失败（JSON 损坏）返回 `[]`，不抛异常

**`mcp:write-config` 实现**：

1. 接收参数 `(mcps: MCPConfig[])` — 仅包含自定义 MCP（`isBuiltin: false`）
2. 将数组转换为 `mcpServers` 对象格式
3. 写入到配置文件（覆盖写）
4. 确保父目录存在（`~/.config/codemaker/` 可能不存在）

**前端对接**（`src/utils/mcpConfigSync.ts`）：

```
readMCPConfig() 改为调用 window.electronAPI.invoke('mcp:read-config')
writeMCPConfig() 改为调用 window.electronAPI.invoke('mcp:write-config', mcps)
需检测 window.electronAPI 是否存在（Web 开发模式下降级为 console.log）
```

**触发写入的时机**：
- 用户点击「添加」确认
- 用户点击「删除」确认
- 用户点击「编辑」保存
- 用户切换「启用/禁用」开关

---

#### 3.2.3 P1 — MCP 状态真实检测（新增 IPC `mcp:check-status`）

**现状**：`mockCheckStatus()` 永远返回 `connected`（基于 enabled 字段）。

**需求**：

| MCP 类型 | 检测方式                                                             | 超时   |
| -------- | -------------------------------------------------------------------- | ------ |
| 远程（`type: 'remote'`） | 发起 HTTP GET 请求到 `url`，状态码 `< 500` 视为连通  | 5000ms |
| 本地（`type: 'local'`）  | 尝试 TCP connect 到 `localhost:port`（需从进程表获取或配置）         | 3000ms |

**简化方案（P1 阶段）**：
- 远程 MCP：HTTP GET `url` + 超时 5s，成功返回 `connected`，失败返回 `failed`
- 本地 MCP：`disabled` 状态直接返回 `disconnected`；`enabled` 状态走 HTTP 检测（如 MCP 服务提供 health 端点）或返回 `connected`（保守策略，待后续完善）

**新增 IPC**：

```ts
// main.ts
ipcMain.handle('mcp:check-status', async (_event, mcp: MCPConfig): Promise<MCPStatus> => {
  if (!mcp.enabled) return 'disconnected'
  if (mcp.type === 'remote' && mcp.url) {
    // HTTP GET with 5s timeout
  }
  return 'connected' // 本地 MCP 暂保守返回
})
```

**preload 白名单新增**：`'mcp:check-status'`

**前端对接**（`useMCPStatusPolling.ts`）：
- 将 `mockCheckStatus()` 替换为 `window.electronAPI.invoke('mcp:check-status', mcp)`
- 降级：Web 模式（无 electronAPI）保持原 Mock 行为

---

#### 3.2.4 P1 — Agent 磁盘同步（读取）

**新增 IPC**：`agent:list-disk`

| 参数           | 说明                                                     |
| -------------- | -------------------------------------------------------- |
| `(dir: string)` | 目标目录，约定为工作区 `.agents/`，传入绝对路径         |

**行为**：
1. 检查目录是否存在，不存在返回 `[]`
2. 列出所有 `.md` 文件
3. 逐个解析 YAML frontmatter（复用 skill 的 `parseSkillFrontmatter` 逻辑扩展）
4. 返回 `Agent[]` 数组（`isFromDisk: true`，`isBuiltin: false`）

**frontmatter 字段映射**：

| frontmatter 字段 | Agent 类型字段   | 缺省值   |
| ---------------- | ---------------- | -------- |
| `name`           | `name`           | 文件名   |
| `backendName`    | `backendName`    | 文件名   |
| `emoji`          | `emoji`          | `🤖`     |
| `description`    | `description`    | `''`     |
| `autoMode`       | `autoMode`       | `false`  |
| `skillIds`       | `skillIds`       | `[]`     |

**工作区目录确定方式**：
- 主进程启动时记录 `process.cwd()` 为 `workspaceRoot`
- IPC handler 使用 `path.join(workspaceRoot, '.agents')` 作为默认目录
- 前端调用时无需传参（使用主进程记录的工作区）

**前端对接**（`src/utils/diskSync.ts`）：
- `syncDiskAgents()` 改为调用 `window.electronAPI.invoke('agent:list-disk')`
- 降级：Web 模式返回 `[]`

---

#### 3.2.5 P2 — Agent 磁盘写入

**新增 IPC**：`agent:write` / `agent:delete`

**`agent:write`** — 参数：`(agent: Agent)`
1. 生成 frontmatter YAML 内容
2. 文件名：`{agent.backendName}.md`（kebab-case，非法字符替换为 `-`）
3. 写入到 `{workspaceRoot}/.agents/{backendName}.md`
4. 目录不存在时自动创建

**`agent:delete`** — 参数：`(backendName: string)`
1. 删除 `{workspaceRoot}/.agents/{backendName}.md`
2. 文件不存在时静默成功

**触发时机**：
- 用户在 Agents 页面点击「创建 Agent」保存时 → 调用 `agent:write`
- 用户删除自定义 Agent 且 `isFromDisk` 为 `true` 时 → 调用 `agent:delete`

---

## 4. 非功能需求

### 4.1 安全性

- 所有文件路径在 IPC handler 中**白名单校验**，禁止 `..` 路径穿越
- 允许路径前缀：`homedir()/.config/codemaker/` 和 `workspaceRoot/`
- JSON 解析全部包裹 `try/catch`，不允许未捕获的异常崩溃主进程

### 4.2 降级策略（Web 开发模式）

渲染进程调用前检测 `window.electronAPI`：

```ts
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

// 示例
export async function readMCPConfig(): Promise<MCPConfig[]> {
  if (!isElectron) {
    console.log('[Dev Mode] readMCPConfig: 返回空数组')
    return []
  }
  return window.electronAPI.invoke('mcp:read-config') as Promise<MCPConfig[]>
}
```

### 4.3 错误处理

| 场景                   | 处理方式                                           |
| ---------------------- | -------------------------------------------------- |
| 配置文件 JSON 损坏     | 返回 `[]`，不抛异常，主进程输出 warn 日志           |
| 文件写入权限不足       | IPC 返回 `{ error: '...' }`，前端 `message.error` 提示 |
| MCP 状态检测网络超时   | 返回 `'failed'`                                    |
| `.agents/` 目录不存在  | 返回 `[]`，不报错                                  |

### 4.4 性能

- MCP 状态检测：并发执行所有 MCP 探测，单个超时不影响其他
- `agent:list-disk` 同步读取文件（文件数量通常 < 20，无需异步流）

---

## 5. 实现范围与边界

### 5.1 本期范围（In Scope）

- [ ] `fs:read-file` / `fs:write-file` / `fs:list-dir` 真实实现
- [ ] `mcp:read-config` / `mcp:write-config` 真实实现
- [ ] `mcp:check-status` 新增（远程 HTTP 探测）
- [ ] `agent:list-disk` 新增（读取 `.agents/*.md`）
- [ ] 前端 `mcpConfigSync.ts` 对接真实 IPC
- [ ] 前端 `diskSync.ts` 对接真实 IPC
- [ ] 前端 `useMCPStatusPolling.ts` 对接真实 IPC
- [ ] 前端 `AgentsPage` 写入时调用 `agent:write`（P2）

### 5.2 本期不含（Out of Scope）

- 本地 MCP 进程的真实启动/停止管理（进程管理系统，独立需求）
- Agent 与后端 LLM 调用时 `backendName` 的真实路由（Chat 模块单独处理）
- MCP 鉴权流程（`needs_auth` 状态的 OAuth 跳转）

---

## 6. 文件改动清单

### Electron 主进程

| 文件                   | 改动类型 | 说明                                          |
| ---------------------- | -------- | --------------------------------------------- |
| `electron/main.ts`     | 修改     | 实现 `fs:*`、`mcp:*`，新增 `agent:*`、`mcp:check-status` |
| `electron/preload.ts`  | 修改     | INVOKE_CHANNELS 白名单新增 `mcp:check-status`、`agent:list-disk`、`agent:write`、`agent:delete` |

### 渲染进程（前端）

| 文件                                            | 改动类型 | 说明                            |
| ----------------------------------------------- | -------- | ------------------------------- |
| `src/utils/mcpConfigSync.ts`                    | 重写     | 调用真实 IPC，降级兼容          |
| `src/utils/diskSync.ts`                         | 重写     | 调用真实 IPC，降级兼容          |
| `src/pages/MCPTools/hooks/useMCPStatusPolling.ts` | 修改   | 替换 `mockCheckStatus` 为真实 IPC |
| `src/pages/Agents/index.tsx`                    | 修改     | 创建/删除 Agent 时调用 `agent:write`/`agent:delete`（P2）|

---

## 7. 验收标准

### 7.1 功能验收

- [ ] 添加自定义 MCP → 关闭应用 → 重新打开 → 自定义 MCP 依然存在
- [ ] 删除自定义 MCP → 关闭应用 → 重新打开 → 已删除的 MCP 不再出现
- [ ] 检查 `~/.config/codemaker/mcp.json` 文件内容与 UI 展示一致
- [ ] `.agents/` 目录存在且有 `.md` 文件时，Agents 页面「来自磁盘」区域正确展示
- [ ] MCP「刷新状态」按钮：远程 MCP 地址无法访问时，状态变为红色 `failed`（而非永远绿色）
- [ ] 创建自定义 Agent 后，工作区 `.agents/{backendName}.md` 文件被创建（P2）

### 7.2 降级验收

- [ ] 在 Web 开发模式（`npm run dev` 非 Electron）下，三个模块不报错、正常渲染

### 7.3 安全验收

- [ ] IPC 路径传入 `../../etc/passwd` 等穿越路径时，被拦截返回错误

---

## 8. 风险与注意事项

| 风险                                | 影响     | 应对                                          |
| ----------------------------------- | -------- | --------------------------------------------- |
| `mcp.json` 与 `codemaker serve` 配置格式不一致 | 高 | 需确认 CLI 实际读取的 MCP 配置文件格式，必要时对齐 |
| 远程 MCP URL 存在跨域/鉴权问题     | 中       | 状态检测从主进程发起（绕过浏览器 CORS）        |
| `.agents/` 路径在不同工作区不同     | 中       | 主进程记录 `process.cwd()`，确保与 CLI 一致   |
| 并发写入 `mcp.json` 导致文件损坏   | 低       | 写操作串行化（queue 或简单 mutex）             |

---

> **下一步**：请审核此 PRD，确认范围和方案后开始实现。

