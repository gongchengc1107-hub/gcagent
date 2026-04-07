/** 模型分组定义 */
export interface ModelGroup {
  label: string
  models: string[]
}

/** 所有可用模型 */
export const MODEL_GROUPS: ModelGroup[] = [
  {
    label: 'Anthropic',
    models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku']
  },
  {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini']
  },
  {
    label: 'Google',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash']
  },
  {
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder']
  },
  {
    label: 'Moonshot',
    models: ['kimi']
  },
  {
    label: 'Alibaba',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max']
  }
]

/** 获取扁平化的模型 ID 列表 */
export function getAllModelIds(): string[] {
  return MODEL_GROUPS.flatMap((g) => g.models)
}

/** 根据模型 ID 获取所属厂商 */
export function getModelProvider(modelId: string): string {
  const group = MODEL_GROUPS.find((g) => g.models.includes(modelId))
  return group?.label ?? 'Unknown'
}
