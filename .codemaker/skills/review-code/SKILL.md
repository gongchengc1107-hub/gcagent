---
name: review-code
description: 代码审查与质量保障的统一入口。修改代码后自动自查，commit 前执行审查，含类型优化。
---

# Review Code Skill

## 概述

本 Skill 提供代码审查与质量保障的统一工作流，整合了代码自查、类型优化等功能。**所有代码质量类任务都通过本 Skill 处理**，不再单独触发 self-check 或 fix-types。
必须使用 @code-reviewer 这个subagent来执行。

## 触发条件

以下任一情况触发：
- 用户说"审查代码"、"code review"、"检查代码"、"自查"
- 用户说"修复类型"、"优化类型"、"fix types"
- 每次使用 `edit_file` / `replace_in_file` 修改代码文件后（执行自查流程）
- commit 前（需先执行 `code-simplifier`）

## 任务类型与执行流程

根据触发条件，自动判断执行哪种流程：

### 类型 A：代码自查（编辑后自动触发）

每次修改代码文件后**必须立即执行**，通过后才允许进入下一步编码。

#### Step 1：确认被修改的文件

记录本次修改涉及的文件路径，用于后续各项检查。

#### Step 2：豁免条件判断

若满足以下条件，可跳过全部检查：
- 仅修改 `.md` / `.json` / `.mdc` 等非代码文件
- 仅修改 `.codemaker/` 目录

若仅修改 `mock/` 目录，跳过第 5（Bedrock API）、第 8（导出名）

#### Step 3：逐项执行检查

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
| 9 | console.log 检查 | `grep_search: 路径={文件}, regex="console\.(log\|debug\|info)"` | 本次新增的 console.log 为 0（开发调试用的需在提交前清除；已有的业务日志可保留） |
| 10 | 样式导入来源 | `grep_search: 路径={文件}, regex="import.*styled"` | 来自 `@umijs/max` |

#### Step 4：输出结果

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

#### Step 5：卡点规则

- **存在 ❌ 项 → 禁止继续编写下一个文件 / 下一个任务的代码，必须先修复**
- 全部 ✅ 才可进入下一步编码
- commit 前还需执行 `code-simplifier` Skill

---

### 类型 B：代码审查（用户主动触发）

#### Step 1：检查 UI 组件规范

检查项：
- [ ] 是否使用 `@bedrock/components`
- [ ] 是否**禁止**引入 Ant Design
- [ ] Bedrock 组件是否通过 `bedrock-component-lookup` 验证

```bash
# 检查是否使用了禁止的组件库
grep_search: 路径=src, regex="from 'antd'|from 'ant-design'"
```

#### Step 2：检查请求规范

检查项：
- [ ] 是否使用 `src/OpenApiServices/` 中的服务方法
- [ ] 是否**禁止**直接使用 `axios`、`fetch` 或裸调用 `src/utils/ajax.ts`
- [ ] 是否使用 `useRequest` 而非 `useEffect + await`

```bash
# 检查是否使用了禁止的请求方式
grep_search: 路径=src, regex="import axios|from 'axios'|window\.fetch|from '@/utils/ajax'"
```

#### Step 3：检查类型安全

检查项：
- [ ] 是否存在 `any` 类型
- [ ] 是否复用 `src/types/` 下的全局类型
- [ ] 是否使用明确的类型定义

```bash
# 检查是否存在 any
grep_search: 路径={文件}, regex=": any|as any"
```

#### Step 4：检查样式规范

检查项：
- [ ] 是否使用 CSS 变量而非硬编码颜色
- [ ] 是否使用 `styled-components`
- [ ] 动态 Props 是否使用 `$` 前缀

```bash
# 检查是否存在硬编码颜色
grep_search: 路径={文件}, regex="#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\("
```

#### Step 5：检查命名规范

检查项：
- [ ] 组件是否使用 PascalCase
- [ ] 函数/变量是否使用 camelCase
- [ ] 事件处理是否使用 `handleXxx` / `onXxx`

#### Step 6：检查权限规范

检查项：
- [ ] 是否通过 `useTypedSelector` 从 Redux state（`state.account` / `state.organization`）获取权限信息
- [ ] 是否**禁止**硬编码角色字符串做权限判断

```bash
# 检查是否存在硬编码角色字符串判断
grep_search: 路径=src, regex="role\s*===\s*['\"]|roles\.\w+\s*==="
```

#### 审查输出格式

```
🔍 代码审查报告

## 检查结果

### ✅ 通过项
- 使用了 @bedrock/components
- 使用了 useRequest
- 样式使用了 CSS 变量

### ❌ 问题项
- src/pages/Example/index.tsx:10 - 存在 any 类型
- src/components/Test/index.tsx:5 - 硬编码颜色 #FFFFFF

### ⚠️ 建议项
- 建议将类型抽取到 src/types/ 目录
```

---

### 类型 C：类型优化（用户主动触发）

#### Step 1：识别类型问题

常见类型问题：
1. `any` 类型 → 需要具体类型替代
2. 缺失类型定义 → 需要定义接口
3. 类型过于宽泛 → 需要收窄类型
4. 重复类型定义 → 需要复用全局类型

#### Step 2：查找全局类型

在 `src/types/` 目录下查找已有的类型定义：

```bash
list_files_top_level: 路径=src/types
grep_search: 路径=src/types, regex="(interface|type).*Xxx"
```

#### Step 3：修复类型问题

遵循项目规范：

**消除 any**
```typescript
// ❌ 修复前
const data: any = response.data;

// ✅ 修复后 - 定义具体类型
type XxxItem = {
  id: number;
  name: string;
};
const data: XxxItem[] = response.data;
```

**复用全局类型**
```typescript
// ❌ 修复前 - 重复定义
interface LocalItem {
  id: number;
  name: string;
  status: number;
}

// ✅ 修复后 - 复用全局类型
import { GlobalXxxItem } from '@/types/xxx';
const data: GlobalXxxItem[] = response.data;
```

**收窄类型**
```typescript
// ❌ 修复前 - 类型过宽
const status: string = getStatus();
if (status === 'success') {
  // status 仍然是 string
}

// ✅ 修复后 - 类型收窄
type Status = 'success' | 'error' | 'loading';
const status: Status = getStatus();
if (status === 'success') {
  // status 是 'success'
}
```

#### Step 4：更新类型文件

如果需要新增全局类型，添加到 `src/types/` 目录下：

```typescript
// src/types/xxx.ts
export interface XxxItem {
  id: number;
  name: string;
  status: number;
}

export type XxxList = XxxItem[];
```

#### 类型优化输出格式

```
✅ 类型优化完成

- 修复文件：src/pages/Example/index.tsx
- 新增类型：src/types/xxx.ts
- 注意事项：禁止使用 any
```

---

## 注意事项

1. **每条检查都必须有实际工具调用**：不能凭记忆跳过
2. **禁止项必须修复**：发现禁止行为时必须标记为问题
3. **提供修复建议**：每个问题项给出正确做法
4. **React 必须具名导入**：`import { useState, FC, ReactNode } from 'react'`
5. **styled 必须从 @umijs/max 导入**：`import { styled } from '@umijs/max'`
6. **颜色必须用 CSS 变量**：如 `var(--primary-1)`，禁止 `#0057FF` 等硬编码
7. **as any 是最危险的形式**：会让 TS 编译通过但掩盖运行时 bug，必须优先修复
8. **类型定义用 type**：不用 interface（根据 rules 规范）
