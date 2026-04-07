# Project Context

## Purpose
MUSE（素材资产管理平台）是网易内部的数字资产管理系统前端项目，用于管理游戏开发中的各类素材资源，包括3D模型、音频、图片、视频、特效、工程文件等。平台支持素材的上传、分类、搜索、预览、下载、协作共享等功能，服务于游戏研发团队的资产管理需求。

## Tech Stack
- **框架**: React 18 + UmiJS Max 4.0
- **语言**: TypeScript 4.9
- **状态管理**: Redux + MobX + UmiJS Model
- **UI 组件库**: Bedrock（网易内部组件库）
- **样式方案**: TailwindCSS 3.3（优先）+ styled-components（复杂动态样式）+ Less（仅全局基础样式）
- **3D 渲染**: Three.js 0.160 + 自研 @muse/3d-viewer
- **拖拽功能**: @dnd-kit + react-dnd + sortablejs
- **国际化**: kiwi-intl
- **工具库**: ahooks, lodash-es, dayjs
- **构建工具**: Babel + Webpack (通过 UmiJS 封装)
- **包管理器**: pnpm 7.33

## Project Conventions

### Code Style
- 使用 ESLint (Airbnb 规范) + Prettier 进行代码格式化
- 使用 commitlint 规范提交信息，遵循 Conventional Commits
- CSS/Less 使用 Stylelint 检查，属性按 idiomatic 顺序排列
- 组件使用 PascalCase 命名，hooks 使用 use 前缀
- 类型定义放在 `types/` 目录或组件同级 `type.ts` 文件
- 导入顺序由 prettier-plugin-organize-imports 自动排序

### Architecture Patterns
- **目录结构**:
  - `src/pages/` - 页面组件，按功能模块划分（Admin、PersonCenter、Model、Audio 等）
  - `src/components/` - 可复用 UI 组件
  - `src/hooks/` - 自定义 React Hooks
  - `src/services/` - API 请求服务
  - `src/OpenApiServices/` - OpenAPI 自动生成的服务代码
  - `src/redux/` - Redux store 和 reducers
  - `src/models/` - UmiJS Model（轻量状态管理）
  - `src/utils/` - 工具函数
  - `src/locales/` - 国际化资源
  - `src/layouts/` - 页面布局组件
  
- **路由配置**: 集中在根目录 `routes.ts`，使用 UmiJS 集中式路由配置（非约定式文件路由）

- **API 管理**: 使用 @oahz/neact-openapi 从 OpenAPI 文档自动生成 API 代码（历史遗留的 pont-engine 生成代码仍在部分老业务中使用，待清理）

- **组件模式**: 
  - 页面组件通常配套 `reducer/`、`hooks.ts`、`usePresenter.tsx` 等文件
  - 复杂状态使用 useReducer 或 Redux
  - UI组件使用 Bedrock 组件库

### Testing Strategy
- 目前无单元测试配置
- 依赖 ESLint + TypeScript 进行静态检查

### Git Workflow
- 使用 Husky + lint-staged 进行 pre-commit 检查
- 提交信息需遵循 commitlint 规范（conventional commits）
- 分支策略: master 为测试环境，production 为生产环境

## Domain Context
- **素材类型**: 3D模型(Model)、音频(Audio)、图库(Gallery)、特效(Effects)、工程文件(Engineering)、简单动作(SimpleAction)、高级材质(AdvancedMaterial)、专利(Patent)、创新素材(Innovation)、工具(Tools)
- **核心功能**: 素材分类管理、标签系统、版本控制、权限管理、协作共享、购物车、收藏、评分评论、QA问答、供应商管理
- **用户角色**: 普通用户、管理员、超级管理员、供应商、财务管理员等
- **组织体系**: 支持多仓库(Repository)、多组织结构

## Important Constraints
- 需兼容网易内部 SSO 认证体系
- 部分资源需从内部 CDN 加载
- 使用 hash 路由模式
- 生产环境部署路径为 `/muse_m_new/`
- 需支持 Scout 监控上报（网易内部监控系统）

## Performance Monitoring

### 性能数据采集 (`scripts/performance.js`)
项目使用 `window.performanceReport` 对象进行页面性能数据采集，在页面加载时通过 headScripts 注入。

**采集的指标：**
- **导航性能**: DNS查询、TCP连接、SSL协商、请求响应、DOM解析等（通过 Performance Navigation Timing API）
- **关键时间点**: 
  - `domContentLoaded` - DOMContentLoaded 事件时间
  - `resourceLoaded` - load 事件时间
  - `userInfoLoaded` - 用户信息加载完成
  - `appInited` - 应用初始化完成
  - `dataLoaded` - 页面数据加载完成
  - `pageReady` - 页面完全可交互
- **Web Vitals**: FCP (First Contentful Paint)、LCP (Largest Contentful Paint)
- **Long Task 监控**: 使用 PerformanceObserver 监控超过 200ms 的长任务，按耗时分级（200-400ms、400-600ms、600-1000ms、1000ms+）
- **资源信息**: 未命中缓存的 JS/CSS 资源数量和大小

