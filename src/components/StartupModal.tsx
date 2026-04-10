import { type FC, useState } from 'react'
import { Modal, Button } from 'antd'
import { CloudOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useSettingsStore } from '@/stores'
import type { ProviderSettingMode } from '@/types'

interface StartupModalProps {
  onEnter: () => void
}

/**
 * 启动弹窗
 * 打开 app 时显示，让用户选择进入 Codemaker 模式或直连模式
 */
const StartupModal: FC<StartupModalProps> = ({ onEnter }) => {
  const { setProviderSettingMode } = useSettingsStore()
  const [visible, setVisible] = useState(true)

  /** 选择模式并进入 app */
  const handleSelectMode = (mode: ProviderSettingMode) => {
    setProviderSettingMode(mode)
    setVisible(false)
    onEnter()
  }

  return (
    <Modal
      open={visible}
      closable={false}
      maskClosable={false}
      footer={null}
      centered
      width={480}
    >
      <div className="py-6 text-center">
        {/* 标题 */}
        <h2 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          欢迎使用 Codemaker
        </h2>
        <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          请选择您要使用的模式
        </p>

        {/* 模式选择卡片 */}
        <div className="flex gap-4">
          {/* Codemaker 模式 */}
          <button
            onClick={() => handleSelectMode('codemaker')}
            className="flex flex-1 flex-col items-center rounded-xl border-2 p-6 transition-all hover:border-[#10a37f] hover:shadow-md"
            style={{
              borderColor: 'var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <CloudOutlined className="mb-3 text-4xl" style={{ color: '#10a37f' }} />
            <h3 className="mb-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Codemaker
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              使用本地服务，开箱即用
            </p>
          </button>

          {/* 直连模式 */}
          <button
            onClick={() => handleSelectMode('direct')}
            className="flex flex-1 flex-col items-center rounded-xl border-2 p-6 transition-all hover:border-[#1677ff] hover:shadow-md"
            style={{
              borderColor: 'var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <ThunderboltOutlined className="mb-3 text-4xl" style={{ color: '#1677ff' }} />
            <h3 className="mb-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              直连模式
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              连接外部 AI 服务，自定义模型
            </p>
          </button>
        </div>

        {/* 底部提示 */}
        <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          您可以在设置中随时切换模式
        </p>
      </div>
    </Modal>
  )
}

export default StartupModal
