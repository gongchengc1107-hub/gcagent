import { type FC } from 'react'
import { Button, Input, Spin } from 'antd'
import {
  SendOutlined,
  StopOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { useAgentGenerateStore } from '../store/useAgentGenerateStore'
import { useAIAgentGeneration } from '../hooks/useAIAgentGeneration'

const { TextArea } = Input

/** 智能生成 Agent Tab — 两轮 AI 对话，生成完成后自动填入手动填写表单 */
const AIGenerateAgentTab: FC = () => {
  const {
    userInput,
    phase,
    isStreaming,
    aiOutput,
    questions,
    answers,
    setUserInput,
    setAnswer,
  } = useAgentGenerateStore()

  const { startAnalysis, submitAnswers, stopGeneration } = useAIAgentGeneration()

  const allAnswered = questions.length > 0 && questions.every((_, i) => {
    const a = answers[i]
    return Array.isArray(a) ? a.length > 0 : !!a
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!isStreaming && phase === 'idle') startAnalysis()
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* ─── 输入区域 ─── */}
      <div className="flex flex-col gap-2">
        <TextArea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请描述这个 Agent 的角色定位、应该做什么、什么时候使用等，描述越全面生成效果越好"
          rows={4}
          maxLength={10000}
          showCount
          disabled={phase !== 'idle'}
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        />
        {phase === 'idle' && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Ctrl/Cmd + Enter 快速发送
            </span>
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={!userInput.trim()}
              onClick={startAnalysis}
            >
              开始生成
            </Button>
          </div>
        )}
      </div>

      {/* ─── Round 1 加载中 ─── */}
      {phase === 'questioning' && (
        <div
          className="flex items-center gap-3 rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <Spin indicator={<LoadingOutlined spin />} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            AI 正在分析你的描述，生成澄清问题...
          </span>
          <Button
            size="small"
            icon={<StopOutlined />}
            danger
            onClick={stopGeneration}
            className="ml-auto"
          >
            停止
          </Button>
        </div>
      )}

      {/* ─── Round 1 完成：问题卡片 ─── */}
      {(phase === 'answering' || phase === 'generating' || phase === 'done') &&
        questions.length > 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                请回答以下问题以获得更精确的结果
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                已回答 {Object.keys(answers).length} / {questions.length} 个问题
              </p>
            </div>

            {questions.map((q, qi) => (
              <div key={qi} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {q.header}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {q.question}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => {
                    const isMultiple = !!q.multiple
                    const isSelected = isMultiple
                      ? Array.isArray(answers[qi]) && (answers[qi] as string[]).includes(opt.label)
                      : answers[qi] === opt.label
                    const isDisabled = phase !== 'answering'
                    return (
                      <button
                        key={oi}
                        onClick={() => !isDisabled && setAnswer(qi, opt.label)}
                        disabled={isDisabled}
                        className="flex flex-col rounded-lg border px-3 py-2 text-left transition-all duration-150"
                        style={{
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)',
                          backgroundColor: isSelected
                            ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                            : 'var(--bg-secondary)',
                          cursor: isDisabled ? 'default' : 'pointer',
                          outline: isSelected ? '1px solid var(--accent-primary)' : 'none',
                          opacity: isDisabled && !isSelected ? 0.5 : 1,
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isMultiple ? (
                            <span
                              className="h-3 w-3 rounded-sm border-2 transition-all flex-shrink-0 flex items-center justify-center text-[8px] leading-none"
                              style={{
                                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                                backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                                color: isSelected ? '#fff' : 'transparent',
                              }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              className="h-3 w-3 rounded-full border-2 transition-all flex-shrink-0"
                              style={{
                                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                                backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                              }}
                            />
                          )}
                          <span
                            className="text-xs font-medium"
                            style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                          >
                            {opt.label}
                          </span>
                        </div>
                        <span className="text-xs leading-relaxed pl-[18px]" style={{ color: 'var(--text-tertiary)' }}>
                          {opt.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {phase === 'answering' && (
              <div className="flex justify-end">
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  disabled={!allAnswered}
                  onClick={submitAnswers}
                >
                  确认并生成
                </Button>
              </div>
            )}
          </div>
        )}

      {/* ─── Round 2 生成中 ─── */}
      {phase === 'generating' && (
        <div className="flex flex-col gap-3">
          <div
            className="flex items-center gap-3 rounded-lg p-4"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <Spin indicator={<LoadingOutlined spin />} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI 正在生成 Agent 配置...
            </span>
            <Button
              size="small"
              icon={<StopOutlined />}
              danger
              onClick={stopGeneration}
              className="ml-auto"
            >
              停止
            </Button>
          </div>
          {aiOutput && (
            <div
              className="rounded-lg p-3 text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-tertiary)',
              }}
            >
              {aiOutput}
            </div>
          )}
        </div>
      )}

      {/* ─── Round 2 完成：自动跳转提示 ─── */}
      {phase === 'done' && (
        <div
          className="flex items-center gap-2 rounded-lg p-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-secondary))',
          }}
        >
          <CheckCircleOutlined style={{ color: 'var(--accent-primary)', fontSize: 16 }} />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Agent 生成完成，已自动填入表单，请确认后保存
          </span>
        </div>
      )}
    </div>
  )
}

export default AIGenerateAgentTab
