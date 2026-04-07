import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent } from '@/types'
import { STORAGE_KEYS } from '@/utils/storageKeys'

interface AgentState {
  agents: Agent[]
  currentAgent: Agent | null
  /** 用户主动删除的 CLI/磁盘 agent backendName 黑名单，持久化，防止重启后复现 */
  removedDiskAgentNames: string[]
  /** 首次磁盘同步是否已完成，用于控制页面骨架屏 */
  isInitialized: boolean
  setAgents: (agents: Agent[]) => void
  setCurrentAgent: (agent: Agent | null) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  removeAgent: (id: string) => void
  toggleEnabled: (id: string) => void
  /** 合并磁盘/CLI Agent（按 backendName 去重，跳过黑名单） */
  mergeDiskAgents: (diskAgents: Agent[]) => void
  /** 标记初始化完成 */
  setInitialized: () => void
  /** 获取自定义 Agent 数量（不含 isBuiltin 和 isFromDisk） */
  getCustomAgentCount: () => number
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      currentAgent: null,
      removedDiskAgentNames: [],
      isInitialized: false,

      setAgents: (agents: Agent[]) => {
        set({ agents })
      },

      setCurrentAgent: (agent: Agent | null) => {
        set({ currentAgent: agent })
      },

      addAgent: (agent: Agent) => {
        set((state) => ({ agents: [...state.agents, agent] }))
      },

      updateAgent: (id: string, updates: Partial<Agent>) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a
          ),
          currentAgent:
            state.currentAgent?.id === id
              ? { ...state.currentAgent, ...updates, updatedAt: Date.now() }
              : state.currentAgent,
        }))
      },

      removeAgent: (id: string) => {
        set((state) => {
          const target = state.agents.find((a) => a.id === id)
          return {
            agents: state.agents.filter((a) => a.id !== id),
            currentAgent: state.currentAgent?.id === id ? null : state.currentAgent,
            // CLI/磁盘 agent 删除后加入黑名单，防止重启复现
            removedDiskAgentNames:
              target?.isFromDisk && target.backendName
                ? [...state.removedDiskAgentNames, target.backendName]
                : state.removedDiskAgentNames,
          }
        })
      },

      toggleEnabled: (id: string) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled, updatedAt: Date.now() } : a
          ),
          currentAgent:
            state.currentAgent?.id === id
              ? { ...state.currentAgent, enabled: !state.currentAgent.enabled, updatedAt: Date.now() }
              : state.currentAgent,
        }))
      },

      mergeDiskAgents: (diskAgents: Agent[]) => {
        set((state) => {
          const { removedDiskAgentNames } = state
          const removedSet = new Set(removedDiskAgentNames)

          // 过滤掉黑名单里的（黑名单只针对非内置）
          const filtered = diskAgents.filter(
            (a) => a.isBuiltin || !removedSet.has(a.backendName)
          )

          // 内置 agent 的 backendName 集合（磁盘文件不能覆盖内置 agent）
          const builtinBackendNames = new Set(
            state.agents.filter((a) => a.isBuiltin).map((a) => a.backendName)
          )

          // 所有已存在 agent 的 backendName（全量去重，防止任何来源重复）
          const existingBackendNames = new Set(state.agents.map((a) => a.backendName))

          // 本次需要新增的 agent（不重复、不被内置遮蔽）
          const toAdd = filtered
            .filter((a) => !existingBackendNames.has(a.backendName))
            .map((a) => ({ ...a, enabled: a.enabled ?? true }))

          // 更新已存在的内置 agent（CLI 可能更新了描述等字段）
          const builtinUpdates = new Map(
            filtered.filter((a) => a.isBuiltin).map((a) => [a.backendName, a])
          )

          // 移除旧的磁盘 Agent（不在本次同步结果中的非内置磁盘 agent）
          const currentDiskNames = new Set(
            filtered.filter((a) => !a.isBuiltin).map((a) => a.backendName)
          )
          const kept = state.agents
            .filter((a) => !a.isFromDisk || currentDiskNames.has(a.backendName))
            .map((a) => {
              if (a.isBuiltin && builtinUpdates.has(a.backendName)) {
                const update = builtinUpdates.get(a.backendName)!
                // 保留本地已确定的 isBuiltin/mode，防止 CLI 返回值覆盖
                return { ...a, ...update, isBuiltin: true, mode: a.mode }
              }
              return a
            })

          // 过滤掉磁盘文件中与内置同名的（防止重复追加）
          const safeToAdd = toAdd.filter((a) => !builtinBackendNames.has(a.backendName))

          return { agents: [...kept, ...safeToAdd] }
        })
      },

      setInitialized: () => set({ isInitialized: true }),

      getCustomAgentCount: () => {
        const { agents } = get()
        return agents.filter((a) => !a.isBuiltin && !a.isFromDisk).length
      },
    }),
    { name: STORAGE_KEYS.AGENTS }
  )
)
