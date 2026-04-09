/**
 * Direct Provider — 真实 OpenAI 兼容 API 实现
 *
 * 通过标准的 OpenAI 兼容接口（/chat/completions）调用任意支持该协议的 AI 服务。
 * 支持 SSE 流式响应解析（text/event-stream）。
 */
import type { ChatProvider, SendMessageParams } from './chatProvider'
import type { ChatMessage } from '@/types'
import { useSettingsStore } from '@/stores/useSettingsStore'

// ─── SSE 流式解析 ──────────────────────────────────────────────────────────────

/**
 * 解析 OpenAI 兼容的 SSE 流式响应
 *
 * 数据格式示例：
 *   data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}
 *   data: {"choices":[{"delta":{},"finish_reason":"stop"}]}
 *   data: [DONE]
 */
function parseSSELine(
  line: string,
  accumulated: string
): { text: string; done: boolean; error?: Error } {
  if (!line.startsWith('data: ')) {
    return { text: accumulated, done: false }
  }

  const dataStr = line.slice(6).trim()

  // 结束标志
  if (dataStr === '[DONE]') {
    return { text: accumulated, done: true }
  }

  try {
    const json = JSON.parse(dataStr) as {
      choices?: Array<{
        delta?: { content?: string }
        finish_reason?: string | null
      }>
      error?: { message?: string; type?: string }
    }

    // 错误处理
    if (json.error) {
      return {
        text: accumulated,
        done: true,
        error: new Error(json.error.message ?? json.error.type ?? 'API error')
      }
    }

    const choice = json.choices?.[0]
    if (!choice) {
      return { text: accumulated, done: false }
    }

    // 提取文本增量
    const content = choice.delta?.content ?? ''
    const newText = accumulated + content

    // 检查是否完成
    const done = choice.finish_reason !== null && choice.finish_reason !== undefined

    return { text: newText, done }
  } catch {
    // JSON 解析失败，忽略
    return { text: accumulated, done: false }
  }
}

// ─── 构建消息体 ────────────────────────────────────────────────────────────────

function buildMessages(
  historyMessages: ChatMessage[],
  currentContent: string,
  systemPrompt?: string
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = []

  // System prompt（如果有）
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  // 历史消息
  for (const msg of historyMessages) {
    const role = msg.role === 'user' ? 'user' : 'assistant'
    // 只取文本内容，忽略工具调用等复杂结构
    let content = ''
    if (typeof msg.content === 'string') {
      content = msg.content
    } else if (Array.isArray(msg.content as any)) {
      content = (msg.content as any)
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n')
    }
    if (content) {
      messages.push({ role, content })
    }
  }

  // 当前用户消息
  messages.push({ role: 'user', content: currentContent })

  return messages
}

// ─── 读取设置 ──────────────────────────────────────────────────────────────────

function getDirectConfig() {
  const state = useSettingsStore.getState()
  let baseUrl = state.apiBaseUrl.trim()
  const apiKey = state.apiKey.trim()

  // 规范化 base URL：去掉尾部斜杠
  baseUrl = baseUrl.replace(/\/+$/, '')

  // 默认使用 OpenAI 端点
  if (!baseUrl) {
    baseUrl = 'https://api.openai.com/v1'
  }

  // 获取模型名称
  const models = state.customModels
  const model = models.length > 0 ? models[models.length - 1] : 'gpt-4o'

  return { baseUrl, apiKey, model }
}

// ─── DirectProvider 实现 ───────────────────────────────────────────────────────

export class DirectProvider implements ChatProvider {
  private activeAbortControllers = new Set<AbortController>()

  /**
   * 发送消息 — 真实 HTTP 调用
   */
  sendMessage(params: SendMessageParams): () => void {
    const { content, messages: historyMessages, model: overrideModel, systemPrompt, onChunk, onComplete, onError } = params
    const { baseUrl, apiKey, model: defaultModel } = getDirectConfig()
    const model = overrideModel || defaultModel

    if (import.meta.env.DEV) {
      console.log(`[DirectProvider] sendMessage model=${model} baseUrl=${baseUrl}`)
      console.log('[DirectProvider] content preview =', content.slice(0, 80))
    }

    const abortController = new AbortController()
    this.activeAbortControllers.add(abortController)

    const run = async (): Promise<void> => {
      try {
        // 构建消息体
        const messages = buildMessages(historyMessages, content, systemPrompt)

        // 发起请求
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true
          }),
          signal: abortController.signal
        })

        if (!res.ok) {
          const errorBody = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status}: ${errorBody}`)
        }

        // 检查响应类型
        const contentType = res.headers.get('content-type') ?? ''
        const isSSE = contentType.includes('text/event-stream')

        if (!isSSE) {
          // 非流式响应（降级处理）
          const json = await res.json() as any
          const text = json.choices?.[0]?.message?.content ?? ''
          onChunk(text)
          onComplete()
          return
        }

        // SSE 流式解析
        const reader = res.body?.getReader()
        if (!reader) {
          throw new Error('Response body is not readable')
        }

        const decoder = new TextDecoder()
        let accumulated = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (abortController.signal.aborted) break

          buffer += decoder.decode(value, { stream: true })

          // 按行处理
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? '' // 最后一行可能不完整，留到下次

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith(':')) continue // 跳过空行和注释

            const result = parseSSELine(trimmed, accumulated)
            accumulated = result.text

            if (result.error) {
              if (!abortController.signal.aborted) {
                onError?.(result.error)
              }
              onComplete()
              return
            }

            if (result.done) {
              onChunk(accumulated)
              onComplete()
              return
            }

            // 输出增量
            onChunk(accumulated)
          }
        }

        // 流结束但未收到 [DONE]
        onChunk(accumulated)
        onComplete()
      } catch (err) {
        if (abortController.signal.aborted) {
          onComplete()
          return
        }
        const error = err instanceof Error ? err : new Error(String(err))
        onError?.(error)
        onComplete()
      } finally {
        this.activeAbortControllers.delete(abortController)
      }
    }

    run()

    // 返回取消函数
    return () => this.stopGeneration()
  }

  /**
   * 停止生成
   */
  stopGeneration(): void {
    for (const controller of this.activeAbortControllers) {
      controller.abort()
    }
    this.activeAbortControllers.clear()
  }

  /**
   * 中止指定会话（Direct 模式无 session 概念，noop）
   */
  async abortSession(_appSessionId: string): Promise<void> {
    this.stopGeneration()
  }

  /**
   * 回答问题（Direct 模式不支持，noop）
   */
  async answerQuestion(_sessionID: string, _questionId: string, _answers: string[]): Promise<void> {
    if (import.meta.env.DEV) {
      console.log('[DirectProvider] answerQuestion (not supported in direct mode)')
    }
  }

  /**
   * 拒绝问题（Direct 模式不支持，noop）
   */
  async rejectQuestion(_questionId: string): Promise<void> {
    if (import.meta.env.DEV) {
      console.log('[DirectProvider] rejectQuestion (not supported in direct mode)')
    }
  }
}
