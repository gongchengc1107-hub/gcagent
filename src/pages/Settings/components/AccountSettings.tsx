import { type FC } from 'react'
import { useAuthStore } from '@/stores'

/** 账户设置页 - OpenCode 终端风格 */
const AccountSettings: FC = () => {
  const user = useAuthStore((s) => s.user)

  /** 获取用户名首字母（中文取第一个字） */
  const getInitial = (name?: string) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  return (
    <section className="space-y-6">
      {/* 区块标题 */}
      <div>
        <h2
          className="font-bold"
          style={{
            fontSize: '16px',
            lineHeight: 1.5,
            color: 'var(--text-primary)'
          }}
        >
          ACCOUNT
        </h2>
        <div
          className="mt-1 text-sm"
          style={{
            color: 'var(--text-muted)',
            lineHeight: 2.0
          }}
        >
          // 账户信息和基本设置
        </div>
      </div>

      {/* 用户信息 - 纯文本布局，无卡片边框 */}
      <div className="space-y-4">
        {/* 用户名 */}
        <div className="flex items-baseline gap-4">
          <span
            className="min-w-[120px] text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            username
          </span>
          <span
            className="font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {user?.username ?? '未登录'}
          </span>
        </div>

        {/* 邮箱 */}
        <div className="flex items-baseline gap-4">
          <span
            className="min-w-[120px] text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            email
          </span>
          <span style={{ color: 'var(--text-primary)' }}>
            {user?.email ?? '暂无邮箱信息'}
          </span>
        </div>

        {/* 用户标识 */}
        <div className="flex items-baseline gap-4">
          <span
            className="min-w-[120px] text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            user_id
          </span>
          <code
            className="text-sm"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-secondary)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            {user?.id ?? 'N/A'}
          </code>
        </div>

        {/* 头像预览 */}
        {user?.username && (
          <div className="flex items-baseline gap-4">
            <span
              className="min-w-[120px] text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              avatar
            </span>
            <div
              className="flex h-12 w-12 items-center justify-center rounded text-lg font-bold"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fdfcfc'
              }}
            >
              {getInitial(user.username)}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default AccountSettings
