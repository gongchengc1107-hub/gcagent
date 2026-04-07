## ADDED Requirements

### Requirement: 清空所有数据
数据管理页 SHALL 提供清空所有本地数据的功能。

#### Scenario: 危险操作区展示
- **WHEN** 用户进入数据管理页
- **THEN** 展示红色边框卡片：标题 "清空所有数据"、描述 "将永久删除所有会话记录、Agent 配置和本地设置。此操作不可恢复。"、红色 danger 按钮 "清空所有数据"

#### Scenario: 点击清空按钮
- **WHEN** 用户点击 "清空所有数据" 按钮
- **THEN** 弹出确认弹窗：标题 "清空所有数据"、描述 "此操作将永久清除以下数据：所有会话记录、消息历史、自定义 Agent 设置、用户设置（主题、Provider 等）。此操作不可撤销。"

#### Scenario: 确认清空
- **WHEN** 用户点击 "我了解风险，确认清空"
- **THEN** 清除所有 Zustand Store 数据、清除 localStorage、清除持久化文件
- **AND** 自动跳转到登录页

#### Scenario: 取消清空
- **WHEN** 用户点击 "取消"
- **THEN** 关闭弹窗，不做任何操作
