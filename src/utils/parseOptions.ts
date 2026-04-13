/**
 * 从 AI 回复内容中解析选项标记
 * 支持两种格式：
 * 1. HTML 注释格式：<!--options: 选项 A, 选项 B, 选项 C-->
 * 2. JSON 格式：{"options":["选项 A","选项 B","选项 C"],"question":"请选择："}
 */

export interface ParsedOption {
  label: string
  /** 是否为自定义输入选项 */
  isCustom: boolean
  /** 自定义输入的提示文字 */
  customPlaceholder?: string
}

export interface ParsedOptions {
  /** 问题描述（可选） */
  question?: string
  /** 选项列表 */
  options: ParsedOption[]
  /** 是否允许多选 */
  multiple: boolean
  /** 原始内容中匹配到的起始位置 */
  matchIndex: number
  /** 原始内容中匹配到的结束位置 */
  matchEnd: number
}

/**
 * 尝试从内容中解析 options 标记
 * @param content AI 回复的完整内容
 * @returns 解析结果，未找到返回 null
 */
export function parseOptionsFromContent(content: string): ParsedOptions | null {
  if (!content) return null

  // 格式 1: HTML 注释格式 <!--options: A, B, C-->
  // 支持变体：<!--options: 问题？| A, B, C-->
  const commentRegex = /<!--\s*options\s*:\s*(.*?)\s*-->/gs
  let match = commentRegex.exec(content)
  if (match) {
    const raw = match[1].trim()
    // 检查是否包含问题（用 | 分隔）
    let question: string | undefined
    let optionsPart = raw

    const pipeSep = raw.indexOf('|')
    if (pipeSep > 0) {
      question = raw.slice(0, pipeSep).trim()
      optionsPart = raw.slice(pipeSep + 1).trim()
    }

    // 检查是否标记多选
    const multiple = /\bmultiple\s*=\s*true\b/i.test(optionsPart)
    if (multiple) {
      optionsPart = optionsPart.replace(/\bmultiple\s*=\s*true\b\s*,?\s*/gi, '').trim()
    }

    // 解析选项（支持逗号、换行分隔）
    const rawOptions = optionsPart
      .split(/[,\n]+/)
      .map((o) => o.trim())
      .filter((o) => o.length > 0)

    // 解析每个选项，识别自定义输入
    const options: ParsedOption[] = rawOptions.map((opt) => {
      // 支持格式：自定义=请输入xxx 或 其他（自定义）
      const customMatch = opt.match(/^(.+?)[=：]\s*(.+)$/s)
      if (customMatch && (customMatch[1].includes('自定义') || customMatch[1].includes('其他') || customMatch[1].includes('输入'))) {
        return {
          label: customMatch[1].trim(),
          isCustom: true,
          customPlaceholder: customMatch[2].trim()
        }
      }
      // 简单关键词识别
      if (opt === '其他' || opt === '自定义' || opt === '手动输入' || opt.includes('其他（') || opt.includes('自定义（')) {
        return {
          label: opt,
          isCustom: true,
          customPlaceholder: '请输入具体内容'
        }
      }
      return { label: opt, isCustom: false }
    })

    if (options.length >= 2) {
      return {
        question,
        options,
        multiple,
        matchIndex: match.index,
        matchEnd: match.index + match[0].length
      }
    }
  }

  // 格式 2: JSON 格式（在内容末尾）— 100% 可靠方案
  // {"options":{"question":"...","choices":["A","B"],"multiple":false}}
  const jsonRegex = /```?\s*json\s*([\s\S]*?)```?|(\{[\s\S]*?"options"[\s\S]*?\})\s*$/
  match = jsonRegex.exec(content)
  if (match) {
    try {
      const jsonStr = match[1] || match[2]
      const parsed = JSON.parse(jsonStr)
      const opts = parsed.options
      if (opts && Array.isArray(opts.choices) && opts.choices.length >= 2) {
        return {
          question: opts.question || '',
          options: opts.choices.map((label: string) => ({ label, isCustom: false })),
          multiple: opts.multiple === true,
          matchIndex: match.index,
          matchEnd: match.index + match[0].length
        }
      }
      // 兼容旧格式：直接 {"options":["A","B"]}
      if (Array.isArray(parsed.options) && parsed.options.length >= 2) {
        const options: ParsedOption[] = parsed.options.map((opt: string | { label: string; isCustom?: boolean; customPlaceholder?: string }) => {
          if (typeof opt === 'string') {
            return { label: opt, isCustom: false }
          }
          return {
            label: opt.label || '',
            isCustom: opt.isCustom === true,
            customPlaceholder: opt.customPlaceholder
          }
        })
        return {
          question: parsed.question,
          options,
          multiple: parsed.multiple === true,
          matchIndex: match.index,
          matchEnd: match.index + match[0].length
        }
      }
    } catch {
      // JSON 解析失败，忽略
    }
  }

  // 格式 3: 简单列表格式（兼容旧格式）
  const selectorRegex = /<!--\s*selector\s*:\s*(.*?)\s*-->/gs
  match = selectorRegex.exec(content)
  if (match) {
    const options: ParsedOption[] = match[1]
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
      .map((label) => ({ label, isCustom: false }))

    if (options.length >= 2) {
      return {
        options,
        multiple: false,
        matchIndex: match.index,
        matchEnd: match.index + match[0].length
      }
    }
  }

  // ─── 兜底方案：自动检测自然语言中的"问题+选项列表"模式 ─────────────────────
  // 匹配格式 1：编号问题 + 项目符号选项
  // 1. 问题描述？
  //    - 选项 A
  //    - 选项 B
  // 或
  // 1. 问题描述？
  //    • 比如：选项 A、选项 B、选项 C
  const qaRegex = /(?:^|\n)\s*(?:\d+[\.)]\s*\*?\*?|\*\*\d+[\.)]\s*\*\*?)(.+?[？?！!])\s*\n\s*(?:[-*•]\s*(?:比如：|例如：|如：)?\s*(.+?)(?:\n|$))/gs
  match = qaRegex.exec(content)
  if (match) {
    const question = match[1].trim().replace(/\*+/g, '')
    const optionsRaw = match[2]?.trim()
    
    let optionLines: string[] = []
    if (optionsRaw) {
      // 尝试用顿号、逗号分隔
      if (optionsRaw.includes('、')) {
        optionLines = optionsRaw.split('、').map(s => s.trim()).filter(Boolean)
      } else if (optionsRaw.includes(',')) {
        optionLines = optionsRaw.split(',').map(s => s.trim()).filter(Boolean)
      } else if (optionsRaw.includes('，')) {
        optionLines = optionsRaw.split('，').map(s => s.trim()).filter(Boolean)
      } else {
        optionLines = [optionsRaw]
      }
      // 清理"等"、"等等"后缀
      optionLines = optionLines.map(opt => opt.replace(/[等]+[。.!！]*$/, '').trim()).filter(Boolean)
    }

    if (question && optionLines.length >= 2) {
      const fullMatch = match[0]
      const startIndex = content.indexOf(fullMatch)
      return {
        question,
        options: optionLines.map((label) => ({ label, isCustom: false })),
        multiple: false,
        matchIndex: startIndex >= 0 ? startIndex : match.index,
        matchEnd: startIndex >= 0 ? startIndex + fullMatch.length : match.index + match[0].length
      }
    }
  }

  // 匹配格式 2：多行项目符号选项
  // 1. 问题？
  //    - 选项 A
  //    - 选项 B
  //    - 选项 C
  const qaRegex2 = /(?:^|\n)\s*(?:\d+[\.)]\s*\*?\*?|\*\*\d+[\.)]\s*\*\*?)(.+?[？?！!])\s*\n((?:\s*[-*•]\s*.+?\n?)+)/gs
  match = qaRegex2.exec(content)
  if (match) {
    const question = match[1].trim().replace(/\*+/g, '')
    const optionsBlock = match[2]
    // 提取选项行
    const optionLines = optionsBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[-*•]/.test(line))
      .map((line) => line.replace(/^[-*•]\s*(?:比如：|例如：|如：)?\s*/, '').trim())
      .filter((line) => line.length > 0 && line !== '等' && line !== '等等')

    if (question && optionLines.length >= 2) {
      const fullMatch = match[0]
      const startIndex = content.indexOf(fullMatch)
      return {
        question,
        options: optionLines.map((label) => ({ label, isCustom: false })),
        multiple: false,
        matchIndex: startIndex >= 0 ? startIndex : match.index,
        matchEnd: startIndex >= 0 ? startIndex + fullMatch.length : match.index + match[0].length
      }
    }
  }

  return null
}

/**
 * 从内容中移除 options 标记，返回清理后的内容
 */
export function stripOptionsMarkers(content: string): string {
  // 移除 HTML 注释格式的 options
  content = content.replace(/<!--\s*options\s*:[\s\S]*?-->/g, '')
  // 移除 selector 格式
  content = content.replace(/<!--\s*selector\s*:[\s\S]*?-->/g, '')
  // 移除末尾的 JSON options 块
  content = content.replace(/```?\s*json\s*\{[\s\S]*?"options"[\s\S]*?\}\s*```?\s*$/g, '')
  return content.trim()
}
