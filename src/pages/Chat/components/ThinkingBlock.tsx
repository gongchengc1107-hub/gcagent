/**
 * ThinkingBlock — 工具调用可折叠卡片组件
 * 展示单个 ToolCall 的状态、参数和结果
 */
import { useState, useRef, useEffect } from 'react'
import type { FC } from 'react'
import {
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DownOutlined
} from '@ant-design/icons'
import type { ToolCall } from '@/types'

interface ThinkingBlockProps {
  toolCall: ToolCall
}

/** 根据状态返回对应的图标 */
const StatusIcon: FC<{ status: ToolCall['status'] }> = ({ status }) => {
  switch (status) {
    case 'running':
      return <LoadingOutlined spin style={{ color: 'var(--accent-primary)' }} />
    case 'success':
      return <CheckCircleFilled style={{ color: '#52c41a' }} />
    case 'error':
      return <CloseCircleFilled style={{ color: '#ff4d4f' }} />
  }
}

/** 格式化耗时（毫秒转秒） */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const ThinkingBlock: FC<ThinkingBlockProps> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  /** 计算展开内容高度以做动画过渡 */
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [expanded, toolCall])

  return (
    <div
      className="overflow-hidden rounded-lg border transition-colors"
      style={{
        borderColor: 'var(--border-primary)',
        backgroundColor: 'var(--bg-secondary)'
      }}
    >
      {/* 折叠态头部（始终可见） */}
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
        style={{ color: 'var(--text-primary)' }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {/* 状态图标 */}
        <span className="flex-shrink-0 text-base">
          <StatusIcon status={toolCall.status} />
        </span>

        {/* 工具名称 */}
        <span className="font-mono text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {toolCall.toolName}
        </span>

        {/* 耗时 */}
        {toolCall.duration != null && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatDuration(toolCall.duration)}
          </span>
        )}

        {/* 展开/折叠箭头 */}
        <span
          className="ml-auto flex-shrink-0 text-xs transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          <DownOutlined />
        </span>
      </button>

      {/* 展开态内容（带高度动画） */}
      <div
        className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
        style={{ maxHeight: expanded ? `${contentHeight}px` : '0px' }}
      >
        <div
          ref={contentRef}
          className="border-t px-3 py-2"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {/* 参数区域 */}
          <div className="mb-2">
            <div className="mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              参数
            </div>
            <pre
              className="overflow-x-auto rounded p-2 text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace'
              }}
            >
              {JSON.stringify(toolCall.params, null, 2)}
            </pre>
          </div>

          {/* 结果区域 */}
          {toolCall.result != null && (
            <div>
              <div className="mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                结果
              </div>
              <pre
                className="overflow-x-auto whitespace-pre-wrap rounded p-2 text-xs leading-relaxed"
                style={{
                  backgroundColor: toolCall.status === 'error' ? 'rgba(255, 77, 79, 0.08)' : 'var(--bg-primary)',
                  color: toolCall.status === 'error' ? '#ff4d4f' : 'var(--text-secondary)',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                  border: toolCall.status === 'error' ? '1px solid rgba(255, 77, 79, 0.2)' : 'none'
                }}
              >
                {toolCall.result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ThinkingBlock
