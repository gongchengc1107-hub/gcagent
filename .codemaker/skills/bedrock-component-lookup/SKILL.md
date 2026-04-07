---
name: bedrock-component-lookup
description: 查询 @bedrock/components 组件是否存在及其 API 用法。代码中新增 bedrock import 时必须触发验证。
---

# Skill: bedrock-component-lookup

## 描述

当需要使用 `@bedrock/components` 中的某个组件时，自动访问官方文档、提取 API 信息，再结合业务需求给出最佳用法。

**触发时机**：
- 用户说「用 Bedrock 的 XXX 组件实现…」
- 用户问「Bedrock 的 XXX 组件怎么用？」
- AI 在实现 UI 时计划使用某个 Bedrock 组件，但对其 Props/事件不确定，或不确定是否存在该组件
- **（NON-NEGOTIABLE）** 代码中出现 `import { XXX } from '@bedrock/components'` 且 XXX 是本次新增的导入时

---

## 执行流程

### Step 1 — 识别组件名

从用户需求或代码上下文中提取需要使用的 Bedrock 组件名，并转为 URL slug（全小写，驼峰转连字符）。

常见组件名参考：
- 表单类：`form`、`input`、`select`、`date-picker`、`checkbox`、`radio`、`switch`、`upload`
- 展示类：`table`、`list`、`card`、`tag`、`badge`、`avatar`、`image`、`tooltip`、`popover`
- 反馈类：`modal`、`drawer`、`message`、`notification`、`alert`、`spin`、`progress`
- 导航类：`menu`、`tabs`、`breadcrumb`、`pagination`、`steps`
- 布局类：`grid`、`space`、`divider`

### Step 2 — 检查本地缓存

缓存目录：`.cache/bedrock-docs/`
缓存文件：`.cache/bedrock-docs/{component-slug}.md`（如 `list.md`、`date-picker.md`）

**检查流程**：

1. 尝试读取缓存文件（`read_file`）
2. 读取文件头部的 `expires` 字段：
   ```
   <!-- expires: 2026-03-20T07:00:00Z -->
   ```
3. 对比当前时间：
   - **未过期（< 30 天）** → 直接使用缓存内容，**跳过 Step 3-4，直接进入 Step 5**
   - **已过期或文件不存在** → 继续执行 Step 3（重新从网站获取）

### Step 3 — 获取官方文档（三级降级策略）

按以下优先级依次尝试，成功后即停止：

---

#### 优先级 1：Playwright 批量抓取脚本（首选，最高效）

Skill 目录下内置了批量抓取脚本，可一次性抓取 Bedrock 全部组件的 API 文档并写入缓存。

**适用场景**：
- 缓存全部过期或首次初始化缓存
- 需要批量刷新所有组件文档
- 用户主动说「刷新 Bedrock 缓存」「重新抓取组件文档」

**脚本路径**：`.codemaker/skills/bedrock-component-lookup/scripts/scrape-bedrock-docs.mjs`

**执行方式**：
```bash
node .codemaker/skills/bedrock-component-lookup/scripts/scrape-bedrock-docs.mjs
```

**脚本特性**：
- **组件列表动态获取**：先访问 Bedrock 总览页，从侧边菜单自动提取所有组件名和 slug，无需硬编码
- 使用 Playwright headless 浏览器（`@playwright/test`），自动渲染 SPA 页面
- 逐个导航组件文档页，通过 `page.evaluate()` 提取 `<main>` 区域所有 API 表格
- 输出 Markdown 格式的缓存文件到 `.cache/bedrock-docs/{slug}.md`
- 每个文件包含：`<!-- cached -->` / `<!-- expires -->` 元数据、导入方式、完整 API 表格
- 过期时间默认 30 天
- 支持增量更新（直接覆盖已有缓存文件）
- 依赖：`@playwright/test`（项目已安装）

**判断逻辑**：
- 如果缓存目录为空或缺失 > 10 个组件 → 直接运行全量脚本
- 如果仅缺少个别组件 → 降级到优先级 2（单个抓取）

---

#### 优先级 2：Chrome DevTools MCP 单组件抓取（补充个别缺失）

当仅需要获取 1-2 个组件的文档时，使用 Chrome DevTools MCP 逐个抓取：

> ⚠️ **必须在后台静默打开，不得出现在用户屏幕上**

```json
{
  "url": "https://bedrock.netease.com/components/{component-slug}",
  "background": true
}
```

