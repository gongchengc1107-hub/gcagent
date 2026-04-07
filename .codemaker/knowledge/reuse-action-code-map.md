# 复用动作功能 - 代码结构全景图

## 一、核心组件（已有复用动作入口代码 ⭐）

### 1. MotionPanel（文生动作面板）
| 文件 | 说明 |
|------|------|
| `src/components/MuseAI/MotionPanel/index.tsx` | ⭐ 文生动作主面板，包含复用动作入口（单个/多选场景），使用 `ReuseActionDropdown` 和 `useCommonBatch` |
| `src/components/MuseAI/MotionPanel/ReuseActionDropdown.tsx` | ⭐ 复用动作下拉菜单组件（"创建复用列表" + "添加到复用列表"），内部使用 `useReuseAction` |
| `src/components/MuseAI/MotionPanel/SelectCollectionModal.tsx` | ⭐ 选择复用动作列表弹窗，下拉选择用户有权限的复用动作列表 |
| `src/components/MuseAI/MotionPanel/types.ts` | MotionPanel 类型定义，含入口类型枚举 |

### 2. AI 动作卡片
| 文件 | 说明 |
|------|------|
| `src/pages/SimpleAction/AISimpleAction/ActionItem.tsx` | ⭐ AI动作卡片组件，更多菜单中包含复用动作入口（场景一：添加至复用列表按钮；场景二：ReuseActionDropdown 下拉） |
| `src/pages/SimpleAction/AISimpleAction/ActionGenerationEntry.tsx` | AI动作生成入口，传递复用动作列表上下文 |
| `src/pages/SimpleAction/AISimpleAction/SaveToOrganizationModal.tsx` | 保存到仓库弹窗 |

### 3. 复用动作核心 Hook
| 文件 | 说明 |
|------|------|
| `src/hooks/useReuseAction.tsx` | ⭐ 复用动作核心逻辑 Hook，提供 `handleCreateNewList`（创建新列表）、`createLoading`、`renderSelectCollectionModal`（添加至已有列表） |

### 4. 3D 全流程中的复用动作入口
| 文件 | 说明 |
|------|------|
| `src/components/MuseAI/common/RecordActions/index.tsx` | ⭐ 统一操作按钮组（复用动作/下载/保存/删除），3D 全流程中含"复用动作"按钮 |
| `src/components/MuseAI/common/RecordActions/useRecordActions.ts` | 操作按钮业务逻辑封装 |
| `src/components/MuseAI/common/RecordBatchFooter/index.tsx` | 多选模式底部操作栏，含复用动作 slot |
| `src/components/MuseAI/common/RecordListToolbar/index.tsx` | 多选/全部展开/搜索操作栏 |
| `src/components/MuseAI/common/RecordContent/index.tsx` | 记录内容组件（多选状态管理） |
| `src/components/MuseAI/common/RecordItem/index.tsx` | 单条记录组件（多选 Checkbox） |
| `src/components/MuseAI/GenerationRecord/index.tsx` | ⭐ 生成记录列表，含多选、批量下载/保存、复用动作功能 |

---

## 二、复用动作列表页面（Collection 模块）

### 列表页
| 文件 | 说明 |
|------|------|
| `src/pages/SimpleAction/Collection/index.tsx` | ⭐ 复用动作列表首页，展示用户所有复用动作列表 |
| `src/pages/SimpleAction/Collection/components/CollectionCard.tsx` | 复用动作列表卡片组件 |

### 详情页
| 文件 | 说明 |
|------|------|
| `src/pages/SimpleAction/Collection/Detail/index.tsx` | ⭐ 复用动作详情页（查看已选动作、导出等） |
| `src/pages/SimpleAction/Collection/hooks/useDetailBaseInfo.ts` | 详情页基础信息 Hook |

### 挑选页（Selection）
| 文件 | 说明 |
|------|------|
| `src/pages/SimpleAction/Collection/Selection/index.tsx` | ⭐ 复用动作挑选页面（选择关联动作加入列表），含创建复用动作逻辑 |
| `src/pages/SimpleAction/Collection/Selection/Skeleton.tsx` | 挑选页骨架屏（含关联动作列表逻辑和创建复用动作逻辑） |
| `src/pages/SimpleAction/Collection/Selection/useAssets.tsx` | 挑选页资产数据 Hook |
| `src/pages/SimpleAction/Collection/Selection/useRecommendAssets.ts` | 推荐资产 Hook |

