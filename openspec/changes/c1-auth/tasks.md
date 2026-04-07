## 1. 登录页 UI

- [ ] 1.1 创建 src/pages/Login/index.tsx 登录页组件（全屏居中布局，品牌 Logo + 标题 + 副标题 + 登录按钮）
- [ ] 1.2 实现 ChatGPT 风格视觉（深色渐变背景 / 白色卡片 / 简洁按钮），适配深色主题
- [ ] 1.3 实现登录按钮 loading 状态（模拟 500ms 延迟，防止重复点击）

## 2. 登录逻辑

- [ ] 2.1 填充 useAuthStore 的 login 函数（生成模拟用户信息，设置 isLoggedIn = true）
- [ ] 2.2 填充 useAuthStore 的 logout 函数（清除登录态）
- [ ] 2.3 实现登录成功后跳转到 /chat
- [ ] 2.4 实现登录异常处理（try-catch + 错误提示 message）

## 3. 路由守卫

- [ ] 3.1 填充 AuthGuard 组件真实逻辑（检查 isLoggedIn，未登录重定向 /login）
- [ ] 3.2 实现 Hydration 等待机制（Zustand persist 恢复完成前显示 loading）
- [ ] 3.3 实现已登录用户访问 /login 时重定向到 /chat

## 4. 种子数据初始化

- [ ] 4.1 定义 3 个内置 Agent 常量数据（Sisyphus / Explorer / Builder）
- [ ] 4.2 定义 1 条示例会话常量数据（含欢迎消息）
- [ ] 4.3 实现 initSeedData 函数（检查 hasInitializedSeedData 标志，写入 Agent 和会话数据到对应 store）
- [ ] 4.4 在 login 函数中调用 initSeedData

## 5. 退出登录

- [ ] 5.1 在设置页预留退出登录按钮（可先简单实现，C7 完善 UI）
- [ ] 5.2 实现退出确认弹窗（Ant Design Modal.confirm）
- [ ] 5.3 确认后调用 logout，跳转 /login

## 6. 验证

- [ ] 6.1 验证首次启动 → 登录页 → 点击登录 → 跳转聊天页流程
- [ ] 6.2 验证刷新/重启后自动跳转聊天页（登录态持久化）
- [ ] 6.3 验证退出登录 → 跳转登录页 → 受保护路由不可访问
- [ ] 6.4 验证种子数据仅首次初始化，退出重登不重复写入
