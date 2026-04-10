import { type FC, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from 'antd'
import { useAuthStore, useSettingsStore } from '@/stores'
import AccountSettings from './components/AccountSettings'
import ProviderSettings from './components/ProviderSettings'
import UsageStats from './components/UsageStats'
import DirectUsageStats from './components/DirectUsageStats'
import AppearanceSettings from './components/AppearanceSettings'
import DataManagement from './components/DataManagement'

/** 设置页 - OpenCode 终端美学风格 */
const SettingsPage: FC = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const providerSettingMode = useSettingsStore((s) => s.providerSettingMode)

  /** 退出登录确认 */
  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: '确认退出',
      content: '退出后需要重新登录，确认退出吗？',
      okText: '退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        logout()
        navigate('/login', { replace: true })
      }
    })
  }, [logout, navigate])

  return (
    <div
      className="flex h-full flex-col overflow-y-auto"
      style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '48px 24px'
      }}
    >
      <div className="mx-auto w-full max-w-[800px]">
        {/* 页面标题 */}
        <div className="mb-12">
          <h1
            className="font-bold"
            style={{
              fontSize: '2.38rem',
              lineHeight: 1.5,
              color: 'var(--text-primary)'
            }}
          >
            Settings
          </h1>
          <div
            className="mt-2 text-sm"
            style={{
              color: 'var(--text-secondary)',
              lineHeight: 2.0
            }}
          >
            // 配置你的账户和偏好设置
          </div>
        </div>

        {/* 内容区域 - 使用 generous spacing */}
        <div className="space-y-12">
          <AccountSettings />
          <ProviderSettings />
          {providerSettingMode === 'direct' ? <DirectUsageStats /> : <UsageStats />}
          <AppearanceSettings />
          <DataManagement />

          {/* 分隔线 */}
          <div
            className="my-12 h-[1px]"
            style={{ backgroundColor: 'var(--border-primary)' }}
          />

          {/* 退出登录 */}
          <div className="pb-8">
            <button
              onClick={handleLogout}
              className="rounded transition-opacity duration-150"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--error)',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: 2.0,
                padding: '4px 20px',
                border: `1px solid var(--error)`,
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--error)'
                e.currentTarget.style.color = '#fdfcfc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--error)'
              }}
            >
              ⚠ 退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
