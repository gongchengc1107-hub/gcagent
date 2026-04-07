import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { initSeedData } from '@/utils/seedData'

interface AuthState {
  isLoggedIn: boolean
  user: User | null
  hasInitializedSeedData: boolean
  /** persist hydration 是否完成 */
  _hasHydrated: boolean
  login: (user: User) => void
  logout: () => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      hasInitializedSeedData: false,
      _hasHydrated: false,

      login: (user: User) => {
        set({ isLoggedIn: true, user })

        // 首次登录时初始化种子数据
        if (!get().hasInitializedSeedData) {
          initSeedData()
          set({ hasInitializedSeedData: true })
        }
      },

      logout: () => {
        set({ isLoggedIn: false, user: null })
      },

      setHasHydrated: (value: boolean) => {
        set({ _hasHydrated: value })
      }
    }),
    {
      name: STORAGE_KEYS.AUTH,
      // _hasHydrated 不持久化，每次加载都从 false 开始
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        hasInitializedSeedData: state.hasInitializedSeedData
      }),
    }
  )
)

// 在 store 创建完成后注册 hydration 监听（避免 Zustand v5 的时序问题：
// onRehydrateStorage 回调在 store 创建期间执行时，useAuthStore 模块变量可能尚未赋值）
const unsub = useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.getState().setHasHydrated(true)
  unsub()
})

// 兜底：如果 hydration 在监听器注册前已同步完成，手动触发
if (useAuthStore.persist.hasHydrated()) {
  useAuthStore.getState().setHasHydrated(true)
}
