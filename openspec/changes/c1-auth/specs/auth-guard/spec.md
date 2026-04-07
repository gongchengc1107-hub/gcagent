## ADDED Requirements

### Requirement: 受保护路由拦截
AuthGuard SHALL 包裹所有受保护路由（/chat, /agents, /skills, /mcp, /settings），未登录用户访问时重定向到 /login。

#### Scenario: 未登录访问受保护路由
- **WHEN** 未登录用户直接访问 /chat
- **THEN** 自动重定向到 /login

#### Scenario: 已登录访问受保护路由
- **WHEN** 已登录用户访问 /agents
- **THEN** 正常渲染 Agents 页面

### Requirement: 登录后重定向
已登录用户访问 /login SHALL 自动重定向到 /chat。

#### Scenario: 已登录访问登录页
- **WHEN** 已登录用户手动访问 /login
- **THEN** 自动重定向到 /chat

### Requirement: Hydration 等待
AuthGuard SHALL 等待 Zustand persist 的 hydration 完成后再做路由判断，hydration 期间展示 loading 状态。

#### Scenario: Hydration 期间
- **WHEN** 应用刚启动，Zustand 正在从 localStorage 恢复数据
- **THEN** AuthGuard 展示全屏 loading（如 Spin），不做任何跳转

#### Scenario: Hydration 完成
- **WHEN** Zustand 数据恢复完毕
- **THEN** AuthGuard 根据 isLoggedIn 状态决定放行或重定向
