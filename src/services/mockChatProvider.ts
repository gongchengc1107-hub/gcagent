/**
 * Mock ChatProvider — 模拟 SSE 流式对话
 * 用于后端 API 未就绪时的本地开发
 */
import type { ChatProvider, SendMessageParams } from './chatProvider'

export class MockChatProvider implements ChatProvider {
  private timer: ReturnType<typeof setInterval> | null = null
  private cancelled = false

  sendMessage(params: SendMessageParams): () => void {
    this.cancelled = false
    const { content, onChunk, onComplete } = params

    // 构造 Mock 回复（模拟 AI 生成的内容）
    const mockResponses = [
      `好的，我来处理你的请求。\n\n你说的是：「${content}」\n\n`,
      '这是一个 Mock 回复，因为后端服务尚未启动。',
      '\n\n以下是一些示例代码：\n\n```typescript\nfunction hello() {\n  console.log("Hello from Codemaker!");\n}\n```\n\n',
      '如果需要连接真实的 Codemaker 服务，请先运行 `codemaker serve` 启动本地服务。'
    ]
    const fullReply = mockResponses[Math.floor(Math.random() * mockResponses.length)]
    const chars = [...fullReply]

    let idx = 0
    let accumulated = ''

    this.timer = setInterval(() => {
      if (this.cancelled || idx >= chars.length) {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        if (!this.cancelled) {
          onComplete()
        }
        return
      }
      // 每次输出 1-3 个字符，模拟流式效果
      const batchSize = Math.min(1 + Math.floor(Math.random() * 3), chars.length - idx)
      for (let i = 0; i < batchSize; i++) {
        accumulated += chars[idx]
        idx++
      }
      onChunk(accumulated)
    }, 30)

    return () => this.stopGeneration()
  }

  stopGeneration(): void {
    this.cancelled = true
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /** Mock 实现：不调用真实 API，直接 resolve */
  async answerQuestion(_sessionID: string, _questionId: string, _answers: string[]): Promise<void> {
    if (import.meta.env.DEV) {
      console.log('[MockChatProvider] answerQuestion (no-op)')
    }
  }

  async rejectQuestion(_questionId: string): Promise<void> {
    if (import.meta.env.DEV) {
      console.log('[MockChatProvider] rejectQuestion (no-op)')
    }
  }

  async abortSession(_appSessionId: string): Promise<void> {
    if (import.meta.env.DEV) {
      console.log('[MockChatProvider] abortSession (no-op)')
    }
  }
}
