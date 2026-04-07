import { useState } from 'react'
import type { FC } from 'react'
import { Modal, Tabs, Input, Button, Upload, Form, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { Skill } from '@/types'
import { useSkillStore } from '@/stores'
import { saveToDisk, syncDiskSkills, installByCommand } from '@/utils/skillDiskSync'
import TagInput from './TagInput'

interface InstallSkillModalProps {
  open: boolean
  onClose: () => void
}

/** 生成唯一 Skill ID */
function generateSkillId(): string {
  return `sk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** 解析 .md 文件的 frontmatter，提取 name/description/tags/triggers */
function parseSkillMarkdown(content: string, filename: string): Partial<Skill> {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) {
    return { name: filename.replace(/\.md$/i, ''), readme: content }
  }
  const fm = match[1]
  const readme = content.slice(match[0].length).trim()

  const get = (key: string) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return m ? m[1].trim() : ''
  }
  const getList = (key: string): string[] => {
    const m = fm.match(new RegExp(`^${key}:\\s*\\[(.*)\\]`, 'm'))
    if (!m) return []
    return m[1]
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
  }

  return {
    name: get('name') || filename.replace(/\.md$/i, ''),
    description: get('description'),
    tags: getList('tags'),
    triggers: getList('triggers'),
    readme,
  }
}

/** 安装 Skill 弹窗（命令 / 上传 / 手动填写 三个 Tab） */
const InstallSkillModal: FC<InstallSkillModalProps> = ({ open, onClose }) => {
  const { addSkill, mergeDiskSkills } = useSkillStore()

  return (
    <Modal
      title="安装 Skill"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Tabs
        items={[
          {
            key: 'command',
            label: '安装命令',
            children: (
              <CommandTab onInstalled={onClose} addSkill={addSkill} mergeDiskSkills={mergeDiskSkills} />
            ),
          },
          {
            key: 'upload',
            label: '上传文件',
            children: <UploadTab onInstalled={onClose} addSkill={addSkill} />,
          },
          {
            key: 'manual',
            label: '手动填写',
            children: <ManualTab onInstalled={onClose} addSkill={addSkill} />,
          },
        ]}
      />
    </Modal>
  )
}

/* ==================== Tab 1：安装命令 ==================== */

interface TabProps {
  onInstalled: () => void
  addSkill: (skill: Skill) => void
}

interface CommandTabProps extends TabProps {
  mergeDiskSkills: (skills: Skill[]) => void
}

const CommandTab: FC<CommandTabProps> = ({ onInstalled, mergeDiskSkills }) => {
  const [command, setCommand] = useState('')
  const [loading, setLoading] = useState(false)

  /** 执行安装命令，完成后重新从磁盘同步 */
  const handleInstall = async () => {
    if (!command.trim()) {
      message.warning('请输入安装命令')
      return
    }
    setLoading(true)
    try {
      await installByCommand(command.trim())
      const diskSkills = await syncDiskSkills()
      mergeDiskSkills(diskSkills)
      message.success('Skill 安装成功')
      onInstalled()
    } catch (e) {
      message.error(`安装失败：${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Input.TextArea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="粘贴安装命令，如：skill install prd-generate"
        rows={4}
        className="font-mono text-sm"
      />
      {command.trim() && (
        <div
          className="rounded-md p-3 text-xs font-mono"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
          }}
        >
          <div className="mb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            将执行：
          </div>
          <code>{command.trim()}</code>
        </div>
      )}
      <Button
        type="primary"
        loading={loading}
        onClick={handleInstall}
        disabled={!command.trim()}
      >
        执行安装
      </Button>
    </div>
  )
}

/* ==================== Tab 2：上传文件 ==================== */

const UploadTab: FC<TabProps> = ({ onInstalled, addSkill }) => {
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null)

  /** 真实读取上传的 .md 文件内容并解析 frontmatter */
  const handleUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = (e.target?.result as string) || ''
      const now = Date.now()
      const parsed = parseSkillMarkdown(content, file.name)
      const skill: Skill = {
        id: generateSkillId(),
        name: parsed.name || file.name.replace(/\.md$/i, ''),
        description: parsed.description || `从文件 ${file.name} 导入的 Skill`,
        readme: parsed.readme || content,
        tags: parsed.tags || [],
        triggers: parsed.triggers?.length ? parsed.triggers : [parsed.name || file.name],
        enabled: true,
        createdAt: now,
        updatedAt: now,
      }
      setPreviewSkill(skill)
    }
    reader.readAsText(file, 'utf-8')
    return false
  }

  /** 确认安装：写入 store + 写入磁盘 */
  const handleConfirm = async () => {
    if (!previewSkill) return
    try {
      addSkill(previewSkill)
      await saveToDisk(previewSkill)
      message.success('Skill 安装成功')
      setPreviewSkill(null)
      onInstalled()
    } catch (e) {
      message.error(`写入磁盘失败：${(e as Error).message}`)
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Upload.Dragger
        accept=".md"
        beforeUpload={handleUpload}
        showUploadList={false}
        maxCount={1}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽 .md 文件到此处</p>
        <p className="ant-upload-hint">仅支持 Markdown (.md) 格式</p>
      </Upload.Dragger>

      {previewSkill && (
        <div
          className="rounded-md p-4"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <h4 className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>
            预览
          </h4>
          <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div>名称：{previewSkill.name}</div>
            <div>描述：{previewSkill.description || '（无描述）'}</div>
            <div>触发词：{previewSkill.triggers.join(', ')}</div>
            {previewSkill.tags.length > 0 && <div>标签：{previewSkill.tags.join(', ')}</div>}
          </div>
          <Button type="primary" className="mt-3" onClick={handleConfirm}>
            确认安装
          </Button>
        </div>
      )}
    </div>
  )
}

/* ==================== Tab 3：手动填写 ==================== */

const ManualTab: FC<TabProps> = ({ onInstalled, addSkill }) => {
  const [form] = Form.useForm()

  /** 提交手动填写表单，写入 store + 磁盘 */
  const handleFinish = async (values: Record<string, unknown>) => {
    const now = Date.now()
    const newSkill: Skill = {
      id: generateSkillId(),
      name: values.name as string,
      description: (values.description as string) || '',
      readme: (values.readme as string) || '',
      tags: (values.tags as string[]) || [],
      triggers: values.triggers as string[],
      enabled: true,
      createdAt: now,
      updatedAt: now,
    }
    try {
      addSkill(newSkill)
      await saveToDisk(newSkill)
      message.success('Skill 创建成功')
      form.resetFields()
      onInstalled()
    } catch (e) {
      message.error(`写入磁盘失败：${(e as Error).message}`)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="pt-2"
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

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          创建 Skill
        </Button>
      </Form.Item>
    </Form>
  )
}

export default InstallSkillModal
