import { useState } from 'react'
import type { FC } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  MessageOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BulbOutlined,
  CheckSquareOutlined
} from '@ant-design/icons'
import { Tooltip } from 'antd'
import { useSettingsStore } from '@/stores'

interface NavItem {
  key: string
  path: string
  icon: FC<{ className?: string }>
  label: string
}

const navItems: NavItem[] = [
  { key: 'chat', path: '/chat', icon: MessageOutlined, label: 'Chat' },
  { key: 'agents', path: '/agents', icon: RobotOutlined, label: 'Agents' },
  { key: 'skills', path: '/skills', icon: ThunderboltOutlined, label: 'Skills' },
  { key: 'mcp', path: '/mcp', icon: ApiOutlined, label: 'MCP' },
  { key: 'todo', path: '/todo', icon: CheckSquareOutlined, label: 'Todo' },
  { key: 'settings', path: '/settings', icon: SettingOutlined, label: 'Settings' }
]

const Layout: FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useSettingsStore()

  const sidebarWidth = collapsed ? 64 : 240
  const currentPath = '/' + location.pathname.split('/')[1]

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* 侧边栏 */}
      <aside
        className="flex h-full flex-col transition-[width] duration-200 ease-in-out"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          backgroundColor: 'var(--bg-sidebar)'
        }}
      >
        {/* Logo 区域 */}
        <div
          className="flex h-14 items-center border-b px-4"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {collapsed ? (
            <span className="mx-auto text-lg font-bold" style={{ color: 'var(--sidebar-text)' }}>
              C
            </span>
          ) : (
            <span className="text-lg font-bold" style={{ color: 'var(--sidebar-text)' }}>
              Codemaker
            </span>
          )}
        </div>

        {/* 导航列表 */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const isActive = currentPath === item.path
            const Icon = item.icon
            const button = (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className="mb-1 flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-colors"
                style={{
                  color: isActive ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                  backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon className="text-base" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </button>
            )

            return collapsed ? (
              <Tooltip key={item.key} placement="right" title={item.label}>
                {button}
              </Tooltip>
            ) : (
              button
            )
          })}
        </nav>

        {/* 底部区域 */}
        <div
          className="border-t px-2 py-3"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="mb-1 flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-colors"
            style={{ color: 'var(--sidebar-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <BulbOutlined className="text-base" />
            {!collapsed && (
              <span className="ml-3">{theme === 'light' ? '暗色模式' : '亮色模式'}</span>
            )}
          </button>

          {/* 折叠按钮 */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mb-1 flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-colors"
            style={{ color: 'var(--sidebar-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {collapsed ? (
              <MenuUnfoldOutlined className="text-base" />
            ) : (
              <>
                <MenuFoldOutlined className="text-base" />
                <span className="ml-3">收起</span>
              </>
            )}
          </button>

          {/* 用户头像区域 */}
          <div
            className="flex items-center rounded-md px-3 py-2.5"
            style={{ color: 'var(--sidebar-text-muted)' }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--sidebar-hover)' }}
            >
              <UserOutlined className="text-sm" />
            </div>
            {!collapsed && <span className="ml-3 text-sm">未登录</span>}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main
        className="flex-1 overflow-auto"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
