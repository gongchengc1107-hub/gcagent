import { useState, type FC, type PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/stores'
import StartupModal from './StartupModal'

/**
 * 认证守卫组件
 * - hydration 未完成时显示全屏 loading，防止闪烁
 * - 未登录时重定向到 /login
 * - 已登录时放行子组件
 */
const AuthGuard: FC<PropsWithChildren> = ({ children }) => {
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [showStartupModal, setShowStartupModal] = useState(true)

  // persist hydration 未完成，显示全屏 loading
  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-primary)]">
        <Spin size="large" />
      </div>
    )
  }

  // 未登录，重定向到登录页
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // 已登录，显示启动弹窗让用户选择模式
  if (showStartupModal) {
    return <StartupModal onEnter={() => setShowStartupModal(false)} />
  }

  return <>{children}</>
}

export default AuthGuard
