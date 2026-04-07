import { create } from 'zustand'
import type { PreviewFile } from '@/types'

interface FilePreviewState {
  /** 侧边栏是否展开 */
  isOpen: boolean
  /** 已打开的文件列表（Tab 栏） */
  files: PreviewFile[]
  /** 当前活跃 Tab 的文件 ID */
  activeFileId: string | null

  /** 打开文件（添加到 Tab 或激活已有 Tab） */
  openFile: (file: PreviewFile) => void
  /** 关闭单个文件 Tab */
  closeFile: (fileId: string) => void
  /** 切换活跃 Tab */
  setActiveFile: (fileId: string) => void
  /** 收起/展开侧边栏 */
  togglePanel: () => void
  /** 关闭面板（清空所有文件并收起） */
  closePanel: () => void
  /** 更新编辑内容（暂存） */
  updateEditedContent: (fileId: string, content: string) => void
}

export const useFilePreviewStore = create<FilePreviewState>()((set, get) => ({
  isOpen: false,
  files: [],
  activeFileId: null,

  openFile: (file: PreviewFile) => {
    const { files } = get()
    const existing = files.find((f) => f.id === file.id)
    if (existing) {
      // 已打开则只切换到该 Tab
      set({ activeFileId: file.id, isOpen: true })
    } else {
      // 未打开则添加并激活
      set({
        files: [...files, file],
        activeFileId: file.id,
        isOpen: true
      })
    }
  },

  closeFile: (fileId: string) => {
    const { files, activeFileId } = get()
    const remaining = files.filter((f) => f.id !== fileId)
    if (remaining.length === 0) {
      // 最后一个文件被关闭，收起面板
      set({ files: [], activeFileId: null, isOpen: false })
    } else if (activeFileId === fileId) {
      // 关闭的是当前活跃 Tab，切换到最后一个
      set({ files: remaining, activeFileId: remaining[remaining.length - 1].id })
    } else {
      set({ files: remaining })
    }
  },

  setActiveFile: (fileId: string) => {
    set({ activeFileId: fileId })
  },

  togglePanel: () => {
    set((state) => ({ isOpen: !state.isOpen }))
  },

  closePanel: () => {
    set({ isOpen: false, files: [], activeFileId: null })
  },

  updateEditedContent: (fileId: string, content: string) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, editedContent: content } : f
      )
    }))
  }
}))
