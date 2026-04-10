import { type FC, useState, useCallback, useEffect } from 'react'
import { Skeleton } from 'antd'
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
      className="rounded p-6 space-y-4"
      style={{
        border: `1px solid var(--border-primary)`,
        backgroundColor: 'var(--bg-secondary)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarOutlined style={{ color: 'var(--success)', fontSize: 18 }} />
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
            QUOTA USAGE
          </span>
          <span
            className="rounded px-2 py-0.5 text-xs"
            style={{
              backgroundColor: 'var(--success)',
              color: '#fdfcfc'
            }}
          >
            {quota.user}
          </span>
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {quota.current.year} 年 {quota.current.month} 月
        </span>
      </div>

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>使用进度</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {Math.min(quota.current.percentage, 100).toFixed(1)}%
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div
            className="h-full rounded transition-all duration-300"
            style={{
              width: `${Math.min(quota.current.percentage, 100)}%`,
              backgroundColor: quota.current.percentage >= 90 ? 'var(--error)' : 'var(--success)'
            }}
          />
        </div>
      </div>

      {/* 统计数字 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmtCost(quota.current.used)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>已使用</div>
        </div>
        <div className="space-y-1 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmtCost(quota.current.remaining)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>剩余</div>
        </div>
        <div className="space-y-1 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {fmtCost(quota.quota.monthly)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>月度上限</div>
        </div>
      </div>

      {/* 历史记录 */}
      {quota.history.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            历史月份
          </div>
          <div className="flex flex-wrap gap-2">
            {quota.history.map((h) => (
              <span
                key={`${h.year}-${h.month}`}
                className="rounded px-2 py-1 text-xs"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid var(--border-primary)`,
                  color: 'var(--text-primary)'
                }}
              >
                {h.year}/{String(h.month).padStart(2, '0')} {fmtCost(h.used)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null

  // ── Token 使用表格 ──────────────────────────────────────

  const tokenSection = tokenUsage.length > 0 ? (
    <div
      className="rounded p-6 space-y-4"
      style={{
        border: `1px solid var(--border-primary)`,
        backgroundColor: 'var(--bg-secondary)'
      }}
    >
      <div className="flex items-center gap-2">
        <ThunderboltOutlined style={{ color: 'var(--info)', fontSize: 18 }} />
        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
          TOKEN USAGE
        </span>
      </div>

      {/* 汇总栏 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '总输入', value: fmt(tokenUsage.reduce((s, r) => s + r.inputTokens, 0)), color: 'var(--info)' },
          { label: '总输出', value: fmt(tokenUsage.reduce((s, r) => s + r.outputTokens, 0)), color: '#722ed1' },
          { label: '总费用', value: fmtCost(tokenUsage.reduce((s, r) => s + r.cost, 0)), color: 'var(--warning)' }
        ].map((item) => (
          <div key={item.label} className="space-y-1 text-center">
            <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs"
              style={{ color: 'var(--text-muted)', borderBottom: `1px solid var(--border-primary)` }}
            >
              <th className="pb-2 font-medium">模型</th>
              <th className="pb-2 text-right font-medium">输入</th>
              <th className="pb-2 text-right font-medium">输出</th>
              <th className="pb-2 text-right font-medium">缓存读取</th>
              <th className="pb-2 text-right font-medium">费用</th>
            </tr>
          </thead>
          <tbody>
            {tokenUsage.map((item) => (
              <tr
                key={item.key}
                style={{ borderBottom: `1px solid var(--border-primary)` }}
              >
                <td className="py-2 font-mono" style={{ color: 'var(--text-primary)' }}>
                  {item.key}
                </td>
                <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                  {fmt(item.inputTokens)}
                </td>
                <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                  {fmt(item.outputTokens)}
                </td>
                <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                  {fmt(item.cacheRead)}
                </td>
                <td className="py-2 text-right font-medium" style={{ color: 'var(--success)' }}>
                  {fmtCost(item.cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : null

  return (
    <section className="space-y-6">
      {/* 区块标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-bold"
            style={{
              fontSize: '16px',
              lineHeight: 1.5,
              color: 'var(--text-primary)'
            }}
          >
            USAGE STATISTICS
          </h2>
          <div
            className="mt-1 text-sm"
            style={{
              color: 'var(--text-muted)',
              lineHeight: 2.0
            }}
          >
            // 查看 token 消耗和配额使用情况
          </div>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="rounded transition-opacity duration-150 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: 2.0,
            padding: '4px 20px',
            borderRadius: '4px',
            border: `1px solid var(--border-primary)`
          }}
        >
          <ReloadOutlined spin={loading} className="mr-2" />
          刷新
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded p-6"
              style={{
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          className="flex flex-col items-center gap-3 rounded p-8"
          style={{
            border: `1px solid var(--border-primary)`,
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            加载失败：{error}
          </span>
          <button
            onClick={() => void loadData()}
            className="rounded transition-opacity duration-150"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: 2.0,
              padding: '4px 20px',
              borderRadius: '4px',
              border: `1px solid var(--border-primary)`
            }}
          >
            重试
          </button>
        </div>
      ) : (
        <>
          {quotaSection}
          {tokenSection}
          {!quota && tokenUsage.length === 0 && (
            <div
              className="flex items-center justify-center rounded p-8"
              style={{
                border: `1px solid var(--border-primary)`,
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                暂无统计数据
              </span>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default UsageStats
