# Skill: openspec-e2e-change

## 描述

在 POST-REVIEW 完成后，AI 自动根据 `tasks.md` 和 `design.md` 生成 Playwright E2E 测试用例，在本地执行测试，并将结论写入 `e2e-report.md`。

执行原则：**仅依赖指定文件作为 context，忽略当前对话历史**，以客观、真实的用户视角验证功能。

---

## 触发时机

- 用户说 "帮我跑 E2E"、"执行端到端测试"、"生成 E2E 用例" 时
- POST-REVIEW 结论为 APPROVED 后（自动衔接）

---

## 执行步骤

### Step 0：E2E 环境准备（NON-NEGOTIABLE，必须首先执行）

按以下顺序检查并准备 E2E 运行环境，**任一步骤失败则停止并明确提示用户**：

#### 0.1 检查 Dev Server（端口 8181）

```bash
lsof -i :8181 -P -n 2>/dev/null
```

- **有进程监听** → Dev server 已运行，继续下一步
- **无进程** → 自行启动：

```bash
nohup pnpm start > /tmp/muse-dev-server.log 2>&1 &
```

启动后轮询等待编译完成（约 15~30 秒），判断方式：
```bash
tail -5 /tmp/muse-dev-server.log | grep -q "Compiled in"
```

若 60 秒内未编译完成，提示用户检查日志 `/tmp/muse-dev-server.log`。

#### 0.2 检查 Proxyman 代理（端口 8888）

```bash
lsof -i :8888 -P -n 2>/dev/null
```

- **Proxyman 在监听** → 代理就绪，继续下一步
- **无进程** → 提示用户："请启动 Proxyman 并确保 127.0.0.1:8888 代理已配置"

#### 0.3 验证 Dev Server 可访问

```javascript
const r = await fetch('http://localhost:8181/', { signal: AbortSignal.timeout(5000) });
// 应返回 200 且 body 包含 "root" 或 "umi"
```

- **可访问** → 环境就绪
- **不可访问** → 提示用户检查 dev server 状态

#### 0.4 确定 Playwright 配置

- 项目根目录 `playwright.config.ts` 为标准配置
- `baseURL`: `http://localhost:8181`（通过 `E2E_BASE_URL` 环境变量可覆盖）
- `proxy.server`: `http://127.0.0.1:8888`（Proxyman，确保 API 请求路由到正确后端）

> 环境详细信息参见 `.codemaker/knowledge/e2e-testing-env.md`

---

### Step 1：确认前置条件

检查以下条件，任一不满足则停止并提示用户：

1. `openspec/changes/{change-id}/tasks.md` 存在，且所有任务已标记 `[x]`
2. `openspec/changes/{change-id}/post-review.md` 存在，且结论为 APPROVED
3. `e2e/helpers/accounts.ts` 存在（账号配置文件）— 如不存在，权限相关测试标记为 skip
4. Step 0 环境准备已通过（dev server 在 8181 运行，Proxyman 在 8888 运行）

---

### Step 2：重置 context，只读取以下文件

必须读取：
1. `openspec/changes/{change-id}/tasks.md` — 任务清单（提取验收条件）
3. `openspec/changes/{change-id}/design.md` — 设计文档（理解功能意图和页面结构）
4. `e2e/helpers/accounts.ts` — 账号/角色配置

> ⚠️ 严格忽略当前会话中的讨论历史和代码编辑过程，以真实用户视角推导测试场景。

---

### Step 3：分析需要测试的场景

从 `tasks.md` 的"测试与验收"分组提取验收 checklist，结合 `design.md` 的 Goals 章节，推导出：

**测试矩阵**：

| 场景 | 操作路径 | 期望结果 | 所需角色 |
|------|---------|---------|---------|
| 主流程 Happy Path | ... | ... | admin/supplier/... |
| 权限隔离 | 角色 A 不能访问 | 重定向/403 | 对比多角色 |
| 边界情况 | 空数据/错误输入 | 友好提示 | 任意 |

**角色覆盖原则**：
- 涉及权限的功能必须测试有权限角色（能操作）和无权限角色（被拒绝）两种场景
- 优先测试 `supplier`（SUPPLIERS_USER）和 `admin`（SUPER_ADMIN）两个主要角色

---

### Step 4：生成测试文件

