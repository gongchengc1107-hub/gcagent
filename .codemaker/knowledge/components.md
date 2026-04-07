# 组件约定

> 本文件记录项目中常用组件的使用约定、注意事项和最佳实践。AI 在使用或创建组件时应先查阅此文件。

## Bedrock 组件注意事项

| 组件 | 注意事项 |
|------|---------|
| `Select` | 实际通过 BedrockComponentsProxy 指向 PMSelect（带性能监控），使用方式不变 |
| `Message` | 使用 `Message.success()` / `Message.error()` 等静态方法，禁止使用 antd 的 message |
| `Form` | 使用 Bedrock 的 Form，非 antd Form |

## 踩坑记录

（待补充）
