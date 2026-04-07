## Why

Agent 是 Codemaker Dashboard 中 AI 助手的核心抽象，不同 Agent 有不同的角色定位和能力配置。用户需要管理自定义 Agent（创建、编辑、删除），并能在聊天中选择使用不同 Agent。系统内置 3 个 Agent（Sisyphus / Explorer / Builder）不可删除，同时支持从磁盘 `opencode/agents/` 目录单向同步 Agent 配置。

## What Changes

- 实现 Agents 管理页 UI（Agent 列表，区分内置和自定义）
- 实现 Agent 创建表单（名称、emoji 图标、描述、关联 Skills、autoMode 开关）
- 实现 Agent 编辑和删除
- 实现自定义 Agent 上限 10 个校验
- 实现磁盘文件单向同步（`opencode/agents/*.md` → 界面）
- 实现 Agent 前端显示名和后端 API 名称映射

## Capabilities

### New Capabilities

- `agent-list`: Agent 列表页，展示内置和自定义 Agent，含搜索和空状态
- `agent-crud`: Agent 创建/编辑/删除表单和逻辑
- `agent-disk-sync`: 磁盘 Agent 文件单向同步到界面

### Modified Capabilities

（无）

## Impact

- **依赖 C0**：全局布局、Zustand store（useAgentStore）、主题系统
- **依赖 C1**：登录态、种子数据中的 3 个内置 Agent
- **被 C2 消费**：聊天页 Agent 选择下拉读取 useAgentStore
- **被 C5 关联**：Agent 创建时可关联 Skills（读取 useSkillStore）
- **修改文件**：填充 useAgentStore 完整实现
