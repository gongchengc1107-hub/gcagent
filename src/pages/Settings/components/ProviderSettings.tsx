import { type FC, useState, useCallback } from 'react'
import { Segmented, Input, Button, Tag, Badge, message, Modal, Card, Select, Tooltip } from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import { useSettingsStore } from '@/stores'
import { useServices } from '@/services/ServiceProvider'
import type { ProviderSettingMode, ModelConfig, ModelProviderType, TestConnectionStatus } from '@/types'

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
    name: string
    providerType: ModelProviderType
    apiUrl: string
    apiKey: string
    accessKeyId: string
    accessKeySecret: string
    modelId: string
  }>({
    name: '',
    providerType: 'qwen',
    apiUrl: '',
    apiKey: '',
    accessKeyId: '',
    accessKeySecret: '',
    modelId: ''
  })

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
    setFormData({
      name: '',
      providerType: 'qwen',
      apiUrl: '',
      apiKey: '',
      accessKeyId: '',
      accessKeySecret: '',
      modelId: ''
    })
    setIsModalOpen(true)
  }, [])

  /** 打开编辑模型弹窗 */
  const handleOpenEditModel = useCallback((model: ModelConfig) => {
    setEditingModel(model)
    setFormData({
      name: model.name,
      providerType: model.providerType,
      apiUrl: model.apiUrl,
      apiKey: model.apiKey || '',
      accessKeyId: model.accessKeyId || '',
      accessKeySecret: model.accessKeySecret || '',
      modelId: model.modelId
    })
    setIsModalOpen(true)
  }, [])

  /** 测试模型连接 */
  const handleTestModelConnection = useCallback(async (model: ModelConfig) => {
    if (!model.apiUrl.trim()) {
      message.warning('请先配置 API Base URL')
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
    if (!formData.name.trim()) {
      message.warning('请输入模型名称')
      return
    }
    if (!formData.apiUrl.trim()) {
      message.warning('请输入 API Base URL')
      return
    }
    if (!formData.modelId.trim()) {
      message.warning('请输入模型 ID')
      return
    }
    
    // 验证认证字段
    const isQwen = formData.providerType === 'qwen'
    if (isQwen && (!formData.accessKeyId.trim() || !formData.accessKeySecret.trim())) {
      message.warning('请输入 AccessKey ID 和 AccessKey Secret')
      return
    }
    if (!isQwen && !formData.apiKey.trim()) {
      message.warning('请输入 API Key')
      return
    }

    if (editingModel) {
      // 更新现有模型
      updateMultiModel(editingModel.id, {
        name: formData.name.trim(),
        providerType: formData.providerType,
        apiUrl: formData.apiUrl.trim(),
        apiKey: isQwen ? undefined : formData.apiKey.trim(),
        accessKeyId: isQwen ? formData.accessKeyId.trim() : undefined,
        accessKeySecret: isQwen ? formData.accessKeySecret.trim() : undefined,
        modelId: formData.modelId.trim()
      })
      message.success('模型已更新')
    } else {
      // 添加新模型
      const newModel: ModelConfig = {
        id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        providerType: formData.providerType,
        apiUrl: formData.apiUrl.trim(),
        apiKey: isQwen ? undefined : formData.apiKey.trim(),
        accessKeyId: isQwen ? formData.accessKeyId.trim() : undefined,
        accessKeySecret: isQwen ? formData.accessKeySecret.trim() : undefined,
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

      {/* 多模型管理面板 */}
      {providerSettingMode === 'direct' && (
        <div
          className="space-y-4 rounded-lg border p-6"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              多模型管理
            </h3>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddModel}
            >
              添加模型
            </Button>
          </div>

          {multiModels.length === 0 ? (
            <div
              className="rounded-lg border border-dashed p-8 text-center"
              style={{
                borderColor: 'var(--border-secondary)',
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
                  <Card
                    key={model.id}
                    size="small"
                    style={{
                      border: isActive ? '2px solid #1677ff' : undefined,
                      backgroundColor: isActive ? 'rgba(22, 119, 255, 0.05)' : undefined
                    }}
                    extra={
                      <div className="flex items-center gap-2">
                        <Tooltip title="测试连接">
                          <Button
                            type="text"
                            size="small"
                            icon={
                              model.connectionStatus === 'testing' ? (
                                <LoadingOutlined />
                              ) : (
                                <PlayCircleOutlined />
                              )
                            }
                            onClick={() => handleTestModelConnection(model)}
                          />
                        </Tooltip>
                        <Tooltip title="编辑">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditModel(model)}
                          />
                        </Tooltip>
                        <Tooltip title="删除">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteModel(model)}
                          />
                        </Tooltip>
                        {!isActive && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleActivateModel(model)}
                          >
                            使用
                          </Button>
                        )}
                        {isActive && (
                          <Badge status="processing" text="使用中" color="#1677ff" />
                        )}
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {model.name}
                        </span>
                        <Tag color="blue">{providerLabels[model.providerType]}</Tag>
                        {model.connectionStatus === 'success' && (
                          <CheckCircleFilled style={{ color: '#52c41a' }} />
                        )}
                        {model.connectionStatus === 'failed' && (
                          <Tooltip title={model.connectionError}>
                            <CloseCircleFilled style={{ color: '#ff4d4f' }} />
                          </Tooltip>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        <div>API: {model.apiUrl}</div>
                        <div>模型: {model.modelId}</div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 直连模式面板（原有配置） */}
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

      {/* 模型编辑弹窗 */}
      <Modal
        title={editingModel ? '编辑模型' : '添加模型'}
        open={isModalOpen}
        onOk={handleSaveModel}
        onCancel={() => setIsModalOpen(false)}
        okText={editingModel ? '保存' : '添加'}
        cancelText="取消"
        width={600}
      >
        <div className="space-y-4" style={{ marginTop: 24 }}>
          {/* 模型名称 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              模型名称
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：通义千问 Max"
            />
          </div>

          {/* 提供者类型 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              模型提供者
            </label>
            <Select
              value={formData.providerType}
              onChange={(val) => {
                // 根据提供者类型自动填充默认 API URL
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
                setFormData({ 
                  ...formData, 
                  providerType: val,
                  apiUrl: formData.apiUrl || defaultUrls[val]
                })
              }}
              options={[
                { label: '通义千问（Qwen）', value: 'qwen' },
                { label: '豆包（Doubao）', value: 'doubao' },
                { label: 'DeepSeek', value: 'deepseek' },
                { label: '可灵（Kling）', value: 'kling' },
                { label: 'Kimi（月之暗面）', value: 'kimi' },
                { label: 'MiniMax', value: 'minimax' },
                { label: 'OpenAI', value: 'openai' },
                { label: '自定义', value: 'custom' }
              ]}
              style={{ width: '100%' }}
            />
          </div>

          {/* API Base URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              API Base URL
            </label>
            <Input
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          {/* 认证字段 - 根据提供者类型显示不同 */}
          {formData.providerType === 'qwen' ? (
            <>
              {/* AccessKey ID（千问） */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  AccessKey ID
                </label>
                <Input
                  value={formData.accessKeyId}
                  onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
                  placeholder="LTAI..."
                />
              </div>

              {/* AccessKey Secret（千问） */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  AccessKey Secret
                </label>
                <Input.Password
                  value={formData.accessKeySecret}
                  onChange={(e) => setFormData({ ...formData, accessKeySecret: e.target.value })}
                  placeholder="AccessKey Secret"
                />
              </div>
            </>
          ) : (
            /* API Key（其他 provider） */
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                API Key
              </label>
              <Input.Password
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          )}

          {/* 模型 ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              模型 ID
            </label>
            <Input
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              placeholder="例如：qwen-max, deepseek-chat"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProviderSettings
