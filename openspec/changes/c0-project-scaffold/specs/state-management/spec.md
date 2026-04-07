## ADDED Requirements

### Requirement: Zustand Store 按模块拆分
状态管理 SHALL 使用 Zustand，按功能模块拆分为独立 store slice：

| Store | 职责 |
|-------|------|
| useAuthStore | 登录状态、用户信息 |
| useChatStore | 会话列表、消息、当前会话 |
| useAgentStore | Agent 列表、当前选中 Agent |
| useSkillStore | Skill 列表 |
| useMCPStore | MCP 列表、状态 |
| useSettingsStore | 主题、Provider 配置 |

#### Scenario: Store 独立运作
- **WHEN** 某个 store 的状态更新
- **THEN** 仅订阅该 store 的组件重渲染，其他 store 的订阅者不受影响

### Requirement: Store 持久化
关键 store（auth、chat、agents、skills、settings） SHALL 通过 Zustand persist 中间件持久化到 localStorage。

#### Scenario: 刷新后状态恢复
- **WHEN** 用户刷新页面或重启应用
- **THEN** 持久化的 store 数据自动从 localStorage 恢复

#### Scenario: 版本迁移
- **WHEN** store 结构发生变化（如新增字段）
- **THEN** persist 中间件的 `version` 和 `migrate` 函数处理旧数据兼容
