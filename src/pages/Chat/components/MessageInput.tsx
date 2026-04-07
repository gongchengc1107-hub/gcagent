import { useState, useCallback, useEffect, useMemo, useRef, forwardRef } from 'react'
import type { FC } from 'react'
import { Select, message } from 'antd'
import {
  SendOutlined,
  PauseCircleOutlined,
  RobotOutlined,
  LoadingOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useAgentStore, useChatStore, useSkillStore } from '@/stores'
import { useModelStore, DEFAULT_MODEL } from '@/stores/useModelStore'
import { useSendMessage } from '@/hooks/useSendMessage'
import { getProvider } from '@/services/providerFactory'
import type { ChatMessage, ImageAttachment } from '@/types'
import type { QuestionAsked } from '@/services/chatProvider'
import { extractUrls } from '@/utils/urlDetector'
import UrlTag from './UrlTag'
import ImagePreview from './ImagePreview'
import SkillCommandMenu from './SkillCommandMenu'
import AgentSelectorPopup from './AgentSelectorPopup'
import type { AgentSelectorPopupHandle } from './AgentSelectorPopup'
import SkillSelectorPopup from './SkillSelectorPopup'
import type { SkillSelectorPopupHandle } from './SkillSelectorPopup'
import QuestionDialog from './QuestionDialog'

/** 图片最大 5MB */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
/** 最多同时附带 4 张图片 */
const MAX_IMAGE_COUNT = 4

