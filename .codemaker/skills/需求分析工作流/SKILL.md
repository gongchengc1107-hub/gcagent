---
name: 需求分析工作流
description: 需求分析工作流。用户说"做需求"/"更新需求"时触发。读取 POPO 文档或 PRD，分析需求并索要设计稿和接口信息。
compatibility:
  tools:
    - use_mcp_tool
    - read_file
    - list_files_recursive
    - ask_user_question
    - run_terminal_cmd
---

# 需求分析工作流技能

## 概述

本技能提供了一个标准化的需求分析工作流程，确保在处理需求文档时遵循一致的步骤，包括需求获取、差异分析、设计稿收集和接口识别。

## 工作流程

### 1. 识别用户意图

根据用户的表达确定工作流类型：

- **"做需求"**：开始新的需求分析
- **"更新需求"**：更新现有需求，分析差异
- 其他相关表达如"处理需求"、"分析需求"等

### 1.5. 询问易协作单（NON-NEGOTIABLE）

在确定工作流类型之后、处理需求文档之前，**必须询问用户是否有易协作单**：

```
是否有易协作单？如有请提供，格式：#单号 单名（例如：#12345 供应商模块优化）
```

- **用户提供了** → 记录易协作单信息（`ticketRef`），后续开发阶段每完成一个任务计划小点时自动执行 `git commit`
- **用户未提供 / 跳过** → 不影响流程，后续不自动 commit

> 易协作单信息在整个需求生命周期中持续生效，传递给后续的 `openspec-implement-change`、`large-requirement-workflow` 等 Skill。

### 2. 需求文档处理

#### 2.1 新需求分析（"做需求"）

**场景A：用户已提供 POPO 文档地址**

如果用户在说"做需求"的同时或之后提供了 POPO 文档 URL：

1. 启动一个 **subagent**，模型指定为 `netease-codemaker/deepseek-chat`
2. Subagent 的任务是：
   - 使用 POPO MCP 的 `getContentByUrl` 工具读取文档内容
   - 将文档整理为结构化的 Markdown 格式
   - 提取核心信息：需求背景、核心目标、业务流程、功能点详情
   - 将结果写入 `PRD/{文档标题}.md`
   - **同时将原始 HTML 内容返回给主流程**，用于后续图片提取
3. Subagent 完成后，主流程读取生成的 PRD 文件
4. **执行图片下载流程**（见 2.3 节），将文档中的图片保存到本地并更新 MD 中的引用
5. 基于 PRD 文本 + 图片内容继续后续步骤

**Subagent 调用示例（伪代码）：**
```
Task for subagent:
- 模型: netease-codemaker/deepseek-chat
- 指令: 使用 POPO MCP 的 getContentByUrl 工具读取 {popo_url}，
  将内容整理为结构化 Markdown 需求文档，保存到 PRD/{标题}.md。
  文档应包含：版本迭代、需求背景、核心目标、业务流程、需求详情等章节。
  文档末尾注明来源 URL 和整理时间。
  
  重要：在返回结果中，除了确认文件已保存外，还需要返回原始 HTML 中所有 <img> 标签的 src URL 列表，
  格式为每行一个 URL，便于主流程提取图片。
```

**场景B：用户未提供需求文档**

如果用户说"做需求"但没有给出任何文档地址或内容：

1. 使用 `list_files_recursive` 查看 `PRD/` 目录下的所有 `.md` 文件
2. 使用 `ask_user_question` 将文件列表作为选项展示给用户
3. 用户选择后，使用 `read_file` 读取选中的文件内容
4. 基于该文件内容作为需求输入，继续后续步骤

**示例交互：**
```
AI: 未检测到需求文档地址，PRD 目录下已有以下需求文档，请选择：
选项：
1. 供应商模块需求文档.md
2. 用户管理需求文档.md
3. 提供 POPO 文档链接（手动输入）
```

