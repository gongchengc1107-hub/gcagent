---
name: design-qa-workflow
description: 设计稿验收工作流。对比实现页面与设计稿确保 UI 还原度。用户说"验收设计稿"/"检查还原度"时触发。
compatibility:
  tools:
    - use_mcp_tool
    - read_file
    - list_files_recursive
    - list_files_top_level
    - ask_user_question
    - run_terminal_cmd
    - edit_file
    - grep_search
---

# 设计稿验收工作流（Design QA Workflow）

## 概述

本 skill 提供标准化的设计稿还原验收流程，通过 MasterGo MCP 读取设计规范、Chrome DevTools MCP 检查实现页面，实现接近 99% 的自动化 UI 验收。

核心原则：**尽早准备、边做边验、降级容错**。

---

## 验收分级定义

| 级别 | 条件 | 验收方式 | 覆盖能力 |
|------|------|---------|---------|
| **A 级（完整验收）** | 有设计截图 + DSL | 视觉对比 + 属性审计 + 交互态验收 | ~99% |
| **B 级（降级验收）** | 仅有 DSL，无截图 | computed style vs DSL 属性审计 + 结构比对 | ~80% |

---

## 约定

### 目录结构

```
design-specs/
├── {需求名称}/
│   ├── _manifest.json          ← AI 自动生成
│   ├── 页面整体.png            ← 用户按清单导出
│   ├── 组件A.png
│   ├── 组件A--hover.png        ← 交互态用 -- 分隔
│   └── ...
```

### 截图规范

- **倍率**：1x（与浏览器默认一致）
- **视口宽度**：不固定，从设计稿 DSL 中读取
- **命名**：使用 MasterGo 中的 layer 名称
- **交互态命名**：`{layer名}--{状态}.png`，如 `按钮--hover.png`、`输入框--focus.png`
- **格式**：PNG

### 容差标准

- **标准模式**（默认）：允许 1-2px 数值偏差
- 颜色值允许 RGB 各通道 ±2 的偏差

---

## ⛔ 阶段 0 强制门控（NON-NEGOTIABLE）

> **历史教训**：阶段 0 曾被多次遗漏，导致开发阶段缺少截图清单和验收依据。以下为最高优先级约束。

**当用户提供了 MasterGo 设计稿链接时，必须在当前回复中完成以下全部动作，缺一不可：**

1. ✅ 调用 `mcp__getDsl` 读取设计稿 DSL
2. ✅ 创建 `design-specs/{需求名称}/` 目录
3. ✅ 生成 `_manifest.json`（包含 layer 列表、期望文件名、验收状态）
4. ✅ 向用户输出【截图清单】（列出每张截图的文件名、对应 layer、所属模块）
5. ✅ 说明"截图可现在准备也可随时补充，不阻塞开发"

### 检查点（其他 skill 调用本 skill 时的交叉校验）

| 检查时机 | 检查内容 | 失败处理 |
|---------|---------|---------|
| `需求分析工作流` 步骤 3 完成后 | 用户提供了设计稿？ → 是 → 阶段 0 是否已执行？ | 未执行 → **立即补执行**，不进入下一步 |
| `large-requirement-workflow` 阶段 1 启动前 | `design-specs/` 目录是否存在？`_manifest.json` 是否生成？ | 不存在 → 询问用户是否有设计稿，有则补执行阶段 0 |
| GATE-2 自检时 | 本轮是否涉及设计稿链接？ → 是 → 阶段 0 是否完成？ | 未完成 → 标记 ❌，本轮内补齐 |

### 自动触发关键词

以下任何一种情况出现时，必须触发阶段 0：
- 用户提供了 MasterGo 链接（URL 包含 `mastergo`）
- 用户说"设计稿在这里"、"这是设计稿"
- `需求分析工作流` 的步骤 3 识别到设计稿地址
- `large-requirement-workflow` 前置条件检查中发现已有设计稿地址但未建基础设施

---

## 阶段 0：搭建验收基础设施

### 触发时机

- 需求分析完成后，用户提供了 MasterGo 设计稿链接时
- 用户说"准备验收资料"、"生成截图清单"时
- IMPLEMENT 阶段开始前，自动检查并触发

### 执行步骤

#### Step 0.1：读取设计稿 DSL

使用 MasterGo MCP 的 `mcp__getDsl` 工具读取设计稿：

```
输入：设计稿链接（shortLink）或 fileId + layerId
输出：DSL JSON 数据
```

从 DSL 中提取：
- 所有 layer 的名称和层级结构
- 页面/画板的宽高（作为视口尺寸参考）
- 关键设计 token（颜色、字号、间距、圆角等）

#### Step 0.2：创建目录和 _manifest.json

1. 创建 `design-specs/{需求名称}/` 目录
2. 分析 DSL 层级结构，识别"关键验收层"：
   - **页面级**：顶层画板/Frame
   - **组件级**：独立的 UI 组件（卡片、表单、弹窗、表格行等）
   - **状态级**：如果 DSL 中存在多个变体（Variants），标记需要截图的状态
