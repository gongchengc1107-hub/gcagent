import { useState, useCallback, useEffect, useMemo } from 'react'
import type { FC } from 'react'
import { Button, Input, Radio, message } from 'antd'
import { SaveOutlined, PlusOutlined } from '@ant-design/icons'
import type { MCPConfig } from '@/types'
import { useMCPStore } from '@/stores'
import { writeMCPConfig } from '@/utils/mcpConfigSync'
import EnvEditor from './EnvEditor'

/** 模板预填数据，与 MCPConfig 共用部分字段 */
export interface ManualPrefill {
  type?: 'local' | 'remote'
  name?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}

interface ManualAddTabProps {
  /** 编辑模式传入已有配置 */
  editMcp?: MCPConfig | null
  /** 外部预填数据（来自模板或智能安装） */
  prefillData?: ManualPrefill | null
  /** 关闭弹窗回调 */
  onClose: () => void
}

/** 手动添加 Tab — 支持新建与编辑两种模式 */
const ManualAddTab: FC<ManualAddTabProps> = ({ editMcp, prefillData, onClose }) => {
  const { mcps, addMCP, updateMCP } = useMCPStore()
  const isEdit = Boolean(editMcp)

  // 表单状态
  const [mcpType, setMcpType] = useState<'local' | 'remote'>('local')
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [argsStr, setArgsStr] = useState('')
  const [env, setEnv] = useState<Record<string, string>>({})
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<Record<string, string>>({ Authorization: '' })

  /** 编辑模式或模板预填时初始化表单 */
  useEffect(() => {
    const source = editMcp || prefillData
    if (!source) return

    setMcpType(source.type || 'local')
    setName(source.name || '')
    setCommand(source.command || '')
    setArgsStr(source.args?.join(' ') || '')
    setEnv(source.env || {})
    setUrl(source.url || '')
    setHeaders(source.headers || { Authorization: '' })
  }, [editMcp, prefillData])

  /** 名称唯一性校验（编辑时排除自身） */
  const isNameDuplicate = useMemo(() => {
    if (!name.trim()) return false
    return mcps.some((m) => m.name === name.trim() && m.id !== editMcp?.id)
  }, [name, mcps, editMcp])

  /** 解析参数字符串为数组 */
  const parseArgs = useCallback((str: string): string[] => {
    if (!str.trim()) return []
    // 支持空格或逗号分隔
    return str
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [])

  /** 表单校验 */
  const validate = useCallback((): boolean => {
    if (!name.trim()) {
      message.error('请输入 MCP 名称')
      return false
    }
    if (isNameDuplicate) {
      message.error(`名称「${name}」已存在`)
      return false
    }
    if (mcpType === 'local' && !command.trim()) {
      message.error('请输入启动命令')
      return false
    }
    if (mcpType === 'remote' && !url.trim()) {
      message.error('请输入服务 URL')
      return false
    }
    return true
  }, [name, isNameDuplicate, mcpType, command, url])

  /** 提交处理 */
  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    const now = Date.now()
    const args = parseArgs(argsStr)

    if (isEdit && editMcp) {
      // 编辑模式：更新现有配置
      const updates: Partial<MCPConfig> = {
        name: name.trim(),
        type: mcpType,
        updatedAt: now,
        ...(mcpType === 'local'
          ? { command: command.trim(), args, env, url: undefined, headers: undefined }
          : { url: url.trim(), headers, command: undefined, args: undefined, env: undefined }),
      }
      updateMCP(editMcp.id, updates)
      message.success(`已更新「${name}」`)
    } else {
      // 新建模式
      const newMCP: MCPConfig = {
        id: `mcp-${now}`,
        name: name.trim(),
        type: mcpType,
        enabled: true,
        isBuiltin: false,
        status: 'disconnected',
        ...(mcpType === 'local'
          ? { command: command.trim(), args, env }
          : { url: url.trim(), headers }),
        createdAt: now,
        updatedAt: now,
      }
      addMCP(newMCP)
      message.success(`已添加「${name}」`)
    }

    // 持久化 Mock
    const allMcps = useMCPStore.getState().mcps
    await writeMCPConfig(allMcps)
    message.info('配置已保存。如需生效，请重启 codemaker serve')

    onClose()
  }, [
    validate,
    parseArgs,
    argsStr,
    isEdit,
    editMcp,
    name,
    mcpType,
    command,
    env,
    url,
    headers,
    updateMCP,
    addMCP,
    onClose,
  ])

  return (
    <div className="flex flex-col gap-4">
      {/* 类型切换 */}
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          类型
        </label>
        <Radio.Group
          value={mcpType}
          onChange={(e) => setMcpType(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="local">本地 MCP</Radio.Button>
          <Radio.Button value="remote">远程 MCP</Radio.Button>
        </Radio.Group>
      </div>

      {/* 名称（通用） */}
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          名称 <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        <Input
          placeholder="输入 MCP 名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          status={isNameDuplicate ? 'error' : undefined}
        />
        {isNameDuplicate && (
          <div className="mt-1 text-xs" style={{ color: 'var(--error)' }}>
            该名称已被使用
          </div>
        )}
      </div>

      {/* 本地 MCP 表单 */}
      {mcpType === 'local' && (
        <>
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              命令 <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <Input
              placeholder='如 "npx"、"python" 等'
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              参数
            </label>
            <Input
              placeholder="空格或逗号分隔，如 -y @mcp/server"
              value={argsStr}
              onChange={(e) => setArgsStr(e.target.value)}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              环境变量
            </label>
            <EnvEditor value={env} onChange={setEnv} />
          </div>
        </>
      )}

      {/* 远程 MCP 表单 */}
      {mcpType === 'remote' && (
        <>
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              URL <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Headers
            </label>
            <EnvEditor
              value={headers}
              onChange={setHeaders}
              keyPlaceholder="Header Name"
              valuePlaceholder="Header Value"
            />
          </div>
        </>
      )}

      {/* 提交按钮 */}
      <div className="flex justify-end pt-2">
        <Button
          type="primary"
          icon={isEdit ? <SaveOutlined /> : <PlusOutlined />}
          onClick={handleSubmit}
        >
          {isEdit ? '保存修改' : '添加'}
        </Button>
      </div>
    </div>
  )
}

export default ManualAddTab
