/**
 * useAIAgentGeneration — 两轮对话生成 Agent 配置
 *
 * 复用 CodemakProvider (OpenCode 协议) 的真实 AI 调用链路。
 * 架构参照 src/pages/Skills/hooks/useAISkillGeneration.ts
 *
 * Round 1: 用户输入描述 → AI 输出 JSON 格式澄清问题 → 前端解析渲染选择卡片
 * Round 2: 用户回答所有问题 → AI 输出 Agent JSON → 前端解析填入表单
 */
import { useCallback, useEffect } from 'react'
import { message as antMessage } from 'antd'
import { getProvider } from '@/services/providerFactory'
import { useModelStore, DEFAULT_MODEL } from '@/stores/useModelStore'
import { useAgentGenerateStore } from '../store/useAgentGenerateStore'
import type { Agent } from '@/types'
import type { AIQuestion } from '@/utils/aiJsonParser'
import {
  stripCodeBlock,
  safeJsonParse,
  extractJsonBlock,
  extractQuestions,
} from '@/utils/aiJsonParser'

// ─── 合法工具名集合（用于校验 AI 输出） ────────────────────────────────────

const VALID_TOOLS = new Set([
  'bash', 'read', 'write', 'edit', 'glob', 'grep',
  'list', 'webfetch', 'task', 'todowrite', 'todoread',
])

// ─── Prompts ────────────────────────────────────────────────────────────────

const ROUND1_PROMPT = (desc: string) =>
  `针对以下 Agent 描述，生成3个关键澄清问题帮助精确定义这个 Agent 的配置。

问题应聚焦于：
1. Agent 的核心角色定位和具体使用场景（代码审查、测试、文档生成、部署、通用助手等）
2. Agent 需要具备哪些工具能力（文件读写、shell 执行、网页抓取、子 agent 调度等）
3. Agent 的行为模式偏好（自主执行 vs 逐步确认、主 agent vs 子 agent、是否需要特定工作流程）

输出格式：JSON数组，每项包含 header（问题标题，5字内）、question（完整问题描述）、options（选项数组，每项有 label（10字内）和 description（一句话说明））。
如果某个问题允许多选（用户可能同时选择多个选项），则在该问题对象中加上 "multiple": true，否则不需要加。
每个问题提供3-4个选项。只输出JSON，不要其他任何文字。

Agent 描述：${desc}`

const ROUND2_PROMPT = (desc: string, questions: AIQuestion[], answers: Record<number, string | string[]>) => {
  const qa = questions.map((q, i) => {
    const a = answers[i]
    const display = Array.isArray(a) ? a.join('、') : (a ?? '未指定')
    return `${q.header}：${display}`
  }).join('\n')
  return `你是 Agent 配置生成专家。根据以下描述和用户已确认的信息，生成一个完整的 Agent 配置。

用户描述：${desc}

已确认信息：
${qa}

输出严格 JSON 对象（只输出纯 JSON，不要 markdown 代码块包裹，不要其他文字）：
{
  "name": "英文名称（简短易读，如 Code Reviewer、Test Helper，不超过50字符）",
  "emoji": "一个贴切的表情符号（如 🔍、🧪、📝）",
  "description": "简短功能描述（中文，一句话概括 Agent 的能力和触发时机，不超过200字）",
  "systemPrompt": "完整的系统提示词（中文 Markdown 格式，定义 Agent 的角色、行为规范和工作流程，不少于200字）",
  "mode": "primary 或 subagent 或 all（根据使用场景选择）",
  "tools": ["bash", "read", "write", "edit", "glob", "grep", "list", "webfetch", "task", "todowrite", "todoread"],
  "autoMode": false
}

要求：
- name 必须简短有意义，便于识别
- emoji 必须贴合 Agent 的角色特征
- systemPrompt 必须是高质量的角色定义，包含明确的工作流程和行为规范
- tools 数组只能包含以下合法值：bash, read, write, edit, glob, grep, list, webfetch, task, todowrite, todoread
- tools 应根据 Agent 角色合理选择，不必全选
- mode 根据使用场景选择：primary（用户直接调用）、subagent（只被其他 agent 调用）、all（两者均可）
- autoMode 根据 Agent 是否需要自主执行决定（true=自动执行不需确认，false=每步需确认）`
}

// ─── Agent 特有的 JSON 提取 ─────────────────────────────────────────────────

/** 从 AI 输出中提取 Agent JSON */
function extractAgent(text: string): Partial<Agent> | null {
  const candidates = [text, stripCodeBlock(text)]
  for (const source of candidates) {
    const objJson = extractJsonBlock(source, '{')
    if (!objJson) continue
    try {
      const parsed = safeJsonParse(objJson) as Record<string, unknown>
      if (typeof parsed.name !== 'string' || !parsed.name) continue

      // 校验并过滤 tools
      const rawTools = Array.isArray(parsed.tools) ? (parsed.tools as string[]) : []
      const validTools = rawTools.filter((t) => VALID_TOOLS.has(t))
      const toolsRecord: Record<string, boolean> = Object.fromEntries(
        [...VALID_TOOLS].map((t) => [t, validTools.includes(t)])
      )

      // 校验 mode
      const validModes = new Set(['primary', 'subagent', 'all'])
      const mode = validModes.has(parsed.mode as string)
        ? (parsed.mode as Agent['mode'])
        : 'primary'

      return {
        name: parsed.name as string,
        emoji: (parsed.emoji as string) || '🤖',
        description: (parsed.description as string) || '',
        systemPrompt: (parsed.systemPrompt as string) || '',
        mode,
        tools: toolsRecord,
        autoMode: typeof parsed.autoMode === 'boolean' ? parsed.autoMode : false,
      }
    } catch { /* 继续 */ }
  }
  return null
}