在 `e2e/changes/{change-id}/` 目录下生成测试文件，文件名格式：`{feature-name}.spec.ts`

**测试文件模板**：

```typescript
import { test, expect } from '../../fixtures/base';

/**
 * E2E 测试：{change-id} — {功能名称}
 * 基于 tasks.md 验收条件自动生成
 * 生成时间：{date}
 */

test.describe('{功能名称}', () => {

  // === Happy Path ===

  test('【admin】{主流程描述}', async ({ page, as }) => {
    await as('admin');
    await page.goto('{目标路由}');
    // 等待页面加载
    await expect(page.getByText('{关键文本}')).toBeVisible();
    // 执行操作
    await page.getByRole('button', { name: '{按钮名}' }).click();
    // 验证结果
    await expect(page.getByText('{期望结果}')).toBeVisible();
  });

  // === 权限测试 ===

  test('【supplier】{功能名称}对供应商的权限表现', async ({ page, as }) => {
    await as('supplier');
    await page.goto('{目标路由}');
    // 供应商应看到/看不到的内容
    await expect(page.getByText('{期望文本}')).toBeVisible();
  });

  // === 边界情况 ===

  test('【admin】空数据时的展示', async ({ page, as }) => {
    await as('admin');
    // ...
  });

});
```

**代码规范**：
- 使用 `page.getByText()` / `page.getByRole()` / `page.getByLabel()` 等语义化选择器，避免 CSS 选择器
- 每个 test 只测一个场景，名称包含角色标识 `【角色】`
- 账号切换使用 `as('role')` fixture，不要直接调用 loginAs
- 等待使用 `await expect(...).toBeVisible()` 而非 `page.waitForTimeout()`

**UI 快照规范**：

每个 Happy Path 测试用例在**关键节点**截图，保留 UI 实现证据：

```typescript
test('【admin】{主流程描述}', async ({ page, as }) => {
  await as('admin');
  await page.goto('{目标路由}');
  await expect(page.getByText('{关键文本}')).toBeVisible();

  // ✅ 截图 1：页面初始状态
  await page.screenshot({
    path: `e2e/snapshots/{change-id}/{feature}-initial.png`,
    fullPage: true,
  });

  await page.getByRole('button', { name: '{按钮名}' }).click();
  await expect(page.getByText('{期望结果}')).toBeVisible();

  // ✅ 截图 2：操作完成后状态
  await page.screenshot({
    path: `e2e/snapshots/{change-id}/{feature}-after-action.png`,
    fullPage: true,
  });
});
```

**截图命名规则**：`{change-id}/{feature}-{状态描述}.png`
- `initial` — 页面加载后初始状态
- `after-action` — 关键操作完成后
- `empty-state` — 空数据状态
- `error-state` — 错误/异常状态

截图仅在 Happy Path 用例中添加；权限测试和边界测试中按需添加。

---

### Step 5：执行测试

运行以下命令执行该 change 的测试：

```bash
# 在项目根目录执行
# baseURL 默认为 http://localhost:8181（来自 playwright.config.ts）
# proxy 默认为 http://127.0.0.1:8888（来自 playwright.config.ts）
npx playwright test e2e/changes/{change-id}/ --reporter=list 2>&1
```

如需覆盖 baseURL：
```bash
E2E_BASE_URL=http://localhost:8181 npx playwright test e2e/changes/{change-id}/ --reporter=list
```

> **注意**：使用项目根目录的 `playwright.config.ts`，其中已预配置 baseURL 和 Proxyman 代理。
> 如需 JSON 格式结果用于自动分析，改用 `--reporter=json`。

---

### Step 6：生成 e2e-report.md

将测试结论写入 `e2e/changes/{change-id}/e2e-report.md`：

```markdown
# E2E Report: {change-id}

**测试日期**: {date}
**环境**: {E2E_BASE_URL}
**测试结论**: PASSED / FAILED / PARTIAL

---

## 执行摘要

- 总用例数: {total}
- ✅ 通过: {passed}
- ❌ 失败: {failed}
- ⏭️ 跳过: {skipped}

---

## 用例结果

| 用例 | 角色 | 结论 | 耗时 |
|------|------|------|------|
| 主流程 - 管理员创建... | admin | ✅ PASS | 2.3s |
| 权限测试 - 供应商无法... | supplier | ✅ PASS | 1.1s |
| 边界情况 - 空数据展示 | admin | ❌ FAIL | 3.2s |

---

## 失败详情

### ❌ {失败用例名}

**错误信息**:
```
{playwright error output}
```

**截图**: {screenshot path if any}

**分析**: {对失败原因的简要分析}

---

## 结论

- PASSED: 所有用例通过，可进入 VERIFY
- FAILED: 存在失败用例，需要修复后重新测试
- PARTIAL: 部分用例因环境问题跳过，核心用例已通过（注明原因后可进入 VERIFY）
```

