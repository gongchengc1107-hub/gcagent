import type { FC } from 'react'
import TaskInput from './components/TaskInput'
import AIChat from './components/AIChat'
import TodoPanel from './components/TodoPanel'
import QuestionCards from './components/QuestionCards'
import { useTodoPageStore } from './store/useTodoPageStore'

const TodoPage: FC = () => {
  const { phase } = useTodoPageStore()

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* 顶部输入区 */}
      <TaskInput />

      {/* 问题卡片层：answering 阶段展示，替换内容区 */}
      {phase === 'answering' ? (
        <div className="flex flex-1 overflow-hidden">
          <QuestionCards />
        </div>
      ) : (
        /* 内容区：左侧 AI 输出 + 右侧 Todo 面板 */
        <div className="flex flex-1 overflow-hidden">
          <div
            className="flex-[3] overflow-hidden border-r"
            style={{ borderColor: 'var(--border-secondary)' }}
          >
            <AIChat />
          </div>
          <div className="flex-[2] overflow-hidden">
            <TodoPanel />
          </div>
        </div>
      )}
    </div>
  )
}

export default TodoPage
