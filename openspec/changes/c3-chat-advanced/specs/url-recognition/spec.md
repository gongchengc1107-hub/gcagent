## ADDED Requirements

### Requirement: URL 自动识别
输入框中输入或粘贴的 URL SHALL 自动被识别，并以域名卡片标签形式展示在输入框下方。

#### Scenario: 单个 URL 识别
- **WHEN** 用户在输入框中输入 `https://github.com/some/repo`
- **THEN** 输入框下方出现一个域名卡片标签，显示 "github.com"

#### Scenario: 多个 URL 识别
- **WHEN** 用户输入包含 3 个不同 URL 的文本
- **THEN** 输入框下方显示 3 个独立的域名卡片标签

#### Scenario: URL 卡片可移除
- **WHEN** 用户点击域名卡片上的关闭按钮
- **THEN** 该卡片消失，输入框中对应的 URL 文本不受影响

### Requirement: URL 发送处理
发送包含 URL 的消息时 SHALL 以原始文本形式发送。

#### Scenario: 发送带 URL 的消息
- **WHEN** 用户发送包含 URL 的消息
- **THEN** 消息内容包含原始 URL 文本，域名卡片仅为输入时的视觉增强
