/** MCP 模板定义 */
export interface MCPTemplate {
  id: string
  name: string
  description: string
  icon: string
  type: 'local' | 'remote'
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}

/** 预置 MCP 模板列表 */
export const MCP_TEMPLATES: MCPTemplate[] = [
  {
    id: 'tpl-filesystem',
    name: 'Filesystem',
    description: '本地文件系统访问',
    icon: '📁',
    type: 'local',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/dir'],
    env: {},
  },
  {
    id: 'tpl-github',
    name: 'GitHub',
    description: 'GitHub 仓库操作',
    icon: '🐙',
    type: 'remote',
    url: 'https://api.github.com/mcp',
    headers: { Authorization: 'Bearer <请填入你的 GitHub Token>' },
  },
  {
    id: 'tpl-postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQL 数据库查询',
    icon: '🐘',
    type: 'local',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://user:pass@localhost/db'],
    env: {},
  },
  {
    id: 'tpl-brave-search',
    name: 'Brave Search',
    description: 'Brave 搜索引擎',
    icon: '🔍',
    type: 'local',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: '<请填入你的 API Key>' },
  },
  {
    id: 'tpl-puppeteer',
    name: 'Puppeteer',
    description: '浏览器自动化',
    icon: '🎭',
    type: 'local',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    env: {},
  },
  {
    id: 'tpl-slack',
    name: 'Slack',
    description: 'Slack 工作区集成',
    icon: '💬',
    type: 'remote',
    url: 'https://slack.com/mcp',
    headers: { Authorization: 'Bearer <请填入你的 Slack Token>' },
  },
]