### 其他组件
| 文件 | 说明 |
|------|------|
| `src/pages/SimpleAction/Collection/components/AssetSelect.tsx` | 资产选择组件（更换角色） |
| `src/pages/SimpleAction/Collection/components/DownloadModal.tsx` | 下载弹窗 |
| `src/pages/SimpleAction/Collection/components/ExportActionModal.tsx` | 复用动作导出弹窗 |
| `src/pages/SimpleAction/Collection/components/ModelItem.tsx` | 模型条目组件 |
| `src/pages/SimpleAction/Collection/components/ModelViewer.tsx` | 模型预览器 |
| `src/pages/SimpleAction/Collection/components/RenameModal.tsx` | 重命名弹窗 |
| `src/pages/SimpleAction/Collection/hooks/useCharacterBinding.ts` | 角色绑定 Hook |
| `src/pages/SimpleAction/Collection/useCollectionPermission.ts` | 复用动作列表权限 Hook |
| `src/pages/SimpleAction/Collection/useShareSimpleActionCollection.tsx` | 复用动作列表分享 Hook |
| `src/pages/SimpleAction/Collection/utils.tsx` | 工具函数（获取复用动作集发起资产详情、角色名称） |

---

## 三、动作卡片更多菜单组件

| 文件 | 说明 |
|------|------|
| `src/components/ListOperation/index.tsx` | ⭐ **核心更多菜单组件** `ListOperationDropdown`，含 `reuseAction` 菜单项（key 为 'reuseAction'），动作/资源包卡片的"更多"按钮 |
| `src/components/AssetCard/index.tsx` | 资产卡片组件，使用 ListOperationDropdown |
| `src/components/AssetCard/ListOperationDropdown.tsx` | AssetCard 专用的 ListOperation 封装 |
| `src/components/CommonAssetItem/index.tsx` | 通用资产条目，使用 ListOperationDropdown |
| `src/components/AssetDetailNew/index.tsx` | 资产详情页，使用 ListOperationDropdown |
| `src/components/AssetDetail2/index.tsx` | 资产详情页（旧版），使用 ListOperationDropdown |

---

## 四、关联动作相关

| 文件 | 说明 |
|------|------|
| `src/pages/SimpleAction/Collection/Selection/Skeleton.tsx` | ⭐ 包含"关联动作列表"逻辑和"选择关联动作"入口 |
| `src/pages/SimpleAction/Collection/Selection/index.tsx` | 挑选页面，与关联动作选择集成 |
| `src/OpenApiServices/museService/api.ts` | API 定义中含"角色集关联动作个数/资产ids/封面图片"字段 |

---

## 五、批量操作/多选相关

| 文件 | 说明 |
|------|------|
| `src/pages/QA/CommonBatchOperation.tsx` | ⭐ **通用批量操作 Hook** `useCommonBatch`，提供多选状态管理 |
| `src/components/NewBatchButton/index.tsx` | 批量操作按钮组件 |
| `src/components/FilterMenu/BatchTagButton.tsx` | 筛选栏中的批量操作按钮（含多选切换） |
| `src/components/MuseAI/common/RecordBatchFooter/index.tsx` | MuseAI 多选底部操作栏 |
| `src/components/MuseAI/common/RecordListToolbar/index.tsx` | MuseAI 多选/搜索操作栏 |

---

## 六、全局状态与事件

| 文件 | 说明 |
|------|------|
| `src/models/museai.ts` | ⭐ MuseAI 全局状态，含 `COLLECTION` 入口类型、`collectionContext`（复用动作列表上下文） |
| `src/utils/events.ts` | 事件定义：复用动作列表变更（创建新列表/添加到已有列表） |
| `src/models/listQueryModel.ts` | 列表查询 model，含"复用动作"相关 |
| `src/layouts/Header/index.tsx` | 顶部导航栏，含"复用动作"入口 icon |
| `src/layouts/Header/components/SimpleActionCollection/index.tsx` | Header 中的复用动作提示组件（"成功创建复用动作，点击查看"） |

---

## 七、API 接口

| 文件 | 说明 |
|------|------|
| `src/OpenApiServices/museService/api.ts` | 所有 collector 相关接口：`/api/character/collector/*`（创建/保存/批量保存/详情/下载/分享/导出/预置角色/reuseStats 等） |

---

## 八、资源包中的复用动作入口

| 文件 | 说明 |
|------|------|
| `src/pages/Engineering/Detail/New/index.tsx` | ⭐ 资源包详情页，含"复用动作"菜单项（key: 'reuseAction'），支持 fbx/max 文件类型 |
| `src/pages/Engineering/utils.ts` | 定义 `SupportReuseActionFileTypes = ['fbx', 'max']` |

---

## 九、其他入口

| 文件 | 说明 |
|------|------|
| `src/pages/SimpleAction/utils.tsx` | 复用动作集挑选页面跳转地址工具函数 |
| `src/utils/index.ts` | `_oru` 参数说明（复用动作购物车入口） |
