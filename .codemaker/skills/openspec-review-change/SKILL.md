# Skill: openspec-review-change

## 描述

对当前 change 的 `design.md` 进行 AI 设计审查（REVIEW 阶段），输出 `review.md`。

审查原则：**仅依赖指定文件作为 context，完全忽略当前对话历史记录**，保持审查视角干净中立。

---

## 触发时机

- 用户说"帮我 review 设计"、"执行 REVIEW"、"审查 design.md" 时
- `design.md` 已完成，准备进入 IMPLEMENT 阶段前

---

## 执行步骤

### Step 1：重置 context，只读取以下文件（不使用对话历史）

必须读取：
1. `openspec/config.yaml` — 项目规范和约束
2. `openspec/changes/{change-id}/.openspec.yaml` — 变更配置
3. `openspec/changes/{change-id}/proposal.md` — 变更目标
4. `openspec/changes/{change-id}/design.md` — 待审查的设计文档
5. `openspec/changes/{change-id}/tasks.md` — 任务清单（如已存在，同步审查）

> ⚠️ 审查时，**严格忽略当前会话中已有的实现代码、讨论内容、编辑历史**。只以上述文件作为唯一信息源。

---

### Step 1.5：读取 MasterGo 设计稿（如有）

检查 `design.md` 中是否包含 MasterGo 链接（格式如 `https://mastergo.com/goto/xxx` 或 `https://mastergo.com/file/xxx?layer_id=xxx`）。

**如果 design.md 中有 MasterGo 链接**：
- 使用 `mcp__getDsl` 工具读取设计稿结构（传入 `shortLink` 或 `fileId + layerId`）
- 将设计稿的层级结构、组件信息作为后续 UI 还原审查的依据

**如果 design.md 中没有 MasterGo 链接**：
- 主动询问用户：「本次变更是否有对应的 MasterGo 设计稿？如有请提供链接（支持短链 https://mastergo.com/goto/xxx 或完整 URL）」
- 用户提供后读取；用户明确表示无设计稿则跳过 UI 还原审查维度（在 review.md 中注明「无设计稿，跳过 UI 还原检查」）

> MasterGo 链接的正确提供方式：
> - **短链**：`https://mastergo.com/goto/xxxxxx`（推荐，最简便）
> - **完整链接**：`https://mastergo.com/file/{fileId}?layer_id={layerId}`
> - 在 MasterGo 中右键图层 → 「复制链接」即可获得上述格式

---

### Step 2：执行审查，逐项验证

按以下维度审查 `design.md`：

#### 2.1 结构完整性
- [ ] 是否包含 Context / Goals / Non-Goals / Decisions / Risks 五个章节
- [ ] Decisions 每条是否有：决策内容 + 理由 + 备选方案

#### 2.2 技术规范符合性（对照 config.yaml context）
- [ ] UI 组件是否使用 `@bedrock/components`，是否存在引入 Ant Design 的风险
- [ ] 样式方案是否使用 CSS 变量，是否存在硬编码颜色
- [ ] HTTP 请求是否通过 `src/OpenApiServices/`，是否有裸用 fetch/axios/直接调用 `ajax.ts` 的设计
- [ ] 权限设计是否通过 Redux state（`useTypedSelector` 获取 `state.account` / `state.organization`），是否存在硬编码角色字符串

#### 2.3 与 proposal 的一致性
- [ ] design.md 的目标是否覆盖 proposal.md 中的所有 What Changes
- [ ] Non-Goals 是否与 proposal 对齐

#### 2.4 风险评估
- [ ] Risks 章节是否列出主要风险
- [ ] 每条 Risk 是否有缓解措施

#### 2.5 可行性
- [ ] 技术选型是否与项目现有架构兼容
- [ ] 是否存在过度设计或不必要的复杂度

#### 2.7 UI 还原审查（仅当 Step 1.5 成功读取设计稿时执行）
- [ ] design.md 中描述的页面结构是否与设计稿层级一致
- [ ] 关键 UI 区域（列表、表单、弹窗、卡片等）是否在 design.md 的 Decisions 中有对应描述
- [ ] 设计稿中的交互细节（空状态、loading 态、错误态）是否在 design.md 中有提及
- [ ] 颜色 / 间距 / 字号是否按设计稿使用 CSS Token（而非硬编码）

#### 2.6 tasks.md 质量审查（如 tasks.md 已存在）
- [ ] 是否包含「权限/路由」「API」「页面骨架」「交互逻辑」「样式打磨」「测试验收」分组
- [ ] 最后一个分组是否是「测试与验收」并包含关键验收 checklist
- [ ] 是否列出所有涉及 API 的任务条目，并说明是否需要执行 `pnpm api:genapi`
- [ ] 每个任务粒度是否控制在 1-2 小时（是否存在模糊的大任务如「实现整个页面」）
- [ ] 是否遗漏了权限相关任务（如 Redux state 权限字段消费、页面级权限守卫组件）

---

### Step 3：生成 review.md

将审查结果以结构化格式写入 `openspec/changes/{change-id}/review.md`：

```markdown
# Design Review: {change-id}

**审查日期**: {date}
**审查结论**: APPROVED / NEEDS_REVISION / REJECTED

---

## 审查结论说明

{一段话总结整体评价}

---

## 问题清单

### 🚫 Blocking（必须修复才能进入 IMPLEMENT）

| # | 问题描述 | 位置 | 建议修改 |
|---|---------|------|---------|
| B1 | ... | design.md § Decisions | ... |

### ⚠️ Warning（建议修改）

| # | 问题描述 | 位置 | 建议修改 |
|---|---------|------|---------|
| W1 | ... | ... | ... |

### 💡 Suggestion（可选优化）

| # | 优化建议 | 理由 |
|---|---------|------|
| S1 | ... | ... |

---

## 验证清单

| 检查项 | 结论 |
|--------|------|
| 结构完整性（5 章节）| ✅ / ❌ |
| 使用 @bedrock/components | ✅ / ❌ |
| 无硬编码颜色 | ✅ / ❌ |
| HTTP 通过 OpenApiServices | ✅ / ❌ |
| 权限通过 Redux state（useTypedSelector） | ✅ / ❌ |
| 与 proposal 目标一致 | ✅ / ❌ |
| Risks 含缓解措施 | ✅ / ❌ |
| UI 还原：页面结构与设计稿一致 | ✅ / ❌ / N/A |
| UI 还原：交互状态在 design.md 中已描述 | ✅ / ❌ / N/A |

---

## 结论

- APPROVED：无 Blocking 问题，可进入 IMPLEMENT
- NEEDS_REVISION：存在 Blocking 问题，修复后重新 Review
- REJECTED：设计方向存在根本性问题，需重新设计
```

---

### Step 4：向用户汇报

汇报格式：
- 审查结论（APPROVED / NEEDS_REVISION / REJECTED）
- 列出所有 Blocking 问题（如有）
- 询问用户：是否立即修复 Blocking 问题，还是跳过继续 IMPLEMENT

---

## 注意事项

- **禁止**使用对话历史中已讨论的实现细节来"帮设计开脱"
- **禁止**主观降低问题严重级别
- 如果 `design.md` 不存在，停止并提示用户先完成 DESIGN 阶段
