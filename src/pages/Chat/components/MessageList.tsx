import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import type { FC } from 'react'
import { RobotOutlined, BulbOutlined, CodeOutlined, RocketOutlined } from '@ant-design/icons'
import { useChatStore, useAgentStore } from '@/stores'
import type { ChatMessage } from '@/types'
import { useSendMessage } from '@/hooks/useSendMessage'
import { parseQuickActions } from '@/utils/quickActions'
import { parseOptionsFromContent, stripOptionsMarkers } from '@/utils/parseOptions'
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
    pushPendingQuestion
  } = useChatStore()

  const { agents } = useAgentStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const currentMessages = currentSessionId ? (messages[currentSessionId] || []) : []

  // 从 useSendMessage 获取统一的真实发送能力 + 当前会话的 streaming 状态
  const { sendMessage, isStreaming } = useSendMessage()

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

  /** 解析最后一条 AI 消息中的 options 选择器标记 */
  const parsedOptions = useMemo(() => {
    if (currentMessages.length === 0) return null
    const lastMsg = currentMessages[currentMessages.length - 1]
    if (lastMsg.role !== 'assistant' || lastMsg.isStreaming) return null
    return parseOptionsFromContent(lastMsg.content)
  }, [currentMessages])

  /** 选项选择状态（用于 UI 反馈） */
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  /** 自定义输入状态 */
  const [customInputVisible, setCustomInputVisible] = useState(false)
  const [customInputValue, setCustomInputValue] = useState('')
  const customInputRef = useRef<HTMLInputElement>(null)

  /** 选项点击：单选直接发送，多选 toggle，自定义展开输入框 */
  const handleOptionClick = useCallback(
    (option: (typeof parsedOptions)['options'][number]) => {
      if (!currentSessionId || isStreaming) return

      if (option.isCustom) {
        // 自定义选项：展开输入框
        setCustomInputVisible(true)
        setTimeout(() => customInputRef.current?.focus(), 100)
        return
      }

      if (parsedOptions?.multiple) {
        // 多选模式：toggle
        setSelectedOptions((prev) =>
          prev.includes(option.label) ? prev.filter((o) => o !== option.label) : [...prev, option.label]
        )
      } else {
        // 单选模式：直接发送
        setSelectedOptions([option.label])
        setTimeout(() => {
          const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sessionId: currentSessionId,
            role: 'user',
            content: option.label,
            createdAt: Date.now()
          }
          addMessage(currentSessionId, userMessage)

          const updatedMessages = useChatStore.getState().messages[currentSessionId] || []
          startRealReply(currentSessionId, updatedMessages)
          setSelectedOptions([])
        }, 300)
      }
    },
    [currentSessionId, isStreaming, parsedOptions, addMessage, startRealReply]
  )

  /** 自定义输入确认发送 */
  const handleCustomSubmit = useCallback(() => {
    if (!currentSessionId || isStreaming || !customInputValue.trim()) return

    const content = customInputValue.trim()
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: currentSessionId,
      role: 'user',
      content,
      createdAt: Date.now()
    }
    addMessage(currentSessionId, userMessage)

    const updatedMessages = useChatStore.getState().messages[currentSessionId] || []
    startRealReply(currentSessionId, updatedMessages)
    setCustomInputVisible(false)
    setCustomInputValue('')
    setSelectedOptions([])
  }, [currentSessionId, isStreaming, customInputValue, addMessage, startRealReply])

  /** 自定义输入键盘事件 */
  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleCustomSubmit()
      } else if (e.key === 'Escape') {
        setCustomInputVisible(false)
        setCustomInputValue('')
      }
    },
    [handleCustomSubmit]
  )

  /** 多选模式下的确认发送 */
  const handleConfirmMultiSelect = useCallback(() => {
    if (!currentSessionId || isStreaming || selectedOptions.length === 0) return

    const content = selectedOptions.join('、')
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: currentSessionId,
      role: 'user',
      content,
      createdAt: Date.now()
    }
    addMessage(currentSessionId, userMessage)

    const updatedMessages = useChatStore.getState().messages[currentSessionId] || []
    startRealReply(currentSessionId, updatedMessages)
    setSelectedOptions([])
  }, [currentSessionId, isStreaming, selectedOptions, addMessage, startRealReply])

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
        {currentMessages.map((msg, idx) => {
          // 最后一条已完成的 assistant 消息启用列表项点击
          const isLastAssistant =
            msg.role === 'assistant' &&
            !msg.isStreaming &&
            idx === currentMessages.length - 1

          // 对最后一条消息，移除 options 标记后再渲染
          const displayContent =
            isLastAssistant && parsedOptions
              ? stripOptionsMarkers(msg.content)
              : msg.content

          return (
            <MessageBubble
              key={msg.id}
              message={{ ...msg, content: displayContent }}
              onResend={handleResend}
              onEditResend={handleEditResend}
              onRegenerate={handleRegenerate}
              onQuickAction={isLastAssistant ? handleQuickAction : undefined}
            />
          )
        })}
      </div>

      {/* AI 快捷选项按钮（从列表项解析） */}
      {quickActions.length > 0 && (
        <QuickActionButtons actions={quickActions} onAction={handleQuickAction} />
      )}

      {/* 前端解析的 options 选择器（支持直连模式） */}
      {parsedOptions && !isStreaming && !customInputVisible && (
        <div className="mx-auto max-w-3xl pb-4">
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: `1px solid var(--border-primary)`
            }}
          >
            {parsedOptions.question && (
              <p
                className="mb-3 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {parsedOptions.question}
                {parsedOptions.multiple && (
                  <span
                    className="ml-2 text-xs font-normal"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    （可多选）
                  </span>
                )}
              </p>
            )}
            <div
              className={`grid gap-2 ${
                parsedOptions.options.length <= 4 ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {parsedOptions.options.map((option, idx) => {
                const isSelected = selectedOptions.includes(option.label)
                return (
                  <button
                    key={idx}
                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm transition-all duration-150"
                    style={{
                      backgroundColor: option.isCustom
                        ? 'var(--bg-primary)'
                        : isSelected
                          ? 'var(--accent-primary)'
                          : 'var(--bg-tertiary)',
                      color: isSelected && !option.isCustom ? '#fff' : 'var(--text-primary)',
                      border: `1px solid ${
                        option.isCustom ? 'var(--border-secondary)' : isSelected ? 'var(--accent-primary)' : 'var(--border-primary)'
                      }`,
                      borderStyle: option.isCustom ? 'dashed' : 'solid'
                    }}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={(e) => {
                      if (!isSelected && !option.isCustom) {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !option.isCustom) {
                        e.currentTarget.style.borderColor = option.isCustom ? 'var(--border-secondary)' : 'var(--border-primary)'
                      }
                    }}
                  >
                    {!option.isCustom && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border" style={{
                        borderColor: isSelected ? '#fff' : 'var(--text-muted)',
                        backgroundColor: isSelected ? '#fff' : 'transparent'
                      }}>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full" style={{
                            backgroundColor: 'var(--accent-primary)',
                            borderRadius: parsedOptions.multiple ? '1px' : '50%'
                          }} />
                        )}
                      </span>
                    )}
                    {option.isCustom && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                        ✎
                      </span>
                    )}
                    <span className="flex-1">{option.label}</span>
                  </button>
                )
              })}
            </div>

            {/* 多选确认按钮 */}
            {parsedOptions.multiple && selectedOptions.length > 0 && (
              <button
                className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--accent-primary)' }}
                onClick={handleConfirmMultiSelect}
              >
                确认选择（已选 {selectedOptions.length} 项）
              </button>
            )}
          </div>
        </div>
      )}

      {/* 自定义输入框 */}
      {customInputVisible && parsedOptions && !isStreaming && (
        <div className="mx-auto max-w-3xl pb-4">
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: `2px solid var(--accent-primary)`
            }}
          >
            <p
              className="mb-3 text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {parsedOptions.question || '请输入'}
            </p>
            <div className="flex gap-2">
              <input
                ref={customInputRef}
                type="text"
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: `1px solid var(--border-primary)`,
                  color: 'var(--text-primary)'
                }}
                placeholder={parsedOptions.options.find((o) => o.isCustom)?.customPlaceholder || '请输入具体内容'}
                value={customInputValue}
                onChange={(e) => setCustomInputValue(e.target.value)}
                onKeyDown={handleCustomKeyDown}
              />
              <button
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--accent-primary)' }}
                onClick={handleCustomSubmit}
                disabled={!customInputValue.trim()}
              >
                发送
              </button>
              <button
                className="rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)'
                }}
                onClick={() => {
                  setCustomInputVisible(false)
                  setCustomInputValue('')
                }}
              >
                取消
              </button>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              按 Enter 发送，Esc 取消
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageList
