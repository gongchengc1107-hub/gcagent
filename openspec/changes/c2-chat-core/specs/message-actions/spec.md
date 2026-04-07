## ADDED Requirements

### Requirement: 复制消息
所有消息 SHALL 支持复制操作，将消息原始内容（Markdown 源码）复制到剪贴板。

#### Scenario: 复制消息
- **WHEN** 用户 hover 消息并点击"复制"操作按钮
- **THEN** 消息的 Markdown 原始内容复制到剪贴板，显示"已复制"反馈

### Requirement: 重新发送
用户消息 SHALL 支持重新发送，原样重新发送该条消息触发新的 AI 回复。

#### Scenario: 重新发送
- **WHEN** 用户 hover 自己的消息并点击"重新发送"
- **THEN** 以该消息内容重新发送请求，AI 生成新的回复追加在对话末尾

### Requirement: 编辑并重发
用户消息 SHALL 支持编辑后重新发送，该消息之后的对话记录将被清除。

#### Scenario: 编辑并重发
- **WHEN** 用户 hover 自己的消息并点击"编辑"
- **THEN** 该消息进入编辑模式（inline 编辑框），用户修改内容后点击"发送"

#### Scenario: 编辑重发后清除后续消息
- **WHEN** 用户编辑第 3 条消息并重新发送
- **THEN** 第 3 条之后的所有消息被删除，AI 基于新内容重新生成回复

#### Scenario: 取消编辑
- **WHEN** 用户在编辑模式点击"取消"
- **THEN** 退出编辑模式，消息恢复原样

### Requirement: 重新生成
AI 消息 SHALL 支持重新生成，基于同一上下文重新生成回复并替换当前回复。

#### Scenario: 重新生成
- **WHEN** 用户 hover AI 消息并点击"重新生成"
- **THEN** 删除当前 AI 回复，基于上文重新发送请求，新回复流式输出替换原位置

### Requirement: 停止生成
流式输出中的 AI 消息 SHALL 支持停止操作。

#### Scenario: 停止生成
- **WHEN** AI 正在流式输出，用户点击"停止生成"按钮
- **THEN** 流式输出立即中断，已输出的内容保留显示

### Requirement: 消息操作按钮可见性
消息操作按钮 SHALL 仅在 hover 消息时显示，不 hover 时隐藏。

#### Scenario: Hover 显示操作
- **WHEN** 用户将鼠标悬停在消息上
- **THEN** 消息下方显示操作按钮栏（复制、重发等，根据消息类型不同显示不同按钮）

#### Scenario: 离开隐藏操作
- **WHEN** 用户鼠标离开消息区域
- **THEN** 操作按钮栏隐藏
