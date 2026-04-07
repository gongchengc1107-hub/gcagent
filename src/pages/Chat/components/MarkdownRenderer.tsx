import { useMemo, useRef } from 'react'
import type { FC, ReactNode } from 'react'
import type { ReactElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

/** 从 ReactNode 树中递归提取纯文本（用于复制功能） */
function extractTextFromChildren(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractTextFromChildren).join('')
  if (typeof node === 'object' && 'props' in node) {
    return extractTextFromChildren((node as ReactElement).props.children)
  }
  return ''
}

// ─── 内联 SVG 常量（JSX + innerHTML 共用同一份 path 数据，避免分叉维护）────

const COPY_SVG_PATH =
  'M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z'

const CHECK_SVG_PATH =
  'M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z'

/** 用于 JSX 初始渲染的复制图标（SVG ReactNode） */
const CopySVG = (
  <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d={COPY_SVG_PATH} />
  </svg>
)

/** 用于 innerHTML 恢复的 HTML 字符串片段（与 CopySVG 共用同一份 path，保持一致） */
const copySVGString = `<svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="${COPY_SVG_PATH}"/></svg>`
const checkSVGString = `<svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="${CHECK_SVG_PATH}"/></svg>`

/**
 * 无 Hook 纯函数代码块组件。
 *
 * 复制反馈通过操作 button DOM 的 innerHTML 和 style 实现，
 * 不使用任何 React Hook（useState / useCallback / useRef）。
 * 这样无论 ReactMarkdown 动态创建/销毁多少实例，
 * 都不会引发 "Rendered fewer hooks than expected"。
 */
const CodeBlock: FC<{ language: string; children: ReactNode }> = ({
  language,
  children
}) => {
  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    const text = extractTextFromChildren(children)
    const btn = e.currentTarget

    // 防止 2000ms 内重复点击叠加多个定时器
    const prevTimer = Number(btn.dataset.timerId || '0')
    if (prevTimer) clearTimeout(prevTimer)

    navigator.clipboard.writeText(text).then(() => {
      btn.style.color = '#10a37f'
      btn.innerHTML = `${checkSVGString}<span>已复制</span>`

      const id = window.setTimeout(() => {
        btn.style.color = '#999'
        btn.innerHTML = `${copySVGString}<span>复制</span>`
        btn.dataset.timerId = '0'
      }, 2000)
      btn.dataset.timerId = String(id)
    }).catch(() => {
      // 剪贴板权限被拒绝或不可用时给出明确错误提示
      btn.style.color = '#e53e3e'
      btn.innerHTML = `<span>复制失败</span>`

      const id = window.setTimeout(() => {
        btn.style.color = '#999'
        btn.innerHTML = `${copySVGString}<span>复制</span>`
        btn.dataset.timerId = '0'
      }, 2000)
      btn.dataset.timerId = String(id)
    })
  }

  return (
    <div className="group/code my-3 overflow-hidden rounded-lg" style={{ backgroundColor: '#1e1e1e' }}>
      <div className="flex items-center justify-between px-4 py-1.5" style={{ backgroundColor: '#2d2d2d' }}>
        <span className="text-xs" style={{ color: '#999' }}>
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: '#999' }}
          data-timer-id="0"
        >
          {CopySVG}
          <span>复制</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className={language ? `hljs language-${language}` : 'hljs'}>
          {children}
        </code>
      </pre>
    </div>
  )
}

interface MarkdownRendererProps {
  content: string
  /**
   * 流式输出中时传 true，跳过 Markdown 解析直接显示纯文本。
   * 流式结束（isStreaming: false）后切到 ReactMarkdown 完整渲染。
   * CodeBlock 已改为无 Hook 纯组件，数量变化不再触发 Rules of Hooks 崩溃。
   */
  isStreaming?: boolean
}

const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  // 每次从流式（true）→非流式（false）切换时递增，强制 ReactMarkdown 重新挂载，
  // 避免残留虚拟 DOM 状态导致渲染异常。
  // 注意：使用严格等于避免 undefined 误触发（isStreaming?: boolean 可能为 undefined）
  const renderKeyRef = useRef(0)
  const prevIsStreamingRef = useRef<boolean | undefined>(isStreaming)

  if (prevIsStreamingRef.current === true && isStreaming === false) {
    renderKeyRef.current += 1
  }
  prevIsStreamingRef.current = isStreaming

  const components = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '')
        const isInline = !match && !className

        if (isInline) {
          return (
            <code
              className="rounded px-1.5 py-0.5 text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--accent-primary)'
              }}
              {...props}
            >
              {children}
            </code>
          )
        }

        return (
          <CodeBlock language={match?.[1] || ''}>
            {children}
          </CodeBlock>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pre({ children }: any) {
        return <>{children}</>
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      table({ children }: any) {
        return (
          <div className="my-3 overflow-x-auto">
            <table
              className="w-full border-collapse text-sm"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              {children}
            </table>
          </div>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      th({ children }: any) {
        return (
          <th
            className="border px-3 py-2 text-left font-semibold"
            style={{
              borderColor: 'var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            {children}
          </th>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      td({ children }: any) {
        return (
          <td
            className="border px-3 py-2"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {children}
          </td>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blockquote({ children }: any) {
        return (
          <blockquote
            className="my-3 border-l-4 py-1 pl-4"
            style={{
              borderColor: 'var(--accent-primary)',
              color: 'var(--text-secondary)'
            }}
          >
            {children}
          </blockquote>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h1({ children }: any) {
        return (
          <h1 className="mb-3 mt-4 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {children}
          </h1>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h2({ children }: any) {
        return (
          <h2 className="mb-2 mt-3 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {children}
          </h2>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h3({ children }: any) {
        return (
          <h3 className="mb-2 mt-3 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {children}
          </h3>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ul({ children }: any) {
        return <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ol({ children }: any) {
        return <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p({ children }: any) {
        return (
          <p className="my-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {children}
          </p>
        )
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      li({ children }: any) {
        return <li className="leading-relaxed">{children as ReactNode}</li>
      }
    }),
    []
  )

  // 流式输出中：使用轻量 Markdown 渲染（不带语法高亮，避��性能损耗）
  if (isStreaming) {
    // 等待第一个 delta 到来前，content 为空（或仅空白），显示三点跳动 loading 动画
    if (!content.trim()) {
      return (
        <div className="flex items-center gap-1 py-1" role="status" aria-label="AI 正在思考">
          <span
            className="h-2 w-2 animate-bounce rounded-full"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full"
            style={{ backgroundColor: 'var(--accent-primary)', animationDelay: '150ms' }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full"
            style={{ backgroundColor: 'var(--accent-primary)', animationDelay: '300ms' }}
          />
        </div>
      )
    }
    return (
      <div className="markdown-body text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
        {/* 光标跟随在内容末尾 */}
        <span
          className="ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-sm align-text-bottom"
          style={{ backgroundColor: 'var(--accent-primary)' }}
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <div className="markdown-body text-sm leading-relaxed">
      <ReactMarkdown
        key={renderKeyRef.current}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
