/**
 * useAISkillGeneration — 两轮对话生成 Skill 配置
 *
 * 完全复用 CodemakProvider (OpenCode 协议) 的真实 AI 调用链路。
 * 架构参照 src/pages/Todo/hooks/useAITodoAnalysis.ts
 *
 * Round 1: 用户输入描述 → AI 输出 JSON 格式澄清问题 → 前端解析渲染选择卡片
 * Round 2: 用户回答所有问题 → AI 输出 Skill JSON → 前端解析填入表单
 */
import { useCallback, useEffect } from 'react'
import { message as antMessage } from 'antd'
import { getProvider } from '@/services/providerFactory'
import { useModelStore, DEFAULT_MODEL } from '@/stores/useModelStore'
import { useSkillGenerateStore } from '../store/useSkillGenerateStore'
import type { Skill } from '@/types'
import type { AIQuestion } from '@/utils/aiJsonParser'
import {
  stripCodeBlock,
  safeJsonParse,
  extractJsonBlock,
  extractQuestions,
} from '@/utils/aiJsonParser'

// ─── Prompts ────────────────────────────────────────────────────────────────

const ROUND1_PROMPT = (desc: string) =>
  `针对以下 Skill 描述，生成3个关键澄清问题帮助精确定义这个 Skill 的配置。

问题应聚焦于：
1. Skill 的核心功能和具体使用场景
2. 什么关键词或场景应该触发这个 Skill
3. Skill 的分类标签和适用范围

输出格式：JSON数组，每项包含 header（问题标题，5字内）、question（完整问题描述）、options（选项数组，每项有 label（10字内）和 description（一句话说明））。
如果某个问题允许多选（用户可能同时选择多个选项），则在该问题对象中加上 "multiple": true，否则不需要加。
每个问题提供3-4个选项。只输出JSON，不要其他任何文字。

Skill 描述：${desc}`

const ROUND2_PROMPT = (desc: string, questions: AIQuestion[], answers: Record<number, string | string[]>) => {
  const qa = questions.map((q, i) => {
    const a = answers[i]
    const display = Array.isArray(a) ? a.join('、') : (a ?? '未指定')
    return `${q.header}：${display}`
  }).join('\n')
  return `你是 Skill 配置生成专家。根据以下描述和用户已确认的信息，生成一个完整的 Skill 配置。

用户描述：${desc}

已确认信息：
${qa}

输出严格 JSON 对象（只输出纯 JSON，不要 markdown 代码块包裹，不要其他文字）：
{
  "name": "英文标识名（kebab-case格式，如 code-review，不超过50字符）",
  "description": "简短功能描述（中文，不超过200字）",
  "readme": "详细说明文档（Markdown格式，包含：## 功能说明\\n具体描述...\\n\\n## 使用场景\\n场景列表...\\n\\n## 示例\\n使用示例...）",
  "tags": ["标签1", "标签2", "标签3"],
  "triggers": ["触发词1", "触发词2", "触发词3"]
}

要求：
- name 必须是合法的 kebab-case 英文标识
- triggers 至少3个，涵盖中英文常见触发词
- tags 至少2个
- readme 必须是有意义的 Markdown 文档，不少于100字`
}

// ─── Skill 特有的 JSON 提取 ─────────────────────────────────────────────────

/** 从 AI 输出中提取 Skill JSON */
function extractSkill(text: string): Partial<Skill> | null {
  // 先直接在原始文本中提取（避免 stripCodeBlock 误伤 readme 中的代码块）
  // 失败时再尝试去除代码块包裹后提取
  const candidates = [text, stripCodeBlock(text)]
  for (const source of candidates) {
    const objJson = extractJsonBlock(source, '{')
    if (!objJson) continue
    try {
      const parsed = safeJsonParse(objJson) as Record<string, unknown>
      if (typeof parsed.name !== 'string' || !parsed.name) continue
      return {
        name: parsed.name as string,
        description: (parsed.description as string) || '',
        readme: (parsed.readme as string) || '',
        tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : [],
        triggers: Array.isArray(parsed.triggers) ? (parsed.triggers as string[]) : [],
      }
    } catch { /* 继续 */ }
  }
  return null
}

// ─── 模块级单例 cleanup（与 useAITodoAnalysis 相同模式） ────────────────────

let moduleStopCleanup: (() => void) | null = null

function setModuleCleanup(fn: (() => void) | null) {
  moduleStopCleanup = fn
}

function callModuleCleanup() {
  moduleStopCleanup?.()
  moduleStopCleanup = null
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAISkillGeneration() {
  const {
    setAiOutput,
    setIsStreaming,
    setPhase,
    setQuestions,
    setGeneratedSkill,
  } = useSkillGenerateStore()

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      callModuleCleanup()
    }
  }, [])

  /** Round 2: 根据问题答案生成 Skill JSON */
  const startGenerating = useCallback((
    desc: string,
    qs: AIQuestion[],
    ans: Record<number, string | string[]>
  ) => {
    setIsStreaming(true)
    setPhase('generating')
    setAiOutput('')

    const sessionId = useSkillGenerateStore.getState().refreshSessionId()
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
          const finalOutput = useSkillGenerateStore.getState().aiOutput
          const skill = extractSkill(finalOutput)
          if (skill) {
            setGeneratedSkill(skill)
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
        antMessage.error(`生成 Skill 失败：${err.message}`)
      }
    }))
  }, [setAiOutput, setIsStreaming, setPhase, setGeneratedSkill])

  /** Round 1: 发送描述，获取澄清问题 */
  const startAnalysis = useCallback(() => {
    const content = useSkillGenerateStore.getState().userInput.trim()
    if (!content) {
      antMessage.warning('请先输入 Skill 描述')
      return
    }

    setIsStreaming(true)
    setPhase('questioning')
    setAiOutput('')
    setQuestions([])
    setGeneratedSkill(null)
    // 重置上一轮的回答，避免 stale data 导致 allAnswered 误判
    useSkillGenerateStore.setState({ answers: {} })

    const sessionId = useSkillGenerateStore.getState().sessionId
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
        // Round 1 不展示原始 JSON，仅在内存中累积
      },
      onComplete: () => {
        setIsStreaming(false)
        setModuleCleanup(null)
        if (hasErrored) return // onError 后 onComplete 仍会触发，跳过后续逻辑
        const parsed = extractQuestions(accumulated)
        if (parsed && parsed.length > 0) {
          setQuestions(parsed)
          setPhase('answering')
          setAiOutput('')
        } else {
          // 未能解析问题，直接进入 Round 2
          antMessage.warning('未能解析澄清问题，直接生成 Skill')
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
  }, [setAiOutput, setIsStreaming, setPhase, setQuestions, setGeneratedSkill, startGenerating])

  /** 用户回答完毕，提交触发 Round 2 */
  const submitAnswers = useCallback(() => {
    const state = useSkillGenerateStore.getState()
    startGenerating(state.userInput, state.questions, state.answers)
  }, [startGenerating])

  /** 停止当前生成 */
  const stopGeneration = useCallback(() => {
    callModuleCleanup()
    getProvider().stopGeneration()
    setIsStreaming(false)
    const { phase } = useSkillGenerateStore.getState()
    // 回退到上一个有意义的阶段
    if (phase === 'questioning') {
      setPhase('idle')
    } else if (phase === 'generating') {
      setPhase('answering')
    }
  }, [setIsStreaming, setPhase])

  return { startAnalysis, submitAnswers, stopGeneration }
}
