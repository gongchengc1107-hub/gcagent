# 电商平台项目开发规划

> 技术栈：React + Node.js + PostgreSQL
> 预估总工时：200-260h（含测试）
> 建议团队配置：2 前端 + 2 后端 + 1 全栈

---

## 一、整体架构设计

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────┐
│                    客户端层                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  用户端 SPA   │  │  商家后台 SPA │  │  管理后台   │ │
│  │  React + Vite │  │  React + Vite│  │  React     │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
└─────────┼─────────────────┼────────────────┼────────┘
          │                 │                │
          ▼                 ▼                ▼
┌─────────────────────────────────────────────────────┐
│                  API 网关层（Nginx）                   │
│         负载均衡 / 限流 / SSL 终止 / CORS             │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  服务层（Node.js）                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 用户服务  │ │ 商品服务  │ │ 订单服务  │ │支付服务 │ │
│  │ Auth/JWT │ │ Catalog  │ │ Order    │ │Payment │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │            │            │            │      │
│  ┌────▼────────────▼────────────▼────────────▼────┐ │
│  │              共享层                              │ │
│  │  ORM (Prisma) / 中间件 / 工具函数 / 消息队列     │ │
│  └──────────────────┬───────────────────────────┘   │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  数据层                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │PostgreSQL│ │  Redis   │ │   S3/OSS  │            │
│  │  主数据库  │ │ 缓存/会话 │ │  文件存储  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

### 1.2 技术选型明细

| 层次     | 技术                | 说明                              |
| -------- | ------------------- | --------------------------------- |
| 前端框架 | React 18 + Vite 5   | SPA，支持 SSR 可选迁移 Next.js      |
| 状态管理 | Zustand              | 轻量、无模板代码，适合中大型项目      |
| UI 组件  | Ant Design 5         | 成熟稳定的企业级组件库               |
| 路由     | React Router v6      | 标准前端路由方案                    |
| HTTP 客户端 | Axios + React Query | 请求封装 + 缓存/重试/乐观更新       |
| 后端框架 | Express.js / Fastify | Express 生态成熟；Fastify 性能更优  |
| ORM      | Prisma               | 类型安全、迁移管理、直观查询 API     |
| 鉴权     | JWT + Refresh Token  | Access Token(15min) + Refresh(7d) |
| 缓存     | Redis                | 会话、购物车、热门商品缓存           |
| 消息队列 | BullMQ (Redis-based) | 订单超时、邮件通知、支付回调重试      |
| 文件存储 | AWS S3 / Cloudflare R2 | 商品图片、用户头像                 |
| 支付     | Stripe / 支付宝 / 微信 | 根据目标市场选择                   |
| 部署     | Docker + Docker Compose | 开发环境一致性                   |
| CI/CD    | GitHub Actions        | 自动化测试 + 部署                  |

---

## 二、用户系统模块

### 2.1 功能清单

| 功能       | 优先级 | 预估工时 |
| ---------- | ------ | -------- |
| 邮箱注册    | P0     | 4h       |
| 邮箱登录    | P0     | 3h       |
| JWT 鉴权    | P0     | 6h       |
| 个人中心    | P0     | 6h       |
| 地址管理    | P0     | 5h       |
| OAuth 登录  | P1     | 8h       |
| 手机号登录  | P1     | 6h       |
| 密码重置    | P1     | 4h       |
| 用户角色权限 | P0     | 8h       |

### 2.2 鉴权流程

```
注册 → 邮箱验证 → 登录 → 获取 Access + Refresh Token
                              │
                              ▼
                    请求携带 Authorization: Bearer <access_token>
                              │
                    ┌─────────┴─────────┐
                    │  Access Token 有效  │──→ 正常访问
                    └─────────┬─────────┘
                              │ 过期
                              ▼
                    用 Refresh Token 换新 Access Token
                              │
                    ┌─────────┴─────────┐
                    │ Refresh Token 有效  │──→ 返回新 Token 对
                    └─────────┬─────────┘
                              │ 过期
                              ▼
                         强制重新登录
```

