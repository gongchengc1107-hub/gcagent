/**
 * ImagePreview — 图片缩略图预览组件
 * 用于输入框上方显示待发送的图片附件
 */
import type { FC } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import type { ImageAttachment } from '@/types'

interface ImagePreviewProps {
  images: ImageAttachment[]
  onRemove: (id: string) => void
}

const ImagePreview: FC<ImagePreviewProps> = ({ images, onRemove }) => {
  if (images.length === 0) return null

  return (
    <div className="mb-2 flex flex-row gap-2">
      {images.map((img) => (
        <div
          key={img.id}
          className="group/img relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {/* 缩略图 */}
          <img
            src={img.dataUrl}
            alt={img.name}
            className="h-full w-full object-cover"
          />

          {/* 删除按钮 */}
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/img:opacity-100"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#fff'
            }}
            title="移除图片"
          >
            <CloseOutlined className="text-[10px]" />
          </button>

          {/* 文件名提示 */}
          <div
            className="absolute bottom-0 left-0 right-0 truncate px-1 py-0.5 text-center text-[10px]"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#fff'
            }}
          >
            {img.name}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ImagePreview
