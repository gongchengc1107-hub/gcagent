/**
 * aiJsonParser — AI 输出 JSON 的通用解析工具
 *
 * 从 AI 流式输出中安全提取 JSON 对象/数组，处理常见的格式问题：
 * - markdown 代码块包裹
 * - 未转义的双引号
 * - 不完整的 JSON 片段
 *
 * 供 Skill 智能生成 / Agent 智能生成等模块共用。
 */

/** AI 返回的单个澄清问题 */
export interface AIQuestion {
  header: string
  question: string
  /** AI 决定该问题是否允许多选，默认 false（单选） */
  multiple?: boolean
  options: Array<{ label: string; description: string }>
}

/** 去掉 markdown 代码块包裹（使用贪婪匹配，确保嵌套代码块不被截断） */
export function stripCodeBlock(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*)```/)
  return match ? match[1].trim() : text
}

/**
 * 修复 AI 输出中 JSON 字符串值内未转义的双引号。
 *
 * 典型场景：AI 在 description 中写了 "用户说"帮我审查"时触发" —— 内部 "" 未转义
 *
 * 策略：逐字符扫描，在 JSON 字符串值内部发现 " 后，
 * 如果其后续字符不符合 JSON 结构字符（, : ] } 或结束），则转义为 \"
 */
export function repairJsonQuotes(text: string): string {
  const chars = [...text]
  const result: string[] = []
  let inString = false
  let escape = false

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]

    if (escape) {
      escape = false
      result.push(ch)
      continue
    }

    if (ch === '\\' && inString) {
      escape = true
      result.push(ch)
      continue
    }

    if (ch === '"') {
      if (!inString) {
        inString = true
        result.push(ch)
      } else {
        // 在字符串内遇到 "，判断是否是真正的字符串结束符
        let j = i + 1
        while (j < chars.length && (chars[j] === ' ' || chars[j] === '\n' || chars[j] === '\r' || chars[j] === '\t')) j++
        const next = j < chars.length ? chars[j] : ''
        if (next === ',' || next === ':' || next === ']' || next === '}' || next === '') {
          inString = false
          result.push(ch)
        } else {
          result.push('\\', '"')
        }
      }
    } else {
      result.push(ch)
    }
  }
  return result.join('')
}

/** 安全解析 JSON：先尝试直接 parse，失败后尝试修复引号再 parse */
export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const repaired = repairJsonQuotes(text)
    return JSON.parse(repaired)
  }
}

/** 使用括号平衡从文本中提取第一个完整 JSON 对象或数组 */
export function extractJsonBlock(text: string, openChar: '{' | '['): string | null {
  const closeChar = openChar === '{' ? '}' : ']'
  const start = text.indexOf(openChar)
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === openChar) depth++
    if (ch === closeChar) depth--
    if (depth === 0) return text.slice(start, i + 1)
  }
  return null
}

/** 从 AI 输出中提取澄清问题 JSON 数组 */
export function extractQuestions(text: string): AIQuestion[] | null {
  const candidates = [text, stripCodeBlock(text)]
  for (const source of candidates) {
    // 优先尝试数组格式
    const arrayJson = extractJsonBlock(source, '[')
    if (arrayJson) {
      try {
        const parsed = safeJsonParse(arrayJson)
        if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0] as AIQuestion).question) {
          return parsed as AIQuestion[]
        }
      } catch { /* 继续 */ }
    }
    // 尝试对象包裹格式 {"questions":[...]}
    const objJson = extractJsonBlock(source, '{')
    if (objJson) {
      try {
        const parsed = safeJsonParse(objJson) as Record<string, unknown>
        const qs = parsed.questions
        if (Array.isArray(qs) && qs.length > 0) {
          return qs as AIQuestion[]
        }
      } catch { /* 继续 */ }
    }
  }
  return null
}
