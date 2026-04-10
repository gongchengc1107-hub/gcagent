/**
 * useSendMessage — 统一的 AI 消息发送 Hook
 *
 * 封装真实 Provider 调用逻辑，供 MessageInput（首次发送）
 * 和 MessageList（重发/重生成/建议点击）共同使用，确保两处
 * 行为完全一致，不再出现"操作走 Mock"的问题。
 */
import { useCallback } from 'react'
import { message as antMessage } from 'antd'
import { useChatStore } from '@/stores/useChatStore'
import { useAgentStore } from '@/stores/useAgentStore'
import { useModelStore, DEFAULT_MODEL } from '@/stores/useModelStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { getProvider } from '@/services/providerFactory'
import type { QuestionAsked } from '@/services/chatProvider'
import type { ChatMessage, ImageAttachment } from '@/types'

export interface SendOptions {
  /** 用户消息内容 */
  content: string
  /** 当前会话 ID */
  sessionId: string
  /** 完整历史消息（含即将发送的用户消息） */
  messages: ChatMessage[]
  /** 选中的 Agent ID，用于构建 system prompt */
  agentId?: string
  /** 附带的图片附件 */
  images?: ImageAttachment[]
  /** AI agent 提问时触发，UI 层需要展示问题并收集用户答案 */
  onQuestion?: (question: QuestionAsked) => void
}

export interface UseSendMessageReturn {
  /** 发起一次 AI 对话请求 */
  sendMessage: (options: SendOptions) => void
  /** 停止当前流式生成（可指定 sessionId，默认当前会话） */
  stopGeneration: (targetSessionId?: string) => void
  /** 当前会话是否正在流式生成（响应式） */
  isStreaming: boolean
}