// ─── 模块级单例 cleanup ─────────────────────────────────────────────────────

let moduleStopCleanup: (() => void) | null = null

function setModuleCleanup(fn: (() => void) | null) {
  moduleStopCleanup = fn
}

function callModuleCleanup() {
  moduleStopCleanup?.()
  moduleStopCleanup = null
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAIAgentGeneration() {
  const {
    setAiOutput,
    setIsStreaming,
    setPhase,
    setQuestions,
    setGeneratedAgent,
  } = useAgentGenerateStore()

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      callModuleCleanup()
    }
  }, [])

  /** Round 2: 根据问题答案生成 Agent JSON */
  const startGenerating = useCallback((
    desc: string,
    qs: AIQuestion[],
    ans: Record<number, string | string[]>
  ) => {
    setIsStreaming(true)
    setPhase('generating')
    setAiOutput('')

    const sessionId = useAgentGenerateStore.getState().refreshSessionId()
    const provider = getProvider()
    const model = useModelStore.getState().currentModel || DEFAULT_MODEL
    let hasErrored = false

    setModuleCleanup(provider.sendMessage({
      content: ROUND2_PROMPT(desc, qs, ans),
      sessionId,
      messages: [],
      model,
      onChunk: (accumulated) => {
        setAiOutput(accumulated)
      },
      onComplete: () => {
        setIsStreaming(false)
        setModuleCleanup(null)
        if (!hasErrored) {
          const finalOutput = useAgentGenerateStore.getState().aiOutput
          const agent = extractAgent(finalOutput)
          if (agent) {
            setGeneratedAgent(agent)
            setPhase('done')
          } else {
            antMessage.error('未能解析生成结果，请重新描述或调整回答')
            setPhase('answering')
          }
        }
      },
      onError: (err) => {
        hasErrored = true
        setIsStreaming(false)
        setModuleCleanup(null)
        setPhase('answering')
        antMessage.error(`生成 Agent 失败：${err.message}`)
      }
    }))
  }, [setAiOutput, setIsStreaming, setPhase, setGeneratedAgent])

  /** Round 1: 发送描述，获取澄清问题 */
  const startAnalysis = useCallback(() => {
    const content = useAgentGenerateStore.getState().userInput.trim()
    if (!content) {
      antMessage.warning('请先输入 Agent 描述')
      return
    }

    setIsStreaming(true)
    setPhase('questioning')
    setAiOutput('')
    setQuestions([])
    setGeneratedAgent(null)
    // 重置上一轮的回答，避免 stale data 导致 allAnswered 误判
    useAgentGenerateStore.setState({ answers: {} })

    const sessionId = useAgentGenerateStore.getState().sessionId
    const provider = getProvider()
    const model = useModelStore.getState().currentModel || DEFAULT_MODEL
    let accumulated = ''
    let hasErrored = false

    setModuleCleanup(provider.sendMessage({
      content: ROUND1_PROMPT(content),
      sessionId,
      messages: [],
      model,
      onChunk: (text) => {
        accumulated = text
      },
      onComplete: () => {
        setIsStreaming(false)
        setModuleCleanup(null)
        if (hasErrored) return
        const parsed = extractQuestions(accumulated)
        if (parsed && parsed.length > 0) {
          setQuestions(parsed)
          setPhase('answering')
          setAiOutput('')
        } else {
          antMessage.warning('未能解析澄清问题，直接生成 Agent')
          startGenerating(content, [], {})
        }
      },
      onError: (err) => {
        hasErrored = true
        setIsStreaming(false)
        setModuleCleanup(null)
        setPhase('idle')
        antMessage.error(`AI 分析失败：${err.message}`)
      }
    }))
  }, [setAiOutput, setIsStreaming, setPhase, setQuestions, setGeneratedAgent, startGenerating])

  /** 用户回答完毕，提交触发 Round 2 */
  const submitAnswers = useCallback(() => {
    const state = useAgentGenerateStore.getState()
    startGenerating(state.userInput, state.questions, state.answers)
  }, [startGenerating])

  /** 停止当前生成 */
  const stopGeneration = useCallback(() => {
    callModuleCleanup()
    getProvider().stopGeneration()
    setIsStreaming(false)
    const { phase } = useAgentGenerateStore.getState()
    if (phase === 'questioning') {
      setPhase('idle')
    } else if (phase === 'generating') {
      setPhase('answering')
    }
  }, [setIsStreaming, setPhase])

  return { startAnalysis, submitAnswers, stopGeneration }
}
