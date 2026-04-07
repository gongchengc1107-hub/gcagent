## Why

聊天是 Codemaker Dashboard 的核心功能（P0），是用户与 AI 交互的主要界面。用户需要管理多个会话、发送消息并实时看到 AI 的流式回复（SSE）。没有聊天功能，整个产品没有使用价值。C2 聚焦于聊天的核心交互链路，高级功能（工具调用展示、URL 识别、图片附件等）留给 C3。

## What Changes

- 实现会话管理侧边栏（会话列表、时间分组、新建/切换/重命名/删除/置顶/导出/搜索）
- 实现对话输入区（多行文本输入、Enter 发送、Shift+Enter 换行、Agent/模型选择、Token 用量提示）
- 实现消息展示区（流式 SSE 渲染、Markdown 渲染、代码块高亮+复制、消息时间戳）
- 实现消息操作（复制、重新发送、编辑并重发、重新生成、停止生成）
- 实现 ⌘K 会话搜索
- 实现右键菜单（会话列表项的上下文菜单）
- 实现空状态欢迎引导界面

## Capabilities

### New Capabilities

- `session-management`: 会话列表侧边栏，含时间分组、CRUD、置顶、导出、搜索、右键菜单
- `message-input`: 对话输入区，含文本输入、Agent/模型选择、Token 用量提示、发送限制
- `message-display`: 消息展示区，含流式 SSE 渲染、Markdown、代码高亮、时间戳
- `message-actions`: 消息操作，含复制、重发、编辑重发、重新生成、停止生成

### Modified Capabilities

（无）

## Impact

- **依赖 C0**：全局布局（聊天页嵌入布局右侧内容区）、Zustand store（useChatStore）、主题系统
- **依赖 C1**：登录态（需要登录后才能使用聊天）、种子数据（示例会话）
- **被 C3 依赖**：C3 在 C2 基础上增加工具调用展示、URL 识别、图片附件等高级功能
- **被 C7 依赖**：设置页的 Provider 模式影响聊天的 AI 接入方式
- **新增依赖包**：react-markdown, rehype-highlight, remark-gfm, highlight.js
