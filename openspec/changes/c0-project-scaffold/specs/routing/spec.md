## ADDED Requirements

### Requirement: Hash 路由配置
应用 SHALL 使用 createHashRouter 配置以下一级路由：

| 路径 | 页面 |
|------|------|
| `/login` | 登录页 |
| `/chat` | 聊天页 |
| `/agents` | Agents 管理页 |
| `/skills` | Skills 管理页 |
| `/mcp` | MCP 工具管理页 |
| `/settings` | 设置页 |

#### Scenario: 路由正常导航
- **WHEN** 用户点击导航项或地址栏输入路由路径
- **THEN** 对应页面正确渲染，URL hash 更新

#### Scenario: 未知路由重定向
- **WHEN** 用户访问未定义的路由路径
- **THEN** 自动重定向到 `/chat`

### Requirement: 路由守卫占位
路由系统 SHALL 预留认证守卫位置，未登录用户访问受保护路由时重定向到 `/login`。C0 阶段仅搭建骨架，具体逻辑在 C1 实现。

#### Scenario: 路由守卫骨架
- **WHEN** C0 完成后
- **THEN** 存在 AuthGuard 组件占位，默认放行所有请求（C1 接入真实逻辑）

### Requirement: 布局路由嵌套
除登录页外，其他页面 SHALL 共享全局布局（侧边栏 + 内容区）。登录页使用独立的全屏布局。

#### Scenario: 登录页独立布局
- **WHEN** 用户在登录页
- **THEN** 不显示全局侧边栏，使用全屏布局

#### Scenario: 主功能页共享布局
- **WHEN** 用户在聊天/Agents/Skills/MCP/设置页
- **THEN** 显示全局侧边栏导航 + 右侧内容区
