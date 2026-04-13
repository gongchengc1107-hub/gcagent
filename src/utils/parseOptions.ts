/**
 * 从 AI 回复内容中解析选项标记
 * 支持两种格式：
 * 1. HTML 注释格式：<!--options: 选项 A, 选项 B, 选项 C-->
 * 2. JSON 格式：{"options":["选项 A","选项 B","选项 C"],"question":"请选择："}
 */

export interface ParsedOptions {
  /** 问题描述（可选） */
  question?: string
  /** 选项列表 */
  options: string[]
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
    // 检查是否包含问题（用 | 或 ？分隔）
    let question: string | undefined
    let optionsPart = raw

    const pipeSep = raw.indexOf('|')
    const questionMarkSep = raw.indexOf('？')

    if (pipeSep > 0) {
      question = raw.slice(0, pipeSep).trim()
      optionsPart = raw.slice(pipeSep + 1).trim()
    } else if (questionMarkSep > 1) {
      question = raw.slice(0, questionMarkSep + 1).trim()
      optionsPart = raw.slice(questionMarkSep + 1).trim()
    }

    // 解析选项（支持逗号、换行分隔）
    const options = optionsPart
      .split(/[,\n]+/)
      .map((o) => o.trim())
      .filter((o) => o.length > 0 && !o.startsWith('multiple'))

    // 检查是否标记多选
    const multiple = /\bmultiple\s*=\s*true\b/i.test(raw)

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

  // 格式 2: JSON 格式（在内容末尾）
  const jsonRegex = /```?\s*json\s*([\s\S]*?)```?|(\{[\s\S]*?"options"[\s\S]*?\})\s*$/
  match = jsonRegex.exec(content)
  if (match) {
    try {
      const jsonStr = match[1] || match[2]
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed.options) && parsed.options.length >= 2) {
        return {
          question: parsed.question,
          options: parsed.options,
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
  // 匹配 <!--selector: A, B, C-->
  const selectorRegex = /<!--\s*selector\s*:\s*(.*?)\s*-->/gs
  match = selectorRegex.exec(content)
  if (match) {
    const options = match[1]
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0)

    if (options.length >= 2) {
      return {
        options,
        multiple: false,
        matchIndex: match.index,
        matchEnd: match.index + match[0].length
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
