## Why

C2 实现了聊天的核心交互链路（会话管理、消息收发、流式渲染），但 PRD 中还有大量增强型功能未覆盖：工具调用过程展示、连接状态监控、Provider 模式切换、URL 识别、图片附件、AI 快捷选项、Skill `/` 命令和草稿暂存。这些功能对用户体验和产品完整性至关重要，需要在 C2 基础上增量实现。

## What Changes

- 实现工具调用 ThinkingBlock 展示（折叠/展开，显示工具名、参数、返回值）
- 实现连接状态栏（connecting / connected / reconnecting / disconnected）
- 实现 Provider 模式切换（Codemaker 模式 / 直连模式）的聊天层适配
- 实现 URL 识别与卡片展示（输入框中 URL 自动变为域名卡片）
- 实现图片附件（粘贴 Ctrl/Cmd+V 或拖拽上传，消息中内嵌展示）
- 实现 AI 快捷选项按钮（AI 回复末尾列表项生成可点击按钮）
- 实现 Skill `/` 命令快捷调用菜单
- 实现草稿暂存（切换会话时暂存未发送内容）

## Capabilities

### New Capabilities

- `tool-call-display`: 工具调用 ThinkingBlock 展示组件
- `connection-status`: 连接状态栏和状态管理
- `provider-adapter`: 聊天层的 Provider 模式适配（Codemaker / 直连）
- `url-recognition`: 输入框 URL 自动识别和卡片化展示
- `image-attachment`: 图片粘贴/拖拽上传和消息内嵌展示
- `quick-actions`: AI 回复末尾快捷选项按钮
- `skill-command`: `/` 命令触发 Skill 选择菜单
- `draft-storage`: 会话切换时草稿暂存和恢复

### Modified Capabilities

（无）

## Impact

- **依赖 C2**：在 C2 的聊天页基础上增量增加组件和功能
- **依赖 C1**：登录态
- **被 C7 依赖**：Provider 配置在 C7 设置页管理，C3 消费配置
- **修改文件**：C2 的 MessageBubble、MessageInput、MessageList 组件需增加插槽/扩展点
- **新增依赖包**：无额外新增（复用 C2 已有的 react-markdown 等）
