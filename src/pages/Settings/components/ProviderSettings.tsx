import { type FC, useState, useCallback } from 'react'
import { Segmented, Input, Button, Tag, Badge, message } from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined
} from '@ant-design/icons'
import { useSettingsStore } from '@/stores'
import type { ProviderSettingMode } from '@/types'

/** AI Provider 设置页 */
const ProviderSettings: FC = () => {
  const {
    providerSettingMode,
    serveStatus,
    serveAddress,
    apiBaseUrl,
    apiKey,
    customModels,
    connectionStatus,
    connectionError,
    setProviderSettingMode,
    setServeStatus,
    setApiBaseUrl,
    setApiKey,
    addCustomModel,
    removeCustomModel,
    setConnectionStatus
  } = useSettingsStore()

  /** 新模型输入 */
  const [newModel, setNewModel] = useState('')

  /** 重启服务（Mock） */
  const handleRestartServe = useCallback(() => {
    setServeStatus('restarting')
    setTimeout(() => {
      setServeStatus('running')
      message.success('服务已重启')
    }, 2000)
  }, [setServeStatus])

  /** 测试连接（Mock） */
  const handleTestConnection = useCallback(() => {
    setConnectionStatus('testing')
    setTimeout(() => {
      setConnectionStatus('success')
      message.success('连接成功')
    }, 1000)
  }, [setConnectionStatus])

  /** 添加自定义模型 */
  const handleAddModel = useCallback(() => {
    const trimmed = newModel.trim()
    if (!trimmed) return
    addCustomModel(trimmed)
    setNewModel('')
  }, [newModel, addCustomModel])

  /** 服务状态颜色映射 */
  const statusConfig = {
    running: { color: '#52c41a', text: '运行中' },
    stopped: { color: '#ff4d4f', text: '已停止' },
    restarting: { color: '#1677ff', text: '重启中' }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        AI Provider 设置
      </h2>

      {/* 模式切换 */}
      <Segmented
        value={providerSettingMode}
        onChange={(val) => setProviderSettingMode(val as ProviderSettingMode)}
        options={[
          { label: 'Codemaker 模式', value: 'codemaker' },
          { label: '直连模式', value: 'direct' }
        ]}
        block
      />

      {/* Codemaker 模式面板 */}
      {providerSettingMode === 'codemaker' && (
        <div
          className="space-y-4 rounded-lg border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          {/* 服务状态 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                服务状态
              </span>
              <Badge
                color={statusConfig[serveStatus].color}
                text={
                  <span style={{ color: statusConfig[serveStatus].color }}>
                    {statusConfig[serveStatus].text}
                  </span>
                }
              />
            </div>
            <Button
              icon={<ReloadOutlined spin={serveStatus === 'restarting'} />}
              onClick={handleRestartServe}
              disabled={serveStatus === 'restarting'}
            >
              重启服务
            </Button>
          </div>

          {/* 服务地址 */}
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              服务地址
            </span>
            <code
              className="rounded px-2 py-1 text-sm"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
            >
              {serveAddress}
            </code>
          </div>
        </div>
      )}

      {/* 直连模式面板 */}
      {providerSettingMode === 'direct' && (
        <div
          className="space-y-5 rounded-lg border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          {/* API Base URL */}
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              API Base URL
            </label>
            <Input
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              API Key
            </label>
            <Input.Password
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>

          {/* 测试连接 */}
          <div className="flex items-center gap-3">
            <Button
              type="primary"
              onClick={handleTestConnection}
              loading={connectionStatus === 'testing'}
            >
              测试连接
            </Button>
            {connectionStatus === 'success' && (
              <span className="flex items-center gap-1 text-sm text-green-500">
                <CheckCircleFilled /> 连接成功
              </span>
            )}
            {connectionStatus === 'failed' && (
              <span className="flex items-center gap-1 text-sm text-red-500">
                <CloseCircleFilled /> {connectionError ?? '连接失败'}
              </span>
            )}
            {connectionStatus === 'testing' && (
              <span
                className="flex items-center gap-1 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <LoadingOutlined /> 测试中...
              </span>
            )}
          </div>

          {/* 自定义模型列表 */}
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              自定义模型
            </label>
            <div className="flex flex-wrap gap-2">
              {customModels.map((model) => (
                <Tag
                  key={model}
                  closable
                  onClose={() => removeCustomModel(model)}
                >
                  {model}
                </Tag>
              ))}
              {customModels.length === 0 && (
                <span
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  暂无自定义模型
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="输入模型名称，如 gpt-4o"
                onPressEnter={handleAddModel}
                className="flex-1"
              />
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddModel}
                disabled={!newModel.trim()}
              >
                添加
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderSettings
