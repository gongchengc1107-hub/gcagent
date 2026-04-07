# 模块三：复用动作列表更换角色 — 源代码分析

## 1. Detail/index.tsx — 复用动作详情页

**文件路径**: `src/pages/SimpleAction/Collection/Detail/index.tsx`

### 角色封面图片区域（第 320-340 行）

```
<div
  className="w-[54px] h-[72px] object-cover cursor-pointer rounded-lg border border-1 border-solid overflow-hidden"
  style={{ borderColor: previewId ? 'transparent' : 'var(--primary-1)' }}
  onClick={clearPreviewItem}
>
  <Image alt="cover pic" src={coverUrl} ... preview={false}
    fallback={<Icon src={defaultMuseIcon} ... />}
  />
</div>
```

- **coverUrl 来源**（第 127-136 行）：`removeFpWatermark(collectionDetail?.pic)` → `fpOverride(url, {width, height, mode:1, quality:99})`
- **coverUrl 来自 `collectionDetail.pic` 字段**，不是 `assetDetail`

### 页面数据加载逻辑

1. **collectionDetail**（第 60 行）：`apiGetApiCharacterCollectorCharacterCollectorIdDetail({ characterCollectorId })` 获取
2. **assetDetail**（第 122 行）：通过 `fetchAssetDetail(assetParams)` 获取角色资产详情
   - `assetParams` 从 `collectionDetail` 的 `organization`, `asset_type`, `asset_id`, `folder_id` 构建
3. **assetList**：`apiGetApiCharacterCollectorCharacterCollectorIdListSimpleAction` 获取已选动作列表

### previewId 逻辑（第 52-58 行）

- URL 参数：`preview_id`, `preview_org`, `preview_asset_type`
- `clearPreviewItem` 清空这三个参数 → 回到显示角色资产
- 点击动作时通过 `handleClickItem` 设置 URL 参数

### 关键 hook 调用

- `useCharacterBinding({ characterDetail: assetDetail })` → 第 255 行
- `useDetailBaseInfo({ actionDetail, assetDetail, collectionDetail })` → 第 221 行
- `useCollectionPermission({ collection: collectionDetail })` → 第 79 行
- `updateCollection` 通过 `apiPostApiCharacterCollectorOrganizationAssetAssetIdSave` 更新集合（第 149-160 行）

### 更换角色后需要更新的数据

- `collectionDetail` → 需 `refreshCollectionDetail()`
- `assetDetail` → 依赖 `assetParams`（由 collectionDetail 派生），会自动刷新
- `characterBindingDetail` → 依赖 `assetDetail`，会自动刷新
- `coverUrl` → 依赖 `collectionDetail.pic`，会自动刷新

---

## 2. AssetSelect.tsx — 资产选择组件

**文件路径**: `src/pages/SimpleAction/Collection/components/AssetSelect.tsx`

### Props 类型

```typescript
interface AssetSelectProps extends Omit<SelectProps, 'showSearch' | 'onChange'> {
  assetType: AssetTypeEnum;       // 资产类型
  organization: string;           // 仓库编号
  onChange?: (asset: any) => void; // 选中回调，返回完整 asset 对象
}
```

### 内部逻辑

- 使用 `apiPostApiAssetOrganizationAssetList` 搜索资产
- 内置搜索输入框（Input），支持模糊搜索
- 下拉选项渲染：32x22px 缩略图 + HighlightText 高亮搜索词
- 基于 `@bedrock/components` 的 `Select` 组件
- `fieldNames={{ value: 'id' }}`
- **局限**：只能选择资产，不能选择资源包内的附件

---

## 3. useFileTree.ts — 资源包附件树

**文件路径**: `src/hooks/useAssetDetail/useFileTree.ts`

### 参数类型

```typescript
type FileTreePropsType = {
  supplierProSpaceId?: string;
  organization?: string;
  assetType?: AssetTypeEnum;
  id?: string | number;
  needFileTree?: boolean;
  attachmentMappingId?: number | string;
  acceptTypesCheckers?: ((file: any) => boolean)[];
  versionLabel?: ManuscriptValueType;  // 归档稿/过程稿
  autoJumpOnNoAttachment?: boolean;
  fileTreeSort?: { sort: 'system'|'fileName'|'createTime'|'fileType'; order: 'asc'|'desc' };
};
```

### 返回值

```typescript
{
  loaded, fileTree, folderTree, filesMap, fileNameMap,
  totalFiles, totalSize, totalSizeFormat,
  firstLevelFolderCount, folderCount,
  changeTags, loading, refreshFileList, refreshFileTree, mutateFileList
}
```

### 归档稿参数

- `versionLabel?: ManuscriptValueType` 控制获取归档稿还是过程稿
- `ManuscriptValueType` 来自 `src/pages/Engineering/Detail/New/ManuscriptType`

