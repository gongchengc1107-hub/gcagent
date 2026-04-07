## ADDED Requirements

### Requirement: 智能安装输入
添加弹窗的"智能安装" Tab SHALL 提供大文本输入框，支持粘贴任意格式配置信息。

#### Scenario: 输入区域
- **WHEN** 用户选择"智能安装" Tab
- **THEN** 展示一个多行文本输入框（placeholder: "粘贴 MCP 配置信息，支持 JSON / URL / Bearer Token 格式"）+ "识别" 按钮

### Requirement: 多格式自动识别
系统 SHALL 按优先级尝试多种解析策略识别用户输入。

#### Scenario: 识别标准 JSON 配置
- **WHEN** 用户粘贴的内容可被 JSON.parse 成功解析，且包含 `command` 或 `url` 字段
- **THEN** 识别为本地 MCP（含 command）或远程 MCP（含 url），展示解析预览

#### Scenario: 识别 HTTP(S) URL
- **WHEN** 用户粘贴的内容匹配 `https?://` URL 格式
- **THEN** 识别为远程 MCP，自动填充 url 字段，name 从 URL hostname 提取

#### Scenario: 识别 Bearer Token
- **WHEN** 用户粘贴的内容匹配 `Bearer ` 前缀或纯 Token 字符串
- **THEN** 识别为远程 MCP 的 headers（`Authorization: Bearer {token}`），提示用户补充 URL

#### Scenario: 无法识别
- **WHEN** 以上策略均不匹配
- **THEN** 提示 "无法识别格式，请使用手动添加" + 高亮"手动添加" Tab

### Requirement: 识别结果预览
识别成功后 SHALL 展示解析结果预览，用户确认后才写入。

#### Scenario: 预览与确认
- **WHEN** 系统成功识别粘贴内容
- **THEN** 在输入框下方展示预览卡片，包含：名称（可编辑）、类型、command/url、args、env 等解析结果
- **AND** 展示 "确认添加" 和 "取消" 按钮

#### Scenario: 确认写入
- **WHEN** 用户点击 "确认添加"
- **THEN** 创建 MCPConfig 对象写入 Store，触发配置持久化，弹窗关闭
