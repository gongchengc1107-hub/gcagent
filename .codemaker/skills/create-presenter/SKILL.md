---
name: create-presenter
description: 从组件中抽取 usePresenter，分离业务逻辑。组件过于复杂（>100行）时自动建议。
---

# Create Presenter Skill

## 概述

本 Skill 提供从现有组件中抽取 usePresenter 的标准流程，将状态管理和业务逻辑从组件中分离。

## 触发条件

用户表达包含以下关键词时触发：
- "抽取 presenter"
- "提取逻辑"
- "extract presenter"
- "把逻辑移到 usePresenter"

## 执行流程

### Step 1：分析组件中的逻辑

识别组件中需要抽取的内容：
- 状态定义（useState）
- 请求逻辑（useRequest）
- 事件处理函数（handleXxx）
- 业务计算逻辑

### Step 2：创建 usePresenter 文件

在组件同目录下创建 `usePresenter.ts`：

```typescript
// src/pages/Example/usePresenter.ts
import { useState } from 'react';
import { useRequest } from 'ahooks';
import { getXxxList, createXxx } from '@/OpenApiServices';
import { message } from '@bedrock/components';

/**
 * Example 页面逻辑
 */
const usePresenter = () => {
  // 状态
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 请求
  const { data, loading, refresh } = useRequest(
    () => getXxxList({ keyword }),
    {
      refreshDeps: [keyword],
    }
  );

  const { run: onCreate } = useRequest(createXxx, {
    manual: true,
    onSuccess: () => {
      message.success('创建成功');
      refresh();
    },
  });

  // 事件处理
  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleDelete = (id: number) => {
    // 具体删除逻辑根据业务需求实现
  };

  return {
    // 状态
    keyword,
    setKeyword,
    selectedId,
    setSelectedId,
    // 数据
    data,
    loading,
    refresh,
    // 事件
    onCreate,
    handleSelect,
    handleDelete,
  };
};

export default usePresenter;
```

### Step 3：简化原组件

组件只负责渲染：

```tsx
// src/pages/Example/index.tsx
import { FC } from 'react';
import { styled } from '@umijs/max';
import usePresenter from './usePresenter';

const Wrapper = styled.div`
  padding: 16px;
`;

const Index: FC = () => {
  const { data, loading, keyword, setKeyword, handleSelect } = usePresenter();

  return (
    <Wrapper>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div>
          {data?.map((item) => (
            <div key={item.id} onClick={() => handleSelect(item.id)}>
              {item.name}
            </div>
          ))}
        </div>
      )}
    </Wrapper>
  );
};

export default Index;
```

## 输出格式

抽取完成后，汇报：

```
✅ Presenter 抽取成功

- Presenter 路径：src/pages/Example/usePresenter.ts
- 组件简化后：src/pages/Example/index.tsx
- 注意事项：验收通过后删除所有调试用 console.log
```

## 注意事项

1. **开发阶段可插入 console.log**：在关键节点插入调试日志方便排查问题
2. **验收后删除日志**：开发完成后**必须**删除所有自己产生的 console.log，不留入生产代码
3. **使用 useMemoizedFn**：处理函数使用 ahooks
4. **禁止 any**：定义清晰的类型