### 2.3 数据库模型

```sql
-- 用户表
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname      VARCHAR(100),
    avatar_url    TEXT,
    role          VARCHAR(20) DEFAULT 'customer', -- customer | merchant | admin
    status        VARCHAR(20) DEFAULT 'active',   -- active | disabled | pending
    email_verified BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 用户地址表
CREATE TABLE user_addresses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(50),           -- 家、公司
    recipient   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20) NOT NULL,
    province    VARCHAR(50) NOT NULL,
    city        VARCHAR(50) NOT NULL,
    district    VARCHAR(50) NOT NULL,
    detail      TEXT NOT NULL,
    postal_code VARCHAR(10),
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh Token 表（支持多设备登录管理）
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    device_info VARCHAR(255),
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 三、商品管理模块

### 3.1 功能清单

| 功能         | 优先级 | 预估工时 |
| ------------ | ------ | -------- |
| 商品 CRUD     | P0     | 8h       |
| 分类管理（树形）| P0    | 6h       |
| SKU/规格管理   | P0    | 10h      |
| 商品搜索/筛选  | P0    | 8h       |
| 图片上传管理   | P0    | 5h       |
| 库存管理       | P0    | 6h       |
| 商品上下架     | P0    | 3h       |
| 商品评价       | P1    | 8h       |
| 商品收藏       | P1    | 4h       |

### 3.2 SKU 设计方案

```
商品(SPU) 1:N SKU
例：T恤（SPU）
  ├── 红色-S  (SKU-001, ¥99, 库存50)
  ├── 红色-M  (SKU-002, ¥99, 库存30)
  ├── 蓝色-S  (SKU-003, ¥89, 库存20)
  └── 蓝色-M  (SKU-004, ¥89, 库存45)
```

### 3.3 数据库模型

```sql
-- 商品分类（支持多级树形）
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    parent_id   UUID REFERENCES categories(id),
    sort_order  INT DEFAULT 0,
    icon_url    TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 商品 SPU
CREATE TABLE products (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id   UUID REFERENCES users(id),
    category_id   UUID REFERENCES categories(id),
    name          VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) UNIQUE NOT NULL,
    description   TEXT,
    rich_content  JSONB,                        -- 富文本详情
    base_price    DECIMAL(10,2) NOT NULL,
    status        VARCHAR(20) DEFAULT 'draft',  -- draft | active | archived
    tags          TEXT[],
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 商品图片
CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    alt_text    VARCHAR(255),
    sort_order  INT DEFAULT 0,
    is_primary  BOOLEAN DEFAULT FALSE
);

-- SKU 规格属性
CREATE TABLE product_attributes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
    name        VARCHAR(50) NOT NULL,    -- 颜色、尺码
    values      JSONB NOT NULL           -- ["红色","蓝色","绿色"]
);

-- SKU
CREATE TABLE product_skus (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID REFERENCES products(id) ON DELETE CASCADE,
    sku_code     VARCHAR(50) UNIQUE NOT NULL,
    attributes   JSONB NOT NULL,          -- {"颜色":"红色","尺码":"M"}
    price        DECIMAL(10,2) NOT NULL,
    stock        INT NOT NULL DEFAULT 0,
    weight       DECIMAL(8,2),            -- 克
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 全文搜索索引
CREATE INDEX idx_products_search ON products
    USING GIN (to_tsvector('chinese', name || ' ' || COALESCE(description, '')));
```

---

## 四、购物车模块

### 4.1 功能清单

| 功能              | 优先级 | 预估工时 |
| ----------------- | ------ | -------- |
| 添加/移除商品      | P0     | 4h       |
| 修改数量           | P0     | 2h       |
| 价格实时计算       | P0     | 4h       |
| 登录前后购物车合并  | P1     | 5h       |
| 失效商品标记       | P0     | 3h       |
| 全选/批量操作      | P0     | 3h       |

### 4.2 存储策略

```
未登录用户 → localStorage（前端）
已登录用户 → Redis（热数据） + PostgreSQL（持久化）

登录时自动合并：localStorage → Redis/DB
合并策略：以服务端数量为准，本地新增商品追加
```

### 4.3 数据库模型

```sql
CREATE TABLE cart_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    sku_id     UUID REFERENCES product_skus(id) ON DELETE CASCADE,
    quantity   INT NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    selected   BOOLEAN DEFAULT TRUE,
    added_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, sku_id)
);
```

### 4.4 价格计算流程

```
前端展示价格（仅供参考）
        │
        ▼ 结算时
