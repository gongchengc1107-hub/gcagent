import { useCallback, useState } from 'react'
import type { FC } from 'react'
import { Button, Modal, message, Space, Skeleton } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useMCPStore } from '@/stores'
import type { MCPConfig } from '@/types'
import { writeMCPConfig } from '@/utils/mcpConfigSync'
import MCPCard from './components/MCPCard'
import AddMCPModal from './components/AddMCPModal'
import { useMCPStatusPolling } from './hooks/useMCPStatusPolling'

/** MCP 工具管理页面 */
const MCPToolsPage: FC = () => {
  const { mcps, toggleEnabled, removeMCP, isInitialized } = useMCPStore()
  const { refreshNow } = useMCPStatusPolling()

  /** 弹窗可见状态 */
  const [modalVisible, setModalVisible] = useState(false)
  /** 编辑模式的目标 MCP（null 表示新建模式） */
  const [editingMcp, setEditingMcp] = useState<MCPConfig | null>(null)

  /** 打开新建弹窗 */
  const handleAdd = useCallback(() => {
    setEditingMcp(null)
    setModalVisible(true)
  }, [])

  /** 打开编辑弹窗 */
  const handleEdit = useCallback((mcp: MCPConfig) => {
    setEditingMcp(mcp)
    setModalVisible(true)
  }, [])

  /** 关闭弹窗 */
  const handleCloseModal = useCallback(() => {
    setModalVisible(false)
    setEditingMcp(null)
  }, [])

  /** 删除确认 */
  const handleDelete = useCallback(
    (mcp: MCPConfig) => {
      Modal.confirm({
        title: '删除 MCP',
        content: `确定要删除「${mcp.name}」吗？此操作不可撤销。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          removeMCP(mcp.id)
          message.success(`已删除「${mcp.name}」`)
          const allMcps = useMCPStore.getState().mcps
          await writeMCPConfig(allMcps)
        },
      })
    },
    [removeMCP],
  )

  /** 手动刷新状态 */
  const handleRefresh = useCallback(async () => {
    message.loading({ content: '正在检测状态...', key: 'mcp-refresh', duration: 0 })
    await refreshNow()
    message.success({ content: '状态已刷新', key: 'mcp-refresh', duration: 1.5 })
  }, [refreshNow])

  return (
    <div className="mx-auto h-full max-w-[1200px] overflow-y-auto p-6">
      {/* 页面头部 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            MCP 工具管理
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            管理本地和远程 MCP 服务的连接与配置
          </p>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加 MCP
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新状态
          </Button>
        </Space>
      </div>

      {/* MCP 列表 */}
      {!isInitialized ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : mcps.length > 0 ? (
        <div className="flex flex-col gap-3">
          {mcps.map((mcp) => (
            <MCPCard
              key={mcp.id}
              mcp={mcp}
              onToggle={toggleEnabled}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="text-4xl">🔌</div>
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            还没有配置任何 MCP 服务
          </p>
          <Button type="link" className="mt-1" onClick={handleAdd}>
            添加第一个 MCP
          </Button>
        </div>
      )}

      {/* 添加/编辑 MCP 弹窗 */}
      <AddMCPModal
        visible={modalVisible}
        editMcp={editingMcp}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default MCPToolsPage
