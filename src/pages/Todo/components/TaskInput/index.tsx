import type { FC } from 'react'
import { Input, Button, Tooltip } from 'antd'
import { SendOutlined, StopOutlined, ClearOutlined, RollbackOutlined } from '@ant-design/icons'
import { useTodoPageStore } from '../../store/useTodoPageStore'
import { useAITodoAnalysis } from '../../hooks/useAITodoAnalysis'

const { TextArea } = Input

const TaskInput: FC = () => {
  const { taskInput, isStreaming, phase, setTaskInput, clearAll, resetResult } = useTodoPageStore()
  const { startAnalysis, stopAnalysis } = useAITodoAnalysis()

  // answering 阶段：输入框禁用（问题已基于当前内容生成，不应再修改）
  const isInputDisabled = isStreaming || phase === 'answering'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isStreaming && phase !== 'answering') startAnalysis()
    }
  }

  const renderActionButton = () => {
    if (isStreaming) {
      return (
        <Button icon={<StopOutlined />} size="small" danger onClick={stopAnalysis}>
          停止
        </Button>
      )
    }
    if (phase === 'answering') {
      // answering 阶段：提供取消按钮，让用户放弃当前问题返回 idle
      return (
        <Button icon={<RollbackOutlined />} size="small" onClick={resetResult}>
          取消
        </Button>
      )
    }
    return (
      <Button
        icon={<SendOutlined />}
        size="small"
        type="primary"
        disabled={!taskInput.trim()}
        onClick={startAnalysis}
      >
        开始分析
      </Button>
    )
  }

  const getHintText = () => {
    if (phase === 'answering') return '请回答下方问题后生成执行计划，或点击取消重新开始'
    if (isStreaming) return 'AI 正在分析中...'
    return 'AI 将拆解任务并实时显示执行步骤'
  }

  return (
    <div
      className="flex flex-col gap-3 border-b p-4"
      style={{ borderColor: 'var(--border-secondary)' }}
    >
      <div className="flex items-start gap-2">
        <TextArea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你要完成的大型任务或项目，AI 将自动拆解执行计划...（⌘/Ctrl + Enter 发送）"
          autoSize={{ minRows: 2, maxRows: 5 }}
          disabled={isInputDisabled}
          className="flex-1"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
            resize: 'none'
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {getHintText()}
        </span>

        <div className="flex items-center gap-2">
          {/* 清空按钮：streaming 和 answering 阶段均禁用 */}
          <Tooltip title="清空全部">
            <Button
              icon={<ClearOutlined />}
              size="small"
              type="text"
              disabled={isInputDisabled}
              onClick={clearAll}
              style={{ color: 'var(--text-tertiary)' }}
            />
          </Tooltip>

          {renderActionButton()}
        </div>
      </div>
    </div>
  )
}

export default TaskInput
