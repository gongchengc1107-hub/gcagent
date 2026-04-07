/**
 * Direct Provider — Mock 版
 * 模拟直连模型 API 的流式回复，回复风格更简短
 */
import type { ChatProvider, SendMessageParams } from './chatProvider'

/** 简短风格的 Mock 回复 */
const DIRECT_REPLIES = [
  '好的，我来帮你处理这个问题。\n\n首先需要确认一下需求细节，然后逐步实现。',
  '收到！让我分析一下代码结构，稍后给出优化建议。',
  '这是一个常见的场景。推荐使用组合模式来解耦逻辑，具体方案如下...\n\n1. 抽离公共逻辑到自定义 Hook\n2. 使用 Context 共享状态\n3. 按需懒加载子模块',
  '已完成分析。核心问题在于状态更新粒度过大导致不必要的重渲染。\n\n建议拆分 store 为更细粒度的 slice。'
]

export class DirectProvider implements ChatProvider {
  private timer: ReturnType<typeof setInterval> | null = null

  sendMessage(params: SendMessageParams): () => void {
    const { onChunk, onComplete } = params
    const reply = DIRECT_REPLIES[Math.floor(Math.random() * DIRECT_REPLIES.length)]
    let index = 0
    let accumulated = ''

    this.timer = setInterval(() => {
      if (index >= reply.length) {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        onComplete()
        return
      }
      // 每次输出 1~3 个字符，模拟不同速度
      const step = Math.min(1 + Math.floor(Math.random() * 3), reply.length - index)
      accumulated += reply.slice(index, index + step)
      index += step
      onChunk(accumulated)
    }, 40)

    return () => this.stopGeneration()
  }

  stopGeneration(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /** Mock 实现：不调用真实 API，直接 resolve */
  async answerQuestion(_sessionID: string, _questionId: string, _answer: string): Promise<void> {
    if (import.meta.env.DEV) {
      console.log('[DirectProvider] answerQuestion (no-op)')
    }
  }
}
