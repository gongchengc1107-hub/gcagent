---
name: large-requirement-workflow
description: 大需求拆分实施工作流。需求 >40h 或 >3 页面时触发，含拆分、设计、实施、集成四阶段。
compatibility:
  tools:
    - use_mcp_tool
    - read_file
    - edit_file
    - replace_in_file
    - list_files_recursive
    - ask_user_question
    - run_terminal_cmd
    - write_todo
---

# 大需求拆分实施工作流

## 概述

本 Skill 为**预估工时 > 40h 或涉及 > 3 个页面**的大型需求提供标准化的拆分、设计、实施和集成流程。
核心目标：**避免 LLM 上下文溢出，保证每个子任务可独立完成、进度可追踪、最终可集成。**

---

## 触发条件

当用户表达包含以下关键词/场景时触发：
- "做大需求"、"大需求开发"
- "拆分需求"、"拆分任务"
- "这个需求很大"、"预估 > 40h"
- AI 自行判断需求涉及 > 3 个页面或 > 5 个接口时，**主动建议**触发

---

## 前置条件

1. PRD 已就绪（`PRD/` 目录下有对应的 `.md` 文件，或用户提供了 POPO 文档链接）
2. 已了解设计稿情况（有 MasterGo 链接 or 无设计稿）
3. 已初步了解接口情况（可用 / 需 mock / 部分就绪）

> 如果前置条件不满足，先触发「需求分析工作流」Skill 完成需求分析。

---

## 阶段 0：拆分（Split）

### 目标
将大需求拆分为多个独立的 **Change**（变更单元），每个 Change 可在一个 LLM 会话内完成设计+实现。

### 执行步骤

#### 0.1 需求全貌分析

读取 PRD 文档，提取以下信息：

```markdown
## 需求画像
- **总预估工时**：{x}h
- **涉及页面数**：{n} 个
- **涉及接口数**：{m} 个
- **涉及角色**：{角色列表}
- **核心业务流**：{1-2 句话描述}
```

#### 0.2 拆分策略

按以下优先级选择拆分维度：

1. **按依赖层级**（优先）：基础设施 → 核心功能 → 衍生功能
2. **按功能模块**：独立页面/独立业务流拆为独立 Change
3. **按角色视角**：不同角色看到的功能拆开

拆分原则：
- 每个 Change 的实现预估 **不超过 20h**（对应 LLM 一个完整会话的合理上限）
- Change 之间的依赖关系必须**单向**（无环形依赖）
- 公共组件/权限/路由等基础设施放在 **C0**

#### 0.3 使用 ask_user_question 确认拆分方案

向用户展示拆分结果并确认：

```markdown
## 拆分方案

| Change | 名称 | 预估工时 | 依赖 | 核心产出 |
|--------|------|---------|------|---------|
| C0 | 基础设施 | {x}h | 无 | 路由配置, Redux 权限字段, 公共组件 |
| C1 | {模块名} | {x}h | C0 | {页面/组件} |
| C2 | {模块名} | {x}h | C0 | {页面/组件} |
| ... | ... | ... | ... | ... |

确认此拆分方案？
```

#### 0.4 生成 OVERVIEW.md

确认后创建 `openspec/changes/OVERVIEW.md`：

```markdown
# {需求名称} — 变更总览

## 拆分方案

| Change | 目录名 | 名称 | 状态 | 预估 | 依赖 |
|--------|--------|------|------|------|------|
| C0 | {dir} | {name} | ⬜ TODO | {x}h | — |
| C1 | {dir} | {name} | ⬜ TODO | {x}h | C0 |
| ... | ... | ... | ... | ... | ... |

## 状态说明
- ⬜ TODO — 未开始
- 🔵 DESIGN — 设计中
- 🟡 IMPLEMENT — 实施中
- ✅ DONE — 已完成
- ⛔ BLOCKED — 阻塞

## Mock 策略
- [ ] 全量 Mock（接口未就绪）
- [ ] 部分 Mock（部分接口已就绪）
- [ ] 无需 Mock（接口全部就绪）

> MOCK_POINTS.md 记录所有 mock 点，接口就绪后逐一替换。
```

#### 0.5 初始化 todo 列表

使用 `write_todo` 为每个 Change 创建一个任务条目，标记为 `pending`。

---

## 阶段 1：设计（Design）— 通过 openspec 标准流程

### 目标
为每个 Change 通过 openspec 标准流程产出完整的 artifact 套件（proposal.md → design.md → specs/ → tasks.md）。

### 模型要求（NON-NEGOTIABLE）

设计阶段（生成 proposal.md、design.md、specs/、tasks.md）必须使用模型 `netease-codemaker/claude-opus-4-6`。
如需启动 subagent 执行设计任务，subagent 的模型也必须指定为 `netease-codemaker/claude-opus-4-6`。

### 执行步骤

#### 1.1 按序初始化并设计

从 C0 开始，逐个 Change 执行以下流程：

##### Step A：用 openspec CLI 初始化 Change

```bash
openspec new change "{change-id}"
```

这会在 `openspec/changes/{change-id}/` 下创建 `.openspec.yaml`。

