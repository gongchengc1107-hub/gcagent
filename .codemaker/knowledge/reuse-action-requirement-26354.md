# 需求 #26354 — 动作模块支持发起复用动作列表

*最后更新：2026-03-31*

## 一、需求背景

- **易协作总单**：#26354 【动作模块支持发起复用动作列表】前端总单
- **PRD 地址**：https://docs.popo.netease.com/team/pc/artlib/pageDetail/9f2ec90d4b9d41dca5ec72ab06cf3589
- **设计稿地址**：https://mastergo.netease.com/file/175588523426215?file=175588523426215&page_id=0%3A25771&layer_id=256%3A121703
- **提出人**：千里之路 谭藜卓
- **策划**：肖庆军
- **跟进QA**：陈建(wb.chenjian2015)

## 二、PRD 核心内容（网页端）

### 功能 1-3：复用动作入口（优先开发）

1. **4 个入口场景**增加【复用动作】按钮（hover/点击展示【创建复用列表】+【添加到复用列表】）：
   - 动作-动作、动作-AI动作模块下资产卡片点击【更多】
   - 动作-动作、动作-AI动作模块下多选动作资产
   - 关联动作、关联AI动作页面中点击资产卡片【更多】
   - 关联动作、关联AI动作页面中多选动作资产

2. **创建复用列表**：
   - 以默认预置 fbx 为角色创建列表，并将选中动作资产添加为已选动作
   - 预置角色 fbx 不单独判断权限
   - 预置角色需要生成关联的 neural 和 skeleton

3. **添加到复用列表**：
   - 弹窗选择用户可编辑的所有动作复用列表，默认选中第一个
   - 确认后 toast "添加成功"

### 功能 4：更换角色资产（后续开发）

1. **hover 角色封面**：展示【预览】【更换角色】按钮，hover 按钮出 tips
2. **预览**：点击在预览器中加载角色资产
3. **更换角色弹窗**：
   - **方式一：选择角色附件**
     - 仓库选择：下拉选择当前用户有权限的仓库，支持名称模糊搜索
     - 模块选择：可选资源包/动作；仅开启一个模块则默认选中；都没开启提示"当前仓库暂未开启资源包和动作模块，请选择其他仓库"
     - 资源包模式：搜索资源包 → 选择资源包 → 下拉选择 fbx/max 文件，支持搜索
     - 动作模式：名称模糊搜索当前仓库下所有角色资产
   - **方式二：粘贴角色链接**
     - 支持资源包附件链接或角色资产链接
     - 链接错误/资产不存在 → toast "资产不存在或链接有误"
     - 非 fbx/max 附件或非角色资产 → toast "仅支持粘贴资源包内fbx/max附件链接，或角色资产链接"
     - 粘贴符合条件的链接后自动解析附件名称并显示
4. 确认后替换角色

## 三、埋点定义

| 模块 | 指标名称 | event_type | event_key | 参数 |
|------|---------|-----------|-----------|------|
| 动作 | 从动作发起复用动作列表 | click | Animation_create_reuse_list | entrance_type（动作模块/AI动作模块/关联动作） |
| 其他 | 动作复用列表更换角色 | click | reuse_list_change_character | list_id（复用动作列表ID） |

## 四、易协作单拆分

```
#26354 【动作模块支持发起复用动作列表】前端总单 (25h)
│
├── #26952 模块 - 动作卡片更多菜单及多选复用动作入口 (6h)
│   ├── #26955 ListOperation 扩展 reuseAction 显示条件 (1.5h)
│   ├── #26957 BatchTagButton 新增多选复用动作操作 (3h)
│   └── #26959 动作模块复用动作入口埋点接入 (1.5h)
│
├── #26954 模块 - 关联动作页面复用动作入口 (4h)
│   ├── #26958 关联动作卡片更多菜单集成复用动作 (1.5h)
│   └── #26956 关联动作多选复用动作操作及埋点 (2.5h)
│
└── #26953 模块 - 复用动作列表更换角色 (15h, 技术子单待拆)
```

## 五、关键技术分析（已澄清）

### 入口场景 → 代码映射

| 入口场景 | 代码文件 | 关键逻辑 |
|---------|---------|---------|
| 动作/AI动作卡片更多菜单 | `src/components/ListOperation/index.tsx` | 第463行条件 `assetType === CHARACTER` 需扩展为包含 `SIMPLE_ACTION` 和 `AI_ACTION` |
| 动作/AI动作多选操作 | `src/components/FilterMenu/BatchTagButton.tsx` | BatchType 新增 `'reuseAction'`；Normal.tsx / Skeleton.tsx 的 FilterMenuBar 配置启用 |
| 关联动作卡片更多菜单 | `src/pages/SimpleAction/components/ModelList/Skeleton.tsx` | CommonAssetItem 的 moreOperationOptions 配置 |
| 关联动作多选操作 | 同上 Skeleton.tsx | FilterMenuBar 的 batchOperationType 配置 |

### 类型枚举

- `AssetTypeEnum.SIMPLE_ACTION = 'simpleaction'`（动作）
- `AssetTypeEnum.AI_ACTION = 'aiaction'`（AI动作）
- `AssetTypeEnum.CHARACTER = 'character'`（角色 — 当前唯一启用 reuseAction 的类型）
- `isSimpleactionType()` 包含 CHARACTER / SIMPLE_ACTION / MOCAP / AI_ACTION 四种

### reuseAction click handler（ListOperation 第883-905行）

当前逻辑：
1. 如果有编辑权限（canEdit），调用 `apiPostApiAssetThirdPartyOperationTypeAssetTypeAssetId` 创建动作谱（skeleton_neural）
2. 调用 `getSimpleActionCollectionSelectionUrl()` 生成跳转 URL
3. `history.push(url)` 跳转到复用动作列表挑选页面

该逻辑已兼容所有 simpleaction 类型（URL 生成使用 assetType 参数），扩展条件后无需修改 handler。

### 接口

- 创建复用列表：`apiPostApiCharacterCollectorOrganizationAssetAssetIdBatchSave` ✅ 已有
- 获取可编辑复用列表 / 添加到已有列表：SelectCollectionModal 内部已封装 ✅ 已有

### 已有基础设施

- `src/hooks/useReuseAction.tsx` — 核心 Hook（创建新列表 + 渲染添加弹窗）
- `src/components/MuseAI/MotionPanel/ReuseActionDropdown.tsx` — 下拉菜单组件
- `src/components/MuseAI/MotionPanel/SelectCollectionModal.tsx` — 选择列表弹窗
- `src/components/MuseAI/MotionPanel/types.ts` — EntranceType / PresetRoleInfo 类型

### 关键通用组件（高复用，修改时注意不影响其他场景）

- `ListOperationDropdown` — 各类资产通用卡片更多菜单
- `FilterMenuBar` — 通用筛选/批量操作栏
- `BatchTagButton` — 多选后批量操作按钮组
- `CommonAssetItem` — 通用资产卡片组件

## 六、用户澄清记录

### 模块一/二通用

1. AI动作模块与动作模块本质一样，ActionItem.tsx 是 MuseAI 文生动作弹窗里的功能，**���可参考**
2. RecordBatchFooter 相关内容**不可参考**，多选后操作参考 Normal.tsx / Skeleton.tsx 的 FilterMenuBar + BatchTagButton
3. 关联动作代码入口在 `Skeleton.tsx`
4. FilterMenuBar、BatchTagButton、CommonAssetItem 是高复用组件，修改时**不能影响其他使用场景**
5. 接口均已存在，SelectCollectionModal 内部已实现功能
6. 模块三（更换角色）工时占比应较高（15h / 25h = 60%）

### 模块三 — 更换角色澄清（2026-03-31）

#### 组件架构

7. **更换角色弹窗是全新组件**，不复用现有弹窗
8. **资源包/动作资产选择**：复用现有 `AssetSelect.tsx`
9. **仓库选择器**：需新建独立组件，交互方式参考 `AssetSelect.tsx`，未来可能复用于其他场景
10. **仓库权限查询**：参考 `useMuseAISteps.ts` 内的实现方式，外部传入指定的 `assetTypes`，仓库根据 `showTab` 过滤

#### 选择流程（级联重置）

11. **总体流程**：① 选择仓库 → ② 选择资源类型（资源包/动作）→ ③ 选择资源 → ④ 选择附件（资源包情况）
12. **级联重置规则**：任一步骤发生变化时，后续所有步骤重置
13. **资源类型自动选中**：仓库仅开启一个模块则默认选中；都没开启时提示"当前仓库暂未开启资源包和动作模块，请选择其他仓库"

#### 资源包附件获取

14. **使用 `useFileTree.ts`** 获取资源包完整附件树
15. **前端过滤 fbx/max**：一次加载全部附件树，前端遍历过滤出 `.fbx` 和 `.max` 文件
16. **使用"归档稿"类型**：附件树分为"归档稿"和"过程稿"两种类型，使用"归档稿"
17. **保留路径结构**：过滤后存在文件的路径需完整保留，不存在内容的空路径不保留

#### 后端接口状态

18. **链接解析接口 ⚠️ 未提供**：粘贴角色链接自动解析的接口暂未提供，需留标识
19. **更换角色接口 ⚠️ 未提供**：传入仓库/资源类型/资源id/附件id，或传入角色资产链接，后端负责保存新角色或返回错误信息。一个接口实现所有场景
20. **开发策略**：先做前端 UI 和交互逻辑，后端接口就绪后再对接

#### 更换后的处理

