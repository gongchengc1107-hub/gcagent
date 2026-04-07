import { useState, useCallback } from 'react'
import type { FC } from 'react'
import {
  CopyOutlined,
  EditOutlined,
  ReloadOutlined,
  CheckOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { ChatMessage } from '@/types'
import MarkdownRenderer from './MarkdownRenderer'
import ThinkingBlock from './ThinkingBlock'
import ImageLightbox from './ImageLightbox'

interface MessageBubbleProps {
  message: ChatMessage
  onResend: (messageId: string, content: string) => void
  onEditResend: (messageId: string, newContent: string) => void
  onRegenerate: (messageId: string) => void
  /** 列表项点击回调（仅对最后一条 assistant 消息启用） */
  onQuickAction?: (text: string) => void
}

const MessageBubble: FC<MessageBubbleProps> = ({
  message,
  onResend,
  onEditResend,
  onRegenerate,
  onQuickAction
}) => {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  /** 当前查看大图的 src，null 表示关闭 */
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const hasImages = message.images && message.images.length > 0
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [message.content])

  const handleEditConfirm = useCallback(() => {
    if (editContent.trim()) {
      onEditResend(message.id, editContent.trim())
    }
    setEditing(false)
  }, [editContent, message.id, onEditResend])

  return (
    <div className={`group flex gap-3 px-4 py-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
          color: isUser ? '#fff' : 'var(--text-secondary)'
        }}
      >
        {isUser ? <UserOutlined className="text-sm" /> : <RobotOutlined className="text-sm" />}
      </div>

      {/* 内容区 */}
      <div className={`flex max-w-[75%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 工具调用展示（AI 消息，文本内容上方） */}
        {!isUser && hasToolCalls && (
          <div className="mb-2 flex w-full flex-col gap-2">
            {message.toolCalls!.map((tc) => (
              <ThinkingBlock key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: isUser ? '#fff' : 'var(--text-primary)',
            borderTopRightRadius: isUser ? 4 : 16,
            borderTopLeftRadius: isUser ? 16 : 4
          }}
        >
          {/* 图片展示区域（文本内容上方） */}
          {hasImages && (
            <div className="mb-2 flex flex-wrap gap-2">
              {message.images!.map((img) => (
                <img
                  key={img.id}
                  src={img.dataUrl}
                  alt={img.name}
                  className="max-w-[300px] cursor-pointer rounded-lg transition-opacity hover:opacity-80"
                  style={{ maxHeight: '200px', objectFit: 'cover' }}
                  onClick={() => setLightboxSrc(img.dataUrl)}
                />
              ))}
            </div>
          )}

          {editing ? (
            <div className="min-w-[300px]">
              <textarea
                className="w-full resize-none rounded-lg border bg-transparent p-2 text-sm outline-none"
                style={{
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-primary)'
                }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  className="rounded px-3 py-1 text-xs transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)'
                  }}
                  onClick={() => setEditing(false)}
                >
                  取消
                </button>
                <button
                  className="rounded px-3 py-1 text-xs text-white transition-colors"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                  onClick={handleEditConfirm}
                >
                  发送
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} isStreaming={message.isStreaming} onListItemClick={onQuickAction} messageId={message.id} />
          )}
        </div>

        {/* 操作按钮 - hover 时显示 */}
        {!editing && !message.isStreaming && (
          <div
            className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <ActionButton
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              tooltip={copied ? '已复制' : '复制'}
              onClick={handleCopy}
            />
            {isUser && (
              <>
                <ActionButton
                  icon={<EditOutlined />}
                  tooltip="编辑重发"
                  onClick={() => {
                    setEditContent(message.content)
                    setEditing(true)
                  }}
                />
                <ActionButton
                  icon={<ReloadOutlined />}
                  tooltip="重新发送"
                  onClick={() => onResend(message.id, message.content)}
                />
              </>
            )}
            {!isUser && (
              <ActionButton
                icon={<ReloadOutlined />}
                tooltip="重新生成"
                onClick={() => onRegenerate(message.id)}
              />
            )}
          </div>
        )}
      </div>

      {/* 图片大图查看 */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  )
}

/** 小操作按钮 */
const ActionButton: FC<{
  icon: React.ReactNode
  tooltip: string
  onClick: () => void
}> = ({ icon, tooltip, onClick }) => (
  <button
    className="flex h-6 w-6 items-center justify-center rounded text-xs transition-colors"
    style={{ color: 'var(--text-muted)' }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
      e.currentTarget.style.color = 'var(--text-primary)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.color = 'var(--text-muted)'
    }}
    onClick={onClick}
    title={tooltip}
  >
    {icon}
  </button>
)

export default MessageBubble
