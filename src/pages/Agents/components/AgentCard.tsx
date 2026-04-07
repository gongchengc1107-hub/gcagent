import { useState } from 'react'
import type { FC } from 'react'
import { Switch } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { Agent } from '@/types'

interface AgentCardProps {
  agent: Agent
  onEdit: (agent: Agent) => void
  onDelete: (agent: Agent) => void
  onToggle: (id: string) => void
}

/** Agent 卡片组件 — 点击卡片触发编辑，hover 右下角显示删除按钮 */
const AgentCard: FC<AgentCardProps> = ({ agent, onEdit, onDelete, onToggle }) => {
  const [isHovered, setIsHovered] = useState(false)
  const isBuiltin = agent.isBuiltin

  return (
    <div
      className="group relative rounded-xl border p-4 transition-all duration-200"
      style={{
        cursor: isBuiltin ? 'default' : 'pointer',
        borderColor: isHovered && !isBuiltin ? 'var(--accent-primary)' : 'var(--border-primary)',
        backgroundColor: agent.enabled ? 'var(--bg-primary)' : 'var(--bg-secondary)',
        opacity: agent.enabled ? 1 : 0.6,
        boxShadow: isHovered && !isBuiltin ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isBuiltin && onEdit(agent)}
    >
      {/* 卡片主体：emoji + 名称 + 描述 + 开关 */}
      <div className="flex items-start gap-3">
        {/* 左侧 emoji */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-2xl">
          {agent.emoji}
        </div>

        {/* 中间：名称 + 描述 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="truncate text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {agent.name}
            </span>
            {isBuiltin && (
              <span
                className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: 'var(--bg-tertiary, var(--bg-secondary))',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                内置
              </span>
            )}
          </div>
          <div
            className="mt-1 line-clamp-2 text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {agent.description}
          </div>
        </div>

        {/* 右侧开关（内置 agent 不显示） */}
        {!isBuiltin && (
          <Switch
            checked={agent.enabled}
            size="small"
            onClick={(_, e) => {
              e.stopPropagation()
              onToggle(agent.id)
            }}
          />
        )}
      </div>

      {/* 底部：功能标签 + 删除按钮（右下角，hover 显示） */}
      <div className="mt-3 flex items-center justify-between">
        {/* 左侧功能标签 */}
        <div className="flex flex-wrap gap-1.5">
          {agent.autoMode && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
            >
              自动模式
            </span>
          )}
          {agent.skillIds.length > 0 && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
            >
              {agent.skillIds.length} 个 Skill
            </span>
          )}
        </div>

        {/* 右侧删除按钮（hover 时显示，内置 agent 不显示） */}
        {!isBuiltin && (
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md transition-all"
            style={{
              color: 'var(--error, #ff4d4f)',
              opacity: isHovered ? 1 : 0,
              backgroundColor: 'transparent',
            }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(agent)
            }}
            title="删除"
          >
            <DeleteOutlined style={{ fontSize: 14 }} />
          </button>
        )}
      </div>
    </div>
  )
}

export default AgentCard
