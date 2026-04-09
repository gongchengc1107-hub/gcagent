import { useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
import { Drawer, Form, Input, Select, Switch, Button, Space, Checkbox, Tabs } from 'antd'
import type { Agent } from '@/types'
import { useSkillStore } from '@/stores'
import { useAgentGenerateStore } from '../store/useAgentGenerateStore'
import { useAIAgentGeneration } from '../hooks/useAIAgentGeneration'
import AIGenerateAgentTab from './AIGenerateAgentTab'

interface AgentDrawerProps {
  visible: boolean
  mode: 'create' | 'edit'
  agent?: Agent
  onClose: () => void
  onSubmit: (values: Partial<Agent>) => void | Promise<void>
}

/** 将名称转为 kebab-case 后端名称 */
function toBackendName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** CLI 内置 agent 的保留名称，用户创建时不能与之冲突 */
const RESERVED_BACKEND_NAMES = new Set([
  'build', 'compaction', 'explore', 'general', 'plan', 'summary', 'title',
])

/** 所有可选工具 */
const ALL_TOOLS = [
  { label: 'bash', value: 'bash', desc: '执行 shell 命令' },
  { label: 'read', value: 'read', desc: '读取文件' },
  { label: 'write', value: 'write', desc: '写入文件' },
  { label: 'edit', value: 'edit', desc: '编辑文件' },
  { label: 'glob', value: 'glob', desc: '文件模式匹配' },
  { label: 'grep', value: 'grep', desc: '内容搜索' },
  { label: 'list', value: 'list', desc: '列出目录' },
  { label: 'webfetch', value: 'webfetch', desc: '抓取网页' },
  { label: 'task', value: 'task', desc: '启动子 agent' },
  { label: 'todowrite', value: 'todowrite', desc: '写入待办' },
  { label: 'todoread', value: 'todoread', desc: '读取待办' },
]

const MODE_OPTIONS = [
  { label: 'primary — 可被用户直接调用', value: 'primary' },
  { label: 'subagent — 只能被其他 agent 调用', value: 'subagent' },
  { label: 'all — 两者均可', value: 'all' },
]

/** Agent 创建/编辑抽屉 */
const AgentDrawer: FC<AgentDrawerProps> = ({
  visible,
  mode,
  agent,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm()
  const { skills } = useSkillStore()
  const [activeTab, setActiveTab] = useState('manual')

  // 智能生成相关状态
  const resetGenerateStore = useAgentGenerateStore((s) => s.resetAll)
  const generatedAgent = useAgentGenerateStore((s) => s.generatedAgent)
  const generatePhase = useAgentGenerateStore((s) => s.phase)
  const { stopGeneration } = useAIAgentGeneration()

  /** 已启用的 Skill 选项 */
  const skillOptions = useMemo(
    () =>
      skills
        .filter((s) => s.enabled)
        .map((s) => ({ label: s.name, value: s.id })),
    [skills]
  )

  /** AI 生成完成后，自动填充到手动填写 Tab */
  useEffect(() => {
    if (generatePhase === 'done' && generatedAgent) {
      // 将 AI 生成的 tools（Record<string, boolean>）转换为 Checkbox.Group 需要的 string[]
      const enabledTools = generatedAgent.tools
        ? Object.entries(generatedAgent.tools).filter(([, v]) => v).map(([k]) => k)
        : ALL_TOOLS.map((t) => t.value)

      form.setFieldsValue({
        name: generatedAgent.name || '',
        emoji: generatedAgent.emoji || '🤖',
        description: generatedAgent.description || '',
        systemPrompt: generatedAgent.systemPrompt || '',
        agentMode: generatedAgent.mode || 'primary',
        tools: enabledTools,
        autoMode: generatedAgent.autoMode || false,
      })
      setActiveTab('manual')
    }
  }, [generatePhase, generatedAgent, form])

  /** 打开抽屉时重置/填充表单 */
  useEffect(() => {
    if (!visible) return

    if (mode === 'edit' && agent) {
      const enabledTools = Object.entries(agent.tools ?? {})
        .filter(([, v]) => v)
        .map(([k]) => k)

      form.setFieldsValue({
        name: agent.name,
        emoji: agent.emoji,
        description: agent.description,
        agentMode: agent.mode ?? 'primary',
        systemPrompt: agent.systemPrompt ?? '',
        tools: enabledTools,
        skillIds: agent.skillIds,
        autoMode: agent.autoMode,
        showInChat: !agent.hidden,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        emoji: '🤖',
        agentMode: 'primary',
        autoMode: false,
        showInChat: true,
        skillIds: [],
        tools: ALL_TOOLS.map((t) => t.value),
        systemPrompt: '',
      })
      setActiveTab('manual')
    }
  }, [visible, mode, agent, form])

  /** 关闭抽屉时先停止流再重置状态 */
  const handleClose = () => {
    stopGeneration()
    resetGenerateStore()
    setActiveTab('manual')
    onClose()
  }

  const handleFinish = (values: Record<string, unknown>) => {
    if (mode === 'create') {
      const backendName = toBackendName(values.name as string)
      if (!backendName) {
        form.setFields([{ name: 'name', errors: ['名称必须包含英文或数字字符'] }])
        return
      }
      if (RESERVED_BACKEND_NAMES.has(backendName)) {
        form.setFields([{ name: 'name', errors: [`名称「${values.name as string}」与内置 Agent 冲突，请换一个名称`] }])
        return
      }
    }

    const selectedTools = (values.tools as string[]) ?? []
    const toolsRecord: Record<string, boolean> = Object.fromEntries(
      ALL_TOOLS.map((t) => [t.value, selectedTools.includes(t.value)])
    )

    const result: Partial<Agent> = {
      name: values.name as string,
      emoji: (values.emoji as string) || '🤖',
      description: (values.description as string) || '',
      mode: (values.agentMode as Agent['mode']) || 'primary',
      systemPrompt: (values.systemPrompt as string) || '',
      tools: toolsRecord,
      skillIds: (values.skillIds as string[]) || [],
      autoMode: (values.autoMode as boolean) || false,
      hidden: !(values.showInChat as boolean ?? true),
    }

    if (mode === 'create') {
      result.backendName = toBackendName(values.name as string)
    }

    onSubmit(result)
  }

  /** 表单内容（create 和 edit 共用） */
  const formContent = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      autoComplete="off"
    >
      {/* 基本信息 */}
      <div className="mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        基本信息
      </div>
      <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex gap-3">
          <Form.Item label="Emoji" name="emoji" className="!mb-0 w-20 flex-shrink-0">
            <Input placeholder="🤖" maxLength={4} />
          </Form.Item>
          <Form.Item
            label="名称"
            name="name"
            className="!mb-0 flex-1"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如：My Assistant" maxLength={50} />
          </Form.Item>
        </div>

        <Form.Item label="描述" name="description" className="!mb-0 !mt-3">
          <Input.TextArea
            placeholder="一句话描述这个 Agent 的能力和触发时机"
            rows={2}
            maxLength={200}
            showCount
          />
        </Form.Item>
      </div>

      {/* 系统提示词 */}
      <div className="mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        系统提示词
      </div>
      <Form.Item name="systemPrompt" className="!mb-4">
        <Input.TextArea
          placeholder={`定义 Agent 的角色、行为规范和工作流程，例如：\n\n你是一个专注于代码审查的助手，每次审查需要关注...\n\n## 工作流程\n1. 分析代码变更...\n2. 检查潜在问题...`}
          rows={8}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Form.Item>

      {/* 模式 & 工具 */}
      <div className="mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        运行配置
      </div>
      <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Form.Item label="Agent 模式" name="agentMode" className="!mb-3">
          <Select options={MODE_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="可用工具"
          name="tools"
          className="!mb-0"
          extra="不勾选的工具 Agent 将无法使用"
        >
          <Checkbox.Group className="!flex !flex-wrap !gap-x-4 !gap-y-1">
            {ALL_TOOLS.map((t) => (
              <Checkbox key={t.value} value={t.value}>
                <span className="text-xs">
                  <span className="font-mono">{t.label}</span>
                  <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                    {t.desc}
                  </span>
                </span>
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
      </div>

      {/* 高级选项 */}
      <div className="mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        高级选项
      </div>
      <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Form.Item label="关联 Skills" name="skillIds" className="!mb-3">
          <Select
            mode="multiple"
            placeholder="选择要关联的 Skill"
            options={skillOptions}
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="自动模式"
          name="autoMode"
          valuePropName="checked"
          className="!mb-3"
          extra="开启后 Agent 可自动调用工具无需每步确认"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="在聊天中展示"
          name="showInChat"
          valuePropName="checked"
          className="!mb-0"
          extra="关闭后该 Agent 不会出现在聊天的 Agent 选择器中"
        >
          <Switch />
        </Form.Item>
      </div>
    </Form>
  )

  return (
    <Drawer
      title={mode === 'create' ? '创建 Agent' : '编辑 Agent'}
      open={visible}
      onClose={handleClose}
      width={560}
      destroyOnClose
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              确认
            </Button>
          </Space>
        </div>
      }
    >
      {mode === 'create' ? (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'manual',
              label: '手动填写',
              children: formContent,
            },
            {
              key: 'ai-generate',
              label: '✨ 智能生成',
              children: <AIGenerateAgentTab />,
            },
          ]}
        />
      ) : (
        formContent
      )}
    </Drawer>
  )
}

export default AgentDrawer
