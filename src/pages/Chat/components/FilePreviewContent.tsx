import { useState, useCallback, useMemo } from 'react'
import type { FC } from 'react'
import {
  EyeOutlined,
  EditOutlined,
  SaveOutlined,
  CheckOutlined
} from '@ant-design/icons'
import type { PreviewFile } from '@/types'
import { useFilePreviewStore } from '@/stores'
import MarkdownRenderer from './MarkdownRenderer'

interface FilePreviewContentProps {
  file: PreviewFile
}

type ViewMode = 'preview' | 'edit'

const FilePreviewContent: FC<FilePreviewContentProps> = ({ file }) => {
  const [mode, setMode] = useState<ViewMode>('preview')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const updateEditedContent = useFilePreviewStore((s) => s.updateEditedContent)

  const currentContent = file.editedContent ?? file.content

  const handleEdit = useCallback(
    (value: string) => {
      updateEditedContent(file.id, value)
    },
    [file.id, updateEditedContent]
  )

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // 默认文件名和扩展名映射
      const extMap: Record<string, string> = {
        json: '.json',
        markdown: '.md',
        html: '.html'
      }
      const filterMap: Record<string, { name: string; extensions: string[] }[]> = {
        json: [{ name: 'JSON 文件', extensions: ['json'] }],
        markdown: [{ name: 'Markdown 文件', extensions: ['md', 'markdown'] }],
        html: [{ name: 'HTML 文件', extensions: ['html', 'htm'] }]
      }

      const defaultName = file.fileName || `untitled${extMap[file.language] || '.txt'}`
      const filters = filterMap[file.language] || [{ name: '所有文件', extensions: ['*'] }]

      // 调用 Electron IPC 打开保存对话框
      const result = await window.electronAPI.invoke(
        'dialog:showSaveDialog',
        defaultName,
        filters
      ) as { canceled: boolean; filePath?: string }

      if (result && !result.canceled && result.filePath) {
        await window.electronAPI.invoke('fs:save-file', result.filePath, currentContent)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } catch (err) {
      console.error('保存文件失败:', err)
    } finally {
      setSaving(false)
    }
  }, [currentContent, file.fileName, file.language])

  const hasChanges = file.editedContent !== undefined && file.editedContent !== file.content

  // JSON 格式化预览
  const formattedJSON = useMemo(() => {
    if (file.language !== 'json') return ''
    try {
      const parsed = JSON.parse(currentContent)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return currentContent
    }
  }, [currentContent, file.language])

  return (
    <div className="flex h-full flex-col">
      {/* 工具栏 */}
      <div
        className="flex items-center gap-1 border-b px-3 py-1.5"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        {/* 模式切换按钮 */}
        <ToolbarButton
          icon={<EyeOutlined />}
          label="预览"
          active={mode === 'preview'}
          onClick={() => setMode('preview')}
        />
        <ToolbarButton
          icon={<EditOutlined />}
          label="编辑"
          active={mode === 'edit'}
          onClick={() => setMode('edit')}
        />

        <div className="flex-1" />

        {/* 保存按钮 */}
        <button
          className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors"
          style={{
            backgroundColor: saveSuccess
              ? 'var(--success)'
              : 'var(--accent-primary)',
            color: '#fff',
            opacity: saving ? 0.6 : 1
          }}
          onClick={handleSave}
          disabled={saving}
        >
          {saveSuccess ? <CheckOutlined /> : <SaveOutlined />}
          {saveSuccess ? '已保存' : '保存'}
        </button>

        {/* 未保存变更提示 */}
        {hasChanges && !saveSuccess && (
          <span
            className="ml-1 text-xs"
            style={{ color: 'var(--warning)' }}
          >
            未保存
          </span>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto">
        {mode === 'preview' ? (
          <PreviewView file={file} content={currentContent} formattedJSON={formattedJSON} />
        ) : (
          <EditView content={currentContent} onChange={handleEdit} language={file.language} />
        )}
      </div>
    </div>
  )
}

/** 工具栏按钮 */
const ToolbarButton: FC<{
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}> = ({ icon, label, active, onClick }) => (
  <button
    className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
    style={{
      backgroundColor: active ? 'var(--accent-primary)18' : 'transparent',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)'
    }}
    onClick={onClick}
  >
    {icon}
    {label}
  </button>
)

/** 预览视图 */
const PreviewView: FC<{
  file: PreviewFile
  content: string
  formattedJSON: string
}> = ({ file, content, formattedJSON }) => {
  if (file.language === 'markdown') {
    return (
      <div className="p-4">
        <MarkdownRenderer content={content} />
      </div>
    )
  }

  if (file.language === 'html') {
    return (
      <iframe
        srcDoc={content}
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title={file.fileName}
        style={{ backgroundColor: '#fff', minHeight: 400 }}
      />
    )
  }

  if (file.language === 'json') {
    return (
      <div className="p-4">
        <pre
          className="overflow-auto whitespace-pre-wrap rounded-lg p-4 text-sm"
          style={{
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
          }}
        >
          <JSONHighlighter json={formattedJSON} />
        </pre>
      </div>
    )
  }

  return null
}

/** 简易 JSON 语法高亮 */
const JSONHighlighter: FC<{ json: string }> = ({ json }) => {
  const parts = json.split(/("(?:[^"\\]|\\.)*")\s*:/g)
  const elements: React.ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // key
      elements.push(
        <span key={i} style={{ color: '#9cdcfe' }}>{parts[i]}</span>
      )
      elements.push(':')
    } else {
      // value - 简单高亮字符串值、数字、布尔值和 null
      const text = parts[i]
      const highlighted = text
        .replace(
          /"(?:[^"\\]|\\.)*"/g,
          (m) => `<span style="color:#ce9178">${m}</span>`
        )
        .replace(
          /\b(true|false)\b/g,
          (m) => `<span style="color:#569cd6">${m}</span>`
        )
        .replace(
          /\bnull\b/g,
          (m) => `<span style="color:#569cd6">${m}</span>`
        )
        .replace(
          /\b(\d+\.?\d*)\b/g,
          (m) => `<span style="color:#b5cea8">${m}</span>`
        )
      elements.push(
        <span key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />
      )
    }
  }
  return <>{elements}</>
}

/** 编辑视图 */
const EditView: FC<{
  content: string
  onChange: (value: string) => void
  language: string
}> = ({ content, onChange }) => {
  return (
    <textarea
      className="h-full w-full resize-none border-0 p-4 text-sm outline-none"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        tabSize: 2
      }}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  )
}

export default FilePreviewContent
