/**
 * useAITodoAnalysis — 两轮对话方式实现 AI 任务规划
 *
 * Round 1: 发送用户任务 → AI 输出 JSON 格式的澄清问题
 *          前端解析 JSON → 渲染选择卡片
 * Round 2: 用户完成所有选择 → 拼入答案发送 → AI 输出执行计划 checklist
 *
 * 架构说明：
 * - stopCleanupRef 使用模块级单例，避免多组件实例化时 cleanup 不共享的问题
 * - Round2 强制生成新 sessionId，避免复用 Round1 session 导致上下文污染
 */
import { useCallback, useEffect } from 'react'
import { message as antMessage } from 'antd'
import { getProvider } from '@/services/providerFactory'
import { useModelStore, DEFAULT_MODEL } from '@/stores/useModelStore'
import { useTodoPageStore } from '../store/useTodoPageStore'
import type { AIQuestion } from '../store/useTodoPageStore'

const ROUND1_PROMPT = (task: string) =>
  `针对以下任务，生成3个关键澄清问题帮助制定执行计划。

输出格式：JSON数组，每项包含 header（问题标题，5字内）、question（完整问题描述）、options（选项数组，每项有label（10字内）和description（一句话说明））。
只输出JSON，不要其他任何文字。

任务：${task}`

const ROUND2_PROMPT = (task: string, questions: AIQuestion[], answers: Record<number, string>) => {
  const qa = questions.map((q, i) => `${q.header}：${answers[i] ?? '未指定'}`).join('\n')
  return `你是任务规划专家。根据以下任务和用户已确认的信息，直接输出执行计划清单，然后展开详细说明。

用户任务：${task}

已确认信息：
${qa}

清单格式（必须放在回复最开头）：
- [ ] 子任务描述

要求：8~15 个子任务，粒度适中。`
}

function extractQuestions(text: string): AIQuestion[] | null {
  // 尝试匹配 JSON 数组格式：[{...}]
  const arrayMatch = text.match(/\[[\s\S]*"header"[\s\S]*\]/)
  // 尝试匹配对象包裹格式：{"questions":[...]}
  const objMatch = text.match(/\{[\s\S]*"questions"[\s\S]*\}/)

  const candidates = [arrayMatch?.[0], objMatch?.[0]].filter(Boolean) as string[]

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      // 数组格式
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
        return parsed as AIQuestion[]
      }
      // 对象包裹格式
      if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed.questions as AIQuestion[]
      }
    } catch { /* 继续尝试下一个 */ }
  }
  return null
}

// ─── 模块级单例：确保多个组件实例共享同一个 cleanup 引用 ─────────────────────
// 解决 TaskInput 和 QuestionCards 各自实例化 hook 时 stopCleanupRef 不共享的问题
let moduleStopCleanup: (() => void) | null = null

function setModuleCleanup(fn: (() => void) | null) {
  moduleStopCleanup = fn
}

function callModuleCleanup() {
  moduleStopCleanup?.()
  moduleStopCleanup = null
}

export function useAITodoAnalysis() {
  const {
    taskInput,
    setAiOutput,
    setIsStreaming,
    setPhase,
    setQuestions,
    parseTodosFromMarkdown,
    resetResult
  } = useTodoPageStore()

  // 页面卸载时清理，仅在最顶层组件（TodoPage）有效
  useEffect(() => {
    return () => {
      callModuleCleanup()
    }
  }, [])

  const startPlanning = useCallback((
    task: string,
    qs: AIQuestion[],
    ans: Record<number, string>
  ) => {
    setIsStreaming(true)
    setPhase('planning')
    setAiOutput('')

    // Round2 强制刷新 sessionId，避免复用 Round1 的 OpenCode session
    // Round1 的 session 里有 JSON 问题历史，会干扰 Round2 的 checklist 输出
    const sessionId = useTodoPageStore.getState().refreshSessionId()
    const provider = getProvider()
    const model = useModelStore.getState().currentModel || DEFAULT_MODEL
    let hasErrored = false

    setModuleCleanup(provider.sendMessage({
      content: ROUND2_PROMPT(task, qs, ans),
      sessionId,
      messages: [],
      model,
      onChunk: (accumulated) => {
        setAiOutput(accumulated)
        parseTodosFromMarkdown(accumulated, true)
      },
      onComplete: () => {
        setIsStreaming(false)
        setModuleCleanup(null)
        setPhase('idle')
        if (!hasErrored) {
          const finalOutput = useTodoPageStore.getState().aiOutput
          parseTodosFromMarkdown(finalOutput, false)
        }
      },
      onError: (err) => {
        hasErrored = true
        setIsStreaming(false)
        setModuleCleanup(null)
        setPhase('idle')
        antMessage.error(`生成执行计划失败：${err.message}`)
      }
    }))
  }, [setAiOutput, setIsStreaming, setPhase, parseTodosFromMarkdown])

  const startAnalysis = useCallback(() => {
    const content = taskInput.trim()
    if (!content) {
      antMessage.warning('请先输入要分析的任务描述')
      return
    }

    resetResult()
    setIsStreaming(true)
    setPhase('questioning')

    const sessionId = useTodoPageStore.getState().sessionId
    const provider = getProvider()
    const model = useModelStore.getState().currentModel || DEFAULT_MODEL
    let accumulated = ''

    setModuleCleanup(provider.sendMessage({
      content: ROUND1_PROMPT(content),
      sessionId,
      messages: [],
      model,
      onChunk: (text) => {
        accumulated = text
        // Round1 不把 JSON 显示到左侧（避免用户看到原始 JSON）
        // 只在内存中累积
      },
      onComplete: () => {
        setIsStreaming(false)
        setModuleCleanup(null)
        const parsed = extractQuestions(accumulated)
        if (parsed) {
          setQuestions(parsed)
          setPhase('answering')
          setAiOutput('')
        } else {
          antMessage.warning('未能解析问题，直接生成执行计划')
          startPlanning(content, [], {})
        }
      },
      onError: (err) => {
        setIsStreaming(false)
        setModuleCleanup(null)
        setPhase('idle')
        antMessage.error(`AI 分析失败：${err.message}`)
      }
    }))
  }, [taskInput, setAiOutput, setIsStreaming, setPhase, setQuestions, resetResult, startPlanning])

  const submitAnswers = useCallback(() => {
    const state = useTodoPageStore.getState()
    startPlanning(state.taskInput, state.questions, state.answers)
  }, [startPlanning])

  const stopAnalysis = useCallback(() => {
    callModuleCleanup()
    getProvider().stopGeneration()
    setIsStreaming(false)
    setPhase('idle')
  }, [setIsStreaming, setPhase])

  return { startAnalysis, submitAnswers, stopAnalysis }
}
