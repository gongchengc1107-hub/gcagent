import { type FC, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Divider, Modal } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useAuthStore, useSettingsStore } from '@/stores'
import AccountSettings from './components/AccountSettings'
import ProviderSettings from './components/ProviderSettings'
import UsageStats from './components/UsageStats'
import DirectUsageStats from './components/DirectUsageStats'
import AppearanceSettings from './components/AppearanceSettings'
import DataManagement from './components/DataManagement'

/** 设置页 - 单页布局，所有内容直接展示 */
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
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <AccountSettings />
        <ProviderSettings />
        {providerSettingMode === 'direct' ? <DirectUsageStats /> : <UsageStats />}
        <AppearanceSettings />
        <DataManagement />

        {/* 退出登录 */}
        <Divider style={{ borderColor: 'var(--border-primary)' }} />
        <div className="pb-8">
          <Button
            danger
            type="primary"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
