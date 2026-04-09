import type { ChatMessage, ChatSession } from '@/types'
import { useAgentStore } from '@/stores/useAgentStore'
import { useChatStore } from '@/stores/useChatStore'

/**
 * 欢迎会话模板
 * 默认绑定 general agent
 */
export const WELCOME_SESSION: Omit<ChatSession, 'createdAt' | 'updatedAt'> = {
  id: 'session-welcome',
  title: '欢迎使用 Codemaker',
  isPinned: false,
  agentId: 'cli-general',
  modelId: 'claude-3-5-sonnet'
}

/** 欢迎消息内容 */
const WELCOME_CONTENT = `👋 你好！我是 Codemaker AI 助手。

我可以帮助你：
- **编写代码** — 从零开始创建功能模块
- **调试问题** — 定位和修复 Bug
- **探索代码库** — 快速理解项目结构和数据流
- **架构设计** — 规划可扩展的系统架构

选择左侧的 Agent 开始对话，或直接在这里输入你的问题。`

/**
 * 初始化种子数据
 * 首次登录时创建欢迎会话
 * 注意：内置 Agent 列表已移除——真实 agent 从 CLI 动态读取（diskSync → agent:list-cli）
 */
export function initSeedData(): void {
  const agentState = useAgentStore.getState()
  const chatState = useChatStore.getState()

  // 清空旧的硬编码内置 agent（sisyphus/explorer/builder 均无效）
  agentState.setAgents([])
  agentState.setCurrentAgent(null)

  // 创建欢迎会话
  const sessionId = chatState.createSession(
    WELCOME_SESSION.title,
    WELCOME_SESSION.agentId,
    WELCOME_SESSION.modelId
  )

  // 写入欢迎消息
  const welcomeMessage: ChatMessage = {
    id: `msg-welcome-${Date.now()}`,
    sessionId,
    role: 'assistant',
    content: WELCOME_CONTENT,
    createdAt: Date.now()
  }
  useChatStore.getState().addMessage(sessionId, welcomeMessage)
}
