import type { FC } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  UserOutlined,
  RobotOutlined,
  BarChartOutlined,
  BgColorsOutlined,
  WarningOutlined
} from '@ant-design/icons'

/** 设置页左侧菜单项 */
interface SettingsMenuItem {
  key: string
  path: string
  icon: FC<{ className?: string }>
  label: string
}

const menuItems: SettingsMenuItem[] = [
  { key: 'account', path: '/settings/account', icon: UserOutlined, label: '账户' },
  { key: 'provider', path: '/settings/provider', icon: RobotOutlined, label: 'AI Provider' },
  { key: 'usage', path: '/settings/usage', icon: BarChartOutlined, label: '消耗统计' },
  { key: 'appearance', path: '/settings/appearance', icon: BgColorsOutlined, label: '外观' },
  { key: 'data', path: '/settings/data', icon: WarningOutlined, label: '数据管理' }
]

const SettingsPage: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  /** 根据当前路径判断是否选中 */
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-full">
      {/* 左侧分类菜单 */}
      <aside
        className="flex h-full w-[180px] min-w-[180px] flex-col border-r py-4"
        style={{
          borderColor: 'var(--border-primary)',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <h3
          className="mb-2 px-4 text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          设置
        </h3>
        <nav className="flex flex-col gap-0.5 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors"
                style={{
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'var(--bg-tertiary)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon className="text-base" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* 右侧内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  )
}

export default SettingsPage
