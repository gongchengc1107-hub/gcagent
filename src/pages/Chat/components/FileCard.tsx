import type { FC, ReactNode } from 'react'
import { FileTextOutlined, CodeOutlined, Html5Outlined } from '@ant-design/icons'
import { useFilePreviewStore } from '@/stores'
import type { PreviewFileLanguage } from '@/types'

/** 从 ReactNode 树中递归提取纯文本 */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return extractText((node as React.ReactElement).props.children)
  }
  return ''
}

/** 文件类型配置 */
const FILE_TYPE_CONFIG: Record<
  PreviewFileLanguage,
  { icon: React.ReactNode; label: string; color: string; ext: string }
> = {
  json: {
    icon: <CodeOutlined />,
    label: 'JSON',
    color: '#f5a623',
    ext: '.json'
  },
  markdown: {
    icon: <FileTextOutlined />,
    label: 'Markdown',
    color: '#4a9eff',
    ext: '.md'
  },
  html: {
    icon: <Html5Outlined />,
    label: 'HTML',
    color: '#e44d26',
    ext: '.html'
  }
}

interface FileCardProps {
  /** 代码块中检测到的语言 */
  language: PreviewFileLanguage
  /** 代码块内容（ReactNode，来自 MarkdownRenderer） */
  children: ReactNode
  /** 来源消息 ID */
  messageId: string
  /** 该消息中代码块的序号（用于生成唯一 ID） */
  blockIndex: number
}

const FileCard: FC<FileCardProps> = ({ language, children, messageId, blockIndex }) => {
  const openFile = useFilePreviewStore((s) => s.openFile)
  const config = FILE_TYPE_CONFIG[language]

  const rawContent = extractText(children)
  // 内容摘要：取前 3 行
  const lines = rawContent.split('\n')
  const preview = lines.slice(0, 3).join('\n')
  const hasMore = lines.length > 3

  // 推断文件名
  const fileId = `${messageId}-${blockIndex}`
  const fileName = `file-${blockIndex + 1}${config.ext}`

  const handleClick = () => {
    openFile({
      id: fileId,
      fileName,
      language,
      content: rawContent,
      sourceMessageId: messageId
    })
  }

  return (
    <div
      className="group/card my-3 cursor-pointer overflow-hidden rounded-lg border transition-all hover:shadow-md"
      style={{
        borderColor: 'var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}
      onClick={handleClick}
    >
      {/* 头部：文件类型信息 */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid var(--border-secondary)' }}
      >
        <span style={{ color: config.color, fontSize: 16 }}>{config.icon}</span>
        <span
          className="flex-1 truncate text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {fileName}
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-xs"
          style={{
            backgroundColor: config.color + '18',
            color: config.color
          }}
        >
          {config.label}
        </span>
        {/* 打开按钮提示 */}
        <span
          className="text-xs opacity-0 transition-opacity group-hover/card:opacity-100"
          style={{ color: 'var(--accent-primary)' }}
        >
          点击预览
        </span>
      </div>

      {/* 内容摘要 */}
      <div className="px-3 py-2">
        <pre
          className="overflow-hidden text-xs leading-relaxed"
          style={{
            color: 'var(--text-secondary)',
            maxHeight: '4.5em',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
          }}
        >
          {preview}
          {hasMore && (
            <span style={{ color: 'var(--text-muted)' }}>...</span>
          )}
        </pre>
      </div>

      {/* 底部信息 */}
      <div
        className="flex items-center justify-between px-3 py-1.5 text-xs"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)'
        }}
      >
        <span>{lines.length} 行</span>
        <span>{(new Blob([rawContent]).size / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  )
}

export default FileCard
