---
name: self-check
description: 代码编辑后强制执行的自查清单（NON-NEGOTIABLE）。每次修改代码文件后必须立即执行。
---

# Self-Check Skill

## 概述

本 Skill 提供代码修改后的强制自查流程，确保代码符合项目规范。每次修改代码文件后**必须立即执行**，通过后才允许进入下一步编码或提交 commit。

## 触发条件

以下情况触发：
- 每次使用 `edit_file` / `replace_in_file` 修改代码文件后
- 用户说"自查"、"检查代码"、"过一下清单"
- commit 前（但需先执行 `code-simplifier`）

## 执行流程

### Step 1：确认被修改的文件

记录本次修改涉及的文件路径，用于后续各项检查。

### Step 2：豁免条件判断

若满足以下条件，可跳过全部检查：
- 仅修改 `.md` / `.json` / `.mdc` 等非代码文件
- 仅修改 `.codemaker/` 目录

若仅修改 `mock/` 目录，跳过第 5（Bedrock API）、第 8（导出名）

### Step 3：逐项执行检查

对每一项执行对应的工具调用，**不允许"心里过一遍"就算通过**：

| # | 检查项 | 检查命令 | 通过标准 |
|---|--------|---------|---------|
| 1 | TypeScript 编译 | `npx tsc --noEmit --pretty 2>&1 \| grep "{文件路径}"` | 0 错误 |
| 2 | 禁止 `any` | `grep_search: 路径={文件}, regex=": any\|as any\|\bany\b"` | 0 命中（mock 文件除外） |
| 3 | 禁止 `React.xxx` | `grep_search: 路径={文件}, regex="React\."` | 0 命中 |
| 4 | 新增 import 符号校验 | 对新增符号在项目中 grep_search 确认 | 确认拼写和路径正确 |
| 5 | Bedrock 组件 API | 读取 `.cache/bedrock-docs/{组件slug}.md` 验证 | 组件名、props 均存在 |
| 6 | 禁止硬编码颜色 | `grep_search: 路径={文件}, regex="#[0-9a-fA-F]{3,8}\b"` | 0 命中 |
| 7 | 第三方包存在性 | `grep_search: 路径=package.json, regex="{包名}"` | 包已安装 |
| 8 | 页面组件导出名 | `grep_search: 路径={文件}, regex="export default"` | 导出名为 `Index` |
| 9 | console.log 检查 | `grep_search: 路径={文件}, regex="console\.(log\|debug\|info)"` | 0 命中 |
| 10 | 样式导入来源 | `grep_search: 路径={文件}, regex="import.*styled"` | 来自 `@umijs/max` |

### Step 4：输出结果

在回复末尾附上清单格式：

```
📋 自查清单
✅ TS 编译：0 错误
✅ any 检查：0 命中
✅ React.xxx：0 命中
✅ import 校验：已确认 N 个新增符号
✅ Bedrock API：已验证 N 个组件
✅ 硬编码颜色：0 命中
✅ 第三方包：无新增 / 已安装 xxx
✅ 导出名：Index ✓
✅ console.log：0 命中（或：N 处调试用，待清除）
✅ styled 来源：@umijs/max ✓
```

### Step 5：卡点规则

- **存在 ❌ 项 → 禁止继续编写下一个文件 / 下一个任务的代码，必须先修复**
- 全部 ✅ 才可进入下一步编码
- commit 前还需执行 `code-simplifier` Skill

## 注意事项

1. **每条检查都必须有实际工具调用**：不能凭记忆跳过
2. **`as any` 是最危险的形式**：会让 TS 编译通过但掩盖运行时 bug，必须优先修复
3. **颜色必须用 CSS 变量**：如 `var(--primary-1)`，禁止 `#0057FF` 等硬编码
4. **React 必须具名导入**：`import { useState, FC, ReactNode } from 'react'`
5. **styled 必须从 @umijs/max 导入**：`import { styled } from '@umijs/max'`
