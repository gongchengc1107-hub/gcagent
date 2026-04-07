import { useState, useEffect, useCallback } from 'react'
import type { FC } from 'react'
import { useChatStore } from '@/stores'
import SessionList from './components/SessionList'
import MessageList from './components/MessageList'
import MessageInput from './components/MessageInput'
import SearchModal from './components/SearchModal'
import ConnectionStatusBar from './components/ConnectionStatusBar'
import FilePreviewPanel, { FilePreviewPanelCollapsed } from './components/FilePreviewPanel'

const ChatPage: FC = () => {
  const [searchOpen, setSearchOpen] = useState(false)
  const { currentSessionId, sessions } = useChatStore()

  const currentSession = sessions.find((s) => s.id === currentSessionId)

  // 全局快捷键 ⌘K
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    },
    []
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex h-full">
      {/* 左侧会话列表 */}
      <SessionList onOpenSearch={() => setSearchOpen(true)} />

      {/* 中间对话面板 */}
      <div
        className="flex min-w-0 flex-1 flex-col"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* 顶部标题栏 */}
        <div
          className="flex h-12 items-center border-b px-4"
          style={{ borderColor: 'var(--border-secondary)' }}
        >
          <h3
            className="truncate text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentSession?.title || '选择或创建一个会话'}
          </h3>
        </div>

        {/* 连接状态提示条 */}
        <ConnectionStatusBar />

        {/* 消息展示区 */}
        <MessageList />

        {/* 底部输入区 */}
        {currentSessionId && <MessageInput />}
      </div>

      {/* 右侧文件预览面板 */}
      <FilePreviewPanel />
      <FilePreviewPanelCollapsed />

      {/* 搜索弹窗 */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

export default ChatPage
