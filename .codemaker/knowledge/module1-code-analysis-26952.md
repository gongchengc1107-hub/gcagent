# 模块一（#26952）源代码分析 - 动作卡片更多菜单及多选复用动作入口

## 1. ListOperation/index.tsx — reuseAction 相关代码

### 1.1 reuseAction 菜单项定义（第463-470行）

```tsx
// 文件: src/components/ListOperation/index.tsx:463-470
if (assetType === AssetTypeEnum.CHARACTER && !isSupSpaceAsset) {
  innerList.push({
    name: '复用动作',
    icon: <Icon src={actionSvg} size={16 * viewBase} />,
    key: 'reuseAction',
    order: 85,
  });
}
```

**显示条件**：
- `assetType === AssetTypeEnum.CHARACTER` — 仅角色类型
- `!isSupSpaceAsset` — 非供应商空间资产
- **需扩展**：增加 `AssetTypeEnum.SIMPLE_ACTION` 和 `AssetTypeEnum.AI_ACTION`

### 1.2 reuseAction click handler（第883-905行）

```tsx
// 文件: src/components/ListOperation/index.tsx:883-905
case 'reuseAction': {
  if (canEdit) {
    // 调用服务端创建动作谱接口
    apiPostApiAssetThirdPartyOperationTypeAssetTypeAssetId(
      {
        operationType: 'skeleton_neural',
        assetType,
        assetId: id as string,
        organization: asset.organization || baseInfo.organization || organization || '',
      },
      {
        auto: true,
      },
    );
  }
  const url = getSimpleActionCollectionSelectionUrl({
    id,
    assetType,
    organization: asset.organization || baseInfo.organization || organization || '',
    referOrganization: asset.referOrganization,
  });
  if (url) history.push(url);
  break;
}
```

**逻辑**：
1. 有编辑权限时先调 skeleton_neural 接口创建动作谱
2. 获取复用动作集选择页 URL 并跳转

### 1.3 ListOperationDropdownProps 中 assetType 的定义（第135-201行）

```tsx
// 文件: src/components/ListOperation/index.tsx:135-142
export interface ListOperationDropdownProps extends ListOperationDropdownOptions, DropdownProps {
  name?: string;
  isAdmin?: boolean;
  isIpAsset?: boolean;
  assetType: AssetTypeEnum;  // ← 必传，类型为 AssetTypeEnum
  organization?: string;
  asset?: AssetCommon;
  baseInfo: {
    id: string;
    organization: string;
    referId?: string;
    type?: AssetCommon['type'];
  };
  canEdit?: boolean;
  // ... 更多 props
}
```

---

## 2. BatchTagButton.tsx — 批量操作

### 2.1 BatchType 类型定义（第163-187行）

```tsx
// 文件: src/components/FilterMenu/BatchTagButton.tsx:163-187
type BatchType =
  | 'commercial'
  | 'category'
  | 'copyright'
  | 'tags'
  | 'download'
  | 'delete'
  | 'batch'
  | 'cancel'
  | 'assetType'
  | 'archive'
  | 'recommendation'
  | 'shareToParent'
  | 'shareToFunctionParent'
  | 'refer'
  | 'shareToSupplier'
  | 'delegateAuthority'
  | 'cancelShare'
  | 'cancelRefer'
  | 'batchPatchAuthor'
  | 'favorites'
  | 'batchUpdateStandardCategory'
  | 'remakeCover'
  | 'batchRenameCustomCode'
  | 'batchUpdateEnterPackage';
```

**注意**：当前 **没有** `'reuseAction'` — 需要新增。

### 2.2 BatchTagButtonProps（第75-161行，摘要）

```tsx
// 文件: src/components/FilterMenu/BatchTagButton.tsx:75-161
export interface BatchTagButtonProps {
  loading?: boolean;
  showSelectItemsLength?: boolean;
  isShowSelectAll?: boolean;
  isBatching?: boolean;
  setIsBatching?: (isBatching: boolean) => void;
  selectItems?: string[];
  unselectItems?: string[];
  onCancel?: () => void;
  onSelectAll?: (isSelect: boolean) => void;
  organization: string;
  assetType?: AssetTypeEnum;
  // ... 大量 handler props
  customOperationGroup?: any;      // 自定义右侧按钮组（会替换 batchOperationType）
  showOperations?: string[];       // 显示的按钮组（白名单过滤）
}
```

### 2.3 handleOperation 分发逻辑（第579行）

```tsx
// 文件: src/components/FilterMenu/BatchTagButton.tsx:579
const handleOperation = (operationType: BatchType) => {
  switch (operationType) {
    case 'batch': ...
    case 'cancel': ...
    case 'commercial': ...
    case 'category': ...
    case 'download': ...
    case 'delete': ...
    case 'archive': ...
    case 'recommendation': ...
    case 'shareToParent': ...
    // ... 无 reuseAction case
  }
};
```

### 2.4 batchOperationType 内部构建（第805行附近）

```tsx
// 文件: src/components/FilterMenu/BatchTagButton.tsx:805
const batchOperationType = useMemo(() => {
  const operationTypes = [
    generateOperationType({ type: 'batchUpdateEnterPackage', ... }),
    generateOperationType({ type: 'remakeCover', ... }),
    generateOperationType({ type: 'batchUpdateStandardCategory', ... }),
    // ... 更多
  ];
  // ...
}, [...]);
```

### 2.5 渲染逻辑（第1284行附近）

```tsx
// 如果传了 customOperationGroup 就用它，否则用内部的 batchOperationType
{(Array.isArray(customOperationGroup) ? customOperationGroup : batchOperationType).map((item) => {
  if (!item.visible) return null;
  return (
    <Menu.Item key={item.type}>
      <Tooltip {...toolTip}>
        <Button onClick={() => handleOperation(item.type)} disabled={item.disable}>
          {item.name}
        </Button>
      </Tooltip>
    </Menu.Item>
  );
})}
```

