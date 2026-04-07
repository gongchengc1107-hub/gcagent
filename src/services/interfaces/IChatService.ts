import type { ChatMessage, ToolCall } from '../../types'

/** 聊天服务接口 */
export interface IChatService {
  /**
   * 发送消息（流式）
   * @returns cancel 函数，调用后取消流式请求
   */
  sendMessage(params: {
    sessionId: string
    content: string
    images?: string[]
    onChunk: (chunk: string) => void
    onToolCall?: (toolCall: ToolCall) => void
    onComplete: () => void
  }): () => void

  /** 获取会话历史消息 */
  getHistory(sessionId: string): Promise<ChatMessage[]>
}
