## ADDED Requirements

### Requirement: 双主题支持
应用 SHALL 支持浅色（Light）和深色（Dark）两种主题，通过 `html[data-theme]` 属性切换。

#### Scenario: 切换到深色主题
- **WHEN** 系统调用主题切换函数，传入 "dark"
- **THEN** `<html>` 元素的 `data-theme` 属性设置为 "dark"，所有 CSS 变量切换为深色值

#### Scenario: 切换到浅色主题
- **WHEN** 系统调用主题切换函数，传入 "light"
- **THEN** `<html>` 元素的 `data-theme` 属性设置为 "light"，所有 CSS 变量切换为浅色值

### Requirement: CSS 变量体系
主题 SHALL 通过 CSS 变量定义，至少包含以下 token 类别：

- 背景色（bg-primary, bg-secondary, bg-sidebar）
- 文字色（text-primary, text-secondary, text-muted）
- 边框色（border-primary, border-secondary）
- 强调色（accent-primary, accent-hover）
- 状态色（success, warning, error, info）

#### Scenario: Tailwind 引用 CSS 变量
- **WHEN** 开发者在 JSX 中使用 Tailwind 类名如 `bg-primary`
- **THEN** 实际渲染色值来自当前主题的 CSS 变量

### Requirement: Ant Design 主题同步
Ant Design 组件 SHALL 通过 ConfigProvider 的 `theme.token` 与 CSS 变量保持同步。

#### Scenario: Ant Design 按钮颜色跟随主题
- **WHEN** 用户切换主题
- **THEN** Ant Design 的 Button、Input 等组件颜色同步变更，无需额外操作

### Requirement: 主题持久化
用户选择的主题 SHALL 持久化到 localStorage，应用启动时自动恢复。

#### Scenario: 启动时恢复主题
- **WHEN** 用户上次选择了深色主题并关闭应用
- **THEN** 再次打开应用时自动应用深色主题，不会闪烁白屏
