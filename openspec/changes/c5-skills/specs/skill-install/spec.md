## ADDED Requirements

### Requirement: 安装弹窗
点击"安装 Skill"按钮 SHALL 弹出 Modal，内含三种安装方式的 Tabs 切换。

#### Scenario: 打开安装弹窗
- **WHEN** 用户点击"安装 Skill"按钮
- **THEN** 弹出 Modal，默认显示"安装命令"Tab

### Requirement: 命令安装
用户 SHALL 可以粘贴 shell 安装命令来安装 Skill。

#### Scenario: 执行安装命令
- **WHEN** 用户在输入框中粘贴 shell 命令并点击"执行"
- **THEN** 显示命令预览，用户确认后通过 Electron IPC 执行命令，解析输出结果，成功则新 Skill 写入 store 和磁盘

#### Scenario: 命令执行失败
- **WHEN** shell 命令执行失败
- **THEN** 显示错误信息，不写入任何数据

### Requirement: 上传文件安装
用户 SHALL 可以上传 `.md` 格式的 Skill 定义文件来安装。

#### Scenario: 上传有效文件
- **WHEN** 用户上传一个包含合法 frontmatter 的 `.md` 文件
- **THEN** 解析文件内容，预览 Skill 信息（名称、描述、标签），用户确认后写入 store 和磁盘

#### Scenario: 上传无效文件
- **WHEN** 用户上传的文件不是 `.md` 格式或 frontmatter 不合法
- **THEN** 显示错误提示"文件格式不正确，请上传有效的 Skill .md 文件"

### Requirement: 手动填写安装
用户 SHALL 可以在表单中逐项填写 Skill 属性来安装。

#### Scenario: 手动填写并安装
- **WHEN** 用户填写名称、描述、说明文档、标签、触发词并点击"安装"
- **THEN** 创建新 Skill 写入 store 和磁盘

#### Scenario: 名称必填
- **WHEN** 用户未填写名称直接提交
- **THEN** 显示错误提示"请输入 Skill 名称"

#### Scenario: 触发词必填
- **WHEN** 用户未填写任何触发词直接提交
- **THEN** 显示错误提示"请至少添加一个触发词"
