---
name: fix-types
description: TypeScript 类型优化工作流。消除 any，复用全局类型定义。用户说"修复类型"/"fix types"时触发。
---

# Fix Types Skill

## 概述

本 Skill 提供 TypeScript 类型优化和修复的标准流程。

## 触发条件

用户表达包含以下关键词时触发：
- "修复类型"
- "优化类型"
- "fix types"
- 代码中出现 any 类型时

## 执行流程

### Step 1：识别类型问题

常见类型问题：
1. `any` 类型 → 需要具体类型替代
2. 缺失类型定义 → 需要定义接口
3. 类型过于宽泛 → 需要收窄类型
4. 重复类型定义 → 需要复用全局类型

### Step 2：查找全局类型

在 `src/types/` 目录下查找已有的类型定义：

```bash
# 搜索全局类型
ls src/types/
grep -r "interface.*Xxx" src/types/
```

### Step 3：修复类型问题

遵循项目规范：

#### 消除 any
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

#### 复用全局类型
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

#### 收窄类型
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

### Step 4：更新类型文件

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

## 输出格式

修复完成后，汇报：

```
✅ 类型优化完成

- 修复文件：src/pages/Example/index.tsx
- 新增类型：src/types/xxx.ts
- 注意事项：禁止使用 any
```

## 注意事项

1. **禁止使用 any**：除非有明确理由并添加注释说明
2. **优先复用全局类型**：在 src/types/ 目录下查找
3. **类型定义用 type**：不用 interface（根据 rules 规范）
4. **确保类型安全**：避免隐式 any
