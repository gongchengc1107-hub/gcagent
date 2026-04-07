## Context

C1 已在种子数据中初始化了 3 个内置 Agent（Sisyphus / Explorer / Builder）到 useAgentStore。C4 需要在此基础上实现完整的 Agents 管理页面，支持 CRUD 和磁盘同步。

PRD 约束：自定义 Agent 上限 10 个（不含内置），内置 Agent 可编辑（除名称外）但不可删除，磁盘同步为单向（磁盘 → 界面）。

## Goals / Non-Goals

**Goals:**

- 实现完整的 Agents 管理页（列表 + CRUD）
- 区分内置 Agent 和自定义 Agent 的操作权限
- 实现 Agent 与 Skills 的关联选择
- 实现磁盘 `.md` 文件的单向同步

**Non-Goals:**

- 不实现 Agent 的实际调度执行逻辑（属于后端 `codemaker serve`）
- 不实现界面 Agent 写入磁盘（单向：磁盘 → 界面）
- 不实现 Agent 的提示词编辑器（系统提示词由后端管理）

## Decisions

### D1: Agent 列表页布局

**选择**：卡片网格布局（每行 3 个卡片），内置 Agent 在上方独立区域，自定义 Agent 在下方

**理由**：
- 卡片展示更直观，每个 Agent 显示 emoji + 名称 + 描述 + 标签
- 内置和自定义分区有助于用户区分
- 右上角"创建 Agent"按钮
- 参考 ChatGPT 的 GPTs 管理页风格

### D2: Agent 数据结构

**选择**：

```typescript
interface Agent {
  id: string;
  name: string;           // 前端显示名
  backendName: string;    // 后端 API 名称
  emoji: string;          // emoji 图标
  description: string;
  skillIds: string[];     // 关联的 Skill ID 列表
  autoMode: boolean;      // 自动模式开关
  isBuiltin: boolean;     // 是否内置
  isFromDisk: boolean;    // 是否来自磁盘同步
  createdAt: number;
  updatedAt: number;
}
```

**理由**：
- `name` 和 `backendName` 分离，满足 PRD 要求的前后端名称映射
- `isBuiltin` 控制删除权限，`isFromDisk` 标识来源
- `skillIds` 建立 Agent → Skills 的关联关系

### D3: 创建/编辑表单方案

**选择**：Ant Design Drawer（抽屉）从右侧滑出，包含表单字段

**理由**：
- 抽屉比 Modal 更适合表单场景，空间更大
- 表单字段：名称（input）、emoji（emoji picker 或 input）、描述（textarea）、关联 Skills（多选下拉）、autoMode（switch）
- 创建和编辑共用同一个 Drawer 组件，通过 mode 区分
- emoji 选择：简化为直接输入 emoji 字符（避免引入重型 emoji picker 库）

### D4: 磁盘同步方案

**选择**：通过 Electron IPC 调用主进程 fs 模块，扫描 `opencode/agents/` 目录下的 `.md` 文件，解析 frontmatter 提取 Agent 配置

**理由**：
- `.md` 文件格式：YAML frontmatter（name, description, emoji 等）+ Markdown body（系统提示词）
- 同步时机：应用启动时 + Agents 页进入时
- 单向同步：磁盘文件变更覆盖界面数据，界面创建的 Agent 不写回磁盘
- 磁盘 Agent 标记 `isFromDisk: true`，UI 上显示"来自磁盘"标签

### D5: 自定义上限校验

**选择**：创建时前端校验，当前自定义 Agent 数量 ≥ 10 时禁止创建，"创建"按钮禁用并显示 Tooltip 提示

**理由**：
- 简单直接，前端校验即可
- 不含内置 Agent 和磁盘 Agent 的计数

## Risks / Trade-offs

- **[Risk] 磁盘文件格式不规范** → 缓解：解析失败时跳过该文件，console 警告，不影响其他 Agent
- **[Risk] emoji 输入兼容性** → 缓解：使用 input 直接输入，显示时用系统 emoji 渲染，不依赖第三方库
- **[Trade-off] 内置 Agent 可编辑描述但不可改名** → PRD 要求，实现时禁用名称字段
