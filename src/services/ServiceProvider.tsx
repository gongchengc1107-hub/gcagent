import { createContext, useContext, useMemo, useEffect } from 'react'
import type { IAuthService, IChatService, IMCPService, IProviderService, IFileService } from './interfaces'
import { MockAuthService, MockChatService, MockMCPService, MockProviderService, MockFileService } from './mock'
import { RealProviderService } from './RealProviderService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useModelStore } from '@/stores/useModelStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { readMCPConfig } from '@/utils/mcpConfigSync'
import { syncDiskAgents } from '@/utils/diskSync'
import { syncDiskSkills } from '@/utils/skillDiskSync'
import { useMCPStore, useAgentStore, useSkillStore } from '@/stores'
import { warmUpProvider } from './codemakProvider'

/** Service 容器类型 */
interface ServiceContextType {
  authService: IAuthService
  chatService: IChatService
  mcpService: IMCPService
  providerService: IProviderService
  fileService: IFileService
}

const ServiceContext = createContext<ServiceContextType | null>(null)

/**
 * 模块初始化时立即同步端口（不等 React 渲染）
 * 这确保了即使用户在 useEffect 触发前发送消息，端口也已正确同步。
 */
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI
    .invoke('serve:getPort')
    .then((port) => {
      if (typeof port === 'number' && port > 0) {
        if (import.meta.env.DEV) {
          console.log('[ServiceProvider] serve:getPort (module-level) =', port)
        }
        useSettingsStore.getState().setServePort(port)
      }
    })
    .catch((err) => {
      if (import.meta.env.DEV) console.warn('[ServiceProvider] serve:getPort failed:', err)
    })
}

/**
 * Service 注入 Provider
 * 负责：
 *   1. 注入各业务 Service（当前使用 Mock 实现）
 *   2. 登录后自动拉取模型列表
 *   3. 应用启动时从主进程同步 codemaker serve 实际监听端口
 *   4. 应用启动时从磁盘 mcp.json 加载 MCP 配置合并到 Store
 */
export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const services = useMemo<ServiceContextType>(
    () => {
      const providerSettingMode = useSettingsStore.getState().providerSettingMode
      const providerService: IProviderService =
        providerSettingMode === 'direct'
          ? new RealProviderService()
          : new MockProviderService()

      return {
        authService: new MockAuthService(),
        chatService: new MockChatService(),
        mcpService: new MockMCPService(),
        providerService,
        fileService: new MockFileService()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const fetchModels = useModelStore((s) => s.fetchModels)
  const setServePort = useSettingsStore((s) => s.setServePort)

  // useEffect 中再次同步，保证窗口完全初始化后端口是最新值
  // 端口就绪后立即预热：建立 SSE 连接 + 预创建 OpenCode session，消除首次发消息的冷启动延迟
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return
    window.electronAPI
      .invoke('serve:getPort')
      .then((port) => {
        if (typeof port === 'number' && port > 0) {
          if (import.meta.env.DEV) {
            console.log('[ServiceProvider] serve:getPort (useEffect) =', port)
          }
          setServePort(port)
          // 端口就绪后立即预热 Provider（建 SSE + 预建 session）
          warmUpProvider(port)
        }
      })
      .catch(() => {
        // 静默失败，保持默认端口 4000
      })
  }, [setServePort])

  // 应用启动时从磁盘 mcp.json 加载 MCP 配置，合并到 Store
  // 解决重启后 Store 为空（zustand persist 与 mcp.json 双轨并行导致的断链）
  useEffect(() => {
    const { mergeConfigFile, setInitialized: setMCPInitialized } = useMCPStore.getState()
    readMCPConfig()
      .then((diskMcps) => {
        if (diskMcps.length > 0) {
          mergeConfigFile(diskMcps)
          if (import.meta.env.DEV) {
            console.log('[ServiceProvider] 从磁盘加载 MCP 数量:', diskMcps.length)
          }
        }
      })
      .catch(() => { /* 静默失败，不影响应用启动 */ })
      .finally(() => {
        setMCPInitialized()
      })
  }, [])

  // 应用启动时从磁盘/CLI 加载 Agents
  useEffect(() => {
    const { mergeDiskAgents, setInitialized: setAgentInitialized } = useAgentStore.getState()
    syncDiskAgents()
      .then((diskAgents) => {
        mergeDiskAgents(diskAgents)
      })
      .catch(() => { /* 静默失败 */ })
      .finally(() => {
        setAgentInitialized()
      })
  }, [])

  // 应用启动时从磁盘加载 Skills
  useEffect(() => {
    const { mergeDiskSkills, setInitialized: setSkillInitialized } = useSkillStore.getState()
    syncDiskSkills()
      .then((diskSkills) => {
        if (diskSkills.length > 0) {
          mergeDiskSkills(diskSkills)
        }
      })
      .catch(() => { /* 静默失败 */ })
      .finally(() => {
        setSkillInitialized()
      })
  }, [])

  // 登录后自动拉取模型列表
  useEffect(() => {
    if (isLoggedIn) {
      void fetchModels()
    }
  }, [isLoggedIn, fetchModels])

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>
}

/** 获取 Service 实例的 Hook */
export function useServices(): ServiceContextType {
  const ctx = useContext(ServiceContext)
  if (!ctx) throw new Error('useServices 必须在 ServiceProvider 内部使用')
  return ctx
}
