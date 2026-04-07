## 1. 设置页布局

- [ ] 1.1 创建 src/pages/Settings/index.tsx 设置页容器（左侧分类菜单 180px + 右侧内容区）
- [ ] 1.2 实现 SettingsMenu 分类菜单组件（5 个菜单项：账户 / AI Provider / 消耗统计 / 外观 / 数据管理）
- [ ] 1.3 配置设置页嵌套路由（/settings/account、/settings/provider、/settings/usage、/settings/appearance、/settings/data）
- [ ] 1.4 实现默认重定向（/settings → /settings/account）

## 2. 账户设置

- [ ] 2.1 创建 AccountSettings 页面组件
- [ ] 2.2 实现用户信息卡片（圆形头像 + 用户名 + 邮箱，数据来自 useAuthStore）
- [ ] 2.3 实现退出登录按钮 + 确认弹窗
- [ ] 2.4 实现退出逻辑（useAuthStore.logout → 跳转登录页）

## 3. AI Provider 设置

- [ ] 3.1 创建 ProviderSettings 页面组件
- [ ] 3.2 实现 Provider 模式 SegmentedControl 切换（Codemaker 模式 / 直连模式）
- [ ] 3.3 实现 Codemaker 模式面板（serve 状态展示 + 重启按钮 + loading 态）
- [ ] 3.4 实现直连模式面板（API Base URL + API Key + 测试连接 + 模型列表）
- [ ] 3.5 实现连接测试逻辑（Mock：延迟 1s → 成功/失败反馈）
- [ ] 3.6 实现自定义模型列表管理（添加/删除 Tag）
- [ ] 3.7 创建 useProviderStore（mode、serveStatus、apiBaseUrl、apiKey、customModels、connectionStatus）

## 4. 消耗统计

- [ ] 4.1 创建 UsageStats 页面组件
- [ ] 4.2 实现月份选择器（左/右箭头翻页，从 2026-01 起）
- [ ] 4.3 实现消耗数据卡片（Token 消耗 / API 调用次数 / 费用）
- [ ] 4.4 实现加载态骨架屏（Skeleton）
- [ ] 4.5 实现错误态（错误提示 + 重试按钮）
- [ ] 4.6 实现 Mock 数据生成函数（基于月份 seed 的稳定随机数据）

## 5. 外观设置

- [ ] 5.1 创建 AppearanceSettings 页面组件
- [ ] 5.2 实现两个主题预览卡片（Light / Dark，选中态蓝色边框）
- [ ] 5.3 实现点击即时切换主题（useThemeStore.setTheme + localStorage 持久化）

## 6. 数据管理

- [ ] 6.1 创建 DataManagement 页面组件
- [ ] 6.2 实现危险操作区红色边框卡片
- [ ] 6.3 实现清空确认弹窗（描述列出所有将被清除的数据类型）
- [ ] 6.4 实现清空逻辑（清除所有 Store + localStorage + 持久化文件 → 跳转登录页）

## 7. 验证

- [ ] 7.1 验证设置页双栏布局和菜单导航切换正常
- [ ] 7.2 验证退出登录流程（确认弹窗 + 跳转登录页）
- [ ] 7.3 验证 Provider 模式切换和配置表单
- [ ] 7.4 验证连接测试反馈（成功/失败）
- [ ] 7.5 验证消耗统计月份切换和数据展示
- [ ] 7.6 验证主题切换即时生效和持久化
- [ ] 7.7 验证数据清空流程（二次确认 + 完整清除 + 跳转）
- [ ] 7.8 验证深色/浅色主题下所有设置子页面视觉正确
