## Why

Skill 是可注入 AI 系统提示词的技能包，用户通过 `/` 命令快速激活。用户需要安装、管理和配置 Skills，支持三种安装方式（命令、上传文件、手动填写）。Skills 管理页是高频配置需求（P1），同时为 C3 的 `/` 命令菜单和 C4 的 Agent Skills 关联提供数据源。

## What Changes

- 实现 Skills 管理页 UI（Skill 列表，含名称、描述、标签）
- 实现三种 Skill 安装方式（安装命令、上传 `.md` 文件、手动填写表单）
- 实现 Skill 启用/禁用开关
- 实现 Skill 编辑和删除
- 实现 Skill Hub 外部链接入口
- 实现磁盘持久化（`opencode/skills/*.md`）

## Capabilities

### New Capabilities

- `skill-list`: Skill 列表页，展示所有已安装 Skill，含启用/禁用和空状态
- `skill-install`: 三种 Skill 安装方式（命令、上传、手动）
- `skill-crud`: Skill 编辑/删除和磁盘持久化

### Modified Capabilities

（无）

## Impact

- **依赖 C0**：全局布局、Zustand store（useSkillStore）、主题系统
- **依赖 C1**：登录态
- **被 C3 消费**：聊天页 `/` 命令菜单读取 useSkillStore 中已启用的 Skill
- **被 C4 消费**：Agent 创建/编辑时关联 Skills 读取 useSkillStore
- **修改文件**：填充 useSkillStore 完整实现
