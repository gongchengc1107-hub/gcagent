# 业务规则

> 本文件记录 MUSE 项目的业务规则、数据流转逻辑、权限约定等。AI 在实现业务功能时应先查阅此文件。

## 权限体系

- 全局权限通过 `state.account`（Redux）获取：`isAdmin`、`systemManagement`、`menuPermissions`
- 仓库级权限通过 `state.organization`（Redux）获取：`permissions`（操作权限）、`currentOrg.permit`（准入权限）、`currentOrg.adminFlag`（仓库管理员）
- Token 管理由网易 SSO 统一处理，业务代码无需介入

## 数据流转

（待补充）

## 审批流程

（待补充）

## 复用动作集（Collection）

| 场景 | 约定 | 备注 |
|------|------|------|
| 预置 fbx 角色识别 | 服务端在 `/api/character/collector/{id}/detail` 接口返回 `is_default_skin: boolean`，`true` 为预置 fbx | 已确认 |
| 预置 fbx 角色详情接口 | `GET /api/character/collector/presetRole` | 专用接口，不走通用 getAssetDetail |
| 角色来源类型 | ENGINEERING=资源包、CHARACTER=动作-角色、DM_MODEL=DM AI 模型、预置 fbx=服务端标识 | originAssetType 字段区分 |

*最后更新：2026-03-30*
