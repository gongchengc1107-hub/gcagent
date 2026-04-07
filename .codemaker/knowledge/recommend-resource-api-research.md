# 复用动作列表增加推荐资源展示 - API & Code Research

## 1. Relevant API Methods (src/OpenApiServices/museService/api.ts)

### 以图搜图 (Search by Image) APIs
```ts
// Line 17891 - 全站搜索
apiPostSvcWholeSearchSearchByQuery(data: WholeSearchRequest, opts?: ReqOpts)
  => request<{ [key: string]: any }>('/svc/wholeSearch/searchByQuery')

// Line 17899 - 全站列表
apiPostSvcWholeSearchList(data: WholeSearchRequest, opts?: ReqOpts)
  => request<{ [key: string]: any }>('/svc/wholeSearch/list')

// Line 17907 - 以图搜图(svc)
apiPostSvcWholeSearchListByPic(data: AssetVo, opts?: ReqOpts)
  => request<{ [key: string]: any }>('/svc/wholeSearch/listByPic')

// Line 19718 - 搜索结果
apiPostApiSearchList(data: AssetVo, opts?: ReqOpts)
  => request<CommonResMapStringObject>('/api/search/list')

// Line 19724 - 以图搜图(api) [已废弃，推荐资源 Tab 改用 listActionByPic]
apiPostApiSearchListByPic(data: AssetVo, opts?: ReqOpts)
  => request<CommonResMapStringObject>('/api/search/listByPic')

// Line 20013 - 以图搜动作(api) [推荐资源 Tab 当前使用]
apiPostApiSearchListActionByPic(data: AssetVo, opts?: ReqOpts)
  => request<CommonResMapStringObject>('/api/search/listActionByPic')

// Line 19748 - AI搜索
apiPostApiSearchAiList(data: AssetVo, opts?: ReqOpts)
  => request<CommonResMapStringObject>('/api/search/aiList')
```

### 角色收集器 (Character Collector) APIs
```ts
// Line 24057 - 单个保存/取消
apiPostApiCharacterCollectorOrganizationAssetAssetIdSave(
  params: { organization: string; asset: string; assetId: string },
  data: CharacterCollectorSimpleActionSaveVo,
  opts?: ReqOpts
) => request<CommonResCharacterCollectorDto>('/api/character/collector/{org}/{asset}/{assetId}/save')

// Line 24076 - 批量保存
apiPostApiCharacterCollectorOrganizationAssetAssetIdBatchSave(
  params: { organization: string; asset: string; assetId: string },
  data: BatchCharacterCollectorSaveVo,
  opts?: ReqOpts
) => request<CommonResCharacterCollectorDto>('/api/character/collector/{org}/{asset}/{assetId}/batchSave')

// Line 29739 - 列出角色集动作
apiGetApiCharacterCollectorCharacterCollectorIdListSimpleAction(
  params: { characterCollectorId: string },
  opts?: ReqOpts
) => request<CommonResListCharacterCollectorCommonDto>('/api/character/collector/{id}/listSimpleAction')

// Open API versions (identical signatures, different paths with /api/open/v1/ prefix):
// Line 28773 - apiGetApiOpenV1CharacterCollectorCharacterCollectorIdListSimpleAction
// Line 22268 - apiPostApiOpenV1CharacterCollectorOrganizationAssetAssetIdBatchSave

// List / Count / Detail
apiGetApiCharacterCollectorList() => CommonResListCharacterCollectorDto  // Line ~24200
apiGetApiCharacterCollectorCharacterCollectorIdDetail({ characterCollectorId }) => CommonResCharacterCollectorDto

// Download
apiGetApiCharacterCollectorCharacterCollectorIdDownloadList({ characterCollectorId }) => CommonResArtlibDownload
apiPostApiCharacterCollectorBatchDownloadList(data: BatchDownloadListVo) => CommonResArtlibDownload

// Attachment list for simpleaction
apiGetApiCharacterCollectorCharacterCollectorIdSimpleactionListAttachment({ characterCollectorId })
  => CommonResListCharacterCollectorCommonDto  // Line ~29725
```

### Asset List APIs (used by 仓库资源 tab)
```ts
// The actual list API is in src/services/asset/assetList.ts:18
getAssetList({ organization, asset, params, abortSignal })
  // internally calls /api/asset/{organization}/{type}/list

// Supplier asset list
apiPostApiSupplierV1SupplierProSpaceIdAssetList(params, data, opts)
  // /api/supplier/v1/{supplierProSpaceId}/{asset}/list

// Collection asset list
apiPostArtlibApiCollectionAssetList(data: AssetQueryVo, opts?: ReqOpts)
  => request<CommonResPageableInfoAsset>('/artlib/api/collection/asset/list')
```