### API 调用

- 文件列表：`apiPostApiAttachmentOrganizationAssetIdDetail`
- 文件树：`apiGetApiFolderListOrganizationAssetId`
- 供应商场景有对应的供应商 API

---

## 4. useMuseAISteps.ts — 仓库权限查询参考

**文件路径**: `src/components/MuseAI/hooks/useMuseAISteps.ts`

### 仓库列表获取逻辑

```typescript
// 1. 获取有写入权限的仓库
const writeOrganizationList = useTypedSelector(
  (state) => state.organization?.list?.filter((item) => !!item.permit?.write) ?? [],
);

// 2. 获取所有仓库（含 show_tabs 信息）
const { data: allOrganization } = useRequest(
  () => apiGetApiOrganizationFindOrganizationName({ search: '', queryShowTabs: true })
);

// 3. 按 show_tabs 过滤
const motionOrganizationList = writeOrganizationList.filter((item) =>
  !!allOrganization?.map?.[item.code]?.show_tabs?.simpleaction
);

const threeDOrganizationList = writeOrganizationList.filter((item) => {
  const tabs = allOrganization?.map?.[item.code]?.show_tabs;
  return !!tabs?.engineering || !!tabs?.character;
});
```

### 关键 API

- `apiGetApiOrganizationFindOrganizationName({ search: '', queryShowTabs: true })` — 获取所有仓库及模块开启状态

---

## 5. useCharacterBinding.ts — 角色绑定 Hook

**文件路径**: `src/pages/SimpleAction/Collection/hooks/useCharacterBinding.ts`

### 功能

从 `characterDetail.attachments` 中查找 `fbx`, `neural`, `skeleton` 文件，判断是否满足套用播放条件。

### 返回类型

```typescript
interface CharacterBindingResult {
  canBind: boolean;
  skinFbx?: any;
  neuralFile?: any;
  skeletonFile?: any;
  missingTypes: string[];
  bindingFiles: { skinFbx?: any; neural?: any; skeleton?: any };
}
```

### 注意

- 这个 hook **不处理角色更换**，只判断当前角色是否具备套用播放条件
- 更换角色后需要用新角色的 `attachments` 重新计算

---

## 6. useDetailBaseInfo.ts — 详情页基础信息

**文件路径**: `src/pages/SimpleAction/Collection/hooks/useDetailBaseInfo.ts`

### 实现

```typescript
export default ({ actionDetail, assetDetail, collectionDetail }) => {
  const isDefaultSkin = collectionDetail?.is_default_skin;
  return {
    isDefaultSkin,
    showDetailTab: some([
      every([!actionDetail, !isDefaultSkin, assetDetail?.assetType === AssetTypeEnum.CHARACTER]),
      actionDetail,
    ]),
    detailBaseInfo: useMemo<BaseInfoProps>(() => ({
      id: currentDetailAsset?.id,
      assetType, organization, fromOrganization, refer, assetReferType,
    }), [...]),
  };
};
```

### 关键点

- `is_default_skin` 来自 `collectionDetail`（后端字段）
- `showDetailTab` 控制 ModelViewer 中是否显示详情 Tab
- 当使用默认皮肤时 `isDefaultSkin=true`，不显示详情 Tab

---

## 7. Collection 相关 API 接口

**文件路径**: `src/OpenApiServices/museService/api.ts`

### 已有接口列表

| 接口函数 | 路径 | 说明 |
|----------|------|------|
| `apiGetApiCharacterCollectorCharacterCollectorIdDetail` | GET `/api/character/collector/{id}/detail` | 获取集合详情 |
| `apiPostApiCharacterCollectorOrganizationAssetAssetIdSave` | POST `/api/character/collector/{org}/{asset}/{assetId}/save` | 保存/更新集合（含角色信息） |
| `apiGetApiCharacterCollectorCharacterCollectorIdListSimpleAction` | GET `/api/character/collector/{id}/listSimpleAction` | 获取已选动作列表 |
| `apiGetApiCharacterCollectorPresetRole` | GET `/api/character/collector/presetRole` | 获取预设角色 |
| `apiGetApiCharacterCollectorList` | GET `/api/character/collector/list` | 获取集合列表 |
| `apiGetApiCharacterCollectorOrganizationAssetAssetIdFolderId` | GET `/api/character/collector/{org}/{asset}/{assetId}/{folderId}` | 获取资源包文件详情 |
| `apiGetApiCharacterCollectorCharacterCollectorIdSimpleactionListAttachment` | GET `/api/character/collector/{id}/simpleaction/listAttachment` | 获取附件列表 |

### 关键类型

