## ADDED Requirements

### Requirement: ThinkingBlock 可折叠卡片
AI 调用 MCP 工具时 SHALL 在消息流中展示 ThinkingBlock，显示工具名称、调用状态图标。默认折叠。

#### Scenario: 工具调用展示（折叠）
- **WHEN** AI 消息中包含工具调用记录
- **THEN** 消息流中展示折叠的 ThinkingBlock 卡片，显示工具名称和状态图标（✅ 成功 / ❌ 失败 / ⏳ 执行中）

#### Scenario: 展开查看详情
- **WHEN** 用户点击 ThinkingBlock 卡片
- **THEN** 卡片展开，显示调用参数（JSON 格式化）和返回结果（JSON/文本）

#### Scenario: 多个工具调用
- **WHEN** AI 一次回复中调用了多个工具
- **THEN** 每个工具调用独立展示为一个 ThinkingBlock，按调用顺序排列

### Requirement: ThinkingBlock 数据结构
工具调用记录 SHALL 包含以下字段：toolName, status, params, result, duration。

#### Scenario: Mock 工具调用数据
- **WHEN** Mock SSE 返回工具调用
- **THEN** 消息的 toolCalls 数组中包含完整的工具调用记录
