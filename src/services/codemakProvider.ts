/**
 * CodemakProvider — OpenCode 协议真实实现
 *
 * codemaker serve 是 OpenCode 服务，暴露的不是 OpenAI 兼容 API，
 * 而是 OpenCode 自有协议：
 *
 *   POST /session                          → 创建会话，返回 {id, ...}
 *   POST /session/{id}/prompt_async        → 发送消息（返回 204），异步执行
 *   GET  /event                            → 全局 SSE 总线，接收所有事件
 *
 * 流式文本通过 SSE 总线的 `message.part.updated` 事件下发：
 *   - `properties.part.type === "text"` 时，`properties.delta` 是本次增量文本
 *   - `properties.part.text` 是累计全量文本
 *
 * 完成信号：`message.updated` 事件且 `properties.info.time.completed` 存在
 */
import type { ChatProvider, SendMessageParams, QuestionAsked } from './chatProvider'
import { useSettingsStore } from '@/stores/useSettingsStore'

// ─── OpenCode REST API 工具函数 ───────────────────────────────────────────────

async function createSession(baseUrl: string): Promise<string> {
  const res = await fetch(`${baseUrl}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  if (!res.ok) throw new Error(`createSession failed: HTTP ${res.status}`)
  const data = (await res.json()) as { id: string }
  if (import.meta.env.DEV) console.log('[CodemakProvider] created session:', data.id)
  return data.id
}

async function sendPromptAsync(
  baseUrl: string,
  sessionID: string,
  text: string,
  modelID: string,
  providerID: string,
  agentID?: string
): Promise<void> {
  const requestBody: Record<string, unknown> = {
    parts: [{ type: 'text', text }],
    model: { providerID, modelID }
  }
  if (agentID) requestBody.agentID = agentID

  if (import.meta.env.DEV) {
    console.log(`[CodemakProvider] ▶ prompt_async sessionID=${sessionID} model=${providerID}/${modelID} agentID=${agentID ?? 'none'}`)
  }
  const res = await fetch(`${baseUrl}/session/${sessionID}/prompt_async`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`prompt_async failed: HTTP ${res.status} ${body}`)
  }
  if (import.meta.env.DEV) {
    console.log('[CodemakProvider] ✅ prompt_async accepted (204)')
  }
}

// ─── 解析 model 字段，提取 providerID 和 modelID ─────────────────────────────

function parseModel(model: string): { providerID: string; modelID: string } {
  // 格式：providerID/modelID，如 "netease-codemaker/claude-sonnet-4-6"
  const slashIdx = model.indexOf('/')
  if (slashIdx > 0) {
    return {
      providerID: model.slice(0, slashIdx),
      modelID: model.slice(slashIdx + 1)
    }
  }
  return { providerID: 'netease-codemaker', modelID: model }
}

// ─── 调试日志工具（写入文件，方便分析） ──────────────────────────────────────
function debugLog(msg: string): void {
  if (!import.meta.env.DEV) return
  console.log(msg)
  try {
    // 通过 fetch 把日志推到本地小端口，如果有的话
    // 直接写 localStorage 作为备选
    const key = '__sse_debug_log__'
    const prev = localStorage.getItem(key) || ''
    const ts = new Date().toISOString().slice(11, 23)
    localStorage.setItem(key, prev + `[${ts}] ${msg}\n`)
  } catch { /* ignore */ }
}

// ─── 全局 SSE 连接管理（单例，多次 sendMessage 复用） ─────────────────────────

type ChunkCallback = (accumulated: string) => void
type CompleteCallback = () => void
type ErrorCallback = (err: Error) => void

/** 等待特定 OpenCode session 产生的下一条 assistant 消息 ID */
interface PendingMessageIDWaiter {
  openCodeSessionID: string
  resolve: (messageID: string) => void
  reject: (err: Error) => void
  /** 已知的旧消息 ID，避免误匹配 */
  excludeID: string | null
}

interface ActiveStream {
  messageID: string
  /** 所属 OpenCode sessionID，用于 question.asked 精准匹配 */
  sessionID: string
  accumulated: string
  onChunk: ChunkCallback
  onComplete: CompleteCallback
  onError: ErrorCallback
  /** AI agent 提问时的回调，透传给上层 UI */
  onQuestion?: (question: QuestionAsked) => void
  aborted: boolean
  /**
   * question 等待期间设置为 true，保护 activeStream 不被 isFinalComplete 清理。
   * answerQuestion 后清除，让后续消息正常路由和完成。
   */
  waitingForAnswer: boolean
}

class OpenCodeSSEManager {
  private eventSource: EventSource | null = null
  private baseUrl = ''
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  /** messageID → 活跃流 */
  private activeStreams = new Map<string, ActiveStream>()

  /** 等待某个 session 的下一条 assistant messageID */
  private waiters: PendingMessageIDWaiter[] = []

  /** 确保 SSE 连接已建立 */
  ensureConnected(baseUrl: string): void {
    if (this.baseUrl !== baseUrl) {
      // baseUrl 变了，重新连接
      this.baseUrl = baseUrl
      this.eventSource?.close()
      this.eventSource = null
    }
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) return
    this.connect()
  }

  private connect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    try {
      const url = `${this.baseUrl}/event`
      if (import.meta.env.DEV) console.log('[OpenCodeSSE] connecting to', url)
      this.eventSource = new EventSource(url)

      this.eventSource.onmessage = (e) => {
        this.handleEvent(e.data as string)
      }

      this.eventSource.onerror = () => {
        if (import.meta.env.DEV) console.warn('[OpenCodeSSE] connection error, reconnecting in 2s')
        this.eventSource?.close()
        this.eventSource = null
        if (this.activeStreams.size > 0 || this.waiters.length > 0) {
          this.reconnectTimer = setTimeout(() => this.connect(), 2000)
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[OpenCodeSSE] EventSource error:', err)
    }
  }

  private handleEvent(raw: string): void {
    let evt: { type: string; properties: Record<string, unknown> }
    try {
      evt = JSON.parse(raw) as { type: string; properties: Record<string, unknown> }
    } catch {
      return
    }

    // 过滤心跳事件（每秒多次，打印只会刷屏干扰排查）
    if (evt.type === 'server.heartbeat') return

    if (import.meta.env.DEV) {
      // 打印所有非 delta 事件 + activeStreams 快照
      if (evt.type !== 'message.part.updated') {
        const streamSnapshot = Array.from(this.activeStreams.entries()).map(([id, s]) =>
          `${id.slice(0,8)}(sid=${s.sessionID?.slice(0,8)},aborted=${s.aborted},wait=${s.waitingForAnswer})`
        ).join(', ')
        debugLog(`[SSE] ${evt.type} ${JSON.stringify(evt.properties).slice(0, 300)}`)
        debugLog(`[SSE] streams(${this.activeStreams.size}): ${streamSnapshot || '(empty)'}`)
      }
    }

    if (evt.type === 'message.part.updated') {
      const props = evt.properties as {
        part: { id: string; sessionID: string; messageID: string; type: string; text?: string }
        delta?: string
      }
      const { part, delta } = props
      if (part.type === 'text' && typeof delta === 'string' && delta) {
        const stream = this.activeStreams.get(part.messageID)
        if (stream && !stream.aborted) {
          stream.accumulated += delta
          stream.onChunk(stream.accumulated)
        } else if (import.meta.env.DEV) {
          // delta 到达但找不到对应的 activeStream —— 这就是中断的直接原因
          console.warn('[OpenCodeSSE] ⚠️ UNROUTED delta! messageID =', part.messageID,
            'activeStreams keys:', Array.from(this.activeStreams.keys()).map(k => k.slice(0,8)))
        }
      }
    } else if (evt.type === 'message.updated') {
      const props = evt.properties as {
        info: {
          id: string
          sessionID: string
          role: string
          time: { created: number; completed?: number }
          finish?: string
        }
      }
      const { info } = props

      // 分发 waiter：有新的 assistant 消息出现（无论是否完成）
      if (info.role === 'assistant' && this.waiters.length > 0) {
        const matchIdx = this.waiters.findIndex(
          (w) => w.openCodeSessionID === info.sessionID && w.excludeID !== info.id
        )
        if (matchIdx >= 0) {
          const waiter = this.waiters.splice(matchIdx, 1)[0]
          waiter.resolve(info.id)
        }
      }

      // tool-calls 后的后续 assistant 消息：把新 messageID 映射到同一个 activeStream
      // 这样后续消息的 delta 也能追加到同一个 UI 气泡里
      if (
        info.role === 'assistant' &&
        info.time.created &&
        !info.time.completed
      ) {
        // 找同一个 session 下正在活跃的 stream（可能是前一条 tool-calls 消息遗留的）
        for (const [existingMsgID, stream] of this.activeStreams.entries()) {
          if (existingMsgID !== info.id && !stream.aborted) {
            // 把新 messageID 也注册到同一个 stream，让后续 delta 能正确路由
            if (!this.activeStreams.has(info.id)) {
              if (import.meta.env.DEV) {
                console.log('[OpenCodeSSE] routing new assistant msg to existing stream:', info.id, '→', existingMsgID)
              }
              this.activeStreams.set(info.id, stream)
            }
            break
          }
        }
      }

      // 流完成：有 completed 时间戳 且 finish 不是 tool-calls
      // finish=tool-calls 表示 AI 调用了工具，还有后续消息，不能在此触发 onComplete
      const isFinalComplete =
        info.time.completed &&
        info.role === 'assistant' &&
        info.finish !== 'tool-calls'

      if (isFinalComplete) {
        const stream = this.activeStreams.get(info.id)
        if (stream && !stream.aborted) {
          if (stream.waitingForAnswer) {
            debugLog(`[SSE] ⏸ complete DEFERRED (waitingForAnswer) msgId=${info.id.slice(0,8)} finish=${info.finish}`)
          } else {
            debugLog(`[SSE] ✅ complete msgId=${info.id.slice(0,8)} finish=${info.finish} len=${stream.accumulated.length}`)
            this.activeStreams.delete(info.id)
            stream.onComplete()
          }
        } else {
          debugLog(`[SSE] ℹ️ complete but no active stream for msgId=${info.id.slice(0,8)} finish=${info.finish}`)
        }
      }
    } else if (evt.type === 'question.asked') {
      // AI agent 向用户提问，需要用户选择或输入答案才能继续
      const props = evt.properties as {
        id: string
        sessionID: string
        questions: Array<{
          question: string
          header?: string
          options?: Array<{ label: string; description?: string }>
        }>
        tool: { messageID: string; callID: string }
      }

      if (import.meta.env.DEV) {
        console.log('[OpenCodeSSE] question.asked, id =', props.id, 'sessionID =', props.sessionID)
      }

      const question: QuestionAsked = {
        id: props.id,
        sessionID: props.sessionID,
        questions: props.questions,
        tool: props.tool,
      }

      // 找到对应 session 下活跃的流，触发 onQuestion 回调
      // 按 sessionID 精准匹配，避免多会话场景下错误路由
      for (const stream of this.activeStreams.values()) {
        if (!stream.aborted && stream.sessionID === props.sessionID && stream.onQuestion) {
          // 设置保护标志：question 等待期间不允许 isFinalComplete 清理 activeStream
          stream.waitingForAnswer = true
          stream.onQuestion(question)
          break
        }
      }
    }
  }

  /** 等待指定 OpenCode session 产生下一条 assistant 消息，返回 messageID */
  waitForNextAssistantMessage(
    openCodeSessionID: string,
    excludeID: string | null,
    signal: AbortSignal
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const waiter: PendingMessageIDWaiter = { openCodeSessionID, resolve, reject, excludeID }
      this.waiters.push(waiter)

      const cleanup = () => {
        const idx = this.waiters.indexOf(waiter)
        if (idx >= 0) this.waiters.splice(idx, 1)
      }

      signal.addEventListener('abort', () => {
        cleanup()
        reject(new Error('aborted'))
      })
    })
  }

  /** 注册活跃流，开始接收 delta */
  registerStream(stream: ActiveStream): void {
    this.activeStreams.set(stream.messageID, stream)
  }

  /** 中止指定流 */
  abortStream(messageID: string): void {
    const stream = this.activeStreams.get(messageID)
    if (stream) {
      stream.aborted = true
      this.activeStreams.delete(messageID)
    }
  }

  /** 全量清理（stopGeneration 时调用） */
  abortAll(): void {
    for (const stream of this.activeStreams.values()) {
      stream.aborted = true
    }
    this.activeStreams.clear()
    for (const waiter of this.waiters) {
      waiter.reject(new Error('aborted'))
    }
    this.waiters = []
  }

  /**
   * 用户回答 question 后调用：清除指定 session 的 waitingForAnswer 保护标志，
   * 让后续的 isFinalComplete 逻辑能正常触发 onComplete。
   */
  clearWaitingForAnswer(sessionID: string): void {
    let found = false
    for (const [msgId, stream] of this.activeStreams.entries()) {
      if (stream.sessionID === sessionID && stream.waitingForAnswer) {
        stream.waitingForAnswer = false
        found = true
        debugLog(`[SSE] clearWaitingForAnswer msgId=${msgId.slice(0,8)} session=${sessionID.slice(0,8)}`)
      }
    }
    if (!found) {
      debugLog(`[SSE] ⚠️ clearWaitingForAnswer: NO stream for session=${sessionID.slice(0,8)} streams=${
        Array.from(this.activeStreams.entries()).map(([id, s]) =>
          `${id.slice(0,8)}(sid=${s.sessionID?.slice(0,8)},wait=${s.waitingForAnswer})`
        ).join(',')
      }`)
    }
  }
}

// 单例 SSE 管理器
const sseManager = new OpenCodeSSEManager()

// ─── App Session → OpenCode Session 映射（内存级，进程内有效） ─────────────────

/**
 * appSessionId → { openCodeSessionId, model }
 *
 * 记录每个 app 会话当前绑定的 OpenCode session 及其使用的模型。
 * 当用户切换模型时，若 model 不一致，则废弃旧 OpenCode session，
 * 强制为下一次发消息重新创建新 session（保证模型切换生效）。
 */
interface SessionEntry {
  openCodeSessionId: string
  model: string
  agentID: string
  /** 该 OpenCode session 最后一条 assistant 消息 ID，用于 waiter excludeID，避免重推旧消息误匹配 */
  lastAssistantMessageId: string | null
}
const sessionMap = new Map<string, SessionEntry>() // appSessionId → SessionEntry

/**
 * 预热 Provider：端口就绪后立即
 *   1. 建立 SSE 长连接
 *   2. 预创建一个全局默认 OpenCode session（存入 warmSession），
 *      首次发消息时直接复用，省去串行 HTTP 建链时间
 */
const WARM_SESSION_KEY = '__warm__'
let warmSessionReady = false

export async function warmUpProvider(port: number): Promise<void> {
  const baseUrl = `http://127.0.0.1:${port}`
  if (import.meta.env.DEV) console.log('[CodemakProvider] warmUp baseUrl =', baseUrl)

  // 1. 建立 SSE 连接
  sseManager.ensureConnected(baseUrl)

  // 2. 预创建 OpenCode session 备用
  try {
    const sessionId = await createSession(baseUrl)
    sessionMap.set(WARM_SESSION_KEY, {
      openCodeSessionId: sessionId,
      model: '',       // model 未定，首次发消息时会按需更新
      agentID: '',
      lastAssistantMessageId: null,
    })
    warmSessionReady = true
    if (import.meta.env.DEV) console.log('[CodemakProvider] warm session ready:', sessionId)
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[CodemakProvider] warmUp session failed:', e)
  }
}

/**
 * 模型切换时：
 * 清空指定会话（或全部）的 sessionMap 映射，确保下次对话使用新 session。
 * 不再调用 sseManager.abortAll()，避免影响其他会话的流式输出。
 *
 * 由 useModelStore.setCurrentModel 调用。
 */
export function clearSessionMapOnModelChange(currentAppSessionId?: string): void {
  if (import.meta.env.DEV) {
    console.log('[CodemakProvider] model changed, clearing sessionMap (entries:', sessionMap.size, ') targetSession:', currentAppSessionId ?? 'all')
  }
  if (currentAppSessionId) {
    sessionMap.delete(currentAppSessionId)
  } else {
    sessionMap.clear()
  }
}

// ─── CodemakProvider 实现 ─────────────────────────────────────────────────────

  export class CodemakProvider implements ChatProvider {
  sendMessage(params: SendMessageParams): () => void {
    const { content, sessionId, model, agentID, onChunk, onComplete, onError, onQuestion } = params

    // 每次发消息时实时读取端口，确保 serve 重启后端口变化能被感知
    const port = useSettingsStore.getState().servePort ?? 4000
    const baseUrl = `http://127.0.0.1:${port}`

    if (import.meta.env.DEV) {
      console.log(`[CodemakProvider] sendMessage model=${model} baseUrl=${baseUrl}`)
      console.log('[CodemakProvider] content preview =', content.slice(0, 80))
    }

    const { providerID, modelID } = parseModel(model)

    const abortController = new AbortController()
    const { signal } = abortController
    let pendingMessageID: string | null = null

    const run = async (): Promise<void> => {
      const t0 = Date.now()
      // 0. 实时读取端口
      const resolvedPort = useSettingsStore.getState().servePort ?? 4000
      const resolvedBaseUrl = `http://127.0.0.1:${resolvedPort}`

      // 1. 确保 SSE 连接
      sseManager.ensureConnected(resolvedBaseUrl)

      // 2. 获取或创建 OpenCode Session（只有 model 变了才废弃旧 session）
      const existingEntry = sessionMap.get(sessionId)
      const resolvedAgentID = agentID ?? ''
      const needNewSession = !existingEntry || existingEntry.model !== model

      let openCodeSessionID: string
      let excludeID: string | null

      if (needNewSession) {
        try {
          // 优先复用预热 session（省去串行 HTTP 建链时间）
          const warmEntry = warmSessionReady ? sessionMap.get(WARM_SESSION_KEY) : null
          if (warmEntry) {
            openCodeSessionID = warmEntry.openCodeSessionId
            sessionMap.delete(WARM_SESSION_KEY)
            warmSessionReady = false
            if (import.meta.env.DEV) console.log(`[CodemakProvider] ⚡ warm session +${Date.now()-t0}ms`)
            void warmUpProvider(resolvedPort).catch(() => {})
          } else {
            if (import.meta.env.DEV) console.log(`[CodemakProvider] creating session...`)
            openCodeSessionID = await createSession(resolvedBaseUrl)
            if (import.meta.env.DEV) console.log(`[CodemakProvider] ✅ session created +${Date.now()-t0}ms`)
          }
          sessionMap.set(sessionId, {
            openCodeSessionId: openCodeSessionID,
            model,
            agentID: resolvedAgentID,
            lastAssistantMessageId: null
          })
          excludeID = null
        } catch (err) {
          if (signal.aborted) return
          onError?.(err instanceof Error ? err : new Error(String(err)))
          onComplete()
          return
        }
      } else {
        openCodeSessionID = existingEntry!.openCodeSessionId
        excludeID = existingEntry!.lastAssistantMessageId
        if (import.meta.env.DEV) console.log(`[CodemakProvider] ♻️ reuse session +${Date.now()-t0}ms`)
      }

      if (signal.aborted) return

      // 3. 构建用户消息文本（system prompt 拼在最前）
      const { systemPrompt } = params
      const fullText = systemPrompt
        ? `[系统提示]\n${systemPrompt}\n\n[用户]\n${content}`
        : content

      // 4. 在发消息前，先注册等待器，监听新 assistant 消息出现
      //    waiter 必须在 prompt_async 之前注册，防止消息来得太快被漏掉
      if (import.meta.env.DEV) {
        console.log('[CodemakProvider] registering waiter, excludeID =', excludeID)
      }

      const messageIDPromise = sseManager.waitForNextAssistantMessage(
        openCodeSessionID,
        excludeID,
        signal
      )

      if (signal.aborted) return

      // 5. 发送消息
      if (import.meta.env.DEV) console.log(`[CodemakProvider] prompt_async start +${Date.now()-t0}ms`)
      try {
        await sendPromptAsync(resolvedBaseUrl, openCodeSessionID, fullText, modelID, providerID, resolvedAgentID || undefined)
        if (import.meta.env.DEV) console.log(`[CodemakProvider] prompt_async done +${Date.now()-t0}ms`)
      } catch (err) {
        if (signal.aborted) return
        onError?.(err instanceof Error ? err : new Error(String(err)))
        onComplete()
        return
      }

      if (signal.aborted) return

      // 6. 等待 assistant 消息 ID（最多 10 秒）
      let messageID: string
      try {
        messageID = await Promise.race([
          messageIDPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('等待 AI 响应超时（10s）')), 10000)
          )
        ])
        if (import.meta.env.DEV) console.log(`[CodemakProvider] got messageID +${Date.now()-t0}ms`)
      } catch (err) {
        if (signal.aborted) return
        abortController.abort()
        if (err instanceof Error && err.message === 'aborted') {
          onComplete()
          return
        }
        onError?.(err instanceof Error ? err : new Error(String(err)))
        onComplete()
        return
      }

      if (signal.aborted) return

      pendingMessageID = messageID

      // 更新 sessionMap 中 lastAssistantMessageId，供下一轮 excludeID 使用
      const entryToUpdate = sessionMap.get(sessionId)
      if (entryToUpdate) {
        entryToUpdate.lastAssistantMessageId = messageID
      }

      // 7. 注册活跃流，接收后续 delta
      let firstChunk = true
      sseManager.registerStream({
        messageID,
        sessionID: openCodeSessionID,
        accumulated: '',
        onChunk: (acc) => {
          if (import.meta.env.DEV && firstChunk) {
            firstChunk = false
            console.log(`[CodemakProvider] 🚀 first delta +${Date.now()-t0}ms`)
          }
          onChunk(acc)
        },
        onComplete: () => {
          if (import.meta.env.DEV) console.log(`[CodemakProvider] ✅ complete +${Date.now()-t0}ms`)
          if (!signal.aborted) onComplete()
        },
        onError: (err) => {
          if (!signal.aborted) {
            onError?.(err)
            onComplete()
          }
        },
        onQuestion: onQuestion,
        aborted: false,
        waitingForAnswer: false
      })
    }

    run().catch((err) => {
      if (!signal.aborted) {
        if (import.meta.env.DEV) console.error('[CodemakProvider] run() error:', err)
        onError?.(err instanceof Error ? err : new Error(String(err)))
        onComplete()
      }
    })

    return () => {
      abortController.abort()
      if (pendingMessageID) {
        sseManager.abortStream(pendingMessageID)
      }
    }
  }

  stopGeneration(): void {
    sseManager.abortAll()
  }

  /**
   * 回答 AI agent 的提问
   *
   * OpenCode 协议：POST /question/{requestID}/reply
   * body: { answers: [["label1", "label2"]] }
   *
   * @param answers 选中的答案数组（单选时长度为 1，多选时多个）
   */
  async answerQuestion(sessionID: string, questionId: string, answers: string[]): Promise<void> {
    const port = useSettingsStore.getState().servePort ?? 4000
    const baseUrl = `http://127.0.0.1:${port}`
    debugLog(`[CodemakProvider] answerQuestion questionId=${questionId} answers=${JSON.stringify(answers)}`)

    // 提交答案前先清除 waitingForAnswer 保护标志
    sseManager.clearWaitingForAnswer(sessionID)

    // 构造 answers：二维数组，每个 question 对应一个选项数组
    const body = { answers: [answers] }

    const res = await fetch(`${baseUrl}/question/${questionId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const respBody = await res.text().catch(() => '')
      throw new Error(`answerQuestion failed: HTTP ${res.status} ${respBody}`)
    }
    debugLog(`[CodemakProvider] ✅ answerQuestion accepted`)
  }

  /**
   * 拒绝/取消 AI agent 的提问
   *
   * OpenCode 协议：POST /question/{requestID}/reject
   */
  async rejectQuestion(questionId: string): Promise<void> {
    const port = useSettingsStore.getState().servePort ?? 4000
    const baseUrl = `http://127.0.0.1:${port}`
    debugLog(`[CodemakProvider] rejectQuestion questionId=${questionId}`)

    const res = await fetch(`${baseUrl}/question/${questionId}/reject`, {
      method: 'POST'
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`rejectQuestion failed: HTTP ${res.status} ${body}`)
    }
    debugLog(`[CodemakProvider] ✅ rejectQuestion accepted`)
  }
}
