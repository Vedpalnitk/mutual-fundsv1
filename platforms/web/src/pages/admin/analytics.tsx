import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminCard, AdminStatCard, AdminSpinner } from '@/components/admin/shared'
import { useAdminTheme } from '@/utils/adminTheme'
import {
  adminAnalyticsApi,
  AnalyticsOverview,
  AnalyticsTrend,
  AnalyticsDistribution,
} from '@/services/api/admin'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

// ============= Types =============

type TrendMetric = 'users' | 'aum' | 'transactions'
type TrendPeriod = 'daily' | 'weekly' | 'monthly'
type TrendRange = '7d' | '30d' | '90d' | '1y'

// ============= Helpers =============

const formatCurrency = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
  return `₹${val.toLocaleString('en-IN')}`
}

const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
  { value: 'users', label: 'Users' },
  { value: 'aum', label: 'AUM' },
  { value: 'transactions', label: 'Transactions' },
]

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const RANGE_OPTIONS: { value: TrendRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1y' },
]

// ============= Page Component =============

const AdminAnalytics = () => {
  const { colors, isDark } = useAdminTheme()

  // Data state
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [trends, setTrends] = useState<AnalyticsTrend[]>([])
  const [distribution, setDistribution] = useState<AnalyticsDistribution | null>(null)

  // Trend controls
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('users')
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('daily')
  const [trendRange, setTrendRange] = useState<TrendRange>('30d')

  // Loading sub-states
  const [loadingTrends, setLoadingTrends] = useState(false)

  // ============= Data Fetching =============

  const fetchOverviewAndDistribution = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewData, distributionData] = await Promise.allSettled([
        adminAnalyticsApi.getOverview(),
        adminAnalyticsApi.getDistribution(),
      ])
      if (overviewData.status === 'fulfilled') setOverview(overviewData.value)
      if (distributionData.status === 'fulfilled') setDistribution(distributionData.value)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true)
    try {
      const data = await adminAnalyticsApi.getTrends({
        metric: trendMetric,
        period: trendPeriod,
        range: trendRange,
      })
      setTrends(data)
    } catch (err) {
      console.error('Failed to load trends:', err)
      setTrends([])
    } finally {
      setLoadingTrends(false)
    }
  }, [trendMetric, trendPeriod, trendRange])

  // Load overview + distribution on mount
  useEffect(() => {
    fetchOverviewAndDistribution()
  }, [fetchOverviewAndDistribution])

  // Load trends when metric/period/range changes
  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  // ============= Chart Configs =============

  const chartColors = [
    colors.primary,
    colors.secondary,
    colors.success,
    colors.warning,
    colors.error,
    colors.accent,
  ]

  const trendChartOptions = {
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: trends.map(t => t.date),
      axisLabel: { color: colors.textTertiary, fontSize: 11 },
      axisLine: { lineStyle: { color: colors.cardBorder } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: colors.textTertiary, fontSize: 11 },
      splitLine: { lineStyle: { color: colors.cardBorder } },
    },
    series: [
      {
        type: 'line' as const,
        data: trends.map(t => t.count),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: colors.primary, width: 2 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${colors.primary}30` },
              { offset: 1, color: `${colors.primary}05` },
            ],
          },
        },
      },
    ],
    grid: { top: 20, right: 20, bottom: 30, left: 60 },
  }

  const donutOptions = (
    data: { label: string; value: number }[],
    donutColors: string[],
  ) => ({
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { color: colors.textSecondary, fontSize: 11 },
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        label: { show: false },
        data: data.map((d, i) => ({
          name: d.label,
          value: d.value,
          itemStyle: { color: donutColors[i % donutColors.length] },
        })),
      },
    ],
  })

  // ============= Render =============

  if (loading) {
    return (
      <AdminLayout title="Platform Analytics">
        <div
          className="flex items-center justify-center"
          style={{ minHeight: '60vh' }}
        >
          <AdminSpinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Platform Analytics">
      <div
        style={{
          background: colors.background,
          minHeight: '100%',
          margin: '-2rem',
          padding: '2rem',
        }}
      >
        {/* ============= KPI Grid ============= */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <AdminStatCard
            label="Total Users"
            value={overview?.totalUsers?.toLocaleString('en-IN') ?? '—'}
            change={overview ? `${overview.newUsersThisMonth} this month` : undefined}
            changeType="positive"
            variant="primary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          />

          <AdminStatCard
            label="Active Users"
            value={overview?.activeUsers?.toLocaleString('en-IN') ?? '—'}
            change={
              overview && overview.totalUsers > 0
                ? `${((overview.activeUsers / overview.totalUsers) * 100).toFixed(0)}% of total`
                : undefined
            }
            changeType="positive"
            variant="secondary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />

          <AdminStatCard
            label="Total AUM"
            value={overview ? formatCurrency(overview.totalAUM) : '—'}
            variant="success"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
              </svg>
            }
          />

          <AdminStatCard
            label="Growth Rate"
            value={overview ? `${overview.growthRate}%` : '—'}
            variant="accent"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                />
              </svg>
            }
          />

          <AdminStatCard
            label="Total Transactions"
            value={overview?.totalTransactions?.toLocaleString('en-IN') ?? '—'}
            variant="primary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            }
          />

          <AdminStatCard
            label="Total Volume"
            value={overview ? formatCurrency(overview.totalVolume) : '—'}
            variant="secondary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            }
          />
        </div>

        {/* ============= Trends Section ============= */}
        <AdminCard padding="lg" className="mb-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <h3
              className="text-[15px] font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Trends
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* Metric selector (dropdown) */}
              <select
                value={trendMetric}
                onChange={e => setTrendMetric(e.target.value as TrendMetric)}
                className="h-8 px-3 rounded-full text-xs font-semibold focus:outline-none cursor-pointer"
                style={{
                  background: colors.chipBg,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.chipBorder}`,
                }}
              >
                {METRIC_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Period pills */}
              <div className="flex items-center gap-1">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTrendPeriod(opt.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: trendPeriod === opt.value ? colors.primary : colors.chipBg,
                      color: trendPeriod === opt.value ? '#fff' : colors.textSecondary,
                      border: `1px solid ${trendPeriod === opt.value ? colors.primary : colors.chipBorder}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Range pills */}
              <div className="flex items-center gap-1">
                {RANGE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTrendRange(opt.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: trendRange === opt.value ? colors.primary : colors.chipBg,
                      color: trendRange === opt.value ? '#fff' : colors.textSecondary,
                      border: `1px solid ${trendRange === opt.value ? colors.primary : colors.chipBorder}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ minHeight: 320 }}>
            {loadingTrends ? (
              <div className="flex items-center justify-center" style={{ height: 320 }}>
                <AdminSpinner size="md" />
              </div>
            ) : trends.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: 320 }}>
                <p className="text-sm" style={{ color: colors.textTertiary }}>
                  No trend data available
                </p>
              </div>
            ) : (
              <ReactECharts
                option={trendChartOptions}
                style={{ height: 320 }}
                opts={{ renderer: 'svg' }}
                theme={isDark ? 'dark' : undefined}
              />
            )}
          </div>
        </AdminCard>

        {/* ============= Distribution Section ============= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Distribution */}
          <AdminCard padding="lg">
            <h3
              className="text-[15px] font-semibold mb-5"
              style={{ color: colors.textPrimary }}
            >
              User Distribution
            </h3>
            <div style={{ minHeight: 300 }}>
              {!distribution?.userDistribution?.length ? (
                <div className="flex items-center justify-center" style={{ height: 300 }}>
                  <p className="text-sm" style={{ color: colors.textTertiary }}>
                    No distribution data
                  </p>
                </div>
              ) : (
                <ReactECharts
                  option={donutOptions(distribution.userDistribution, chartColors)}
                  style={{ height: 300 }}
                  opts={{ renderer: 'svg' }}
                  theme={isDark ? 'dark' : undefined}
                />
              )}
            </div>
          </AdminCard>

          {/* Transaction Distribution */}
          <AdminCard padding="lg">
            <h3
              className="text-[15px] font-semibold mb-5"
              style={{ color: colors.textPrimary }}
            >
              Transaction Distribution
            </h3>
            <div style={{ minHeight: 300 }}>
              {!distribution?.transactionDistribution?.length ? (
                <div className="flex items-center justify-center" style={{ height: 300 }}>
                  <p className="text-sm" style={{ color: colors.textTertiary }}>
                    No distribution data
                  </p>
                </div>
              ) : (
                <ReactECharts
                  option={donutOptions(distribution.transactionDistribution, chartColors)}
                  style={{ height: 300 }}
                  opts={{ renderer: 'svg' }}
                  theme={isDark ? 'dark' : undefined}
                />
              )}
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminAnalytics
