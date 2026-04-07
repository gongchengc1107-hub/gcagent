# 开发习惯

> 本文件记录团队的开发习惯、偏好设置和约定俗成的做法。AI 在编码时应尊重这些习惯。

## 编码风格偏好

- 优先使用 `useMemoizedFn`（ahooks）代替 `useCallback`
- 样式优先使用 Tailwind CSS，复杂场景使用 styled-components
- `import from 'lodash'`（alias 自动映射到 lodash-es）
- 日期处理统一使用 dayjs

## 常用命令

| 命令 | 用途 | 备注 |
|------|------|------|
| `pnpm api:genapi` | 从 OpenAPI 文档生成接口定义文件 | 执行前需在 `genapi.js` 中配置目标环境地址 |

## Git 习惯

- 分支策略：master（测试环境）、production（生产环境）
- commit 信息遵循 Conventional Commits
- 关联易协作单时格式：`feat: refs #单号 单名`

### Commit Message 格式规范

使用多个 `-m` 参数分行，首行为标题，第二个 `-m` 为正文（含变更清单）：

```bash
git commit \
  -m "feat: refs #单号 【易协作单名】- 简要概括" \
  -m "- 变更点1
- 变更点2
- 变更点3"
```

**要求：**
- 首行：`类型: refs #单号 单名 - 一句话概括`
- 正文：用 `-` 清单列出本次提交的关键变更点，每项一行，简短但能让人快速了解做了什么
- 不需要过于详细，但要覆盖主要变更内容
- 无易协作单时省略 `refs #单号 单名` 部分

## 踩坑经验

（待补充）
