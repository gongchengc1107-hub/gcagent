/**
 * 模型 Store
 * 管理从 codemaker CLI 动态获取的模型列表，以及当前选中的模型
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { clearSessionMapOnModelChange } from '@/services/codemakProvider'

/** 默认模型（兜底，未加载时使用） */
export const DEFAULT_MODEL = 'netease-codemaker/claude-sonnet-4-6'

interface ModelStore {
  /** 动态获取的全量模型列表（provider/model 格式） */
  availableModels: string[]
  /** 当前选中模型 */
  currentModel: string
  /** 是否正在加载 */
  loading: boolean

  setAvailableModels: (models: string[]) => void
  setCurrentModel: (model: string) => void
  setLoading: (loading: boolean) => void

  /** 触发从 IPC 加载模型列表 */
  fetchModels: () => Promise<void>
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      availableModels: [],
      currentModel: DEFAULT_MODEL,
      loading: false,

      setAvailableModels: (models) => set({ availableModels: models }),
      setCurrentModel: (model) => {
        // 模型切换时清空 OpenCode sessionMap，确保下次对话使用新模型的新 session
        clearSessionMapOnModelChange()
        set({ currentModel: model })
      },
      setLoading: (loading) => set({ loading }),

      fetchModels: async () => {
        if (typeof window === 'undefined' || !window.electronAPI) return
        set({ loading: true })
        try {
          const models = (await window.electronAPI.invoke('models:list')) as string[]
          if (Array.isArray(models) && models.length > 0) {
            set({ availableModels: models })
          }
        } catch {
          // 静默失败，保持原有列表
        } finally {
          set({ loading: false })
        }
      }
    }),
    {
      name: STORAGE_KEYS.SETTINGS + '-models',
      // 只持久化选中的模型和列表
      partialize: (state) => ({
        availableModels: state.availableModels,
        currentModel: state.currentModel
      })
    }
  )
)
