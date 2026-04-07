## ADDED Requirements

### Requirement: 编辑 Skill
用户 SHALL 可以编辑已安装 Skill 的所有属性。

#### Scenario: 打开编辑
- **WHEN** 用户点击 Skill 行的编辑按钮
- **THEN** 弹出编辑 Modal/Drawer，预填当前 Skill 所有字段（名称、描述、说明文档、标签、触发词）

#### Scenario: 保存编辑
- **WHEN** 用户修改内容后点击"保存"
- **THEN** Skill 数据更新到 useSkillStore，同时更新磁盘文件

### Requirement: 删除 Skill
用户 SHALL 可以删除 Skill，同时删除磁盘文件。

#### Scenario: 删除 Skill
- **WHEN** 用户点击 Skill 行的删除按钮并确认
- **THEN** Skill 从 useSkillStore 删除，对应的磁盘 `.md` 文件也被删除

#### Scenario: 删除确认
- **WHEN** 用户点击删除按钮
- **THEN** 弹出确认弹窗"确定删除 Skill「{name}」？对应的磁盘文件也将被删除"

### Requirement: 磁盘持久化
Skill 的创建、编辑、删除操作 SHALL 同步到磁盘 `opencode/skills/` 目录。

#### Scenario: 创建时写入磁盘
- **WHEN** 新 Skill 安装成功
- **THEN** 在 `opencode/skills/` 目录下创建 `{skill-id}.md` 文件（frontmatter + readme body）

#### Scenario: 编辑时更新磁盘
- **WHEN** Skill 编辑保存
- **THEN** 对应磁盘文件内容更新

#### Scenario: 删除时移除磁盘文件
- **WHEN** Skill 被删除
- **THEN** 对应磁盘 `.md` 文件被删除

### Requirement: 启动时磁盘同步
应用启动时 SHALL 从 `opencode/skills/` 读取所有 `.md` 文件，与 useSkillStore 合并。

#### Scenario: 磁盘新增了文件
- **WHEN** 用户手动在磁盘添加了新 `.md` Skill 文件后重启应用
- **THEN** 新 Skill 出现在 Skills 列表中
