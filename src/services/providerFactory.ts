/**
 * Provider 工厂
 * 根据设置自动选择 ChatProvider 实现
 */
import type { ChatProvider } from './chatProvider'
import { CodemakProvider } from './codemakProvider'
import { DirectProvider } from './directProvider'
import { MockChatProvider } from './mockChatProvider'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** 是否使用 Mock（默认 true，后端未就绪） */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 诊断日志：仅开发模式输出，帮助排查 Provider 选择问题
if (import.meta.env.DEV) {
  console.log('[providerFactory] VITE_USE_MOCK raw =', import.meta.env.VITE_USE_MOCK)
  console.log('[providerFactory] USE_MOCK =', USE_MOCK)
}

// ─── 单例实例（CodemakProvider 和 DirectProvider 内部维护状态/单例资源）─────────
const codemakProviderInstance = new CodemakProvider()
const directProviderInstance = new DirectProvider()
const mockProviderInstance = new MockChatProvider()

/** 获取当前 Provider 实例 */
export function getProvider(): ChatProvider {
  if (USE_MOCK) {
    if (import.meta.env.DEV) console.log('[providerFactory] → MockChatProvider')
    return mockProviderInstance
  }
  const mode = useSettingsStore.getState().providerMode
  if (import.meta.env.DEV) {
    console.log(`[providerFactory] getProvider called, mode=${mode}, USE_MOCK=${USE_MOCK}`)
  }
  // 'cloud' 模式使用 DirectProvider（直连模型），否则走 Codemaker 本地服务
  const provider = mode === 'cloud' ? directProviderInstance : codemakProviderInstance
  if (import.meta.env.DEV) console.log('[providerFactory] → ', provider.constructor.name)
  return provider
}
