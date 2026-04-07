## ADDED Requirements

### Requirement: 全局快捷键绑定
系统 SHALL 实现 PRD 定义的全局快捷键。

#### Scenario: ⌘K 会话搜索
- **WHEN** 用户在应用内按下 ⌘K
- **THEN** 聚焦到会话搜索输入框（如果在聊天页）或切换到聊天页并聚焦搜索

#### Scenario: Enter 发送消息
- **WHEN** 消息输入框聚焦且用户按下 Enter
- **THEN** 发送当前消息

#### Scenario: Shift+Enter 换行
- **WHEN** 消息输入框聚焦且用户按下 Shift+Enter
- **THEN** 在输入框中插入换行符

#### Scenario: Ctrl/Cmd+V 粘贴图片
- **WHEN** 消息输入框聚焦且用户按下 Ctrl/Cmd+V，剪贴板包含图片
- **THEN** 图片作为附件添加到输入框
