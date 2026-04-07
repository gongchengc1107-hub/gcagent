# Codemaker Dashboard — 变更总览

> 基于 PRD v1.0，全量实施拆分方案
> 技术栈：Electron + React + Zustand + Tailwind CSS + Ant Design
> 参考风格：ChatGPT Desktop

---

## 拆分方案

| Change | 目录名 | 名称 | 状态 | 预估 | 依赖 |
|--------|--------|------|------|------|------|
| C0 | c0-project-scaffold | 项目脚手架与基础设施 | ✅ DONE | 12h | — |
| C1 | c1-auth | 登录与认证 | ✅ DONE | 8h | C0 |
| C2 | c2-chat-core | 聊天核心功能 | ✅ DONE | 25h | C1 |
| C3 | c3-chat-advanced | 聊天高级功能 | ✅ DONE | 15h | C2 |
| C4 | c4-agents | Agents 管理 | ✅ DONE | 12h | C1 |
| C5 | c5-skills | Skills 管理 | ✅ DONE | 10h | C1 |
| C6 | c6-mcp | MCP 工具管理 | ✅ DONE | 15h | C1 |
| C7 | c7-settings | 设置页 | ✅ DONE | 10h | C1,C3 |
| C8 | c8-integration | 集成联调与打包 | ✅ DONE | 13h | C0~C7 |

**总预估：~120h**

---

## 依赖关系图

```
C0 (脚手架)
 └── C1 (登录)
      ├── C2 (聊天核心) → C3 (聊天高级)
      ├── C4 (Agents)
      ├── C5 (Skills)
      ├── C6 (MCP)
      └── C7 (设置) ← 依赖 C3
           └── C8 (集成) ← 依赖全部
```

---

## 状态说明

- ⬜ TODO — 未开始
- 🔵 DESIGN — 设计中
- 🟡 IMPLEMENT — 实施中
- ✅ DONE — 已完成
- ⛔ BLOCKED — 阻塞

---

## Mock 策略

- [x] 全量 Mock（接口未就绪）
- [ ] 部分 Mock（部分接口已就绪）
- [ ] 无需 Mock（接口全部就绪）

> MOCK_POINTS.md 记录所有 mock 点，接口就绪后逐一替换。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron (latest stable) |
| 前端框架 | React 18 |
| 构建工具 | Vite |
| 状态管理 | Zustand |
| UI 组件库 | Ant Design 5 |
| 样式 | Tailwind CSS |
| 路由 | React Router v6 |
| Markdown 渲染 | react-markdown + rehype-highlight |
| SSE 通信 | EventSource / fetch stream |
| 代码高亮 | highlight.js |
| 本地存储 | localStorage (会话/设置) + 文件系统 (MCP/Skills) |

---

## 各 Change 核心产出

### C0 — 项目脚手架与基础设施
- Electron + Vite + React 项目初始化
- 全局布局（左侧导航 + 右侧内容区）
- React Router 路由配置（5 个一级路由）
- Tailwind CSS + Ant Design 主题配置
- 深色/浅色主题切换基础设施
- Zustand store 骨架
- localStorage 封装层
- Mock 基础设施（mock server / mock utils）

### C1 — 登录与认证
- 登录页 UI（参考 ChatGPT 风格）
- 本地模拟 OAuth 登录
- 登录态持久化 + 启动检测
- 种子数据初始化（3 个内置 Agent + 示例会话）
- 路由守卫（未登录重定向）

### C2 — 聊天核心功能
- 会话列表侧边栏（时间分组、置顶、右键菜单）
- 新建/切换/重命名/删除会话
- 对话输入区（多行输入、Enter 发送、Shift+Enter 换行）
- 消息展示（流式 SSE 渲染、Markdown、代码高亮）
- 消息操作（复制、重发、编辑重发、重新生成、停止）
- Agent/模型选择下拉
- Token 用量提示
- ⌘K 会话搜索

### C3 — 聊天高级功能
- 工具调用 ThinkingBlock 展示（折叠/展开）
- 连接状态栏（connecting/connected/reconnecting/disconnected）
- Provider 模式切换（Codemaker / 直连）
- URL 识别与卡片展示
- 图片粘贴/拖拽上传
- AI 快捷选项按钮
- Skill `/` 命令快捷调用
- 草稿暂存

### C4 — Agents 管理
- Agent 列表页（内置 + 自定义区分）
- Agent 创建/编辑表单（名称、emoji、描述、Skills 关联、autoMode）
- Agent 删除（内置不可删）
- 自定义上限 10 个校验
- 磁盘文件单向同步（opencode/agents/*.md）

### C5 — Skills 管理
- Skill 列表页
- 三种安装方式（命令、上传、手动填写）
- Skill 启用/禁用
- Skill 编辑/删除
- Skill Hub 外部链接入口
- 磁盘持久化（opencode/skills/*.md）

### C6 — MCP 工具管理
- MCP 列表（内置只读 + 自定义可操作）
- 智能安装（粘贴配置自动解析）
- 手动添加表单（本地/远程两种类型）
- MCP 模板库（6 个预设模板）
- 状态轮询与实时展示
- 启用/禁用、编辑、删除
- 配置文件持久化

### C7 — 设置页
- 账户信息展示 + 退出登录
- AI Provider 模式切换 + 配置
- 消耗统计（月度图表）
- 外观设置（主题切换）
- 数据管理（清空所有数据）

### C8 — 集成联调与打包
- Mock 替换为真实接口（待接口就绪）
- 跨模块集成验证
- Electron 应用打包（macOS .dmg）
- 最终验收报告