3. 生成 `_manifest.json`：

```json
{
  "designLink": "https://mastergo.com/goto/xxx",
  "fileId": "xxx",
  "layerId": "xxx",
  "viewportWidth": 1440,
  "viewportHeight": 900,
  "screenshotScale": "1x",
  "tolerance": "standard",
  "layers": [
    {
      "name": "需求列表页",
      "layerId": "layer_001",
      "type": "page",
      "expectedFile": "需求列表页.png",
      "status": "pending",
      "qaLevel": null
    },
    {
      "name": "筛选栏",
      "layerId": "layer_002",
      "type": "component",
      "expectedFile": "筛选栏.png",
      "status": "pending",
      "qaLevel": null
    },
    {
      "name": "需求卡片",
      "layerId": "layer_003",
      "type": "component",
      "expectedFile": "需求卡片.png",
      "status": "pending",
      "qaLevel": null,
      "interactionStates": [
        {
          "state": "hover",
          "expectedFile": "需求卡片--hover.png",
          "status": "pending"
        }
      ]
    }
  ],
  "generatedAt": "2024-xx-xx"
}
```

> `status` 字段取值：`pending`（待截图）、`ready`（截图已就位）、`skipped`（用户跳过，降级为 B 级）

#### Step 0.3：输出截图清单

向用户输出结构化清单：

```markdown
📋 截图清单（共 N 张）
目标目录：design-specs/{需求名称}/

请在 MasterGo 中导出以下 layer 的 1x PNG 截图，放到上述目录：

  ① 需求列表页.png          ← layer: 需求列表页（页面级）
  ② 筛选栏.png              ← layer: 筛选栏（组件级）
  ③ 需求卡片.png            ← layer: 需求卡片（组件级）
  ④ 需求卡片--hover.png     ← layer: 需求卡片 hover 态（交互态）
  ⑤ 空状态.png              ← layer: 空状态（状态级）

完成后告诉我"截图准备好了"，我会自动校验完整性。
```

#### Step 0.4：校验截图完整性

用户说"截图准备好了"后：

1. 扫描 `design-specs/{需求名称}/` 目录
2. 与 `_manifest.json` 中的 `expectedFile` 逐一比对
3. 处理结果：

```
所有文件齐全 → 全部标记为 status: "ready"，qaLevel: "A"
                → 输出："✅ 资料齐全，所有 layer 将执行 A 级验收"

部分文件缺失 → 第一次提醒：
                "以下截图缺失，是否需要补充？"
                - ❌ 筛选栏.png
                - ❌ 需求卡片--hover.png
                
                用户回应：
                ├── 补充了 → 重新扫描，标记为 "ready"，qaLevel: "A"
                └── "跳过" / "不提供" → 标记为 status: "skipped"，qaLevel: "B"
                    → 输出："⚠️ 以下 layer 将降级为 B 级验收：筛选栏、需求卡片 hover 态"
                    → 不再追问，继续流程
```

> **只提醒一次，不反复追问。用户说跳过就跳过。**

---

## 阶段 1：边开发边验收

### 触发时机

在 IMPLEMENT 阶段，每完成一个 UI 相关的 task 后自动触发。

### 执行步骤

#### Step 1.1：判断验收级别

根据 `_manifest.json` 中该 layer 的 `qaLevel` 决定：
- `qaLevel: "A"` → 执行完整验收（视觉对比 + 属性审计）
- `qaLevel: "B"` → 执行降级验收（仅属性审计）
- `_manifest.json` 不存在 → 仅做基本属性审计

#### Step 1.2：A 级验收（完整）

1. **设置视口**：使用 Chrome DevTools MCP 的 `resize_page`，设置为 `_manifest.json` 中记录的视口尺寸
2. **页面截图**：使用 `take_screenshot` 截取当前实现页面
3. **读取设计截图**：使用 `read_file` 读取 `design-specs/{需求名称}/{layer名}.png`
4. **视觉对比**：
   - 对比两张图，识别布局差异、颜色差异、间距差异、字体差异
   - 如果差异较大，可使用 `evaluate_script` 在浏览器中执行 Canvas 像素级 Diff
5. **属性审计**：使用 `evaluate_script` 检查关键元素的 computed style：
   ```javascript
   // 示例：批量提取元素样式
   (elements) => {
     return elements.map(el => {
       const style = getComputedStyle(el);
       return {
         fontSize: style.fontSize,
         color: style.color,
         padding: style.padding,
         margin: style.margin,
         borderRadius: style.borderRadius,
         backgroundColor: style.backgroundColor,
         fontWeight: style.fontWeight,
         lineHeight: style.lineHeight,
         gap: style.gap
       };
     });
   }
   ```
6. **对比 DSL 数值**：将 computed style 与 MasterGo DSL 中的设计值比对，允许标准容差

#### Step 1.3：B 级验收（降级）

仅执行 Step 1.2 中的第 5-6 步（属性审计 + DSL 对比），跳过视觉截图对比。

