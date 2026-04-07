import type { IMCPService } from '../interfaces'
import type { MCPConfig, MCPStatus } from '../../types'

/** MCP 配置管理服务 Mock 实现 */
export class MockMCPService implements IMCPService {
  async readConfig(): Promise<MCPConfig[]> {
    /* Mock: 返回空配置 */
    return []
  }

  async writeConfig(_mcps: MCPConfig[]): Promise<void> {
    /* Mock: 空操作 */
  }

  async checkStatus(_mcpId: string): Promise<MCPStatus> {
    return 'connected'
  }
}
