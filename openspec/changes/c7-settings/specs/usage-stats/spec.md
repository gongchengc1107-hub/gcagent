## ADDED Requirements

### Requirement: 月度消耗统计展示
消耗统计页 SHALL 按月展示 AI 调用消耗数据。

#### Scenario: 正常展示
- **WHEN** 用户进入消耗统计页
- **THEN** 展示当前月份的消耗卡片：Token 消耗量、API 调用次数、费用估算

#### Scenario: 月份切换
- **WHEN** 用户点击左/右箭头翻页
- **THEN** 切换到上/下个月，重新加载该月数据（从 2026-01 起）

### Requirement: 数据加载状态
消耗统计 SHALL 展示加载和错误状态。

#### Scenario: 加载中
- **WHEN** 数据正在获取
- **THEN** 卡片区域显示骨架屏（Skeleton）

#### Scenario: 获取失败
- **WHEN** CLI 调用失败（Mock 阶段模拟概率性失败）
- **THEN** 显示 "获取数据失败，请确认 codemaker CLI 已正常安装" + "重试" 按钮

### Requirement: Mock 数据
Mock 阶段 SHALL 使用随机生成的统计数据。

#### Scenario: Mock 数据生成
- **WHEN** 系统获取消耗统计
- **THEN** 基于月份 seed 生成稳定的随机数据：Token 50k~500k、调用 100~2000 次、费用 $5~$50
