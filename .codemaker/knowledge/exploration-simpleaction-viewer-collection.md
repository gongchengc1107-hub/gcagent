# SimpleAction Viewer & Collection 架构分析

## 1. SimpleActionViewer Tab 切换实现

**文件**: `src/pages/SimpleAction/SimpleActionViewer/index.tsx`

### Tab 组件
- 使用 `@bedrock/components` 的 `Tabs` + `TabPane`（从 `@bedrock/components/es/Tabs` 导入）
- 用 `styled` 包装为 `TabsStyled`，自定义样式（隐藏 nav bottom border，自定义 padding/margin/color）

### Tab 结构
```tsx
enum TabEnum {
  VIEWER = 'VIEWER',
  DETAIL = 'DETAIL',
}

const VIEWER_TABS = [
  { key: TabEnum.VIEWER, text: '预览' },
  { key: TabEnum.DETAIL, text: '详情' },
];

// 状态
const [currActiveTab, setCurrActiveTab] = useState(TabEnum.VIEWER);

// 渲染（line 335-344）
<TabsStyled activeKey={currActiveTab} onChange={(value) => setCurrActiveTab(value as TabEnum)}>
  {VIEWER_TABS.map((item) => (
    <TabPane tab={item.text} key={item.key} />
  ))}
</TabsStyled>

// 内容切换用 className hidden 控制显隐（非条件渲染）
// line 482: className={classNames({ hidden: currActiveTab !== TabEnum.VIEWER })}
// line 489: className={classNames({ hidden: currActiveTab !== TabEnum.DETAIL })}
```

### 资产选中时重置到预览 tab
```tsx
// line 316: 当 selectedAssetId 变化时
setCurrActiveTab(TabEnum.VIEWER);
```

## 2. Detail 组件

**文件**: `src/pages/SimpleAction/SimpleActionViewer/Detail.tsx`

### Props
```tsx
interface Props {
  className?: string;
  assetInfo?: SimpleActionDetail;
  baseInfo?: BaseInfoProps;
  scrollEl?: HTMLDivElement | null;
}
```

### BaseInfoProps（定义在 Viewer.tsx）
```tsx
export interface BaseInfoProps {
  id?: string;
  assetType: AssetTypeEnum;
  organization?: string;
  fromOrganization?: string;
  supplierProSpaceId?: string;
  refer?: string;
  from?: string;
  canEdit?: boolean;
  assetReferType?: AssetReferType;
  isSupSpaceAsset?: boolean;
}
```

### Detail 显示内容
1. **面包屑导航** - `HeaderBread`
2. **作者信息** - Avatar + authorName + createdAt + coAuthors + dataSource
3. **统计信息** - assetOperateLog（浏览/收藏/下载等操作日志）
4. **标签** - `BaseAssetTags`（组织/引用/标签等）
5. **AI标签** - `AITag`（aiTagsMulti）
6. **资产字段** - `BaseAssetFields`（通用资产字段信息）
7. **AI标注** - `AiMark`（aiPrompt 展示/编辑）
8. **关联资产** - `RelatedAssets`（使用 useRelatedAssets hook）
9. **操作日志弹窗** - assetOperateLogModal

### API 调用
- **useRelatedAssets** hook 调用 `apiPostApiAssetGatherRelationList`，通过 assetCodes 分页获取关联资产
- **useAssetOperateLog** hook（来自 `@/components/AssetDetailNew/Components/`）获取操作日志

## 3. 复用动作集（Collection）页面结构

### 页面路由层级
- `/muse/simpleaction-collection` → **Collection/index.tsx** - 复用动作列表
- `/muse/simpleaction-collection/:id` → **Collection/Detail/index.tsx** - 已选动作详情
- Selection 页 → **Collection/Selection/index.tsx** - 挑选动作

### Collection/index.tsx（复用动作列表）
- 展示所有复用动作集的卡片列表（`CollectionCard`）
- 操作菜单：分享、下载、重命名、编辑、删除
- 标题显示"复用动作"+ 数量

### Collection/Detail/index.tsx（已选动作 - 动作集详情）
- **API**: 
  - `apiGetApiCharacterCollectorCharacterCollectorIdDetail` - 获取动作集详情
  - `apiGetApiCharacterCollectorCharacterCollectorIdListSimpleAction` - 获取已选动作列表
- **左侧**: 封面图 + 名称 + 操作按钮（下载/挑选/分享/导出/打开原资产）
- **右侧**: `ModelViewer` 预览器（复用自 SimpleActionViewer 的 Viewer 组件）
- **动作列表**: `ModelItem` 卡片 + 选中/取消
- **按钮**: "挑选" 跳转到 Selection 页面
- `useCharacterBinding` 判断角色是否可套用播放（需要 fbx + neural + skeleton 三个文件）
- 导出功能通过 `ExportActionModal` 实现

