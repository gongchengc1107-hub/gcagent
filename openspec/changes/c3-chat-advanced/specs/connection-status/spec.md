## ADDED Requirements

### Requirement: 连接状态栏
对话区顶部 SHALL 显示与 `codemaker serve` 的连接状态栏。

#### Scenario: connected 状态
- **WHEN** 连接正常
- **THEN** 状态栏隐藏或显示不显眼的绿色指示点

#### Scenario: connecting 状态
- **WHEN** 正在连接服务
- **THEN** 顶部显示蓝色提示条："正在连接 Codemaker 服务..."

#### Scenario: reconnecting 状态
- **WHEN** 连接断开后自动重连
- **THEN** 顶部显示黄色提示条："连接已断开，正在重新连接..."

#### Scenario: disconnected 状态
- **WHEN** 连接失败
- **THEN** 顶部显示红色提示条："无法连接 Codemaker 服务，请检查 codemaker serve 是否运行"，输入框禁用

### Requirement: 连接状态管理
系统 SHALL 在 useChatStore 中管理连接状态，支持状态转换。

#### Scenario: 状态转换
- **WHEN** 连接状态发生变化
- **THEN** connectionStatus 字段更新，状态栏 UI 响应式更新
