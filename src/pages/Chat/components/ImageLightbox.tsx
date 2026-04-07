/**
 * ImageLightbox — 图片大图查看组件
 * 点击消息中的图片弹出全屏查看，支持点击遮罩或 Esc 关闭
 */
import { useEffect, useCallback } from 'react'
import type { FC } from 'react'
import { CloseOutlined } from '@ant-design/icons'

interface ImageLightboxProps {
  src: string
  onClose: () => void
}

const ImageLightbox: FC<ImageLightboxProps> = ({ src, onClose }) => {
  /** Esc 键关闭 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        title="关闭"
      >
        <CloseOutlined className="text-xl" />
      </button>

      {/* 大图 */}
      <img
        src={src}
        alt="查看大图"
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export default ImageLightbox
