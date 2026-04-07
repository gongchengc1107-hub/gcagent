## Why

MCP（Model Context Protocol）是 AI 模型调用外部工具的标准协议。用户需要管理 AI 可调用的工具服务，包括查看内置 MCP 状态、添加自定义 MCP（本地进程型/远程 HTTP 型）、监控各 MCP 的实时连接状态。MCP 管理是 P1 高频配置需求，直接影响 AI 的工具调用能力。

## What Changes

- 实现 MCP 管理页 UI（MCP 列表，区分内置和自定义，实时状态展示）
- 实现智能安装（粘贴任意格式配置信息自动解析）
- 实现手动添加表单（本地 MCP / 远程 MCP 两种类型）
- 实现 MCP 模板库（6 个预设模板一键预填）
- 实现 MCP 状态轮询和实时展示
- 实现 MCP 启用/禁用、编辑、删除
- 实现配置持久化到 `~/.config/codemaker-dashboard/opencode/opencode.json`

## Capabilities

### New Capabilities

- `mcp-list`: MCP 列表页，展示内置和自定义 MCP，含实时状态
- `mcp-smart-install`: 智能安装，自动识别粘贴的配置格式
- `mcp-manual-add`: 手动添加表单，支持本地/远程两种 MCP 类型
- `mcp-templates`: MCP 模板库，6 个预设模板一键预填
- `mcp-status-polling`: MCP 状态轮询与实时展示
- `mcp-config-persistence`: 配置持久化到 JSON 文件

### Modified Capabilities

（无）

## Impact

- **依赖 C0**：全局布局、Zustand store（useMCPStore）、主题系统
- **依赖 C1**：登录态
- **被 C3 消费**：工具调用展示（ThinkingBlock）展示的工具来自 MCP
- **被 C7 关联**：设置页显示 MCP 概要状态
- **配置文件**：写入 `~/.config/codemaker-dashboard/opencode/opencode.json`，供 `codemaker serve` 读取
