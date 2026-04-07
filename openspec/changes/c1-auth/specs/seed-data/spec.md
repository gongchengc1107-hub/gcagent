## ADDED Requirements

### Requirement: 内置 Agent 种子数据
首次登录 SHALL 自动初始化 3 个内置 Agent 到 useAgentStore：

| Agent | backendName | 描述 | emoji |
|-------|-------------|------|-------|
| Sisyphus | sisyphus | 通用编排 Agent，负责任务调度和协调 | 🏔️ |
| Explorer | explorer | 代码探索专用，擅长阅读和理解代码库 | 🔍 |
| Builder | builder | 全栈实现专用，擅长编写和修改代码 | 🔨 |

#### Scenario: 首次登录初始化 Agent
- **WHEN** 用户首次登录成功
- **THEN** useAgentStore 中写入 3 个内置 Agent，且标记为 `isBuiltin: true`

#### Scenario: 非首次登录不重复初始化
- **WHEN** 用户退出后重新登录（非首次）
- **THEN** 不覆盖已有的 Agent 数据

### Requirement: 示例会话种子数据
首次登录 SHALL 自动初始化 1 条示例会话到 useChatStore，包含 1 条欢迎消息。

#### Scenario: 首次登录初始化示例会话
- **WHEN** 用户首次登录成功
- **THEN** useChatStore 中写入 1 条会话（标题: "欢迎使用 Codemaker Dashboard"），含 1 条 AI 欢迎消息

### Requirement: 首次登录标志
系统 SHALL 通过 `hasInitializedSeedData` 标志判断是否需要初始化种子数据，该标志持久化到 localStorage。

#### Scenario: 标志检查
- **WHEN** 登录成功后
- **THEN** 检查 `hasInitializedSeedData` 是否为 true；若否，执行种子数据初始化并将标志设为 true
