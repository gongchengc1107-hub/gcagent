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
    previewBg: '#fdfcfc',
    previewFg: '#201d1d',
    previewSidebar: '#302c2c'
  },
  {
    key: 'dark',
    label: '深色模式',
    previewBg: '#201d1d',
    previewFg: '#fdfcfc',
    previewSidebar: '#302c2c'
  }
]

/** 外观设置页 - OpenCode 终端风格 */
const AppearanceSettings: FC = () => {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

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
          APPEARANCE
        </h2>
        <div
          className="mt-1 text-sm"
          style={{
            color: 'var(--text-muted)',
            lineHeight: 2.0
          }}
        >
          // 选择你偏好的界面主题
        </div>
      </div>

      {/* 主题选择卡片 */}
      <div className="grid grid-cols-2 gap-4">
        {themeOptions.map((option) => {
          const isActive = theme === option.key
          return (
            <button
              key={option.key}
              onClick={() => setTheme(option.key)}
              className="group overflow-hidden rounded text-left transition-all duration-150"
              style={{
                border: isActive ? `2px solid var(--accent-primary)` : `1px solid var(--border-primary)`,
                backgroundColor: 'var(--bg-secondary)',
                padding: 0
              }}
            >
              {/* 主题预览图 */}
              <div
                className="flex h-32 w-full"
                style={{ backgroundColor: option.previewBg }}
              >
                {/* 模拟侧边栏 */}
                <div
                  className="h-full w-16"
                  style={{ backgroundColor: option.previewSidebar }}
                >
                  <div className="flex flex-col gap-2 p-2 pt-4">
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
                <div className="flex-1 p-4">
                  <div
                    className="mb-3 h-2 w-1/2 rounded"
                    style={{ backgroundColor: option.previewFg, opacity: 0.3 }}
                  />
                  <div
                    className="mb-2 h-1.5 w-full rounded"
                    style={{ backgroundColor: option.previewFg, opacity: 0.15 }}
                  />
                  <div
                    className="mb-2 h-1.5 w-3/4 rounded"
                    style={{ backgroundColor: option.previewFg, opacity: 0.15 }}
                  />
                  <div
                    className="h-1.5 w-1/2 rounded"
                    style={{ backgroundColor: option.previewFg, opacity: 0.15 }}
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

      {/* 主题说明 */}
      <div
        className="rounded p-4 text-sm"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: `1px solid var(--border-primary)`,
          color: 'var(--text-secondary)',
          lineHeight: 1.8
        }}
      >
        <div className="space-y-1">
          <div>
            <span style={{ color: 'var(--text-muted)' }}>#</span> 浅色模式：暖白背景，适合明亮环境
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>#</span> 深色模式：暖黑背景，适合低光环境
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>#</span> Berkeley Mono 字体，monospace-first 美学
          </div>
        </div>
      </div>
    </section>
  )
}

export default AppearanceSettings
