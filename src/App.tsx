import type { FC } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import router from '@/router'
import { useSettingsStore } from '@/stores'
import { ServiceProvider } from '@/services/ServiceProvider'

const App: FC = () => {
  const { theme } = useSettingsStore()

  return (
    <ServiceProvider>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#10a37f',
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#ff4d4f',
            colorInfo: '#1677ff',
            borderRadius: 6
          }
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </ServiceProvider>
  )
}

export default App