export function useSendMessage(): UseSendMessageReturn {
  const {
    addMessage,
    updateMessage,
    setIsStreaming,
    setStreamCleanup
  } = useChatStore()

  const { agents } = useAgentStore()

  // 响应式读取当前会话的 streaming 状态
  const currentSessionId = useChatStore((s) => s.currentSessionId)
  const isStreaming = useChatStore((s) =>
    currentSessionId ? (s.streamingSessionIds[currentSessionId] ?? false) : false
  )

  const sendMessage = useCallback(
    ({ content, sessionId, messages, agentId, images, onQuestion }: SendOptions) => {
      if (import.meta.env.DEV) {
        console.log('[useSendMessage] sendMessage called', { content, sessionId, agentId, messagesCount: messages.length })
      }

      // 1. 创建 AI 占位消息
      const aiMessageId = crypto.randomUUID()
      addMessage(sessionId, {
        id: aiMessageId,
        sessionId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        createdAt: Date.now()
      })
      setIsStreaming(sessionId, true)

      // 2. 找到当前 agent，取 backendName 传给 serve（真实调用）
      //    同时保留 systemPrompt 作为无 backendName 时的降级描述
      const currentAgent = agents.find((a) => a.id === agentId)
      const agentID = currentAgent?.backendName || undefined
      const systemPrompt = !agentID && currentAgent?.description
        ? `你是 ${currentAgent.name}，${currentAgent.description}。`
        : undefined

      // 3. 每次发送时取最新 Provider（响应 providerMode 和 VITE_USE_MOCK 的实时变化）
      const provider = getProvider()
      // 关键：从 store 实时读取最新 model，绕过 useCallback 闭包的 stale closure 问题。
      // 不将 currentModel 放入依赖数组，sendMessage 引用稳定，不会因模型切换触发下游组件重建。
      let resolvedModel = useModelStore.getState().currentModel || DEFAULT_MODEL

      if (import.meta.env.DEV) {
        console.log(`[useSendMessage] Initial resolvedModel: ${resolvedModel}`)
      }

      // 检查是否使用了多模型配置
      if (resolvedModel.startsWith('direct://multi/')) {
        const modelId = resolvedModel.replace('direct://multi/', '')
        const settingsState = useSettingsStore.getState()
        const multiModel = settingsState.multiModels.find(m => m.id === modelId)

        if (import.meta.env.DEV) {
          console.log(`[useSendMessage] Parsing multi model - modelId: ${modelId}, found: ${!!multiModel}`)
          if (multiModel) {
            console.log(`[useSendMessage] MultiModel details:`, multiModel)
          }
        }

        if (multiModel) {
          // 激活对应的多模型配置
          useSettingsStore.getState().setActiveMultiModelId(modelId)
          // 使用多模型的 modelId
          resolvedModel = multiModel.modelId

          if (import.meta.env.DEV) {
            console.log(`[useSendMessage] 使用多模型配置: ${multiModel.name} (${multiModel.modelId})`)
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn(`[useSendMessage] 未找到对应的多模型配置，modelId: ${modelId}`)
            console.warn(`[useSendMessage] 当前 multiModels:`, settingsState.multiModels)
          }
        }
      }

      if (import.meta.env.DEV) {
        console.log(`[useSendMessage] Final resolvedModel: ${resolvedModel}`)
        console.log(`[useSendMessage] provider=${provider.constructor.name} model=${resolvedModel}`)
      }

      const cleanup = provider.sendMessage({
        content,
        sessionId,
        messages,
        model: resolvedModel,
        agentID,
        systemPrompt,
        images,
        onQuestion,
        onChunk: (accumulated) => {
          updateMessage(sessionId, aiMessageId, accumulated, { isStreaming: true })
        },
        onComplete: () => {
          setIsStreaming(sessionId, false)
          setStreamCleanup(sessionId, null)
          // 最终写入 isStreaming: false，清除气泡的 loading 状态
          const msgs = useChatStore.getState().messages[sessionId] || []
          const msg = msgs.find((m) => m.id === aiMessageId)
          if (msg) {
            updateMessage(sessionId, aiMessageId, msg.content, { isStreaming: false })
          }

          // 第一轮对话结束后，静默调用 title agent 自动生成会话标题
          // 判断依据：session 标题仍为默认值「新对话」，说明从未生成过标题
          const currentSession = useChatStore.getState().sessions.find((s) => s.id === sessionId)
          const needsTitle = currentSession?.title === '新对话'
          if (needsTitle) {
            const titleProvider = getProvider()
            let titleModel = useModelStore.getState().currentModel || DEFAULT_MODEL
            
            // 同样需要解析多模型配置
            if (titleModel.startsWith('direct://multi/')) {
              const modelId = titleModel.replace('direct://multi/', '')
              const settingsState = useSettingsStore.getState()
              const multiModel = settingsState.multiModels.find(m => m.id === modelId)
              if (multiModel) {
                titleModel = multiModel.modelId
              }
            }
            
            let titleAccumulated = ''
            const titleSessionId = `__title__${sessionId}`
            // 拼对话摘要：取首条 user 消息 + 首条 assistant 消息，截断避免过长
            const allMsgs = useChatStore.getState().messages[sessionId] || []
            const firstUser = allMsgs.find((m) => m.role === 'user')
            const firstAssistant = allMsgs.find((m) => m.role === 'assistant')
            const summaryContent = [
              firstUser ? `用户：${firstUser.content.slice(0, 200)}` : '',
              firstAssistant ? `助手：${firstAssistant.content.slice(0, 200)}` : '',
            ].filter(Boolean).join('\n')
            titleProvider.sendMessage({
              content: `请根据以下对话内容生成一个简洁的会话标题（10字以内，不加引号）：\n\n${summaryContent}`,
              sessionId: titleSessionId,
              messages: [],
              model: titleModel,
              agentID: 'title',
              onChunk: (chunk) => { titleAccumulated = chunk },
              onComplete: () => {
                const title = titleAccumulated.trim().replace(/^["'【]|["'】]$/g, '').trim()
                if (title) {
                  useChatStore.getState().renameSession(sessionId, title)
                }
              },
              onError: () => { /* 静默失败，标题保持默认 */ },
            })
          }
        },
        onError: (err) => {
          setIsStreaming(sessionId, false)
          setStreamCleanup(sessionId, null)
          const errMsg = err.message.includes('HTTP 401')
            ? '认证失败，请重新登录 Codemaker'
            : `请求失败：${err.message}`
          updateMessage(sessionId, aiMessageId, `> ⚠️ ${errMsg}`, { isStreaming: false })
          antMessage.error(errMsg)
        }
      })

      setStreamCleanup(sessionId, () => cleanup)
    },
    [agents, addMessage, updateMessage, setIsStreaming, setStreamCleanup]
  )

  const stopGeneration = useCallback((targetSessionId?: string) => {
    const state = useChatStore.getState()
    const sessionId = targetSessionId ?? state.currentSessionId
    if (!sessionId) return

    // 1. 调用前端 cleanup（abort fetch + abortStream）
    const cleanup = state.streamCleanups[sessionId]
    cleanup?.()

    // 2. 通知 serve 后端停止生成
    getProvider().abortSession(sessionId).catch(() => {})

    // 3. 清理 per-session 状态
    setIsStreaming(sessionId, false)
    setStreamCleanup(sessionId, null)

    // 4. 重置流式消息的 isStreaming 标记，避免 loading 动画永久卡住
    const sessionMessages = state.messages[sessionId] || []
    const streamingMsg = sessionMessages.find((m) => m.isStreaming)
    if (streamingMsg) {
      updateMessage(sessionId, streamingMsg.id, streamingMsg.content, { isStreaming: false })
    }
  }, [setIsStreaming, setStreamCleanup, updateMessage])

  return { sendMessage, stopGeneration, isStreaming }
}
