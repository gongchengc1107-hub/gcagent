## Context

useSkillStore 已在 C0 中创建骨架。C3 的 `/` 命令菜单和 C4 的 Agent Skills 关联都依赖 Skill 数据。C5 实现完整的 Skills 管理页面和数据层。

PRD 要求 Skill 数据持久化在磁盘 `opencode/skills/*.md` 中，手动修改磁盘文件后重启应用可加载变更。Skill 触发词为注入系统提示词的关键字符串。

## Goals / Non-Goals

**Goals:**

- 实现完整的 Skills 管理页（列表 + 安装 + 编辑 + 删除）
- 三种安装方式均可用
- Skill 启用/禁用状态影响 `/` 命令菜单和 Agent 关联
- 磁盘持久化与界面双向同步

**Non-Goals:**

- 不实现 Skill 的实际执行逻辑（由 AI 消费系统提示词）
- 不实现 Skill Hub 平台本身（仅提供跳转入口）
- 不实现 Skill 版本管理

## Decisions

### D1: Skill 列表页布局

**选择**：表格式列表（非卡片），每行显示 Skill 名称、描述、标签、启用开关和操作按钮

**理由**：
- Skill 数量可能较多，表格比卡片信息密度更高
- 每行关键信息一目了然：名称 | 描述 | 标签 | 启用/禁用 | 操作
- 使用 Ant Design Table 组件，支持分页（如需要）
- 页面顶部：标题 + "安装 Skill" 按钮 + Skill Hub 链接入口

### D2: Skill 数据结构

**选择**：

```typescript
interface Skill {
  id: string;
  name: string;           // Skill 名称
  description: string;    // 简短描述
  readme: string;         // 说明文档（Markdown）
  tags: string[];         // 标签列表
  triggers: string[];     // 触发词列表
  enabled: boolean;       // 是否启用
  createdAt: number;
  updatedAt: number;
}
```

**理由**：
- `triggers` 数组支持多个触发词
- `readme` 存储完整的 Markdown 说明文档
- `enabled` 控制是否在 `/` 命令菜单中出现
- `tags` 用于分类展示

### D3: 安装方式实现

**选择**：统一使用 Ant Design Modal 弹窗，内含 Tabs 切换三种安装方式

**理由**：
- **命令安装**：输入框粘贴 shell 命令，通过 Electron IPC 执行，解析输出提取 Skill 信息
- **上传文件**：Ant Design Upload 组件，上传 `.md` 文件，解析 frontmatter 提取配置
- **手动填写**：表单逐项输入（名称、描述、说明文档、标签、触发词）
- 三种方式共享同一个安装结果处理逻辑：写入 useSkillStore + 持久化到磁盘

### D4: 磁盘持久化方案

**选择**：Skill 数据双向同步磁盘 `opencode/skills/*.md`

**理由**：
- 文件格式：YAML frontmatter（name, description, tags, triggers, enabled）+ Markdown body（readme）
- 创建/编辑/删除 Skill 时同步写入磁盘文件
- 应用启动时从磁盘读取 Skill 文件，与 useSkillStore 合并
- 文件名：`{skill-id}.md`（kebab-case）
- 通过 Electron IPC 调用主进程 fs 模块操作文件

### D5: Skill Hub 入口

**选择**：页面顶部放置 "Skill Hub" 外部链接按钮，点击调用 Electron shell.openExternal 打开浏览器

**理由**：
- 跳转到 `https://skills.netease.com`
- 不在应用内嵌入 webview
- 按钮样式：次要按钮 + 外部链接图标

## Risks / Trade-offs

- **[Risk] 命令安装执行任意 shell 命令存在安全风险** → 缓解：内部工具，信任用户输入；执行前显示命令预览，用户确认后执行
- **[Risk] 磁盘文件被外部修改导致数据不一致** → 缓解：每次进入 Skills 页重新从磁盘同步
- **[Trade-off] 文件名用 skill-id 而非 skill-name** → 避免中文文件名兼容性问题
