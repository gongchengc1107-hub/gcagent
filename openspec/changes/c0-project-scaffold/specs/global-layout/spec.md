## ADDED Requirements

### Requirement: 侧边栏导航结构
全局布局 SHALL 包含左侧侧边栏和右侧内容区。侧边栏包含 5 个一级导航项：聊天（Chat）、Agents、Skills、MCP、设置（Settings）。每个导航项有图标和文字标签。

#### Scenario: 导航项点击切换
- **WHEN** 用户点击侧边栏中的导航项
- **THEN** 右侧内容区切换到对应页面，当前导航项高亮

#### Scenario: 默认选中状态
- **WHEN** 用户进入应用主界面
- **THEN** 默认选中"聊天"导航项

### Requirement: 侧边栏折叠/展开
侧边栏 SHALL 支持折叠和展开。折叠后仅显示图标，展开后显示图标 + 文字。

#### Scenario: 折叠侧边栏
- **WHEN** 用户点击折叠按钮
- **THEN** 侧边栏收窄为仅图标模式（宽度 ~64px），内容区自动扩展

#### Scenario: 展开侧边栏
- **WHEN** 用户点击展开按钮
- **THEN** 侧边栏恢复完整宽度（~240px），显示图标和文字标签

### Requirement: ChatGPT 风格视觉
布局 SHALL 参考 ChatGPT Desktop 的视觉风格：深色侧边栏、浅色内容区（浅色主题下），整体简洁现代。

#### Scenario: 浅色主题下的视觉
- **WHEN** 当前为浅色主题
- **THEN** 侧边栏背景为深灰色调，内容区为白色/浅灰

#### Scenario: 深色主题下的视觉
- **WHEN** 当前为深色主题
- **THEN** 侧边栏和内容区均为深色调，区分层级
