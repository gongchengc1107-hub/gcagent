import { useState, useRef, useEffect, useCallback } from 'react'
import type { QuestionAsked } from '@/services/chatProvider'

interface QuestionDialogProps {
  /** 当前待回答的问题 */
  question: QuestionAsked
  /** 当前问题在队列中的序号（从 1 开始） */
  questionIndex: number
  /** 队列中的问题总数 */
  questionTotal: number
  /** 提交答案的回调（answers 为选中的 label 数组，单选时长度为 1） */
  onSubmit: (answers: string[]) => void
  /** 关闭/取消的回调 */
  onCancel: () => void
}

/**
 * AI agent 提问浮层
 *
 * 支持单选和多选两种模式（由 question.multiple 控制）：
 * - 单选（默认）：点选后自动填入输入框，可修改后提交
 * - 多选：可选中多个选项，提交时发送所有选中项
 *
 * 交互：
 * - 单选：点击选项 → 填入输入框 → 发送回答
 * - 多选：点击选项 toggle 选中 → 发送回答（提交所有选中项）
 * - 「其他」选项：清空并聚焦输入框，让用户自由输入
 */
const QuestionDialog = ({ question, questionIndex, questionTotal, onSubmit, onCancel }: QuestionDialogProps) => {
  const q = question.questions[0]
  const isMultiple = q.multiple ?? false
  const showCustom = q.custom !== false // 默认 true

  const [inputValue, setInputValue] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set())
  const [isCustomMode, setIsCustomMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 弹出时自动聚焦到输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [question.id])

  // 切换到新问题时重置状态
  useEffect(() => {
    setInputValue('')
    setSelectedLabels(new Set())
    setIsCustomMode(false)
  }, [question.id])

  /** 点击选项 */
  const handleOptionClick = useCallback((label: string) => {
    setIsCustomMode(false)
    if (isMultiple) {
      // 多选：toggle
      setSelectedLabels((prev) => {
        const next = new Set(prev)
        if (next.has(label)) {
          next.delete(label)
        } else {
          next.add(label)
        }
        return next
      })
      // 多选时输入框显示已选数量提示
      setInputValue('')
    } else {
      // 单选：替换
      setSelectedLabels(new Set([label]))
      setInputValue(label)
      inputRef.current?.focus()
    }
  }, [isMultiple])

  /** 点击「其他」选项 */
  const handleCustomClick = useCallback(() => {
    setIsCustomMode(true)
    if (!isMultiple) {
      setSelectedLabels(new Set())
    }
    setInputValue('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [isMultiple])

  /** 提交答案 */
  const handleSubmit = useCallback(() => {
    if (isMultiple) {
      // 多选：提交所有选中的 label + 自定义输入（如有）
      const answers = [...selectedLabels]
      const trimmed = inputValue.trim()
      if (trimmed && !selectedLabels.has(trimmed)) {
        answers.push(trimmed)
      }
      if (answers.length === 0) return
      onSubmit(answers)
    } else {
      // 单选
      const trimmed = inputValue.trim()
      if (!trimmed) return
      onSubmit([trimmed])
    }
    setInputValue('')
    setSelectedLabels(new Set())
    setIsCustomMode(false)
  }, [inputValue, selectedLabels, isMultiple, onSubmit])

  /** Enter 快速提交 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // 提交按钮是否可用
  const canSubmit = isMultiple
    ? selectedLabels.size > 0 || inputValue.trim().length > 0
    : inputValue.trim().length > 0

  // 多选时的提交按钮文字
  const submitText = isMultiple && selectedLabels.size > 0
    ? `发送回答 (${selectedLabels.size})`
    : '发送回答'

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
            {/* 多选提示 */}
            {isMultiple && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                }}
              >
                多选
              </span>
            )}
          </div>
          <p
            className="text-sm font-medium leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            {q.question}
          </p>
          {/* 多选操作提示 */}
          {isMultiple && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              可选择多个选项
            </p>
          )}
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

      {/* 选项列表 */}
      {q.options && q.options.length > 0 && (
        <div className="max-h-64 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt) => {
              const isSelected = selectedLabels.has(opt.label)
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
                  {/* 指示器：多选用 checkbox，单选用 radio */}
                  {isMultiple ? (
                    <span
                      className="mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border-2 transition-all"
                      style={{
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 6L5 8.5L9.5 3.5" />
                        </svg>
                      )}
                    </span>
                  ) : (
                    <span
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 transition-all"
                      style={{
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                      }}
                    />
                  )}
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

            {/* 「其他」选项：允许自定义输入时显示 */}
            {showCustom && (() => {
              const isSelected = isCustomMode
              return (
                <button
                  type="button"
                  onClick={handleCustomClick}
                  className="flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-150"
                  style={{
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)',
                    backgroundColor: isSelected ? 'var(--accent-primary)15' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {isMultiple ? (
                    <span
                      className="mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border-2 transition-all"
                      style={{
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 6L5 8.5L9.5 3.5" />
                        </svg>
                      )}
                    </span>
                  ) : (
                    <span
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 transition-all"
                      style={{
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                      }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      其他
                    </span>
                    <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>
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
          placeholder={
            isMultiple
              ? (isCustomMode ? '输入自定义回答...' : '已选中可直接发送，或输入补充...')
              : (q.options && q.options.length > 0 ? '点击选项或自定义输入...' : '输入您的回答...')
          }
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            // 单选模式下，手动修改时取消选项高亮
            if (!isMultiple && selectedLabels.size > 0 && e.target.value !== [...selectedLabels][0]) {
              setSelectedLabels(new Set())
            }
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex h-7 flex-shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors"
          style={{
            backgroundColor: canSubmit ? 'var(--accent-primary)' : 'var(--border-primary)',
            color: canSubmit ? '#fff' : 'var(--text-muted)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitText}
        </button>
      </div>
    </div>
  )
}

export default QuestionDialog
