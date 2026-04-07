import { useState, useRef, useEffect, useCallback } from 'react'
import type { QuestionAsked } from '@/services/chatProvider'

interface QuestionDialogProps {
  /** 当前待回答的问题 */
  question: QuestionAsked
  /** 当前问题在队列中的序号（从 1 开始） */
  questionIndex: number
  /** 队列中的问题总数 */
  questionTotal: number
  /** 提交答案的回调 */
  onSubmit: (answer: string) => void
  /** 关闭/取消的回调 */
  onCancel: () => void
}

/**
 * AI agent 提问浮层
 *
 * 定位于输入框上方（absolute bottom-full），当 AI agent 执行过程中
 * 发出 question.asked 事件时展示，要求用户选择或输入答案后继续。
 *
 * 交互：
 * - 点击选项 → 将 label 填入输入框（可修改）
 * - 点击发送 / Enter → 提交答案
 * - 必须提交，不可直接关闭（保证 agent 能继续执行）
 */
const QuestionDialog = ({ question, questionIndex, questionTotal, onSubmit, onCancel }: QuestionDialogProps) => {
  // 仅取第一个 question（协议支持多个，但 UI 每次只处理一个）
  const q = question.questions[0]
  const [inputValue, setInputValue] = useState('')
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 弹出时自动聚焦到输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [question.id])

  // 切换到新问题时重置状态（队列模式下，shift 后展示下一个问题）
  useEffect(() => {
    setInputValue('')
    setSelectedLabel(null)
  }, [question.id])

  /** 点击选项：将 label 填入输入框并高亮选中态 */
  const handleOptionClick = useCallback((label: string) => {
    setSelectedLabel(label)
    setInputValue(label)
    inputRef.current?.focus()
  }, [])

  /** 提交答案：清空本地状态后调用外部回调 */
  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setInputValue('')
    setSelectedLabel(null)
  }, [inputValue, onSubmit])

  /** Enter 快速提交（Shift+Enter 换行） */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border shadow-xl"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      {/* 标题栏 */}
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {/* 动态提问指示点 */}
        <span
          className="inline-block h-2 w-2 flex-shrink-0 animate-pulse rounded-full"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            {q.header && (
              <p
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: 'var(--accent-primary)' }}
              >
                {q.header}
              </p>
            )}
            {/* 队列进度指示：多个问题时显示 "1/3" */}
            {questionTotal > 1 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none"
                style={{
                  backgroundColor: 'var(--accent-primary)20',
                  color: 'var(--accent-primary)',
                }}
              >
                {questionIndex}/{questionTotal}
              </span>
            )}
          </div>
          <p
            className="text-sm font-medium leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            {q.question}
          </p>
        </div>
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onCancel}
          className="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
          title="取消"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* 选项列表（可选） */}
      {q.options && q.options.length > 0 && (
        <div className="px-3 py-2">
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt) => {
              const isSelected = selectedLabel === opt.label
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleOptionClick(opt.label)}
                  className="flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-150"
                  style={{
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)',
                    backgroundColor: isSelected ? 'var(--accent-primary)15' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className="block text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span
                        className="mt-0.5 block truncate text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {opt.description}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}

            {/* 固定「其他」选项：点击后清空输入框并聚焦，让用户自由输入 */}
            {(() => {
              const isSelected = selectedLabel === '__other__'
              return (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLabel('__other__')
                    setInputValue('')
                    setTimeout(() => inputRef.current?.focus(), 0)
                  }}
                  className="flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-150"
                  style={{
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)',
                    backgroundColor: isSelected ? 'var(--accent-primary)15' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className="block text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      其他
                    </span>
                    <span
                      className="mt-0.5 block text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      在下方输入框填写自定义回答
                    </span>
                  </div>
                </button>
              )
            })()}
          </div>
        </div>
      )}

      {/* 自定义输入区 + 发送按钮 */}
      <div
        className="flex items-center gap-2 border-t px-3 py-2.5"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <input
          ref={inputRef}
          type="text"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
          placeholder={q.options && q.options.length > 0 ? '点击选项或自定义输入...' : '输入您的回答...'}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            // 手动修改时取消选项高亮
            if (selectedLabel && e.target.value !== selectedLabel) {
              setSelectedLabel(null)
            }
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className="flex h-7 flex-shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors"
          style={{
            backgroundColor: inputValue.trim() ? 'var(--accent-primary)' : 'var(--border-primary)',
            color: inputValue.trim() ? '#fff' : 'var(--text-muted)',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          发送回答
        </button>
      </div>
    </div>
  )
}

export default QuestionDialog