```typescript
// 集合 DTO
type CharacterCollectorDto = {
  id?: string; organization?: string; pic?: string;
  type?: string; attachments?: Attachment[];
  name?: string; asset_type?: string; asset_id?: string;
  folder_id?: string; can_read?: boolean; can_edit?: boolean;
  can_download?: boolean; simple_action_asset_ids?: string[];
  // ... 更多字段
};

// 保存 VO（用于更换角色）
type CharacterCollectorSimpleActionSaveVo = {
  id?: string;           // 集合 ID
  name?: string;         // 集合名称
  organization?: string; // 仓库编号
  asset_type?: string;   // 资产类型
  asset_id?: string;     // 资产 ID
  has_select?: boolean;  // 是否选择
  folder_id?: string;    // 文件夹 ID（资源包时必传）
};

// 预设角色
type PresetRoleResp = {
  organization?: string;
  assetType?: string;
  id?: string;
  attachments?: Attachment[];
  fbxFiles?: { [key: string]: any };
  output?: AssetOutput;
};
```

### 更换角色的关键发现

1. **没有专门的"更换角色"接口** — 通过 `apiPostApiCharacterCollectorOrganizationAssetAssetIdSave` 传入新的 `organization + asset_type + asset_id (+ folder_id)` 实现
2. **预设角色接口** `apiGetApiCharacterCollectorPresetRole` 返回系统默认角色信息
3. `is_default_skin` 字段标记是否使用默认皮肤

---

## 8. fetchAssetDetail — 资产详情获取工具函数

**文件路径**: `src/pages/SimpleAction/Collection/utils.tsx`

### 完整逻辑

```typescript
export const fetchAssetDetail = ({ organization, asset, assetId, folderId }) => {
  // 资源包类型
  if (asset === AssetTypeEnum.ENGINEERING && folderId) {
    return apiGetApiCharacterCollectorOrganizationAssetAssetIdFolderId(params);
  }
  // DM模型类型
  if (asset === AssetTypeEnum.DM_MODEL) {
    return apiGetApiAssetThirdPartyOperationTypeDetailAssetId(params);
  }
  // 默认：角色/动作资产
  return getAssetDetail({ organization, assettype: asset, id: assetId });
};
```

### getCollectionCharacterName

```typescript
export const getCollectionCharacterName = async (assetDetail, folderId, removeExtension) => {
  if (assetDetail?.assetType === AssetTypeEnum.ENGINEERING) {
    // 通过 folderId 获取文件名称
    const res = await apiGetApiFolderListOrganizationAssetId({ ... });
    return removeExtension ? filename?.replace(/\.[^.]+$/, '') : filename;
  }
  return assetDetail?.name;
};
```

---

## 9. ModelViewer.tsx — 预览器组件

**文件路径**: `src/pages/SimpleAction/Collection/components/ModelViewer.tsx`

### Props

```typescript
interface ModelViewerProps {
  characterDetail: SimpleActionDetail;
  actionDetail?: SimpleActionDetail;
  characterBinding?: CharacterBindingResult;
  showDetailTab?: boolean;
  detailBaseInfo?: BaseInfoProps;
}
```

### 关键逻辑

- `isBinding` 判断：`actionDetail?.hasActionPu && (characterDetail?.hasActionPu || !!characterBinding?.canBind)`
- 绑定时合并 character 和 action 的 attachments
- Tab 切换：预览 / 详情

---

## 文件路径汇总

| 序号 | 文件 | 绝对路径 |
|------|------|----------|
| 1 | Detail/index.tsx | `/Users/vv/muse_new_frontend/src/pages/SimpleAction/Collection/Detail/index.tsx` |
| 2 | AssetSelect.tsx | `/Users/vv/muse_new_frontend/src/pages/SimpleAction/Collection/components/AssetSelect.tsx` |
| 3 | useFileTree.ts | `/Users/vv/muse_new_frontend/src/hooks/useAssetDetail/useFileTree.ts` |
| 4 | useMuseAISteps.ts | `/Users/vv/muse_new_frontend/src/components/MuseAI/hooks/useMuseAISteps.ts` |
| 5 | useCharacterBinding.ts | `/Users/vv/muse_new_frontend/src/pages/SimpleAction/Collection/hooks/useCharacterBinding.ts` |
| 6 | useDetailBaseInfo.ts | `/Users/vv/muse_new_frontend/src/pages/SimpleAction/Collection/hooks/useDetailBaseInfo.ts` |
| 7 | API 接口 | `/Users/vv/muse_new_frontend/src/OpenApiServices/museService/api.ts` |
| 8 | Collection utils | `/Users/vv/muse_new_frontend/src/pages/SimpleAction/Collection/utils.tsx` |
| 9 | ModelViewer.tsx | `/Users/vv/muse_new_frontend/src/pages/SimpleAction/Collection/components/ModelViewer.tsx` |
