/**
 * useSkillGenerateStore — 智能生成 Skill 的状态管理
 *
 * 管理两轮 AI 对话的完整状态：
 * - Round 1: 用户输入描述 → AI 返回澄清问题
 * - Round 2: 用户回答问题 → AI 生成 Skill JSON
 */
import { create } from 'zustand'
import type { Skill } from '@/types'
import type { AIQuestion } from '@/utils/aiJsonParser'

/** 生成流程阶段 */
export type GeneratePhase =
  | 'idle'         // 初始：等待用户输入描述
  | 'questioning'  // Round 1 流式中：AI 正在生成问题
  | 'answering'    // Round 1 完成：展示问题卡片，等待用户回答
  | 'generating'   // Round 2 流式中：AI 正在生成 Skill JSON
  | 'done'         // Round 2 完成：展示生成结果预览

interface SkillGenerateState {
  /** 用户输入的 Skill 描述 */
  userInput: string
  /** 当前阶段 */
  phase: GeneratePhase
  /** 是否正在流式接收 */
  isStreaming: boolean
  /** AI 输出的累积文本（用于流式展示） */
  aiOutput: string
  /** 当前 session ID（每轮对话隔离） */
  sessionId: string

  /** Round 1 解析出的问题列表 */
  questions: AIQuestion[]
  /** 用户对每个问题的选择，key = question index；多选时为 string[] */
  answers: Record<number, string | string[]>

  /** Round 2 解析出的 Skill 结构 */
  generatedSkill: Partial<Skill> | null

  // ─── Actions ───
  setUserInput: (v: string) => void
  setPhase: (p: GeneratePhase) => void
  setIsStreaming: (v: boolean) => void
  setAiOutput: (v: string) => void
  setQuestions: (q: AIQuestion[]) => void
  setAnswer: (index: number, answer: string) => void
  setGeneratedSkill: (skill: Partial<Skill> | null) => void
  /** 全部重置（关闭弹窗 / 重新生成时） */
  resetAll: () => void
  /** Round 2 隔离：刷新 sessionId 避免上下文污染 */
  refreshSessionId: () => string
}

const initialState = {
  userInput: '',
  phase: 'idle' as GeneratePhase,
  isStreaming: false,
  aiOutput: '',
  sessionId: crypto.randomUUID(),
  questions: [] as AIQuestion[],
  answers: {} as Record<number, string | string[]>,
  generatedSkill: null as Partial<Skill> | null,
}

export const useSkillGenerateStore = create<SkillGenerateState>()((set) => ({
  ...initialState,

  setUserInput: (v) => set({ userInput: v }),
  setPhase: (p) => set({ phase: p }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setAiOutput: (v) => set({ aiOutput: v }),
  setQuestions: (q) => set({ questions: q }),
  setAnswer: (index, answer) =>
    set((s) => {
      const q = s.questions[index]
      if (q?.multiple) {
        const prev = Array.isArray(s.answers[index]) ? (s.answers[index] as string[]) : []
        const next = prev.includes(answer)
          ? prev.filter((a) => a !== answer)
          : [...prev, answer]
        return { answers: { ...s.answers, [index]: next } }
      }
      return { answers: { ...s.answers, [index]: answer } }
    }),
  setGeneratedSkill: (skill) => set({ generatedSkill: skill }),

  resetAll: () => set({ ...initialState, sessionId: crypto.randomUUID() }),

  refreshSessionId: () => {
    const newId = crypto.randomUUID()
    set({ sessionId: newId })
    return newId
  },
}))
