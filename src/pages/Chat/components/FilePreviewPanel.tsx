import { useCallback } from 'react'
import type { FC } from 'react'
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  FileTextOutlined,
  CodeOutlined,
  Html5Outlined
} from '@ant-design/icons'
import { useFilePreviewStore } from '@/stores'
import type { PreviewFileLanguage } from '@/types'
import FilePreviewContent from './FilePreviewContent'

/** Tab 图标映射 */
const TAB_ICONS: Record<PreviewFileLanguage, React.ReactNode> = {
  json: <CodeOutlined style={{ fontSize: 12 }} />,
  markdown: <FileTextOutlined style={{ fontSize: 12 }} />,
  html: <Html5Outlined style={{ fontSize: 12 }} />
}

/** Tab 颜色映射 */
const TAB_COLORS: Record<PreviewFileLanguage, string> = {
  json: '#f5a623',
  markdown: '#4a9eff',
  html: '#e44d26'
}

const FilePreviewPanel: FC = () => {
  const {
    isOpen,
    files,
    activeFileId,
    closeFile,
    setActiveFile,
    togglePanel,
    closePanel
  } = useFilePreviewStore()

  const activeFile = files.find((f) => f.id === activeFileId)

  const handleCloseTab = useCallback(
    (e: React.MouseEvent, fileId: string) => {
      e.stopPropagation()
      closeFile(fileId)
    },
    [closeFile]
  )

  if (!isOpen || files.length === 0) return null

  return (
    <div
      className="flex h-full flex-col border-l"
      style={{
        width: 480,
        minWidth: 360,
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-secondary)'
      }}
    >
      {/* 顶部：Tab 栏 + 面板操作 */}
      <div
        className="flex items-center border-b"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        {/* Tab 列表区域 - 可滚动 */}
        <div className="flex flex-1 items-center overflow-x-auto">
          {files.map((file) => {
            const isActive = file.id === activeFileId
            return (
              <div
                key={file.id}
                className="group/tab flex cursor-pointer items-center gap-1.5 border-r px-3 py-2 text-xs transition-colors"
                style={{
                  borderColor: 'var(--border-secondary)',
                  backgroundColor: isActive ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: isActive ? `2px solid ${TAB_COLORS[file.language]}` : '2px solid transparent',
                  minWidth: 'fit-content'
                }}
                onClick={() => setActiveFile(file.id)}
              >
                <span style={{ color: TAB_COLORS[file.language] }}>
                  {TAB_ICONS[file.language]}
                </span>
                <span className="max-w-[100px] truncate">{file.fileName}</span>
                {/* 关闭 Tab 按钮 */}
                <button
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-black/10 group-hover/tab:opacity-100"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={(e) => handleCloseTab(e, file.id)}
                >
                  <CloseOutlined style={{ fontSize: 8 }} />
                </button>
              </div>
            )
          })}
        </div>

        {/* 面板操作按钮 */}
        <div className="flex items-center gap-0.5 px-2">
          <PanelButton
            icon={<LeftOutlined style={{ fontSize: 10 }} />}
            tooltip="收起面板"
            onClick={togglePanel}
          />
          <PanelButton
            icon={<CloseOutlined style={{ fontSize: 10 }} />}
            tooltip="关闭全部"
            onClick={closePanel}
          />
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <FilePreviewContent file={activeFile} />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            选择一个文件进行预览
          </div>
        )}
      </div>
    </div>
  )
}

/** 面板操作小按钮 */
const PanelButton: FC<{
  icon: React.ReactNode
  tooltip: string
  onClick: () => void
}> = ({ icon, tooltip, onClick }) => (
  <button
    className="flex h-6 w-6 items-center justify-center rounded transition-colors"
    style={{ color: 'var(--text-muted)' }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
      e.currentTarget.style.color = 'var(--text-primary)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.color = 'var(--text-muted)'
    }}
    onClick={onClick}
    title={tooltip}
  >
    {icon}
  </button>
)

/** 收起状态的迷你面板（点击展开） */
export const FilePreviewPanelCollapsed: FC = () => {
  const { isOpen, files, togglePanel } = useFilePreviewStore()

  // 仅当面板已关闭且仍有文件打开时显示
  if (isOpen || files.length === 0) return null

  return (
    <div
      className="flex h-full w-10 cursor-pointer flex-col items-center border-l pt-3"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-secondary)'
      }}
      onClick={togglePanel}
      title="展开文件预览面板"
    >
      <RightOutlined
        style={{ color: 'var(--text-muted)', fontSize: 12, transform: 'rotate(180deg)' }}
      />
      <div
        className="mt-2 text-xs"
        style={{
          color: 'var(--text-muted)',
          writingMode: 'vertical-rl',
          letterSpacing: '0.1em'
        }}
      >
        {files.length} 个文件
      </div>
    </div>
  )
}

export default FilePreviewPanel
