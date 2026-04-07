# Skill: openspec-verify-change

## 描述

VERIFY 阶段是 SDD 工作流的**最后一站**。

本 skill 负责：
1. 确认 E2E 测试已通过
2. 生成变更完成报告 `verify.md`
3. 将整个 `openspec/changes/{change-id}/` 目录移入 `openspec/archive/`
4. 输出 git commit message 建议

目标：**零遗漏归档，可追溯变更历史**。

---

## 触发时机

- 用户说"完成变更"、"归档"、"执行 VERIFY"、"关闭这个 change" 时
- E2E 测试结论为 PASSED 或 PARTIAL（已说明原因）后

---

## 前置检查（Start Guard）

执行前验证：

1. `openspec/changes/{change-id}/e2e-report.md` 存在
2. `e2e-report.md` 中结论为 `PASSED` 或 `PARTIAL`
3. `openspec/changes/{change-id}/tasks.md` 中所有任务已勾选 `[x]`
4. `openspec/changes/{change-id}/post-review.md` 结论为 `APPROVED`

> 若 `tasks.md` 中仍有未勾选的 `- [ ]`，停止并列出未完成任务。

---

## 执行步骤

### Step 1：生成 verify.md

在 `openspec/changes/{change-id}/` 下创建 `verify.md`，内容如下：

```markdown
# Verify: {change-id}

**完成时间**: {datetime}
**变更状态**: COMPLETED ✅

---

## 变更摘要

**变更目标**（来自 proposal.md）:
> {proposal.md 中的 Goals 章节一句话摘要}

**关键决策**（来自 design.md）:
- {Decision 1 标题}
- {Decision 2 标题}
- ...

---

## 阶段历史

| 阶段 | 完成时间 | 结论 |
|------|---------|------|
| PROPOSE | {date} | — |
| DESIGN | {date} | — |
| REVIEW | {date} | APPROVED |
| API-AUDIT | {date} | READY / N/A |
| IMPLEMENT | {date} | — |
| POST-REVIEW | {date} | APPROVED |
| E2E | {date} | PASSED / PARTIAL |
| VERIFY | {datetime} | COMPLETED |

---

## 任务完成情况

| 分组 | 任务数 | 状态 |
|------|--------|------|
| 权限/路由 | n | ✅ |
| API | n | ✅ |
| 页面骨架 | n | ✅ |
| 交互逻辑 | n | ✅ |
| 样式打磨 | n | ✅ |
| 测试与验收 | n | ✅ |

---

## E2E 测试摘要

- 总用例: {total}，通过: {passed}，失败: {failed}
- 通过率: {percentage}%
{若有 PARTIAL，说明跳过原因}

---

## 归档位置

`openspec/archive/{change-id}/`
```

---

### Step 2：执行归档

运行命令将 change 目录移入 archive：

```bash
mkdir -p openspec/archive
mv openspec/changes/{change-id} openspec/archive/{change-id}
```

> 移动后，`openspec/changes/` 目录中该 change 的所有文件将不再出现。

---

### Step 3：输出 git commit message

提供规范化的 commit message 供用户使用：

```
feat({change-id}): {变更标题}

{proposal.md Goals 的一句话描述}

Changes:
- {列出 design.md 中的关键 Decision 1-3 条}

Tests: E2E {passed}/{total} passed
Archived: openspec/archive/{change-id}/
```

---

### Step 4：最终汇报

输出完成摘要：

```markdown
## 🏁 变更 {change-id} 已完成并归档

📁 归档路径：`openspec/archive/{change-id}/`

📋 Commit Message（复制使用）:
---
{commit message}
---

下一步：
- 将代码 push 到 feature 分支并提 MR
- 如需查阅历史决策，访问 `openspec/archive/{change-id}/design.md`
```

---

## 注意事项

- 归档后 `openspec/changes/` 中不应存在该 change 目录，以保持 `changes/` 只含活跃变更
- `openspec/archive/` 目录纳入 git 版本管理
- 若 `openspec/archive/` 不存在，自动创建
- E2E 测试文件（`e2e/changes/{change-id}/`）**不移动**，保持在原位便于 CI/CD 复用
