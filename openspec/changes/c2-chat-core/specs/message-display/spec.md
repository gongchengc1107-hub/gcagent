## ADDED Requirements

### Requirement: 流式 SSE 渲染
AI 回复 SHALL 支持流式渲染，逐字显示内容。C2 阶段使用 Mock 模拟流式输出。

#### Scenario: 流式输出展示
- **WHEN** 用户发送消息后
- **THEN** AI 回复区域逐字显示内容（Mock：每 30ms 追加一个字符），直到完整内容输出完毕

#### Scenario: 流式输出中的滚动
- **WHEN** AI 正在流式输出且消息超出可视区域
- **THEN** 对话区自动滚动到底部，保持最新内容可见

### Requirement: Markdown 渲染
AI 回复 SHALL 完整支持 Markdown 格式，包括标题、列表、代码块、表格、加粗、斜体、链接等。

#### Scenario: 标题渲染
- **WHEN** AI 回复包含 `## 标题`
- **THEN** 渲染为对应级别的 HTML 标题元素

#### Scenario: 代码块渲染
- **WHEN** AI 回复包含 ` ```python\nprint("hello")\n``` `
- **THEN** 渲染为带语法高亮的代码块，显示语言标签（python）

#### Scenario: 表格渲染
- **WHEN** AI 回复包含 GFM 表格语法
- **THEN** 渲染为格式化的 HTML 表格

### Requirement: 代码块操作
代码块 SHALL 提供一键复制按钮和语言标签。

#### Scenario: 复制代码
- **WHEN** 用户点击代码块右上角的"复制"按钮
- **THEN** 代码内容复制到剪贴板，按钮短暂显示"已复制"反馈

### Requirement: 消息时间戳
每条消息 SHALL 显示发送时间。

#### Scenario: 时间戳展示
- **WHEN** 消息渲染完成
- **THEN** 消息下方或旁边显示发送时间（格式：HH:mm）

### Requirement: 用户消息展示
用户发送的消息 SHALL 显示在对话区右侧，使用区别于 AI 回复的样式。

#### Scenario: 用户消息样式
- **WHEN** 用户发送一条文本消息
- **THEN** 消息以气泡形式显示在右侧，背景色与 AI 消息不同

### Requirement: 欢迎引导界面
无消息的空会话 SHALL 展示欢迎引导界面。

#### Scenario: 空会话欢迎
- **WHEN** 用户新建会话或打开无消息的会话
- **THEN** 对话区中央展示欢迎信息（Logo + "有什么我可以帮您的？" + 建议提问示例）
