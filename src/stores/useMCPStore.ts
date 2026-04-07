import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MCPConfig, MCPStatus } from '@/types'

interface MCPState {
  mcps: MCPConfig[]
  /** 首次磁盘同步是否已完成，用于控制页面骨架屏 */
  isInitialized: boolean
  /** 添加自定义 MCP */
  addMCP: (mcp: MCPConfig) => void
  /** 更新 MCP 配置 */
  updateMCP: (id: string, updates: Partial<MCPConfig>) => void
  /** 删除自定义 MCP */
  removeMCP: (id: string) => void
  /** 切换启用/禁用 */
  toggleEnabled: (id: string) => void
  /** 更新连接状态 */
  updateStatus: (id: string, status: MCPStatus) => void
  /** 从配置文件合并 MCP 列表 */
  mergeConfigFile: (mcps: MCPConfig[]) => void
  /** 标记初始化完成 */
  setInitialized: () => void
}

export const useMCPStore = create<MCPState>()(
  persist(
    (set) => ({
      mcps: [],
      isInitialized: false,

      addMCP: (mcp) =>
        set((state) => ({
          mcps: [...state.mcps, mcp],
        })),

      updateMCP: (id, updates) =>
        set((state) => ({
          mcps: state.mcps.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m,
          ),
        })),

      removeMCP: (id) =>
        set((state) => ({
          mcps: state.mcps.filter((m) => m.id !== id),
        })),

      toggleEnabled: (id) =>
        set((state) => ({
          mcps: state.mcps.map((m) =>
            m.id === id ? { ...m, enabled: !m.enabled, updatedAt: Date.now() } : m,
          ),
        })),

      updateStatus: (id, status) =>
        set((state) => ({
          mcps: state.mcps.map((m) =>
            m.id === id ? { ...m, status } : m,
          ),
        })),

      mergeConfigFile: (incoming) =>
        set((state) => {
          const existingIds = new Set(state.mcps.map((m) => m.id))
          const newMcps = incoming.filter((m) => !existingIds.has(m.id))
          return { mcps: [...state.mcps, ...newMcps] }
        }),

      setInitialized: () => set({ isInitialized: true }),
    }),
    {
      name: 'mcp-store',
      /** 持久化时排除 status，恢复时重置为 disconnected */
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.mcps = state.mcps.map((m) => ({
            ...m,
            status: 'disconnected' as MCPStatus,
          }))
        }
      },
    },
  ),
)
