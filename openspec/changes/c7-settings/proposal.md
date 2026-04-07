## Why

设置页是用户管理账户、AI 接入配置、消耗统计、外观主题和数据管理的统一入口。设置页涵盖 5 个子页面，是 P2 优先级的核心配置模块，直接影响用户对应用的个性化控制和安全管理。

## What Changes

- 实现设置页双栏布局（左侧分类菜单 + 右侧内容区）
- 实现账户设置（用户信息展示 + 退出登录）
- 实现 AI Provider 设置（Codemaker 模式 / 直连模式切换及配置）
- 实现消耗统计（月度用量卡片 + 月份切换）
- 实现外观设置（浅色/深色主题切换）
- 实现数据管理（清空所有数据 + 二次确认）

## Capabilities

### New Capabilities

- `account-settings`: 账户信息展示与退出登录
- `provider-settings`: AI Provider 模式切换与配置管理
- `usage-stats`: 月度消耗统计展示
- `appearance-settings`: 主题切换与持久化
- `data-management`: 数据清空与危险操作管理

### Modified Capabilities

（无）

## Impact

- **依赖 C0**：全局布局、路由、主题系统、Zustand Store
- **依赖 C1**：登录态、用户信息、退出登录逻辑
- **被 C2 消费**：Provider 配置影响聊天模型选择
- **被 C8 集成**：codemaker serve 状态检测、CLI 调用
