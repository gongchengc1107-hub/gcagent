/**
 * ConnectionStatusBar — 连接状态提示条
 * 根据 connectionStatus 显示不同颜色的横幅提示
 * connected 时隐藏
 */
import type { FC } from 'react'
import {
  LoadingOutlined,
  DisconnectOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useChatStore } from '@/stores'
import type { ConnectionStatus } from '@/types'

/** 各状态对应的样式和文案 */
const STATUS_CONFIG: Record<
  Exclude<ConnectionStatus, 'connected'>,
  { text: string; className: string; icon: FC }
> = {
  connecting: {
    text: '正在连接 Codemaker 服务...',
    className: 'bg-blue-500/90 text-white',
    icon: LoadingOutlined
  },
  reconnecting: {
    text: '连接已断开，正在重新连接...',
    className: 'bg-amber-500/90 text-white',
    icon: ReloadOutlined
  },
  disconnected: {
    text: '无法连接 Codemaker 服务，请检查 codemaker serve 是否运行',
    className: 'bg-red-500/90 text-white',
    icon: DisconnectOutlined
  }
}

const ConnectionStatusBar: FC = () => {
  const connectionStatus = useChatStore((s) => s.connectionStatus)

  // connected 状态不显示
  if (connectionStatus === 'connected') return null

  const config = STATUS_CONFIG[connectionStatus]
  const Icon = config.icon

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium ${config.className}`}
    >
      <Icon />
      <span>{config.text}</span>
    </div>
  )
}

export default ConnectionStatusBar
