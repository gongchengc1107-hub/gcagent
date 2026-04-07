import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useSkillStore } from '@/stores'

interface SkillSelectorPopupProps {
  /** 选择后回调，返回 skill name */
  onSelect: (skillName: string) => void
  /** 关闭弹出层 */
  onClose: () => void
  /** 触发按钮的 ref，用于排除 clickOutside 检测 */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

/** 暴露给父组件的键盘控制方法 */
export interface SkillSelectorPopupHandle {
  /** 处理键盘事件，返回 true 表示事件已被消费 */
  handleKeyDown: (e: React.KeyboardEvent) => boolean
}

/**
 * / 按钮弹出的 Skill 选择器
 * 定位于输入框左下角上方，支持搜索过滤和键盘导航
 * 只展示已启用（enabled: true）的 Skill
 * 通过 forwardRef 暴露 handleKeyDown，供 textarea 代理键盘事件
 */
const SkillSelectorPopup = forwardRef<SkillSelectorPopupHandle, SkillSelectorPopupProps>(
  ({ onSelect, onClose, triggerRef }, ref) => {
    const { skills } = useSkillStore()
    const [filter, setFilter] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const enabledSkills = skills.filter((s) => s.enabled)
    const filtered = enabledSkills.filter((s) => {
      if (!filter) return true
      const kw = filter.toLowerCase()
      return (
        s.name.toLowerCase().includes(kw) ||
        s.description.toLowerCase().includes(kw) ||
        s.tags.some((t) => t.toLowerCase().includes(kw))
      )
    })

    // 弹出时自动聚焦搜索框
    useEffect(() => {
      inputRef.current?.focus()
    }, [])

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
          if (list[idx]) onSelect(list[idx].name)
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
        className="absolute bottom-full left-0 z-50 mb-1 w-72 overflow-hidden rounded-xl border shadow-lg"
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
            placeholder="搜索 Skill..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
          />
        </div>

        {/* Skill 列表 */}
        <div
          ref={listRef}
          className="max-h-[220px] overflow-y-auto py-1"
          role="listbox"
          aria-label="选择 Skill"
        >
          {filtered.length === 0 ? (
            <div
              className="px-3 py-4 text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {enabledSkills.length === 0 ? '暂无已启用的 Skill' : '无匹配的 Skill'}
            </div>
          ) : (
            filtered.map((skill, index) => {
              const isActive = index === activeIndex
              return (
                <div
                  key={skill.id}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  className="flex cursor-pointer items-start gap-2.5 px-3 py-2 transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => onSelect(skill.name)}
                >
                  {/* Skill 名 + 描述 */}
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      /{skill.name}
                    </div>
                    <div
                      className="truncate text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {skill.description}
                    </div>
                  </div>
                  {/* 标签（最多展示 2 个，用 index 保证唯一 key） */}
                  {skill.tags.length > 0 && (
                    <div className="flex shrink-0 flex-wrap gap-1 pt-0.5">
                      {skill.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={`${tag}-${i}`}
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }
)

SkillSelectorPopup.displayName = 'SkillSelectorPopup'

export default SkillSelectorPopup
