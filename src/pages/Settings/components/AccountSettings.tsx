import { type FC } from 'react'
import { Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores'

/** 账户设置页 */
const AccountSettings: FC = () => {
  const user = useAuthStore((s) => s.user)

  /** 获取用户名首字母（中文取第一个字） */
  const getInitial = (name?: string) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        账户设置
      </h2>

      {/* 用户信息卡片 */}
      <div
        className="rounded-lg border p-6"
        style={{
          borderColor: 'var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <div className="flex items-center gap-4">
          {/* 头像 */}
          <Avatar
            size={64}
            icon={!user?.username ? <UserOutlined /> : undefined}
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              fontSize: 24,
              fontWeight: 600
            }}
          >
            {user?.username ? getInitial(user.username) : null}
          </Avatar>

          {/* 用户名和邮箱 */}
          <div className="flex flex-col">
            <span
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {user?.username ?? '未登录'}
            </span>
            <span
              className="mt-0.5 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {user?.email ?? '暂无邮箱信息'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSettings
