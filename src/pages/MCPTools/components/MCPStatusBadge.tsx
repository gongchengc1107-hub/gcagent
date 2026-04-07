import type { FC } from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import type { MCPStatus } from '@/types'

interface MCPStatusBadgeProps {
  status: MCPStatus
}

/** 状态配置映射 */
const STATUS_MAP: Record<MCPStatus, { color: string; label: string }> = {
  connected: { color: 'var(--success)', label: '已连接' },
  disconnected: { color: 'var(--text-muted)', label: '未连接' },
  connecting: { color: 'var(--info)', label: '连接中...' },
  needs_auth: { color: 'var(--warning)', label: '需要认证' },
  failed: { color: 'var(--error)', label: '连接失败' },
}

/** MCP 状态徽章组件 — 5 种状态的可视化标识 */
const MCPStatusBadge: FC<MCPStatusBadgeProps> = ({ status }) => {
  const { color, label } = STATUS_MAP[status]

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      {status === 'connecting' ? (
        <LoadingOutlined style={{ color, fontSize: 12 }} spin />
      ) : (
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span style={{ color }}>{label}</span>
    </span>
  )
}

export default MCPStatusBadge
