import type { FC } from 'react'
import { Switch, Tag } from 'antd'
import {
  CodeOutlined,
  CloudOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { MCPConfig } from '@/types'
import MCPStatusBadge from './MCPStatusBadge'

interface MCPCardProps {
  mcp: MCPConfig
  onToggle: (id: string) => void
  onEdit?: (mcp: MCPConfig) => void
  onDelete?: (mcp: MCPConfig) => void
}

/** 获取 MCP 配置摘要文本 */
function getConfigSummary(mcp: MCPConfig): string {
  if (mcp.type === 'local') {
    const cmd = mcp.command ?? ''
    const args = mcp.args?.join(' ') ?? ''
    return `${cmd} ${args}`.trim()
  }
  return mcp.url ?? ''
}

/** MCP 卡片组件 — 单列横向布局展示 MCP 配置 */
const MCPCard: FC<MCPCardProps> = ({ mcp, onToggle, onEdit, onDelete }) => {
  const isLocal = mcp.type === 'local'
  const summary = getConfigSummary(mcp)

  return (
    <div
      className="group relative flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-200 hover:shadow-sm"
      style={{
        borderColor: 'var(--border-primary)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >

      {/* 左侧：类型图标 + 名称 + 类型标签 */}
      <div className="flex min-w-[180px] items-center gap-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {isLocal ? (
            <CodeOutlined style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <CloudOutlined style={{ color: 'var(--info)' }} />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {mcp.name}
          </span>
          <Tag
            color={isLocal ? 'default' : 'blue'}
            className="!m-0 w-fit !text-[10px] !leading-tight"
          >
            {isLocal ? '本地' : '远程'}
          </Tag>
        </div>
      </div>

      {/* 中间：配置摘要 */}
      <div className="min-w-0 flex-1">
        <code
          className="block truncate rounded px-2 py-1 text-xs"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
        >
          {summary || '—'}
        </code>
      </div>

        {/* 右侧：状态 + 开关 + 操作按钮 */}
        <div className="flex items-center gap-4">
          <MCPStatusBadge status={mcp.status} />

          <Switch
            checked={mcp.enabled}
            size="small"
            onChange={() => onToggle(mcp.id)}
          />

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => onEdit(mcp)}
                title="编辑"
              >
                <EditOutlined style={{ fontSize: 14 }} />
              </button>
            )}
            {onDelete && (
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ color: 'var(--error, #ff4d4f)' }}
                onClick={() => onDelete(mcp)}
                title="删除"
              >
                <DeleteOutlined style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
        </div>
    </div>
  )
}

export default MCPCard
