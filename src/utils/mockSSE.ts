/**
 * Mock SSE 流式输出服务
 * 模拟 AI 回复的逐字输出效果，支持工具调用模拟
 */

import type { ToolCall } from '@/types'

/** Mock 工具调用数据 */
const MOCK_TOOL_CALLS: Omit<ToolCall, 'id' | 'status'>[] = [
  {
    toolName: 'web_search',
    params: { query: 'React 18 新特性' },
    result: '找到 15 条相关结果...',
    duration: 1200
  },
  {
    toolName: 'read_file',
    params: { path: '/src/App.tsx' },
    result: 'import React from "react";\n...',
    duration: 350
  },
  {
    toolName: 'run_command',
    params: { command: 'npm run build' },
    result: 'Build completed successfully.\n2 warnings.',
    duration: 5600
  }
]

const MOCK_REPLIES = [
  `# 分析结果

以下是代码分析的主要发现：

## 1. 性能优化建议

- 使用 \`React.memo\` 减少不必要重渲染
- 将大型列表改为虚拟滚动
- 避免在 render 中创建新对象

## 2. 代码示例

\`\`\`typescript
const memoizedComponent = React.memo(({ data }: { data: Item[] }) => {
  return (
    <div>
      {data.map(item => (
        <Item key={item.id} {...item} />
      ))}
    </div>
  )
})
\`\`\`

## 3. 指标对比

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| FCP | 2.3s | 0.8s |
| LCP | 4.1s | 1.2s |
| TTI | 5.0s | 2.0s |

> 💡 **提示**：以上优化可以显著提升用户体验。`,

  `# 项目架构建议

## 目录结构

推荐采用 **Feature-based** 架构：

\`\`\`
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store.ts
│   └── chat/
│       ├── components/
│       ├── hooks/
│       └── store.ts
├── shared/
│   ├── components/
│   └── utils/
└── App.tsx
\`\`\`

## 核心原则

1. **单一职责** — 每个模块只做一件事
2. **依赖倒置** — 通过接口而非具体实现来依赖
3. **开闭原则** — 对扩展开放，对修改关闭

## 状态管理方案对比

| 方案 | 包大小 | 学习曲线 | 适用场景 |
|------|--------|----------|----------|
| Zustand | 1KB | 低 | 中小型应用 |
| Jotai | 2KB | 低 | 原子化状态 |
| Redux Toolkit | 11KB | 大型应用 |

\`\`\`typescript
// Zustand 示例
import { create } from 'zustand'

interface AppState {
  count: number
  increment: () => void
}

const useStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 }))
}))
\`\`\`

> 🎯 对于当前项目规模，**Zustand** 是最佳选择。`,

  `## 代码审查反馈

检查了你提交的代码，以下是具体反馈：

### ✅ 做得好的地方

- 组件拆分粒度合理
- TypeScript 类型定义完整
- 错误处理覆盖了主要场景

### ⚠️ 需要改进

1. **避免 any 类型**

\`\`\`typescript
// ❌ 不推荐
const handleData = (data: any) => { ... }

// ✅ 推荐
interface ResponseData {
  id: string
  items: Item[]
}
const handleData = (data: ResponseData) => { ... }
\`\`\`

2. **使用 Optional Chaining**

\`\`\`typescript
// ❌ 冗长
if (user && user.profile && user.profile.name) { ... }

// ✅ 简洁
if (user?.profile?.name) { ... }
\`\`\`

### 📊 代码质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 可读性 | ⭐⭐⭐⭐ | 命名规范，结构清晰 |
| 可维护性 | ⭐⭐⭐ | 部分逻辑可进一步抽象 |
| 性能 | ⭐⭐⭐⭐ | 无明显性能瓶颈 |
| 安全性 | ⭐⭐⭐⭐⭐ | 输入验证完善 |

> 总体来看代码质量 **良好**，修复上述问题后即可合并。`,

  // 带工具调用的回复 1
  `让我搜索一下相关信息...

根据搜索结果，React 18 引入了以下重要特性：

## 主要新特性

1. **并发渲染（Concurrent Rendering）** — 允许 React 同时准备多个版本的 UI
2. **自动批处理（Automatic Batching）** — 减少不必要的重渲染
3. **Transitions** — 区分紧急和非紧急更新
4. **Suspense 增强** — 支持服务端渲染

> 这些特性将显著提升应用的用户体验和性能。`,

  // 带工具调用的回复 2
  `让我查看一下项目文件...

文件读取完成，以下是分析结果：

### App.tsx 结构分析

- 使用了标准的 React 函数式组件
- 引入了路由配置和全局状态
- 代码结构清晰，符合最佳实践

> 建议：可以考虑将路由配置提取到独立文件中，便于管理。`
]

