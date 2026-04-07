## ADDED Requirements

### Requirement: MCP 模板库展示
添加弹窗的"模板库" Tab SHALL 以网格形式展示 6 个预设 MCP 模板。

#### Scenario: 模板网格展示
- **WHEN** 用户选择"模板库" Tab
- **THEN** 以 3x2 网格展示 6 个模板卡片：Filesystem / GitHub / PostgreSQL / Brave Search / Puppeteer / Slack
- **AND** 每个卡片包含：图标、名称、一行描述

### Requirement: 模板预填
选择模板 SHALL 自动跳转到手动添加 Tab 并预填配置。

#### Scenario: 选择模板
- **WHEN** 用户点击某个模板卡片
- **THEN** 自动切换到"手动添加" Tab，表单预填该模板的配置
- **AND** 可编辑字段预留占位符提示（如 env 中的 `GITHUB_TOKEN: "<请填入你的 Token>"`）

### Requirement: 模板数据结构
模板 SHALL 定义为静态常量，包含完整的预填信息。

#### Scenario: 模板内容定义
- **WHEN** 系统加载模板库
- **THEN** 每个模板包含以下字段：
  - `id`: 唯一标识
  - `name`: 展示名称
  - `description`: 一行描述
  - `icon`: 图标标识（使用 Ant Design Icon 或自定义 SVG）
  - `type`: local 或 remote
  - `command`: 预填命令（local 类型）
  - `args`: 预填参数数组
  - `env`: 预填环境变量（含占位符）
  - `url`: 预填 URL（remote 类型）
