import type { FC } from 'react'
import AccountSettings from './components/AccountSettings'
import ProviderSettings from './components/ProviderSettings'
import UsageStats from './components/UsageStats'
import AppearanceSettings from './components/AppearanceSettings'
import DataManagement from './components/DataManagement'

/** 设置页 - 单页布局，所有内容直接展示 */
const SettingsPage: FC = () => {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <AccountSettings />
        <ProviderSettings />
        <AppearanceSettings />
        <UsageStats />
        <DataManagement />
      </div>
    </div>
  )
}

export default SettingsPage
