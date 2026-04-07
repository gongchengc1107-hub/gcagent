import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useAgentStore } from '@/stores'

interface AgentSelectorPopupProps {
  /** 当前选中的 Agent ID */
  selectedAgentId: string
  /** 选择后回调 */
  onSelect: (agentId: string) => void
  /** 关闭弹出层 */
  onClose: () => void
  /** 触发按钮的 ref，用于排除 clickOutside 检测（避免点击按钮同时触发关闭+重开） */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

/** 暴露给父组件的键盘控制方法 */
export interface AgentSelectorPopupHandle {
  /** 处理键盘事件，返回 true 表示事件已被消费 */
  handleKeyDown: (e: React.KeyboardEvent) => boolean
}

/**
 * @ 按钮弹出的 Agent 选择器
 * 定位于输入框左下角上方，支持搜索过滤和键盘导航
 * 通过 forwardRef 暴露 handleKeyDown，供 textarea 代理键盘事件
 */
const AgentSelectorPopup = forwardRef<AgentSelectorPopupHandle, AgentSelectorPopupProps>(
  ({ selectedAgentId, onSelect, onClose, triggerRef }, ref) => {
    const { agents } = useAgentStore()
    const [filter, setFilter] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const filtered = agents.filter((a) => {
      // 只展示已启用且非 subagent 模式的 agent
      if (!a.enabled || a.mode === 'subagent') return false
      if (!filter) return true
      const kw = filter.toLowerCase()
      return a.name.toLowerCase().includes(kw) || a.description.toLowerCase().includes(kw)
    })

    // mount 时自动聚焦搜索框
    useEffect(() => {
      inputRef.current?.focus()
    }, [])

    // 初始高亮当前选中项
    useEffect(() => {
      const idx = filtered.findIndex((a) => a.id === selectedAgentId)
      setActiveIndex(idx >= 0 ? idx : 0)
    }, [selectedAgentId]) // eslint-disable-line react-hooks/exhaustive-deps

    // filter 变化重置 activeIndex
    useEffect(() => {
      setActiveIndex(0)
    }, [filter])

    // 选中项滚动到可见区域
    useEffect(() => {
      if (!listRef.current) return
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined
      el?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex])

    // 点击外部关闭（排除触发按钮）
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node
        if (
          containerRef.current && !containerRef.current.contains(target) &&
          !triggerRef.current?.contains(target)
        ) {
          onClose()
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose, triggerRef])

    /** 用 ref 镜像最新数据，让 handleKeyDown 只创建一次 */
    const filteredRef = useRef(filtered)
    filteredRef.current = filtered
    const activeIndexRef = useRef(activeIndex)
    activeIndexRef.current = activeIndex

    /** 核心键盘处理逻辑，返回 true 表示事件已被消费 */
    const handleKeyDown = useCallback((e: React.KeyboardEvent): boolean => {
      const list = filteredRef.current
      const idx = activeIndexRef.current
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (list.length === 0) return true
          setActiveIndex(idx <= 0 ? list.length - 1 : idx - 1)
          return true
        case 'ArrowDown':
          e.preventDefault()
          if (list.length === 0) return true
          setActiveIndex(idx >= list.length - 1 ? 0 : idx + 1)
          return true
        case 'Enter':
          e.preventDefault()
          if (list[idx]) onSelect(list[idx].id)
          return true
        case 'Escape':
          e.preventDefault()
          onClose()
          return true
        default:
          return false
      }
    }, [onSelect, onClose])

    /** 暴露给父组件的 handle */
    useImperativeHandle(ref, () => ({ handleKeyDown }), [handleKeyDown])

    return (
      <div
        ref={containerRef}
        className="absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-xl border shadow-lg"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        {/* 搜索框 */}
        <div
          className="border-b px-3 py-2"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <input
            ref={inputRef}
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
            placeholder="搜索 Agent..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
          />
        </div>

        {/* Agent 列表 */}
        <div
          ref={listRef}
          className="max-h-[220px] overflow-y-auto py-1"
          role="listbox"
          aria-label="选择 Agent"
        >
          {filtered.length === 0 ? (
            <div
              className="px-3 py-4 text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              无匹配的 Agent
            </div>
          ) : (
            filtered.map((agent, index) => {
              const isActive = index === activeIndex
              const isSelected = agent.id === selectedAgentId
              return (
                <div
                  key={agent.id}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => onSelect(agent.id)}
                >
                  <span className="text-lg leading-none">{agent.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="flex items-center gap-1.5 text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {agent.name}
                      {isSelected && (
                        <span
                          className="rounded px-1 text-[10px]"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: '#fff',
                          }}
                        >
                          当前
                        </span>
                      )}
                    </div>
                    {agent.description && (
                      <div
                        className="truncate text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {agent.description}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }
)

AgentSelectorPopup.displayName = 'AgentSelectorPopup'

export default AgentSelectorPopup
