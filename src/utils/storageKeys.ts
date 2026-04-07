/** 本地存储 key 常量 */
export const STORAGE_KEYS = {
  AUTH: 'codemaker-auth',
  CHAT: 'codemaker-chat',
  AGENTS: 'codemaker-agents',
  SKILLS: 'codemaker-skills',
  MCP: 'codemaker-mcp',
  SETTINGS: 'codemaker-settings'
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
