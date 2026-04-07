## ADDED Requirements

### Requirement: 图片粘贴上传
输入框 SHALL 支持通过 Ctrl/Cmd+V 粘贴图片。

#### Scenario: 粘贴图片
- **WHEN** 用户按 Ctrl/Cmd+V 且剪贴板包含图片
- **THEN** 图片以缩略图形式显示在输入框上方的附件区域

#### Scenario: 粘贴非图片内容
- **WHEN** 用户按 Ctrl/Cmd+V 且剪贴板是文本
- **THEN** 正常粘贴文本到输入框，不触发图片处理

### Requirement: 图片拖拽上传
输入框 SHALL 支持拖拽图片文件上传。

#### Scenario: 拖拽图片到输入框
- **WHEN** 用户将图片文件拖拽到输入框区域
- **THEN** 拖拽过程中输入框高亮提示，释放后图片显示在附件区域

### Requirement: 图片预览与移除
上传的图片 SHALL 在发送前提供预览和移除功能。

#### Scenario: 图片预览
- **WHEN** 图片已添加到附件区域
- **THEN** 显示缩略图（约 80x80px），支持多张图片并排展示

#### Scenario: 移除图片
- **WHEN** 用户点击缩略图上的关闭按钮
- **THEN** 该图片从附件列表中移除

### Requirement: 图片大小限制
单张图片 SHALL 不超过 5MB。

#### Scenario: 超出大小限制
- **WHEN** 用户上传超过 5MB 的图片
- **THEN** 拒绝上传，显示提示"图片大小不能超过 5MB"

### Requirement: 消息中图片展示
用户发送的图片 SHALL 在消息气泡中内嵌展示。

#### Scenario: 图片消息渲染
- **WHEN** 一条用户消息包含图片附件
- **THEN** 消息气泡中内嵌展示图片（最大宽度 300px），支持点击查看大图
