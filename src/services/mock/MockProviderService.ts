import type { IProviderService } from '../interfaces'

/** Provider 服务 Mock 实现 */
export class MockProviderService implements IProviderService {
  async testConnection(_baseUrl: string, _apiKey: string) {
    await new Promise((r) => setTimeout(r, 500))
    return { success: true }
  }

  async getServeStatus(): Promise<'running' | 'stopped'> {
    return 'running'
  }

  async restartServe(): Promise<void> {
    await new Promise((r) => setTimeout(r, 1000))
  }
}
