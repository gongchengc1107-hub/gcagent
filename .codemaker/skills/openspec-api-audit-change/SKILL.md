# Skill: openspec-api-audit-change

## 描述

在 DESIGN 完成、进入 IMPLEMENT 之前，AI 自动扫描 `design.md` 中涉及的所有 API 接口，验证它们是否在 `src/OpenApiServices/` 中真实存在，并输出字段分析报告 `api-audit.md`。

核心目标：**在写任何一行业务代码前，确保所有接口契约已对齐**，杜绝「写完代码才发现接口不存在或字段对不上」的返工。

---

## 触发时机

- 用户说"帮我 API-AUDIT"、"检查接口"、"进入 API 审查" 时
- REVIEW 结论为 APPROVED 后，IMPLEMENT 开始前（自动衔接）

---

## 执行步骤

### Step 1：读取 design.md，提取所有 API 相关信息

必须读取：
1. `openspec/config.yaml`
2. `openspec/changes/{change-id}/design.md` — 提取所有 Decisions 中提到的接口名或 URL
3. `openspec/changes/{change-id}/tasks.md`（如已存在）— 提取所有涉及 `pnpm api:genapi` 或接口调用的任务项
4. `src/OpenApiServices/` — 接口总表（自动生成文件）

提取策略：
- 搜索 design.md 中出现的 API URL 片段（如 `/api/xxx`）
- 搜索接口函数名关键词（如 `getXxx`、`createXxx`、`updateXxx`）
- 搜索 design.md 中 Decisions 章节里的「接口」「API」「请求」相关描述

---

### Step 2：逐一核查接口存在性

对每个提取出的接口，在 `src/OpenApiServices/` 中搜索：

| 接口描述（来自 design.md）| 函数名（services 中）| 存在？ | 入参类型 | 返回值类型 |
|--------------------------|---------------------|--------|---------|-----------|
| 获取供应商列表 | `getSupplierList` | ✅ 存在 | `SupplierListReq` | `CommonResSupplierListDto` |
| 审批作品 | `approveWork` | ❌ 不存在 | — | — |

**不存在时的处理**：
- 标记为 ❌，并推断可能的接口名（给出建议名称）
- 询问用户：是否需要先运行 `pnpm api:genapi`？（后端是否已经定义了该接口？）

---

### Step 3：对存在的接口做字段分析

对每个 ✅ 存在的接口，分析：

**入参（XxxReq）字段**：
- 列出所有必填字段
- 确认 design.md 中的 UI 元素能提供这些字段
- 标记无法提供的字段为 ⚠️

**返回值（XxxDto）字段**：
- 列出返回的关键字段
- 确认 design.md 的 UI 渲染需求能被返回值满足
- 标记 design.md 中使用但返回值里不存在的字段为 ⚠️

---

### Step 4：生成 api-audit.md

将审查结果写入 `openspec/changes/{change-id}/api-audit.md`：

```markdown
# API Audit: {change-id}

**审查日期**: {date}
**审查结论**: READY / NEEDS_API_UPDATE / BLOCKED

---

## 接口契约总表

| 功能 | 函数名 | 存在 | 入参完整 | 返回值满足 UI | 风险 |
|------|--------|------|---------|-------------|------|
| 获取列表 | `getXxxList` | ✅ | ✅ | ✅ | — |
| 提交审批 | `submitApproval` | ❌ | — | — | 🚫 Blocking |
| 更新状态 | `updateStatus` | ✅ | ⚠️ 缺少 `reason` 字段 | ✅ | ⚠️ Warning |

---

## 缺失接口列表（需执行 pnpm api 或后端确认）

| # | 接口描述 | 推断函数名 | 建议 URL | 处理方式 |
|---|---------|----------|---------|---------|
| 1 | 审批作品 | `approveWork` | `/api/work/approve` | ❓ 询问后端是否已定义 |

---

## 字段不匹配详情

### ⚠️ `updateStatus` 入参缺少字段

**设计需要**: `{ id, status, reason }`  
**接口实际**: `{ id, status }`（无 `reason` 字段）  
**建议**: 确认后端是否支持 `reason`，或调整 UI 设计去掉该字段

---

## 需要执行的前置操作

- [ ] `pnpm api:genapi` — 同步最新接口定义（建议在 IMPLEMENT 开始前执行一次）
- [ ] 确认缺失接口是否已有后端实现

---

## 结论

- **READY**: 所有接口存在且字段匹配，可直接进入 IMPLEMENT
- **NEEDS_API_UPDATE**: 需先执行 `pnpm api:genapi` 同步接口，或等待后端补充接口
- **BLOCKED**: 存在关键接口缺失，无法推进，需后端配合
```

---

### Step 5：向用户汇报

汇报格式：
- 审查结论（READY / NEEDS_API_UPDATE / BLOCKED）
- ❌ 缺失接口列表（如有），询问是否运行 `pnpm api:genapi`
- ⚠️ 字段不匹配问题（如有），询问是修改 design.md 还是联系后端
- READY 时自动提示：可以进入 IMPLEMENT 阶段

---

## 注意事项

- `src/OpenApiServices/` 是自动生成文件，**禁止手工修改**，若接口缺失应执行 `pnpm api:genapi`
- 若文件过大，只搜索关键函数名，不需要读全文
- 若 design.md 未提及具体接口，从 Goals 章节反推可能需要的 CRUD 操作
