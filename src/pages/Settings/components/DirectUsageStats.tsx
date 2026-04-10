import { type FC, useState, useCallback, useMemo } from 'react'
import { Button, Table, Tag, Empty, Modal } from 'antd'
import {
  ReloadOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { useSettingsStore } from '@/stores'
import type { DirectUsageRecord } from '@/services/directProvider'

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function fmt(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(Math.round(num))
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 从 provider URL 提取简短标识 */
function shortProvider(url: string): string {
  try {
    const host = new URL(url).hostname
    return host.replace('api.', '').split('.')[0]
  } catch {
    return url.slice(0, 20)
  }
}

// ─── 主组件 ────────────────────────────────────────────────────────────────────

const DirectUsageStats: FC = () => {
  const directUsageRecords = useSettingsStore((s) => s.directUsageRecords)
  const clearDirectUsageRecords = useSettingsStore((s) => s.clearDirectUsageRecords)

  const [confirmClear, setConfirmClear] = useState(false)

  const handleClear = useCallback(() => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有直连模式的消耗统计吗？',
      okText: '清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => clearDirectUsageRecords()
    })
  }, [clearDirectUsageRecords])

  // ── 按模型聚合 ──────────────────────────────────────────────────────────────

  const aggregated = useMemo(() => {
    const map = new Map<string, { modelId: string; provider: string; promptTokens: number; completionTokens: number; totalTokens: number; count: number }>()
    for (const r of directUsageRecords) {
      const key = `${r.provider}::${r.modelId}`
      const existing = map.get(key)
      if (existing) {
        existing.promptTokens += r.promptTokens
        existing.completionTokens += r.completionTokens
        existing.totalTokens += r.totalTokens
        existing.count += 1
      } else {
        map.set(key, {
          modelId: r.modelId,
          provider: shortProvider(r.provider),
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
          totalTokens: r.totalTokens,
          count: 1
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalTokens - a.totalTokens)
  }, [directUsageRecords])

  // ── 汇总 ────────────────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const totalPrompt = directUsageRecords.reduce((s, r) => s + r.promptTokens, 0)
    const totalCompletion = directUsageRecords.reduce((s, r) => s + r.completionTokens, 0)
    const totalAll = directUsageRecords.reduce((s, r) => s + r.totalTokens, 0)
    return { totalPrompt, totalCompletion, totalAll, count: directUsageRecords.length }
  }, [directUsageRecords])

  // ── 表格列 ──────────────────────────────────────────────────────────────────

  const columns = [
    {
      title: '模型',
      dataIndex: 'modelId',
      key: 'modelId',
      render: (v: string) => (
        <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{v}</span>
      )
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      align: 'center' as const,
      render: (v: string) => <Tag color="blue">{v}</Tag>
    },
    {
      title: '请求次数',
      dataIndex: 'count',
      key: 'count',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
    },
    {
      title: '输入 Tokens',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: 'var(--text-secondary)' }}>{fmt(v)}</span>
    },
    {
      title: '输出 Tokens',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: 'var(--text-secondary)' }}>{fmt(v)}</span>
    },
    {
      title: '总计 Tokens',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.totalTokens - b.totalTokens,
      defaultSortOrder: 'descend' as const,
      render: (v: number) => (
        <span className="font-medium" style={{ color: '#1677ff' }}>{fmt(v)}</span>
      )
    }
  ]

  // ── 渲染 ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          <BarChartOutlined className="mr-2" />
          消耗统计（直连模式）
        </h2>
        <div className="flex items-center gap-2">
          <Button
            danger
            ghost
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleClear}
            disabled={directUsageRecords.length === 0}
          >
            清空
          </Button>
          <Button
            icon={<ReloadOutlined />}
            size="small"
          >
            已自动刷新
          </Button>
        </div>
      </div>

      {aggregated.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border p-8"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <Empty
            description="暂无直连模式消耗统计，使用直连模式对话后将自动记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div
          className="rounded-lg border p-6 space-y-4"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2">
            <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Token 使用汇总
            </span>
          </div>

          {/* 汇总栏 */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '总输入', value: fmt(totals.totalPrompt), color: '#1677ff' },
              { label: '总输出', value: fmt(totals.totalCompletion), color: '#722ed1' },
              { label: '总请求', value: String(totals.count), color: '#fa8c16' }
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <Table
            dataSource={aggregated}
            columns={columns}
            rowKey={(r) => `${r.provider}::${r.modelId}`}
            size="small"
            pagination={false}
            scroll={{ x: true }}
            style={{ fontSize: 12 }}
          />
        </div>
      )}
    </div>
  )
}

export default DirectUsageStats
