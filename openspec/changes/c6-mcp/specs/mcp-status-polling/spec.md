## ADDED Requirements

### Requirement: MCP 状态轮询
系统 SHALL 在 MCP 管理页可见时定期轮询所有 MCP 的连接状态。

#### Scenario: 开始轮询
- **WHEN** 用户进入 MCP 管理页
- **THEN** 立即执行一次全量状态检测，之后每 30 秒轮询一次

#### Scenario: 停止轮询
- **WHEN** 用户离开 MCP 管理页（切换到其他页面）
- **THEN** 清除轮询定时器，停止状态检测请求

#### Scenario: 手动刷新
- **WHEN** 用户点击页面的 "刷新状态" 按钮
- **THEN** 立即执行一次全量状态检测，重置 30 秒计时器

### Requirement: Mock 阶段状态检测
在后端未就绪阶段，状态检测 SHALL 使用 Mock 数据。

#### Scenario: Mock 状态返回
- **WHEN** 系统执行状态检测
- **THEN** 所有已启用的 MCP 返回 connected 状态，禁用的返回 disconnected 状态
- **AND** Mock 延迟 200-500ms 模拟网络请求

### Requirement: 状态变更通知
MCP 状态发生变更时 SHALL 更新 UI 并可选通知。

#### Scenario: 状态变更 UI 更新
- **WHEN** 某 MCP 的状态从上一次轮询结果发生变化
- **THEN** 对应卡片的状态徽章动画过渡到新状态

#### Scenario: 连接失败通知
- **WHEN** 某 MCP 状态从 connected 变为 failed 或 disconnected
- **THEN** 在页面顶部显示一条 warning 类型的消息提示 "{MCP名称} 连接已断开"
