---
name: create-hook
description: 创建自定义 Hook 的标准化工作流。优先复用 ahooks，编写新 Hook 时自动触发。
---

# Create Hook Skill

## 概述

本 Skill 提供创建自定义 Hook 的标准流程，优先复用 ahooks 已有实现。

## 触发条件

用户表达包含以下关键词时触发：
- "创建一个 hook"
- "新建 hook"
- "add hook"
- "创建 useXxx hook"

## 执行流程

### Step 1：检查 ahooks 是否已有实现

在创建自定义 Hook 前，先查阅 ahooks 文档或搜索项目是否有类似实现：

```bash
# 搜索项目中已有的 Hook
grep -r "useRequest\|useState\|useEffect" src/hooks/
```

### Step 2：确定 Hook 功能

分析需要的功能：
- 状态管理 → 使用 `useState`
- 副作用 → 使用 `useEffect`
- 缓存 → 考虑使用 ahooks 的 `useRequest`
- 生命周期 → 使用 ahooks 的 `useMount` / `useUnmount`

### Step 3：生成 Hook 代码

遵循项目规范：

```typescript
// src/hooks/useExample.ts
import { useState } from 'react';
import { useModel } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';

// 优先使用 useMemoizedFn 代替 useCallback
export default () => {
  const { initialState } = useModel('@@initialState');
  const [data, setData] = useState<string>('');

  const handleSomething = useMemoizedFn((id: number) => {
    // 处理逻辑（具体实现根据业务需求编写）
  });

  return { data, setData, handleSomething };
};
```

### Step 4：添加 JSDoc 注释

```typescript
/**
 * 示例 Hook
 * 用于处理某种业务逻辑
 * @param options 配置选项
 */
export default (options?: { debug?: boolean }) => {
  // ...
};
```

## 输出格式

创建完成后，汇报：

```
✅ Hook 创建成功

- 路径：src/hooks/useExample.ts
- 依赖：react, @umijs/max, ahooks
- 注意事项：优先使用 useMemoizedFn
```

## 注意事项

1. **优先复用 ahooks**：编写 Hook 前先查阅 ahooks 是否有实现
2. **使用 useMemoizedFn**：代替 `useCallback`，无需手动维护依赖数组
3. **JSDoc 注释**：包含功能说明、参数说明
4. **禁止使用 any**：使用明确的类型定义
