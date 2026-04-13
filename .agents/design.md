# MUSE 设计系统

## 1. 视觉主题与氛围

MUSE 是网易内部的美术资源复用平台，专注于设计资产的统一管理与高效复用。平台采用**深色背景（#0F0C0F） + MUSE红（#EE192E）强调**的视觉风格，营造出沉浸、专注的创作环境。深色系降低视觉疲劳，让美术作品成为视觉焦点；红色强调色突出关键操作与品牌身份。

整体风格偏向专业创作工具——注重内容展示、操作效率与沉浸式体验。界面如同精心布置的画廊，深色墙壁让每一件美术作品发光。

**关键特征：**

- **深色背景为主**（#0F0C0F / #1B181A）——沉浸式创作空间，让作品成为焦点
- MUSE红（#EE192E / #E63042）作为唯一品牌强调色——用于 Logo、主要 CTA 和品牌元素
- PingFang SC 字体——简洁高效的中文字体
- 语义化色彩变量：text&icon-* / background-* / primary-* / fill-* / border-*
- 沉浸式布局——内容优先，减少视觉干扰
- 扁平化设计——用颜色对比区分层级，而非阴影

---

## 2. 色彩调色板与角色

### 主题模式

MUSE 支持 **Light** 和 **Dark** 两种主题模式，通过 Figma Variables 实现语义化色彩管理。

### 文字与图标 (text&icon-*)

| 变量名 | Light 模式 | Dark 模式 | 用途 |
|--------|------------|-----------|------|
| text&icon/1 | #081325 | #FFFFFF | 主要文字——最深 |
| text&icon/2 | #323F5B | rgba(255,255,255,0.75) | 次要文字 |
| text&icon/3 | #68768F | rgba(255,255,255,0.45) | 辅助文字 |
| text&icon/4 | #969FB2 | rgba(255,255,255,0.25) | 禁用/占位文字 |

### 背景色 (background-*)

| 变量名 | Light 模式 | Dark 模式 | 用途 |
|--------|------------|-----------|------|
| background/1 | #F0F1F2 | #0F0C0F | 页面背景 |
| background/2 | #FFFFFF | #1B181A | 卡片/容器背景 |
| background/3 | #F6F6FC | #221F22 | 次要区域背景 |
| background/4 | #FBFBFD | #312F32 | 悬浮/选中背景 |
| background/5 | #FFFFFF | #413F43 | 高亮容器背景 |

### 品牌主色 (primary-*)

| 变量名 | Light 模式 | Dark 模式 | 用途 |
|--------|------------|-----------|------|
| primary/1 | #EE192E | #E63042 | 主要品牌色——CTA、按钮 |
| primary/2 | #EC5158 | #FF505E | 次要强调色——图标、标签 |
| primary/3 | #CA1F30 | #D8203A | 深色强调——hover 状态 |
| primary/4 | #EE192E | rgba(230,48,66,0.5) | 半透明品牌色 |
| primary/5 | #FFE8E8 | rgba(230,48,66,0.2) | 浅色品牌填充 |
| primary/6 | #FABDC0 | rgba(230,48,66,0.1) | 极浅品牌填充 |
| primary/7 | #F69496 | rgba(230,48,66,0.3) | 品牌渐变过渡 |
| primary/8 | #FFE8E8 | rgba(230,48,66,0.6) | 品牌叠加层 |

### 填充色 (fill-*)

| 变量名 | Light 模式 | Dark 模式 | 用途 |
|--------|------------|-----------|------|
| fill/1 | #EEEFF7 | rgba(255,255,255,0.08) | 主要填充 |
| fill/2 | #E8EBF5 | rgba(255,255,255,0.12) | 次要填充 |
| fill/3 | #E4EAF7 | rgba(255,255,255,0.06) | 边框填充 |
| fill/4 | #F2F5FB | rgba(255,255,255,0.04) | 浅色填充 |

### 边框色 (border-*)

| 变量名 | Light 模式 | Dark 模式 | 用途 |
|--------|------------|-----------|------|
| border/1 | #C1C6D1 | rgba(255,255,255,0.12) | 默认边框 |
| border/2 | #DFE0E5 | rgba(255,255,255,0.08) | 浅色边框 |

---

## 3. 字体规则

