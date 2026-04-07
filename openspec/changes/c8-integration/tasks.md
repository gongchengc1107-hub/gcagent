## 1. Service 抽象层

- [ ] 1.1 创建 src/services/interfaces/ 目录，定义 IAuthService / IChatService / IMCPService / IProviderService / IFileService 接口
- [ ] 1.2 创建 src/services/mock/ 目录，将 C1~C7 中散落的 Mock 逻辑收口到对应 Mock 实现类
- [ ] 1.3 创建 ServiceProvider（React Context），根据 VITE_USE_MOCK 环境变量注入 Mock 或 Real 实现
- [ ] 1.4 重构各模块代码，将直接的 Mock 调用改为通过 ServiceProvider 获取 Service 实例

## 2. Electron 主进程补全

- [ ] 2.1 完善 main.ts 窗口管理（单窗口、默认尺寸 1280x800、最小 960x600）
- [ ] 2.2 实现 macOS 关闭行为（关闭 = 隐藏到 Dock、Dock 点击恢复窗口）
- [ ] 2.3 汇总注册所有 IPC 通道（fs / mcp / shell / cli）
- [ ] 2.4 实现 Config Proxy 占位（5175 端口，Mock 阶段返回空响应）
- [ ] 2.5 预留 codemaker serve 自动重启 Hook（Mock 阶段为空实现）

## 3. 全局快捷键

- [ ] 3.1 实现 ⌘K 快捷键（Electron globalShortcut → 通过 IPC 通知渲染进程聚焦搜索）
- [ ] 3.2 确认 Enter / Shift+Enter 在 MessageInput 组件中正确处理（C2 已实现，验证即可）
- [ ] 3.3 确认 Ctrl/Cmd+V 图片粘贴在 MessageInput 中正确处理（C3 已实现，验证即可）

## 4. Electron 打包

- [ ] 4.1 配置 electron-builder.yml（macOS target: dmg + zip、App 名称、Bundle ID）
- [ ] 4.2 准备占位 App 图标（icon.icns）
- [ ] 4.3 配置 package.json build scripts（build:mac）
- [ ] 4.4 测试打包流程（npm run build → 验证 dist/ 产物）

## 5. 端到端验收

- [ ] 5.1 验收路径 1：登录 → 聊天 → 发消息 → 流式回复 → 工具调用展示
- [ ] 5.2 验收路径 2：Agent 列表 → CRUD → 聊天页切换 Agent
- [ ] 5.3 验收路径 3：Skill 列表 → 安装 → 编辑 → 启用/禁用 → 删除
- [ ] 5.4 验收路径 4：MCP 列表 → 智能安装 → 手动添加 → 模板 → 编辑 → 删除
- [ ] 5.5 验收路径 5：设置页 5 个子页面功能正常
- [ ] 5.6 验收路径 6：深色/浅色主题全页面切换无异常
- [ ] 5.7 验收路径 7：DMG 安装后应用启动正常
