## ADDED Requirements

### Requirement: Provider 模式切换
AI Provider 设置页 SHALL 支持在 Codemaker 模式和直连模式之间切换。

#### Scenario: 展示模式切换
- **WHEN** 用户进入 AI Provider 设置页
- **THEN** 顶部展示 SegmentedControl："Codemaker 模式（推荐）" / "直连模式"

### Requirement: Codemaker 模式面板
Codemaker 模式 SHALL 展示 codemaker serve 的运行状态和管理操作。

#### Scenario: 运行中状态
- **WHEN** Provider 模式为 Codemaker 且 serve 运行中
- **THEN** 展示：绿色状态点 + "运行中 (127.0.0.1:4000)" + "重启 codemaker serve" 按钮

#### Scenario: 已停止状态
- **WHEN** Provider 模式为 Codemaker 且 serve 已停止
- **THEN** 展示：灰色状态点 + "已停止" + "启动 codemaker serve" 按钮

#### Scenario: 重启服务
- **WHEN** 用户点击 "重启 codemaker serve" 按钮
- **THEN** 按钮进入 loading 态，Mock 延迟 2 秒后恢复为运行中

### Requirement: 直连模式面板
直连模式 SHALL 提供 API 配置和连接测试。

#### Scenario: 直连模式配置表单
- **WHEN** Provider 模式切换为直连
- **THEN** 展示：API Base URL 输入框、API Key 输入框（密码型，可切换显示）、"测试连接" 按钮、自定义模型列表

#### Scenario: 连接测试成功
- **WHEN** 用户点击 "测试连接"
- **THEN** 按钮 loading → Mock 延迟 1 秒 → 显示绿色提示 "连接成功，模型已就绪"

#### Scenario: 连接测试失败
- **WHEN** API 配置无效（Mock：URL 为空时模拟失败）
- **THEN** 显示红色提示 "连接失败：{错误原因}"

### Requirement: 自定义模型列表
直连模式 SHALL 支持管理可用模型列表。

#### Scenario: 添加模型
- **WHEN** 用户输入模型名称并点击 "添加"
- **THEN** 模型名称添加到列表中，以 Tag 形式展示

#### Scenario: 删除模型
- **WHEN** 用户点击某模型 Tag 的关闭图标
- **THEN** 从列表中移除该模型
