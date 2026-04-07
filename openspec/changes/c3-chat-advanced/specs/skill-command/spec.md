## ADDED Requirements

### Requirement: `/` 命令触发 Skill 菜单
输入框中输入 `/` 作为首字符时 SHALL 弹出 Skill 选择浮动菜单。

#### Scenario: 触发 Skill 菜单
- **WHEN** 用户在空输入框中输入 `/`
- **THEN** 输入框上方弹出浮动菜单，列出所有已启用的 Skill（名称 + 简短描述）

#### Scenario: 过滤 Skill 列表
- **WHEN** 用户输入 `/code`
- **THEN** 菜单过滤仅显示名称或描述中包含 "code" 的 Skill

#### Scenario: 选择 Skill
- **WHEN** 用户在菜单中点击某个 Skill 或用键盘选择后按 Enter
- **THEN** 输入框内容替换为 `/skillName `（带尾部空格），菜单关闭，用户继续输入消息

#### Scenario: 无匹配 Skill
- **WHEN** 输入的过滤词无匹配
- **THEN** 菜单显示"无匹配 Skill"提示

#### Scenario: Esc 关闭菜单
- **WHEN** Skill 菜单已弹出，用户按 Esc
- **THEN** 菜单关闭，输入框内容保持不变

### Requirement: Skill 菜单键盘导航
Skill 菜单 SHALL 支持键盘上下箭头选择和 Enter 确认。

#### Scenario: 键盘导航
- **WHEN** Skill 菜单弹出后用户按上下箭头键
- **THEN** 菜单中高亮项上下移动
