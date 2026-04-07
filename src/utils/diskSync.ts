import type { Agent } from '../types'

/** 是否运行在 Electron 环境 */
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

/**
 * codemaker CLI 内置 agent 的 backendName 列表
 * 这些 agent 由系统自动维护，不可编辑/删除
 */
const BUILTIN_AGENT_NAMES = new Set([
  'build',
  'compaction',
  'explore',
  'general',
  'plan',
  'summary',
  'title',
])

/**
 * 内置 agent 的强制 mode 映射
 * 防止 CLI 返回错误的 mode 导致 subagent 出现在用户选择列表
 */
const BUILTIN_AGENT_MODES: Record<string, Agent['mode']> = {
  build:      'primary',
  compaction: 'subagent',
  explore:    'subagent',
  general:    'primary',
  plan:       'subagent',
  summary:    'subagent',
  title:      'subagent',
}

/**
 * 同步 Agent 列表，来源：
 *   1. codemaker CLI（agent:list-cli）— 真实运行中的 agent
 *   2. 工作区 .agents/*.md（agent:list-disk）— 本地自定义 agent 文件
 * 两者按 id 去重合并，CLI 优先
 */
export async function syncDiskAgents(): Promise<Agent[]> {
  if (!isElectron) {
    if (import.meta.env.DEV) console.log('[diskSync] Web 模式，跳过磁盘同步')
    return []
  }

  try {
    const [cliAgents, diskAgents] = await Promise.all([
      window.electronAPI.invoke('agent:list-cli') as Promise<Agent[]>,
      window.electronAPI.invoke('agent:list-disk') as Promise<Agent[]>,
    ])

    // CLI agent：根据 backendName 判断并标记 isBuiltin，强制写入正确 mode
    const markedCliAgents = (cliAgents ?? []).map((a) => {
      const builtin = BUILTIN_AGENT_NAMES.has(a.backendName)
      return {
        ...a,
        isBuiltin: builtin,
        isFromDisk: false,
        // 内置 agent 强制使用预设 mode，防止 CLI 返回错误值
        mode: builtin ? (BUILTIN_AGENT_MODES[a.backendName] ?? a.mode) : a.mode,
      }
    })

    // 磁盘 agent：过滤掉与内置同名的文件（避免重复），标记 isFromDisk
    const cliIds = new Set(markedCliAgents.map((a) => a.id))
    const extra = (diskAgents ?? [])
      .filter((a) => !cliIds.has(a.id) && !BUILTIN_AGENT_NAMES.has(a.backendName))
      .map((a) => ({ ...a, isBuiltin: false, isFromDisk: true }))

    const merged = [...markedCliAgents, ...extra]

    if (import.meta.env.DEV) {
      console.log(`[diskSync] CLI agents: ${cliAgents?.length ?? 0}, disk agents: ${diskAgents?.length ?? 0}, merged: ${merged.length}`)
    }

    return merged
  } catch (e) {
    console.warn('[diskSync] syncDiskAgents 失败:', e)
    return []
  }
}
