import { create } from 'zustand'

export type TodoStatus = 'pending' | 'in_progress' | 'completed'

export interface TodoItem {
  id: string
  text: string
  status: TodoStatus
}

/** AI 返回的单个问题结构 */
export interface AIQuestion {
  header: string
  question: string
  options: Array<{ label: string; description: string }>
}

/** 多轮对话阶段 */
export type DialogPhase =
  | 'idle'        // 初始状态
  | 'questioning' // 正在获取问题（Round 1 streaming）
  | 'answering'   // 展示问题卡，等待用户回答
  | 'planning'    // 正在生成执行计划（Round 2 streaming）

interface TodoPageState {
  taskInput: string
  aiOutput: string
  isStreaming: boolean
  todos: TodoItem[]
  sessionId: string

  /** 当前对话阶段 */
  phase: DialogPhase
  /** Round 1 解析出的问题列表 */
  questions: AIQuestion[]
  /** 用户对每个问题的选择，key = question index */
  answers: Record<number, string>

  setTaskInput: (v: string) => void
  setAiOutput: (v: string) => void
  setIsStreaming: (v: boolean) => void
  setPhase: (p: DialogPhase) => void
  setQuestions: (q: AIQuestion[]) => void
  setAnswer: (index: number, answer: string) => void
  parseTodosFromMarkdown: (text: string, streaming: boolean) => void
  /** 清空分析结果，保留 taskInput */
  resetResult: () => void
  /** 清空全部 */
  clearAll: () => void
  /** 生成并返回新的 sessionId（用于 Round2 隔离 session） */
  refreshSessionId: () => string
}

function parseTodos(text: string, streaming: boolean): TodoItem[] {
  const lines = text.split('\n')
  const items: TodoItem[] = []
  let pendingCount = 0

  for (const line of lines) {
    const completedMatch = line.match(/^[\s]*[-*]\s+\[[xX]\]\s*(.+)$/)
    const pendingMatch = line.match(/^[\s]*[-*]\s+\[\s?\]\s*(.+)$/)

    if (completedMatch) {
      items.push({ id: `todo-${items.length}`, text: completedMatch[1].trim(), status: 'completed' })
    } else if (pendingMatch) {
      pendingCount++
      items.push({
        id: `todo-${items.length}`,
        text: pendingMatch[1].trim(),
        status: streaming && pendingCount === 1 ? 'in_progress' : 'pending'
      })
    }
  }
  return items
}

export const useTodoPageStore = create<TodoPageState>()((set) => ({
  taskInput: '',
  aiOutput: '',
  isStreaming: false,
  todos: [],
  sessionId: crypto.randomUUID(),
  phase: 'idle',
  questions: [],
  answers: {},

  setTaskInput: (v) => set({ taskInput: v }),
  setAiOutput: (v) => set({ aiOutput: v }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setPhase: (p) => set({ phase: p }),
  setQuestions: (q) => set({ questions: q }),
  setAnswer: (index, answer) => set((s) => ({ answers: { ...s.answers, [index]: answer } })),

  parseTodosFromMarkdown: (text, streaming) => {
    set({ todos: parseTodos(text, streaming) })
  },

  resetResult: () => set({
    aiOutput: '',
    todos: [],
    isStreaming: false,
    phase: 'idle',
    questions: [],
    answers: {},
    sessionId: crypto.randomUUID()
  }),

  clearAll: () => set({
    aiOutput: '',
    todos: [],
    isStreaming: false,
    taskInput: '',
    phase: 'idle',
    questions: [],
    answers: {},
    sessionId: crypto.randomUUID()
  }),

  refreshSessionId: () => {
    const newId = crypto.randomUUID()
    set({ sessionId: newId })
    return newId
  }
}))
