import { useEffect } from 'react'
import type { FC } from 'react'
import { Drawer, Form, Input, Button, Space } from 'antd'
import type { Skill } from '@/types'
import { useSkillStore } from '@/stores'
import { saveToDisk } from '@/utils/skillDiskSync'
import TagInput from './TagInput'

interface EditSkillDrawerProps {
  open: boolean
  skill: Skill | null
  onClose: () => void
}

/** 编辑 Skill 抽屉 */
const EditSkillDrawer: FC<EditSkillDrawerProps> = ({ open, skill, onClose }) => {
  const [form] = Form.useForm()
  const { updateSkill } = useSkillStore()

  /** 打开时填充当前 Skill 数据 */
  useEffect(() => {
    if (!open || !skill) return
    form.setFieldsValue({
      name: skill.name,
      description: skill.description,
      readme: skill.readme,
      tags: skill.tags,
      triggers: skill.triggers,
    })
  }, [open, skill, form])

  /** 保存编辑 */
  const handleFinish = async (values: Record<string, unknown>) => {
    if (!skill) return
    const updates: Partial<Skill> = {
      name: values.name as string,
      description: (values.description as string) || '',
      readme: (values.readme as string) || '',
      tags: (values.tags as string[]) || [],
      triggers: values.triggers as string[],
    }
    updateSkill(skill.id, updates)
    await saveToDisk({ ...skill, ...updates, updatedAt: Date.now() })
    onClose()
  }

  return (
    <Drawer
      title="编辑 Skill"
      open={open}
      onClose={onClose}
      width={480}
      destroyOnClose
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        autoComplete="off"
        initialValues={{ tags: [], triggers: [] }}
      >
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入 Skill 名称' }]}
        >
          <Input placeholder="如：code-review" maxLength={50} />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input.TextArea placeholder="Skill 功能描述" rows={2} maxLength={200} showCount />
        </Form.Item>

        <Form.Item label="说明文档" name="readme">
          <Input.TextArea placeholder="Markdown 格式的详细说明" rows={4} />
        </Form.Item>

        <Form.Item label="标签" name="tags">
          <TagInput placeholder="输入标签后按 Enter" />
        </Form.Item>

        <Form.Item
          label="触发词"
          name="triggers"
          rules={[
            {
              validator: (_, value: string[]) =>
                value && value.length > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error('至少添加一个触发词')),
            },
          ]}
        >
          <TagInput placeholder="输入触发词后按 Enter（至少 1 个）" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default EditSkillDrawer