### Collection/Selection/index.tsx（挑选动作页面）
- **顶部**: 返回按钮 + 集合名称 + "已选动作" Badge 按钮
- **左侧**: CategoryTree 分类树 + Tab 切换资产类型
  - Tab 使用 `@bedrock/components` 的 `Tabs.TabPane`，遍历 `simpleActionInfoList`（排除 CHARACTER）
  - Tab 类型: SIMPLE_ACTION、MOCAP、AI_ACTION
- **中间**: FilterMenuBar + 搜索 + 资产列表 + 分页
- **右侧**: `ModelViewer` 预览选中的动作
- **特殊**: AI_ACTION tab 下显示 `ActionGenerationEntry`（AI 生成动作入口）
- 仓库选择器限定 `AssetTypeEnum.SIMPLE_ACTION`
- 包含"含动作谱"Switch 过滤

## 4. 数据模型

### AssetTypeEnum（src/types/AssetType.ts）
```tsx
enum AssetTypeEnum {
  CHARACTER = 'character',        // 角色/皮肤
  SIMPLE_ACTION = 'simpleaction', // 动作
  MOCAP = 'mocap',                // 视频动捕
  AI_ACTION = 'aiaction',         // AI动作
  ENGINEERING = 'engineering',    // 资源包
  DM_MODEL = 'dmmodel',          // DM模型
  // ... 其他类型
}
```

### simpleActionInfoList（src/utils/assetType.tsx:175）
动作模块的4种子类型：
- CHARACTER（角色）- icon: skinS, title: 角色
- SIMPLE_ACTION（动作）- icon: actionS, title: 动作
- MOCAP（视频动捕）- icon: film, title: 视频动捕
- AI_ACTION（AI动作）- icon: ai, title: AI动作

### 角色（Character）的来源
在代码中，角色的来源通过 `assetType` 和 `originAssetType` 区分，并不是一个独立字段"characterSource"。复用动作集中的角色来源：
- **资源包 (ENGINEERING)** - `assetDetail.assetType === AssetTypeEnum.ENGINEERING`，需要 folderId
- **动作-角色 (CHARACTER)** - `assetDetail.assetType === AssetTypeEnum.CHARACTER`
- **DM模型 (DM_MODEL)** - `assetDetail.assetType === AssetTypeEnum.DM_MODEL`
- 详见 `Collection/utils.tsx` 的 `fetchAssetDetail` 方法，根据不同 assetType 走不同 API

### 角色套用播放条件（useCharacterBinding）
角色需要同时拥有三种文件才能进行套用播放：
- **fbx** - 皮肤文件
- **neural** - 神经网络文件
- **skeleton** - 骨骼文件

### 动作谱绑定（ActionPu Binding）
- 角色和动作都有 `hasActionPu` 标识
- 当两者都有时(`isActionPuBinding`)，使用动作谱演示
- 套用播放也是一种 binding 方式(`isCharacterBinding`)

## 5. Collection ModelViewer（复用动作集预览器）

**文件**: `src/pages/SimpleAction/Collection/components/ModelViewer.tsx`

```tsx
interface ModelViewerProps {
  characterDetail: SimpleActionDetail;    // 角色详情
  actionDetail?: SimpleActionDetail;      // 动作详情（可选）
  characterBinding?: CharacterBindingResult; // 角色套用播放结果
}
```

- 复用了 `SimpleActionViewer/Viewer.tsx` 组件
- 根据 binding 状态合并 characterDetail 和 actionDetail 的文件
- 支持下载和复制链接操作

## 6. 关键文件清单

| 文件 | 作用 |
|------|------|
| `src/pages/SimpleAction/SimpleActionViewer/index.tsx` | 动作预览器入口（Tab切换） |
| `src/pages/SimpleAction/SimpleActionViewer/Detail.tsx` | 动作详情面板 |
| `src/pages/SimpleAction/SimpleActionViewer/Viewer.tsx` | 3D预览器（BaseInfoProps定义处） |
| `src/pages/SimpleAction/SimpleActionViewer/useRelatedAssets.tsx` | 关联资产hook |
| `src/pages/SimpleAction/Collection/index.tsx` | 复用动作列表页 |
| `src/pages/SimpleAction/Collection/Detail/index.tsx` | 复用动作集详情（已选动作） |
| `src/pages/SimpleAction/Collection/Selection/index.tsx` | 挑选动作页 |
| `src/pages/SimpleAction/Collection/components/ModelViewer.tsx` | 复用动作集预览器 |
| `src/pages/SimpleAction/Collection/hooks/useCharacterBinding.ts` | 角色套用播放hook |
| `src/pages/SimpleAction/Collection/components/ExportActionModal.tsx` | 导出动作弹窗 |
| `src/pages/SimpleAction/Collection/utils.tsx` | 工具函数（fetchAssetDetail等） |
| `src/pages/SimpleAction/components/ModelDetailPanel/index.tsx` | 模型详情面板 |
| `src/types/AssetType.ts` | AssetTypeEnum定义 |
| `src/utils/assetType.tsx` | simpleActionInfoList等工具 |
