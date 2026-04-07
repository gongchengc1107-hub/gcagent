## Context

C0 已搭建完成项目脚手架，包括路由系统（createHashRouter）、Zustand store 骨架（useAuthStore）、全局布局和主题系统。C1 需要在此基础上实现完整的登录流程。

PRD 明确说明：当前仅支持内部网易账号的本地模拟登录，不接入真实 OAuth 服务。登录态通过 localStorage 持久化。

## Goals / Non-Goals

**Goals:**

- 实现完整的登录 → 主界面跳转流程
- 登录页视觉参考 ChatGPT 风格（居中卡片、品牌标识、一键登录按钮）
- 登录态可靠持久化，重启应用无需重新登录
- 首次登录自动初始化种子数据
- AuthGuard 正确拦截未登录访问

**Non-Goals:**

- 不接入真实 OAuth / SSO 服务
- 不实现注册功能
- 不实现多用户切换
- 不实现 Token 刷新机制

## Decisions

### D1: 模拟登录实现方式

**选择**：点击登录按钮后，前端本地生成一个固定的模拟用户对象，写入 useAuthStore 并持久化

**理由**：
- PRD 明确说明是模拟登录，无需真实后端认证
- 生成固定用户信息（name: "Codemaker Developer", avatar: 默认头像）即可
- 后续如需接入真实 OAuth，只需替换 login 函数内部实现，接口不变
- 替代方案（Mock API 服务器）增加不必要的复杂度

### D2: 登录态检测时机

**选择**：在 App 根组件初始化时，通过 Zustand persist 的 `onRehydrateStorage` 回调检测

**理由**：
- Zustand persist 从 localStorage 恢复数据时自动触发
- 恢复完成后根据 `isLoggedIn` 状态决定路由跳转
- 避免页面闪烁（先展示 loading → 判断完成 → 跳转）

### D3: 种子数据初始化策略

**选择**：在 login 函数中检查 `isFirstLogin` 标志，首次登录时写入种子数据到对应 store

**理由**：
- 种子数据包含 3 个内置 Agent（Sisyphus、Explorer、Builder）和 1 条示例会话
- 使用 `isFirstLogin` 标志避免重复初始化
- 种子数据定义为静态常量，便于维护

### D4: 登录页视觉方案

**选择**：全屏居中布局，深色渐变背景，白色登录卡片，品牌 Logo + 标题 + 一键登录按钮

**理由**：
- 参考 ChatGPT 登录页风格，简洁专业
- 无表单（无需账密输入），一个按钮即完成
- 深色背景 + 白色卡片的对比感强，视觉层级清晰

## Risks / Trade-offs

- **[Risk] 模拟登录安全性为零** → 可接受，PRD 明确定位为内部工具，后续可替换为真实 OAuth
- **[Risk] localStorage 被手动清除导致登录态丢失** → 可接受，用户重新点击登录即可
- **[Trade-off] 种子数据硬编码在前端** → 简化了实现，但 Agent 描述变更需要改前端代码。可接受，因为内置 Agent 属性基本固定
