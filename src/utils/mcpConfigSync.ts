import type { MCPConfig } from '@/types'

/** 是否运行在 Electron 环境 */
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

/**
 * 从磁盘读取自定义 MCP 配置
 * Electron 环境：通过 IPC 读取 ~/.config/codemaker/mcp.json
 * 降级（Web 开发模式）：返回空数组
 */
export async function readMCPConfig(): Promise<MCPConfig[]> {
  if (!isElectron) {
    if (import.meta.env.DEV) console.log('[mcpConfigSync] Web 模式，跳过磁盘读取')
    return []
  }
  try {
    const result = await window.electronAPI.invoke('mcp:read-config')
    return (result as MCPConfig[]) ?? []
  } catch (e) {
    console.warn('[mcpConfigSync] readMCPConfig 失败:', e)
    return []
  }
}

/**
 * 将自定义 MCP 配置写入磁盘
 * Electron 环境：通过 IPC 写入 ~/.config/codemaker/mcp.json（自动过滤内置 MCP）
 * 降级（Web 开发模式）：静默忽略
 */
export async function writeMCPConfig(mcps: MCPConfig[]): Promise<void> {
  if (!isElectron) {
    if (import.meta.env.DEV) console.log('[mcpConfigSync] Web 模式，跳过磁盘写入')
    return
  }
  const customMcps = mcps.filter((m) => !m.isBuiltin)
  try {
    await window.electronAPI.invoke('mcp:write-config', customMcps)
    if (import.meta.env.DEV) console.log('[mcpConfigSync] 写入完成，条目数:', customMcps.length)
  } catch (e) {
    console.warn('[mcpConfigSync] writeMCPConfig 失败:', e)
  }
}
