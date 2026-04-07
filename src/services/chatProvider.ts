/**
 * ChatProvider 抽象接口
 * 定义 AI 对话服务的统一调用契约
 */
import type { ChatMessage, ImageAttachment, ToolCall } from '@/types'

/**
 * question.asked 事件的数据结构
 * AI agent 在执行过程中向用户提问，需要用户选择或输入答案才能继续
 */
export interface QuestionAsked {
  /** 问题唯一 ID */
  id: string
  /** 所属会话 ID（OpenCode session ID） */
  sessionID: string
  /** 问题列表（通常只有一个） */
  questions: Array<{
    question: string
    header?: string
    options?: Array<{ label: string; description?: string }>
  }>
  /** 关联的工具调用信息 */
  tool: { messageID: string; callID: string }
}

export interface SendMessageParams {
  /** 当前输入内容 */
  content: string
  sessionId: string
  /** 完整历史消息（含当前用户消息），用于多轮上下文 */
  messages: ChatMessage[]
  /** 使用的模型 ID，格式：provider/model */
  model: string
  /** Agent backendName，传给 codemaker serve 的 agentID 字段（如 "build"、"explore"） */
  agentID?: string
  /** Agent system prompt（可选，agentID 不存在时的降级描述） */
  systemPrompt?: string
  images?: ImageAttachment[]
  onChunk: (chunk: string) => void
  onToolCall?: (toolCall: ToolCall) => void
  /** 流完成（含错误路径结束后）时调用，负责清理 isStreaming 等状态 */
  onComplete: () => void
  /** 错误时调用；onError 触发后 onComplete 仍会被调用（作为 finalizer） */
  onError?: (err: Error) => void
  /** AI agent 提问时触发，UI 层需要展示问题并收集用户答案 */
  onQuestion?: (question: QuestionAsked) => void
}

export interface ChatProvider {
  /** 发送消息，返回 cleanup 函数用于中止生成 */
  sendMessage(params: SendMessageParams): () => void
  /** 主动停止当前生成 */
  stopGeneration(): void
  /**
   * 回答 AI agent 的提问
   * OpenCode 协议：POST /question/{requestID}/reply
   */
  answerQuestion(sessionID: string, questionId: string, answer: string): Promise<void>
  /**
   * 拒绝/取消 AI agent 的提问
   * OpenCode 协议：POST /question/{requestID}/reject
   */
  rejectQuestion(questionId: string): Promise<void>
}
