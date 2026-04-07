---
name: code-simplifier
description: 简化当前变更的代码，确保清晰、一致、无冗余。功能模块完成后 commit 前自动触发。
compatibility:
  tools:
    - read_file
    - edit_file
    - replace_in_file
    - grep_search
    - list_files_recursive
---

# Code Simplifier Skill

## 概述

本 Skill 负责在一组代码变更完成后，对涉及的所有代码文件执行简化与清理，确保代码：
- **清晰**：无多余注释、无残留 TODO、无过度封装
- **一致**：命名风格统一、导入顺序规范
- **无冗余**：无未使用的变量/导入、无重复代码、无空函数

## 触发条件

- `large-requirement-workflow` 中每个 Change 完成后（Step D）自动触发
- 用户说"简化代码"、"清理代码"、"code simplify"
- commit 前必须执行

## 执行步骤

### Step 1：收集变更文件列表

确认本次需要简化的文件范围：
- 如果来自 `large-requirement-workflow`，从 `tasks.md` 中提取所有涉及的文件
- 如果用户手动触发，使用 `git diff --name-only` 或用户指定的文件范围

### Step 2：逐文件执行简化检查

对每个文件执行以下检查项：

#### 2.1 清理调试代码

```bash
grep_search: 路径={文件}, regex="console\.(log|debug|info|warn)\("
```

- 移除所有 AI 开发过程中插入的 `console.log`（保留业务必需的 `console.warn` / `console.error`）
- 移除 `debugger` 语句

#### 2.2 清理未使用的导入

```bash
# 检查未使用的 import
npx tsc --noEmit --pretty 2>&1 | grep "{文件路径}" | grep "is declared but"
```

- 移除未使用的 import 语句
- 移除未使用的变量和函数

#### 2.3 清理残留注释

检查并清理：
- `// TODO` / `// FIXME` → 如果已解决则删除，未解决则保留
- `// MOCK_POINT` → 如果仍在 mock 阶段则保留，已替换真实接口则删除
- `// eslint-disable` → 确认是否仍然必要
- AI 生成的注释噪音（如 `// 这里是xxx` 的冗余说明）

#### 2.4 简化代码结构

检查并优化：
- **过度嵌套**：超过 3 层的条件嵌套 → 使用 early return 或提取函数
- **重复代码**：相似代码块 > 2 处 → 提取为公共函数
- **空函数体**：`() => {}` 或 `function() {}` → 确认是否需要移除
- **冗余的类型断言**：不必要的 `as XxxType` → 确认是否可以通过类型推导消除

#### 2.5 规范导入顺序

确保导入按以下顺序排列：
1. React 相关（`react`）
2. 第三方库（`@bedrock/components`、`ahooks`、`lodash` 等）
3. 项目内部模块（`@/`、`./` 开头）
4. 样式文件（`.less`、`.css`）
5. 类型导入（`import type`）

#### 2.6 命名一致性

- 组件名 → PascalCase
- 函数/变量 → camelCase
- 常量 → UPPER_SNAKE_CASE
- 事件处理 → `handleXxx` / `onXxx`
- Boolean 变量 → `isXxx` / `hasXxx` / `canXxx`

### Step 3：输出简化报告

```
🧹 代码简化报告

## 已执行的简化

| 文件 | 操作 | 详情 |
|------|------|------|
| src/pages/Xxx/index.tsx | 移除调试代码 | 删除 3 处 console.log |
| src/pages/Xxx/index.tsx | 移除未使用导入 | 删除 useEffect, useState |
| src/components/Yyy/index.tsx | 简化嵌套 | 3层if改为early return |
| src/pages/Xxx/usePresenter.ts | 清理注释 | 移除 2 处残留 TODO |

## 未操作项（需确认）

| 文件 | 项目 | 原因 |
|------|------|------|
| src/pages/Xxx/index.tsx | MOCK_POINT 注释 | 仍在 mock 阶段，保留 |

## 简化统计
- 处理文件数：{n}
- 删除行数：{m}
- 简化操作数：{k}
```

### Step 4：自动执行 review-code 自查

简化完成后，对所有修改过的文件执行一次 `review-code` 类型 A 自查，确保简化操作没有引入新问题。

---

## 注意事项

- **不要过度简化**：保留有意义的注释和必要的类型断言
- **保留 MOCK_POINT**：如果项目仍在 mock 阶段，不要删除 mock 相关注释
- **保留 eslint-disable**：如果有充分理由（如第三方库类型问题），保留 disable 注释
- **不改变业务逻辑**：简化仅限于代码形式，不涉及功能变更
- 简化完成后必须通过 TypeScript 编译检查