**抓取步骤**：
1. 调用 `list_pages` 测试 MCP 是否可用
2. 若可用 → 调用 `new_page`（`background: true`）在后台打开文档页面
3. 记录返回的 `pageId`
4. 调用 `select_page` 切换到该页面（**仅切换上下文，不 bringToFront**）
5. 调用 `wait_for` 等待 `["API", "Props"]` 等关键词出现
6. 调用 `take_snapshot` 获取页面内容
7. 重点提取：**API 表格**（Props / Events / Methods）、**代码示例**、**注意事项**
8. 抓取完毕后 `close_page` 关闭后台页面

**MCP 不可用时**（常见原因：多个会话争抢 Chrome profile）：
```bash
# 查找并杀掉残留进程
ps aux | grep "chrome-devtools-mcp" | grep -v grep
kill <旧进程PID>
```
杀掉后再次调用 `list_pages`，通常会自动恢复。

---

#### 优先级 3：读取 .d.ts 类型定义（最终降级）

当 Playwright 和 Chrome DevTools MCP 均不可用时：

```bash
node -e "const fs=require('fs'); console.log(fs.readFileSync('node_modules/@bedrock/components/es/{ComponentName}/index.d.ts','utf8'))"
```

从类型定义中提取 Props、事件、方法等信息。将降级获取的信息写入缓存，并标注来源：
```markdown
<!-- source: .d.ts fallback (Playwright & Chrome DevTools MCP unavailable) -->
```

### Step 4 — 写入本地缓存

将提取到的文档内容整理为 Markdown，写入缓存文件：

**文件格式**：

```markdown
<!-- cached: {当前ISO时间} -->
<!-- expires: {当前时间 + 30天，ISO格式} -->

# {ComponentName} API

> 来源：https://bedrock.netease.com/components/{component-slug}

## 导入

\`\`\`tsx
import { ComponentName } from '@bedrock/components';
\`\`\`

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| ...  | ...  | ...    | ...  |

## 事件

| 事件名 | 类型 | 说明 |
|--------|------|------|
| ...    | ...  | ...  |

## 注意事项

- ...
```

确保 `.cache/` 目录已在 `.gitignore` 中（避免缓存文件提交到 git）。

### Step 5 — 关闭文档页面

文档抓取完毕后，**立即关闭后台页面**：

1. 调用 `list_pages` 获取页面列表
2. 找到 `bedrock.netease.com` 对应的 `pageId`
3. 调用 `close_page` 关闭（**不要切回原页面，直接关闭**）

> ⚠️ 若是最后一个标签页无法关闭，直接跳过，不需要告知用户（对用户透明）。

### Step 6 — 结合业务需求生成代码

基于缓存文档内容，生成符合项目规范的代码：

```tsx
// ✅ 基于官方文档实现
import { ComponentName } from '@bedrock/components';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  /* 使用 CSS 变量，禁止硬编码颜色 */
`;

const MyFeature: FC<Props> = ({ ... }) => {
  return (
    <StyledWrapper>
      <ComponentName
        prop1={...}
        onChange={(val) => {
          // 处理逻辑
        }}
      />
    </StyledWrapper>
  );
};
```

遵循项目规范：
- 样式使用 `styled-components` + CSS 变量，禁止硬编码颜色
- 组件用 `const` + 箭头函数 + `FC` 泛型声明
- Props 类型用 `type`，不用 `interface`

### Step 7 — 输出结果

向用户输出：

1. **文档摘要**：关键 Props 和用法说明（注明是来自缓存还是最新抓取）
2. **实现代码**：可直接使用的完整代码片段
3. **注意事项**：官方文档中提到的陷阱或限制

---

## 边界情况

| 情况 | 处理方式 |
|------|---------|
| 组件名不确定 | 先问用户「你需要的是哪个组件？」，或列出可能的候选 |
| 文档页面无法访问 | 告知用户无法访问，基于已知知识实现，并标注「⚠️ 未读取最新文档，请人工核实 API」 |
| 缓存大面积过期或首次初始化 | 运行 `node .codemaker/skills/bedrock-component-lookup/scripts/scrape-bedrock-docs.mjs` 批量刷新全部组件缓存 |
| Chrome DevTools MCP 不可用 | 先尝试杀掉残留进程恢复；若仍不可用，降级读取 `.d.ts` 类型定义。详见 Step 3 的三级降级策略 |
| 组件在 Bedrock 中不存在 | 先检查 `node_modules/@bedrock/components/es/` 下是否有目录；若无，提示用户该组件不在 bedrock 中，建议自行封装 |
| 需要多个组件组合 | 对每个组件分别执行 Step 2-3，再统一在 Step 4 中组合实现 |
