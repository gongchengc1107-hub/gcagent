# Codemaker Dashboard 竞品 UI 设计分析报告

> 调研日期：2026-04-01 | 调研深度：L2 标准调研

---

## 竞品分析摘要

本报告针对 Codemaker Dashboard（本地桌面 AI 编程助手 GUI 控制台）的 5 个核心竞品进行 L2 标准调研，重点分析多会话布局、工具调用展示、模型切换交互、MCP 管理、状态与输入框设计 5 个维度。

**核心结论**：
- Cursor 在会话管理与 Agent 切换上设计最成熟
- Claude Desktop 在 MCP 扩展管理上体验最完善
- Continue.dev 代表了轻量嵌入式 AI 聊天的极简范式
- OpenAI Codex 展示了以「任务列表」为中心的多 Agent 并行模式
- Trae Solo 代表了「IDE + Chat-Builder 一体化」方向

**差异化建议**：Codemaker Dashboard 以独立桌面应用身份做到「IDE 级功能 + Launcher 级轻量感」。

---

## 参考竞品列表

| 竞品名称 | 分析维度 | 核心参考点 |
|---------|---------|---------|
| Cursor | 会话管理、Agent 切换、工具调用展示 | 底部状态栏、双下拉选择器、时间分组会话 |
| OpenAI Codex | 任务中心布局、Skill 管理 | 以任务/工作区为中心的导航、进度流 |
| Claude Desktop | MCP 扩展管理、ThinkingBlock | 可折叠 Thinking Block、Extensions 卡片列表 |
| Trae Solo | Agent 工作流、输入框布局 | @ 触发、步骤卡片、SOLO 进度展示 |
| Continue.dev | 轻量输入框、`/` 命令 | Slash Command 弹出、@ MCP 资源引用 |

---

## 功能布局参考

### 多会话聊天布局

**推荐方案**：Cursor + Claude Desktop 混合
- 会话列表独立在左侧面板，宽度 220-260px
- 右侧对话区全宽，比例约 1:3 至 1:4
- 时间分组：今天 / 昨天 / 本周 / 更早（参考 Claude Desktop）
- 当前选中态：左边框高亮线（4px primary 色）
- Hover 显示操作图标（编辑/删除）

### AI 工具调用过程（ThinkingBlock）

**推荐方案**：Claude Desktop Thinking Block
- ThinkingBlock 默认折叠，标题显示「正在推理...」或「已思考 Xs」
- ToolCall Block 展示工具名称 + 关键参数，结果可折叠
- 细边框 + 轻背景色区分执行过程与普通消息
- 执行完成：折叠为「✓ 已执行 N 个操作」摘要
- 颜色语义：思考=紫色、工具调用=橙色、完成=绿色

### Agent/模型切换入口

**推荐方案**：Cursor 底部输入框双选择器
- 左侧：Agent 模式切换（固定在输入框工具栏）
- 右侧：模型下拉（带「推荐」标签，弹出方向向上）
- 选中状态有高亮 Badge

### MCP 工具管理页面

**推荐方案**：Claude Desktop Extensions + OpenAI Codex Skills 卡片
- 已安装列表（卡片式）：图标 + 名称 + 描述 + 状态 Badge + 配置按钮
- 顶部「+ 添加 MCP」主按钮
- 每个 MCP 卡片：连接状态圆点 + 可用工具数量 + 启用/禁用 Toggle
- 分组：内置 MCP（只读）/ 自定义 MCP（可编辑）

### 会话列表右键菜单

**推荐方案**：Claude Desktop + Cursor
- 菜单项：重命名、置顶/取消置顶、导出（Markdown/JSON）、删除
- 删除需二次确认弹窗

### 连接状态展示

**推荐方案**：Cursor 底部状态栏范式
- 底部状态栏右侧：「● N 个 MCP 已连接」（绿色）
- 异常时变橙/红：「● 1 个 MCP 连接失败」
- 点击展开 Popover 查看各 MCP 详细状态

### 输入框区域

**推荐方案**：Continue.dev `@/` 语法 + Cursor 工具栏布局

```
┌──────────────────────────────────────────────────────┐
│  输入区域（多行可扩展，min 48px，max 200px）           │
└──────────────────────────────────────────────────────┘
  [📎 附件]  [/ Skill]      [Agent▼]  [模型▼]  [⬆ 发送]
```

---

## 交互路径参考

### 新建会话 → 选择 Agent → 发送

```
点击「+ 新会话」
  ↓ 进入空白对话区（欢迎语 + 常用 Skill 快捷入口）
  ↓ 键入内容 → 选择 Agent/模型（可选）
  ↓ Enter 发送
  ↓ 对话区：用户消息 → Thinking Block（加载中）→ 工具调用块 → AI 回复
```

### 添加 MCP 服务器

```
点击「MCP 管理」左侧导航
  ↓ 已安装列表（空态显示引导卡片）
  ↓ 点击「+ 添加服务器」→ 弹出 Modal
  ↓ 选择：智能安装（粘贴配置）/ 手动填写 / 模板库
  ↓ 保存后状态指示「连接中...」→「已连接 / 连接失败」
  ↓ Toast：「已添加 GitHub MCP，3 个工具可用」
```

---

## 状态展示参考

| 状态维度 | 颜色语义 | 位置 |
|---------|---------|------|
| AI 响应中 | 主题色蓝色 + 动画 | 消息区 typing indicator |
| Agent 执行中 | 橙色 spinner | 进度块 + 底部状态栏 |
| MCP 连接正常 | 绿色圆点 | MCP 卡片 + 底部状态栏 |
| MCP 连接异常 | 红色圆点 | 底部状态栏 + Hover Popover |
| 服务离线 | 灰色 | 底部状态栏 + 聊天区全局提示 |
| needs_auth | 橙色 + 引导按钮 | MCP 卡片 |

---

## 差异化设计点

| 差异化方向 | 说明 |
|-----------|------|
| 会话中心设计 | 将会话列表作为一级导航，而非 IDE 的附属面板 |
| MCP 管理一级页面 | 独立导航页，直观卡片管理，打造「MCP 工具市场」体验 |
| Skill 管理可视化 | 卡片含使用次数、触发词、`/` 快捷选择器 |
| ThinkingBlock 透明化 | 区分「规划/工具调用/推理」三层，支持调试模式 |
| 多 Agent 并行状态看板 | 运行中 Agent 任务摘要卡片，支持暂停/取消/查看日志 |

---

## 参考文献

| 来源 | 可信度 |
|------|--------|
| Cursor 官网 cursor.com | ⭐⭐⭐⭐⭐ |
| OpenAI Codex 产品页 | ⭐⭐⭐⭐⭐ |
| Claude Desktop MCP 帮助文档 | ⭐⭐⭐⭐⭐ |
| MCP 官方客户端列表 modelcontextprotocol.io | ⭐⭐⭐⭐⭐ |
| Trae Blog（设计升级/Agent系统）trae.ai/blog | ⭐⭐⭐⭐ |
| Continue.dev GitHub | ⭐⭐⭐⭐ |
