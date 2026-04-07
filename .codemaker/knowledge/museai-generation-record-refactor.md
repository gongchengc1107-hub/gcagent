# MuseAI 3D 全流程生成记录面板改造

## 改造背景

易协作单：**#26259 【生成四视图与模型改为API对接方式】网页端总单**

3D 角色生成的右侧"生成记录列表"需要与已有的"文生动作生成记录列表"在样式、交互、代码架构上保持一致。通过抽象公共组件实现两边复用。

## 核心约束（NON-NEGOTIABLE）

> ⛔ **不影响原文生动作的所有功能** — 这是一切改造的核心前提。
> MotionPanel 和 ActionItem 的 props 接口不能变，所有交互行为保持原样。

## 设计决策

### 1. 公共组件抽象

| 组件 | 路径 | 用途 |
|------|------|------|
| `RecordItem` | `src/components/MuseAI/common/RecordItem/index.tsx` | 通用记录条目骨架（折叠/展开、Checkbox、时间戳），通过 renderProps/slot 自定义内容 |
| `RecordListToolbar` | `src/components/MuseAI/common/RecordListToolbar/index.tsx` | 顶部操作栏（多选/已选N个/取消 + 全部展开/收起），搜索框通过 `searchSlot` 可选传入 |
| `RecordBatchFooter` | `src/components/MuseAI/common/RecordBatchFooter/index.tsx` | 多选底部操作栏（取消/下载/保存slot），三列网格布局 |

### 2. RecordItem 的 slot 设计

| Slot | 3D 角色生成 | 文生动作 |
|------|-----------|---------|
| `renderTags` | 步骤 Button（四视图/模型），选中态 `border-primary-1 text-primary-1` | 无 |
| `renderTitle` | 无 | Prompt 文本 + 复制按钮 + 搜索高亮 |
| `renderContent` | 按步骤缩略图（4列网格 h-[65px]，Image + aiActionDefaultCover 兜底） | 附件网格（4列 h-[65px]） |
| `renderActions` | 复用动作（type=default + action_s.svg） + 删除（icon） | 下载/保存/删除（icon） |

### 3. 多选粒度

- **3D 角色生成**：附件级（selectedFileUrls），记录级 Checkbox 联动选中所有步骤附件
- **文生动作**：附件级（selectedAttachmentIds），由 useCommonBatch 管理

### 4. 数据加载模式

3D 全流程改为与文生动作一致：
- `useRequest` + `InfiniteScroll` 分页加载
- `listRef.current` 缓存已加载记录
- `useThrottleFn` 节流首次加载
- 有 processing 记录时 `pollingInterval: 5000` 自动轮询
- Mock 数据独立文件 `src/components/MuseAI/GenerationRecord/mockData.ts`

### 5. ActionItem 改造策略

**内部引入 RecordItem 作为骨架，props 接口完全不变**，MotionPanel 父组件零改动。

### 6. 3D 全流程特有逻辑

- 步骤标签用 Button 组件（默认 `border-color-1 text-color-2`，选中 `border-primary-1 text-primary-1`）
- 生成中状态：纯文字"正在生成中，请稍候..."（不显示 loading 骨架图）
- 复用动作按钮：仅在 model 步骤 status === 'success' 时显示，type="default" 带底色
- 保存到仓库：单条记录无保存按钮，仅在批量操作和预览器中

## 文件变更清单

### 新建文件
- `src/components/MuseAI/common/RecordItem/index.tsx`
- `src/components/MuseAI/common/RecordListToolbar/index.tsx`
- `src/components/MuseAI/common/RecordBatchFooter/index.tsx`
- `src/components/MuseAI/GenerationRecord/mockData.ts`

### 改造文件
- `src/components/MuseAI/GenerationRecord/index.tsx` — 全面改造（公共组件 + useRequest + InfiniteScroll）
- `src/pages/SimpleAction/AISimpleAction/ActionItem.tsx` — 内部改用 RecordItem（props 接口不变）
- `src/components/MuseAI/MotionPanel/index.tsx` — 操作栏和底部栏替换为公共组件（功能不变）

### 未改动（保持原样）
- `src/models/museai.ts`
- `src/types/museai.ts`
- `src/pages/SimpleAction/AISimpleAction/SaveToOrganizationModal.tsx`

## 相关 PRD

- `PRD/生成四视图与模型改为API对接方式.md` — 完整需求文档（含 12 张图片）
- `PRD/images/生成四视图与模型改为API对接方式/` — UI 原型图
