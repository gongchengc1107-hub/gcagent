import type { FC, ReactNode, CSSProperties } from 'react'
import { CheckCircleFilled, LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { TodoItem as TodoItemType, TodoStatus } from '../../store/useTodoPageStore'

interface TodoItemProps {
  item: TodoItemType
  index: number
}

const statusConfig: Record<TodoStatus, {
  icon: ReactNode
  textClass: string
  textStyle: CSSProperties
}> = {
  completed: {
    icon: <CheckCircleFilled style={{ color: 'var(--success, #52c41a)', fontSize: 16 }} />,
    textClass: 'line-through',
    textStyle: { color: 'var(--text-tertiary)' }
  },
  in_progress: {
    icon: <LoadingOutlined style={{ color: 'var(--accent-primary)', fontSize: 16 }} spin />,
    textClass: '',
    textStyle: { color: 'var(--text-primary)', fontWeight: 500 }
  },
  pending: {
    icon: <ClockCircleOutlined style={{ color: 'var(--text-tertiary)', fontSize: 16 }} />,
    textClass: '',
    textStyle: { color: 'var(--text-secondary)' }
  }
}

const TodoItem: FC<TodoItemProps> = ({ item, index }) => {
  const config = statusConfig[item.status]

  return (
    <div
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        backgroundColor:
          item.status === 'in_progress'
            ? 'color-mix(in srgb, var(--accent-primary) 8%, transparent)'
            : 'transparent',
        borderLeft:
          item.status === 'in_progress'
            ? '2px solid var(--accent-primary)'
            : '2px solid transparent'
      }}
    >
      {/* 序号 */}
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-tertiary)'
        }}
      >
        {index + 1}
      </span>

      {/* 状态图标 */}
      <span className="mt-0.5 shrink-0">{config.icon}</span>

      {/* 任务文本 */}
      <span
        className={`flex-1 text-sm leading-relaxed ${config.textClass}`}
        style={config.textStyle}
      >
        {item.text}
      </span>
    </div>
  )
}

export default TodoItem