#### 2.2 需求更新分析（"更新需求"）
1. 列出PRD目录中已存在的需求文档
2. 让用户选择要更新的文档或提供新的文档链接
3. 如果用户选择现有文档：
   - 读取原文档内容，检查文档末尾是否记录了原始POPO文档URL
   - 询问用户是否有新的文档URL：
     * 如果用户提供新URL → 使用新URL
     * 如果用户不提供新URL → 使用原文档中记录的URL
     * 如果原文档未记录URL → 询问用户提供URL
   - 启动 subagent（netease-codemaker/deepseek-chat）读取文档内容
   - **直接将更新后的内容写入文件**，不在对话中输出完整文档
   - **写入完成后，展示 diff（变更对比）**，让用户直观看到新增、修改、删除的内容
4. 如果用户提供新链接：
   - 按新需求流程处理
   - 询问是否要替换现有文档

#### 2.3 文档图片下载与阅读（NON-NEGOTIABLE）

> ⛔ **重要**：POPO 云空间文档中的图片（通常是 UI 原型图、流程图、交互稿）包含关键需求信息。
> 必须下载这些图片并阅读其内容，否则会遗漏需求中的视觉和交互细节。

POPO MCP `getContentByUrl` 返回的 HTML 中包含 `<img>` 标签，其 `src` 指向 `https://office.netease.com/api/admin/file/download?path=...` 格式的 URL。
这些 URL 需要 **Cookie 鉴权** 才能访问。

##### 图片下载流程

**步骤 1：提取图片 URL**

从文档 HTML 中提取所有 `<img>` 标签的 `src` 属性，收集所有 `office.netease.com` 域名下的图片 URL 列表。

**步骤 2：从文档 URL 中提取 extraParams**

从文档 URL 中解析 `teamSpaceId` 和 `pageId`，拼接 `extraParams` 参数。云空间文档的图片下载 URL 需要附加此参数：

```
原始图片 URL: https://office.netease.com/api/admin/file/download?path=popo/2026/03/13/xxx.png

需要追加 extraParams:
https://office.netease.com/api/admin/file/download?path=popo%2F2026%2F03%2F13%2Fxxx.png&extraParams=%7B%22teamSpaceId%22%3A%22{teamSpaceId}%22%2C%22pageId%22%3A%22{pageId}%22%2C%22locationType%22%3A%222%22%7D
```

其中：
- `teamSpaceId`：从文档 URL 或 Referer 中的 `extraParams` 查询参数中提取
- `pageId`：从文档 URL 路径中 `pageDetail/{pageId}` 部分提取
- `locationType` 固定为 `"2"`

**步骤 3：向用户索要 Cookie**

询问用户提供一次带 Cookie 的 curl 命令：

```
文档中包含 {N} 张图片（UI 原型图/交互稿），需要登录态才能下载。
请从浏览器中复制一个图片请求的 curl 命令（Chrome DevTools → Network → 右键图片请求 → Copy as cURL），
我将从中提取 Cookie 用于批量下载所有图片。
```

从用户提供的 curl 命令中提取以下信息：
- **Cookie**：`-b '...'` 或 `-H 'Cookie: ...'` 中的值，关键字段为 `COSPREAD_SESSIONID` 和 `SESSION`
- **Referer**：`-H 'referer: ...'` 中的值

> **Cookie 缓存**：如果同一会话中用户之前已经提供过 Cookie 且未过期（未返回 401），直接复用，不重复询问。

**步骤 4：批量下载图片**

创建目录 `PRD/images/{需求名称}/`，使用 curl 逐个下载图片：

```bash
# 对每张图片执行（可并行）：
curl -s -o 'PRD/images/{需求名称}/{序号}_{上下文描述}.png' \
  '{图片URL}&extraParams={encodedExtraParams}' \
  -b '{cookie}' \
  -H 'referer: https://office.netease.com/doc-editor/' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
```

图片命名规则：`{两位序号}_{上下文描述}.png`，例如：
- `01_首页MuseAI入口.png`
- `02_弹窗整体布局.png`
- `03_四视图生成配置.png`