#### Step 1.4：输出单次验收结果

```markdown
🔍 验收结果：{layer名}（{A级/B级}）

✅ 通过项：
- 字号：设计 14px → 实际 14px ✓
- 颜色：设计 #333333 → 实际 rgb(51,51,51) ✓
- 圆角：设计 8px → 实际 8px ✓

⚠️ 偏差项（在容差内）：
- 间距：设计 16px → 实际 17px（偏差 1px，容差内）

❌ 未通过项：
- 背景色：设计 #F5F5F5 → 实际 #FFFFFF（差异过大）
- 行高：设计 22px → 实际 20px（偏差 2px，超出容差）

→ 需修复 2 项，修复后自动重新验收
```

如果有未通过项，**立即修复 → 再验一轮**，直到全部通过或用户手动确认跳过。

---

## 阶段 2：整体验收

### 触发时机

- 所有 UI task 实现完毕后
- 用户说"整体验收"、"最终验收"时

### 执行步骤

1. **整页截图** vs **整页设计截图**（如有）
2. **逐 layer 汇总**：收集阶段 1 中所有验收结果
3. **交互态补充验收**：
   - 使用 `hover`、`click`、`fill` 等工具模拟交互
   - 对每个交互态截图并对比
4. **生成验收报告**

### 验收报告格式

```markdown
# 设计验收报告

**需求名称**: {需求名称}
**设计稿链接**: {MasterGo链接}
**验收时间**: {datetime}
**视口尺寸**: {width}×{height}

---

## 总览

| 指标 | 数值 |
|------|------|
| 总验收项 | N |
| A 级验收 | N（通过 N，未通过 N） |
| B 级验收 | N（通过 N，未通过 N） |
| 整体通过率 | XX% |

---

## 逐项结果

### ✅ 需求列表页（A级验收 - 通过）
- 视觉对比：一致
- 属性审计：全部通过（12/12）

### ✅ 筛选栏（A级验收 - 通过）
- 视觉对比：一致
- 属性审计：全部通过（8/8）

### ⚠️ 需求卡片（A级验收 - 通过，有容差内偏差）
- 视觉对比：基本一致
- 属性审计：通过 6/7，1 项容差内偏差
- 偏差详情：padding-right 设计 16px → 实际 15px

### ⚠️ 分页器（B级验收 - 通过，无设计截图）
- 属性审计：全部通过（5/5）
- 备注：未提供设计截图，仅做属性级别验收

---

## 未覆盖项（需人工确认）

- [ ] 动画缓动曲线
- [ ] 跨浏览器兼容性
- [ ] 真实设备字体渲染
```

---

## 与其他流程的衔接

### 与「需求分析工作流」的衔接

需求分析工作流的 **步骤 3（设计稿收集）** 完成后：
- 如果用户提供了 MasterGo 链接 → **自动触发阶段 0**（搭建验收基础设施）
- 生成截图清单后，告知用户在开发开始前准备好截图
- 截图可以在开发过程中随时补充，不阻塞开发启动

### 与「openspec-implement-change」的衔接

在 IMPLEMENT 阶段的 **Step 2（逐任务实现）** 中：
- 每完成一个 UI 相关任务 → 自动触发阶段 1（边开发边验收）
- 验收结果作为任务完成的附加信息记录
- 验收未通过项在修复后重新验收，确认通过后才勾选 `[x]`

### 与「openspec-verify-change」的衔接

在 VERIFY 阶段：
- 如果存在 `design-specs/{需求名称}/` → 触发阶段 2（整体验收）
- 验收报告作为 `verify.md` 的一部分或附件
- 整体通过率纳入完成报告

---

## 异常处理

### design-specs 目录不存在

说明未执行阶段 0，询问用户：
- "未找到设计验收资料，是否有设计稿？提供 MasterGo 链接我来准备验收基础设施"

### MasterGo DSL 读取失败

- 告知用户 DSL 读取失败的原因
- 降级为仅依赖设计截图的视觉对比模式
- 如果截图也没有，仅做基本的 CSS 合理性检查

### 浏览器页面无法访问

- 提示用户确认开发服务器是否启动
- 提供启动命令建议

---

## 注意事项

1. **截图只提醒一次**：缺失截图提醒用户后，用户说跳过则降级，不反复追问
2. **不阻塞开发**：截图准备不是开发启动的前置条件，可以边开发边补充
3. **验收结果可追溯**：_manifest.json 中记录每个 layer 的验收状态和级别
4. **容差合理**：标准模式允许 1-2px 偏差，避免因亚像素渲染差异产生大量误报
5. **视觉对比是辅助**：AI 的视觉判断不如像素级算法精确，对比结果仅作参考，属性审计为主要依据
6. **⛔ 阶段 0 禁止跳过或延后**：收到设计稿链接后必须在同一回复中完成 DSL 读取 → 目录创建 → _manifest.json → 截图清单输出。仅读取 DSL 到内存而不落盘不算完成（`读取 ≠ 交付`）