/** 包含工具调用的回复索引（对应 MOCK_REPLIES 的后两条） */
const TOOL_REPLY_INDICES = [3, 4]

/** 对应工具调用的工具索引 */
const REPLY_TOOL_MAP: Record<number, number> = {
  3: 0, // web_search
  4: 1  // read_file
}

/** 随机选取一条 Mock 回复，返回内容和对应的工具索引 */
function getRandomReply(): { content: string; toolIndex: number | null } {
  const index = Math.floor(Math.random() * MOCK_REPLIES.length)
  const isToolReply = TOOL_REPLY_INDICES.includes(index)
  return {
    content: MOCK_REPLIES[index],
    toolIndex: isToolReply ? (REPLY_TOOL_MAP[index] ?? null) : null
  }
}

/**
 * Mock 流式回复（支持工具调用）
 * @param onChunk - 每次追加内容时的回调，参数为累计的全部内容
 * @param onComplete - 输出完成后的回调
 * @param onToolCall - 工具调用事件回调（可选）
 * @returns cleanup 函数，调用后停止生成
 */
export function mockStreamReply(
  onChunk: (fullContent: string) => void,
  onComplete: () => void,
  onToolCall?: (toolCall: ToolCall) => void
): () => void {
  const { content: reply, toolIndex } = getRandomReply()
  let index = 0
  let accumulated = ''
  let toolCallTriggered = false
  let toolCallId = ''
  let stopped = false

  /** 工具调用触发点：在输出前 20 个字符后触发 */
  const TOOL_TRIGGER_POINT = 20

  const timer = setInterval(() => {
    if (stopped) return

    // 如果有工具调用，在到达触发点时暂停文字输出并模拟工具调用
    if (
      toolIndex !== null &&
      onToolCall &&
      !toolCallTriggered &&
      index >= TOOL_TRIGGER_POINT
    ) {
      toolCallTriggered = true
      const toolData = MOCK_TOOL_CALLS[toolIndex]
      toolCallId = crypto.randomUUID()

      // 发送 running 状态
      onToolCall({
        id: toolCallId,
        toolName: toolData.toolName,
        status: 'running',
        params: toolData.params
      })

      // 暂停文字输出，模拟工具调用耗时
      clearInterval(timer)
      const toolDuration = Math.min(toolData.duration || 1000, 2000)
      setTimeout(() => {
        if (stopped) return

        // 发送 success 状态
        onToolCall({
          id: toolCallId,
          toolName: toolData.toolName,
          status: 'success',
          params: toolData.params,
          result: toolData.result,
          duration: toolData.duration
        })

        // 恢复文字输出
        const resumeTimer = setInterval(() => {
          if (stopped) {
            clearInterval(resumeTimer)
            return
          }
          if (index >= reply.length) {
            clearInterval(resumeTimer)
            onComplete()
            return
          }
          accumulated += reply[index]
          index++
          onChunk(accumulated)
        }, 30)

        // 更新 cleanup 引用
        cleanupRef.resume = () => {
          clearInterval(resumeTimer)
          onComplete()
        }
      }, toolDuration)

      return
    }

    if (index >= reply.length) {
      clearInterval(timer)
      onComplete()
      return
    }
    accumulated += reply[index]
    index++
    onChunk(accumulated)
  }, 30)

  /** cleanup 引用对象，支持在不同阶段清理 */
  const cleanupRef = {
    resume: null as (() => void) | null
  }

  return () => {
    stopped = true
    clearInterval(timer)
    if (cleanupRef.resume) {
      cleanupRef.resume()
    } else {
      onComplete()
    }
  }
}