### 字体家族

**主要字体：** PingFang SC

PingFang SC, -apple-system, system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif
```

### 字体字重

| 变量名 | 值 | 用途 |
|--------|-----|------|
| weight/light | Light | 轻量文字 |
| weight/regular | Regular | 正文文字 |
| weight/medium | Medium | 中等强调 |
| weight/bold | Bold | 标题、强调 |

### 字体层级

| 角色 | 字号 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| 展示标题 | 60px | 60px | Bold | 页面大标题 |
| 页面标题 | 35px | 40px | Bold | 章节标题 |
| 卡片标题 | 24px | 28px | Bold | 卡片/模块标题 |
| 副标题 | 22px | 26px | Medium | 次级标题 |
| 正文大 | 20px | 24px | Regular | 重要正文 |
| 正文 | 18px | 22px | Regular | 主要正文 |
| 正文小 | 16px | 20px | Regular | 标准正文 |
| 标签 | 14px | 18px | Regular | 标签、辅助文字 |
| 辅助 | 12px | 16px | Regular | 说明、提示文字 |

### 字号与行高对照表

| 字号 | 行高 |
|------|------|
| 12px | 16px |
| 14px | 18px |
| 16px | 20px |
| 18px | 22px |
| 20px | 24px |
| 22px | 26px |
| 24px | 28px |
| 35px | 40px |
| 60px | 60px |

### 字体原则

- **紧凑的字号范围：** 12px–60px，信息密度适中
- **清晰字重对比：** Bold 用于标题，Regular 用于正文，Light 用于辅助
- **中文字体优化：** 优先使用 PingFang SC 保证中文显示清晰
- **无需负字距：** 中文排版不需要负字距调整

---

## 4. 组件样式

### 按钮

**主要按钮（Primary）**
- 背景：primary/1 (#EE192E Light / #E63042 Dark)
- 文字：#FFFFFF（白色）
- 内边距：8px 16px
- 圆角：4px（轻微圆角）
- 字重：Medium
- Hover：primary/3 背景色

**次要按钮（Secondary）**
- 背景：transparent
- 边框：border/1
- 文字：text&icon/1
- 内边距：8px 16px
- 圆角：4px

**填充按钮**
- 背景：fill/1
- 文字：text&icon/2
- 内边距：8px 16px
- 圆角：4px

**文字按钮**
- 背景：transparent
- 文字：primary/1
- 无边框
- Hover：下划线或背景填充

**图标按钮**
- 背景：fill/1 或 transparent
- 图标色：text&icon/2
- 圆角：4px 或 50%（圆形）

### 输入框

**文本输入**
- 背景：background/2
- 边框：border/1
- 圆角：4px
- 内边距：10px 12px
- Focus：border 变为 primary/1，外发光

**搜索框**
- 背景：fill/1
- 边框：transparent
- 图标：text&icon/3
- 圆角：4px

### 卡片

- 背景：background/2
- 边框：border/2 或无
- 圆角：4px–8px
- 内边距：16px
- 悬浮：轻微阴影或 border/1 边框

### 标签/徽章

- 背景：fill/2 或 primary/5
- 文字：text&icon/2 或 primary/2
- 圆角：2px–4px
- 内边距：2px 8px

### 列表项

- 背景：transparent
- Hover：background/4
- 选中：background/3 + 左侧边框 primary/1
- 分隔线：border/2

---

## 5. 布局原则

### 间距系统

**基础单位：** 4px

**比例：** 4px、8px、12px、16px、20px、24px、32px、40px、48px、64px

### 布局网格

- **桌面端：** 固定宽度 1200px–1440px，居中布局
- **内容区：** 左侧导航 + 右侧内容区
- **栅格：** 12 列网格，间距 16px–24px

### 圆角比例

| 级别 | 数值 | 用途 |
|------|------|------|
| 小 | 2px | 标签、徽章 |
| 中 | 4px | 按钮、输入框、卡片 |
| 大 | 8px | 弹窗、面板 |
| 圆形 | 50% | 头像、图标按钮 |

### 阴影（谨慎使用）

| 级别 | 用途 |
|------|------|
| 无阴影 | 默认——扁平化设计 |
| 轻微 | 悬浮卡片、下拉菜单 |
| 中等 | 弹窗、模态框 |

---

## 6. 深度与提升

| 级别 | 状态 | 用途 |
|------|------|------|
| 平面 | 无阴影 | 默认状态 |
| 悬浮 | border/1 或轻微背景变化 | 交互反馈 |
| 选中 | primary/1 边框 | 选中状态 |
| 弹窗 | 中等阴影 | 模态框 |

**深度理念：** MUSE 采用扁平化设计理念，通过颜色对比和边框区分层级，而非阴影。信息密度高，界面简洁高效。

---

## 7. 注意事项

### ✅ 应该做的

- 使用语义化色彩变量——通过 text&icon-* / background-* / primary-* 引用
- 应用MUSE红（primary/1）于主要 CTA——品牌色，醒目可信
- 保持圆角一致——按钮/输入框 4px，卡片 8px
- 保持布局紧凑——工具型产品，信息密度优先
- 使用 PingFang SC 字体——保证中文清晰显示
- 遵循字号层级——60px→35px→24px→16px→12px

### ❌ 不应该做的

- 不要在非品牌场景使用 primary/1——保留给主要操作
- 不要使用过多样式——保持简洁专业
- 不要添加重阴影——扁平化设计
- 不要使用圆角过大——4px–8px 足够
- 不要混合多种字重——Bold 用于标题，Regular 用于正文
- 不要使用彩色文字——文字色只使用 text&icon 系列

---

## 8. 响应式断点

| 名称 | 宽度 | 布局调整 |
|------|------|----------|
| 移动端 | <768px | 单列布局，底部导航 |
| 平板 | 768–1024px | 双列网格，收起侧边栏 |
| 桌面 | 1024–1440px | 标准布局 |
| 大屏 | >1440px | 扩展内容区 |

---

## 9. 组件开发指南

### 快速颜色参考

| 类别 | Light 模式 | Dark 模式 |
|------|------------|-----------|
| 主要 CTA | primary/1 (#EE192E) | primary/1 (#E63042) |
| 页面背景 | background/1 (#F0F1F2) | background/1 (#0F0C0F) |
| 卡片背景 | background/2 (#FFFFFF) | background/2 (#1B181A) |
| 主要文字 | text&icon/1 (#081325) | text&icon/1 (#FFFFFF) |
| 次要文字 | text&icon/3 (#68768F) | text&icon/3 (75%) |
| 边框 | border/1 (#C1C6D1) | border/1 (12%) |
| 填充 | fill/1 (#EEEFF7) | fill/1 (8%) |

### CSS 变量映射

```css
:root {
  /* 文字与图标 */
  --text-icon-1: #081325;
  --text-icon-2: #323F5B;
  --text-icon-3: #68768F;
  --text-icon-4: #969FB2;
  
  /* 背景色 */
  --background-1: #F0F1F2;
  --background-2: #FFFFFF;
  --background-3: #F6F6FC;
  --background-4: #FBFBFD;
  --background-5: #FFFFFF;
  
  /* 品牌主色 */
  --primary-1: #EE192E;
  --primary-2: #EC5158;
  --primary-3: #CA1F30;
  --primary-5: #FFE8E8;
  
  /* 填充色 */
  --fill-1: #EEEFF7;
  --fill-2: #E8EBF5;
  
  /* 边框色 */
  --border-1: #C1C6D1;
  --border-2: #DFE0E5;
}
```

### 组件提示示例

**"创建按钮：primary/1 背景，白色文字，4px 圆角，Medium 字重。"**

**"设计卡片：background/2 背景，4px 圆角，border/2 边框，16px 内边距。"**

**"构建输入框：background/2 背景，border/1 边框，4px 圆角，10px 12px 内边距。Focus 状态：border 变 primary/1。"**

**"设计标签：fill/2 背景，primary/2 文字，2px 圆角。"**

**"创建列表项：transparent 背景。Hover：background/4。选中：左侧 2px primary/1 边框。"**

### 迭代指南

- MUSE红用于主要 CTA——品牌色，醒目可信
- 4px 圆角——按钮、输入框、卡片
- 扁平化设计——用颜色对比而非阴影区分层级
- PingFang SC 是唯一字体——保证中文清晰
- 信息密度优先——工具型产品，追求效率