下载完成后用 `file` 命令验证所有文件确实是有效图片（PNG/JPEG），确保没有 401 错误页面。

**步骤 5：更新 Markdown 中的图片引用**

将 PRD 的 `.md` 文件中所有 `office.netease.com` 开头的远程图片 URL 替换为本地相对路径：

```markdown
<!-- 替换前 -->
![描述](https://office.netease.com/api/admin/file/download?path=popo/2026/03/13/xxx.png)

<!-- 替换后 -->
![描述](images/{需求名称}/01_首页MuseAI入口.png)
```

**步骤 6：阅读图片加深需求理解（NON-NEGOTIABLE）**

下载完成后，**必须使用 Read 工具逐张读取所有图片**，结合文档文字内容理解需求：

1. 对每张图片执行 `Read` 读取（图片文件会作为附件返回，AI 可直接看到图片内容）
2. 结合图片上下文（图片在文档中的位置、前后文字描述），补充对需求的理解：
   - UI 原型图：理解页面布局、组件结构、交互元素
   - 流程图：理解业务流转关系
   - 交互稿：理解操作步骤、状态变化
3. 将图片中观察到的但文字未描述的细节，补充记录到 PRD 的 `.md` 文件对应章节中（以 `> 图片补充：...` 格式标注）

> **为什么必须读取图片**：POPO 文档中的图片通常是 UI 原型图和交互稿，包含了文字描述中未涵盖的视觉细节（如组件位置、颜色、间距、图标样式、空状态展示等）。不读取图片会导致后续开发时遗漏关键的 UI 实现细节。

##### 图片下载失败处理

- **401 Unauthorized**：Cookie 已过期，提示用户重新提供 curl 命令
- **部分图片下载失败**：记录失败的图片序号和 URL，告知用户哪些图片需要手动补充
- **用户拒绝提供 Cookie**：在 MD 中保留远程 URL，提醒用户图片无法离线查看，并在对话中说明"部分图片中的 UI 细节可能被遗漏，建议在开发过程中对照原文档确认"

### 3. 设计稿收集与验收基础设施搭建（NON-NEGOTIABLE）

> ⛔ **历史教训**：此步骤中的"自动触发阶段 0"曾被多次遗漏。以下流程为强制执行，禁止跳过任何子步骤。

需求分析完成后，必须询问设计稿信息：
1. "是否有设计稿？请提供设计稿地址"
2. 如果用户有设计稿：
   - 记录设计稿地址
   - **必须在同一回复中**自动触发 `design-qa-workflow` 的阶段 0，完成以下全部动作（缺一不可）：
     1. ✅ 调用 `mcp__getDsl` 读取 MasterGo DSL → 解析 layer 层级结构
     2. ✅ 创建 `design-specs/{需求名称}/` 目录
     3. ✅ 生成 `_manifest.json`（包含每个关键 layer 的名称、ID、期望文件名）
     4. ✅ 输出【截图清单】给用户，告知需要导出哪些截图、放到哪个目录
     5. ✅ 说明"截图可以现在准备，也可以在开发过程中随时补充，不阻塞开发启动"
   - **自检**：在 GATE-2 中确认阶段 0 的 5 项输出全部完成，任何一项标记 ❌ 则本轮内补齐
3. 如果用户没有设计稿：
   - 说明"未提供设计稿，以下实现基于需求描述推断"
   - 基于项目现有UI风格进行还原
   - 不触发验收基础设施搭建

### 4. 接口分析

基于需求内容，猜测可能需要用到的接口：
1. 分析需求中的功能模块
2. 识别可能需要的API接口
3. 用中文表达接口用途和大致参数
4. 向用户索要请求的执行方法名或URL：
   - "根据需求分析，可能需要以下接口："
   - "请提供相关接口的执行方法名或URL"

## 具体执行步骤

### 步骤1：确定工作流类型
```markdown
用户说"做需求" → 进入新需求流程
用户说"更新需求" → 进入更新需求流程
```

