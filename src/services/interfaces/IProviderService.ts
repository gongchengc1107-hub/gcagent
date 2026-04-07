/** Provider 服务接口 */
export interface IProviderService {
  /** 测试 API 连接 */
  testConnection(
    baseUrl: string,
    apiKey: string
  ): Promise<{ success: boolean; error?: string }>
  /** 获取 Serve 运行状态 */
  getServeStatus(): Promise<'running' | 'stopped'>
  /** 重启 Serve 服务 */
  restartServe(): Promise<void>
}
