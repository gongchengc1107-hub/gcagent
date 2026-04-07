## 1. MCP 列表页

- [ ] 1.1 创建 src/pages/MCPTools/index.tsx 页面组件（标题 + "添加 MCP" 按钮 + "刷新状态" 按钮）
- [ ] 1.2 实现 MCPCard 卡片组件（图标、名称、类型标签、状态徽章、启用开关、操作按钮）
- [ ] 1.3 实现状态徽章组件 MCPStatusBadge（5 种状态颜色映射 + 动画过渡）
- [ ] 1.4 实现内置 MCP 区域（3 个内置 MCP 卡片，无编辑/删除，显示"内置"角标）
- [ ] 1.5 实现自定义 MCP 区域（卡片列表 + 空列表引导状态）
- [ ] 1.6 实现启用/禁用 Switch 切换（更新 useMCPStore + 触发配置持久化）
- [ ] 1.7 实现删除确认弹窗 + 删除逻辑（store + 配置文件同步）

## 2. 智能安装

- [ ] 2.1 创建 AddMCPModal 添加弹窗组件（Modal + 3 个 Tab：智能安装 / 手动添加 / 模板库）
- [ ] 2.2 实现 SmartInstallTab 组件（大文本输入框 + "识别" 按钮）
- [ ] 2.3 实现多格式解析器 parseMCPInput()（JSON → URL → Bearer Token → 无法识别）
- [ ] 2.4 实现识别结果预览卡片组件（名称可编辑、类型、配置详情）
- [ ] 2.5 实现确认写入逻辑（创建 MCPConfig → 写入 Store → 持久化 → 关闭弹窗）

## 3. 手动添加

- [ ] 3.1 实现 ManualAddTab 组件（类型切换 local/remote + 动态表单）
- [ ] 3.2 实现本地 MCP 表单（名称、command、args、env 编辑器）
- [ ] 3.3 实现远程 MCP 表单（名称、URL、Headers 编辑器）
- [ ] 3.4 实现 EnvEditor 环境变量动态 Key-Value 编辑器（添加/删除行、敏感值遮蔽）
- [ ] 3.5 实现表单验证（必填校验、名称唯一性、URL 格式）
- [ ] 3.6 实现编辑模式复用（打开弹窗预填现有配置，按钮文字切换为"保存修改"）

## 4. 模板库

- [ ] 4.1 实现 TemplatesTab 组件（3x2 网格展示 6 个模板卡片）
- [ ] 4.2 定义 MCP_TEMPLATES 静态常量（6 个模板：Filesystem / GitHub / PostgreSQL / Brave Search / Puppeteer / Slack）
- [ ] 4.3 实现模板选择 → 自动切换到手动添加 Tab 并预填配置

## 5. 状态轮询

- [ ] 5.1 实现 useMCPStatusPolling() 自定义 Hook（进入页面开始、离开停止、30s 间隔）
- [ ] 5.2 实现 Mock 状态检测函数（enabled → connected, disabled → disconnected, 200-500ms 延迟）
- [ ] 5.3 实现手动刷新按钮逻辑（立即检测 + 重置计时器）
- [ ] 5.4 实现状态变更通知（连接断开时显示 warning 消息提示）

## 6. 配置持久化

- [ ] 6.1 实现 Electron IPC 通道注册（mcp:read-config / mcp:write-config / mcp:get-config-path）
- [ ] 6.2 实现配置文件读取（启动时读取 opencode.json → 解析 mcpServers → 合并内置 MCP → 写入 Store）
- [ ] 6.3 实现配置文件写入（MCP 增删改 → 序列化 JSON → IPC 写入文件）
- [ ] 6.4 实现配置文件不存在时创建默认文件（仅含内置 MCP）
- [ ] 6.5 实现保存后提示 "配置已保存。如需生效，请重启 codemaker serve"

## 7. 数据层

- [ ] 7.1 填充 useMCPStore 完整实现（mcps 列表、CRUD 方法、状态更新）
- [ ] 7.2 实现 MCPConfig 类型定义（含 D2 定义的完整字段）
- [ ] 7.3 实现 3 个内置 MCP 常量定义（Web Search / Context7 / Grep App）

## 8. 验证

- [ ] 8.1 验证 MCP 列表页正确展示内置和自定义 MCP
- [ ] 8.2 验证智能安装（JSON / URL / Token 三种格式识别正确）
- [ ] 8.3 验证手动添加（本地/远程两种表单正常提交）
- [ ] 8.4 验证模板库（选择模板后正确预填表单）
- [ ] 8.5 验证启用/禁用/编辑/删除操作正常
- [ ] 8.6 验证状态轮询（进入页面开始、离开停止、手动刷新）
- [ ] 8.7 验证配置持久化（增删改后 opencode.json 正确更新）
- [ ] 8.8 验证深色/浅色主题下页面视觉正确
