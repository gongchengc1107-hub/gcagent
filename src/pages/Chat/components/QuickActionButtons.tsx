import { useCallback } from 'react'
import type { FC } from 'react'

interface QuickActionButtonsProps {
  /** 快捷选项文本列表 */
  actions: string[]
  /** 点击选项后的回调（发送该文本作为新消息） */
  onAction: (text: string) => void
}

/**
 * AI 快捷选项按钮
 * 解析 AI 最新回复末尾的列表项，生成可点击的 chip 按钮
 * 点击后等同于用户发送该文本
 */
const QuickActionButtons: FC<QuickActionButtonsProps> = ({ actions, onAction }) => {
  const handleClick = useCallback(
    (text: string) => {
      onAction(text)
    },
    [onAction]
  )

  if (actions.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4 pb-2">
      <div className="ml-10 flex flex-wrap gap-2">
        {actions.map((text, index) => (
          <button
            key={index}
            className="max-w-[200px] truncate rounded-full border px-3 py-1.5 text-xs transition-colors"
            style={{
              borderColor: 'var(--border-primary)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)'
              e.currentTarget.style.color = 'var(--accent-primary)'
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)'
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
            }}
            onClick={() => handleClick(text)}
            title={text}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickActionButtons
