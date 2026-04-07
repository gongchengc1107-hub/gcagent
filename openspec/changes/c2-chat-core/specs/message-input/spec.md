## ADDED Requirements

### Requirement: 多行文本输入
输入框 SHALL 支持多行文本输入，Enter 发送消息，Shift+Enter 换行。

#### Scenario: Enter 发送
- **WHEN** 用户在输入框中输入文本并按 Enter
- **THEN** 消息被发送，输入框清空

#### Scenario: Shift+Enter 换行
- **WHEN** 用户在输入框中按 Shift+Enter
- **THEN** 输入框内换行，不发送消息

#### Scenario: 空内容不可发送
- **WHEN** 输入框为空（或仅含空白字符），用户按 Enter
- **THEN** 不发送消息，不做任何操作

### Requirement: Agent 选择
输入区 SHALL 提供 Agent 选择下拉，可切换当前会话使用的 Agent。

#### Scenario: 切换 Agent
- **WHEN** 用户在输入区上方的 Agent 下拉中选择另一个 Agent
- **THEN** 当前会话的 agentId 更新为选中 Agent，后续消息使用新 Agent 处理

#### Scenario: 默认 Agent
- **WHEN** 新建会话
- **THEN** 默认使用 Sisyphus Agent

### Requirement: 模型选择
输入区 SHALL 提供模型选择下拉，支持 20+ 个模型，按厂商分组显示。

#### Scenario: 切换模型
- **WHEN** 用户在模型下拉中选择另一个模型
- **THEN** 当前会话的 modelId 更新为选中模型

#### Scenario: 模型分组展示
- **WHEN** 用户打开模型下拉
- **THEN** 模型按厂商分组展示（Anthropic / OpenAI / Google / DeepSeek / Moonshot / Alibaba）

### Requirement: Token 用量提示
输入区 SHALL 实时显示当前对话的上下文窗口使用百分比。

#### Scenario: Token 用量展示
- **WHEN** 当前会话有历史消息
- **THEN** 输入区附近显示 Token 用量百分比指示器（如进度条或文字）

### Requirement: 发送限制
AI 回复中（流式输出未完成时）SHALL 禁止再次发送消息。

#### Scenario: AI 回复中
- **WHEN** AI 正在流式输出回复
- **THEN** 输入框置灰不可编辑，发送按钮禁用，显示"AI 回复中"提示

#### Scenario: AI 回复完成
- **WHEN** AI 流式输出完成
- **THEN** 输入框恢复可编辑状态，发送按钮恢复可用