### 步骤2：确定需求来源（新需求流程关键步骤）

```markdown
用户提供了 POPO 文档 URL？
  ├─ YES → 启动 subagent（netease-codemaker/deepseek-chat）读取并分析文档
  │         → 写入 PRD/ 目录
  │         → 完成后简要告知用户"已保存到 PRD/xxx.md"
  │         → 打开文件展示给用户
  │         → 执行图片下载流程（步骤 2.5）
  │
  └─ NO  → 列出 PRD/ 目录下所有 .md 文件
           → 用 ask_user_question 让用户选择
           → 额外提供"提供 POPO 文档链接"选项
           → 用户选择文件 → read_file 读取内容
           → 用户选择提供链接 → 转入 YES 分支
```

### 步骤2.5：文档图片处理（NON-NEGOTIABLE）

在文档写入 PRD/ 后、询问设计稿之前，必须执行此步骤：

```markdown
文档 HTML 中是否包含 <img> 标签？
  ├─ YES → 提取所有图片 URL
  │         → 从文档 URL 解析 teamSpaceId / pageId → 拼接 extraParams
  │         → 检查当前会话是否已有可用的 Cookie
  │           ├─ 有 Cookie → 直接尝试下载
  │           └─ 无 Cookie → 向用户索要带 Cookie 的 curl 命令
  │         → 创建 PRD/images/{需求名称}/ 目录
  │         → 批量下载图片（curl + Cookie + extraParams）
  │         → 验证下载结果（file 命令检查）
  │         → 更新 .md 中的图片引用为本地相对路径
  │         → 逐张 Read 图片，结合上下文加深需求理解
  │         → 将图片中发现的额外细节补充到 .md
  │
  └─ NO  → 跳过，继续后续步骤
```

### 步骤3：询问设计稿（NON-NEGOTIABLE）
无论新需求还是更新需求，都必须询问：
```
是否有设计稿？请提供设计稿地址（MasterGo或其他设计工具链接）
```
- 有设计稿：记录地址，**必须在同一回复中触发 `design-qa-workflow` 阶段 0 并完成全部 5 项输出**（DSL → 目录 → _manifest.json → 截图清单 → 说明不阻塞开发）
- 无设计稿：说明基于需求推断

### 步骤4：接口分析
基于需求内容分析：
1. 识别功能模块（如：用户管理、作品上传、审核流程等）
2. 猜测需要的接口类型（GET/POST/PUT/DELETE）
3. 用中文描述接口用途
4. 询问具体接口信息

## 输出格式

### 需求文档输出（NON-NEGOTIABLE）
- **生成过程中禁止将具体文档内容输出到对话窗口**，直接写入文件即可
- 保存为Markdown文件到PRD目录
- 包含：版本迭代、需求背景、核心目标、业务流程、需求详情等章节
- **图片引用使用本地相对路径**：`![描述](images/{需求名称}/01_xxx.png)`，不保留远程 URL
- 文档末尾注明来源和整理时间
- **新文件**：写入完成后，打开文件展示给用户查看
- **更新文件**：写入完成后，展示 diff（使用 `replace_in_file` 的 SEARCH/REPLACE 格式或简明的新旧对比），让用户看到变更内容

### 图片资源输出
- 保存到 `PRD/images/{需求名称}/` 目录
- 命名格式：`{两位序号}_{中文上下文描述}.png`（如 `01_首页入口.png`、`02_弹窗整体布局.png`）
- 每张图片下载后需验证文件有效性（使用 `file` 命令确认是 PNG/JPEG）
- 下载结果汇总告知用户：共 N 张图片，成功 N 张，失败 N 张

### 差异分析报告（更新需求时）
- 使用 diff 格式展示变更，而非完整输出新文档
- 新增内容（标注 `+`）
- 修改内容（标注原内容 `-` 与新内容 `+`）
- 删除内容（标注 `-`）
- 总结变更影响

