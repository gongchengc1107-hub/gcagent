import type { Skill } from '../types'

/** 通过 Electron IPC 调用主进程文件系统操作 */
async function ipcInvoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  if (!window.electronAPI?.invoke) {
    throw new Error('Electron IPC 不可用（非 Electron 环境或 preload 未加载）')
  }
  return window.electronAPI.invoke(channel, ...args) as Promise<T>
}

/** 构造 skill .md 文件内容（frontmatter + readme） */
function buildSkillMarkdown(skill: Skill): string {
  const desc = skill.description.replace(/\n/g, ' ')
  const frontmatter = [
    '---',
    `name: ${skill.name}`,
    `description: ${desc}`,
    `tags: [${skill.tags.map((t) => `"${t}"`).join(', ')}]`,
    `triggers: [${skill.triggers.map((t) => `"${t}"`).join(', ')}]`,
    `enabled: ${skill.enabled}`,
    '---',
    '',
  ].join('\n')
  return frontmatter + (skill.readme || '')
}

/** 主进程返回的原始磁盘 skill 数据 */
interface RawDiskSkill {
  id: string
  name: string
  description: string
  readme: string
  tags: string[]
  triggers: string[]
  enabled: boolean
  filePath: string
  createdAt: number
  updatedAt: number
}

/** 从磁盘读取所有 skill，返回 Skill 数组 */
export async function syncDiskSkills(): Promise<Skill[]> {
  try {
    const raw = await ipcInvoke<RawDiskSkill[]>('skill:list')
    const now = Date.now()
    return raw.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      readme: item.readme,
      tags: item.tags ?? [],
      triggers: item.triggers ?? [item.name],
      enabled: item.enabled ?? true,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    }))
  } catch {
    return []
  }
}

/** 将 skill 写入磁盘 */
export async function saveToDisk(skill: Skill): Promise<void> {
  const content = buildSkillMarkdown(skill)
  await ipcInvoke<string>('skill:write', skill.name, content)
}

/** 从磁盘删除 skill 文件（传入 skill name） */
export async function deleteFromDisk(skillName: string): Promise<void> {
  await ipcInvoke<boolean>('skill:delete', skillName)
}

/** 通过命令安装 skill（调用 codemaker skill install） */
export async function installByCommand(
  command: string,
): Promise<{ success: boolean; output: string }> {
  return ipcInvoke<{ success: boolean; output: string }>('skill:install-by-command', command)
}
