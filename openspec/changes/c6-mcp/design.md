## Context

useMCPStore 已在 C0 中创建骨架。MCP 配置需要持久化到特定的 JSON 文件路径（`~/.config/codemaker-dashboard/opencode/opencode.json`），供 `codemaker serve` 读取。PRD 定义了 3 个内置 MCP（Web Search / Context7 / Grep App）为只读。

后端未就绪，MCP 状态轮询使用 Mock，默认所有 MCP 为 connected。

## Goals / Non-Goals

**Goals:**

- 实现完整的 MCP 管理页（列表 + 添加 + 编辑 + 删除）
- 智能安装支持多种格式自动识别
- 内置 MCP 只读展示
- 状态轮询实时展示连接状态
- 配置持久化到指定 JSON 文件

**Non-Goals:**

- 不实现真实的 MCP 连接和状态检测（Mock）
- 不实现 MCP 工具的实际调用（由 `codemaker serve` 处理）
- 不实现 MCP 认证流程（needs_auth 状态仅做 UI 展示）

## Decisions

### D1: MCP 列表页布局

**选择**：卡片列表布局（单列），每个 MCP 一行卡片，左侧图标+名称+类型，右侧状态徽章+操作按钮

**理由**：
- MCP 信息较多（名称、类型、状态、配置），单列卡片比表格可展示更多细节
- 内置 MCP 在上方区域，自定义 MCP 在下方
- 状态徽章用不同颜色区分 5 种状态
- 参考 VS Code 的 Extensions 列表风格

### D2: MCP 数据结构

**选择**：

```typescript
interface MCPConfig {
  id: string;
  name: string;
  type: 'local' | 'remote';
  enabled: boolean;
  isBuiltin: boolean;
  status: 'connected' | 'disconnected' | 'connecting' | 'needs_auth' | 'failed';
  // 本地 MCP
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // 远程 MCP
  url?: string;
  headers?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}
```

**理由**：
- `type` 区分本地和远程，不同类型有不同配置字段
- `status` 5 种状态覆盖 PRD 要求
- `isBuiltin` 控制只读权限
- `env` 支持环境变量（含 Token 等敏感信息）

### D3: 智能安装实现

**选择**：单个大文本输入框，用户粘贴任意内容，前端尝试多种解析策略自动识别

**理由**：
- 解析策略优先级：
  1. 尝试 JSON.parse → 识别标准 JSON 配置（`{"command": "...", "args": [...]}`)
  2. 尝试匹配 HTTP(S) URL → 识别为远程 MCP
  3. 尝试匹配 Bearer Token 格式 → 识别为远程 MCP 的 headers
  4. 以上都不匹配 → 提示"无法识别格式，请使用手动添加"
- 识别成功后展示预览（解析结果），用户确认后写入
- 降低用户添加 MCP 的门槛

### D4: MCP 模板库

**选择**：6 个预设模板作为静态常量，在添加弹窗中以可选卡片展示

**理由**：
- 模板列表：Filesystem / GitHub / PostgreSQL / Brave Search / Puppeteer / Slack
- 每个模板包含：名称、描述、图标、预填配置（command / args / env 占位符）
- 选择模板后自动预填手动添加表单，用户只需填写个性化部分（如 Token、路径）
- 模板卡片网格展示（3x2），点击选中后跳转到手动添加 Tab

### D5: 状态轮询方案

**选择**：`setInterval` 每 30 秒轮询一次所有 MCP 状态

**理由**：
- Mock 阶段：直接返回预设状态，不做真实连接检测
- 真实阶段（C8 集成）：通过 Electron IPC 调用主进程 HTTP 请求检测各 MCP 可达性
- 轮询仅在 MCP 管理页可见时激活（页面离开时停止）
- 不影响聊天交互性能（PRD 非功能性要求）

### D6: 配置持久化文件格式

**选择**：JSON 格式，存储在 `~/.config/codemaker-dashboard/opencode/opencode.json`

**理由**：
- 文件结构：
  ```json
  {
    "mcpServers": {
      "mcp-name": {
        "type": "local",
        "command": "...",
        "args": ["..."],
        "env": { "KEY": "VALUE" }
      }
    }
  }
  ```
- 与 `codemaker serve` 的读取格式兼容
- 通过 Electron IPC 调用主进程 fs 读写
- 每次 MCP 增删改都同步写入

## Risks / Trade-offs

- **[Risk] 智能安装误识别** → 缓解：识别后展示预览，用户确认后才写入；无法识别时引导手动添加
- **[Risk] MCP 配置变更后需重启 codemaker serve** → 缓解：保存后弹出提示"配置已更新，需重启 codemaker serve 生效"
- **[Risk] 环境变量含敏感信息** → 缓解：env 值在 UI 中默认 mask 显示（****），点击查看/复制
- **[Trade-off] 轮询而非 WebSocket** → 简化实现，30s 间隔可接受；后续可升级为 WebSocket