---

## 3. Normal.tsx — 动作模块页面

### 3.1 FilterMenuBar 完整配置（第243-307行）

```tsx
// 文件: src/pages/SimpleAction/components/ModelList/Normal.tsx:243-307
<FilterMenuBar
  extraLeft={<CategoryNormal />}
  extraRight={<SearchWithTags ... />}
  selectedItemCount={selectedItemCount}
  isChecked={isChecked}
  isBatching={isBatching}
  hasSecretAsset={hasSecretAsset}
  hasShareAsset={hasShareAsset}
  hasIPAsset={hasIPAsset}
  hasReferAsset={hasReferAsset}
  onCloseTag={handleOnCloseTag}
  labels={targetState.currentMenu as ClickMenuFuncType[]}
  selectItems={selectedItems}
  unselectedItems={unselectedItems}
  selectItemsWithInfo={selectItemsWithInfo}
  showSelectItemsLength
  setIsBatching={setIsBatching}
  organization={organization}
  assetType={currentTab}                    // ← 传的是 currentTab（如 simpleaction/character/aiaction 等）
  onSelectAll={selectAll}
  onSelectCurrentPage={selectAllLegacy}
  setIsSelectedAll={setIsSelectedAll}
  onCancel={onCancelBatchSelect}
  handleEditCategory={handleEditCategory}
  handleEditCopyright={handleEditCopyright}
  handleEditCommercial={handleEditCommercial}
  handleEditAssetType={handleEditAssetType}
  handleEditTags={handleEditTags as any}
  setIsSidebarOpen={setIsSidebarOpen}
  handleDeleteAssets={...}
  updateAssetType={updateAssetType}
  currentAssetType={targetState.assetType}
  updateSortType={updateSortType}
  currentSort={targetState.sort}
  loading={targetState.loading}
  listParams={{
    queryText: queryTexts,
    categories,
    assetClass: targetState.assetType,
    hasActionPu: targetState.hasActionPu,
  }}
  listData={assetListInfo.assets}
  useNewFileChoose
  getColumns={setFieldColumns}
/>
```

**关键发现**：
- `assetType={currentTab}` — 直接传了当前 Tab 值
- **没有传** `customOperationGroup` 和 `showOperations` — 所以用的是 BatchTagButton 内部的 `batchOperationType`
- **没有传** 任何 reuseAction 相关的 handler

### 3.2 currentTab 来源

```tsx
// Normal.tsx:34
currentTab = localStorage.getItem('muse_normal_simpleaction') || AssetTypeEnum.SIMPLE_ACTION
// 实际来自 redux: state.simpleAction.currentTab
```

---

## 4. SimpleAction/index.tsx — 路由/Tab 结构

### 4.1 Tab 对应的路由路径（第352-364行）

```tsx
// 文件: src/pages/SimpleAction/index.tsx:352-357
const assetTypes = {
  '/character': AssetTypeEnum.CHARACTER,
  '/simpleaction': AssetTypeEnum.SIMPLE_ACTION,
  '/mocap': AssetTypeEnum.MOCAP,
  '/aiaction': AssetTypeEnum.AI_ACTION,
};
```

### 4.2 页面结构（第448-501行）

```
SimpleAction (index.tsx)
├── CategoryTree（左侧目录树）
├── Header（Tab 切换头部）
├── HorizontalDirectory（水平目录）
├── StandardMenu + ProjectTagsHorizontal
├── ModelList
│   └── <Outlet /> → Normal.tsx（由路由决定）
└── SimpleActionViewer（右侧预览面板）
```

Normal.tsx 作为子路由通过 `<Outlet />` 渲染，所有 Tab（character/simpleaction/mocap/aiaction）共用同一个 Normal 组件。

---

## 5. 埋点（analysis.track）

### 5.1 ListOperation 和 BatchTagButton 中均无 analysis.track 调用

### 5.2 项目中的典型用法示例

```tsx
// 文件: src/components/CommonLayout/GirdLayout/index.tsx:155-171
analysis.track(
  {
    key: 'search_asset_click',          // 埋点事件 key
    name: '搜索点击资源',               // 埋点事件中文名
  },
  clickAsset.searchEvent,               // 附加参数对象
);

// 文件: src/layouts/Header/index.tsx:73
analysis.track({ key: 'home_MuseAI_click' });  // 简单用法，无附加参数
```

---

## 6. 关键关系总结

```
SimpleAction/index.tsx
  └── <Outlet /> → Normal.tsx
      ├── <FilterMenuBar assetType={currentTab} ... />
      │   └── BatchTagButton（内部组件）
      │       ├── BatchType 类型 → 无 'reuseAction'
      │       ├── batchOperationType → 无 reuseAction 项
      │       └── handleOperation → 无 reuseAction case
      └── <List assetType={currentTab} ... />
          └── AssetCard / CommonAssetItem
              └── <ListOperationDropdown assetType={...} ... />
                  ├── reuseAction 菜单项（仅 CHARACTER 显示）
                  └── case 'reuseAction' → 调接口 + 跳转
```

**模块一实现要点**：
1. **ListOperation/index.tsx 第463行**：条件从 `CHARACTER` 扩展到 `SIMPLE_ACTION` / `AI_ACTION`
2. **BatchTagButton.tsx**：BatchType 新增 `'reuseAction'`，generateOperationType 新增项，handleOperation 新增 case
3. **Normal.tsx**：FilterMenuBar 可能需要传 `showOperations` 包含 `'reuseAction'`，或在 BatchTagButton 内部按 assetType 控制可见性
