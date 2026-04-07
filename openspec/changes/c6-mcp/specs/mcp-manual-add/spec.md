## ADDED Requirements

### Requirement: 手动添加表单
添加弹窗的"手动添加" Tab SHALL 提供完整的 MCP 配置表单。

#### Scenario: MCP 类型选择
- **WHEN** 用户选择"手动添加" Tab
- **THEN** 顶部展示类型切换：本地 MCP（local）/ 远程 MCP（remote），默认选中 local

#### Scenario: 本地 MCP 表单
- **WHEN** 类型为 local
- **THEN** 表单包含：名称（必填）、命令 command（必填，如 npx / uvx）、参数 args（选填，逗号分隔或每行一个）、环境变量 env（选填，Key-Value 动态行）

#### Scenario: 远程 MCP 表单
- **WHEN** 类型为 remote
- **THEN** 表单包含：名称（必填）、URL（必填，https:// 开头）、Headers（选填，Key-Value 动态行，预置 Authorization 行）

### Requirement: 表单验证
表单 SHALL 在提交前进行完整性校验。

#### Scenario: 必填校验
- **WHEN** 用户未填写必填字段即点击"添加"
- **THEN** 对应字段高亮红色边框，显示错误提示（如 "请输入 MCP 名称"）

#### Scenario: 名称唯一性校验
- **WHEN** 用户输入的名称与已存在的 MCP 名称重复
- **THEN** 名称字段提示 "该名称已被使用"

#### Scenario: URL 格式校验
- **WHEN** 类型为 remote 且 URL 不符合 https:// 格式
- **THEN** URL 字段提示 "请输入有效的 HTTPS URL"

### Requirement: 环境变量编辑器
本地 MCP 表单 SHALL 提供动态 Key-Value 环境变量编辑器。

#### Scenario: 添加环境变量行
- **WHEN** 用户点击 "添加环境变量" 按钮
- **THEN** 新增一行空的 Key-Value 输入框

#### Scenario: 删除环境变量行
- **WHEN** 用户点击某行的删除图标
- **THEN** 移除该行

#### Scenario: 敏感值遮蔽
- **WHEN** Key 包含 TOKEN / SECRET / KEY / PASSWORD（不区分大小写）
- **THEN** Value 输入框自动切换为 password 类型（显示 ****），旁边有眼睛图标切换可见性

### Requirement: 编辑已有 MCP
用户 SHALL 能够编辑自定义 MCP 的配置。

#### Scenario: 打开编辑模式
- **WHEN** 用户点击自定义 MCP 卡片的编辑按钮
- **THEN** 打开添加弹窗，自动切换到"手动添加" Tab，表单预填当前配置，按钮文字改为"保存修改"

#### Scenario: 保存编辑
- **WHEN** 用户修改配置后点击"保存修改"
- **THEN** 更新 Store 中对应 MCP 配置，更新 updatedAt 时间戳，触发配置持久化
