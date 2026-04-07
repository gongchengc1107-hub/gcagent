import type { IAuthService } from '../interfaces'

/** 认证服务 Mock 实现 */
export class MockAuthService implements IAuthService {
  async login(username: string, _password: string) {
    /* 模拟网络延迟 */
    await new Promise((r) => setTimeout(r, 800))
    return {
      success: true,
      user: {
        id: 'mock-user',
        username,
        email: `${username}@corp.netease.com`
      }
    }
  }

  async logout() {
    /* Mock: 清除本地状态即可 */
  }

  async checkSession() {
    return true
  }
}
