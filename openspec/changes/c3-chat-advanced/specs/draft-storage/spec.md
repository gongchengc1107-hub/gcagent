## ADDED Requirements

### Requirement: 切换会话时暂存草稿
切换会话时 SHALL 自动保存当前输入框中未发送的内容。

#### Scenario: 暂存草稿
- **WHEN** 用户在输入框输入了内容但未发送，然后切换到另一个会话
- **THEN** 输入框内容保存为当前会话的草稿

#### Scenario: 恢复草稿
- **WHEN** 用户切换回之前有草稿的会话
- **THEN** 输入框自动恢复该会话的草稿内容

#### Scenario: 发送后清除草稿
- **WHEN** 用户发送了消息
- **THEN** 该会话的草稿被清除

### Requirement: 草稿持久化
草稿数据 SHALL 持久化到 localStorage，应用重启后仍可恢复。

#### Scenario: 重启后恢复草稿
- **WHEN** 用户关闭应用时某个会话有未发送草稿
- **THEN** 重新打开应用并切换到该会话时，草稿内容仍在
