/**
 * AttachmentPreview — 统一附件预览组件
 * 图片和参考文件使用一致的卡片样式展示：
 * 左侧缩略图/类型 icon + 右侧文件名 + 类型·大小 + 删除按钮
 */
import { memo } from 'react'
import type { FC } from 'react'
import {
  CloseOutlined,
  FileTextOutlined,
  CodeOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import type { ImageAttachment, FileAttachment } from '@/types'
import { getFileCategory } from '@/utils/fileReader'

interface AttachmentPreviewProps {
  images: ImageAttachment[]
  files: FileAttachment[]
  onRemoveImage: (id: string) => void
  onRemoveFile: (id: string) => void
}

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/** 根据文件类别返回对应 icon */
function FileTypeIcon({ fileType }: { fileType: string }) {
  const category = getFileCategory(fileType)
  const cls = 'text-base'

  switch (category) {
    case 'code':
      return <CodeOutlined className={cls} style={{ color: 'var(--accent-primary)' }} />
    case 'pdf':
      return <FilePdfOutlined className={cls} style={{ color: 'var(--error)' }} />
    default:
      return <FileTextOutlined className={cls} style={{ color: 'var(--text-secondary)' }} />
  }
}

/** 获取文件类型标签文字 */
function getTypeLabel(fileType: string): string {
  const category = getFileCategory(fileType)
  switch (category) {
    case 'code': return 'Code'
    case 'pdf': return 'PDF'
    default: return 'File'
  }
}

/** 单个附件卡片 */
function AttachmentCard({
  thumbnail,
  icon,
  name,
  typeLabel,
  size,
  onRemove,
}: {
  thumbnail?: string
  icon?: React.ReactNode
  name: string
  typeLabel: string
  size: number
  onRemove: () => void
}) {
  return (
    <div
      className="group/card relative flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
        maxWidth: 220,
      }}
    >
      {/* 左侧：缩略图或类型 icon */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="h-full w-full object-cover" />
        ) : (
          icon
        )}
      </div>

      {/* 右侧：文件名 + 类型·大小 */}
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-xs font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {name}
        </div>
        <div
          className="mt-0.5 text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {typeLabel} · {formatSize(size)}
        </div>
      </div>

      {/* 删除按钮 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border opacity-0 transition-opacity group-hover/card:opacity-100"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-muted)',
        }}
        title="移除"
      >
        <CloseOutlined className="text-[9px]" />
      </button>
    </div>
  )
}

const AttachmentPreview: FC<AttachmentPreviewProps> = ({
  images,
  files,
  onRemoveImage,
  onRemoveFile,
}) => {
  if (images.length === 0 && files.length === 0) return null

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {/* 图片附件 */}
      {images.map((img) => (
        <AttachmentCard
          key={img.id}
          thumbnail={img.dataUrl}
          name={img.name}
          typeLabel="Image"
          size={img.size}
          onRemove={() => onRemoveImage(img.id)}
        />
      ))}

      {/* 参考文件附件 */}
      {files.map((file) => (
        <AttachmentCard
          key={file.id}
          icon={<FileTypeIcon fileType={file.fileType} />}
          name={file.name}
          typeLabel={getTypeLabel(file.fileType)}
          size={file.size}
          onRemove={() => onRemoveFile(file.id)}
        />
      ))}
    </div>
  )
}

export default memo(AttachmentPreview)
