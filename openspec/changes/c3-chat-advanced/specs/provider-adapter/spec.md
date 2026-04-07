## ADDED Requirements

### Requirement: 双 Provider 模式适配
聊天系统 SHALL 支持两种 AI 接入模式，在消息发送层根据当前 Provider 模式选择不同的请求策略。

#### Scenario: Codemaker 模式发送消息
- **WHEN** 当前 Provider 为 Codemaker 模式，用户发送消息
- **THEN** 通过 REST + SSE 对接 `127.0.0.1:4000`（Mock 阶段模拟）

#### Scenario: 直连模式发送消息
- **WHEN** 当前 Provider 为直连模式，用户发送消息
- **THEN** 通过 OpenAI 兼容接口对接用户配置的 API Base URL（Mock 阶段模拟）

### Requirement: Provider 适配器抽象
系统 SHALL 抽象 ChatProvider 接口，两种模式各自实现，业务层不感知底层差异。

#### Scenario: 切换 Provider 后发送消息
- **WHEN** 用户在设置页切换了 Provider 模式后回到聊天页
- **THEN** 下一次消息发送自动使用新 Provider，无需刷新页面
