## ADDED Requirements

### Requirement: 端到端功能验收
系统 SHALL 通过以下端到端验收路径。

#### Scenario: 登录 → 聊天
- **WHEN** 用户启动应用
- **THEN** 展示登录页 → 扫码/手动登录 → 进入聊天页 → 创建会话 → 发送消息 → 收到 AI 流式回复

#### Scenario: 聊天高级功能
- **THEN** 工具调用展示正常、消息复制/重新生成正常、会话右键菜单（重命名/导出/删除）正常

#### Scenario: Agent 管理
- **THEN** Agent 列表展示 → 创建 Agent → 编辑 Agent → 在聊天页切换 Agent → 删除 Agent

#### Scenario: Skill 管理
- **THEN** Skill 列表展示 → 安装 Skill → 编辑 Skill → 启用/禁用 → 删除 Skill

#### Scenario: MCP 管理
- **THEN** MCP 列表展示 → 智能安装 → 手动添加 → 模板预填 → 启用/禁用 → 编辑 → 删除

#### Scenario: 设置页
- **THEN** 账户设置 → Provider 切换 → 消耗统计 → 主题切换 → 数据清空

#### Scenario: 主题一致性
- **THEN** 所有页面在浅色/深色主题下视觉正确，无颜色错乱

#### Scenario: 打包验证
- **THEN** `npm run build` 成功生成 .dmg → 安装后应用正常启动 → 所有功能可用
