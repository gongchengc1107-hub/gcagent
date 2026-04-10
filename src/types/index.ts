/** 用户信息 */
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  /** Codemaker JWT access token，用于 API 请求鉴权 */
  token?: string
  /** token 过期时间戳（ms） */
  tokenExpire?: number
}

/** 聊天会话 */
export interface ChatSession {
  id: string
  title: string
  isPinned: boolean
  agentId: string
  modelId: string
  createdAt: number
  updatedAt: number
}

/** 聊天消息 */
export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  isStreaming?: boolean
  createdAt: number
  toolCalls?: ToolCall[]
  images?: ImageAttachment[]
  /** 参考文件附件 */
  files?: FileAttachment[]
}

/** Agent 配置 */
export interface Agent {
  id: string
  name: string
  /** kebab-case 后端名称 */
  backendName: string
  emoji: string
  description: string
  /** 是否启用（禁用时不出现在对话 agent 选择器中） */
  enabled: boolean
  /** agent 角色模式 */
  mode: 'primary' | 'subagent' | 'all'
  /** 系统提示词正文（写入 .md 文件正文） */
  systemPrompt: string
  /** 可用工具配置，key 为工具名，value 为是否启用 */
  tools: Record<string, boolean>
  /** 关联 Skill ID 列表 */
  skillIds: string[]
  /** 开启后 Agent 可自动调用工具无需每步确认 */
  autoMode: boolean
  /** 是否在聊天 Agent 选择器中隐藏（不展示） */
  hidden?: boolean
  /** 是否为内置 Agent */
  isBuiltin: boolean
  /** 是否来自磁盘同步 */
  isFromDisk: boolean
  createdAt: number
  updatedAt: number
}

/** Skill 定义 */
export interface Skill {
  id: string
  name: string
  description: string
  /** 说明文档（Markdown 格式） */
  readme: string
  /** 标签列表 */
  tags: string[]
  /** 触发词列表 */
  triggers: string[]
  /** 是否启用 */
  enabled: boolean
  createdAt: number
  updatedAt: number
}

/** MCP 连接状态 */
export type MCPStatus = 'connected' | 'disconnected' | 'connecting' | 'needs_auth' | 'failed'

/** MCP 配置 */
export interface MCPConfig {
  id: string
  name: string
  type: 'local' | 'remote'
  enabled: boolean
  /** 是否为内置 MCP */
  isBuiltin: boolean
  status: MCPStatus
  /** 本地 MCP：启动命令 */
  command?: string
  /** 本地 MCP：命令参数 */
  args?: string[]
  /** 本地 MCP：环境变量 */
  env?: Record<string, string>
  /** 远程 MCP：服务地址 */
  url?: string
  /** 远程 MCP：请求头 */
  headers?: Record<string, string>
  createdAt: number
  updatedAt: number
}

/** 工具调用 */
export interface ToolCall {
  id: string
  toolName: string
  status: 'running' | 'success' | 'error'
  params: Record<string, unknown>
  result?: string
  duration?: number // ms
}

/** 图片附件 */
export interface ImageAttachment {
  id: string
  dataUrl: string // base64
  name: string
  size: number // bytes
}

/** 参考文件附件（文本/代码/PDF 等） */
export interface FileAttachment {
  id: string
  /** 文件名（含后缀） */
  name: string
  /** 文件大小（字节） */
  size: number
  /** 提取的文本内容 */
  content: string
  /** 文件后缀，如 '.ts', '.pdf' */
  fileType: string
}

/** 可预览的文件类型 */
export type PreviewFileLanguage = 'json' | 'markdown' | 'html'

/** 侧边栏预览文件 */
export interface PreviewFile {
  /** 唯一标识（messageId-codeBlockIndex 或 filePath hash） */
  id: string
  /** 文件名（如 "response.json" 或从路径提取的文件名） */
  fileName: string
  /** 文件语言/类型 */
  language: PreviewFileLanguage
  /** 文件原始内容 */
  content: string
  /** 编辑后的内容（未保存时暂存） */
  editedContent?: string
  /** 来源消息 ID */
  sourceMessageId: string
  /** 磁盘文件的绝对路径（从消息文本中检测到的） */
  filePath?: string
}

/** 连接状态 */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

/** 主题模式 */
export type ThemeMode = 'light' | 'dark'

/** Provider 模式 */
export type ProviderMode = 'local' | 'cloud'

/** Provider 运行模式（设置页） */
export type ProviderSettingMode = 'codemaker' | 'direct'

/** Serve 服务状态 */
export type ServeStatus = 'running' | 'stopped' | 'restarting'

/** 连接测试状态 */
export type TestConnectionStatus = 'idle' | 'testing' | 'success' | 'failed'

/** Provider 设置状态 */
export interface ProviderSettingsState {
  providerSettingMode: ProviderSettingMode
  serveStatus: ServeStatus
  serveAddress: string
  apiBaseUrl: string
  apiKey: string
  customModels: string[]
  connectionStatus: TestConnectionStatus
  connectionError?: string
}

/** 模型提供者预设类型 */
export type ModelProviderType = 
  | 'qwen'        // 通义千问
  | 'doubao'      // 豆包
  | 'deepseek'    // DeepSeek
  | 'kling'       // 可灵
  | 'kimi'        // Kimi
  | 'minimax'     // MiniMax
  | 'openai'      // OpenAI
  | 'custom'      // 自定义

/** 单个模型配置 */
export interface ModelConfig {
  /** 唯一标识，如 "qwen-max" */
  id: string
  /** 显示名称，如 "通义千问 Max" */
  name: string
  /** 提供者类型 */
  providerType: ModelProviderType
  /** API Base URL */
  apiUrl: string
  /** API Key（用于 OpenAI 兼容的 Bearer Token 认证） */
  apiKey?: string
  /** AccessKey ID（用于阿里云百炼/千问认证） */
  accessKeyId?: string
  /** AccessKey Secret（用于阿里云百炼/千问认证） */
  accessKeySecret?: string
  /** 模型 ID（API 调用时使用） */
  modelId: string
  /** 是否启用 */
  enabled: boolean
  /** 连接测试状态 */
  connectionStatus?: TestConnectionStatus
  /** 连接错误信息 */
  connectionError?: string
}

/** 多模型配置列表 */
export interface MultiModelConfig {
  models: ModelConfig[]
  /** 当前选中的模型 ID */
  activeModelId?: string
}
