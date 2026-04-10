import { type FC, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, message } from 'antd'
import { STORAGE_KEYS } from '@/utils/storageKeys'

/** 将被清除的数据类型列表 */
const DATA_ITEMS = [
  '会话记录',
  'Agent 配置',
  'Skill 配置',
  'MCP 配置',
  '本地设置（主题、Provider 等）',
  '登录状态'
]

/** 数据管理页 - OpenCode 终端风格 */
const DataManagement: FC = () => {
  const navigate = useNavigate()

  /** 清空所有数据 */
  const handleClearAll = useCallback(() => {
    Modal.confirm({
      title: '⚠️ 确认清空所有数据',
      content: (
        <div className="mt-3">
          <p className="mb-2">此操作将永久删除以下数据：</p>
          <ul className="list-inside list-disc space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {DATA_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 font-medium" style={{ color: 'var(--error)' }}>此操作不可撤销！</p>
        </div>
      ),
      okText: '我了解风险，确认清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        // 清除所有 Zustand 持久化数据
        Object.values(STORAGE_KEYS).forEach((key) => {
          localStorage.removeItem(key)
        })
        // 清除其他可能的 localStorage 数据
        localStorage.clear()
        // 跳转到登录页
        navigate('/login', { replace: true })
        // 刷新页面使所有 store 重新初始化
        window.location.reload()
      }
    })
  }, [navigate])

  /** 导出配置 */
  const handleExportConfig = useCallback(() => {
    try {
      const configData: Record<string, unknown> = {}
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        const value = localStorage.getItem(storageKey)
        if (value) {
          configData[key] = JSON.parse(value)
        }
      })

      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `codemaker-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('配置已导出')
    } catch (err) {
      message.error('导出失败：' + (err instanceof Error ? err.message : String(err)))
    }
  }, [])

  return (
    <section className="space-y-6">
      {/* 区块标题 */}
      <div>
        <h2
          className="font-bold"
          style={{
            fontSize: '16px',
            lineHeight: 1.5,
            color: 'var(--text-primary)'
          }}
        >
          DATA MANAGEMENT
        </h2>
        <div
          className="mt-1 text-sm"
          style={{
            color: 'var(--text-muted)',
            lineHeight: 2.0
          }}
        >
          // 管理本地数据的存储与清理
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className="space-y-4">
        {/* 导出配置 */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-4">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              export
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              导出所有配置为 JSON 文件
            </span>
          </div>
          <button
            onClick={handleExportConfig}
            className="rounded transition-opacity duration-150"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: 2.0,
              padding: '4px 20px',
              borderRadius: '4px',
              border: `1px solid var(--border-primary)`
            }}
          >
            导出
          </button>
        </div>

        {/* 分隔线 */}
        <div className="h-[1px]" style={{ backgroundColor: 'var(--border-primary)' }} />

        {/* 危险操作区域 */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-4">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--error)' }}
            >
              clear_all
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              清空所有本地数据（不可撤销）
            </span>
          </div>

          <div
            className="rounded p-4"
            style={{
              border: `1px solid var(--error)`,
              backgroundColor: 'rgba(255, 59, 48, 0.05)'
            }}
          >
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{ color: 'var(--error)' }}>
                此操作将删除：
              </div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {DATA_ITEMS.join('、')}
              </div>
              <button
                onClick={handleClearAll}
                className="mt-2 rounded transition-opacity duration-150"
                style={{
                  backgroundColor: 'var(--error)',
                  color: '#fdfcfc',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: 2.0,
                  padding: '4px 20px',
                  borderRadius: '4px'
                }}
              >
                ⚠ 清空所有数据
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DataManagement
