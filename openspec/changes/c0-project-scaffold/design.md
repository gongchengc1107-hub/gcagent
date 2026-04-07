## Context

当前仓库（`/Users/netease/gcagent`）为空项目，需要从零搭建 Electron 桌面应用。目标是构建一个类似 ChatGPT Desktop 风格的 AI 助手控制台，仅支持 macOS 平台。

技术环境：Node v24.14.0 / npm 11.9.0 / macOS。

本 Change 是所有后续模块的基座，需要在架构层面为 8 个后续 Change 提供统一的基础设施。

## Goals / Non-Goals

**Goals:**

- 建立可运行的 Electron + Vite + React 开发环境
- 搭建 ChatGPT 风格的全局布局（侧边栏导航 + 内容区）
- 配置深色/浅色主题系统，确保 Tailwind CSS 与 Ant Design 主题同步
- 初始化路由、状态管理、本地存储等基础设施骨架
- 确保后续 Change 可独立接入，互不干扰

**Non-Goals:**

- 不实现任何具体业务功能（登录、聊天等属于后续 Change）
- 不对接任何真实后端 API
- 不实现 Electron 打包发布流程（属于 C8）
- 不实现 CI/CD 流水线

## Decisions

### D1: 构建工具选择 — Vite + electron-vite

**选择**：使用 `electron-vite` 作为构建工具

**理由**：
- 原生支持 Electron 主进程/渲染进程/预加载脚本三端构建
- 基于 Vite，开发体验优秀（HMR 快速）
- 社区活跃，与 Electron 最新版兼容良好
- 替代方案 electron-forge + webpack 配置繁琐，启动慢

### D2: 状态管理 — Zustand + persist 中间件

**选择**：Zustand 配合内置 `persist` 中间件

**理由**：
- 轻量（<2KB），API 简洁，学习成本低
- 内置 `persist` 中间件直接对接 localStorage，无需额外封装
- 支持 slice pattern 拆分 store，各模块独立管理
- 替代方案 Redux Toolkit 偏重，对本项目规模过度设计

### D3: 样式方案 — Tailwind CSS + Ant Design ConfigProvider

**选择**：Tailwind CSS 为主，Ant Design 通过 ConfigProvider token 同步主题

**理由**：
- Tailwind 提供原子化 CSS，开发效率高
- Ant Design 提供高质量复杂组件（Table、Form、Modal 等）
- 通过 CSS 变量统一主题色，Tailwind 和 Ant Design 共享同一套色值
- 替代方案 CSS Modules 需要手写大量样式，效率低

### D4: 主题实现 — CSS 变量 + html[data-theme] 属性

**选择**：在 `:root` 定义 CSS 变量，通过 `html[data-theme="dark"]` 切换

**理由**：
- 性能好，切换主题只需改 DOM 属性，无需重渲染
- Tailwind 和 Ant Design 都可引用同一套 CSS 变量
- 支持后续扩展更多主题

### D5: 路由方案 — React Router v6 createHashRouter

**选择**：使用 `createHashRouter`（Hash 路由）

**理由**：
- Electron 应用使用文件协议加载，Hash 路由兼容性最佳
- 无需服务端配置
- 替代方案 createBrowserRouter 在 Electron file:// 协议下有兼容问题

### D6: 项目目录结构

```
codemaker-dashboard/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 主进程入口
│   └── preload.ts               # 预加载脚本
├── src/                         # 渲染进程（React 应用）
│   ├── assets/                  # 静态资源
│   ├── components/              # 公共组件
│   │   └── Layout/              # 全局布局
│   ├── pages/                   # 页面组件
│   │   ├── Chat/
│   │   ├── Agents/
│   │   ├── Skills/
│   │   ├── MCP/
│   │   └── Settings/
│   ├── stores/                  # Zustand stores
│   ├── hooks/                   # 自定义 Hooks
│   ├── utils/                   # 工具函数
│   ├── styles/                  # 全局样式 + 主题变量
│   ├── router/                  # 路由配置
│   ├── types/                   # TypeScript 类型定义
│   ├── App.tsx
│   └── main.tsx                 # 渲染进程入口
├── electron-vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Risks / Trade-offs

- **[Risk] electron-vite 版本兼容** → 使用 latest stable 版本，锁定 lockfile
- **[Risk] Tailwind + Ant Design 样式冲突** → 配置 Tailwind prefix 或精确 reset，Ant Design 使用 ConfigProvider 隔离
- **[Risk] 主题 CSS 变量维护成本** → 定义集中的 theme token 文件，统一管理
- **[Trade-off] Zustand persist 全量序列化** → 大数据量（如消息历史）可能导致 localStorage 写入延迟，后续 C2 需评估是否分片存储