后端重新计算（权威价格）
  ├── 1. 查询 SKU 最新价格
  ├── 2. 校验库存
  ├── 3. 应用优惠券/折扣
  ├── 4. 计算运费
  └── 5. 返回结算确认信息
```

---

## 五、订单系统模块

### 5.1 功能清单

| 功能           | 优先级 | 预估工时 |
| -------------- | ------ | -------- |
| 创建订单        | P0     | 8h       |
| 订单列表/详情   | P0     | 6h       |
| 订单状态流转    | P0     | 8h       |
| 库存扣减（锁定） | P0    | 6h       |
| 订单超时取消    | P0     | 5h       |
| 退款申请        | P1     | 8h       |
| 发货/物流跟踪   | P1     | 6h       |
| 订单导出        | P2     | 4h       |

### 5.2 订单状态机

```
                    ┌──────────────┐
          ┌────────│   待支付      │────────┐
          │        │ PENDING_PAY  │        │
          │        └──────┬───────┘        │
          │               │ 支付成功        │ 超时30min
          │               ▼                ▼
          │        ┌──────────────┐  ┌──────────────┐
          │        │   待发货      │  │   已取消      │
          │        │ PENDING_SHIP │  │  CANCELLED   │
          │        └──────┬───────┘  └──────────────┘
          │               │ 商家发货          ▲
          │               ▼                  │ 用户取消
          │        ┌──────────────┐          │
          │        │   待收货      │──────────┘
          │        │  SHIPPED     │
          │        └──────┬───────┘
          │               │ 确认收货 / 自动签收(15天)
          │               ▼
          │        ┌──────────────┐
          │        │   已完成      │
          │        │  COMPLETED   │
          │        └──────┬───────┘
          │               │ 申请退款（7天内）
          │               ▼
          │        ┌──────────────┐
          └───────→│   退款中      │
                   │  REFUNDING   │
                   └──────┬───────┘
                          │
               ┌──────────┴──────────┐
               ▼                     ▼
        ┌──────────────┐     ┌──────────────┐
        │  退款成功      │     │  退款拒绝      │
        │  REFUNDED    │     │ REFUND_DENIED│
        └──────────────┘     └──────────────┘
```

### 5.3 数据库模型

```sql
-- 订单主表
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no        VARCHAR(32) UNIQUE NOT NULL,  -- 业务订单号
    user_id         UUID REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending_pay',
    -- 金额
    items_total     DECIMAL(10,2) NOT NULL,       -- 商品总额
    shipping_fee    DECIMAL(10,2) DEFAULT 0,      -- 运费
    discount_amount DECIMAL(10,2) DEFAULT 0,      -- 优惠金额
    pay_amount      DECIMAL(10,2) NOT NULL,       -- 实付金额
    -- 收货信息（快照，不引用地址表）
    recipient       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    address         TEXT NOT NULL,
    -- 时间
    paid_at         TIMESTAMPTZ,
    shipped_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   TEXT,
    expires_at      TIMESTAMPTZ,                  -- 支付过期时间
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 订单商品明细（快照）
CREATE TABLE order_items (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id   UUID NOT NULL,
    sku_id       UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku_attrs    JSONB NOT NULL,           -- {"颜色":"红色","尺码":"M"}
    image_url    TEXT,
    unit_price   DECIMAL(10,2) NOT NULL,   -- 下单时单价快照
    quantity     INT NOT NULL,
    subtotal     DECIMAL(10,2) NOT NULL
);

