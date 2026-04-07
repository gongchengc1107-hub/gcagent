import { type FC, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal } from 'antd'
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
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

/** 数据管理页 */
const DataManagement: FC = () => {
  const navigate = useNavigate()

  /** 清空所有数据 */
  const handleClearAll = useCallback(() => {
    Modal.confirm({
      title: '⚠️ 确认清空所有数据',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div className="mt-3">
          <p className="mb-2">此操作将永久删除以下数据：</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-500">
            {DATA_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 font-medium text-red-500">此操作不可撤销！</p>
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

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          数据管理
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          管理本地数据的存储与清理
        </p>
      </div>

      {/* 危险操作区域 */}
      <div
        className="rounded-lg border-2 border-red-300 p-6"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h3 className="text-base font-semibold text-red-500">清空所有数据</h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          此操作将永久删除所有数据，包括：会话记录、Agent 配置、Skill 配置、MCP
          配置、本地设置等。此操作不可撤销。
        </p>
        <Button
          danger
          type="primary"
          icon={<DeleteOutlined />}
          onClick={handleClearAll}
          className="mt-4"
        >
          清空所有数据
        </Button>
      </div>
    </div>
  )
}

export default DataManagement
