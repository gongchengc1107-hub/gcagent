## ADDED Requirements

### Requirement: 登录页布局
登录页 SHALL 使用全屏居中布局，包含品牌 Logo、产品名称（"Codemaker Dashboard"）、产品描述（一行副标题）和一个"登录"按钮。不显示全局侧边栏。

#### Scenario: 登录页正常渲染
- **WHEN** 未登录用户访问应用
- **THEN** 展示全屏居中的登录页，包含 Logo、标题、副标题和登录按钮

#### Scenario: 登录页深色主题适配
- **WHEN** 当前为深色主题
- **THEN** 登录页背景和卡片样式切换为深色版本

### Requirement: 一键登录
用户点击"登录"按钮 SHALL 完成本地模拟登录，生成模拟用户信息并持久化。

#### Scenario: 登录成功
- **WHEN** 用户点击"登录"按钮
- **THEN** 系统生成模拟用户（name: "Codemaker Developer", avatar: 默认头像），写入 useAuthStore，跳转到 /chat

#### Scenario: 登录过程中按钮状态
- **WHEN** 用户点击"登录"按钮
- **THEN** 按钮显示 loading 状态（模拟 500ms 延迟），防止重复点击

### Requirement: 登录失败处理
登录过程中若发生异常 SHALL 展示错误提示并允许重试。

#### Scenario: 登录异常
- **WHEN** 登录过程中 localStorage 写入失败
- **THEN** 页面展示错误提示信息，登录按钮恢复可点击状态

### Requirement: 登录态持久化
登录状态 SHALL 持久化到 localStorage，应用重启后自动恢复。

#### Scenario: 重启后自动登录
- **WHEN** 用户已登录并关闭应用后再次打开
- **THEN** 自动跳转到 /chat，不显示登录页

### Requirement: 退出登录
用户 SHALL 可以在设置页退出登录，退出前需二次确认。

#### Scenario: 确认退出
- **WHEN** 用户在设置页点击"退出登录"并确认
- **THEN** 清除 useAuthStore 中的登录态，跳转到 /login

#### Scenario: 取消退出
- **WHEN** 用户点击"退出登录"后在确认弹窗中点击"取消"
- **THEN** 关闭弹窗，保持当前状态不变
