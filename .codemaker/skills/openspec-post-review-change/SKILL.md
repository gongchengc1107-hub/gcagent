# Skill: openspec-post-review-change

## 描述

对当前 change 已实现的代码进行 AI 代码审查（POST-REVIEW 阶段），对比 `tasks.md` 验证实现是否符合要求，输出 `post-review.md`。

审查原则：**仅依赖指定文件和代码作为 context，完全忽略当前对话历史记录**，保持审查视角干净中立。

---

## 触发时机

- 用户说"帮我 post-review"、"执行 POST-REVIEW"、"审查代码实现" 时
- `tasks.md` 中所有任务已标记 `[x]`，准备进入 TEST / VERIFY 阶段前

---

## 执行步骤

### Step 1：重置 context，只读取以下文件（不使用对话历史）

必须读取：
1. `openspec/config.yaml` — 项目规范和约束
2. `openspec/changes/{change-id}/tasks.md` — 任务清单（作为验收标准）
3. `openspec/changes/{change-id}/design.md` — 设计文档（作为背景）
4. 所有 tasks.md 中涉及的实现代码文件（按 tasks 中提到的文件路径逐一读取）

> ⚠️ 审查时，**严格忽略当前会话中的讨论历史、编辑过程**。只以上述文件内容作为唯一信息源，以旁观者视角评判代码。

---

### Step 2：识别本次变更的代码文件

从 `tasks.md` 中提取所有提及的代码文件路径，逐一读取。  
若 tasks.md 未明确列文件路径，则通过 design.md 中的 Context 和 Decisions 推断涉及的文件。

---

### Step 3：逐条验证 tasks.md 任务

对 `tasks.md` 中每一条任务（含已标记 `[x]` 的）：

1. 找到对应的代码实现
2. 验证代码是否满足任务描述的要求
3. 标记：✅ 已实现 / ⚠️ 部分实现 / ❌ 未实现 / ❓ 无法确认

---

### Step 4：按规范维度额外审查

#### 4.1 技术规范符合性（对照 config.yaml）
- [ ] 是否使用 `@bedrock/components`，无 Ant Design 引入
- [ ] 是否无硬编码颜色（无 `#xxxxxx` 字面量，使用 CSS 变量）
- [ ] HTTP 请求是否通过 `src/OpenApiServices/`，未直接调用 `ajax.ts` / `axios` / `fetch`
- [ ] 权限判断是否通过 `useTypedSelector` 从 Redux state 获取，未硬编码角色字符串
- [ ] 日期处理是否使用 `dayjs`，无 `moment` / 原生 `Date` 格式化
- [ ] 是否使用 `useMemoizedFn` 代替 `useCallback`（ahooks）

#### 4.2 代码质量
- [ ] 有无明显的内存泄漏风险（事件监听未清理、定时器未清理）
- [ ] 有无未处理的 loading / error 状态
- [ ] 有无硬编码字符串应提取为常量

---

### Step 5：生成 post-review.md

将审查结果写入 `openspec/changes/{change-id}/post-review.md`：

```markdown
# Post-Review: {change-id}

**审查日期**: {date}
**审查结论**: APPROVED / NEEDS_REVISION / REJECTED

---

## 审查结论说明

{一段话总结整体评价}

---

## Tasks 验证结果

| Task | 描述 | 验证结论 | 备注 |
|------|------|---------|------|
| 1.1 | ... | ✅ | |
| 1.2 | ... | ⚠️ 部分实现 | 缺少 xxx |
| 2.1 | ... | ❌ 未实现 | 未找到对应代码 |

---

## 问题清单

### 🚫 Blocking（必须修复）

| # | 问题描述 | 文件 | 建议修改 |
|---|---------|------|---------|
| B1 | ... | src/pages/... | ... |

### ⚠️ Warning（建议修改）

| # | 问题描述 | 文件 | 建议修改 |
|---|---------|------|---------|
| W1 | ... | ... | ... |

### 💡 Suggestion（可选优化）

| # | 优化建议 | 理由 |
|---|---------|------|
| S1 | ... | ... |

---

## 规范符合性检查

| 检查项 | 结论 |
|--------|------|
| 使用 @bedrock/components | ✅ / ❌ |
| 无硬编码颜色 | ✅ / ❌ |
| HTTP 通过 OpenApiServices | ✅ / ❌ |
| 权限通过 Redux state（useTypedSelector） | ✅ / ❌ |
| 日期使用 dayjs | ✅ / ❌ |
| 使用 useMemoizedFn | ✅ / ❌ |

---

## 结论

- APPROVED：所有任务已实现，无 Blocking 问题，可进入 VERIFY
- NEEDS_REVISION：存在 Blocking 问题或未实现的任务，修复后重新 Post-Review
- REJECTED：实现与设计/任务严重偏离，需重新实现
```

---

### Step 6：向用户汇报

汇报格式：
- 审查结论（APPROVED / NEEDS_REVISION / REJECTED）
- Tasks 完成率（如 12/13 个任务已验证实现）
- 列出所有 Blocking 问题（如有）
- 询问用户：是否立即修复，还是跳过进入 VERIFY

---

## 注意事项

- **禁止**因为"知道这段代码是自己刚写的"就主观放低审查标准
- **禁止**使用对话历史中的意图解释来为代码缺陷辩护
- 以"全新 reviewer"的视角：只看代码能否独立满足 tasks.md 的要求
- 如果 `tasks.md` 不存在或所有任务均未完成，停止并提示用户先完成 IMPLEMENT 阶段