/** 从 File 对象读取 base64 DataURL */
const readImageFile = (file: File): Promise<ImageAttachment | null> => {
  return new Promise((resolve) => {
    if (file.size > MAX_IMAGE_SIZE) {
      message.warning('图片大小不能超过 5MB')
      resolve(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        dataUrl: reader.result as string,
        name: file.name || '粘贴图片',
        size: file.size
      })
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

/** 将模型 ID（provider/model 格式）转换为展示标签 */
function modelLabel(modelId: string): string {
  const parts = modelId.split('/')
  return parts.length >= 2 ? parts.slice(1).join('/') : modelId
}

/** 按 provider 分组模型选项 */
function buildModelOptions(
  models: string[]
): { label: string; options: { label: string; value: string }[] }[] {
  const groups: Record<string, string[]> = {}
  for (const m of models) {
    const provider = m.includes('/') ? m.split('/')[0] : 'other'
    if (!groups[provider]) groups[provider] = []
    groups[provider].push(m)
  }
  return Object.entries(groups).map(([provider, items]) => ({
    label: provider,
    options: items.map((m) => ({ label: modelLabel(m), value: m }))
  }))
}

/** 当前打开的底部弹出层类型 */
type ActivePopup = 'agent' | 'skill' | null

const MessageInput: FC = () => {
  const [content, setContent] = useState('')
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([])
  const [removedUrls, setRemovedUrls] = useState<Set<string>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)
  const [showSkillMenu, setShowSkillMenu] = useState(false)
  const [skillFilter, setSkillFilter] = useState('')
  const [skillMenuActiveIndex, setSkillMenuActiveIndex] = useState(0)
  const [activePopup, setActivePopup] = useState<ActivePopup>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const agentPopupRef = useRef<AgentSelectorPopupHandle>(null)
  const skillPopupRef = useRef<SkillSelectorPopupHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const agentBtnRef = useRef<HTMLButtonElement>(null)
  const skillBtnRef = useRef<HTMLButtonElement>(null)
  const dragCounterRef = useRef(0)
  const isComposingRef = useRef(false)
  const showSkillMenuRef = useRef(false)
  const activePopupRef = useRef<ActivePopup>(null)
  /** skillMenuActiveIndex 的 ref 镜像，供 handleKeyDown 实时读取 */
  const skillMenuActiveIndexRef = useRef(0)

  const {
    currentSessionId,
    sessions,
    addMessage,
    isStreaming,
    saveDraft,
    getDraft,
    clearDraft,
    updateSessionAgent,
    pendingQuestions,
    pushPendingQuestion,
    shiftPendingQuestion,
    clearPendingQuestions,
  } = useChatStore()

  const { agents } = useAgentStore()
  const { skills } = useSkillStore()
  const { availableModels, currentModel, loading: modelsLoading, setCurrentModel } = useModelStore()
  const { sendMessage, stopGeneration } = useSendMessage()

  const currentSession = sessions.find((s) => s.id === currentSessionId)
  /** 当前会话的 pending question 队列 */
  const pendingQuestionQueue: QuestionAsked[] = currentSessionId
    ? (pendingQuestions[currentSessionId] ?? [])
    : []
  /** 当前正在展示的问题（队列中的第一个） */
  const pendingQuestion: QuestionAsked | null = pendingQuestionQueue.length > 0
    ? pendingQuestionQueue[0]
    : null
  /** 队列中的问题总数 */
  const pendingQuestionTotal = pendingQuestionQueue.length
  /** 当前问题在队列中的序号（从 1 开始） — 始终为 1，因为回答后 shift 掉 */
  const pendingQuestionIndex = pendingQuestion ? 1 : 0
  const [selectedAgentId, setSelectedAgentId] = useState(
    currentSession?.agentId || agents[0]?.id || ''
  )

  // 会话切换时同步 agent 选择 + 恢复草稿
  useEffect(() => {
    if (currentSession) {
      setSelectedAgentId(currentSession.agentId)
    }
    if (currentSessionId) {
      setContent(getDraft(currentSessionId))
    } else {
      setContent('')
    }
    setRemovedUrls(new Set())
    setPendingImages([])
    setActivePopup(null)
  }, [currentSessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 输入内容变化时自动保存草稿（防抖 300ms）
  const draftTimerRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!currentSessionId) return
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      saveDraft(currentSessionId, content)
    }, 300)
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [content, currentSessionId, saveDraft])

  /** 标记：Skill 选择后由代码填入内容，跳过下一次 onChange 的菜单触发逻辑 */
  const skipNextSkillMenuTriggerRef = useRef(false)

  /** 处理输入内容变化，检测 `/` 触发 Skill 菜单、`@` 触发 Agent 选择器 */
  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    // 选择 Skill 后由代码 setContent，跳过本次菜单触发，避免菜单重新弹出
    if (skipNextSkillMenuTriggerRef.current) {
      skipNextSkillMenuTriggerRef.current = false
      return
    }
    // 只有 `/` 开头且后面没有空格时才显示菜单（有空格说明命令已选定）
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowSkillMenu(true)
      showSkillMenuRef.current = true
      setSkillFilter(value.slice(1))
      setActivePopup(null)
      activePopupRef.current = null
    } else if (value === '@') {
      setActivePopup('agent')
      activePopupRef.current = 'agent'
      setContent('')
      setShowSkillMenu(false)
      showSkillMenuRef.current = false
    } else {
      setShowSkillMenu(false)
      showSkillMenuRef.current = false
      setSkillFilter('')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** 键入 `/` 命令菜单选择回调 */
  const handleSkillSelect = useCallback((skillName: string) => {
    // 先设标志，让下一次 onChange 跳过菜单触发逻辑
    skipNextSkillMenuTriggerRef.current = true
    setContent(`/${skillName} `)
    setShowSkillMenu(false)
    showSkillMenuRef.current = false
    setSkillFilter('')
    setSkillMenuActiveIndex(0)
    textareaRef.current?.focus()
  }, [])

  const handleSkillMenuClose = useCallback(() => {
    setShowSkillMenu(false)
    showSkillMenuRef.current = false
    setSkillFilter('')
  }, [])

  // ── 底部弹出层控制 ──────────────────────────────────────────

  /** 切换底部弹出层（同一个按钮再次点击则关闭） */
  const togglePopup = useCallback((type: ActivePopup) => {
    setActivePopup((prev) => {
      const next = prev === type ? null : type
      activePopupRef.current = next
      return next
    })
    setShowSkillMenu(false)
    showSkillMenuRef.current = false
  }, [])

  /** 关闭弹出层（稳定引用，避免 popup 内的 effect 频繁重注册 mousedown 监听） */
  const handleClosePopup = useCallback(() => {
    setActivePopup(null)
    activePopupRef.current = null
  }, [])

  /** @ 选择 Agent：更新本地 state 同时持久化到 session */
  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgentId(agentId)
    if (currentSessionId) {
      updateSessionAgent(currentSessionId, agentId)
    }
    setActivePopup(null)
    activePopupRef.current = null
    textareaRef.current?.focus()
  }, [currentSessionId, updateSessionAgent])

  /** / 选择 Skill：把 `/skillName ` 插入到输入框 */
  const handleSkillPopupSelect = useCallback((skillName: string) => {
    setContent(`/${skillName} `)
    setActivePopup(null)
    activePopupRef.current = null
    setShowSkillMenu(false)
    showSkillMenuRef.current = false
    textareaRef.current?.focus()
    // 触发高度自适应
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    })
  }, [])

  // ── URL 检测 ──────────────────────────────────────────────

  const detectedUrls = useMemo(() => {
    return extractUrls(content).filter((url) => !removedUrls.has(url))
  }, [content, removedUrls])

  const handleRemoveUrl = useCallback((url: string) => {
    setRemovedUrls((prev) => new Set(prev).add(url))
  }, [])

  useEffect(() => {
    const currentUrls = new Set(extractUrls(content))
    setRemovedUrls((prev) => {
      const next = new Set<string>()
      prev.forEach((url) => {
        if (currentUrls.has(url)) next.add(url)
      })
      return next.size === prev.size ? prev : next
    })
  }, [content])

  // ── Token 估算 ──────────────────────────────────────────────

  const estimatedTokens = useMemo(() => {
    const msgs = useChatStore.getState().messages[currentSessionId || ''] || []
    const totalChars = msgs.reduce((sum, m) => sum + m.content.length, 0) + content.length
    const tokens = Math.round(totalChars * 0.7)
    return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens)
  }, [currentSessionId, content])

  // ── 图片处理 ──────────────────────────────────────────────

  const addImages = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      // 并发安全：先 await 全部读取，再在 setState 回调中以最新 prev 计算剩余量
      const results = await Promise.all(imageFiles.slice(0, MAX_IMAGE_COUNT).map(readImageFile))
      const valid = results.filter(Boolean) as ImageAttachment[]
      if (valid.length === 0) return
      setPendingImages((prev) => {
        const remaining = MAX_IMAGE_COUNT - prev.length
        if (remaining <= 0) {
          message.warning(`最多只能附带 ${MAX_IMAGE_COUNT} 张图片`)
          return prev
        }
        return [...prev, ...valid.slice(0, remaining)]
      })
    },
    [] // 不依赖 pendingImages.length，通过函数式 setState 读取最新值
  )

  const handleRemoveImage = useCallback((id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items)
      const imageItems = items.filter((item) => item.type.startsWith('image/'))
      if (imageItems.length === 0) return
      e.preventDefault()
      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[]
      await addImages(files)
    },
    [addImages]
  )

  // ── 文件上传（+ 按钮）───────────────────────────────────────

  /** 触发文件选择器 */
  const handlePlusClick = useCallback(() => {
    setActivePopup(null)
    fileInputRef.current?.click()
  }, [])

  /** 文件选择器变化 */
  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        await addImages(files)
      }
      // 重置 input，允许重复选择同一文件
      e.target.value = ''
    },
    [addImages]
  )

  // ── 拖拽 ────────────────────────────────────────────────────

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (dragCounterRef.current === 1) setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setIsDragOver(false)
      await addImages(Array.from(e.dataTransfer.files))
    },
    [addImages]
  )

  // ── 发送 ────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (!content.trim() || !currentSessionId || isStreaming) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: currentSessionId,
      role: 'user',
      content: content.trim(),
      createdAt: Date.now(),
      ...(pendingImages.length > 0 ? { images: pendingImages } : {})
    }
    addMessage(currentSessionId, userMessage)

    setContent('')
    setPendingImages([])
    clearDraft(currentSessionId)
    setRemovedUrls(new Set())
    setActivePopup(null)

    const sessionMessages = useChatStore.getState().messages[currentSessionId] || []

    sendMessage({
      content: content.trim(),
      sessionId: currentSessionId,
      messages: sessionMessages,
      agentId: selectedAgentId,
      images: pendingImages.length > 0 ? pendingImages : undefined,
      onQuestion: (q) => {
        // AI agent 提问：将问题追加到队列，UI 自动弹出 QuestionDialog
        pushPendingQuestion(currentSessionId, q)
      }
    })
  }, [
    content,
    currentSessionId,
    isStreaming,
    pendingImages,
    selectedAgentId,
    addMessage,
    clearDraft,
    sendMessage,
    pushPendingQuestion,
  ])

  /**
   * 用户在 QuestionDialog 提交答案：
   * 1. 调用 answerQuestion API
   * 2. 清除 pending question（关闭弹层）
   */
  const handleQuestionSubmit = useCallback(
    async (answer: string) => {
      if (!pendingQuestion || !currentSessionId) return
      // 先弹出队列中当前问题（关闭或切换到下一个），避免二次点击
      shiftPendingQuestion(currentSessionId)
      try {
        await getProvider().answerQuestion(pendingQuestion.sessionID, pendingQuestion.id, answer)
      } catch (err) {
        message.error(`回答提交失败：${err instanceof Error ? err.message : String(err)}`)
        // 失败时将问题重新 push 回队列头部（恢复弹层），让用户重试
        pushPendingQuestion(currentSessionId, pendingQuestion)
      }
    },
    [pendingQuestion, currentSessionId, shiftPendingQuestion, pushPendingQuestion]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // IME 输入法进行中：所有 Enter 都只确认候选词，不发送、不选择列表项
      if (isComposingRef.current && e.key === 'Enter') return

      // 读取 ref 获取最新值（避免 stale closure 导致状态判断失效）
      const menuOpen = showSkillMenuRef.current
      const popup = activePopupRef.current

      // 优先级 1：/ 命令菜单（键入触发）—— 直接在 MessageInput 层处理，无需 ref
      if (menuOpen) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault()
          if (e.key === 'ArrowUp') {
            setSkillMenuActiveIndex((prev) => {
              const list = filteredSkillsForMenuRef.current
              return list.length === 0 ? 0 : prev <= 0 ? list.length - 1 : prev - 1
            })
          } else if (e.key === 'ArrowDown') {
            setSkillMenuActiveIndex((prev) => {
              const list = filteredSkillsForMenuRef.current
              return list.length === 0 ? 0 : prev >= list.length - 1 ? 0 : prev + 1
            })
          } else if (e.key === 'Enter') {
            const list = filteredSkillsForMenuRef.current
            const idx = skillMenuActiveIndexRef.current
            if (list[idx]) handleSkillSelect(list[idx].name)
          } else if (e.key === 'Escape') {
            handleSkillMenuClose()
          }
          return
        }
      }

      // 优先级 2：@ Agent 选择器弹出层
      if (popup === 'agent' && agentPopupRef.current?.handleKeyDown(e)) return

      // 优先级 3：/ Skill 选择器弹出层
      if (popup === 'skill' && skillPopupRef.current?.handleKeyDown(e)) return

      // Escape 关闭弹出层
      if (e.key === 'Escape' && popup) {
        setActivePopup(null)
        activePopupRef.current = null
        return
      }

      // Enter 发送（非 IME 进行中、无弹出层占用）
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend] // 仅依赖 handleSend，其余通过 ref 实时读取
  )

  // ── / 命令菜单数据（提升到 MessageInput 层统一管理）────────────

  const filteredSkillsForMenu = useMemo(() => {
    return skills.filter((skill) => {
      if (!skill.enabled) return false
      if (!skillFilter) return true
      const kw = skillFilter.toLowerCase()
      return skill.name.toLowerCase().includes(kw) || skill.description.toLowerCase().includes(kw)
    })
  }, [skills, skillFilter])

  /** ref 镜像，供 handleKeyDown 中同步读取（无 stale closure 风险） */
  const filteredSkillsForMenuRef = useRef(filteredSkillsForMenu)
  filteredSkillsForMenuRef.current = filteredSkillsForMenu

  /** skillMenuActiveIndex 同步到 ref，供 handleKeyDown 读取 */
  skillMenuActiveIndexRef.current = skillMenuActiveIndex

  // filter 变化时重置高亮索引
  useEffect(() => {
    setSkillMenuActiveIndex(0)
  }, [skillFilter])

  // ── 模型选项 ─────────────────────────────────────────────────

  const modelOptions = useMemo(():
    { label: string; options: { label: string; value: string }[] }[] => {
    if (availableModels.length === 0) {
      const fallback = currentModel || DEFAULT_MODEL
      return [{ label: 'Codemaker', options: [{ label: modelLabel(fallback), value: fallback }] }]
    }
    return buildModelOptions(availableModels)
  }, [availableModels, currentModel])

  // ── 当前 Agent 信息（用于显示 @ 按钮状态）───────────────────

  return (
    <div
      className="border-t px-4 py-3"
      style={{ borderColor: 'var(--border-secondary)' }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 选择栏 + Token 指示 */}
      <div className="mb-2 flex items-center gap-3">
        <Select
          size="small"
          value={selectedAgentId}
          onChange={(agentId) => {
            setSelectedAgentId(agentId)
            if (currentSessionId) updateSessionAgent(currentSessionId, agentId)
          }}
          style={{ width: 130 }}
          suffixIcon={<RobotOutlined />}
          options={agents
            .filter((a) => a.enabled && a.mode !== 'subagent')
            .map((a) => ({ label: `${a.emoji} ${a.name}`, value: a.id }))}
        />
        <Select
          size="small"
          value={currentModel || DEFAULT_MODEL}
          onChange={setCurrentModel}
          style={{ width: 220 }}
          loading={modelsLoading}
          suffixIcon={modelsLoading ? <LoadingOutlined /> : undefined}
          options={modelOptions}
          showSearch
          optionFilterProp="label"
        />
        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
          {estimatedTokens} / 128k
        </span>
      </div>

      {/* URL 识别卡片列表 */}
      {detectedUrls.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {detectedUrls.map((url) => (
            <UrlTag key={url} url={url} onRemove={handleRemoveUrl} />
          ))}
        </div>
      )}

      {/* 图片预览区 */}
      <ImagePreview images={pendingImages} onRemove={handleRemoveImage} />

      {/* 隐藏的文件选择器（图片） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* 输入区 */}
      <div className="relative">
        {/* AI agent 提问浮层（question.asked 事件触发） */}
        {pendingQuestion && (
          <QuestionDialog
            question={pendingQuestion}
            questionIndex={pendingQuestionIndex}
            questionTotal={pendingQuestionTotal}
            onSubmit={handleQuestionSubmit}
            onCancel={() => {
              // 发送 cancel 通知 CLI 取消，然后清空整个队列
              getProvider().answerQuestion(pendingQuestion.sessionID, pendingQuestion.id, 'cancel').catch(() => {})
              clearPendingQuestions(currentSessionId!)
            }}
          />
        )}

        {/* / 命令菜单（键盘触发，activeIndex 由 MessageInput 管理） */}
        <SkillCommandMenu
          visible={showSkillMenu}
          filter={skillFilter}
          activeIndex={skillMenuActiveIndex}
          onSelect={handleSkillSelect}
        />

        {/* @ Agent 选择器弹出层 */}
        {activePopup === 'agent' && (
          <AgentSelectorPopup
            ref={agentPopupRef}
            selectedAgentId={selectedAgentId}
            onSelect={handleAgentSelect}
            onClose={handleClosePopup}
            triggerRef={agentBtnRef}
          />
        )}

        {/* / Skill 选择器弹出层 */}
        {activePopup === 'skill' && (
          <SkillSelectorPopup
            ref={skillPopupRef}
            onSelect={handleSkillPopupSelect}
            onClose={handleClosePopup}
            triggerRef={skillBtnRef}
          />
        )}

        <div
          className="rounded-xl border transition-colors duration-200"
          style={{
            borderColor: isDragOver ? 'var(--accent-primary)' : 'var(--border-primary)',
            borderStyle: isDragOver ? 'dashed' : 'solid',
            borderWidth: isDragOver ? '2px' : '1px',
            backgroundColor: isDragOver ? 'var(--bg-secondary)' : 'var(--bg-primary)'
          }}
        >
          {/* textarea */}
          <div className="px-3 pt-2">
            <textarea
              ref={textareaRef}
              className="max-h-[200px] min-h-[40px] w-full resize-none bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
              placeholder={
                isStreaming ? 'AI 正在回复...' : '输入消息，Enter 发送，Shift+Enter 换行，可粘贴/拖拽图片'
              }
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onCompositionStart={() => { isComposingRef.current = true }}
              onCompositionEnd={() => { isComposingRef.current = false }}
              disabled={isStreaming}
              rows={1}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 200) + 'px'
              }}
            />
          </div>

          {/* 底部工具栏：左侧功能按钮 + 右侧发送/停止 */}
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            {/* 左侧：+ / / 两个功能按钮（@ 通过键盘触发，不展示按钮） */}
            <div className="flex items-center gap-0.5">
              {/* + 上传文件 */}
              <ToolbarButton
                icon={<PlusOutlined />}
                tooltip="上传图片"
                onClick={handlePlusClick}
                active={false}
              />

              {/* / 选择 Skill */}
              <ToolbarButton
                ref={skillBtnRef}
                icon={<span className="text-sm font-medium leading-none">/</span>}
                tooltip="选择 Skill (/)"
                onClick={() => togglePopup('skill')}
                active={activePopup === 'skill'}
              />
            </div>

            {/* 右侧：停止 / 发送 */}
            {isStreaming ? (
              <button
                onClick={stopGeneration}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--error)', color: '#fff' }}
                title="停止生成"
              >
                <PauseCircleOutlined className="text-sm" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!content.trim()}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{
                  backgroundColor: content.trim() ? 'var(--accent-primary)' : 'var(--border-primary)',
                  color: content.trim() ? '#fff' : 'var(--text-muted)',
                  cursor: content.trim() ? 'pointer' : 'not-allowed'
                }}
                title="发送"
              >
                <SendOutlined className="text-sm" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isDragOver && (
        <div className="mt-1 text-center text-xs" style={{ color: 'var(--accent-primary)' }}>
          松开鼠标以添加图片
        </div>
      )}
    </div>
  )
}

// ── 工具栏图标按钮 ────────────────────────────────────────────

interface ToolbarButtonProps {
  icon: React.ReactNode
  tooltip: string
  onClick: () => void
  /** 是否处于激活（弹出层打开）状态 */
  active: boolean
}

const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ icon, tooltip, onClick, active }, ref) => {
    const [hovered, setHovered] = useState(false)
    return (
      <button
        ref={ref}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors"
        style={{
          color: active || hovered ? (active ? 'var(--accent-primary)' : 'var(--text-secondary)') : 'var(--text-muted)',
          backgroundColor: active || hovered ? 'var(--bg-secondary)' : 'transparent',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        title={tooltip}
        type="button"
      >
        {icon}
      </button>
    )
  }
)

ToolbarButton.displayName = 'ToolbarButton'

export default MessageInput
