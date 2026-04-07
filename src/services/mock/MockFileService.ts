import type { IFileService } from '../interfaces'

/** 文件操作服务 Mock 实现 */
export class MockFileService implements IFileService {
  async readFile(_path: string): Promise<string> {
    return ''
  }

  async writeFile(_path: string, _content: string): Promise<void> {
    /* Mock: 空操作 */
  }

  async deleteFile(_path: string): Promise<void> {
    /* Mock: 空操作 */
  }

  async listDir(_path: string): Promise<string[]> {
    return []
  }
}
