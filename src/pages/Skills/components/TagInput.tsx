import { useState, useCallback } from 'react'
import type { FC } from 'react'
import { Input, Tag } from 'antd'

interface TagInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
}

/** 通用标签输入组件：输入后按 Enter 添加，支持删除单个 Tag */
const TagInput: FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = '输入后按 Enter 添加',
}) => {
  const [inputValue, setInputValue] = useState('')

  /** 添加标签 */
  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    // 去重
    if (value.includes(trimmed)) {
      setInputValue('')
      return
    }
    onChange?.([...value, trimmed])
    setInputValue('')
  }, [inputValue, value, onChange])

  /** 删除标签 */
  const handleRemove = useCallback(
    (tag: string) => {
      onChange?.(value.filter((t) => t !== tag))
    },
    [value, onChange]
  )

  /** 按键处理 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAdd()
      }
    },
    [handleAdd]
  )

  return (
    <div className="flex flex-col gap-2">
      {/* 已有标签 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Tag
              key={tag}
              closable
              onClose={() => handleRemove(tag)}
              className="mb-1"
            >
              {tag}
            </Tag>
          ))}
        </div>
      )}
      {/* 输入框 */}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleAdd}
        placeholder={placeholder}
        size="small"
      />
    </div>
  )
}

export default TagInput