**使用方式：**

1. **应用初始化阶段** (`src/layouts/layout.tsx`)
```typescript
useEffect(() => {
  window.performanceReport?.record('appInited');
  window.performanceReport?.setLandingPath(window.location.pathname + window.location.search);
}, []);

useEffect(() => {
  window.performanceReport?.startLongTaskObserver();
}, []);
```

2. **列表页面** - 数据加载完成时上报 (`CommonContainer`、`Featured`、`Gallery`、`Search` 等)
```typescript
useUpdateEffect(() => {
  if (!loading) {
    window.performanceReport?.record('dataLoaded');
    window.performanceReport?.record('pageReady');
    window.performanceReport?.send({
      route: '/#/muse/search',
      assetType: currentType,  // 可选：附加业务参数
    });
  }
}, [loading]);
```

3. **详情页面** - 资产详情加载完成时上报 (`Engineering/Detail`、`Favorites/Detail` 等)
```typescript
useUpdateEffect(() => {
  if (loading && !assetInfo) return;
  window.performanceReport?.record('dataLoaded');
  window.performanceReport?.record('pageReady');
  window.performanceReport?.send({
    route: `/#/${organization}/${assetType}/detail`,
    name: '资源包详情',  // 可选：页面名称
  });
}, [loading, assetInfo]);
```

4. **轻量页面** - 无需等待数据直接上报 (`Explore`、`PersonCenter` 等)
```typescript
useUpdateEffect(() => {
  if (!loading) {
    window.performanceReport?.record('pageReady');
    window.performanceReport?.send({ route: '/#/muse/explore' });
  }
}, [loading]);

// 或在组件挂载时直接上报
useEffect(() => {
  window.performanceReport?.record('pageReady');
  window.performanceReport?.send({ route: `/#/person-center/tab/${activeTab}` });
}, []);
```

**已接入性能上报的页面：**
| 页面 | 路由示例 | 上报时机 |
|-----|---------|---------|
| 仓库模块页 | `/#/{org}/{assetType}` | 数据加载完成 |
| 首页 | `/#/muse/featured` | 数据加载完成 |
| 全局搜索页 | `/#/muse/search` | 数据加载完成 |
| 图库页 | `/#/{org}/gallery` | 数据加载完成 |
| 图库详情页 | `/#/{org}/gallery/detail/{id}` | 数据加载完成 |
| 探索页 | `/#/muse/explore` | 页面加载完成 |
| 个人中心 | `/#/person-center/tab/{tab}` | 组件挂载 |
| 收藏详情 | `/#/person-center/favorites/detail` | 数据加载完成 |
| 资产详情 | `/#/{org}/{assetType}/detail` | 数据加载完成 |
| 工程详情页 | `/#/{org}/engineering/detail` | 数据加载完成 |
| 问答专区 | `/#/qa` | 页面加载完成 |
| 简单动作列表 | `/#/{org}/simpleAction` | 数据加载完成 |
| 简单动作详情 | `/#/{org}/simpleaction-detail/{type}` | 数据加载完成 |

### 数据上报 (`src/utils/analysis.ts`)
使用 `AnalysisTool` 类（单例模式，挂载为 `window.__Analysis__`）进行埋点数据上报。

**上报服务地址：**
- 测试环境: `muse-analysis-test.netease.com`
- UAT环境: `muse-analysis-uat.netease.com`
- 生产环境: `muse-analysis.netease.com`

**事件类型 (EventType)：**
- `access` - 页面访问（自动监听 URL 变化）
- `click` - 点击事件
- `api` - API 请求追踪
- `track` - 自定义追踪事件
- `performance` - 性能数据

**上报机制：**
- 批量上报：累积 30 条或超过 64KB 时触发，或距上次记录超过 2 秒
- 使用 `navigator.sendBeacon` 优先发送，失败时降级为 fetch
- 设备指纹通过 `@fingerprintjs/fingerprintjs` 生成
- 会话 ID 存储在 sessionStorage

**性能数据流转：**
`performance.js` → `window.performanceReport.sendHandle()` → `window.__Analysis__.performance()` → 批量上报到 muse-analysis 服务

### 组件级性能监控 (`src/Performance.tsx`)

使用 `withPM` 高阶组件包装 React 组件，基于 React Profiler API 采集组件渲染性能数据。

**采集的指标 (PerformanceMetrics)：**
| 字段 | 说明 |
|-----|------|
| `componentName` | 组件名称 |
| `phase` | 渲染阶段：`mount`（首次挂载）或 `update`（更新） |
| `actualDuration` | 本次渲染实际耗时（ms） |
| `baseDuration` | 无优化情况下的预估渲染耗时（ms） |
| `startTime` | 渲染开始时间 |
| `commitTime` | 渲染提交时间 |
| `changedProps` | 变化的 props（包含 from/to 值） |

