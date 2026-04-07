# 宠物商城小程序 — 变更总览

## 项目信息

- **平台**：微信小程序（Taro + React）
- **开发方式**：前端原型（Mock 数据）
- **创建时间**：2026-04-07
- **易协作单**：无

## 拆分方案

| Change | 目录名 | 名称 | 状态 | 预估 | 依赖 |
|--------|--------|------|------|------|------|
| C0 | pet-shop-c0-infrastructure | 基础设施 | ⬜ TODO | 8h | — |
| C1 | pet-shop-c1-product-browse | 商品浏览 | ⬜ TODO | 12h | C0 |
| C2 | pet-shop-c2-cart-order | 购物车与下单 | ⬜ TODO | 12h | C1 |
| C3 | pet-shop-c3-order-mgmt | 订单管理 | ⬜ TODO | 8h | C2 |
| C4 | pet-shop-c4-user-center | 用户中心 | ⬜ TODO | 10h | C0 |
| C5 | pet-shop-c5-review-collect | 评价与收藏 | ⬜ TODO | 8h | C1, C3 |

**总计预估：~58h**

## 状态说明

- ⬜ TODO — 未开始
- 🔵 DESIGN — 设计中
- 🟡 IMPLEMENT — 实施中
- ✅ DONE — 已完成
- ⛔ BLOCKED — 阻塞

## Mock 策略

- [x] 全量 Mock（接口未就绪，前端原型阶段）

> MOCK_POINTS 记录在 PET_SHOP_MOCK_POINTS.md，接口就绪后逐一替换。

## 技术栈

- **框架**：Taro 3.x + React 18
- **语言**：TypeScript
- **样式**：Tailwind CSS（Taro 兼容方案）
- **状态管理**：Zustand 或 Redux Toolkit
- **目录结构**：`src/pages/pet-shop/`

## 页面清单

| 页面 | 路径 | 所属 Change |
|------|------|------------|
| 首页 | `/pages/pet-shop/home/index` | C1 |
| 商品分类 | `/pages/pet-shop/category/index` | C1 |
| 商品列表 | `/pages/pet-shop/product-list/index` | C1 |
| 商品详情 | `/pages/pet-shop/product-detail/index` | C1 |
| 购物车 | `/pages/pet-shop/cart/index` | C2 |
| 确认订单 | `/pages/pet-shop/checkout/index` | C2 |
| 支付成功 | `/pages/pet-shop/pay-success/index` | C2 |
| 订单列表 | `/pages/pet-shop/order-list/index` | C3 |
| 订单详情 | `/pages/pet-shop/order-detail/index` | C3 |
| 用户中心 | `/pages/pet-shop/user-center/index` | C4 |
| 收货地址 | `/pages/pet-shop/address/index` | C4 |
| 商品评价 | `/pages/pet-shop/review/index` | C5 |
| 我的收藏 | `/pages/pet-shop/favorites/index` | C5 |
