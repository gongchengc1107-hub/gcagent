/**
 * UrlTag — URL 小卡片组件
 * 显示域名 + 关闭按钮，支持移除操作
 */
import type { FC } from 'react'
import { CloseOutlined, LinkOutlined } from '@ant-design/icons'
import { extractDomain } from '@/utils/urlDetector'

interface UrlTagProps {
  url: string
  onRemove: (url: string) => void
}

const UrlTag: FC<UrlTagProps> = ({ url, onRemove }) => {
  const domain = extractDomain(url)

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)'
      }}
      title={url}
    >
      <LinkOutlined className="text-[10px] opacity-60" />
      <span className="max-w-[160px] truncate">{domain}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(url)
        }}
        className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full opacity-50 transition-opacity hover:opacity-100"
        style={{ color: 'var(--text-muted)' }}
      >
        <CloseOutlined className="text-[8px]" />
      </button>
    </span>
  )
}

export default UrlTag
