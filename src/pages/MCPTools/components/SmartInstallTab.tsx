import { useState, useCallback } from 'react'
import type { FC } from 'react'
import { Button, Input, message } from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { parseMCPInput } from '@/utils/mcpParser'
import type { ParseResult } from '@/utils/mcpParser'
import { useMCPStore } from '@/stores'
import { writeMCPConfig } from '@/utils/mcpConfigSync'

interface SmartInstallTabProps {
  onClose: () => void
}

/** 智能安装 Tab — 粘贴 JSON/URL/Token 自动识别 */
const SmartInstallTab: FC<SmartInstallTabProps> = ({ onClose }) => {
  const { mcps, addMCP } = useMCPStore()
  const [rawInput, setRawInput] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  /** 识别成功后允许编辑名称 */
  const [editableName, setEditableName] = useState('')

  /** 执行识别 */
  const handleParse = useCallback(() => {
    const result = parseMCPInput(rawInput)
    setParseResult(result)
    if (result.success && result.name) {
      setEditableName(result.name)
    }
    if (!result.success) {
      message.warning(result.error || '识别失败')
    }
  }, [rawInput])

  /** 确认添加 */
  const handleConfirm = useCallback(async () => {
    if (!parseResult?.success) return

    // 名称唯一性校验
    const nameExists = mcps.some((m) => m.name === editableName)
    if (nameExists) {
      message.error(`名称「${editableName}」已存在，请修改后重试`)
      return
    }

    const now = Date.now()
    const newMCP = {
      id: `mcp-${now}`,
      name: editableName,
      type: parseResult.type!,
      enabled: true,
      isBuiltin: false,
      status: 'disconnected' as const,
      command: parseResult.command,
      args: parseResult.args,
      env: parseResult.env,
      url: parseResult.url,
      headers: parseResult.headers,
      createdAt: now,
      updatedAt: now,
    }

    addMCP(newMCP)

    // 持久化 Mock
    const allMcps = [...mcps, newMCP]
    await writeMCPConfig(allMcps)
    message.info('配置已保存。如需生效，请重启 codemaker serve')

    message.success(`已添加「${editableName}」`)
    onClose()
  }, [parseResult, editableName, mcps, addMCP, onClose])

  /** 重置预览回到输入状态 */
  const handleCancel = useCallback(() => {
    setParseResult(null)
    setEditableName('')
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* 输入区域 */}
      <Input.TextArea
        rows={8}
        placeholder="粘贴 JSON 配置、URL 或 Bearer Token..."
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'monospace',
        }}
      />

      {/* 识别按钮 */}
      {!parseResult?.success && (
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleParse}
          disabled={!rawInput.trim()}
        >
          识别
        </Button>
      )}

      {/* 识别成功：预览卡片 */}
      {parseResult?.success && (
        <div
          className="rounded-lg border p-4"
          style={{
            borderColor: 'var(--success)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <CheckCircleOutlined style={{ color: 'var(--success)', fontSize: 16 }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              识别成功
            </span>
          </div>

          {/* 可编辑名称 */}
          <div className="mb-3">
            <label className="mb-1 block text-xs" style={{ color: 'var(--text-muted)' }}>
              名称
            </label>
            <Input
              size="small"
              value={editableName}
              onChange={(e) => setEditableName(e.target.value)}
            />
          </div>

          {/* 类型与详情 */}
          <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div>
              <span className="font-medium">类型：</span>
              {parseResult.type === 'local' ? '本地 MCP' : '远程 MCP'}
            </div>
            {parseResult.command && (
              <div>
                <span className="font-medium">命令：</span>
                <code
                  className="ml-1 rounded px-1"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  {parseResult.command} {parseResult.args?.join(' ')}
                </code>
              </div>
            )}
            {parseResult.url && (
              <div>
                <span className="font-medium">URL：</span>
                <code
                  className="ml-1 rounded px-1"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  {parseResult.url || '（待填写）'}
                </code>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex gap-2">
            <Button type="primary" onClick={handleConfirm}>
              确认添加
            </Button>
            <Button onClick={handleCancel}>取消</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartInstallTab
