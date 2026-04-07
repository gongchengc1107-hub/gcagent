import { useRef, useEffect } from 'react'
import type { FC } from 'react'
import { Empty } from 'antd'
import { CheckSquareOutlined } from '@ant-design/icons'
import { useTodoPageStore } from '../../store/useTodoPageStore'
import TodoItem from './TodoItem'

const TodoPanel: FC = () => {
  const { todos, isStreaming } = useTodoPageStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // 有新项目时滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [todos.length])

  const completedCount = todos.filter((t) => t.status === 'completed').length
  const totalCount = todos.length

  return (
    <div className="flex h-full flex-col">
      {/* 面板标题 */}
      <div
        className="flex h-12 shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <CheckSquareOutlined style={{ color: 'var(--accent-primary)', fontSize: 16 }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            执行计划
          </span>
        </div>

        {totalCount > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {completedCount}/{totalCount} 已完成
          </span>
        )}
      </div>

      {/* 进度条 */}
      {totalCount > 0 && (
        <div
          className="h-1 shrink-0"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(completedCount / totalCount) * 100}%`,
              backgroundColor: 'var(--accent-primary)'
            }}
          />
        </div>
      )}

      {/* Todo 列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {todos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                  {isStreaming ? 'AI 正在分析，执行计划即将出现...' : '输入任务描述，AI 将自动生成执行计划'}
                </span>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {todos.map((item, index) => (
              <TodoItem key={item.id} item={item} index={index} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 底部状态提示 */}
      {isStreaming && todos.length > 0 && (
        <div
          className="shrink-0 border-t px-4 py-2 text-center text-xs"
          style={{
            borderColor: 'var(--border-secondary)',
            color: 'var(--text-tertiary)'
          }}
        >
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
          AI 正在规划中...
        </div>
      )}
    </div>
  )
}

export default TodoPanel
