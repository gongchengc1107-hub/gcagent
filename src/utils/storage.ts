/**
 * 类型安全的本地存储工具
 * 包含 JSON 序列化和异常处理
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw) as T
    } catch {
      console.warn(`[storage] 读取 key="${key}" 失败，返回默认值`)
      return defaultValue
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`[storage] 写入 key="${key}" 失败:`, error)
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`[storage] 删除 key="${key}" 失败:`, error)
    }
  }
}