### Refer (引用资源) APIs
```ts
// Line 19857 - 批量引用
apiPostApiReferOrganizationBatchSave(params, data, opts)
  => request<CommonRes>('/api/refer/{organization}/batchSave')

// Line 19900 - 仓库间引用
apiPostApiReferOrgBatchSave(data: ReferOrgBatchSaveVo, opts)
  => request<CommonResListRefer>('/api/refer/org/batchSave')

// Line 19782 - 跨页全选引用
apiPostApiReferOrganizationAssetBatchSaveRefer(params, data, opts)
  => request<CommonResListRefer>('/api/refer/{organization}/{asset}/batchSaveRefer')
```

---

## 2. Key Type Definitions

### WholeSearchRequest (api.ts:1305)
```ts
export type WholeSearchRequest = {
  records?: object[];
  sid?: string; uid?: string;
  keyword?: string; assetType?: string;
  name?: string; url?: string;
  page_num?: number;  // required
  page_size?: number;  // required
  total_count?: number;
  real_total_count?: number;
};
```

### AssetVo (api.ts:1331) - Used by search/listByPic
```ts
export type AssetVo = {
  records?: object[]; kmProjectId?: number; ids?: string[]; id?: string;
  deleted?: boolean; author?: string; tags?: number[]; categories?: number[];
  category?: string; email?: string; type?: string; off?: boolean;
  organizations?: string[]; skeleton?: string; isFavorite?: boolean;
  cover?: string; preview?: string; organization?: string; keyword?: string;
  query?: Record<string, any>; sid?: string; rsid?: string; uid?: string;
  assetIds?: string[]; assetIdList?: string[];
  fuzzyMatchName?: string; excludeSecretAsset?: boolean;
  supplierProSpaceId?: string;
  // ... many more optional fields
};
```

### AssetQueryVo (api.ts:2219)
```ts
export type AssetQueryVo = {
  records?: object[];
  hasOrganizationSecretRightList?: string[];
  page_num?: number;  page_size?: number;
  total_count?: number; real_total_count?: number;
  coll_id?: string; asset_name?: string; asset_type?: string;
};
```

### CharacterCollectorSimpleActionSaveVo (api.ts:9352)
```ts
export type CharacterCollectorSimpleActionSaveVo = {
  id?: string;          // 角色集id，新增为空，编辑时传入
  name?: string;        // 角色集名称
  organization?: string; // 仓库编号(引用资产需传引用仓库)
  asset_type?: string;  // 所选资产类型
  asset_id?: string;    // 资产id
  has_select?: boolean; // true:选择, false:取消选择
  folder_id?: string;   // 文件夹id
};
```

### CharacterCollectorDto (api.ts:9371)
```ts
export type CharacterCollectorDto = {
  id?: string; organization?: string; pic?: string;
  type?: string; attachments?: Attachment[]; name?: string;
  permission?: string; asset_type?: string; asset_id?: string;
  folder_id?: string; can_read?: boolean; can_edit?: boolean;
  can_download?: boolean; asset_name?: string;
  create_at?: number; create_by?: string;
  create_name?: string; create_pic?: string;
  simple_action_count?: number;
  simple_action_asset_ids?: string[];
  simple_action_pics?: string[];
  source_id?: string; auth_type?: string;
};
```

### CharacterCollectorCommonDto (api.ts:16140)
```ts
export type CharacterCollectorCommonDto = {
  id?: string; organization?: string; pic?: string;
  type?: string; attachments?: Attachment[];
  asset_type?: string; asset_id?: string; folder_id?: string;
  can_read?: boolean; can_edit?: boolean; can_download?: boolean;
  asset_name?: string; create_at?: number;
};
```

### BatchCharacterCollectorSaveVo (api.ts:9430)
Extends AssetVo-like fields plus collector-specific fields.

### AssetCommon (src/types/AssetType.ts:172)
Core interface for all asset items in lists:
- id, name, assetType/asset_type, organization, referProject, referOrganization
- cover, preview, thumbnail, tagNameList, aiTags, customTags
- likeNum, downloadNum, originalNum, quoteCount
- searchEvent, authorDeptNames, fileExt
- canCreateActionPu, belongCategoryNames, etc.

---

## 3. Data Flow: 仓库资源 Tab

```
Selection/index.tsx (component)
  └─ useAssets({ organization, currentTab })  (Selection/useAssets.tsx)
       └─ useCommonAssetAction('simpleaction', organization) (src/hooks/index.ts:155)
            └─ commonActions(type, org) (src/redux/actions/commonActions.ts)
                 └─ pageAssetList(type, params, signal) → dispatch  (line 157)
                      ├─ AI search: apiPostApiSearchAiList(...)
                      ├─ Supplier: apiPostApiSupplierV1SupplierProSpaceIdAssetList(...)
                      └─ Normal: getAssetList({ organization, asset, params })
                           └─ /api/asset/{organization}/{type}/list

pageAssetList params (from useAssets):
  { searchType, pageNum, pageSize, categories, queryTexts,
    hasActionPu, tags, assetClass, sortBy, search_id,
    sort_ascending?, ...conditionParams }

Redux state: state.simpleAction.assetListInfo
  { assets: AssetCommon[], pageNum, pageSize, totalCount, realTotalCount }
```

