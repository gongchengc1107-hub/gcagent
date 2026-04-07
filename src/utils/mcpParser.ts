/** MCP 智能解析结果 */
export interface ParseResult {
  success: boolean
  type?: 'local' | 'remote'
  name?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
  error?: string
}

/**
 * 智能解析 MCP 配置输入
 * 支持格式：JSON 直接配置、嵌套 mcpServers 格式、URL、Bearer Token
 */
export function parseMCPInput(input: string): ParseResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return { success: false, error: '输入内容为空' }
  }

  // 1. 尝试 JSON 解析
  try {
    const json = JSON.parse(trimmed)

    // 直接配置格式：{ command, args, ... } 或 { url, headers, ... }
    if (json.command) {
      return {
        success: true,
        type: 'local',
        name: json.name || '未命名 MCP',
        command: json.command,
        args: json.args || [],
        env: json.env || {},
      }
    }
    if (json.url) {
      return {
        success: true,
        type: 'remote',
        name: json.name || '未命名 MCP',
        url: json.url,
        headers: json.headers || {},
      }
    }

    // 嵌套格式：{ "mcpServers": { "serverName": { ... } } }
    if (json.mcpServers) {
      const entries = Object.entries(json.mcpServers)
      if (entries.length > 0) {
        const [name, config] = entries[0] as [string, Record<string, unknown>]
        if (config.command) {
          return {
            success: true,
            type: 'local',
            name,
            command: config.command as string,
            args: (config.args as string[]) || [],
            env: (config.env as Record<string, string>) || {},
          }
        }
        if (config.url) {
          return {
            success: true,
            type: 'remote',
            name,
            url: config.url as string,
            headers: (config.headers as Record<string, string>) || {},
          }
        }
      }
    }

    return { success: false, error: 'JSON 格式正确但缺少 command 或 url 字段' }
  } catch {
    // 非 JSON，继续尝试其他格式
  }

  // 2. URL 匹配
  if (/^https?:\/\/\S+/.test(trimmed)) {
    try {
      const hostname = new URL(trimmed).hostname
      return { success: true, type: 'remote', name: hostname, url: trimmed }
    } catch {
      return { success: false, error: 'URL 格式不合法' }
    }
  }

  // 3. Bearer Token / API Key
  if (/^(Bearer\s+|sk-|token_)/i.test(trimmed)) {
    const token = trimmed.replace(/^Bearer\s+/i, '')
    return {
      success: true,
      type: 'remote',
      name: '远程 MCP',
      url: '',
      headers: { Authorization: `Bearer ${token}` },
    }
  }

  return { success: false, error: '无法识别格式，请使用手动添加' }
}
