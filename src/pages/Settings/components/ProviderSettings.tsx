import { type FC, useState, useCallback } from 'react'
import { Input, Button, Tag, Modal, message } from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import { useSettingsStore } from '@/stores'
import { useServices } from '@/services/ServiceProvider'
import type { ProviderSettingMode, ModelConfig, ModelProviderType } from '@/types'

/** AI Provider 设置页 - OpenCode 终端风格 */
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
    setConnectionStatus,
    // 多模型相关
    multiModels,
    activeMultiModelId,
    addMultiModel,
    updateMultiModel,
    removeMultiModel,
    setActiveMultiModelId,
    setMultiModelConnectionStatus
  } = useSettingsStore()

  const { providerService } = useServices()

  /** 新模型输入 */
  const [newModel, setNewModel] = useState('')

  /** 模型编辑弹窗状态 */
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null)
  const [formData, setFormData] = useState<{
    providerType: ModelProviderType
    apiUrl: string
    apiKey: string
    modelId: string
  }>({
    providerType: 'qwen',
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    modelId: ''
  })

  /** 模型列表（从 API 获取） */
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)

  /** 重启服务（Mock） */
  const handleRestartServe = useCallback(() => {
    setServeStatus('restarting')
    setTimeout(() => {
      setServeStatus('running')
      message.success('服务已重启')
    }, 2000)
  }, [setServeStatus])

  /** 测试连接（真实调用） */
  const handleTestConnection = useCallback(async () => {
    if (!apiBaseUrl.trim()) {
      message.warning('请先输入 API Base URL')
      return
    }
    setConnectionStatus('testing')
    try {
      const result = await providerService.testConnection(apiBaseUrl, apiKey)
      if (result.success) {
        setConnectionStatus('success')
        message.success('连接成功')
      } else {
        setConnectionStatus('failed', result.error)
        message.error(result.error ?? '连接失败')
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      setConnectionStatus('failed', error)
      message.error(error)
    }
  }, [apiBaseUrl, apiKey, providerService, setConnectionStatus])

  /** 添加自定义模型 */
  const handleAddModel = useCallback(() => {
    const trimmed = newModel.trim()
    if (!trimmed) return
    addCustomModel(trimmed)
    setNewModel('')
  }, [newModel, addCustomModel])

  /** 打开添加模型弹窗 */
  const handleOpenAddModel = useCallback(() => {
    setEditingModel(null)
    setAvailableModels([])
    setFormData({
      providerType: 'qwen',
      apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: '',
      modelId: ''
    })
    setIsModalOpen(true)
  }, [])

  /** 打开编辑模型弹窗 */
  const handleOpenEditModel = useCallback((model: ModelConfig) => {
    setEditingModel(model)
    setAvailableModels([])
    setFormData({
      providerType: model.providerType,
      apiUrl: model.apiUrl,
      apiKey: model.apiKey,
      modelId: model.modelId
    })
    setIsModalOpen(true)
  }, [])

  /** 从 API 获取模型列表 */
  const handleFetchModels = useCallback(async () => {
    if (!formData.apiUrl.trim()) {
      message.warning('请先输入 API Base URL')
      return
    }
    if (!formData.apiKey.trim()) {
      message.warning('请先输入 API Key')
      return
    }

    setFetchingModels(true)
    try {
      const normalizedUrl = formData.apiUrl.replace(/\/+$/, '')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(`${normalizedUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${formData.apiKey}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${errorBody || res.statusText}`)
      }

      const data = await res.json() as { data?: Array<{ id: string }> }
      const models = data.data?.map(m => m.id).filter(Boolean) || []

      if (models.length === 0) {
        message.info('未获取到模型列表')
        return
      }

      setAvailableModels(models)
      message.success(`成功获取 ${models.length} 个模型`)

      // 如果有默认推荐模型，自动选中
      const recommendedModels: Record<ModelProviderType, string> = {
        qwen: 'qwen-turbo',
        doubao: 'doubao-pro-32k',
        deepseek: 'deepseek-chat',
        kling: 'kling-v1',
        kimi: 'moonshot-v1-8k',
        minimax: 'MiniMax-M2.5',
        openai: 'gpt-4o',
        custom: ''
      }
      const recommended = recommendedModels[formData.providerType]
      if (recommended && models.includes(recommended)) {
        setFormData(prev => ({ ...prev, modelId: recommended }))
      } else if (models.length > 0 && !formData.modelId) {
        setFormData(prev => ({ ...prev, modelId: models[0] }))
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      message.error(`获取模型列表失败：${error}`)
    } finally {
      setFetchingModels(false)
    }
  }, [formData.apiUrl, formData.apiKey, formData.providerType, formData.modelId])

  /** 测试模型连接 */
  const handleTestModelConnection = useCallback(async (model: ModelConfig) => {
    if (!model.apiUrl.trim()) {
      message.warning('请先配置 API Base URL')
      return
    }
    if (!model.apiKey.trim()) {
      message.warning('请先配置 API Key')
      return
    }

    setMultiModelConnectionStatus(model.id, 'testing')
    try {
      const result = await providerService.testConnection(model.apiUrl, model.apiKey)
      if (result.success) {
        setMultiModelConnectionStatus(model.id, 'success')
        message.success(`${model.name} 连接成功`)
      } else {
        setMultiModelConnectionStatus(model.id, 'failed', result.error)
        message.error(result.error ?? '连接失败')
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      setMultiModelConnectionStatus(model.id, 'failed', error)
      message.error(error)
    }
  }, [providerService, setMultiModelConnectionStatus])

  /** 保存模型 */
  const handleSaveModel = useCallback(() => {
    if (!formData.apiKey.trim()) {
      message.warning('请输入 API Key')
      return
    }
    if (!formData.modelId.trim()) {
      message.warning('请选择或输入模型 ID')
      return
    }

    const providerLabels: Record<ModelProviderType, string> = {
      qwen: '通义千问',
      doubao: '豆包',
      deepseek: 'DeepSeek',
      kling: '可灵',
      kimi: 'Kimi',
      minimax: 'MiniMax',
      openai: 'OpenAI',
      custom: '自定义'
    }
    // 自动生成模型名称
    const autoName = `${providerLabels[formData.providerType]} - ${formData.modelId}`

    if (editingModel) {
      updateMultiModel(editingModel.id, {
        name: autoName,
        providerType: formData.providerType,
        apiUrl: formData.apiUrl.trim(),
        apiKey: formData.apiKey.trim(),
        modelId: formData.modelId.trim()
      })
      message.success('模型已更新')
    } else {
      const newModel: ModelConfig = {
        id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: autoName,
        providerType: formData.providerType,
        apiUrl: formData.apiUrl.trim(),
        apiKey: formData.apiKey.trim(),
        modelId: formData.modelId.trim(),
        enabled: true
      }
      addMultiModel(newModel)
      message.success('模型已添加')
    }
    setIsModalOpen(false)
  }, [editingModel, formData, updateMultiModel, addMultiModel])

  /** 删除模型 */
  const handleDeleteModel = useCallback((model: ModelConfig) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除模型 "${model.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        removeMultiModel(model.id)
        message.success('模型已删除')
      }
    })
  }, [removeMultiModel])

  /** 激活模型 */
  const handleActivateModel = useCallback((model: ModelConfig) => {
    setActiveMultiModelId(model.id)
    message.success(`已切换到 ${model.name}`)
  }, [setActiveMultiModelId])

  /** 服务状态颜色映射 */
  const statusConfig = {
    running: { color: 'var(--success)', text: '运行中' },
    stopped: { color: 'var(--error)', text: '已停止' },
    restarting: { color: 'var(--info)', text: '重启中' }
  }

  return (
    <section className="space-y-8">
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
          AI PROVIDER
        </h2>
        <div
          className="mt-1 text-sm"
          style={{
            color: 'var(--text-muted)',
            lineHeight: 2.0
          }}
        >
          // 配置 AI 模型提供者
        </div>
      </div>

      {/* 模式切换 */}
      <div
        className="flex gap-4 rounded p-1"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <button
          onClick={() => setProviderSettingMode('codemaker')}
          className="flex-1 rounded px-4 py-2 text-sm font-medium transition-colors duration-150"
          style={{
            backgroundColor: providerSettingMode === 'codemaker' ? 'var(--bg-primary)' : 'transparent',
            color: providerSettingMode === 'codemaker' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
        >
          Codemaker 模式
        </button>
        <button
          onClick={() => setProviderSettingMode('direct')}
          className="flex-1 rounded px-4 py-2 text-sm font-medium transition-colors duration-150"
          style={{
            backgroundColor: providerSettingMode === 'direct' ? 'var(--bg-primary)' : 'transparent',
            color: providerSettingMode === 'direct' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
        >
          直连模式
        </button>
      </div>

      {/* Codemaker 模式面板 */}
      {providerSettingMode === 'codemaker' && (
        <div className="space-y-6">
          {/* 服务状态 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)', minWidth: '120px' }}
              >
                status
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusConfig[serveStatus].color }}
                />
                <span style={{ color: statusConfig[serveStatus].color }}>
                  {statusConfig[serveStatus].text}
                </span>
              </div>
            </div>
            <button
              onClick={handleRestartServe}
              disabled={serveStatus === 'restarting'}
              className="rounded transition-opacity duration-150 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: 2.0,
                padding: '4px 20px',
                borderRadius: '4px'
              }}
            >
              <ReloadOutlined spin={serveStatus === 'restarting'} className="mr-2" />
              重启服务
            </button>
          </div>

          {/* 服务地址 */}
          <div className="flex items-center gap-4">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)', minWidth: '120px' }}
            >
              endpoint
            </span>
            <code
              className="text-sm"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
                padding: '4px 12px',
                borderRadius: '4px',
                border: `1px solid var(--border-primary)`
              }}
            >
              {serveAddress}
            </code>
          </div>

          {/* 测试连接 */}
          <div className="flex items-center gap-4">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)', minWidth: '120px' }}
            >
              test
            </span>
            <button
              onClick={() => {
                setConnectionStatus('testing')
                setTimeout(() => setConnectionStatus('success'), 1000)
              }}
              className="rounded transition-opacity duration-150"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: 2.0,
                padding: '4px 20px',
                borderRadius: '4px'
              }}
            >
              测试连接
            </button>
            {connectionStatus === 'success' && (
              <CheckCircleFilled style={{ color: 'var(--success)' }} />
            )}
            {connectionStatus === 'failed' && (
              <CloseCircleFilled style={{ color: 'var(--error)' }} />
            )}
            {connectionStatus === 'testing' && (
              <LoadingOutlined style={{ color: 'var(--info)' }} />
            )}
          </div>
        </div>
      )}

      {/* 直连模式面板 */}
      {providerSettingMode === 'direct' && (
        <div className="space-y-6">
          {/* 多模型管理 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3
                className="font-bold"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.5,
                  color: 'var(--text-primary)'
                }}
              >
                MULTI-MODEL
              </h3>
              <button
                onClick={handleOpenAddModel}
                className="rounded transition-opacity duration-150"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: 2.0,
                  padding: '4px 20px',
                  borderRadius: '4px'
                }}
              >
                <PlusOutlined className="mr-2" />
                添加模型
              </button>
            </div>

            {multiModels.length === 0 ? (
              <div
                className="rounded p-8 text-center"
                style={{
                  border: `1px dashed var(--border-secondary)`,
                  backgroundColor: 'var(--bg-tertiary)'
                }}
              >
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  暂无模型配置，点击"添加模型"开始配置
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {multiModels.map((model) => {
                  const isActive = model.id === activeMultiModelId
                  const providerLabels: Record<ModelProviderType, string> = {
                    qwen: '通义千问',
                    doubao: '豆包',
                    deepseek: 'DeepSeek',
                    kling: '可灵',
                    kimi: 'Kimi',
                    minimax: 'MiniMax',
                    openai: 'OpenAI',
                    custom: '自定义'
                  }

                  return (
                    <div
                      key={model.id}
                      className="rounded p-4"
                      style={{
                        border: isActive ? `2px solid var(--accent-primary)` : `1px solid var(--border-primary)`,
                        backgroundColor: isActive ? 'rgba(0, 122, 255, 0.05)' : 'var(--bg-secondary)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {model.name}
                            </span>
                            <Tag
                              style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                border: `1px solid var(--border-primary)`,
                                color: 'var(--accent-primary)',
                                fontFamily: 'inherit',
                                fontSize: '12px',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              {providerLabels[model.providerType]}
                            </Tag>
                            {model.connectionStatus === 'success' && (
                              <CheckCircleFilled style={{ color: 'var(--success)' }} />
                            )}
                            {model.connectionStatus === 'failed' && (
                              <CloseCircleFilled
                                style={{ color: 'var(--error)' }}
                                title={model.connectionError}
                              />
                            )}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: 'var(--text-muted)', fontFamily: 'inherit' }}
                          >
                            <div>API: {model.apiUrl}</div>
                            <div>模型: {model.modelId}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            className="rounded p-1 transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                            onClick={() => handleTestModelConnection(model)}
                            title="测试连接"
                          >
                            {model.connectionStatus === 'testing' ? (
                              <LoadingOutlined />
                            ) : (
                              <PlayCircleOutlined />
                            )}
                          </button>
                          <button
                            className="rounded p-1 transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                            onClick={() => handleOpenEditModel(model)}
                            title="编辑"
                          >
                            <EditOutlined />
                          </button>
                          <button
                            className="rounded p-1 transition-colors duration-150 hover:bg-[var(--bg-tertiary)] text-[var(--error)]"
                            onClick={() => handleDeleteModel(model)}
                            title="删除"
                          >
                            <DeleteOutlined />
                          </button>
                          {!isActive && (
                            <button
                              className="rounded px-3 py-1 text-sm font-medium transition-colors duration-150"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: '#fdfcfc',
                                borderRadius: '4px'
                              }}
                              onClick={() => handleActivateModel(model)}
                            >
                              使用
                            </button>
                          )}
                          {isActive && (
                            <span
                              className="rounded px-2 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: 'var(--info)',
                                color: '#fdfcfc'
                              }}
                            >
                              使用中
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 模型编辑弹窗 */}
      <Modal
        title={
          <span style={{ fontFamily: 'inherit', fontWeight: 700 }}>
            {editingModel ? '编辑模型' : '添加模型'}
          </span>
        }
        open={isModalOpen}
        onOk={handleSaveModel}
        onCancel={() => setIsModalOpen(false)}
        okText={editingModel ? '保存' : '添加'}
        cancelText="取消"
        width={600}
        styles={{
          body: { fontFamily: 'inherit' }
        }}
      >
        <div className="space-y-4" style={{ marginTop: 24 }}>
          {/* 提供者类型 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              模型提供者
            </label>
            <Input
              value={formData.providerType}
              onChange={(e) => {
                const defaultUrls: Record<ModelProviderType, string> = {
                  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                  doubao: 'https://ark.cn-beijing.volces.com/api/v3',
                  deepseek: 'https://api.deepseek.com/v1',
                  kling: 'https://api.klingai.com/v1',
                  kimi: 'https://api.moonshot.cn/v1',
                  minimax: 'https://api.minimax.chat/v1',
                  openai: 'https://api.openai.com/v1',
                  custom: ''
                }
                setAvailableModels([])
                setFormData({
                  ...formData,
                  providerType: e.target.value as ModelProviderType,
                  apiUrl: defaultUrls[e.target.value as ModelProviderType],
                  modelId: ''
                })
              }}
              placeholder="选择或输入模型提供者"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: `1px solid var(--border-primary)`,
                borderRadius: '6px',
                padding: '12px 16px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              API Key
            </label>
            <Input.Password
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-..."
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: `1px solid var(--border-primary)`,
                borderRadius: '6px',
                padding: '12px 16px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* 获取模型列表 + 模型选择 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                选择模型
              </label>
              <Button
                size="small"
                icon={fetchingModels ? <LoadingOutlined /> : undefined}
                loading={fetchingModels}
                onClick={handleFetchModels}
                disabled={!formData.apiKey.trim()}
              >
                {fetchingModels ? '获取中...' : '获取模型列表'}
              </Button>
            </div>
            {availableModels.length > 0 ? (
              <Input
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                placeholder="选择或输入模型 ID"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid var(--border-primary)`,
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontFamily: 'inherit'
                }}
              />
            ) : (
              <Input
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                placeholder="先点击右侧按钮获取模型列表，或手动输入模型 ID"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid var(--border-primary)`,
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontFamily: 'inherit'
                }}
              />
            )}
          </div>
        </div>
      </Modal>
    </section>
  )
}

export default ProviderSettings
