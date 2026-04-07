# 接力提示词 — 需求 #26354 动作模块支持发起复用动作列表

> 本文件为新会话的上下文接力提示词。复制下方内容作为新会话的第一条消息即可。

---

## ✅ 模块一已完成（openspec 全流程已归档）

- **分支**: `feat-zl-reuseFromSimpleaction`
- **commit 1**: `feat: refs #26952 【动作模块支持发起复用动作列表】前端总单 - 模块 - 卡片更多菜单复用动作入口`（6 个核心源码文件）
- **commit 2**: `feat: refs #26952 【动作模块支持发起复用动作列表】前端总单 - 模块 - 卡片更多菜单复用动作入口`（openspec 提案归档 + e2e 测试 + test-results）
- **openspec 状态**: post-review=APPROVED, e2e=PARTIAL（内网不可达）, verify=通过, 已归档至 `openspec/changes/archive/2026-03-31-module1-action-card-reuse-entry/`
- **改动文件（6个）**:
  - `src/hooks/useReuseAction.tsx` — 扩展 listParams + fetchCollectionCount
  - `src/components/MuseAI/MotionPanel/SelectCollectionModal.tsx` — 扩展 listParams
  - `src/components/MuseAI/MotionPanel/types.ts` — 新增 ReuseActionListParams 类型
  - `src/components/ListOperation/index.tsx` — 卡片菜单新增 createReuseList / addToReuseList
  - `src/components/FilterMenu/BatchTagButton.tsx` — 批量操作新增 reuseAction Dropdown
  - `src/pages/SimpleAction/components/ModelList/Normal.tsx` — 动作模块主页面对接 useReuseAction

## ✅ 模块二已完成（openspec 全流程已提交）

- **分支**: `feat-zl-reuseFromSimpleaction`
- **commit**: `feat: refs #26954 【动作模块支持发起复用动作列表】前端总单 - 模块 - 关联动作页面复用动作入口`（4 个源码文件 + openspec 提案）
- **openspec 状态**: post-review=APPROVED, tasks 全部完成（测试与验收项待人工验证）
- **改动文件（4个）**:
  - `src/components/MuseAI/MotionPanel/types.ts` — EntranceType 新增 `'relatedAction'`
  - `src/hooks/useReuseAction.tsx` — ENTRANCE_TYPE_MAP 新增 relatedAction 映射（`关联动作创建` / `关联动作添加`）
  - `src/pages/SimpleAction/components/ModelList/Skeleton.tsx` — 新增 useReuseAction hook + FilterMenuBar 传入 handleCreateReuseList / renderReuseActionModal
  - `src/pages/SimpleAction/Detail/index.tsx` — 新增 useReuseAction hook + BatchTagButton 传入 handleCreateReuseList / renderReuseActionModal
- **方案修正**：design.md 原方案建议用 `customOperationGroup`，实施时发现 BatchTagButton 已内置 `reuseAction` 操作类型（L1002），改用 `handleCreateReuseList` + `renderReuseActionModal` prop 方案，避免覆盖默认批量操作

## ✅ 模块三已完成（openspec 全流程已归档）

- **分支**: `feat-zl-reuseFromSimpleaction`
- **commit**: `feat: refs #26953 【动作模块支持发起复用动作列表】前端总单 - 模块 - 复用动作列表更换角色`（7 个源码文件 + openspec 归档 + e2e + 知识库）
- **openspec 状态**: post-review=APPROVED, e2e=PARTIAL（内网不可达）, verify=通过, 已归档至 `openspec/changes/archive/2026-04-01-module3-collection-change-character/`
- **新建文件（5个）**:
  - `src/pages/SimpleAction/Collection/hooks/useChangeCharacter.ts` — 更换角色 Hook（级联状态 + 弹窗控制 + 埋点 + TODO 接口预留）
  - `src/pages/SimpleAction/Collection/components/WarehouseSelector.tsx` — 仓库选择器（Redux + API 过滤 + 搜索）
  - `src/pages/SimpleAction/Collection/components/ChangeCharacterModal/index.tsx` — 弹窗主体（Tabs + 确认禁用逻辑）
  - `src/pages/SimpleAction/Collection/components/ChangeCharacterModal/SelectTab.tsx` — 选择角色附件 Tab（级联：仓库→资源类型→资源→附件，useFileTree + fbx/max 过滤）
  - `src/pages/SimpleAction/Collection/components/ChangeCharacterModal/LinkTab.tsx` — 粘贴链接 Tab（TODO 接口预留）
- **修改文件（2个）**:
  - `src/pages/SimpleAction/Collection/Detail/index.tsx` — 角色封面 hover 交互（group-hover 遮罩 + 预览/更换角色按钮 + 弹窗集成）
  - `src/pages/SimpleAction/Collection/components/AssetSelect.tsx` — any → SelectedAsset 类型修复
- **待后端接口就绪**：
  - `parseCharacterLink(link)` — 链接解析接口（useChangeCharacter.ts 中 TODO）
  - `saveChangeCharacter(params)` — 更换角色保存接口（useChangeCharacter.ts 中 TODO）

### 关键 Discoveries（新会话必读）

1. **角色模块（CHARACTER）的「复用动作」**= `skeleton_neural` API + URL 跳转（**已有代码，不能改动**）
2. **动作/AI动作模块的「复用动作」**= `useReuseAction` hook，展示「创建新列表」+「添加至已有列表」
3. **`customOperationGroup` 方案被否决**：会替换整个批量操作按钮组，改为 BatchTagButton 内置 `reuseAction` 操作类型 + `handleCreateReuseList` / `renderReuseActionModal` prop
4. **`canEdit`** 来自后端 API `asset.canEdit` 字段，非 Redux state
5. **`useReuseAction`** 在所有 `ListOperationDropdown` 中无条件调用（含 CHARACTER），Hook 规则限制，开销可接受
6. **两个埋点 key**：ListOperation `Animation_create_reuse_list` + useReuseAction `AI_animation_create_reuse_list`（有意区分）
7. **commit message 格式**：必须严格遵循 `feat: refs #单号 单名称`，单名称用易协作模块单原始名称，具体描述通过 `-m` 换行写在 body 中
8. **EntranceType 已扩展**：新增 `'relatedAction'`（关联动作页面），ENTRANCE_TYPE_MAP 映射为 `{ create: '关联动作创建', add: '关联动作添加' }`
9. **BatchTagButton reuseAction 内置逻辑**：L1002 处，`visible` 条件 = `handleCreateReuseList && renderReuseActionModal` 都传入 + `assetType` 为 SIMPLE_ACTION 或 AI_ACTION。传入这两个 prop 即可启用，不需要 customOperationGroup
10. **Collection Detail 权限**：用 `useCollectionPermission` hook 的 `isOwner`（`auth_type === 'owner'`），**不是** Redux `canEdit`
11. **useFileTree 实际路径**：`src/hooks/useAssetDetail/useFileTree.ts`，`versionLabel` 用 `ManuscriptValueEnum.archive`（`'0'`），不是字符串 `'归档稿'`
12. **更换角色埋点**：`reuse_list_change_character` 事件，参数 `list_id` 为复用动作列表 ID

---

## 需求 #26354 全部三个模块已完成

| 模块 | 易协作单 | 状态 | 归档路径 |
|------|----------|------|----------|
| 模块一：卡片更多菜单复用动作入口 | #26952 | ✅ 已完成 | `openspec/changes/archive/2026-03-31-module1-action-card-reuse-entry/` |
| 模块二：关联动作页面复用动作入口 | #26954 | ✅ 已完成 | （commit 中含 openspec 提案） |
| 模块三：复用动作列表更换角色 | #26953 | ✅ 已完成 | `openspec/changes/archive/2026-04-01-module3-collection-change-character/` |

### 后续待办
- 模块三两个后端接口就绪后，替换 `useChangeCharacter.ts` 中的 TODO
- 内网环境执行 E2E 测试验证（模块一和模块三的 e2e 测试文件已生成）
- 知识库文件：`.codemaker/knowledge/module1-code-analysis-26952.md`、`module2-code-analysis.md` 未纳入 commit（属历史分析文件）
