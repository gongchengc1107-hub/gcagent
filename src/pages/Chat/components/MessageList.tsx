import { useEffect, useRef, useCallback, useMemo } from 'react'
import type { FC } from 'react'
import { RobotOutlined, BulbOutlined, CodeOutlined, RocketOutlined } from '@ant-design/icons'
import { useChatStore, useAgentStore } from '@/stores'
import type { ChatMessage } from '@/types'
import { useSendMessage } from '@/hooks/useSendMessage'
import { parseQuickActions } from '@/utils/quickActions'
import MessageBubble from './MessageBubble'
import QuickActionButtons from './QuickActionButtons'

const SUGGESTIONS = [
  { icon: <CodeOutlined />, text: '帮我写一个 React 组件' },
  { icon: <BulbOutlined />, text: '分析这段代码的性能问题' },
  { icon: <RocketOutlined />, text: '设计一个 REST API 方案' }
]

const MessageList: FC = () => {
  const {
    currentSessionId,
    sessions,
    messages,
    addMessage,
    deleteMessagesAfter,
    deleteLastMessage,
    isStreaming,
    pushPendingQuestion
  } = useChatStore()

  const { agents } = useAgentStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const currentMessages = currentSessionId ? (messages[currentSessionId] || []) : []

  // 从 useSendMessage 获取统一的真实发送能力
  const { sendMessage } = useSendMessage()

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [currentMessages])

  /** 获取当前会话绑定的 agentId */
  const currentAgentId = useMemo(() => {
    const session = sessions.find((s) => s.id === currentSessionId)
    return session?.agentId ?? agents[0]?.id ?? ''
  }, [sessions, currentSessionId, agents])

  /**
   * 触发真实 AI 回复
   * @param sessionId 目标会话 ID
   * @param historyMessages 发送时的完整消息历史
   */
  const startRealReply = useCallback(
    (sessionId: string, historyMessages: ChatMessage[]) => {
      const lastUserMsg = [...historyMessages].reverse().find((m) => m.role === 'user')
      // 找不到 user 消息时不发送，防止传空 content 给 CLI
      if (!lastUserMsg?.content?.trim()) return
      sendMessage({
        content: lastUserMsg.content,
        sessionId,
        messages: historyMessages,
        agentId: currentAgentId,
        onQuestion: (q) => {
          // AI agent 提问：将问题追加到队列，UI 自动弹出 QuestionDialog
          pushPendingQuestion(sessionId, q)
        }
      })
    },
    [sendMessage, currentAgentId, pushPendingQuestion]
  )

  /** 重新发送用户消息 */
  const handleResend = useCallback(
    (messageId: string, content: string) => {
      if (!currentSessionId || isStreaming) return

      // 删除该消息及之后所有消息，重新添加用户消息
      deleteMessagesAfter(currentSessionId, messageId)
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId: currentSessionId,
        role: 'user',
        content,
        createdAt: Date.now()
      }
      addMessage(currentSessionId, userMessage)

      // addMessage 同步更新 store，getState() 已含新消息，直接读取即可
      const updatedMessages = useChatStore.getState().messages[currentSessionId] || []
      startRealReply(currentSessionId, updatedMessages)
    },
    [currentSessionId, isStreaming, deleteMessagesAfter, addMessage, startRealReply]
  )

  /** 编辑后重发 */
  const handleEditResend = useCallback(
    (messageId: string, newContent: string) => {
      if (!currentSessionId || isStreaming) return

      deleteMessagesAfter(currentSessionId, messageId)
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId: currentSessionId,
        role: 'user',
        content: newContent,
        createdAt: Date.now()
      }
      addMessage(currentSessionId, userMessage)

      const updatedMessages = useChatStore.getState().messages[currentSessionId] || []
      startRealReply(currentSessionId, updatedMessages)
    },
    [currentSessionId, isStreaming, deleteMessagesAfter, addMessage, startRealReply]
  )

  /** 重新生成 AI 回复 */
  const handleRegenerate = useCallback(
    (_messageId: string) => {
      if (!currentSessionId || isStreaming) return

      // 删除最后一条 AI 消息，用现有历史重新发起请求
      deleteLastMessage(currentSessionId)
      const currentHistory = useChatStore.getState().messages[currentSessionId] || []
      startRealReply(currentSessionId, currentHistory)
    },
    [currentSessionId, isStreaming, deleteLastMessage, startRealReply]
  )

  /** 建议点击：等同用户发送该文本 */
  const handleSuggestion = useCallback(
    (text: string) => {
      if (!currentSessionId || isStreaming) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId: currentSessionId,
        role: 'user',
        content: text,
        createdAt: Date.now()
      }
      addMessage(currentSessionId, userMessage)

      const updatedMessages = useChatStore.getState().messages[currentSessionId] || []
      startRealReply(currentSessionId, updatedMessages)
    },
    [currentSessionId, isStreaming, addMessage, startRealReply]
  )

  /** 解析最后一条 AI 消息的快捷选项 */
  const quickActions = useMemo(() => {
    if (currentMessages.length === 0) return []
    const lastMsg = currentMessages[currentMessages.length - 1]
    if (lastMsg.role !== 'assistant' || lastMsg.isStreaming) return []
    return parseQuickActions(lastMsg.content)
  }, [currentMessages])

  /** 快捷选项点击：等同用户发送该文本 */
  const handleQuickAction = useCallback(
    (text: string) => {
      if (!currentSessionId || isStreaming) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId: currentSessionId,
        role: 'user',
        content: text,
        createdAt: Date.now()
      }
      addMessage(currentSessionId, userMessage)

      const updatedMessages = useChatStore.getState().messages[currentSessionId] || []
      startRealReply(currentSessionId, updatedMessages)
    },
    [currentSessionId, isStreaming, addMessage, startRealReply]
  )

  // 空会话欢迎页
  if (currentMessages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <RobotOutlined className="text-3xl text-white" />
        </div>
        <h2
          className="mb-2 text-2xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Codemaker
        </h2>
        <p
          className="mb-8 text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          开始和 AI 对话吧
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors"
              style={{
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                e.currentTarget.style.color = 'var(--accent-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
              onClick={() => handleSuggestion(s.text)}
            >
              {s.icon}
              {s.text}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        {currentMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onResend={handleResend}
            onEditResend={handleEditResend}
            onRegenerate={handleRegenerate}
          />
        ))}
      </div>
      {/* AI 快捷选项按钮 */}
      {quickActions.length > 0 && (
        <QuickActionButtons actions={quickActions} onAction={handleQuickAction} />
      )}
    </div>
  )
}

export default MessageList
