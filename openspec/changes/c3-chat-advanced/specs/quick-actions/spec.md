## ADDED Requirements

### Requirement: AI 快捷选项按钮
AI 回复完成后 SHALL 自动识别回复末尾的列表项，生成可点击的快捷选项按钮。

#### Scenario: 列表项识别为快捷选项
- **WHEN** AI 回复末尾包含有序或无序列表（如 `- 选项A` 或 `1. 选项A`）
- **THEN** 在 AI 回复下方生成对应的按钮，每个列表项一个按钮

#### Scenario: 点击快捷选项
- **WHEN** 用户点击某个快捷选项按钮
- **THEN** 等同于用户输入该按钮文本并发送消息

#### Scenario: 列表项超过 5 个
- **WHEN** AI 回复末尾列表项超过 5 个
- **THEN** 仅显示前 5 个快捷选项按钮

#### Scenario: 非列表结尾不生成
- **WHEN** AI 回复末尾不是列表格式
- **THEN** 不显示快捷选项按钮

### Requirement: 快捷选项仅在最新回复显示
快捷选项按钮 SHALL 仅显示在当前会话最新的 AI 回复下方。

#### Scenario: 新回复后旧选项消失
- **WHEN** AI 生成了新的回复
- **THEN** 上一条 AI 回复的快捷选项按钮隐藏
