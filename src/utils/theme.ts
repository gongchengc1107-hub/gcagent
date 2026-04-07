import type { ThemeMode } from '@/types'

/**
 * 设置 html[data-theme] 属性以切换主题
 */
export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * 获取当前主题模式
 */
export function getCurrentTheme(): ThemeMode {
  return (document.documentElement.getAttribute('data-theme') as ThemeMode) || 'light'
}

/**
 * 切换主题（light ↔ dark）
 */
export function toggleTheme(): ThemeMode {
  const current = getCurrentTheme()
  const next: ThemeMode = current === 'light' ? 'dark' : 'light'
  applyTheme(next)
  return next
}
