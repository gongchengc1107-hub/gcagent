# 模块二代码分析：关联动作页面复用动作入口 (#26954)

## 1. 数据流总览

```
Skeleton.tsx (页面入口)
├── FilterMenuBar (批量操作栏) → 透传 BatchTagButtonProps → BatchTagButton
│   ├── customOperationGroup: 未传（需要新增）
│   └── assetType={skeletonType as AssetTypeEnum}
│
└── List (资产列表) → CommonAssetItem → ListOperationDropdown → ListOperation
    ├── moreOperationOptions: 已配置（见下方详情）
    └── assetType={model.assetType}（来自每个资产自身）
```

## 2. 核心文件清单

### 2.1 Skeleton.tsx（页面入口）
- **路径**: `src/pages/SimpleAction/components/ModelList/Skeleton.tsx`
- **FilterMenuBar 配置 (L526-L575)**:
  - `assetType={skeletonType as AssetTypeEnum}` — skeletonType 可能是 CHARACTER / SIMPLE_ACTION / AI_ACTION
  - `organization={skeletonOrganization}`
  - **未传 customOperationGroup** — 需要新增复用动作按钮
  - **未传 showOperations** — 使用默认 batchOperationType
  - `disabledCondition="secondPage"`
  - `listParams` 包含 categories/assetClass/hasActionPu/queryText/skeleton
- **List 组件使用 (L581-L612)**:
  - `assetType={skeletonType}` — 传给 List，再传给 CommonAssetItem
  - `modelItemProps={{ extraSkinActionHide: true }}`

### 2.2 List.tsx（资产列表中间层）
- **路径**: `src/pages/SimpleAction/components/ModelList/List.tsx`
- **moreOperationOptions 配置 (L300-L320)**:
  ```tsx
  moreOperationOptions={{
    showCulling: true,
    showRecommendation: false,
    showTop: true,
    showRecaptureCover: model.assetType !== AssetTypeEnum.MOCAP,
    showShareToFunctionParentRepo: true,
    showReferRepo: true,
    showDownload: true,
    showCopyPath: true,
    showCreateSkin: !supplierConfig?.id && assetType === AssetTypeEnum.CHARACTER,
    showCreateActionPu: !!(
      !supplierConfig?.id &&
      assetType === AssetTypeEnum.CHARACTER &&
      model?.canCreateActionPu
    ),
  }}
  ```
  - **关键发现**: moreOperationOptions 未配置 reuseAction 相关选项
  - `assetType={model.assetType}` — 每个资产自带 assetType

### 2.3 ListOperation/index.tsx（更多菜单核心逻辑）
- **路径**: `src/components/ListOperation/index.tsx`
- **reuseAction 菜单项 (L467)**:
  ```tsx
  if (assetType === AssetTypeEnum.CHARACTER && !isSupSpaceAsset) {
    innerList.push({
      name: '复用动作',
      icon: <Icon src={actionSvg} size={16 * viewBase} />,
      key: 'reuseAction',
      order: 85,
    });
  }
  ```
  - **当前条件**: 仅 CHARACTER 类型 + 非供应商空间
  - **模块二需求**: 需扩展为 SIMPLE_ACTION 和 AI_ACTION 也展示
- **reuseAction 点击处理 (L883-L908)**:
  ```tsx
  case 'reuseAction': {
    if (canEdit) {
      apiPostApiAssetThirdPartyOperationTypeAssetTypeAssetId(
        { operationType: 'skeleton_neural', assetType, assetId: id, organization },
        { auto: true },
      );
    }
    const url = getSimpleActionCollectionSelectionUrl({
      id, assetType,
      organization: asset.organization || baseInfo.organization || organization,
      referOrganization: asset.referOrganization,
    });
    if (url) history.push(url);
    break;
  }
  ```

