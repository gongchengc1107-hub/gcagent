/**
 * fileReader — 统一文件读取工具
 *
 * 支持纯文本文件（.txt/.md/.json/.csv/.ts/.js/.py/.html/.css）和 PDF 文件。
 * 返回 FileAttachment（含提取的文本内容），用于作为参考文件附件发送给 AI。
 */
import type { FileAttachment } from '@/types'

/** 单文件最大 30MB */
export const MAX_FILE_SIZE = 30 * 1024 * 1024
/** 最多同时附带 5 个参考文件 */
export const MAX_FILE_COUNT = 5

/** 支持的文本类文件后缀 */
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.csv',
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.html', '.css',
])

/** 支持的所有文件后缀（含 PDF） */
const ALL_EXTENSIONS = new Set([...TEXT_EXTENSIONS, '.pdf'])

/** accept 属性值，用于 <input type="file"> */
export const FILE_ACCEPT = [...ALL_EXTENSIONS].join(',')

/** 获取文件后缀（含点号，小写） */
function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : ''
}

/** 判断文件是否为支持的类型 */
export function isSupportedFile(file: File): boolean {
  return ALL_EXTENSIONS.has(getExtension(file.name))
}

/** 判断文件后缀类别，用于展示不同 icon */
export function getFileCategory(fileType: string): 'text' | 'code' | 'pdf' {
  const codeExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.html', '.css'])

  if (fileType === '.pdf') return 'pdf'
  if (codeExts.has(fileType)) return 'code'
  return 'text'
}

/** 以纯文本方式读取文件 */
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`读取文件失败: ${file.name}`))
    reader.readAsText(file, 'utf-8')
  })
}

/** PDF Worker 一次性初始化标记 */
let pdfWorkerInitialized = false

/** 使用 pdfjs-dist 提取 PDF 文本内容 */
async function readPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  if (!pdfWorkerInitialized) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
    pdfWorkerInitialized = true
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join('')
    pages.push(pageText)
  }

  return pages.join('\n\n')
}

/**
 * 读取单个文件并返回 FileAttachment
 * @returns FileAttachment 或 null（不支持的类型 / 超限 / 空文件 / 读取失败）
 */
export async function readFile(file: File): Promise<FileAttachment | null> {
  const ext = getExtension(file.name)

  if (!ALL_EXTENSIONS.has(ext)) {
    return null
  }

  if (file.size === 0) {
    return null
  }

  if (file.size > MAX_FILE_SIZE) {
    return null
  }

  try {
    let content: string
    if (ext === '.pdf') {
      content = await readPdfText(file)
    } else {
      content = await readAsText(file)
    }

    return {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      content,
      fileType: ext,
    }
  } catch {
    return null
  }
}

/**
 * 将参考文件内容拼接为 prompt 前缀
 * 格式：每个文件以 markdown 代码块包裹
 * 使用 5 个反引号作为 fence 避免与文件内容中的反引号冲突
 */
export function buildFilePromptPrefix(files: FileAttachment[]): string {
  if (files.length === 0) return ''

  const langMap: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'jsx',
    '.py': 'python', '.html': 'html', '.css': 'css',
    '.json': 'json', '.md': 'markdown', '.csv': 'csv',
    '.txt': 'text', '.pdf': 'text',
  }

  const fence = '`````'
  const blocks = files.map((f) => {
    const lang = langMap[f.fileType] || 'text'
    return `[参考文件: ${f.name}]\n${fence}${lang}\n${f.content}\n${fence}`
  })

  return blocks.join('\n\n') + '\n\n'
}
