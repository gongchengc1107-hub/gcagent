import { useRef, useEffect } from 'react'
import type { FC } from 'react'
import { useTodoPageStore } from '../../store/useTodoPageStore'
import MarkdownRenderer from '@/pages/Chat/components/MarkdownRenderer'

const PHASE_TITLE: Record<string, string> = {
  idle: 'AI 分析过程',
  questioning: '正在生成澄清问题...',
  answering: 'AI 分析过程',
  planning: 'AI 正在规划执行计划'
}

const AIChat: FC = () => {
  const { aiOutput, isStreaming, phase } = useTodoPageStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [aiOutput, isStreaming])

  const title = PHASE_TITLE[phase] ?? 'AI 分析过程'

  return (
    <div className="flex h-full flex-col">
      {/* 标题栏 */}
      <div
        className="flex h-12 shrink-0 items-center gap-2 border-b px-4"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
        {isStreaming && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
              color: 'var(--accent-primary)'
            }}
          >
            生成中...
          </span>
        )}
      </div>

      {/* Markdown 输出区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {aiOutput || isStreaming ? (
          <MarkdownRenderer content={aiOutput} isStreaming={isStreaming} />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {phase === 'answering'
              ? '请在上方回答问题，生成执行计划后将在此展示'
              : 'AI 的分析过程将在这里实时显示'}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default AIChat
