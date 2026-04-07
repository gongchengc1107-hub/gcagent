import { useCallback, useMemo } from 'react'
import type { FC } from 'react'
import { Button, Input } from 'antd'
import { PlusOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useState } from 'react'

interface EnvEditorProps {
  value: Record<string, string>
  onChange: (val: Record<string, string>) => void
  /** Key 输入框占位文本 */
  keyPlaceholder?: string
  /** Value 输入框占位文本 */
  valuePlaceholder?: string
}

/** 敏感关键词列表，匹配到时自动遮蔽 Value */
const SENSITIVE_KEYWORDS = ['TOKEN', 'SECRET', 'KEY', 'PASSWORD', 'CREDENTIAL', 'AUTH']

/** 判断 Key 是否包含敏感关键词 */
function isSensitiveKey(key: string): boolean {
  const upper = key.toUpperCase()
  return SENSITIVE_KEYWORDS.some((kw) => upper.includes(kw))
}

/** 动态 Key-Value 编辑器 — 用于环境变量、Headers 等场景 */
const EnvEditor: FC<EnvEditorProps> = ({
  value,
  onChange,
  keyPlaceholder = 'KEY',
  valuePlaceholder = 'VALUE',
}) => {
  /** 记录哪些行的 Value 处于可见状态 */
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  /** 将 Record 转为数组用于渲染 */
  const entries = useMemo(() => Object.entries(value), [value])

  /** 更新某一行的 Key（重命名） */
  const handleKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      const result: Record<string, string> = {}
      for (const [k, v] of Object.entries(value)) {
        if (k === oldKey) {
          result[newKey] = v
        } else {
          result[k] = v
        }
      }
      onChange(result)
    },
    [value, onChange],
  )

  /** 更新某一行的 Value */
  const handleValueChange = useCallback(
    (key: string, newValue: string) => {
      onChange({ ...value, [key]: newValue })
    },
    [value, onChange],
  )

  /** 删除一行 */
  const handleRemove = useCallback(
    (key: string) => {
      const next = { ...value }
      delete next[key]
      onChange(next)
    },
    [value, onChange],
  )

  /** 新增一行 */
  const handleAdd = useCallback(() => {
    // 使用空字符串作为新增行的 Key，防止 Key 冲突后自动追加数字
    let newKey = ''
    let counter = 1
    while (newKey in value) {
      newKey = `KEY_${counter}`
      counter++
    }
    onChange({ ...value, [newKey]: '' })
  }, [value, onChange])

  /** 切换某行 Value 的可见性 */
  const toggleVisible = useCallback((key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, val]) => {
        const sensitive = isSensitiveKey(key)
        const isVisible = visibleKeys.has(key)

        return (
          <div key={key} className="flex items-center gap-2">
            {/* Key 输入 */}
            <Input
              className="flex-1"
              size="small"
              placeholder={keyPlaceholder}
              value={key}
              onChange={(e) => handleKeyChange(key, e.target.value)}
            />
            {/* Value 输入：敏感字段默认密码模式 */}
            <div className="relative flex flex-[2] items-center">
              <Input
                className="w-full"
                size="small"
                placeholder={valuePlaceholder}
                type={sensitive && !isVisible ? 'password' : 'text'}
                value={val}
                onChange={(e) => handleValueChange(key, e.target.value)}
              />
              {/* 敏感字段显示可见性切换 */}
              {sensitive && (
                <button
                  className="absolute right-1.5 flex items-center justify-center rounded p-0.5 transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => toggleVisible(key)}
                  title={isVisible ? '隐藏' : '显示'}
                  type="button"
                >
                  {isVisible ? (
                    <EyeOutlined style={{ fontSize: 12 }} />
                  ) : (
                    <EyeInvisibleOutlined style={{ fontSize: 12 }} />
                  )}
                </button>
              )}
            </div>
            {/* 删除按钮 */}
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(key)}
            />
          </div>
        )
      })}

      {/* 添加一行 */}
      <Button
        type="dashed"
        size="small"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        className="w-fit"
      >
        添加一行
      </Button>
    </div>
  )
}

export default EnvEditor
