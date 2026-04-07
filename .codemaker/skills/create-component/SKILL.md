---
name: create-component
description: 创建 React 组件的标准化工作流。编写新组件时自动触发。
---

# Create Component Skill

## 概述

本 Skill 提供创建 React 组件的标准流程，确保组件符合项目规范。

## 触发条件

用户表达包含以下关键词时触发：
- "创建一个组件"
- "新建组件"
- "add component"
- "创建 Xxx 组件"

## 执行流程

### Step 1：确认组件放置位置

根据组件复用范围决定放置位置：

```
组件需要在多个页面使用吗？
├─ YES → 通用组件 → 放在 src/components/<Name>/
└─ NO → 仅在单页使用 → 放在 src/pages/<Page>/components/<Name>/
```

### Step 2：确定组件结构

根据复杂度选择：

| 结构 | 适用场景 |
|------|---------|
| 简单模块 | 单个组件，无子组件 |
| 完整模块 | 组件含子组件、类型定义、样式等 |

### Step 3：生成组件代码

遵循项目规范（以 rules 为准）：

```tsx
// src/components/MyComponent/index.tsx
import { FC } from 'react';
import { styled } from '@umijs/max';

// Props 类型用 type（不用 interface）
type MyComponentProps = {
  title: string;
  onClick?: () => void;
};

// 样式使用 styled-components + CSS 变量
const Wrapper = styled.div`
  background: var(--bg-2);
  padding: 16px;
`;

// 组件使用箭头函数 + FC 泛型
const MyComponent: FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <Wrapper onClick={onClick}>
      {title}
    </Wrapper>
  );
};

export default MyComponent;
```

### Step 4：导出组件

在 `src/components/index.ts` 中添加导出：

```typescript
export { default as MyComponent } from './MyComponent';
```

## 输出格式

创建完成后，汇报：

```
✅ 组件创建成功

- 路径：src/components/MyComponent/index.tsx
- Props 类型：MyComponentProps
- 样式方案：styled-components
```

## 注意事项

1. **必须使用 `@bedrock/components`**：如果使用 Bedrock 组件，需先触发 `bedrock-component-lookup` Skill
2. **禁止使用 function 声明组件**：必须用箭头函数 + FC
3. **Props 类型用 type**：不用 interface
4. **禁止硬编码颜色**：必须使用 CSS 变量（如 `var(--primary-1)`）
5. **动态 Props 用 $ 前缀**：如 `styled.div<{ $active: boolean }>`
