/** 文件操作服务接口 */
export interface IFileService {
  /** 读取文件内容 */
  readFile(path: string): Promise<string>
  /** 写入文件内容 */
  writeFile(path: string, content: string): Promise<void>
  /** 删除文件 */
  deleteFile(path: string): Promise<void>
  /** 列出目录内容 */
  listDir(path: string): Promise<string[]>
}