**配置选项 (PerfMonitorOptions)：**
| 选项 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `componentName` | string | 组件 displayName/name | 组件标识名称 |
| `log` | boolean | true | 是否在控制台输出 |
| `logColor` | string | '#b76208' | 控制台日志颜色 |
| `threshold` | number | 1 | 控制台输出阈值（ms） |
| `report` | boolean | false | 是否上报到 analysis |
| `reportThreshold` | number | 50 | 上报阈值（ms） |
| `reportChecker` | function | - | 自定义上报判断函数 |
| `reportProps` | function | - | 自定义上报数据提取函数 |

**使用示例：**

1. **基础用法** - 仅控制台输出
```typescript
import withPM from '@/Performance';

export default withPM(MyComponent, {
  componentName: 'MyComponent',
  threshold: 20,  // 超过 20ms 才输出日志
});
```

2. **启用上报** - 超过阈值自动上报
```typescript
export default withPM(AssetAttachmentsTree, {
  componentName: 'AssetAttachmentsTree',
  threshold: 10,
  report: true,  // 启用上报，默认超过 50ms 上报
});
```

3. **自定义上报数据** - 附加业务参数
```typescript
export default withPM(ModelPreview, {
  componentName: 'ModelPreview',
  threshold: 10,
  reportThreshold: 100,  // 超过 100ms 才上报
  report: true,
  reportProps: (data) => ({
    organization: data.props?.organization,
    assetType: data.props?.assetType,
  }),
});
```

4. **自定义上报条件** - 精细控制
```typescript
export default withPM(FullResourceViewer, {
  componentName: 'FullResourceViewer',
  threshold: 10,
  report: true,
  reportChecker: (data) => {
    // 仅当有 assetId、非 loading 状态、耗时超过 100ms 时上报
    return !!data.props?.assetId && !data.props.loading && data.actualDuration > 100;
  },
  reportProps: (data) => ({
    assetId: data.props?.assetId,
    assetType: data.props?.assetType,
    fileType: data.props?.previewItem?.fileType,
  }),
});
```

5. **支持 forwardRef 组件**
```typescript
export default withPM(forwardRef(Index), {
  componentName: 'AssetAttachmentsTree',
  report: true,
});
```

6. **运行时动态配置** - 通过 props 覆盖
```tsx
<MyComponent 
  __componentName__="特定场景"
  __reportThreshold__={200}
  __report__={(data) => data.phase === 'mount'}
  __reportProps__={(data) => ({ customField: data.props.id })}
/>
```

**已接入组件级性能监控的组件：**
| 组件 | 用途 | 上报配置 |
|-----|------|---------|
| `ModelPreview` | 3D 模型预览 | 超过 100ms 上报，附加 organization/assetType |
| `FullResourceViewer` | 资源预览器 | 自定义条件，附加资产信息 |
| `AssetAttachmentsTree` | 资产附件树 | 超过 50ms 上报 |
| `GalleryMasonry` | 图库瀑布流 | 仅日志，不上报 |
| `Banner` | 首页轮播图 | 仅日志 |
| `ProjectOrganization` | 探索页项目组织 | 仅日志 |
| `AssetRecommendList` | 探索页推荐列表 | 仅日志 |
| `HotUserFavorites` | 探索页热门收藏 | 仅日志 |
| `ActivityCalendar` | 探索页活动日历 | 仅日志 |
| `PreviewAsset` | 资产预览 | 配置上报 |
| `ModelViewer` | 模型查看器 | 配置上报 |
| `AdvancedmaterialViewer` | 高级材质查看器 | 配置上报 |
| `MuseTable` | 通用表格组件 | 超过 100ms 上报 |
| `DragTable` | 拖拽表格组件 | 超过 100ms 上报 |
| `ResizableTable` | 可调整列宽表格 | 超过 100ms 上报 |
| `AssetList` | 虚拟滚动资产列表 | 超过 100ms 上报 |
| `ImageList` | 图库详情图片列表 | 超过 100ms 上报，动态 componentName（grid/table/preview） |
| `DetailBottomTabs` | 详情页底部标签栏 | 超过 100ms 上报 |
| `SimilarPanel` | 相似资产面板 | 超过 100ms 上报 |
| `SimilarAssets` | 相似资产组件 | 超过 100ms 上报 |

**注意事项：**
- 需要在 `.umirc.ts` 配置 `'react-dom$': path.resolve(__dirname, 'node_modules', 'react-dom/profiling')` 以启用 Profiler
- 避免在 `reportProps` 中返回完整的 props 或大型数据，防止数据量过大
- 确保上报数据无循环引用，否则 JSON.stringify 会报错
- 对于频繁重渲染的组件，使用 `reportChecker` 控制上报条件，避免产生大量无效统计

## External Dependencies
- **网易内部服务**:
  - @bedrock/* - 网易内部 UI 组件库
  - @muse/* - MUSE 平台专用组件库
  - @scout/webpack-plugin - 前端监控
  - muse-threejs-viewer - 3D 预览器（内部 GitLab 仓库）
  
- **API 服务**:
  - museService - 主业务 API
  - museAnalysis - 分析服务
  - museLog - 日志服务
  - museStatistic - 统计服务
