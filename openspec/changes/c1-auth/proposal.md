## Why

Codemaker Dashboard 作为内部工具需要基础的身份认证机制。用户首次使用时需要登录，登录成功后初始化种子数据（3 个内置 Agent + 示例会话），后续启动自动检测登录态跳过登录页。当前阶段不接入真实 OAuth，使用本地模拟登录即可满足内部使用场景。

## What Changes

- 实现登录页 UI（参考 ChatGPT 登录页风格，简洁居中布局）
- 实现本地模拟 OAuth 登录流程（点击按钮即完成登录，生成模拟用户信息）
- 实现登录态持久化（Zustand persist → localStorage）
- 实现应用启动时登录态检测（已登录跳转聊天页，未登录停留登录页）
- 实现路由守卫 AuthGuard（保护受保护路由，未登录重定向到 /login）
- 实现种子数据初始化（首次登录后写入 3 个内置 Agent 和 1 条示例会话）
- 实现退出登录功能（清除登录态，跳转登录页）

## Capabilities

### New Capabilities

- `login-page`: 登录页 UI 和登录交互流程
- `auth-guard`: 路由守卫，未登录拦截重定向
- `seed-data`: 首次登录后种子数据初始化（内置 Agent + 示例会话）

### Modified Capabilities

（无）

## Impact

- **依赖 C0**：使用 C0 搭建的路由系统、Zustand store（useAuthStore）、主题系统、全局布局
- **被 C2~C7 依赖**：所有功能页面都需要登录态才能访问
- **修改文件**：useAuthStore 从骨架填充为完整实现，AuthGuard 从占位填充为真实逻辑
