import { useState, useCallback } from 'react'
import type { FC } from 'react'
import {
  FileTextOutlined,
  CodeOutlined,
  Html5Outlined,
  FolderOpenOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { useFilePreviewStore } from '@/stores'
import type { PreviewFileLanguage } from '@/types'

/** 从文件扩展名推断语言类型 */
function getLanguageFromPath(filePath: string): PreviewFileLanguage {
  if (filePath.endsWith('.json')) return 'json'
  if (filePath.endsWith('.html') || filePath.endsWith('.htm')) return 'html'
  return 'markdown' // .md 和其他
}

/** 从路径提取文件名 */
function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath
}

/** 文件类型配置 */
const FILE_TYPE_CONFIG: Record<
  PreviewFileLanguage,
  { icon: React.ReactNode; label: string; color: string }
> = {
  json: { icon: <CodeOutlined />, label: 'JSON', color: '#f5a623' },
  markdown: { icon: <FileTextOutlined />, label: 'Markdown', color: '#4a9eff' },
  html: { icon: <Html5Outlined />, label: 'HTML', color: '#e44d26' }
}

interface FilePathCardProps {
  /** 磁盘文件的绝对路径 */
  filePath: string
  /** 来源消息 ID */
  messageId: string
}

const FilePathCard: FC<FilePathCardProps> = ({ filePath, messageId }) => {
  const openFile = useFilePreviewStore((s) => s.openFile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const language = getLanguageFromPath(filePath)
  const fileName = getFileName(filePath)
  const config = FILE_TYPE_CONFIG[language]

  const handleClick = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 通过 Electron IPC 读取文件内容
      const content = await window.electronAPI.invoke('fs:read-file-unrestricted', filePath) as string
      if (!content && content !== '') {
        setError('文件不存在或无法读取')
        return
      }
      openFile({
        id: `path-${filePath}`,
        fileName,
        language,
        content,
        sourceMessageId: messageId,
        filePath
      })
    } catch (err) {
      setError('读取文件失败')
      console.error('读取文件失败:', err)
    } finally {
      setLoading(false)
    }
  }, [filePath, fileName, language, messageId, openFile])

  return (
    <div
      className="group/fcard my-3 cursor-pointer overflow-hidden rounded-lg border transition-all hover:shadow-md"
      style={{
        borderColor: 'var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* 文件图标 */}
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: config.color + '15', color: config.color, fontSize: 18 }}
        >
          {config.icon}
        </span>

        {/* 文件信息 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="truncate text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {fileName}
            </span>
            <span
              className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs"
              style={{ backgroundColor: config.color + '18', color: config.color }}
            >
              {config.label}
            </span>
          </div>
          <div
            className="mt-0.5 truncate text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {filePath}
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {loading ? (
            <LoadingOutlined style={{ color: 'var(--accent-primary)', fontSize: 14 }} spin />
          ) : error ? (
            <span className="text-xs" style={{ color: 'var(--error)' }}>{error}</span>
          ) : (
            <span
              className="flex items-center gap-1 text-xs opacity-0 transition-opacity group-hover/fcard:opacity-100"
              style={{ color: 'var(--accent-primary)' }}
            >
              <FolderOpenOutlined />
              点击预览
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default FilePathCard
