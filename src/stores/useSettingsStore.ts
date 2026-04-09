import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ThemeMode,
  ProviderMode,
  ProviderSettingMode,
  ServeStatus,
  TestConnectionStatus
} from '@/types'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { applyTheme } from '@/utils/theme'

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

  setProviderSettingMode: (mode: ProviderSettingMode) => void
  setServeStatus: (status: ServeStatus) => void
  setServePort: (port: number) => void
  setApiBaseUrl: (url: string) => void
  setApiKey: (key: string) => void
  addCustomModel: (model: string) => void
  removeCustomModel: (model: string) => void
  setConnectionStatus: (status: TestConnectionStatus, error?: string) => void

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
  connectionError: undefined
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
        customModels: state.customModels
        // 故意排除：servePort、connectionStatus、connectionError
      })
    }
  )
)
