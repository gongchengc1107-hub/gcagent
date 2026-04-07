import type { MCPConfig, MCPStatus } from '../../types'

/** MCP 配置管理服务接口 */
export interface IMCPService {
  /** 读取 MCP 配置列表 */
  readConfig(): Promise<MCPConfig[]>
  /** 写入 MCP 配置列表 */
  writeConfig(mcps: MCPConfig[]): Promise<void>
  /** 检查指定 MCP 的连接状态 */
  checkStatus(mcpId: string): Promise<MCPStatus>
}
