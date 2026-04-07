## Context

C2 已实现聊天核心链路（会话管理、消息收发、Markdown 渲染、消息操作）。C3 在此基础上增加 8 个增强功能，覆盖 PRD 中聊天页剩余的所有需求点。所有功能均为增量式开发，不需要重构 C2 的核心结构。

后端仍未就绪，所有新增功能继续使用 Mock。

## Goals / Non-Goals

**Goals:**

- 实现 PRD 聊天页的全部剩余功能
- 工具调用展示支持折叠/展开，参数和结果可查看
- 连接状态实时可见，异常时有明确提示
- URL 输入智能识别，提升输入体验
- 图片附件支持粘贴和拖拽
- AI 快捷选项提升交互效率
- Skill `/` 命令降低使用门槛

**Non-Goals:**

- 不实现真实的 `codemaker serve` 连接（Mock 状态）
- 不实现真实的 MCP 工具调用（Mock 数据）
- 不实现真实的网页抓取（URL 卡片仅展示域名）
- Provider 模式的完整配置 UI 属于 C7

## Decisions

### D1: ThinkingBlock 组件设计

**选择**：可折叠卡片组件，默认折叠，展示工具名称和状态图标；展开后显示调用参数（JSON）和返回结果（JSON/文本）

**理由**：
- 参考 Claude 的 Artifact / ChatGPT 的 Plugin 调用展示风格
- 默认折叠减少视觉干扰，用户按需查看详情
- 工具调用是 AI 回复流的一部分，插入在消息流中间
- Mock 数据：预定义 2-3 个工具调用样例（web_search、read_file、run_command）

### D2: 连接状态管理

**选择**：在 useChatStore 中添加 `connectionStatus` 字段，顶部状态栏组件订阅该字段

**理由**：
- 4 种状态：connecting / connected / reconnecting / disconnected
- Mock：默认 connected，提供手动切换状态的开发工具
- 顶部状态栏固定在对话区顶部，非 connected 时显示彩色提示条
- disconnected 时聊天功能降级：输入框禁用，显示"服务不可用"

### D3: URL 识别策略

**选择**：输入框 onChange 时正则匹配 URL，匹配到后在输入框下方渲染域名卡片标签

**理由**：
- 正则：`https?:\/\/[^\s]+` 匹配 HTTP/HTTPS URL
- 卡片显示提取的域名（`new URL(url).hostname`）
- 多个 URL 各自独立卡片
- 发送时 URL 仍以原始文本发送，卡片仅为视觉增强
- 后续如有 MCP 抓取能力，可在发送时拦截处理

### D4: 图片附件方案

**选择**：监听 paste 和 drop 事件，将图片转为 base64 Data URL 存储在消息中

**理由**：
- 无后端文件上传服务，base64 是最简单的本地存储方案
- paste 事件捕获剪贴板图片，drop 事件处理拖拽
- 上传前预览：在输入框上方显示缩略图列表，支持单个移除
- 消息中图片以 `<img>` 内嵌展示
- **限制**：单张图片不超过 5MB（base64 后约 6.67MB），超出提示

### D5: AI 快捷选项识别规则

**选择**：AI 回复完成后，解析最后一段内容，如果包含有序/无序列表，将列表项生成为可点击按钮

**理由**：
- 参考 ChatGPT 的 suggestion chips
- 匹配规则：回复末尾的 `- xxx` 或 `1. xxx` 列表项
- 点击按钮等同于用户输入该文本并发送
- 如果列表项超过 5 个，只取前 5 个

### D6: Skill `/` 命令菜单

**选择**：输入框首字符为 `/` 时弹出浮动菜单，展示所有已启用 Skill，选择后将 Skill 名注入

**理由**：
- 参考 Slack / Discord 的 slash command 交互模式
- 菜单紧贴输入框上方弹出，支持键盘上下选择 + Enter 确认
- 输入 `/` 后继续输入可过滤 Skill 列表
- 选择 Skill 后，输入框内容替换为 `/skillName `，用户继续输入消息内容

### D7: 草稿暂存策略

**选择**：在 useChatStore 中维护 `drafts: Record<sessionId, string>` Map，切换会话时自动存取

**理由**：
- 切换会话前：如果输入框有未发送内容，存入 `drafts[currentSessionId]`
- 切换会话后：从 `drafts[newSessionId]` 恢复内容到输入框
- drafts 持久化到 localStorage（随 useChatStore persist）
- 消息发送后清除对应 draft

## Risks / Trade-offs

- **[Risk] 图片 base64 导致 localStorage 膨胀** → 缓解：限制单张 5MB，单条消息最多 4 张图片
- **[Risk] AI 快捷选项误识别** → 缓解：仅匹配回复最后一个段落的列表，中间段落不匹配
- **[Trade-off] URL 卡片不做真实抓取** → Mock 阶段仅展示域名，真实抓取在 C8 集成阶段接入 MCP
- **[Trade-off] 连接状态为 Mock** → 开发阶段默认 connected，提供 devtools 手动切换测试各状态
