## Why

Codemaker Dashboard 是一个从零开始的 Electron 桌面应用，需要先搭建项目脚手架和基础设施。所有后续功能模块（登录、聊天、Agents、Skills、MCP、设置）都依赖于统一的项目结构、路由系统、状态管理、主题系统和本地存储层。没有这个基座，后续 Change 无法独立开展。

## What Changes

- 初始化 Electron + Vite + React + TypeScript 项目结构
- 配置 Tailwind CSS + Ant Design 5 主题集成
- 搭建深色/浅色双主题切换基础设施（CSS 变量方案）
- 配置 React Router v6 路由系统（5 个一级路由）
- 搭建全局布局组件（左侧导航侧边栏 + 右侧内容区，参考 ChatGPT 风格）
- 初始化 Zustand store 骨架（auth、chat、agents、skills、mcp、settings）
- 封装 localStorage 持久化工具层
- 搭建 Mock 基础设施（mock 数据管理方案）

## Capabilities

### New Capabilities

- `electron-shell`: Electron 主进程 + 渲染进程配置，窗口管理，IPC 通信骨架
- `global-layout`: 全局布局组件，含可折叠的左侧导航栏和右侧内容区
- `routing`: React Router v6 路由配置，含路由守卫占位
- `theme-system`: 深色/浅色主题切换，CSS 变量方案，Ant Design + Tailwind 主题同步
- `state-management`: Zustand store 骨架和持久化中间件
- `storage-layer`: localStorage 封装层，提供类型安全的读写接口

### Modified Capabilities

（无，从零开始）

## Impact

- **新增依赖**：electron, vite, react, react-dom, react-router-dom, zustand, antd, tailwindcss, @types/*
- **项目结构**：从空仓库创建完整的 Electron + React 工程目录
- **构建系统**：Vite 开发服务器 + Electron 主进程热重载
- **后续 Change 全部依赖此基座**
