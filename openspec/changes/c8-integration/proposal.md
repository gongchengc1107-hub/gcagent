## Why

前续 C0~C7 实现了所有功能模块，但全部使用 Mock 数据。C8 作为收尾 Change，需要完成：Mock 层抽象（为未来真实 API 切换做准备）、Electron 打包配置（macOS .dmg）、全局快捷键绑定、以及端到端验收。C8 确保应用从开发态进入可分发的完整桌面应用状态。

## What Changes

- 抽象 Mock 层为 Service 接口，便于未来替换为真实 API
- 配置 electron-builder 打包（macOS .dmg）
- 实现全局快捷键（⌘K 会话搜索、Enter 发送、Shift+Enter 换行）
- Electron 主进程补全（窗口管理、IPC 通道注册、自动重启 serve）
- 端到端验收（所有功能路径通过）

## Capabilities

### New Capabilities

- `mock-to-real`: Mock Service 抽象层，统一 Mock/Real 切换点
- `electron-packaging`: electron-builder 打包配置，macOS .dmg 产物
- `keyboard-shortcuts`: 全局快捷键绑定
- `e2e-validation`: 端到端功能验收清单

### Modified Capabilities

- C0~C7 中散落的 Mock 调用统一收口到 Service 层

## Impact

- **依赖 C0~C7**：所有功能模块已实现
- **产出**：可分发的 macOS .dmg 安装包
- **Mock 切换**：Service 层设计使后续真实 API 接入只需替换 Service 实现
