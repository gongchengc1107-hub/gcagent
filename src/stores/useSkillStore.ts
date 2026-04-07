import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Skill } from '@/types'
import { STORAGE_KEYS } from '@/utils/storageKeys'

interface SkillState {
  skills: Skill[]
  /** 首次磁盘同步是否已完成，用于控制页面骨架屏 */
  isInitialized: boolean
  setSkills: (skills: Skill[]) => void
  addSkill: (skill: Skill) => void
  updateSkill: (id: string, updates: Partial<Skill>) => void
  removeSkill: (id: string) => void
  /** 切换 Skill 启用状态 */
  toggleEnabled: (id: string) => void
  /** 合并磁盘 Skill 数据（磁盘为权威来源，同名覆盖，新增追加） */
  mergeDiskSkills: (diskSkills: Skill[]) => void
  /** 标记初始化完成 */
  setInitialized: () => void
}

export const useSkillStore = create<SkillState>()(
  persist(
    (set) => ({
      skills: [],
      isInitialized: false,

      setSkills: (skills: Skill[]) => {
        set({ skills })
      },

      addSkill: (skill: Skill) => {
        set((state) => {
          const exists = state.skills.some((s) => s.id === skill.id || s.name === skill.name)
          if (exists) {
            return {
              skills: state.skills.map((s) =>
                s.id === skill.id || s.name === skill.name
                  ? { ...s, ...skill, updatedAt: Date.now() }
                  : s,
              ),
            }
          }
          return { skills: [...state.skills, skill] }
        })
      },

      updateSkill: (id: string, updates: Partial<Skill>) => {
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
          ),
        }))
      },

      removeSkill: (id: string) => {
        set((state) => ({
          skills: state.skills.filter((s) => s.id !== id),
        }))
      },

      toggleEnabled: (id: string) => {
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled, updatedAt: Date.now() } : s,
          ),
        }))
      },

      mergeDiskSkills: (diskSkills: Skill[]) => {
        set((state) => {
          const merged = [...state.skills]
          for (const disk of diskSkills) {
            const idx = merged.findIndex((s) => s.id === disk.id || s.name === disk.name)
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...disk }
            } else {
              merged.push(disk)
            }
          }
          return { skills: merged }
        })
      },

      setInitialized: () => set({ isInitialized: true }),
    }),
    {
      name: STORAGE_KEYS.SKILLS,
      version: 2,
      // 版本迁移：清除旧的 Mock 数据（id 以 sk-1~sk-5 开头的硬编码 skill）
      migrate: (persistedState: unknown, fromVersion: number) => {
        if (fromVersion < 2) {
          const state = persistedState as SkillState
          const MOCK_IDS = new Set(['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'])
          return { ...state, skills: state.skills.filter((s) => !MOCK_IDS.has(s.id)) }
        }
        return persistedState as SkillState
      },
    },
  ),
)
