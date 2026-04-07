import { type FC } from 'react'
import { Button } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { useTodoPageStore } from '../../store/useTodoPageStore'
import { useAITodoAnalysis } from '../../hooks/useAITodoAnalysis'

/**
 * 问题卡片组件
 * 展示 AI Round 1 返回的澄清问题，用户逐一选择后提交触发 Round 2
 */
const QuestionCards: FC = () => {
  const { questions, answers, setAnswer } = useTodoPageStore()
  const { submitAnswers } = useAITodoAnalysis()

  const allAnswered = questions.length > 0 && questions.every((_, i) => !!answers[i])

  return (
    <div className="flex w-full flex-col overflow-y-auto px-8 py-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          在生成执行计划之前，请回答以下问题
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          已回答 {Object.keys(answers).length} / {questions.length} 个问题
        </p>
      </div>

      {/* 问题列表 */}
      <div className="flex flex-col gap-6">
        {questions.map((q, qi) => (
          <div key={qi} className="flex flex-col gap-3">
            {/* 问题标题 */}
            <div>
              <span
                className="mr-2 rounded px-1.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                  color: 'var(--accent-primary)'
                }}
              >
                {q.header}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {q.question}
              </span>
            </div>

            {/* 选项卡片 */}
            <div className="grid grid-cols-3 gap-2">
              {q.options.map((opt, oi) => {
                const isSelected = answers[qi] === opt.label
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswer(qi, opt.label)}
                    className="flex flex-col rounded-lg border px-3 py-2.5 text-left transition-all duration-150"
                    style={{
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)',
                      backgroundColor: isSelected
                        ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)'
                        : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      outline: isSelected ? '1px solid var(--accent-primary)' : 'none'
                    }}
                  >
                    {/* 选中指示点 */}
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 rounded-full border-2 transition-all"
                        style={{
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent'
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                      {opt.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 提交按钮 */}
      <div className="mt-8 flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          disabled={!allAnswered}
          onClick={submitAnswers}
        >
          生成执行计划
        </Button>
      </div>
    </div>
  )
}

export default QuestionCards
