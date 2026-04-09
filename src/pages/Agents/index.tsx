import { useState, useEffect, useMemo, useCallback } from 'react'
import type { FC } from 'react'
import { Button, Modal, Tooltip, message, Skeleton } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useAgentStore } from '@/stores'
import type { Agent } from '@/types'
import { syncDiskAgents } from '@/utils/diskSync'
import AgentCard from './components/AgentCard'
import AgentDrawer from './components/AgentDrawer'

/** 是否运行在 Electron 环境 */
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

/** 自定义 Agent 数量上限 */
const MAX_CUSTOM_AGENTS = 10

const AgentsPage: FC = () => {
  const { agents, addAgent, updateAgent, removeAgent, toggleEnabled, mergeDiskAgents, getCustomAgentCount, isInitialized } =
    useAgentStore()

  /** 抽屉状态 */
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>(undefined)

  /** 磁盘同步（含 CLI agent）— 每次进入页面静默刷新，初始化由 ServiceProvider 负责 */
  useEffect(() => {
    syncDiskAgents().then((diskAgents) => {
      mergeDiskAgents(diskAgents)
    })
  }, [mergeDiskAgents])

  /** 自定义 agent 按创建时间倒序（最新在前），内置 agent 排最后 */
  const allAgents = useMemo(
    () => [
      ...agents.filter((a) => !a.isBuiltin).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
      ...agents.filter((a) => a.isBuiltin).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    ],
    [agents]
  )

  const customCount = getCustomAgentCount()
  const isCreateDisabled = customCount >= MAX_CUSTOM_AGENTS

  /** 打开创建抽屉 */
  const handleCreate = useCallback(() => {
    setDrawerMode('create')
    setEditingAgent(undefined)
    setDrawerVisible(true)
  }, [])

  /** 打开编辑抽屉（内置 agent 不可编辑） */
  const handleEdit = useCallback((agent: Agent) => {
    if (agent.isBuiltin) return
    setDrawerMode('edit')
    setEditingAgent(agent)
    setDrawerVisible(true)
  }, [])

  /** 删除确认 */
  const handleDelete = useCallback(
    (agent: Agent) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除 Agent「${agent.name}」吗？此操作不可撤销。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          removeAgent(agent.id)
          // 磁盘 Agent：同步删除对应 .md 文件
          if (agent.isFromDisk && isElectron) {
            await window.electronAPI.invoke('agent:delete', agent.backendName)
          }
          message.success(`已删除 Agent「${agent.name}」`)
        },
      })
    },
    [removeAgent]
  )

  /** 表单提交 */
  const handleSubmit = useCallback(
    async (values: Partial<Agent>) => {
      if (drawerMode === 'create') {
        const newAgent: Agent = {
          id: `agent-${Date.now()}`,
          name: values.name || '',
          backendName: values.backendName || '',
          emoji: values.emoji || '🤖',
          description: values.description || '',
          enabled: true,
          mode: values.mode || 'primary',
          systemPrompt: values.systemPrompt || '',
          tools: values.tools || {},
          skillIds: values.skillIds || [],
          autoMode: values.autoMode || false,
          isBuiltin: false,
          isFromDisk: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        addAgent(newAgent)
        if (isElectron) {
          await window.electronAPI.invoke('agent:write', newAgent)
        }
        message.success(`已创建 Agent「${newAgent.name}」`)
      } else if (editingAgent) {
        updateAgent(editingAgent.id, values)
        if (isElectron && editingAgent.backendName) {
          const updated: Agent = { ...editingAgent, ...values, updatedAt: Date.now() }
          await window.electronAPI.invoke('agent:write', updated)
        }
        message.success(`已更新 Agent「${values.name || editingAgent.name}」`)
      }
      setDrawerVisible(false)
    },
    [drawerMode, editingAgent, addAgent, updateAgent]
  )

  return (
    <div className="mx-auto h-full max-w-[1200px] overflow-y-auto p-6">
      {/* 页面头部 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Agents 管理
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            管理内置和自定义 Agent，配置技能和行为模式
          </p>
        </div>

        <Tooltip
          title={isCreateDisabled ? `自定义 Agent 数量已达上限（${MAX_CUSTOM_AGENTS}个）` : undefined}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            disabled={isCreateDisabled}
          >
            创建 Agent
          </Button>
        </Tooltip>
      </div>

      {/* 首次加载中：骨架屏 */}
      {!isInitialized ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : allAgents.length > 0 ? (
        /* Agent 列表 */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={toggleEnabled}
            />
          ))}
        </div>
      ) : (
        /* 空状态 */
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="text-4xl">🤖</div>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            还没有可用的 Agent
          </p>
          <Button type="link" className="mt-1" onClick={handleCreate}>
            创建第一个 Agent
          </Button>
        </div>
      )}

      {/* 创建/编辑抽屉 */}
      <AgentDrawer
        visible={drawerVisible}
        mode={drawerMode}
        agent={editingAgent}
        onClose={() => setDrawerVisible(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default AgentsPage
