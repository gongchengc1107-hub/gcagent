## ADDED Requirements

### Requirement: Agent 列表展示
Agents 管理页 SHALL 以卡片网格展示所有 Agent，分为内置区和自定义区。

#### Scenario: 正常列表展示
- **WHEN** 用户进入 Agents 管理页
- **THEN** 页面顶部显示内置 Agent 卡片（3 个），下方显示自定义 Agent 卡片，每张卡片包含 emoji + 名称 + 描述

#### Scenario: 磁盘 Agent 标识
- **WHEN** 存在来自磁盘同步的 Agent
- **THEN** 该 Agent 卡片上显示"来自磁盘"标签

#### Scenario: 空自定义列表
- **WHEN** 无自定义 Agent
- **THEN** 自定义区域显示引导提示："还没有自定义 Agent，点击创建"

### Requirement: Agent 卡片交互
每张 Agent 卡片 SHALL 支持点击查看详情、hover 显示操作按钮。

#### Scenario: 自定义 Agent 卡片操作
- **WHEN** 用户 hover 自定义 Agent 卡片
- **THEN** 卡片右上角显示编辑和删除图标按钮

#### Scenario: 内置 Agent 卡片操作
- **WHEN** 用户 hover 内置 Agent 卡片
- **THEN** 卡片右上角仅显示编辑图标按钮（无删除）

### Requirement: 创建按钮与上限
页面右上角 SHALL 有"创建 Agent"按钮，自定义 Agent 达到 10 个上限时禁用。

#### Scenario: 未达上限
- **WHEN** 自定义 Agent 少于 10 个
- **THEN** "创建 Agent"按钮可用

#### Scenario: 达到上限
- **WHEN** 自定义 Agent 已有 10 个
- **THEN** "创建 Agent"按钮禁用，hover 显示 Tooltip："自定义 Agent 已达上限（10个）"