### 接口分析输出
```
根据需求分析，可能需要以下接口：

1. 作品上传接口
   - 用途：供应商上传作品
   - 方法：POST
   - 大致参数：作品信息、文件、标签等
   - 需要确认：具体的执行方法名或URL

2. 作品审核接口
   - 用途：商务组审核作品
   - 方法：PUT
   - 大致参数：作品ID、审核状态、审核理由
   - 需要确认：具体的执行方法名或URL

请提供相关接口的执行方法名或URL。
```

## 注意事项

1. **必须遵循 MUSE 素材资产管理平台规范**：参考项目中的 `muse-rule.mdc` 文件
2. **Token 处理**：Token 由网易内部 SSO 统一管理，业务代码无需介入
3. **请求封装**：使用 `src/OpenApiServices/` 中的服务方法，禁止裸用 `axios` / `fetch` 或直接调用 `src/utils/ajax.ts`
4. **UI组件**：使用 `@bedrock/components`（网易内部库），禁止引入 Ant Design 组件
5. **Subagent 模型**：需求分析的 subagent 固定使用 `netease-codemaker/deepseek-chat` 模型

## 示例对话

### 示例1：新需求（有 POPO 文档）
用户：做需求 https://docs.popo.netease.com/team/pc/artlib/pageDetail/869fe2e8c0ef4175b3f2151a52a0f0ad
AI：检测到 POPO 文档地址，正在启动需求分析...
AI：[启动 subagent（netease-codemaker/deepseek-chat）读取文档，整理为 Markdown，写入 PRD/xxx.md]
AI：已保存到 `PRD/3D角色生成需求文档.md`，请查看：[打开文件展示给用户]
AI：文档中包含 11 张图片（UI 原型图/交互稿），需要登录态才能下载。
    请从浏览器中复制一个图片请求的 curl 命令（Chrome DevTools → Network → 右键图片请求 → Copy as cURL），
    我将从中提取 Cookie 用于批量下载所有图片。
用户：curl 'https://office.netease.com/api/admin/file/download?path=...' -b 'COSPREAD_SESSIONID=xxx; SESSION=xxx' ...
AI：[提取 Cookie，批量下载 11 张图片到 PRD/images/3D角色生成/]
AI：已下载 11 张图片，全部验证通过。正在阅读图片内容...
AI：[逐张 Read 图片，结合文字补充理解]
AI：图片阅读完成，已将图片中的额外细节补充到需求文档。
AI：是否有设计稿？请提供设计稿地址
用户：有，MasterGo链接：xxx
AI：[记录设计稿地址]
AI：根据需求分析，可能需要以下接口：[接口分析]
AI：请提供相关接口的执行方法名或URL

### 示例2：新需求（无文档地址）
用户：做需求
AI：未检测到需求文档地址，PRD 目录下已有以下需求文档，请选择：
选项：
  - 供应商模块需求文档.md
  - 提供 POPO 文档链接
用户：供应商模块需求文档.md
AI：[读取 PRD/供应商模块需求文档.md 内容]
AI：已读取需求文档，基于文档内容继续分析...
AI：是否有设计稿？请提供设计稿地址
[后续步骤同示例1]

### 示例3：更新需求
用户：更新需求
AI：PRD目录中已有以下需求文档：
1. 供应商模块需求文档.md
请选择要更新的文档编号，或提供新的文档链接
用户：1
AI：请提供更新后的 POPO 文档 URL
用户：https://docs.popo.netease.com/xxx-updated
AI：[启动 subagent 读取新文档，更新写入文件]
AI：已更新 `PRD/供应商模块需求文档.md`，以下是变更 diff：
```diff
- 旧内容行
+ 新内容行
```
AI：是否有更新的设计稿？请提供设计稿地址
[后续步骤同示例1]

## 技能触发条件

当用户表达包含以下关键词时触发此技能：
- "做需求"
- "更新需求"
- "处理需求"
- "分析需求"
- "需求文档"
- "PRD"
- "需求分析"

即使用户没有明确说"做需求"，但上下文表明需要处理需求文档时，也应考虑使用此技能。