-- 订单状态变更日志
CREATE TABLE order_status_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status   VARCHAR(20) NOT NULL,
    operator   VARCHAR(100),              -- system / user / admin
    remark     TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 库存扣减策略

```
下单时：预扣库存（stock - quantity, 同时 locked_stock + quantity）
支付成功：确认扣减（locked_stock - quantity）
超时未付：释放库存（stock + quantity, locked_stock - quantity）

关键：使用 PostgreSQL 行锁 + 乐观锁（version 字段）防止超卖
```

```sql
-- 乐观锁扣库存
UPDATE product_skus
SET stock = stock - $quantity,
    version = version + 1
WHERE id = $sku_id
  AND stock >= $quantity
  AND version = $current_version;
-- 受影响行数为 0 则扣减失败
```

---

## 六、支付集成模块

### 6.1 功能清单

| 功能             | 优先级 | 预估工时 |
| ---------------- | ------ | -------- |
| Stripe 集成       | P0     | 10h      |
| 支付宝/微信（可选）| P1     | 12h      |
| 支付回调处理      | P0     | 6h       |
| 退款接口          | P0     | 5h       |
| 支付状态同步      | P0     | 4h       |
| 对账系统          | P2     | 10h      |

### 6.2 支付流程

```
用户确认订单
     │
     ▼
后端创建支付意向（Payment Intent）
     │
     ▼
返回支付参数给前端
     │
     ▼
前端拉起支付（Stripe Checkout / 支付宝/微信）
     │
     ├── 用户完成支付
     │        │
     │        ▼
     │   支付平台回调 Webhook → 后端
     │        │
     │        ├── 验签（确认回调来源可靠）
     │        ├── 幂等检查（防止重复处理）
     │        ├── 更新订单状态 → paid
     │        ├── 确认库存扣减
     │        └── 发送支付成功通知
     │
     └── 用户取消/超时
              │
              ▼
         订单超时任务 → 释放库存 → 订单取消
```

### 6.3 数据库模型

```sql
-- 支付记录
CREATE TABLE payments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID REFERENCES orders(id),
    payment_no        VARCHAR(64) UNIQUE NOT NULL,
    channel           VARCHAR(20) NOT NULL,         -- stripe | alipay | wechat
    amount            DECIMAL(10,2) NOT NULL,
    currency          VARCHAR(3) DEFAULT 'CNY',
    status            VARCHAR(20) DEFAULT 'pending', -- pending | paid | failed | refunded
    channel_tx_id     VARCHAR(255),                  -- 第三方流水号
    paid_at           TIMESTAMPTZ,
    raw_notify        JSONB,                         -- 原始回调报文（存档审计）
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 退款记录
CREATE TABLE refunds (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id     UUID REFERENCES payments(id),
    order_id       UUID REFERENCES orders(id),
    refund_no      VARCHAR(64) UNIQUE NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    reason         TEXT,
    status         VARCHAR(20) DEFAULT 'pending',   -- pending | processing | success | failed
    channel_refund_id VARCHAR(255),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    completed_at   TIMESTAMPTZ
);
```

### 6.4 安全要点

- Webhook 必须验签（Stripe: `stripe.webhooks.constructEvent`）
- 支付回调必须幂等（以 `payment_no` 做唯一键）
- 金额以「分」为单位在后端传输，避免浮点精度问题
- 敏感配置（Secret Key）只放环境变量，绝不入库或提交代码

---

## 七、API 接口规范

### 7.1 RESTful 路由设计

