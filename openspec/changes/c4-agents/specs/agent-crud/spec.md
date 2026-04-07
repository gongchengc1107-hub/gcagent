## ADDED Requirements

### Requirement: 创建 Agent
用户 SHALL 可以通过右侧 Drawer 表单创建自定义 Agent。

#### Scenario: 打开创建表单
- **WHEN** 用户点击"创建 Agent"按钮
- **THEN** 右侧滑出 Drawer，包含表单字段：名称、emoji、描述、关联 Skills（多选）、autoMode（开关）

#### Scenario: 提交创建
- **WHEN** 用户填写表单并点击"创建"
- **THEN** 新 Agent 写入 useAgentStore，Drawer 关闭，列表刷新显示新 Agent

#### Scenario: 名称必填校验
- **WHEN** 用户未填写名称直接提交
- **THEN** 名称字段显示错误提示"请输入 Agent 名称"

#### Scenario: 名称唯一性校验
- **WHEN** 用户输入的名称与已有 Agent 重复
- **THEN** 显示错误提示"Agent 名称已存在"

### Requirement: 编辑 Agent
用户 SHALL 可以编辑 Agent 的属性。

#### Scenario: 编辑自定义 Agent
- **WHEN** 用户点击自定义 Agent 的编辑按钮
- **THEN** Drawer 打开，表单预填当前 Agent 数据，所有字段可编辑

#### Scenario: 编辑内置 Agent
- **WHEN** 用户点击内置 Agent 的编辑按钮
- **THEN** Drawer 打开，名称字段禁用不可修改，其他字段可编辑

#### Scenario: 保存编辑
- **WHEN** 用户修改内容后点击"保存"
- **THEN** Agent 数据更新到 useAgentStore，Drawer 关闭

### Requirement: 删除 Agent
用户 SHALL 可以删除自定义 Agent，内置 Agent 不可删除。

#### Scenario: 删除自定义 Agent
- **WHEN** 用户点击自定义 Agent 的删除按钮并确认
- **THEN** Agent 从 useAgentStore 中删除，列表刷新

#### Scenario: 删除确认弹窗
- **WHEN** 用户点击删除按钮
- **THEN** 弹出确认弹窗"确定删除 Agent「{name}」？此操作不可撤销"

#### Scenario: 内置 Agent 不可删除
- **WHEN** Agent 为内置类型
- **THEN** 不显示删除按钮

### Requirement: Skills 关联
创建/编辑 Agent 时 SHALL 可以选择关联的 Skills。

#### Scenario: 选择关联 Skills
- **WHEN** 用户在 Drawer 表单中打开 Skills 多选下拉
- **THEN** 显示所有已启用的 Skill 列表，可多选

#### Scenario: 无可用 Skill
- **WHEN** 系统中没有任何 Skill
- **THEN** 多选下拉显示"暂无可用 Skill"

### Requirement: autoMode 开关
Agent 创建/编辑时 SHALL 提供 autoMode 开关。

#### Scenario: 开启 autoMode
- **WHEN** 用户开启 autoMode 开关
- **THEN** Agent 的 autoMode 字段设为 true，附带说明文字"开启后 Agent 可自动调用工具，无需每步确认"

### Requirement: 后端名称映射
Agent SHALL 支持独立的前端显示名和后端 API 名称。

#### Scenario: 自动生成 backendName
- **WHEN** 用户创建 Agent 输入名称为"代码审查助手"
- **THEN** 系统自动生成 backendName（如 kebab-case "code-review-assistant" 或用户手动指定）
