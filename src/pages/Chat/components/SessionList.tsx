import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import type { FC } from 'react'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  PushpinOutlined,
  PushpinFilled,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FileMarkdownOutlined
} from '@ant-design/icons'
import { useChatStore, useAgentStore } from '@/stores'
import { useModelStore, DEFAULT_MODEL } from '@/stores/useModelStore'
import { isAgentHidden } from '@/utils/diskSync'
import type { ChatSession, ChatMessage } from '@/types'
import ContextMenu from '@/components/ContextMenu'
import type { ContextMenuItem } from '@/components/ContextMenu'

interface SessionListProps {
  onOpenSearch: () => void
}

/** 按时间分组会话 */
function groupSessions(
  sessions: ChatSession[]
): { label: string; sessions: ChatSession[] }[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86400000
  const startOfWeek = startOfToday - now.getDay() * 86400000

  const pinned: ChatSession[] = []
  const today: ChatSession[] = []
  const yesterday: ChatSession[] = []
  const thisWeek: ChatSession[] = []
  const earlier: ChatSession[] = []

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)

  for (const s of sorted) {
    if (s.isPinned) {
      pinned.push(s)
    } else if (s.updatedAt >= startOfToday) {
      today.push(s)
    } else if (s.updatedAt >= startOfYesterday) {
      yesterday.push(s)
    } else if (s.updatedAt >= startOfWeek) {
      thisWeek.push(s)
    } else {
      earlier.push(s)
    }
  }

  const groups: { label: string; sessions: ChatSession[] }[] = []
  if (pinned.length > 0) groups.push({ label: '📌 置顶', sessions: pinned })
  if (today.length > 0) groups.push({ label: '今天', sessions: today })
  if (yesterday.length > 0) groups.push({ label: '昨天', sessions: yesterday })
  if (thisWeek.length > 0) groups.push({ label: '本周', sessions: thisWeek })
  if (earlier.length > 0) groups.push({ label: '更早', sessions: earlier })

  return groups
}

/** 导出会话为 Markdown */
function exportAsMarkdown(session: ChatSession, messages: ChatMessage[]): void {
  let content = `# ${session.title}\n\n`
  for (const msg of messages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant'
    content += `### ${role}\n\n${msg.content}\n\n`
  }
  downloadFile(`${session.title}.md`, content, 'text/markdown')
}

/** 导出会话为 JSON */
function exportAsJSON(session: ChatSession, messages: ChatMessage[]): void {
  const data = JSON.stringify({ session, messages }, null, 2)
  downloadFile(`${session.title}.json`, data, 'application/json')
}

/** 触发文件下载 */
function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const SessionList: FC<SessionListProps> = ({ onOpenSearch }) => {
  const {
    sessions,
    currentSessionId,
    messages,
    setCurrentSession,
    createSession,
    deleteSession,
    renameSession,
    togglePin
  } = useChatStore()
  const { agents } = useAgentStore()
  const { currentModel } = useModelStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  const [ctxMenu, setCtxMenu] = useState<{
    visible: boolean
    x: number
    y: number
    session: ChatSession | null
  }>({ visible: false, x: 0, y: 0, session: null })

  const groups = useMemo(() => groupSessions(sessions), [sessions])

  const handleNewSession = useCallback(() => {
    // 优先继承当前 session 绑定的 agent → fallback 到 general → 列表第一个可用的
    const currentSession = sessions.find((s) => s.id === currentSessionId)
    const enabledPrimary = agents.filter((a) => a.enabled && !isAgentHidden(a))
    const generalAgent = enabledPrimary.find((a) => a.backendName === 'general')
    const preferredId = currentSession?.agentId
    const agentId =
      (preferredId && enabledPrimary.some((a) => a.id === preferredId) ? preferredId : null)
      ?? generalAgent?.id
      ?? enabledPrimary[0]?.id
      ?? ''
    const modelId = currentModel || DEFAULT_MODEL
    createSession('新对话', agentId, modelId)
  }, [createSession, sessions, currentSessionId, agents, currentModel])

  const handleDoubleClick = useCallback((session: ChatSession) => {
    setEditingId(session.id)
    setEditTitle(session.title)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }, [])

  const handleConfirmRename = useCallback(() => {
    if (editingId && editTitle.trim()) {
      renameSession(editingId, editTitle.trim())
    }
    setEditingId(null)
  }, [editingId, editTitle, renameSession])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, session: ChatSession) => {
      e.preventDefault()
      setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, session })
    },
    []
  )

  const ctxMenuItems = useMemo<ContextMenuItem[]>(() => {
    const s = ctxMenu.session
    if (!s) return []
    return [
      {
        label: s.isPinned ? '取消置顶' : '置顶',
        icon: s.isPinned ? <PushpinFilled /> : <PushpinOutlined />,
        onClick: () => togglePin(s.id)
      },
      {
        label: '重命名',
        icon: <EditOutlined />,
        onClick: () => handleDoubleClick(s)
      },
      {
        label: '导出 Markdown',
        icon: <FileMarkdownOutlined />,
        onClick: () => exportAsMarkdown(s, messages[s.id] || [])
      },
      {
        label: '导出 JSON',
        icon: <FileTextOutlined />,
        onClick: () => exportAsJSON(s, messages[s.id] || [])
      },
      {
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => deleteSession(s.id)
      }
    ]
  }, [ctxMenu.session, togglePin, handleDoubleClick, messages, deleteSession])

  // 点击外部取消编辑
  useEffect(() => {
    if (!editingId) return
    const handler = (e: MouseEvent) => {
      if (editInputRef.current && !editInputRef.current.contains(e.target as Node)) {
        handleConfirmRename()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editingId, handleConfirmRename])

  return (
    <div
      className="flex h-full w-[260px] min-w-[260px] flex-col border-r"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between px-3 py-3">
        <button
          onClick={handleNewSession}
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
          }}
        >
          <PlusOutlined />
          新对话
        </button>
        <button
          onClick={onOpenSearch}
          className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          style={{
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title="搜索会话 (⌘K)"
        >
          <SearchOutlined />
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-2">
            <div
              className="px-2 py-1 text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {group.label}
            </div>
            {group.sessions.map((session) => {
              const isActive = session.id === currentSessionId
              const isEditing = session.id === editingId

              return (
                <div
                  key={session.id}
                  className="group relative mb-0.5 flex cursor-pointer items-center rounded-lg px-3 py-2.5 transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-primary)' : 'transparent',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => !isEditing && setCurrentSession(session.id)}
                  onDoubleClick={() => handleDoubleClick(session)}
                  onContextMenu={(e) => handleContextMenu(e, session)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {session.isPinned && (
                    <PushpinFilled
                      className="mr-1.5 flex-shrink-0 text-xs"
                      style={{ color: 'var(--accent-primary)' }}
                    />
                  )}
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      className="w-full rounded border bg-transparent px-1 py-0.5 text-sm outline-none"
                      style={{
                        borderColor: 'var(--accent-primary)',
                        color: 'var(--text-primary)'
                      }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                  ) : (
                    <span className="truncate text-sm">{session.title}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {sessions.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            <p>暂无会话</p>
            <p className="mt-1">点击上方按钮创建新对话</p>
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      <ContextMenu
        visible={ctxMenu.visible}
        x={ctxMenu.x}
        y={ctxMenu.y}
        items={ctxMenuItems}
        onClose={() => setCtxMenu((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  )
}

export default SessionList