```
# ──── 认证 ────
POST   /api/v1/auth/register          注册
POST   /api/v1/auth/login             登录
POST   /api/v1/auth/refresh           刷新 Token
POST   /api/v1/auth/logout            登出
POST   /api/v1/auth/forgot-password   忘记密码
POST   /api/v1/auth/reset-password    重置密码

# ──── 用户 ────
GET    /api/v1/users/me               当前用户信息
PUT    /api/v1/users/me               更新个人信息
GET    /api/v1/users/me/addresses     地址列表
POST   /api/v1/users/me/addresses     新增地址
PUT    /api/v1/users/me/addresses/:id 修改地址
DELETE /api/v1/users/me/addresses/:id 删除地址

# ──── 商品 ────
GET    /api/v1/products               商品列表（支持分页/筛选/搜索）
GET    /api/v1/products/:slug         商品详情
GET    /api/v1/categories             分类树
# 商家/管理员
POST   /api/v1/admin/products         创建商品
PUT    /api/v1/admin/products/:id     更新商品
DELETE /api/v1/admin/products/:id     删除商品
POST   /api/v1/admin/products/:id/images 上传图片

# ──── 购物车 ────
GET    /api/v1/cart                   获取购物车
POST   /api/v1/cart/items             添加商品
PUT    /api/v1/cart/items/:id         修改数量
DELETE /api/v1/cart/items/:id         移除商品
POST   /api/v1/cart/merge             合并本地购物车

# ──── 订单 ────
POST   /api/v1/orders                 创建订单
GET    /api/v1/orders                 订单列表
GET    /api/v1/orders/:orderNo        订单详情
POST   /api/v1/orders/:orderNo/cancel 取消订单
POST   /api/v1/orders/:orderNo/confirm 确认收货
# 商家
POST   /api/v1/admin/orders/:orderNo/ship 发货

# ──── 支付 ────
POST   /api/v1/payments/create        创建支付
POST   /api/v1/payments/webhook/stripe Stripe 回调
POST   /api/v1/payments/webhook/alipay 支付宝回调

# ──── 退款 ────
POST   /api/v1/refunds                申请退款
GET    /api/v1/refunds/:refundNo      退款详情
```

### 7.2 统一响应格式

```json
// ��功
{
  "code": 0,
  "data": { ... },
  "message": "success"
}

// 分页
{
  "code": 0,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 156
    }
  }
}

// 错误
{
  "code": 40001,
  "message": "邮箱已被注册",
  "details": { "field": "email" }
}
```

### 7.3 错误码规范

| 范围          | 说明       |
| ------------- | ---------- |
| 0             | 成功       |
| 40001 - 40099 | 认证错误   |
| 40101 - 40199 | 参数校验   |
| 40301 - 40399 | 权限不足   |
| 40401 - 40499 | 资源不存在 |
| 50001 - 50099 | 服务端错误 |
| 50101 - 50199 | 第三方错误 |

---

## 八、项目目录结构

```
ecommerce-platform/
├── apps/
│   ├── web/                          # 用户端前端
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/           # 通用组件
│   │   │   │   ├── ui/               # 基础 UI 组件
│   │   │   │   └── business/         # 业务组件
│   │   │   ├── hooks/                # 自定义 Hooks
│   │   │   ├── layouts/              # 页面布局
│   │   │   ├── pages/                # 页面组件
│   │   │   │   ├── auth/
│   │   │   │   ├── product/
│   │   │   │   ├── cart/
│   │   │   │   ├── order/
│   │   │   │   └── user/
│   │   │   ├── services/             # API 请求封装
│   │   │   ├── stores/               # Zustand 状态管理
│   │   │   ├── types/                # TypeScript 类型定义
│   │   │   ├── utils/                # 工具函数
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── admin/                        # 管理后台前端（结构类似）
│   │
│   └── server/                       # 后端服务
│       ├── src/
│       │   ├── config/               # 配置（DB/Redis/支付等）
│       │   ├── controllers/          # 控制器（路由处理）
│       │   │   ├── auth.controller.ts
│       │   │   ├── product.controller.ts
│       │   │   ├── cart.controller.ts
│       │   │   ├── order.controller.ts
│       │   │   └── payment.controller.ts
│       │   ├── middlewares/          # 中间件
│       │   │   ├── auth.middleware.ts
│       │   │   ├── validate.middleware.ts
│       │   │   ├── rateLimit.middleware.ts
│       │   │   └── errorHandler.ts
│       │   ├── models/              # Prisma Schema
│       │   ├── routes/              # 路由定义
│       │   ├── services/            # 业务逻辑层
│       │   │   ├── auth.service.ts
│       │   │   ├── product.service.ts
│       │   │   ├── cart.service.ts
│       │   │   ├── order.service.ts
│       │   │   └── payment.service.ts
│       │   ├── jobs/                # 后台任务（BullMQ）
│       │   │   ├── orderTimeout.job.ts
│       │   │   └── paymentNotify.job.ts
│       │   ├── utils/
│       │   ├── validators/          # 请求参数校验（Zod）
│       │   └── app.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── tests/
│       └── package.json
│
├── packages/                         # 共享包
│   ├── shared-types/                # 前后端共享类型
│   └── utils/                       # 共享工具
│
├── docker-compose.yml               # 本地开发环境
├── .github/workflows/               # CI/CD
├── turbo.json                       # Turborepo 配置
├── package.json
└── README.md
```

