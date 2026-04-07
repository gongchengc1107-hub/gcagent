## Context

设置页路由 `/settings/*` 已在 C0 路由系统中预留。useAuthStore 包含用户信息和 logout 方法。useThemeStore 包含主题切换逻辑。Provider 配置需要新的 useProviderStore。消耗统计需要调用 `codemaker quota` CLI 命令（Mock 阶段使用 Mock 数据）。

## Goals / Non-Goals

**Goals:**

- 实现完整的设置页 5 个子页面
- 双栏布局，左侧分类菜单导航
- 所有配置操作即时生效或明确保存
- 危险操作（退出登录、清空数据）需二次确认

**Non-Goals:**

- 不实现真实的 codemaker serve 管理（Mock）
- 不实现真实的 codemaker quota 调用（Mock）
- 不实现直连模式的真实 API 测试（Mock）

## Decisions

### D1: 设置页布局

**选择**：左侧分类菜单（180px 固定宽度）+ 右侧内容区（flex-1）

**理由**：
- 5 个分类菜单项：账户 / AI Provider / 消耗统计 / 外观 / 数据管理
- 使用路由嵌套：`/settings/account`、`/settings/provider` 等
- 默认进入账户设置
- 菜单项使用图标 + 文字，选中态高亮背景

### D2: Provider 配置数据结构

**选择**：

```typescript
interface ProviderConfig {
  mode: 'codemaker' | 'direct';
  // Codemaker 模式
  serveStatus: 'running' | 'stopped' | 'restarting';
  serveAddress: string; // e.g. "127.0.0.1:4000"
  // 直连模式
  apiBaseUrl: string;
  apiKey: string;
  customModels: string[];
  connectionStatus: 'idle' | 'testing' | 'success' | 'failed';
  connectionError?: string;
}
```

**理由**：
- mode 区分两种 AI 接入模式
- serveStatus 展示 codemaker serve 运行状态
- 直连模式需要 API 配置和连接测试状态
- 全部 Mock 阶段：serveStatus 默认 running，连接测试默认 success

### D3: 消耗统计数据结构

**选择**：

```typescript
interface UsageStats {
  month: string; // "2026-01"
  tokenUsage: number;
  apiCalls: number;
  cost: number;
  loading: boolean;
  error?: string;
}
```

**理由**：
- Mock 阶段使用随机生成的统计数据
- 月份选择器从 2026-01 开始
- 真实阶段通过 Electron IPC 执行 `codemaker quota` CLI

### D4: 主题切换交互

**选择**：两个可视化预览卡片（Light / Dark），点击即时切换，无保存按钮

**理由**：
- 参考 macOS 系统偏好的外观设置风格
- 选中卡片有蓝色边框高亮
- 切换后自动调用 useThemeStore.setTheme()，持久化到 localStorage

### D5: 数据清空安全措施

**选择**：两级确认 — 点击按钮后弹出确认弹窗，弹窗中用红色 danger 按钮

**理由**：
- 清空操作不可恢复，必须强调风险
- 弹窗描述明确列出将被清除的数据类型
- 确认按钮文案为 "我了解风险，确认清空"
- 清空后自动跳转到登录页

## Risks / Trade-offs

- **[Risk] CLI 调用失败** → 缓解：显示错误提示 + 重试按钮
- **[Risk] 数据误删** → 缓解：两级确认 + 明确风险提示
- **[Trade-off] 设置即时生效 vs 统一保存** → 选择即时生效，降低用户操作步骤（主题、Provider 模式切换即时生效）
