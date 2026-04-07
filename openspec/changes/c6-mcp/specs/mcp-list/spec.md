## ADDED Requirements

### Requirement: MCP 列表展示
MCP 管理页 SHALL 以单列卡片列表展示所有 MCP 工具服务。

#### Scenario: 内置 MCP 展示
- **WHEN** 用户进入 MCP 管理页
- **THEN** 页面顶部展示 3 个内置 MCP（Web Search / Context7 / Grep App），每个卡片包含：图标、名称、类型标签（local/remote）、状态徽章、"内置"角标
- **AND** 内置 MCP 无编辑/删除按钮，仅支持启用/禁用

#### Scenario: 自定义 MCP 展示
- **WHEN** 用户已添加自定义 MCP
- **THEN** 自定义 MCP 卡片展示在内置 MCP 下方，每个卡片包含：图标、名称、类型标签、状态徽章、启用/禁用开关、编辑按钮、删除按钮

#### Scenario: 空列表（无自定义 MCP）
- **WHEN** 无任何自定义 MCP
- **THEN** 内置 MCP 正常展示，自定义区域显示引导提示："还没有添加自定义 MCP 工具" + "添加 MCP" 按钮

### Requirement: MCP 启用/禁用
每个 MCP（包括内置）SHALL 支持单独启用或禁用。

#### Scenario: 禁用 MCP
- **WHEN** 用户关闭某 MCP 的启用开关
- **THEN** 该 MCP 的 enabled 设为 false，从持久化配置中标记为禁用，状态显示为 disconnected

#### Scenario: 启用 MCP
- **WHEN** 用户打开某 MCP 的启用开关
- **THEN** 该 MCP 的 enabled 设为 true，触发一次状态检测（Mock 阶段直接返回 connected）

### Requirement: MCP 删除
用户 SHALL 能够删除自定义 MCP。

#### Scenario: 删除自定义 MCP
- **WHEN** 用户点击自定义 MCP 的删除按钮
- **THEN** 弹出确认弹窗 "确定删除 {名称}？删除后该工具将不可用"
- **AND** 用户确认后，从 Store 和持久化配置中移除该 MCP

#### Scenario: 内置 MCP 不可删除
- **WHEN** MCP 的 isBuiltin 为 true
- **THEN** 卡片不展示删除按钮

### Requirement: MCP 状态徽章
每个 MCP 卡片 SHALL 展示实时连接状态徽章。

#### Scenario: 状态颜色映射
- **WHEN** 展示 MCP 状态
- **THEN** 按以下映射显示：connected → 绿色 "已连接"、disconnected → 灰色 "未连接"、connecting → 蓝色旋转 "连接中"、needs_auth → 橙色 "需认证"、failed → 红色 "连接失败"

### Requirement: 添加 MCP 入口
页面 SHALL 提供明显的添加 MCP 入口。

#### Scenario: 打开添加弹窗
- **WHEN** 用户点击页面顶部的 "添加 MCP" 按钮
- **THEN** 打开 MCP 添加弹窗（Modal），弹窗包含 3 个 Tab：智能安装 / 手动添加 / 模板库