---

## 九、开发里程碑与排期

### Phase 1：基础搭建（第 1-2 周）
- [x] 项目脚手架（Monorepo + Turborepo）
- [x] Docker 开发环境（PostgreSQL + Redis）
- [x] Prisma Schema 初始化 + 数据库迁移
- [x] 基础中间件（鉴权/错误处理/日志/限流）
- [x] 前端项目初始化（路由/状态管理/请求封装）
- 预估工时：**30-35h**

### Phase 2：用户系统（第 2-3 周）
- [ ] 注册/登录/JWT 鉴权
- [ ] 个人中心/地址管理
- [ ] 角色权限基础框架
- 预估工时：**35-40h**

### Phase 3：商品模块（第 3-5 周）
- [ ] 商品 CRUD + 分类管理
- [ ] SKU/规格管理
- [ ] 商品搜索/列表/详情页
- [ ] 图片上传
- 预估工时：**45-50h**

### Phase 4：购物车 + 订单（第 5-7 周）
- [ ] 购物车全功能
- [ ] 订单创建/状态流转
- [ ] 库存扣减/锁定
- [ ] 订单超时自动取消
- 预估工时：**45-50h**

### Phase 5：支付集成（第 7-8 周）
- [ ] Stripe 集成
- [ ] 支付回调 + 幂等处理
- [ ] 退款流程
- 预估工时：**25-30h**

### Phase 6：完善与上线（第 8-10 周）
- [ ] 管理后台（商家端）
- [ ] E2E 测试
- [ ] 性能优化（缓存/索引/CDN）
- [ ] 部署方案落地
- [ ] 安全审计（XSS/CSRF/SQL注入/限流）
- 预估工时：**30-40h**

**总计：210-245h，建议预留 10-15% 缓冲 → 约 10-12 周**

---

## 十、关键技术决策备忘

| 决策点             | 选择                | 原因                                    |
| ------------------ | ------------------- | --------------------------------------- |
| Monorepo 方案       | Turborepo           | 原生支持好，缓存快，配置简单              |
| ORM                | Prisma              | 类型安全、迁移简单、与 TS 深度集成         |
| 状态管理            | Zustand             | 比 Redux 轻量，API 简洁，不需要模板代码   |
| 缓存               | Redis               | 购物车热数据 + 会话 + 限流计数器          |
| 消息队列            | BullMQ              | 基于 Redis，不引入额外基础设施            |
| 金额存储            | DECIMAL(10,2)       | 避免浮点精度问题，传输用「分」为单位       |
| 订单号生成          | 雪花算法/时间戳+随机  | 有序、唯一、不暴露业务量                  |
| 收货地址            | 订单内快照           | 地址修改不影响历史订单                    |
| 库存扣减            | 乐观锁 + 预扣        | 平衡性能和一致性                         |
| 搜索               | PG 全文检索          | MVP 阶段够用，后续可迁移至 Elasticsearch  |
