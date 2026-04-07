import { useEffect, useRef, useCallback } from 'react'
import { useMCPStore } from '@/stores'
import type { MCPConfig, MCPStatus } from '@/types'

/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 30_000

/** 是否运行在 Electron 环境 */
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

/**
 * 检测单个 MCP 的连接状态
 * Electron 环境：通过 IPC 真实探测（远程 HTTP / 本地保守返回）
 * 降级（Web 开发模式）：根据 enabled 状态返回模拟值
 */
async function checkStatus(mcp: MCPConfig): Promise<MCPStatus> {
  if (!isElectron) {
    return mcp.enabled ? 'connected' : 'disconnected'
  }
  try {
    const result = await window.electronAPI.invoke('mcp:check-status', mcp)
    return (result as MCPStatus) ?? 'failed'
  } catch {
    return 'failed'
  }
}

/**
 * MCP 状态轮询 Hook
 * - 30s 间隔轮询所有 MCP 的连接状态
 * - 仅在页面可见时执行轮询
 * - 提供 refreshNow 手动立即刷新
 */
export function useMCPStatusPolling() {
  const { mcps, updateStatus } = useMCPStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPollingRef = useRef(false)

  /** 遍历所有 MCP 执行状态检测 */
  const checkAllStatus = useCallback(async () => {
    if (isPollingRef.current) return
    isPollingRef.current = true
    try {
      const tasks = mcps.map(async (mcp) => {
        const newStatus = await checkStatus(mcp)
        if (newStatus !== mcp.status) {
          updateStatus(mcp.id, newStatus)
        }
      })
      await Promise.all(tasks)
    } finally {
      isPollingRef.current = false
    }
  }, [mcps, updateStatus])

  const startPolling = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(checkAllStatus, POLL_INTERVAL)
  }, [checkAllStatus])

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /** 手动立即刷新 + 重置计时器 */
  const refreshNow = useCallback(async () => {
    stopPolling()
    await checkAllStatus()
    startPolling()
  }, [checkAllStatus, startPolling, stopPolling])

  /** 页面可见性控制轮询生命周期 */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAllStatus()
        startPolling()
      } else {
        stopPolling()
      }
    }

    checkAllStatus()
    startPolling()

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [checkAllStatus, startPolling, stopPolling])

  return { refreshNow }
}
