---
name: project-knowledge
description: 查阅和管理项目知识库（.codemaker/knowledge/）。遇到需猜测的项目名词/约定时必须查阅；用户补充新知识时写入。
---

# Project Knowledge — 项目知识库管理

## 知识库目录结构

```
.codemaker/knowledge/
├── 01-glossary.md              # 名词与概念（APC、MUSE、供应商编码等）
├── 02-component-conventions.md  # 组件使用约定（什么场景用什么组件）
├── 03-business-rules.md         # 业务习惯（排序规则、审核逻辑等）
├── 04-dev-habits.md             # 开发习惯（编码模式、偏好）
└── 05-pitfalls.md               # 踩坑记录（问题 + 解决方案）
```

## 两种模式

### 模式 A：查阅（Lookup）

当 AI 在开发过程中遇到不确定的项目特定内容时：

1. **识别需要查阅的分类**：根据不确定内容的类型，确定应查阅哪个文件
   - 名词/概念不明 → `01-glossary.md`
   - 不确定用什么组件 → `02-component-conventions.md`
   - 不确定业务逻辑 → `03-business-rules.md`
   - 不确定编码模式 → `04-dev-habits.md`
   - 疑似踩过的坑 → `05-pitfalls.md`

2. **读取对应文件**：使用 `read_file` 读取

3. **判断结果**：
   - **找到记录** → 按记录执行，无需询问用户
   - **未找到记录** → 向用户提问确认，确认后触发**写入模式**将新信息补充进去

### 模式 B：写入（Update）

当用户在对话中补充了新信息时：

1. **识别信息分类**：判断应写入哪个文件
   - 新的名词/概念解释 → `01-glossary.md`
   - 新的组件使用约定 → `02-component-conventions.md`
   - 新的业务规则/逻辑 → `03-business-rules.md`
   - 新的编码习惯/偏好 → `04-dev-habits.md`
   - 新的踩坑经验 → `05-pitfalls.md`

2. **追加到对应文件**：使用 `replace_in_file` 在表格末尾追加新行

3. **更新时间戳**：将文件末尾的 `*最后更新：xxxx-xx-xx*` 更新为当天日期

4. **确认回报**：告知用户"已更新到 `{文件路径}`"

## 写入格式规范

每个分类文件使用 Markdown 表格格式。追加新行时：

- **01-glossary.md**：`| 名词 | 解释 | 备注 |`
- **02-component-conventions.md**：`| 场景 | 使用组件 | 备注 |`
- **03-business-rules.md**：`| 场景 | 约定 | 备注 |`
- **04-dev-habits.md**：`| 场景 | 约定 | 备注 |`
- **05-pitfalls.md**：`| 日期 | 问题描述 | 解决方案 |`

## 主动触发原则

AI 应在以下场景**主动触发**此 Skill，而非等用户明确要求：

1. 用户在对话中随口解释了一个项目名词（如"APC 单号就是…"）→ 主动写入 `01-glossary.md`
2. 用户纠正了 AI 的组件选择（如"这里别用 Table，用 XXX"）→ 主动写入 `02-component-conventions.md`
3. 用户指出了一个业务规则（如"禁用的供应商作品不展示"）→ 主动写入 `03-business-rules.md`
4. 用户指出了编码偏好（如"我们项目里 XXX 都这样写"）→ 主动写入 `04-dev-habits.md`
5. 开发中踩坑解决后 → 主动写入 `05-pitfalls.md`
