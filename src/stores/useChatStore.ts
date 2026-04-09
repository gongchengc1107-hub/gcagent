import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatSession, ChatMessage, ConnectionStatus, ToolCall } from '@/types'
import type { QuestionAsked } from '@/services/chatProvider'
import { STORAGE_KEYS } from '@/utils/storageKeys'

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  messages: Record<string, ChatMessage[]>
  streamingSessionIds: Record<string, boolean>
  streamCleanups: Record<string, () => void>
  connectionStatus: ConnectionStatus
  drafts: Record<string, string>
  /**
   * 每个 app sessionId 对应的 pending question 队列
   * key: appSessionId，value: QuestionAsked[]
   * 当 AI agent 发出 question.asked 事件时 push 进队列，用户逐条回答后 shift 弹出
   */
  pendingQuestions: Record<string, QuestionAsked[]>

  createSession: (title: string, agentId: string, modelId: string) => string
  deleteSession: (id: string) => void
  renameSession: (id: string, title: string) => void
  /** 更新会话绑定的 agent */
  updateSessionAgent: (id: string, agentId: string) => void
  togglePin: (id: string) => void
  setCurrentSession: (id: string | null) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  updateMessage: (sessionId: string, messageId: string, content: string, patch?: Partial<Pick<ChatMessage, 'toolCalls' | 'images' | 'isStreaming'>>) => void
  /** 更新消息中的单个 ToolCall（按 id 匹配，不存在则追加） */
  upsertToolCall: (sessionId: string, messageId: string, toolCall: ToolCall) => void
  deleteMessagesAfter: (sessionId: string, messageId: string) => void
  deleteLastMessage: (sessionId: string) => void
  setIsStreaming: (sessionId: string, streaming: boolean) => void
  setStreamCleanup: (sessionId: string, cleanup: (() => void) | null) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  saveDraft: (sessionId: string, content: string) => void
  getDraft: (sessionId: string) => string
  clearDraft: (sessionId: string) => void
  /** 向指定会话的 pending question 队列追加一个问题 */
  pushPendingQuestion: (sessionId: string, question: QuestionAsked) => void
  /** 弹出指定会话队列中的第一个问题（已回答），返回剩余队列 */
  shiftPendingQuestion: (sessionId: string) => void
  /** 清空指定会话的 pending question 队列（取消时使用） */
  clearPendingQuestions: (sessionId: string) => void
  /** @deprecated 向后兼容：null 清空队列，非 null push。优先使用 push/shift/clear */
  setPendingQuestion: (sessionId: string, question: QuestionAsked | null) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      messages: {},
      streamingSessionIds: {},
      streamCleanups: {},
      connectionStatus: 'connected' as ConnectionStatus,
      drafts: {},
      pendingQuestions: {},

      createSession: (title: string, agentId: string, modelId: string): string => {
        const id = crypto.randomUUID()
        const now = Date.now()
        const session: ChatSession = {
          id,
          title,
          isPinned: false,
          agentId,
          modelId,
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({
          sessions: [session, ...state.sessions],
          currentSessionId: id,
          messages: { ...state.messages, [id]: [] }
        }))
        return id
      },

      deleteSession: (id: string) => {
        // 先调用该 session 的 cleanup 函数（如果存在），中止流式生成
        const cleanup = get().streamCleanups[id]
        cleanup?.()

        set((state) => {
          const { [id]: _removed, ...restMessages } = state.messages
          const { [id]: _removedStreaming, ...restStreamingIds } = state.streamingSessionIds
          const { [id]: _removedCleanup, ...restCleanups } = state.streamCleanups
          const remaining = state.sessions.filter((s) => s.id !== id)
          return {
            sessions: remaining,
            currentSessionId:
              state.currentSessionId === id
                ? (remaining[0]?.id ?? null)
                : state.currentSessionId,
            messages: restMessages,
            streamingSessionIds: restStreamingIds,
            streamCleanups: restCleanups
          }
        })
      },

      renameSession: (id: string, title: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          )
        }))
      },

      updateSessionAgent: (id: string, agentId: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, agentId, updatedAt: Date.now() } : s
          )
        }))
      },

      togglePin: (id: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, isPinned: !s.isPinned, updatedAt: Date.now() } : s
          )
        }))
      },

      setCurrentSession: (id: string | null) => {
        set({ currentSessionId: id })
      },

      addMessage: (sessionId: string, message: ChatMessage) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: [...(state.messages[sessionId] || []), message]
          },
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, updatedAt: Date.now() } : s
          )
        }))
      },

      updateMessage: (sessionId: string, messageId: string, content: string, patch?: Partial<Pick<ChatMessage, 'toolCalls' | 'images' | 'isStreaming'>>) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).map((m) =>
              m.id === messageId ? { ...m, content, ...patch } : m
            )
          }
        }))
      },

      upsertToolCall: (sessionId: string, messageId: string, toolCall: ToolCall) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).map((m) => {
              if (m.id !== messageId) return m
              const existing = m.toolCalls || []
              const idx = existing.findIndex((tc) => tc.id === toolCall.id)
              const updated = idx >= 0
                ? existing.map((tc, i) => (i === idx ? toolCall : tc))
                : [...existing, toolCall]
              return { ...m, toolCalls: updated }
            })
          }
        }))
      },

      deleteMessagesAfter: (sessionId: string, messageId: string) => {
        set((state) => {
          const msgs = state.messages[sessionId] || []
          const idx = msgs.findIndex((m) => m.id === messageId)
          if (idx === -1) return state
          return {
            messages: {
              ...state.messages,
              [sessionId]: msgs.slice(0, idx)
            }
          }
        })
      },

      deleteLastMessage: (sessionId: string) => {
        set((state) => {
          const msgs = state.messages[sessionId] || []
          if (msgs.length === 0) return state
          return {
            messages: {
              ...state.messages,
              [sessionId]: msgs.slice(0, -1)
            }
          }
        })
      },

      setIsStreaming: (sessionId: string, streaming: boolean) => {
        set((state) => ({
          streamingSessionIds: {
            ...state.streamingSessionIds,
            [sessionId]: streaming
          }
        }))
      },

      setStreamCleanup: (sessionId: string, cleanup: (() => void) | null) => {
        set((state) => {
          if (cleanup) {
            return { streamCleanups: { ...state.streamCleanups, [sessionId]: cleanup } }
          } else {
            const { [sessionId]: _, ...rest } = state.streamCleanups
            return { streamCleanups: rest }
          }
        })
      },

      setConnectionStatus: (status: ConnectionStatus) => {
        set({ connectionStatus: status })
      },

      saveDraft: (sessionId: string, content: string) => {
        set((state) => ({
          drafts: { ...state.drafts, [sessionId]: content }
        }))
      },

      getDraft: (sessionId: string): string => {
        return get().drafts[sessionId] || ''
      },

      clearDraft: (sessionId: string) => {
        set((state) => {
          const { [sessionId]: _removed, ...rest } = state.drafts
          return { drafts: rest }
        })
      },

      setPendingQuestion: (sessionId: string, question: QuestionAsked | null) => {
        // 保留向后兼容：null 时清空队列，非 null 时 push
        if (question === null) {
          set((state) => ({
            pendingQuestions: {
              ...state.pendingQuestions,
              [sessionId]: []
            }
          }))
        } else {
          set((state) => ({
            pendingQuestions: {
              ...state.pendingQuestions,
              [sessionId]: [...(state.pendingQuestions[sessionId] || []), question]
            }
          }))
        }
      },

      pushPendingQuestion: (sessionId: string, question: QuestionAsked) => {
        set((state) => ({
          pendingQuestions: {
            ...state.pendingQuestions,
            [sessionId]: [...(state.pendingQuestions[sessionId] || []), question]
          }
        }))
      },

      shiftPendingQuestion: (sessionId: string) => {
        set((state) => {
          const queue = state.pendingQuestions[sessionId] || []
          return {
            pendingQuestions: {
              ...state.pendingQuestions,
              [sessionId]: queue.slice(1)
            }
          }
        })
      },

      clearPendingQuestions: (sessionId: string) => {
        set((state) => ({
          pendingQuestions: {
            ...state.pendingQuestions,
            [sessionId]: []
          }
        }))
      }
    }),
    {
      name: STORAGE_KEYS.CHAT,
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        // 持久化时剥离 files[].content，避免大文件内容撑爆 localStorage
        messages: Object.fromEntries(
          Object.entries(state.messages).map(([sid, msgs]) => [
            sid,
            msgs.map((m) =>
              m.files?.length
                ? {
                    ...m,
                    files: m.files.map((f) => ({ ...f, content: '' })),
                  }
                : m
            ),
          ])
        ),
        drafts: state.drafts
      }),
      // 恢复持久化数据后，将所有残留的 isStreaming:true 消息重置
      // 避免刷新前正在流式的消息在刷新后永久显示 loading 动画
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const cleaned: Record<string, ChatMessage[]> = {}
        for (const [sessionId, msgs] of Object.entries(state.messages)) {
          cleaned[sessionId] = msgs.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          )
        }
        state.messages = cleaned
        state.streamingSessionIds = {}
      }
    }
  )
)
