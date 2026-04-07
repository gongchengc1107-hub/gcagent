## Context

C0~C7 全部使用 Mock 数据实现。`codemaker serve` API 完全未就绪，因此 C8 不做真实联调，而是完成 Mock 层抽象（Service Pattern）和 Electron 打包。全局快捷键在 PRD 中有明确定义（⌘K / Enter / Shift+Enter / Ctrl+V）。PRD 要求仅支持 macOS。

## Goals / Non-Goals

**Goals:**

- 将分散的 Mock 调用收口到统一的 Service 接口
- 配置 electron-builder 生成 macOS .dmg
- 实现 PRD 定义的全局快捷键
- Electron 主进程完善（窗口管理、IPC 注册、Config Proxy）
- 完成端到端功能验收

**Non-Goals:**

- 不实现真实 API 调用（codemaker serve 未就绪）
- 不实现 Windows / Linux 打包
- 不实现自动更新
- 不实现 CI/CD 流水线

## Decisions

### D1: Service 抽象层设计

**选择**：Interface + Mock Implementation 模式

**理由**：
- 定义 Service 接口（如 IChatService、IAuthService、IMCPService 等）
- Mock 阶段提供 MockChatService、MockAuthService 等实现
- 通过 ServiceProvider 统一管理，依赖注入
- 切换到真实 API 时只需新增 RealChatService 等实现，替换 Provider 配置
- Service 文件统一放在 `src/services/` 目录

### D2: Electron 打包配置

**选择**：electron-vite 内置的 electron-builder 配置

**理由**：
- electron-vite 已集成 electron-builder
- 配置 `electron-builder.yml`：macOS target 为 dmg + zip
- App 信息：名称 "Codemaker Dashboard"、Bundle ID "com.netease.codemaker-dashboard"
- 图标使用占位 icon（后续替换正式图标）
- 代码签名暂跳过（内部分发不需要 Apple Notarize）

### D3: 全局快捷键方案

**选择**：渲染进程 keydown 事件 + Electron globalShortcut 混合

**理由**：
- ⌘K（会话搜索）：Electron globalShortcut 注册，确保窗口聚焦时全局生效
- Enter / Shift+Enter：在消息输入框组件内监听 keydown 事件
- Ctrl/Cmd+V（图片粘贴）：在输入框 onPaste 事件中处理
- 不需要应用失焦时的快捷键

### D4: Electron 主进程补全

**选择**：完善 main.ts 中的窗口管理和 IPC 通道

**理由**：
- 窗口管理：单窗口、macOS 红绿灯、关闭窗口 = 隐藏到 Dock（macOS 标准行为）
- IPC 通道汇总注册：fs 读写（MCP 配置、Agent/Skill 文件）、shell.openExternal、CLI 执行
- Config Proxy：5175 端口代理（PRD 要求），Mock 阶段仅启动占位
- codemaker serve 自动重启：Mock 阶段不实现真实逻辑，仅预留 Hook

## Risks / Trade-offs

- **[Risk] DMG 打包体积过大** → 缓解：排除 node_modules devDependencies，使用 asar 打包
- **[Risk] macOS 代码签名** → 缓解：内部分发暂跳过，后续需要时补上
- **[Trade-off] Service 抽象增加代码量** → 但为真实 API 接入铺平道路，值得
