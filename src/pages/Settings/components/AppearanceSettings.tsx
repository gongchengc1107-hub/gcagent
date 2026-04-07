import type { FC } from 'react'
import { CheckCircleFilled } from '@ant-design/icons'
import { useSettingsStore } from '@/stores'
import type { ThemeMode } from '@/types'

/** 主题预览卡片配置 */
interface ThemeOption {
  key: ThemeMode
  label: string
  /** 预览区域背景色 */
  previewBg: string
  /** 预览区域前景色 */
  previewFg: string
  /** 预览区域侧边色 */
  previewSidebar: string
}

const themeOptions: ThemeOption[] = [
  {
    key: 'light',
    label: '浅色模式',
    previewBg: '#ffffff',
    previewFg: '#f5f5f5',
    previewSidebar: '#1e293b'
  },
  {
    key: 'dark',
    label: '深色模式',
    previewBg: '#1a1a2e',
    previewFg: '#252540',
    previewSidebar: '#0f0f1a'
  }
]

/** 外观设置页 */
const AppearanceSettings: FC = () => {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          外观设置
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          选择你偏好的界面主题
        </p>
      </div>

      {/* 主题选择卡片 */}
      <div className="grid grid-cols-2 gap-4">
        {themeOptions.map((option) => {
          const isActive = theme === option.key
          return (
            <button
              key={option.key}
              onClick={() => setTheme(option.key)}
              className="group relative overflow-hidden rounded-xl border-2 p-0 text-left transition-all duration-200"
              style={{
                borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              {/* 主题预览图 */}
              <div
                className="flex h-32 w-full"
                style={{ backgroundColor: option.previewBg }}
              >
                {/* 模拟侧边栏 */}
                <div
                  className="h-full w-10"
                  style={{ backgroundColor: option.previewSidebar }}
                >
                  <div className="flex flex-col gap-1.5 p-1.5 pt-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 rounded-sm"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          width: i === 1 ? '100%' : '70%'
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/* 模拟内容区 */}
                <div className="flex-1 p-3">
                  <div
                    className="mb-2 h-2 w-1/2 rounded"
                    style={{ backgroundColor: option.previewFg }}
                  />
                  <div
                    className="mb-1.5 h-1.5 w-full rounded"
                    style={{ backgroundColor: option.previewFg }}
                  />
                  <div
                    className="mb-1.5 h-1.5 w-3/4 rounded"
                    style={{ backgroundColor: option.previewFg }}
                  />
                  <div
                    className="h-1.5 w-1/2 rounded"
                    style={{ backgroundColor: option.previewFg }}
                  />
                </div>
              </div>

              {/* 标签区域 */}
              <div className="flex items-center justify-between px-4 py-3">
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {option.label}
                </span>
                {isActive && (
                  <CheckCircleFilled
                    className="text-base"
                    style={{ color: 'var(--accent-primary)' }}
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AppearanceSettings
