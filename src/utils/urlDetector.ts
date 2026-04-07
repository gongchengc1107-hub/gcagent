/**
 * URL 检测工具
 * 从文本中提取 URL 和域名信息
 */

/** 从文本中提取所有 URL（去重） */
export function extractUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s)}\]>'"]+/g
  return [...new Set(text.match(regex) || [])]
}

/** 从 URL 提取域名，解析失败时返回原始 URL */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