---

### Step 7：Auto-Repair Loop（失败用例自动修复）

若测试结论为 **FAILED**，按以下流程自动尝试修复，**最多循环 3 次**：

#### 7.1 失败原因分类

| 类型 | 判断依据 | 修复策略 |
|------|---------|---------|
| **选择器失效** | `locator resolved to X elements` / `locator not found` | 更换更稳定的语义化选择器 |
| **时序问题** | `Timeout exceeded waiting` / `element not visible` | 添加 `await expect(...).toBeVisible()` 等待或增加超时 |
| **业务逻辑错误** | 断言失败但页面渲染正常 | 分析代码，输出修复建议，**暂停等用户确认** |
| **环境问题** | 网络超时 / 服务不可达 | 标记为 `ENV_ISSUE`，不计入修复循环 |

#### 7.2 自动修复流程

```
ROUND 1/2/3:
  1. 分析失败用例的 error stack
  2. 若类型为「选择器失效」或「时序问题」→ 自动修改测试代码
  3. 重新运行 失败用例（仅失败的，不全量跑）：
     npx playwright test {失败用例路径} --retry=0
  4. 若修复成功 → 继续下一个失败用例
  5. 若仍失败 → 进入下一 ROUND
  6. 超过 3 ROUND → 标记为 MANUAL_REQUIRED，暂停并汇报
```

#### 7.3 业务逻辑错误处理

若失败原因是**业务逻辑错误**（实现与设计不符），立即暂停修复循环：
```
⛔ 发现业务逻辑错误：{描述}
用例「{用例名}」期望「{期望}」，实际「{实际}」

这可能是实现 Bug，而非测试代码问题。
建议：
1. 检查 {相关文件路径}，对比 design.md § {章节}
2. 修复后执行 `pnpm start` 重启，再重跑 E2E
```

#### 7.4 修复完成汇报

```markdown
## 🔧 Auto-Repair 结果

| 用例 | 原始失败原因 | 修复方式 | 修复结果 |
|------|-----------|---------|---------|
| {用例名} | 选择器失效 | 改用 getByRole | ✅ 已修复 |
| {用例名} | 业务逻辑错误 | 需人工介入 | ⛔ MANUAL_REQUIRED |

修复后通过率: {新通过数}/{总数}
```

---

### Step 8：最终汇报

汇报格式：
- 测试结论（PASSED / FAILED / PARTIAL）
- 通过率（如 10/10 用例通过）
- 列出 MANUAL_REQUIRED 用例和分析（如有）
- 若 PASSED → 自动衔接 VERIFY 阶段
- 若仍有 FAILED → 询问用户：修复代码后重新跑，还是标记 PARTIAL 进入 VERIFY

---

## 注意事项

- **环境配置参考**：`.codemaker/knowledge/e2e-testing-env.md` 包含完整的端口、代理、Playwright 配置信息
- **Dev server 端口为 8181**（UmiJS max dev），不是默认的 8000
- **Proxyman (127.0.0.1:8888)** 作为 HTTP 代理，Playwright 通过 `proxy` 配置使用，确保 API 请求路由到正确后端
- 如果本地 dev server 未启动，由 Step 0 自动启动，无需手动干预
- 测试执行时间超过 60s 的用例要检查是否有 `waitForTimeout` 滥用
- 失败截图保存在 `e2e/report/` 目录，在汇报时提示用户打开查看
- `e2e/changes/` 目录纳入 git 版本管理（测试文件 + 报告一起归档）
- `e2e/report/`、`e2e/results.json` 和 `test-results/` 添加到 `.gitignore`（体积大，可重新生成）
- **SSO 登录限制**：MUSE 平台需要网易内部 SSO 认证，Playwright 无法自动完成。需要登录态的测试用例应标记 `test.skip` 并说明原因，在 e2e-report.md 中记录为 PARTIAL
