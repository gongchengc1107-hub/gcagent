## 1. 项目初始化

- [ ] 1.1 使用 electron-vite 创建项目骨架（Electron + Vite + React + TypeScript）
- [ ] 1.2 配置 package.json scripts（dev, build, preview）
- [ ] 1.3 配置 tsconfig.json（路径别名 `@/` → `src/`）
- [ ] 1.4 安装核心依赖（react-router-dom, zustand, antd, tailwindcss, postcss, autoprefixer）

## 2. 样式与主题系统

- [ ] 2.1 配置 Tailwind CSS（tailwind.config.ts，引用 CSS 变量作为颜色值）
- [ ] 2.2 创建 CSS 变量主题文件（src/styles/themes.css），定义 light/dark 两套变量
- [ ] 2.3 配置 Ant Design ConfigProvider 主题 token 同步 CSS 变量
- [ ] 2.4 实现主题切换工具函数（setTheme/getTheme），操作 html[data-theme] 属性
- [ ] 2.5 确保应用启动时从 localStorage 恢复主题，无白屏闪烁

## 3. 路由配置

- [ ] 3.1 创建 src/router/index.tsx，使用 createHashRouter 配置所有一级路由
- [ ] 3.2 创建各页面占位组件（Chat, Agents, Skills, MCP, Settings, Login）
- [ ] 3.3 实现 AuthGuard 组件骨架（默认放行，预留 C1 接入认证逻辑）
- [ ] 3.4 配置布局路由嵌套（登录页独立布局，其他页面共享全局布局）
- [ ] 3.5 配置未知路由重定向到 /chat

## 4. 全局布局

- [ ] 4.1 创建 Layout 组件（左侧侧边栏 + 右侧 Outlet 内容区）
- [ ] 4.2 实现侧边栏导航（5 个一级导航项：Chat, Agents, Skills, MCP, Settings，含图标）
- [ ] 4.3 实现侧边栏折叠/展开功能（折叠后仅显示图标，宽度 64px；展开 240px）
- [ ] 4.4 实现导航项高亮（当前路由对应的导航项高亮显示）
- [ ] 4.5 ChatGPT 风格视觉还原（深色侧边栏、简洁现代风格）

## 5. 状态管理

- [ ] 5.1 创建 Zustand store 目录结构和类型定义
- [ ] 5.2 实现 useAuthStore 骨架（isLoggedIn, user, login, logout）
- [ ] 5.3 实现 useChatStore 骨架（sessions, currentSessionId, messages）
- [ ] 5.4 实现 useAgentStore 骨架（agents, currentAgent）
- [ ] 5.5 实现 useSkillStore 骨架（skills）
- [ ] 5.6 实现 useMCPStore 骨架（mcpList, statuses）
- [ ] 5.7 实现 useSettingsStore 骨架（theme, provider, apiConfig）
- [ ] 5.8 配置 persist 中间件（auth, chat, agents, skills, settings 持久化到 localStorage）

## 6. 本地存储层

- [ ] 6.1 创建 STORAGE_KEYS 常量文件
- [ ] 6.2 实现类型安全的 storage 工具（get/set/remove），含 JSON 序列化和异常处理

## 7. Electron 主进程

- [ ] 7.1 配置 electron/main.ts（窗口创建，默认 1280x800，最小 960x600）
- [ ] 7.2 配置 electron/preload.ts（IPC 通信骨架，contextBridge 暴露安全 API）
- [ ] 7.3 验证开发环境热重载（渲染进程 HMR + 主进程自动重启）

## 8. 验证

- [ ] 8.1 运行 `npm run dev` 验证应用正常启动
- [ ] 8.2 验证所有路由页面可正常切换
- [ ] 8.3 验证主题切换功能正常（浅色 ↔ 深色）
- [ ] 8.4 验证侧边栏折叠/展开功能正常
