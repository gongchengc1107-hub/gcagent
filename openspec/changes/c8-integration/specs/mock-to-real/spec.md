## ADDED Requirements

### Requirement: Service 接口定义
系统 SHALL 为所有 Mock 调用定义统一的 Service 接口。

#### Scenario: Service 接口清单
- **WHEN** 系统初始化 Service 层
- **THEN** 定义以下 Service 接口：
  - `IAuthService`：login / logout / getCurrentUser
  - `IChatService`：sendMessage（SSE）/ getHistory
  - `IMCPService`：readConfig / writeConfig / checkStatus
  - `IProviderService`：testConnection / restartServe / getQuota
  - `IFileService`：readFile / writeFile / deleteFile / listFiles

### Requirement: Mock 实现
每个 Service 接口 SHALL 有对应的 Mock 实现。

#### Scenario: Mock 实现注册
- **WHEN** 应用运行在 Mock 模式（当前默认）
- **THEN** ServiceProvider 注入 Mock 实现，所有功能使用 Mock 数据

### Requirement: Service 切换点
系统 SHALL 提供统一的 Mock/Real 切换配置。

#### Scenario: 环境变量控制
- **WHEN** 环境变量 `VITE_USE_MOCK=true`（默认）
- **THEN** 使用 Mock Service 实现
- **WHEN** 环境变量 `VITE_USE_MOCK=false`
- **THEN** 使用 Real Service 实现（未来实现）
