import type { IChatService } from '../interfaces'
import type { ChatMessage } from '../../types'

/** 聊天服务 Mock 实现 */
export class MockChatService implements IChatService {
  sendMessage(params: {
    sessionId: string
    content: string
    images?: string[]
    onChunk: (chunk: string) => void
    onComplete: () => void
  }): () => void {
    let cancelled = false
    const mockReply = `这是对「${params.content}」的 Mock 回复。当前会话: ${params.sessionId}`
    const chunks = mockReply.split('')

    /* 逐字流式输出 */
    let idx = 0
    const timer = setInterval(() => {
      if (cancelled || idx >= chunks.length) {
        clearInterval(timer)
        if (!cancelled) params.onComplete()
        return
      }
      params.onChunk(chunks[idx])
      idx++
    }, 30)

    /* 返回取消函数 */
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    /* Mock: 返回空历史 */
    void sessionId
    return []
  }
}
