## ADDED Requirements

### Requirement: 账户信息展示
账户设置页 SHALL 展示当前登录用户的基本信息。

#### Scenario: 正常展示
- **WHEN** 用户进入账户设置页
- **THEN** 展示用户信息卡片：圆形头像、用户名、网易内部邮箱

### Requirement: 退出登录
账户设置页 SHALL 提供退出登录功能。

#### Scenario: 点击退出登录
- **WHEN** 用户点击 "退出登录" 按钮
- **THEN** 弹出确认弹窗，标题 "退出登录"，描述 "退出后本地登录状态将被清除，下次使用需重新登录。"

#### Scenario: 确认退出
- **WHEN** 用户在确认弹窗中点击 "确认退出"
- **THEN** 调用 useAuthStore.logout()，清除登录状态，跳转回登录页

#### Scenario: 取消退出
- **WHEN** 用户在确认弹窗中点击 "取消"
- **THEN** 关闭弹窗，不做任何操作