### Tab Switching in Selection
- URL param `tab` controls current tab (default: `AssetTypeEnum.SIMPLE_ACTION`)
- `handleChangeTab(key)` → `setUrlState({ tab: key, page: 1, page_size: 48, currentMenu: undefined })`
- Tabs rendered from `simpleActionInfoList`, excluding `AssetTypeEnum.CHARACTER`
- Tab change triggers `useAssets` re-fetch via changed deps

### Add to Cart / 已选动作
- `handleSelectItem(model, selected)` calls `apiPostApiCharacterCollectorOrganizationAssetAssetIdSave`
  with: `{ id: collectionId, name: collectionName, has_select: selected, asset_id, asset_type, organization, folder_id }`
- Badge count shows `collectionDetail?.simple_action_count`
- Shopping cart button navigates to `/muse/simpleaction-collection/{collectionId}` (Detail page)

### Pagination
- Standard page-based: `<Pagination>` component
- Props: `current={page}`, `pageSize={pageSize}`, `total={assetListInfo.totalCount}`
- `pageSizeOptions={['24', '48', '96']}`

---

## 4. Redux State (src/pages/SimpleAction/reducer/)

### Actions (action.ts)
- `UPDATE_CURRENT_TAB` — update current tab
- `UPDATE_ONLY_SEE_SIMPLE_ACTION` — hasActionPu toggle
- `UPDATE_SIMPLE_ACTION_SHOW` — simpleActionShow toggle
- `UPDATE_LAYOUT` — layout display mode
- `UPDATE_CURRENT_ASSET_TYPE` — asset type selection
- `UPDATE_SKIN_ACTION_PAGE_INFO` — skin/action page info

### State Shape (reducer.ts)
```ts
{
  type: LayoutDisplayModeEnum,
  filterType: 'character',
  assetListInfo: { assets: [], pageNum, pageSize: 48, totalCount: 0, realTotalCount },
  currentMenu: [],
  editModalVisible: false,
  hotWords: [],
  hotWordsOption: [],
  skins: { records, pageNum, pageSize, totalCount },
  actions: { records, pageNum, pageSize, totalCount },
  mocaps: { records, pageNum, pageSize, totalCount },
  aiActions: { records, pageNum, pageSize, totalCount },
  loading: true,
  projectTags: [],
  currentAssetType: AssetTypeEnum.SIMPLE_ACTION,
  sort: 'pv',
  assetType: undefined,
  modelLoading: false,
  currentTab: 'simpleaction',
  hasActionPu: false,
  simpleActionShow: false,
  forceRefresh: false,
}
```

---

## 5. Existing "推荐" (Recommend) Related Code

### showRecommendation property
Used in `MoreOperationOptions` for asset list items:
- `src/pages/SimpleAction/components/ModelList/List.tsx:302` — `showRecommendation: false` (in card mode)
- `src/pages/SimpleAction/components/ModelList/List.tsx:369` — `showRecommendation: true` (in table mode)
- `src/pages/SimpleAction/Detail/index.tsx:705` — `showRecommendation: currentOrganization !== 'muse'`

This is for "推荐到父仓" (recommend to parent repo) operation, NOT for "推荐资源展示" (displaying recommended resources).

### No existing "推荐资源" tab
There is currently NO "推荐" tab in the Collection/Selection page.
The Selection page has tabs from `simpleActionInfoList` (simpleaction, mocap, ai_action types).
A new tab would need to be added for recommended resources.

---

## 6. Key Files Summary

| File | Purpose |
|------|---------|
| `src/OpenApiServices/museService/api.ts` | All API methods & types (31K lines) |
| `src/pages/SimpleAction/Collection/Selection/index.tsx` | 仓库资源 selection page |
| `src/pages/SimpleAction/Collection/Selection/useAssets.tsx` | Asset list fetch hook |
| `src/pages/SimpleAction/reducer/action.ts` | Redux action creators |
| `src/pages/SimpleAction/reducer/reducer.ts` | Redux reducer & state shape |
| `src/pages/SimpleAction/Collection/index.tsx` | Collection list page |
| `src/pages/SimpleAction/Collection/Detail/index.tsx` | Collection detail page |
| `src/redux/actions/commonActions.ts` | `pageAssetList` implementation |
| `src/services/asset/assetList.ts` | `getAssetList` service |
| `src/types/AssetType.ts` | `AssetCommon` interface (line 172) |
| `src/hooks/index.ts` | `useCommonAssetAction` hook |