##### Step B：触发 `openspec-propose` Skill

对每个 Change 触发 `openspec-propose` Skill，传入以下上下文：
- PRD 中对应模块的内容
- 设计稿信息（如有 MasterGo 链接 → 使用 `mcp__getDsl` 读取）
- 现有代码结构分析（影响范围、可复用部分）
- OVERVIEW.md 中该 Change 的职责描述

`openspec-propose` 会按标准流程自动生成：
1. **proposal.md** — 通过 `openspec instructions proposal` 获取模板，产出 Why / What Changes / Capabilities / Impact
2. **design.md** — 通过 `openspec instructions design` 获取模板，产出 Context / Goals / Decisions / Risks
3. **specs/*.md** — 通过 `openspec instructions specs` 获取模板，产出功能规格
4. **tasks.md** — 通过 `openspec instructions tasks` 获取模板，产出任务清单

> **注意**：`openspec-propose` 内部会调用 `openspec instructions <artifact-id> --change "<name>" --json` 获取模板和规则，
> 并结合 config.yaml 中 `rules.proposal` / `rules.design` / `rules.tasks` 的约束来生成内容。
> 无需手动编写 design.md 结构，openspec 模板已包含标准结构。

#### 1.2 更新 OVERVIEW.md 状态

每个 Change 的 propose 完成后，更新对应状态为 `🔵 DESIGN`。

#### 1.3 批量设计 vs 逐个设计

- **推荐逐个设计**：完成一个 Change 的 propose → 用户确认 → 再设计下一个
- **允许批量设计**：如果用户说"设计部分你自己定就好了"，可以连续完成所有 Change 的 propose

---

## 阶段 2：实施（Implement）— 通过 openspec-apply-change

### 目标
逐 Change 触发 `openspec-apply-change` Skill，将 artifacts 转化为可运行代码。

### 模型要求（NON-NEGOTIABLE）

实施阶段编写代码时，**必须启动 subagent**，@coding-agent。
禁止由当前主 agent 直接编写实现代码，所有代码实现必须委托给 subagent 完成。

### 执行步骤

#### 2.1 执行顺序

严格按照 OVERVIEW.md 中的依赖顺序执行：C0 → C1 → C2 → ...

#### 2.2 单个 Change 实施流程（NON-NEGOTIABLE）

> **阶段 1 已通过 `openspec-propose` 生成了完整的 artifact 套件**（proposal.md、design.md、specs/、tasks.md），
> 因此阶段 2 无需再手动补齐文件，直接触发实施。

##### Step A：触发 `openspec-apply-change` Skill

对每个 Change 触发 `openspec-apply-change` Skill，它会：

1. **前置检查**：通过 `openspec status --change "<name>" --json` 验证所有 artifacts 已就绪
2. **读取上下文**：通过 `openspec instructions apply --change "<name>" --json` 获取 contextFiles 并读取
3. **逐任务实现**：
   - 声明当前任务 `▶ 正在实现：{分组} > {任务名}`
   - 编写代码 → **立即触发 `review-code` Skill 执行自查**（全部 10 项，必须实际运行工具验证，不允许凭记忆跳过）
   - **自查通过后**才可勾选 `- [x]`（禁止批量勾选）
   - **自查未通过**（存在 ❌ 项）→ 必须先修复，禁止进入下一个任务
   - 完成汇报 `✅ 完成：{任务名}（共 {n}/{total}）`
   - **禁止将代码输出到会话消息中**，所有代码必须通过 `edit_file` / `replace_in_file` 直接写入文件
4. **UI 任务完成后**自动触发 `design-qa-workflow` Skill 进行设计验收（如有设计稿）
5. **分组完成时**暂停等待用户确认

##### Step B：Mock 处理

- 实现过程中使用本地 mock 数据代替真实 API
- 每个 mock 点**实时**记录到 `openspec/changes/MOCK_POINTS.md`
- 代码中 mock 函数必须包含注释 `// MOCK_POINT: 替换为 services.xxx`

##### Step C：Change 完成

所有任务勾选完毕后：
1. **触发 `code-simplifier` Skill**：对本 Change 涉及的所有代码文件执行代码简化，确保代码清晰、一致、无冗余
2. 更新 OVERVIEW.md 状态为 `🟡 IMPLEMENT` → `✅ DONE`
3. 更新 todo 中对应条目为 `completed`
4. 告知用户当前总进度
5. 输出完成摘要（同 `openspec-apply-change` 的完成格式）

> **Commit 前强制代码简化**：每次执行 `git commit` 之前，必须先触发 `code-simplifier` Skill 对本次变更的代码进行简化优化。未执行代码简化就 commit 是禁止行为（见 `rules.mdc` 禁止项 #15）。

> **易协作单自动 Commit**：大需求模式下同样遵循 `openspec-apply-change` 的规范——如果需求分析阶段用户提供了易协作单（`ticketRef`），每个任务小点完成并勾选后，先执行 `code-simplifier` 简化代码，再执行 `git add -A && git commit -m "feat: refs {ticketRef}" -m "{任务名}"`。没有易协作单时跳过 commit 但仍需执行代码简化。

#### 2.3 Mock-First 策略（当接口未就绪时）

```markdown
## Mock 规范

### Mock 数据放置
- 页面级 mock：`src/pages/{Module}/_mock.ts`
- 组件级 mock：组件文件内 `const MOCK_DATA = {...}`

### Mock 接口函数
使用 Promise.resolve 包装，模拟异步行为：
```typescript
// ✅ 标准 mock 接口写法
const mockGetList = async (params: ListParams): Promise<ListResponse> => {
  // MOCK_POINT: 替换为 services.xxxController.getList
  return {
    code: 200,
    data: { list: MOCK_LIST, total: MOCK_LIST.length },
  };
};
```

### MOCK_POINTS.md 格式
```markdown
# Mock 替换清单

| # | 文件 | Mock 函数/变量 | 替换为 | 参数映射 | 状态 |
|---|------|--------------|--------|---------|------|
| 1 | src/pages/Supplier/Publish/index.tsx | mockGetTags() | services.tagController.getGroupTags | params.type→categoryType | ⬜ |
| 2 | ... | ... | ... | ... | ⬜ |
```

---

## 阶段 3：集成（Integration）

### 目标
所有 Change 完成后，替换 mock、跨模块验证、最终验收。

### 执行步骤

#### 3.1 接口替换

1. 执行 `pnpm api:genapi` 拉取最新接口定义
2. 逐行读取 `MOCK_POINTS.md`
3. 对每个 mock 点：
   - 确认真实接口存在于 `src/OpenApiServices/`（自动生成的接口文件）
   - 替换 mock 调用为真实接口调用
   - 调整参数映射（字段名、数据结构差异）
   - 在 MOCK_POINTS.md 中标记 `✅`

#### 3.2 跨 Change 集成验证

检查以下跨模块交互是否正常：
- 权限联动（C0 定义 → 各模块消费）
- 事件总线通信（列表刷新、状态同步）
- 路由跳转（页面间导航）
- 全局状态共享（useModel 数据一致性）

#### 3.3 最终验收

- 触发 `design-qa-workflow` 的整体验收阶段（如有设计稿）
- 输出最终验收报告

---

## 异常处理

### 上下文超限
- 当单个 Change 的实施对话过长时，**主动建议开新会话**
- 在新会话中说明：「继续 C{n} 的实施，请读取 `openspec/changes/{change-id}/tasks.md` 查看进度」

### Change 间出现环形依赖
- 立即停止，向用户展示依赖环
- 建议合并相关 Change 或重新拆分

### 接口迟迟不就绪
- 记录到 MOCK_POINTS.md，标记状态为 `⛔ BLOCKED`
- 继续其他 Change 的实施，不阻塞整体进度

### 需求变更
- 评估影响范围，确定哪些 Change 需要更新
- 更新 OVERVIEW.md 和对应 design.md
- 如果影响已完成的 Change，创建增量补丁 Change（如 C1-patch）

---

## 输出物清单

| 输出物 | 路径 | 生成阶段 |
|--------|------|---------|
| 变更总览 | `openspec/changes/OVERVIEW.md` | 阶段 0 |
| Change 配置 | `openspec/changes/{change-id}/.openspec.yaml` | 阶段 1（openspec CLI 自动生成） |
| 提案文档 | `openspec/changes/{change-id}/proposal.md` | 阶段 1（openspec-propose） |
| 设计文档 | `openspec/changes/{change-id}/design.md` | 阶段 1（openspec-propose） |
| 功能规格 | `openspec/changes/{change-id}/specs/*.md` | 阶段 1（openspec-propose） |
| 任务列表 | `openspec/changes/{change-id}/tasks.md` | 阶段 1（openspec-propose） |
| Mock 清单 | `openspec/changes/MOCK_POINTS.md` | 阶段 2（持续更新） |
| 验收报告 | `design-specs/{需求名称}/report.md` | 阶段 3 |

---

## 与其他 Skill 的协作关系

```
需求分析工作流 → [前置] → large-requirement-workflow
                              ├── openspec-propose [阶段 1：设计每个 Change]
                              ├── openspec-apply-change [阶段 2：实施每个 Change]
                              ├── design-qa-workflow [UI 验收]
                              ├── code-simplifier [代码简化]
                              ├── review-code [代码自查]
                              └── update-api [接口替换]
```

---

## 示例对话

### 示例 1：用户主动触发
```
用户：这个需求估计要 100h，涉及 8 个页面，我们用大需求模式来做
AI：好的，触发大需求拆分实施工作流。让我先分析需求全貌...
AI：[读取 PRD，分析页面/接口/角色]
AI：拆分方案如下：[展示表格]，确认吗？
用户：确认
AI：[生成 OVERVIEW.md，创建 todo 列表]
AI：开始 C0 设计...
```

### 示例 2：AI 主动建议
```
用户：做需求 [提供了一个复杂的 PRD 链接]
AI：[分析需求] 这个需求涉及 6 个页面、12 个接口，预估 > 80h。
AI：建议使用「大需求拆分实施工作流」，将需求拆分为多个独立 Change 分批实现。是否同意？
用户：同意
AI：[进入 large-requirement-workflow]
```
