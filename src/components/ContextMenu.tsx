import { useEffect, useRef } from 'react'
import type { FC } from 'react'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  danger?: boolean
  onClick: () => void
}

interface ContextMenuProps {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

const ContextMenu: FC<ContextMenuProps> = ({ visible, x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] rounded-lg py-1 shadow-lg"
      style={{
        left: x,
        top: y,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)'
      }}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
          style={{
            color: item.danger ? 'var(--error)' : 'var(--text-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          onClick={() => {
            item.onClick()
            onClose()
          }}
        >
          {item.icon && <span className="text-sm">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default ContextMenu
