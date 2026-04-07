/**
 * 快捷选项解析工具
 * 从 AI 回复内容末尾提取列表项，生成可点击的快捷按钮
 */

/**
 * 解析 AI 回复末尾的列表项，返回快捷选项文本数组
 * 支持无序列表（`- xxx`、`* xxx`）和有序列表（`1. xxx`）
 * 最多返回 5 个选项
 */
export function parseQuickActions(content: string): string[] {
  if (!content.trim()) return []

  // 按空行分段，取最后一段
  const paragraphs = content.trim().split(/\n\n+/)
  const lastParagraph = paragraphs[paragraphs.length - 1]

  // 逐行匹配列表项
  const listItems: string[] = []
  const lines = lastParagraph.split('\n')
  for (const line of lines) {
    const match = line.match(/^(?:[-*]\s+|\d+\.\s+)(.+)$/)
    if (match) {
      // 去除可能的 Markdown 加粗、链接等格式
      const text = match[1]
        .replace(/\*\*(.*?)\*\*/g, '$1')  // **加粗** → 加粗
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // [链接](url) → 链接
        .trim()
      if (text) {
        listItems.push(text)
      }
    }
  }

  // 最多 5 个
  return listItems.slice(0, 5)
}
