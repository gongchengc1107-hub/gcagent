---
name: create-page
description: 创建路由页面的标准化工作流。编写新页面路由时自动触发，含路由配置和权限设置。
---

# Create Page Skill

## 概述

本 Skill 提供创建路由页面的标准流程，将业务逻辑抽取到 usePresenter。

## 触发条件

用户表达包含以下关键词时触发：
- "创建一个页面"
- "新建页面"
- "add page"
- "创建 Xxx 页面"

## 执行流程

### Step 1：确认页面目录

路由页面放在 `src/pages/` 目录下，使用 PascalCase：

```
src/pages/Demand/
├── components/        # 页面专用组件
└── index.tsx          # 页面主文件
```

### Step 2：生成页面代码

遵循项目规范：

```tsx
// src/pages/Example/index.tsx
import { FC } from 'react';
import { styled } from '@umijs/max';
import usePresenter from './usePresenter';

const PageWrapper = styled.div`
  padding: 16px;
`;

const Index: FC = () => {
  const { data, loading, onRefresh } = usePresenter();

  return (
    <PageWrapper>
      {loading ? <div>加载中...</div> : <div>{data}</div>}
    </PageWrapper>
  );
};

export default Index;
```

### Step 3：抽取 usePresenter

将业务逻辑抽取到独立文件：

```typescript
// src/pages/Example/usePresenter.ts
import { useState } from 'react';
import { useRequest } from 'ahooks';
import { getXxxList } from '@/OpenApiServices';

/**
 * Example 页面逻辑
 */
const usePresenter = () => {
  const [keyword, setKeyword] = useState('');

  const { data, loading, refresh } = useRequest(
    () => getXxxList({ keyword }),
    {
      refreshDeps: [keyword],
    }
  );

  return {
    data,
    loading,
    keyword,
    setKeyword,
    onRefresh: refresh,
  };
};

export default usePresenter;
```

### Step 4：配置路由

在**项目根目录 `routes.ts`**中添加路由配置：

```typescript
// routes.ts（项目根目录）
{
  path: '/example',
  component: '@/pages/Example',
}
```

## 输出格式

创建完成后，汇报：

```
✅ 页面创建成功

- 页面路径：src/pages/Example/index.tsx
- Presenter：src/pages/Example/usePresenter.ts
- 路由配置：/example
- 注意事项：路由需添加到根目录 routes.ts
```

## 注意事项

1. **样式使用 styled-components**：写在同文件内
2. **逻辑抽取到 usePresenter**：保持页面组件简洁
3. **使用 useRequest**：数据请求使用 ahooks
4. **禁止硬编码颜色**：使用 CSS 变量
