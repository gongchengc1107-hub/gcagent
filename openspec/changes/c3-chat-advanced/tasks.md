## 1. 工具调用展示

- [ ] 1.1 设计 ToolCall 数据结构（toolName, status, params, result, duration），扩展 Message 类型
- [ ] 1.2 创建 ThinkingBlock 可折叠卡片组件（默认折叠，展示工具名+状态图标）
- [ ] 1.3 实现展开后的详情面板（JSON 格式化展示 params 和 result）
- [ ] 1.4 在 MessageBubble 中集成 ThinkingBlock（工具调用穿插在消息内容中）
- [ ] 1.5 准备 Mock 工具调用数据（web_search / read_file / run_command 各一个样例）

## 2. 连接状态

- [ ] 2.1 在 useChatStore 中添加 connectionStatus 字段和状态转换方法
- [ ] 2.2 创建 ConnectionStatusBar 顶部状态栏组件（4 种状态对应不同颜色和文案）
- [ ] 2.3 实现 disconnected 状态下输入框禁用逻辑
- [ ] 2.4 Mock 默认 connected 状态，提供开发工具面板手动切换

## 3. Provider 适配器

- [ ] 3.1 定义 ChatProvider 抽象接口（sendMessage, stopGeneration, getModels）
- [ ] 3.2 实现 CodemakerProvider（Mock：REST + SSE 接口模拟）
- [ ] 3.3 实现 DirectProvider（Mock：OpenAI 兼容接口模拟）
- [ ] 3.4 实现 Provider 工厂函数，根据 useSettingsStore.provider 自动选择
- [ ] 3.5 改造 C2 的消息发送逻辑，通过 Provider 适配器发送

## 4. URL 识别

- [ ] 4.1 实现 URL 正则匹配工具函数（`https?:\/\/[^\s]+`）
- [ ] 4.2 创建 UrlTag 域名卡片组件（显示域名 + 关闭按钮）
- [ ] 4.3 在 MessageInput 中集成 URL 识别，输入框下方渲染卡片列表
- [ ] 4.4 实现卡片移除功能

## 5. 图片附件

- [ ] 5.1 实现 paste 事件监听（捕获剪贴板图片，转 base64）
- [ ] 5.2 实现 drag & drop 事件监听（拖拽区域高亮 + 释放处理）
- [ ] 5.3 实现图片大小校验（>5MB 拒绝并提示）
- [ ] 5.4 创建 ImagePreview 缩略图组件（80x80 缩略图 + 关闭按钮，支持多张并排）
- [ ] 5.5 在 MessageInput 上方集成附件预览区域
- [ ] 5.6 扩展 Message 类型添加 images 字段
- [ ] 5.7 在 MessageBubble 中实现图片内嵌展示（max-width 300px + 点击查看大图）

## 6. AI 快捷选项

- [ ] 6.1 实现 AI 回复末尾列表项解析逻辑（正则匹配 `- xxx` 和 `1. xxx`）
- [ ] 6.2 创建 QuickActionButtons 组件（按钮列表，最多 5 个）
- [ ] 6.3 实现点击按钮等同于用户发送该文本
- [ ] 6.4 实现仅在最新 AI 回复下方显示（新回复后旧按钮消失）

## 7. Skill `/` 命令

- [ ] 7.1 实现输入框 `/` 字符检测逻辑
- [ ] 7.2 创建 SkillCommandMenu 浮动菜单组件（Skill 列表 + 过滤搜索）
- [ ] 7.3 实现键盘导航（上下箭头选择 + Enter 确认 + Esc 关闭）
- [ ] 7.4 实现选择 Skill 后替换输入框内容为 `/skillName `
- [ ] 7.5 从 useSkillStore 获取已启用 Skill 列表（C2 阶段使用 Mock 数据）

## 8. 草稿暂存

- [ ] 8.1 在 useChatStore 中添加 drafts Map（Record<sessionId, string>）
- [ ] 8.2 实现会话切换时自动保存当前输入框内容到 drafts
- [ ] 8.3 实现切换到目标会话时从 drafts 恢复内容
- [ ] 8.4 实现消息发送后清除对应 draft
- [ ] 8.5 确保 drafts 随 useChatStore persist 持久化

## 9. 验证

- [ ] 9.1 验证 ThinkingBlock 折叠/展开正常，Mock 工具调用数据正确展示
- [ ] 9.2 验证连接状态栏 4 种状态显示正确，disconnected 时输入框禁用
- [ ] 9.3 验证 URL 识别和卡片展示正常
- [ ] 9.4 验证图片粘贴/拖拽上传 + 预览 + 移除 + 消息内嵌展示
- [ ] 9.5 验证 AI 快捷选项按钮识别和点击发送
- [ ] 9.6 验证 `/` 命令菜单弹出、过滤、键盘导航、选择
- [ ] 9.7 验证草稿暂存（切换会话保存/恢复、发送后清除、重启后恢复）
- [ ] 9.8 验证深色/浅色主题下所有新增组件视觉正确
