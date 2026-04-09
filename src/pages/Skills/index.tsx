import { useState, useCallback, useEffect, useMemo } from 'react'
import type { FC } from 'react'
import { Table, Switch, Button, Tag, Space, Modal, message, Skeleton } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { Skill } from '@/types'
import { useSkillStore } from '@/stores'
import { syncDiskSkills } from '@/utils/skillDiskSync'
import { deleteFromDisk } from '@/utils/skillDiskSync'
import InstallSkillModal from './components/InstallSkillModal'
import EditSkillDrawer from './components/EditSkillDrawer'

/** 标签颜色映射 */
const TAG_COLORS = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'gold', 'red']

/** 根据字符串哈希获取稳定颜色 */
function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

const SkillsPage: FC = () => {
  const { skills, toggleEnabled, removeSkill, mergeDiskSkills, isInitialized } = useSkillStore()
  const [installModalOpen, setInstallModalOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)

  /** 按 createdAt 倒序排列，最新添加的在最上面 */
  const sortedSkills = useMemo(
    () => [...skills].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [skills],
  )

  /** 磁盘 Skill 同步 — 每次进入页面静默刷新，初始化由 ServiceProvider 负责 */
  useEffect(() => {
    syncDiskSkills().then((diskSkills) => {
      if (diskSkills.length > 0) {
        mergeDiskSkills(diskSkills)
      }
    })
  }, [mergeDiskSkills])

  /** 打开编辑抽屉 */
  const handleEdit = useCallback((skill: Skill) => {
    setEditingSkill(skill)
    setEditDrawerOpen(true)
  }, [])

  /** 关闭编辑抽屉 */
  const handleEditClose = useCallback(() => {
    setEditDrawerOpen(false)
    setEditingSkill(null)
  }, [])

  /** 删除确认 */
  const handleDelete = useCallback(
    (skill: Skill) => {
      Modal.confirm({
        title: '删除 Skill',
        content: `确定要删除 "${skill.name}" 吗？此操作不可撤销。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          removeSkill(skill.id)
          await deleteFromDisk(skill.name)
          message.success(`已删除 ${skill.name}`)
        },
      })
    },
    [removeSkill]
  )

  /** 打开 Skill Hub */
  const openSkillHub = useCallback(() => {
    window.open('https://skills.netease.com', '_blank')
  }, [])

  /** 表格列定义 */
  const columns: ColumnsType<Skill> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: 160,
        render: (name: string) => (
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {name}
          </span>
        ),
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (desc: string) => (
          <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
        ),
      },
      {
        title: '标签',
        dataIndex: 'tags',
        key: 'tags',
        width: 200,
        render: (tags: string[]) => (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Tag key={tag} color={getTagColor(tag)}>
                {tag}
              </Tag>
            ))}
          </div>
        ),
      },
      {
        title: '触发词',
        dataIndex: 'triggers',
        key: 'triggers',
        width: 180,
        render: (triggers: string[]) => (
          <div className="flex flex-wrap gap-1">
            {triggers.map((t) => (
              <Tag key={t} className="text-xs">
                {t}
              </Tag>
            ))}
          </div>
        ),
      },
      {
        title: '启用',
        dataIndex: 'enabled',
        key: 'enabled',
        width: 80,
        render: (_: boolean, record: Skill) => (
          <Switch
            checked={record.enabled}
            size="small"
            onChange={() => toggleEnabled(record.id)}
          />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_: unknown, record: Skill) => (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Space>
        ),
      },
    ],
    [toggleEnabled, handleEdit, handleDelete]
  )

  return (
    <div className="flex h-full flex-col p-6">
      {/* 顶部标题与操作 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Skills 管理
        </h2>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setInstallModalOpen(true)}
          >
            创建 Skill
          </Button>
          <Button icon={<ExportOutlined />} onClick={openSkillHub}>
            Skill Hub
          </Button>
        </Space>
      </div>

      {/* 主体表格 */}
      {!isInitialized ? (
        /* 加载中骨架屏 */
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border px-4 py-3"
              style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 1, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : sortedSkills.length === 0 ? (
        /* 空状态 */
        <div
          className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <p
            className="mb-4 text-base"
            style={{ color: 'var(--text-muted)' }}
          >
            还没有安装任何 Skill
          </p>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setInstallModalOpen(true)}
            >
              创建 Skill
            </Button>
            <Button icon={<ExportOutlined />} onClick={openSkillHub}>
              Skill Hub
            </Button>
          </Space>
        </div>
      ) : (
        <Table<Skill>
          dataSource={sortedSkills}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ y: 'calc(100vh - 200px)' }}
        />
      )}

      {/* 安装弹窗 */}
      <InstallSkillModal
        open={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />

      {/* 编辑抽屉 */}
      <EditSkillDrawer
        open={editDrawerOpen}
        skill={editingSkill}
        onClose={handleEditClose}
      />
    </div>
  )
}

export default SkillsPage
