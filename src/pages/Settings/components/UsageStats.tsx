import { type FC, useState, useCallback, useEffect } from 'react'
import { Button, Skeleton, Progress, Table, Tag } from 'antd'
import {
  ReloadOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  BarChartOutlined
} from '@ant-design/icons'

// ─── 类型 ─────────────────────────────────────────────────

interface QuotaData {
  user: string
  active: boolean
  quota: { monthly: number; reset_day: number }
  current: {
    year: number
    month: number
    used: number
    remaining: number
    percentage: number
    over: number
  }
  history: { year: number; month: number; used: number }[]
}

interface TokenUsageItem {
  key: string        // model ID
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cacheRead: number
  cacheWrite: number
  cost: number
}

// ─── 工具函数 ──────────────────────────────────────────────

function fmt(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(Math.round(num))
}

function fmtCost(n: number): string {
  return `¥ ${n.toFixed(2)}`
}

// ─── 主组件 ───────────────────────────────────────────────

const UsageStats: FC = () => {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [tokenUsage, setTokenUsage] = useState<TokenUsageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [quotaResult, tokenResult] = await Promise.all([
        window.electronAPI.invoke('stats:quota') as Promise<QuotaData | null>,
        window.electronAPI.invoke('stats:tokenUsage', []) as Promise<TokenUsageItem[] | null>
      ])
      setQuota(quotaResult)
      setTokenUsage(Array.isArray(tokenResult) ? tokenResult : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // ── 配额卡片 ────────────────────────────────────────────

  const quotaSection = quota ? (
    <div
      className="rounded-lg border p-6 space-y-4"
      style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarOutlined style={{ color: '#10a37f', fontSize: 18 }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            本月配额使用
          </span>
          <Tag color="green">{quota.user}</Tag>
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {quota.current.year} 年 {quota.current.month} 月
        </span>
      </div>

      <Progress
        percent={Math.min(quota.current.percentage, 100)}
        strokeColor={quota.current.percentage >= 90 ? '#ff4d4f' : '#10a37f'}
        trailColor="var(--bg-tertiary)"
        format={(p) => `${p?.toFixed(1)}%`}
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmtCost(quota.current.used)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>已使用</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmtCost(quota.current.remaining)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>剩余</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmtCost(quota.quota.monthly)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>月度上限</div>
        </div>
      </div>

      {/* 历史记录 */}
      {quota.history.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            历史月份
          </div>
          <div className="flex flex-wrap gap-2">
            {quota.history.map((h) => (
              <Tag key={`${h.year}-${h.month}`} style={{ fontSize: 12 }}>
                {h.year}/{String(h.month).padStart(2, '0')}
                &nbsp;
                {fmtCost(h.used)}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null

  // ── Token 使用表格 ──────────────────────────────────────

  const columns = [
    {
      title: '模型',
      dataIndex: 'key',
      key: 'key',
      render: (v: string) => (
        <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{v}</span>
      )
    },
    {
      title: '输入 Tokens',
      dataIndex: 'inputTokens',
      key: 'inputTokens',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: 'var(--text-secondary)' }}>{fmt(v)}</span>
    },
    {
      title: '输出 Tokens',
      dataIndex: 'outputTokens',
      key: 'outputTokens',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: 'var(--text-secondary)' }}>{fmt(v)}</span>
    },
    {
      title: '缓存读取',
      dataIndex: 'cacheRead',
      key: 'cacheRead',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: 'var(--text-secondary)' }}>{fmt(v)}</span>
    },
    {
      title: '费用',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (v: number) => (
        <span className="font-medium" style={{ color: '#10a37f' }}>{fmtCost(v)}</span>
      )
    }
  ]

  const totalCost = tokenUsage.reduce((s, r) => s + r.cost, 0)
  const totalInput = tokenUsage.reduce((s, r) => s + r.inputTokens, 0)
  const totalOutput = tokenUsage.reduce((s, r) => s + r.outputTokens, 0)

  const tokenSection = tokenUsage.length > 0 ? (
    <div
      className="rounded-lg border p-6 space-y-4"
      style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex items-center gap-2">
        <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 18 }} />
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Token 使用详情（全部时间）
        </span>
      </div>

      {/* 汇总栏 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '总输入', value: fmt(totalInput), color: '#1677ff' },
          { label: '总输出', value: fmt(totalOutput), color: '#722ed1' },
          { label: '总费用', value: fmtCost(totalCost), color: '#fa8c16' }
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <Table
        dataSource={tokenUsage}
        columns={columns}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ x: true }}
        style={{ fontSize: 12 }}
      />
    </div>
  ) : null

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          <BarChartOutlined className="mr-2" />
          消耗统计
        </h2>
        <Button
          icon={<ReloadOutlined />}
          size="small"
          loading={loading}
          onClick={() => void loadData()}
        >
          刷新
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border p-6"
              style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          className="flex flex-col items-center gap-3 rounded-lg border p-8"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            加载失败：{error}
          </span>
          <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>重试</Button>
        </div>
      ) : (
        <>
          {quotaSection}
          {tokenSection}
          {!quota && !tokenSection && (
            <div
              className="flex items-center justify-center rounded-lg border p-8"
              style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                暂无统计数据
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default UsageStats