21. **不需要重新生成 neural 和 skeleton**
22. **需要重新加载预览器**
23. **整页刷新**：更换角色成功后，Detail 页面整页刷新（重新加载所有数据）

#### UI 位置

24. **角色封面位置**：在 Detail 页面（`src/pages/SimpleAction/Collection/Detail/index.tsx`）中的一个 54x72px 的圆角图片区域
25. **具体 DOM**：`<div className="w-[54px] h-[72px] ..."><Image src={coverUrl} /></div>`
26. **交互**：hover 时展示【预览】和【更换角色】两个按钮，hover 按钮出 tips

#### 埋点

27. **埋点事件**：`reuse_list_change_character`（click 类型），参数 `list_id` 为复用动作列表 ID

---

## 七、SDD 提案完成状态

*更新时间：2026-03-31*

### 模块一 #26952 — 动作卡片更多菜单及多选复用动作入口（6h）

| Artifact | 状态 | 路径 |
|----------|------|------|
| `.openspec.yaml` | ✅ | `openspec/changes/module1-action-card-reuse-entry/.openspec.yaml` |
| `proposal.md` | ✅ | `openspec/changes/module1-action-card-reuse-entry/proposal.md` |
| `specs/action-reuse-entry/spec.md` | ✅ | `openspec/changes/module1-action-card-reuse-entry/specs/action-reuse-entry/spec.md` |
| `design.md` | ✅ | `openspec/changes/module1-action-card-reuse-entry/design.md` |
| `review.md` | ✅ APPROVED | `openspec/changes/module1-action-card-reuse-entry/review.md` |
| `api-audit.md` | ✅ READY | `openspec/changes/module1-action-card-reuse-entry/api-audit.md` |
| `tasks.md` | ✅ | `openspec/changes/module1-action-card-reuse-entry/tasks.md` |

**可执行 `/opsx-apply`**

### 模块二 #26954 — 关联动作页面复用动作入口（4h）

| Artifact | 状态 | 路径 |
|----------|------|------|
| `.openspec.yaml` | ✅ | `openspec/changes/module2-related-action-reuse-entry/.openspec.yaml` |
| `proposal.md` | ✅ | `openspec/changes/module2-related-action-reuse-entry/proposal.md` |
| `specs/related-action-reuse-entry/spec.md` | ✅ | `openspec/changes/module2-related-action-reuse-entry/specs/related-action-reuse-entry/spec.md` |
| `design.md` | ✅ | `openspec/changes/module2-related-action-reuse-entry/design.md` |
| `review.md` | ✅ APPROVED | `openspec/changes/module2-related-action-reuse-entry/review.md` |
| `api-audit.md` | ✅ READY | `openspec/changes/module2-related-action-reuse-entry/api-audit.md` |
| `tasks.md` | ✅ | `openspec/changes/module2-related-action-reuse-entry/tasks.md` |

**可执行 `/opsx-apply`**

### 模块三 #26953 — 复用动作列表更换角色（15h）

| Artifact | 状态 | 路径 |
|----------|------|------|
| `.openspec.yaml` | ✅ | `openspec/changes/module3-collection-change-character/.openspec.yaml` |
| `proposal.md` | ✅ | `openspec/changes/module3-collection-change-character/proposal.md` |
| `specs/character-cover-hover/spec.md` | ✅ | `openspec/changes/module3-collection-change-character/specs/character-cover-hover/spec.md` |
| `specs/change-character-modal/spec.md` | ✅ | `openspec/changes/module3-collection-change-character/specs/change-character-modal/spec.md` |
| `specs/warehouse-selector/spec.md` | ✅ | `openspec/changes/module3-collection-change-character/specs/warehouse-selector/spec.md` |
| `design.md` | ✅ | `openspec/changes/module3-collection-change-character/design.md` |
| `review.md` | ✅ APPROVED | `openspec/changes/module3-collection-change-character/review.md` |
| `api-audit.md` | ✅ READY | `openspec/changes/module3-collection-change-character/api-audit.md` |
| `tasks.md` | ✅ | `openspec/changes/module3-collection-change-character/tasks.md` |

**可执行 `/opsx-apply`**

### 下一步

三个模块的 SDD 提案阶段全部完成，均已达到 `apply.requires: [tasks, review, api_audit]` 条件。在新会话中可按以下顺序实施：

1. **模块一** `/opsx-apply` → 实施 → post-review → e2e → verify
2. **模块二** `/opsx-apply` → 实施（依赖模块一的 ListOperation 条件扩展）→ post-review → e2e → verify
3. **模块三** `/opsx-apply` → 实施 → post-review → e2e → verify

⚠️ 模块三有两个后端接口未提供（链接解析、更换角色保存），先做前端 UI，接口就绪后执行 `pnpm api:genapi` 并替换 TODO。
