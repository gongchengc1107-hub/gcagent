## ADDED Requirements

### Requirement: Skill 列表展示
Skills 管理页 SHALL 以表格形式展示所有已安装的 Skill。

#### Scenario: 正常列表展示
- **WHEN** 用户进入 Skills 管理页且存在已安装 Skill
- **THEN** 表格展示所有 Skill，每行包含：名称、描述、标签（Tag 组件）、启用/禁用开关、操作按钮（编辑/删除）

#### Scenario: 空列表
- **WHEN** 无任何已安装 Skill
- **THEN** 页面显示引导提示："还没有安装任何 Skill" + "安装 Skill" 按钮 + "前往 Skill Hub 发现更多" 链接

### Requirement: Skill 启用/禁用
每个 Skill SHALL 支持单独启用或禁用。

#### Scenario: 禁用 Skill
- **WHEN** 用户关闭某 Skill 的启用开关
- **THEN** 该 Skill 的 enabled 设为 false，不再出现在聊天页 `/` 命令菜单中

#### Scenario: 启用 Skill
- **WHEN** 用户打开某 Skill 的启用开关
- **THEN** 该 Skill 的 enabled 设为 true，恢复出现在 `/` 命令菜单中

### Requirement: Skill Hub 入口
页面 SHALL 提供 Skill Hub 外部链接入口。

#### Scenario: 跳转 Skill Hub
- **WHEN** 用户点击 "Skill Hub" 按钮
- **THEN** 系统调用 Electron shell.openExternal 在默认浏览器中打开 `https://skills.netease.com`
