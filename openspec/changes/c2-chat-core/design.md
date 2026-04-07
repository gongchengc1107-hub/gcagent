## Context

C0 已搭建项目脚手架（Electron + Vite + React + Zustand + Tailwind + Ant Design），C1 已实现登录流程和种子数据初始化。聊天页是 PRD 中最复杂的页面，本 Change（C2）聚焦核心交互链路，将高级功能拆分到 C3。

聊天页布局参考 ChatGPT Desktop：左侧会话列表（嵌入全局侧边栏的 Chat 导航下方）+ 右侧对话区域（输入框在底部，消息从上到下排列）。

后端（`codemaker serve`）未就绪，所有 AI 交互使用 Mock 数据模拟，包括 SSE 流式输出。

## Goals / Non-Goals

**Goals:**

- 实现完整的多会话管理（CRUD、分组、置顶、搜索、导出）
- 实现消息收发核心链路（输入 → 发送 → Mock SSE 流式回复 → 渲染）
- 实现 Markdown + 代码高亮渲染
- 实现所有消息操作（复制、重发、编辑重发、重新生成、停止）
- ChatGPT 风格的会话列表和对话界面

**Non-Goals:**

- 不实现工具调用展示（ThinkingBlock）→ C3
- 不实现 URL 识别和卡片展示 → C3
- 不实现图片附件上传 → C3
- 不实现 AI 快捷选项按钮 → C3
- 不实现 Skill `/` 命令调用 → C3
- 不实现草稿暂存 → C3
- 不实现连接状态监控 → C3
- 不实现真实 SSE 对接（使用 Mock 模拟）

## Decisions

### D1: 聊天页布局结构

**选择**：聊天页内部分为左右两栏 — 左侧会话列表面板 + 右侧对话面板

**理由**：
- 会话列表属于 Chat 导航的子内容，与全局侧边栏导航不同层级
- 参考 ChatGPT：全局导航折叠后，聊天页仍有自己的会话列表
- 会话列表面板宽度固定 260px，可独立滚动
- 替代方案（会话列表放在全局侧边栏内）会让侧边栏过于复杂

### D2: 会话数据结构

**选择**：

```typescript
interface Session {
  id: string;
  title: string;
  createdAt: number;    // timestamp
  updatedAt: number;    // timestamp
  isPinned: boolean;
  agentId: string;      // 关联的 Agent
  modelId: string;      // 使用的模型
}

interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  isStreaming?: boolean; // 是否正在流式输出
}
```

**理由**：
- 会话和消息分离存储，会话列表加载不需要读取全部消息
- `isPinned` 用于置顶排序
- `updatedAt` 用于时间分组和排序
- `isStreaming` 标记当前正在流式输出的消息

### D3: 流式输出 Mock 方案

**选择**：使用 `setInterval` 模拟逐字输出，每 30ms 追加一个字符到消息 content

**理由**：
- 无需搭建 Mock SSE 服务器，纯前端模拟
- 视觉效果接近真实 SSE 流式输出
- 后续 C3/C8 替换为真实 EventSource 时，只需替换数据源层
- Mock 回复内容使用预定义的 Markdown 文本（含标题、列表、代码块），验证渲染能力

### D4: 会话时间分组策略

**选择**：按以下规则分组显示 — 置顶 / 今天 / 昨天 / 本周 / 更早

**理由**：
- 与 PRD 要求一致
- 使用 `updatedAt` 字段进行分组计算
- 置顶会话始终在最上方，独立分组

### D5: Markdown 渲染方案

**选择**：`react-markdown` + `remark-gfm`（GFM 支持）+ `rehype-highlight`（代码高亮）

**理由**：
- react-markdown 是 React 生态最成熟的 Markdown 渲染库
- remark-gfm 支持表格、删除线、任务列表等 GFM 扩展
- rehype-highlight 基于 highlight.js，语言覆盖面广
- 替代方案 markdown-it 需要 dangerouslySetInnerHTML，安全性差

### D6: 会话搜索 ⌘K 实现

**选择**：使用 Ant Design Modal 实现全局搜索弹窗，监听 ⌘K 全局快捷键

**理由**：
- 搜索弹窗居中弹出，输入框自动聚焦
- 搜索范围为会话标题的模糊匹配（前端 filter）
- 选中搜索结果后自动切换到对应会话并关闭弹窗
- 无需后端搜索，数据量在前端可控

### D7: 右键菜单实现

**选择**：自定义 ContextMenu 组件（绝对定位 div），不使用 Ant Design Dropdown

**理由**：
- 原生右键菜单体验更好（跟随鼠标位置弹出）
- Ant Design Dropdown 的 trigger="contextMenu" 在定位上不够精确
- 自定义实现可完全控制样式和动画

### D8: 模型列表

**选择**：硬编码 20+ 个模型选项，分组显示

**理由**：
- PRD 要求支持 Claude、GPT、Gemini、DeepSeek、Kimi、Qwen 等
- 当前无后端动态获取，先硬编码
- 分组：Anthropic / OpenAI / Google / DeepSeek / Moonshot / Alibaba

## Risks / Trade-offs

- **[Risk] 消息量大时 localStorage 性能** → 单个会话消息超过 500 条时可能出现写入延迟。缓解：useChatStore 的 persist 使用 partialize 只持久化必要字段，消息按会话分片存储
- **[Risk] react-markdown 渲染性能** → 长消息渲染可能卡顿。缓解：流式输出时使用 memo + 仅更新最后一条消息
- **[Risk] 右键菜单在 Electron 中的兼容性** → Electron 默认有原生右键菜单。缓解：在 preload 中禁用默认右键菜单
- **[Trade-off] 会话搜索仅匹配标题** → 不搜索消息内容。可接受，消息内容搜索性能开销大，且需求优先级低
