import { useCallback } from 'react'
import type { FC } from 'react'
import { MCP_TEMPLATES } from '@/utils/mcpTemplates'
import type { MCPTemplate } from '@/utils/mcpTemplates'

interface TemplatesTabProps {
  /** 选中模板后的回调 */
  onSelectTemplate: (template: MCPTemplate) => void
}

/** 模板库 Tab — 3x2 网格展示预置 MCP 模板 */
const TemplatesTab: FC<TemplatesTabProps> = ({ onSelectTemplate }) => {
  const handleClick = useCallback(
    (template: MCPTemplate) => {
      onSelectTemplate(template)
    },
    [onSelectTemplate],
  )

  return (
    <div className="grid grid-cols-3 gap-3">
      {MCP_TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          className="flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all duration-200 hover:shadow-md"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-primary)',
          }}
          onClick={() => handleClick(tpl)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-primary)'
          }}
        >
          {/* 图标 */}
          <span className="text-2xl">{tpl.icon}</span>
          {/* 名称 */}
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {tpl.name}
          </span>
          {/* 描述 */}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {tpl.description}
          </span>
        </button>
      ))}
    </div>
  )
}

export default TemplatesTab
