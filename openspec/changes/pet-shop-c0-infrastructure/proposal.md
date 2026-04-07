## Why

宠物商城微信小程序需要从零开始搭建，C0 负责建立整个项目的技术基础设施：Taro 项目脚手架、全局路由配置、公共组件库和 Mock 数据基础设施，为后续 C1-C5 各业务模块提供统一的开发基座。

## What Changes

- 使用 Taro 3.x + React 18 + TypeScript 初始化微信小程序项目
- 配置全局路由（`app.config.ts`），注册所有 13 个业务页面路径
- 建立 `src/pages/pet-shop/` 目录结构，统一业务页面命名规范
- 封装全局公共组件：导航栏（`NavBar`）、加载态（`Loading`）、空状态（`EmptyState`）、商品卡片骨架（`SkeletonCard`）
- 建立 Mock 基础设施：`src/mock/` 目录，提供统一的 Mock 数据工厂函数
- 配置 Zustand 全局状态管理，初始化购物车、用户、订单 store 骨架
- 配置 Tailwind CSS（Taro 适配方案）

## Capabilities

### New Capabilities

- `project-scaffold`: Taro 项目初始化、目录结构、路由配置、TypeScript 类型基础
- `common-components`: 公共 UI 组件库（NavBar、Loading、EmptyState、SkeletonCard）
- `mock-infrastructure`: Mock 数据工厂、商品/订单/用户 Mock 数据集
- `global-store`: Zustand store 骨架（cart-store、user-store、order-store）

### Modified Capabilities

（无，全新项目）

## Impact

- 所有后续 Change（C1-C5）依赖此 C0 产出的路由配置和公共组件
- `src/pages/pet-shop/` 为业务页面根目录，各模块在此创建子目录
- `src/mock/` 提供统一 Mock 数据，确保各模块在无真实接口时可独立开发
