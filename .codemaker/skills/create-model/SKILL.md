---
name: create-model
description: 创建 UmiJS useModel 全局状态的标准化工作流。需要跨组件共享状态时自动触发。
---

# Create Model Skill

## 概述

本 Skill 提供创建 UmiJS useModel 的标准流程，用于全局状态管理。

## 触发条件

用户表达包含以下关键词时触发：
- "创建一个 model"
- "新建 model"
- "add model"
- "创建 useXxx model"

## 执行流程

### Step 1：确认是否需要 Model

根据场景判断：
- 跨组件共享状态（轻量 Hook 场景） → 使用 UmiJS `useModel`
- 复杂全局状态（需要中间件、时间旅行等） → 使用 Redux（`src/redux/`）
- 仅单组件使用 → 使用组件内 `useState`
- **禁止引入 Zustand**：全局状态只允许 Redux 或 UmiJS useModel

### Step 2：确定 Model 类型

| 类型 | 适用场景 |
|------|---------|
| 纯状态 | 仅存储状态，无异步请求 |
| 带请求 | 需要异步请求获取数据 |

### Step 3：生成 Model 代码

遵循项目规范：

```typescript
// src/models/useXxx.tsx
import { useState } from 'react';
import { useMemoizedFn } from 'ahooks';

/**
 * 全局 XXX 状态管理
 */
const useXxx = () => {
  const [data, setData] = useState<XxxType | null>(null);
  const [loading, setLoading] = useState(false);

  const update = useMemoizedFn((val: XxxType) => {
    setData(val);
  });

  const clear = useMemoizedFn(() => {
    setData(null);
  });

  return { data, loading, update, clear };
};

export default useXxx;
```

### Step 4：使用 Model

在组件中使用：

```typescript
import { useModel } from '@umijs/max';

const MyComponent = () => {
  const { data, update, clear } = useModel('useXxx');
  return <div>{data?.name}</div>;
};
```

## 输出格式

创建完成后，汇报：

```
✅ Model 创建成功

- 路径：src/models/useXxx.tsx
- 使用方式：const { data } = useModel('useXxx')
- 注意事项：轻量跨组件共享状态使用 useModel；复杂全局状态使用 Redux
```

## 注意事项

1. **禁止使用 Zustand**：全局状态管理只允许 UmiJS useModel 或 Redux
2. **useModel vs Redux 选择标准**：轻量 Hook 共享 → useModel；需中间件/DevTools → Redux
3. **Model 文件默认导出 Hook 函数**
4. **使用 useMemoizedFn**：处理函数使用 ahooks 的 useMemoizedFn
5. **禁止使用 any**：定义清晰的类型
