/** Provider 服务 — 真实实现 */
import type { IProviderService } from '../interfaces'

export class RealProviderService implements IProviderService {
  /**
   * 测试 API 连接
   * 通过发起一个轻量的 GET /models 请求来验证连接是否有效
   */
  async testConnection(
    baseUrl: string,
    apiKey: string
  ): Promise<{ success: boolean; error?: string }> {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')

    try {
      // 优先尝试 GET /models（OpenAI 兼容端点常见的模型列表接口）
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(`${normalizedBaseUrl}/models`, {
        method: 'GET',
        headers: {
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        // 如果 /models 返回 404，尝试根路径作为备选
        if (res.status === 404) {
          return await this.testRootEndpoint(normalizedBaseUrl, apiKey)
        }
        const errorBody = await res.text().catch(() => '')
        return {
          success: false,
          error: `HTTP ${res.status}: ${errorBody || res.statusText}`
        }
      }

      // 解析响应，验证是否返回了模型列表
      const data = (await res.json()) as { data?: unknown }
      if (data.data !== undefined) {
        return { success: true }
      }

      // 即使没有标准格式，200 响应也说明连接成功
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))

      // 提供更友好的错误信息
      if (error.name === 'AbortError') {
        return { success: false, error: '连接超时（10s）' }
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { success: false, error: '无法连接到服务器，请检查 Base URL 是否正确' }
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * 备选测试：GET /
   * 某些 API 服务可能不支持 /models 端点
   */
  private async testRootEndpoint(
    baseUrl: string,
    apiKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(`${baseUrl}/`, {
        method: 'GET',
        headers: {
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // 任何响应（包括 200、404 但有 body）都说明服务器可达
      if (res.ok || res.status === 404 || res.status === 403) {
        return { success: true }
      }

      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取 Serve 运行状态
   * Direct 模式下始终返回 'running'
   */
  async getServeStatus(): Promise<'running' | 'stopped'> {
    return 'running'
  }

  /**
   * 重启 Serve 服务
   * Direct 模式下无需重启（noop）
   */
  async restartServe(): Promise<void> {
    // Direct 模式无本地服务，无需重启
  }
}
