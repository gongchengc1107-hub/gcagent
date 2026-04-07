## ADDED Requirements

### Requirement: 主题切换
外观设置页 SHALL 提供浅色和深色主题的可视化切换。

#### Scenario: 主题卡片展示
- **WHEN** 用户进入外观设置页
- **THEN** 展示两个主题预览卡片：Light（浅色预览图）/ Dark（深色预览图），当前选中主题有蓝色边框高亮

#### Scenario: 切换主题
- **WHEN** 用户点击另一个主题卡片
- **THEN** 即时切换主题，调用 useThemeStore.setTheme()，自动持久化到 localStorage
- **AND** 无需点击保存按钮

### Requirement: 主题持久化
主题选择 SHALL 在应用重启后自动恢复。

#### Scenario: 启动恢复
- **WHEN** 应用启动
- **THEN** 读取 localStorage 中保存的主题偏好，应用对应主题；默认为浅色主题