### 2.4 ListOperationDropdownOptions（类型定义）
- **路径**: `src/components/ListOperation/index.tsx` L65-L133
- **当前无 showReuseAction 字段** — reuseAction 的展示是通过 assetType 硬编码判断的
- 完整接口定义已索引，包含 ~30 个布尔配置项

### 2.5 CommonAssetItem/index.tsx（资产卡片）
- **路径**: `src/components/CommonAssetItem/index.tsx`
- `moreOperationOptions` prop 类型: `ListOperationDropdownOptions`（L155）
- 通过 `{...moreOperationOptions}` spread 到 ListOperationDropdown（L675）
- `assetType` 直接传给 ListOperationDropdown

### 2.6 FilterMenuBar + BatchTagButton（批量操作）
- **FilterMenuBar**: `src/components/FilterMenu/FilterMenuBar.tsx`
  - `interface FilterMenuBarProps extends BatchTagButtonProps, FilterMenuInfoProps`
  - 直接透传所有 BatchTagButtonProps 到 BatchTagButton (L387)
- **BatchTagButton**: `src/components/FilterMenu/BatchTagButton.tsx`
  - `customOperationGroup?: any` (L146)
  - `showOperations?: string[]` (L162)
  - **渲染逻辑 (L1284)**: `(Array.isArray(customOperationGroup) ? customOperationGroup : batchOperationType).map(...)`
  - `batchOperationType` 是内部 useMemo (L805)，包含约 20 个操作类型
  - **当前无 reuseAction 操作类型** — 需要新增
  - customOperationGroup item 结构: `{ type, visible, name, icon?, onClick?, disable?, toolTip?, buttonType?, jsx? }`

### 2.7 SimpleAction/Detail/index.tsx（关联动作详情页的批量操作）
- **路径**: `src/pages/SimpleAction/Detail/index.tsx`
- **BatchTagButton (L853)**: 未传 customOperationGroup — 也需新增
- 传了 `assetType={activeKey}`

### 2.8 Collection/Selection/Skeleton.tsx（参考：已有 customOperationGroup 示例）
- **路径**: `src/pages/SimpleAction/Collection/Selection/Skeleton.tsx`
- **customOperationGroup (L379)**: 有一个 '添加到已选动作' 的例子
  ```tsx
  customOperationGroup={[{
    type: 'addToCollection',
    visible: true,
    name: '添加到已选动作',
    onClick: (_, extractParams) => handleSelectBatch(extractParams),
  }]}
  ```

### 2.9 getSimpleActionCollectionSelectionUrl（复用动作跳转URL）
- **路径**: `src/pages/SimpleAction/utils.tsx` L91-L117
- 生成 `/{organization}/simpleaction-collection/selection/{assetType}/{id}` 格式 URL

## 3. 修改方案要点

### 3.1 更多菜单（卡片级）
**文件**: `src/components/ListOperation/index.tsx`
- **L467**: 将 `assetType === AssetTypeEnum.CHARACTER` 条件扩展为包含 `SIMPLE_ACTION` 和 `AI_ACTION`
- 可改为: `[AssetTypeEnum.CHARACTER, AssetTypeEnum.SIMPLE_ACTION, AssetTypeEnum.AI_ACTION].includes(assetType)`
- reuseAction handler (L883) 已支持通用 assetType，无需修改

### 3.2 批量操作栏
**方案 A**: 在 `Skeleton.tsx` 和 `Detail/index.tsx` 的 FilterMenuBar/BatchTagButton 中传入 `customOperationGroup`
**方案 B**: 在 `BatchTagButton.tsx` 的 `batchOperationType` useMemo 中新增 reuseAction 操作类型

推荐方案 A（更灵活，不影响全局），参考 Collection/Selection/Skeleton.tsx 的用法。

### 3.3 埋点
- 更多菜单点击: 在 ListOperation reuseAction handler 中已有 `apiPostApiAssetThirdPartyOperationTypeAssetTypeAssetId` 调用
- 批量操作按钮: 需在 onClick 回调中添加埋点
