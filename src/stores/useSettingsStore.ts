import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ThemeMode,
  ProviderMode,
  ProviderSettingMode,
  ServeStatus,
  TestConnectionStatus,
  ModelConfig
} from '@/types'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { applyTheme } from '@/utils/theme'
import type { DirectUsageRecord } from '@/services/directProvider'

interface SettingsState {
  /* ---- 通用 ---- */
  theme: ThemeMode
  providerMode: ProviderMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setProviderMode: (mode: ProviderMode) => void

  /* ---- Provider 设置 ---- */
  providerSettingMode: ProviderSettingMode
  serveStatus: ServeStatus
  serveAddress: string
  /** codemaker serve 实际监听端口（运行时由主进程写入，不持久化） */
  servePort: number
  apiBaseUrl: string
  apiKey: string
  customModels: string[]
  connectionStatus: TestConnectionStatus
  connectionError?: string

  /* ---- 多模型配置 ---- */
  /** 多模型列表 */
  multiModels: ModelConfig[]
  /** 当前激活的模型 ID */
  activeMultiModelId?: string

  setProviderSettingMode: (mode: ProviderSettingMode) => void
  setServeStatus: (status: ServeStatus) => void
  setServePort: (port: number) => void
  setApiBaseUrl: (url: string) => void
  setApiKey: (key: string) => void
  addCustomModel: (model: string) => void
  removeCustomModel: (model: string) => void
  setConnectionStatus: (status: TestConnectionStatus, error?: string) => void

  /* ---- 多模型操作 ---- */
  /** 添加新模型配置 */
  addMultiModel: (model: ModelConfig) => void
  /** 更新模型配置 */
  updateMultiModel: (id: string, updates: Partial<ModelConfig>) => void
  /** 删除模型配置 */
  removeMultiModel: (id: string) => void
  /** 设置激活的模型 */
  setActiveMultiModelId: (id: string) => void
  /** 更新模型连接状态 */
  setMultiModelConnectionStatus: (id: string, status: TestConnectionStatus, error?: string) => void

  /* ---- 直连模式 Usage 统计 ---- */
  /** 直连模式 token 使用记录 */
  directUsageRecords: DirectUsageRecord[]
  /** 添加一条 usage 记录 */
  addDirectUsageRecord: (record: DirectUsageRecord) => void
  /** 清空 usage 记录 */
  clearDirectUsageRecords: () => void

  /** 重置所有设置到默认值 */
  resetAll: () => void
}

/** 默认状态 */
const DEFAULT_STATE = {
  theme: 'light' as ThemeMode,
  providerMode: 'local' as ProviderMode,
  providerSettingMode: 'codemaker' as ProviderSettingMode,
  serveStatus: 'running' as ServeStatus,
  serveAddress: '127.0.0.1:4000',
  servePort: 4000,
  apiBaseUrl: '',
  apiKey: '',
  customModels: [] as string[],
  connectionStatus: 'idle' as TestConnectionStatus,
  connectionError: undefined,
  multiModels: [] as ModelConfig[],
  activeMultiModelId: undefined,
  directUsageRecords: [] as DirectUsageRecord[]
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      /* ---- 通用 ---- */
      setTheme: (theme: ThemeMode) => {
        applyTheme(theme)
        set({ theme })
      },

      toggleTheme: () => {
        const next: ThemeMode = get().theme === 'light' ? 'dark' : 'light'
        applyTheme(next)
        set({ theme: next })
      },

      setProviderMode: (mode: ProviderMode) => {
        set({ providerMode: mode })
      },

      /* ---- Provider 设置 ---- */
      setProviderSettingMode: (mode: ProviderSettingMode) => {
        set({
          providerSettingMode: mode,
          // 同步更新 providerMode：'direct' → 'cloud'，'codemaker' → 'local'
          providerMode: mode === 'direct' ? 'cloud' : 'local'
        })
      },

      setServeStatus: (status: ServeStatus) => {
        set({ serveStatus: status })
      },

      setServePort: (port: number) => {
        set({ servePort: port })
      },

      setApiBaseUrl: (url: string) => {
        set({ apiBaseUrl: url })
      },

      setApiKey: (key: string) => {
        set({ apiKey: key })
      },

      addCustomModel: (model: string) => {
        const current = get().customModels
        if (!current.includes(model)) {
          set({ customModels: [...current, model] })
        }
      },

      removeCustomModel: (model: string) => {
        set({ customModels: get().customModels.filter((m) => m !== model) })
      },

      setConnectionStatus: (status: TestConnectionStatus, error?: string) => {
        set({ connectionStatus: status, connectionError: error })
      },

      /* ---- 多模型操作 ---- */
      addMultiModel: (model: ModelConfig) => {
        const current = get().multiModels
        set({ multiModels: [...current, model] })
        // 如果是第一个模型，自动设为激活
        if (current.length === 0) {
          set({ activeMultiModelId: model.id })
        }
      },

      updateMultiModel: (id: string, updates: Partial<ModelConfig>) => {
        const current = get().multiModels
        const index = current.findIndex(m => m.id === id)
        if (index !== -1) {
          const updated = [...current]
          updated[index] = { ...current[index], ...updates }
          set({ multiModels: updated })
        }
      },

      removeMultiModel: (id: string) => {
        const current = get().multiModels
        const filtered = current.filter(m => m.id !== id)
        const newState: { multiModels: ModelConfig[]; activeMultiModelId?: string } = {
          multiModels: filtered
        }
        // 如果删除的是当前激活的模型，切换到第一个可用的
        if (get().activeMultiModelId === id) {
          newState.activeMultiModelId = filtered.length > 0 ? filtered[0].id : undefined
        }
        set(newState)
      },

      setActiveMultiModelId: (id: string) => {
        set({ activeMultiModelId: id })
      },

      setMultiModelConnectionStatus: (id: string, status: TestConnectionStatus, error?: string) => {
        const current = get().multiModels
        const index = current.findIndex(m => m.id === id)
        if (index !== -1) {
          const updated = [...current]
          updated[index] = { ...current[index], connectionStatus: status, connectionError: error }
          set({ multiModels: updated })
        }
      },

      /* ---- 直连模式 Usage 统计 ---- */
      addDirectUsageRecord: (record: DirectUsageRecord) => {
        const current = get().directUsageRecords
        // 最多保留 500 条，避免无限增长
        const trimmed = current.length > 500 ? current.slice(-400) : current
        set({ directUsageRecords: [...trimmed, record] })
      },

      clearDirectUsageRecords: () => {
        set({ directUsageRecords: [] })
      },

      resetAll: () => {
        set(DEFAULT_STATE)
      }
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      // servePort 是运行时由主进程写入的动态值，不应持久化
      // 持久化旧端口会导致下次启动时用错误端口连接 codemaker serve
      partialize: (state) => ({
        theme: state.theme,
        providerMode: state.providerMode,
        providerSettingMode: state.providerSettingMode,
        serveStatus: state.serveStatus,
        serveAddress: state.serveAddress,
        apiBaseUrl: state.apiBaseUrl,
        apiKey: state.apiKey,
        customModels: state.customModels,
        multiModels: state.multiModels,
        activeMultiModelId: state.activeMultiModelId,
        directUsageRecords: state.directUsageRecords.slice(-300) // 持久化最近 300 条
        // 故意排除：servePort、connectionStatus、connectionError
      })
    }
  )
)
