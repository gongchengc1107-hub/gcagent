import { useState, useCallback, useEffect } from 'react'
import type { FC } from 'react'
import { Modal, Tabs } from 'antd'
import { ThunderboltOutlined, FormOutlined, AppstoreOutlined } from '@ant-design/icons'
import type { MCPConfig } from '@/types'
import type { MCPTemplate } from '@/utils/mcpTemplates'
import type { ManualPrefill } from './ManualAddTab'
import SmartInstallTab from './SmartInstallTab'
import ManualAddTab from './ManualAddTab'
import TemplatesTab from './TemplatesTab'

interface AddMCPModalProps {
  visible: boolean
  /** 非空时进入编辑模式 */
  editMcp?: MCPConfig | null
  onClose: () => void
}

/** 添加/编辑 MCP 弹窗 — 包含智能安装、手动添加、模板库三个 Tab */
const AddMCPModal: FC<AddMCPModalProps> = ({ visible, editMcp, onClose }) => {
  const [activeTab, setActiveTab] = useState('smart')
  /** 模板预填数据，选中模板后设置 */
  const [prefillData, setPrefillData] = useState<ManualPrefill | null>(null)

  /** 编辑模式时自动切换到手动添加 Tab */
  useEffect(() => {
    if (visible) {
      if (editMcp) {
        setActiveTab('manual')
        setPrefillData(null)
      } else {
        setActiveTab('smart')
        setPrefillData(null)
      }
    }
  }, [visible, editMcp])

  /** 关闭时清理状态 */
  const handleClose = useCallback(() => {
    setPrefillData(null)
    onClose()
  }, [onClose])

  /** 模板选择回调：切换到手动 Tab 并预填数据 */
  const handleSelectTemplate = useCallback((template: MCPTemplate) => {
    const data: ManualPrefill = {
      type: template.type,
      name: template.name,
      command: template.command,
      args: template.args,
      env: template.env,
      url: template.url,
      headers: template.headers,
    }
    setPrefillData(data)
    setActiveTab('manual')
  }, [])

  const tabItems = [
    {
      key: 'smart',
      label: (
        <span className="flex items-center gap-1.5">
          <ThunderboltOutlined />
          智能安装
        </span>
      ),
      children: <SmartInstallTab onClose={handleClose} />,
    },
    {
      key: 'manual',
      label: (
        <span className="flex items-center gap-1.5">
          <FormOutlined />
          手动添加
        </span>
      ),
      children: (
        <ManualAddTab editMcp={editMcp} prefillData={prefillData} onClose={handleClose} />
      ),
    },
    {
      key: 'templates',
      label: (
        <span className="flex items-center gap-1.5">
          <AppstoreOutlined />
          模板库
        </span>
      ),
      children: <TemplatesTab onSelectTemplate={handleSelectTemplate} />,
    },
  ]

  return (
    <Modal
      title={editMcp ? '编辑 MCP' : '添加 MCP'}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  )
}

export default AddMCPModal
