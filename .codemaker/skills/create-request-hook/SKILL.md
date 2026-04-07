---
name: create-request-hook
description: 创建请求 Hook 的标准化工作流。封装 API 请求逻辑时自动触发，支持自动/手动/分页模式。
---

# Create Request Hook Skill

## 概述

本 Skill 提供创建请求 Hook 的标准流程，使用 ahooks 的 useRequest。

## 触发条件

用户表达包含以下关键词时触发：
- "创建一个请求 hook"
- "新建请求 hook"
- "add request hook"
- "创建 useXxxData hook"

## 执行流程

### Step 1：确定请求模式

根据业务场景选择：

| 模式 | 适用场景 | 配置 |
|------|---------|------|
| 自动触发 | 页面加载自动请求 | 无需 manual |
| 手动触发 | 按钮点击提交 | manual: true |
| 分页请求 | 列表分页加载 | 带分页参数 |
| 依赖刷新 | 参数变化重新请求 | refreshDeps |

### Step 2：生成 Hook 代码

遵循项目规范：

#### 自动触发模式
```typescript
// src/hooks/useXxxData.ts
import { useRequest } from 'ahooks';
import { getXxxList } from '@/services';

/**
 * 获取 XXX 列表数据
 */
const useXxxList = (params: XxxParams) => {
  return useRequest(() => getXxxList(params), {
    refreshDeps: [params],
  });
};

export default useXxxList;
```

#### 手动触发模式
```typescript
// src/hooks/useCreateXxx.ts
import { useRequest } from 'ahooks';
import { createXxx } from '@/services';
import { message } from '@bedrock/components';

/**
 * 创建 XXX
 */
const useCreateXxx = () => {
  return useRequest(
    (data: CreateParams) => createXxx(data),
    {
      manual: true,
      onSuccess: () => {
        message.success('创建成功');
      },
    }
  );
};

export default useCreateXxx;
```

#### 分页请求模式
```typescript
// src/hooks/useXxxList.ts
import { useRequest } from 'ahooks';
import { getXxxList } from '@/services';
import { useState, useMemo } from 'react';

/**
 * 获取 XXX 列表（分页）
 */
const useXxxList = () => {
  const [params, setParams] = useState({ pageNo: 1, pageSize: 10 });

  const { data, loading, run } = useRequest(
    () => getXxxList(params),
    { manual: true }
  );

  const list = useMemo(() => data?.records ?? [], [data]);
  const total = useMemo(() => data?.total ?? 0, [data]);

  const onPageChange = (pageNo: number, pageSize: number) => {
    setParams({ pageNo, pageSize });
    run();
  };

  return {
    list,
    total,
    loading,
    params,
    onPageChange,
    run,
  };
};

export default useXxxList;
```

### Step 3：使用 Hook

```typescript
import useXxxList from '@/hooks/useXxxList';

const MyComponent = () => {
  const { data, loading } = useXxxList({ status: 1 });
  return <div>{loading ? '加载中' : data?.length}</div>;
};
```

## 输出格式

创建完成后，汇报：

```
✅ 请求 Hook 创建成功

- 路径：src/hooks/useXxxList.ts
- 模式：自动触发/手动触发/分页
- 注意事项：禁止在 useEffect 中手动 await 请求
```

## 注意事项

1. **必须使用 useRequest**：禁止在 useEffect 中手动 await 请求
2. **禁止使用 useSWR**：必须用 ahooks
3. **onError 静默处理**：axios 已统一处理错误，不需要重复弹 toast
4. **loadingDelay**：可添加 loadingDelay: 100 避免闪烁
