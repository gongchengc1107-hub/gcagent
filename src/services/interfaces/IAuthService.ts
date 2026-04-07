/** 认证服务接口 */
export interface IAuthService {
  /** 用户登录 */
  login(
    username: string,
    password: string
  ): Promise<{
    success: boolean
    user?: { id: string; username: string; email: string; avatar?: string }
  }>
  /** 用户登出 */
  logout(): Promise<void>
  /** 检查会话有效性 */
  checkSession(): Promise<boolean>
}
