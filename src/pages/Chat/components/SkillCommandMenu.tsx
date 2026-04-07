import { useEffect, useRef } from 'react'
import { useSkillStore } from '@/stores'

interface SkillCommandMenuProps {
  /** 菜单是否可见 */
  visible: boolean
  /** 过滤关键词（不含 `/` 前缀） */
  filter: string
  /** 当前高亮索引（由父组件控制） */
  activeIndex: number
  /** 选择 Skill 后的回调 */
  onSelect: (skillName: string) => void
}

/**
 * Skill `/` 命令浮动菜单（纯展示组件）
 * 键盘导航逻辑由父组件 MessageInput 统一管理
 */
const SkillCommandMenu = ({
  visible,
  filter,
  activeIndex,
  onSelect,
}: SkillCommandMenuProps) => {
  const { skills } = useSkillStore()
  const listRef = useRef<HTMLDivElement>(null)

  const filteredSkills = skills.filter((skill) => {
    if (!skill.enabled) return false
    if (!filter) return true
    const keyword = filter.toLowerCase()
    return (
      skill.name.toLowerCase().includes(keyword) ||
      skill.description.toLowerCase().includes(keyword)
    )
  })

  /** 选中项滚动到可视区域 */
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!visible) return null

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-lg border shadow-lg"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div
        ref={listRef}
        className="max-h-[240px] overflow-y-auto py-1"
      >
        {filteredSkills.length === 0 ? (
          <div
            className="px-3 py-2 text-center text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            无匹配的 Skill
          </div>
        ) : (
          filteredSkills.map((skill, index) => (
            <div
              key={skill.id}
              className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: index === activeIndex ? 'var(--bg-secondary)' : 'transparent',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={() => {/* 鼠标悬停由父组件通过 onActiveIndexChange 控制，此处留空 */}}
              onClick={() => onSelect(skill.name)}
            >
              <span className="font-medium">/{skill.name}</span>
              <span
                className="ml-3 truncate text-xs"
                style={{ color: 'var(--text-muted)', maxWidth: '60%' }}
              >
                {skill.description}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SkillCommandMenu
