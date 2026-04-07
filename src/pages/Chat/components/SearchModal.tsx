import { useState, useEffect, useRef, useMemo } from 'react'
import type { FC } from 'react'
import { Modal, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useChatStore } from '@/stores'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

const SearchModal: FC<SearchModalProps> = ({ open, onClose }) => {
  const { sessions, setCurrentSession } = useChatStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return sessions
    const q = query.toLowerCase()
    return sessions.filter((s) => s.title.toLowerCase().includes(q))
  }, [sessions, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSelect = (id: string) => {
    setCurrentSession(id)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={480}
      styles={{
        body: { padding: '12px 0 0' }
      }}
    >
      <div className="px-3">
        <Input
          ref={inputRef as React.Ref<any>}
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          placeholder="搜索会话..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          allowClear
          size="large"
        />
      </div>

      <div
        className="mt-3 max-h-[320px] overflow-y-auto border-t"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        {filtered.length === 0 ? (
          <div
            className="py-8 text-center text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            无匹配结果
          </div>
        ) : (
          filtered.map((session) => (
            <button
              key={session.id}
              className="flex w-full items-center px-4 py-3 text-left transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onClick={() => handleSelect(session.id)}
            >
              <span className="truncate text-sm">{session.title}</span>
              <span
                className="ml-auto flex-shrink-0 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {new Date(session.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}

export default SearchModal
