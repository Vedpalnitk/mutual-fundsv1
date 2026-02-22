import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminCard, AdminChip, AdminSpinner } from '@/components/admin/shared'
import { useAdminTheme } from '@/utils/adminTheme'
import {
  adminExchangeHealthApi,
  CombinedExchangeHealth,
  ExchangeHealthStatus,
} from '@/services/api/admin'

type HealthStatus = 'healthy' | 'degraded' | 'down'

const statusColors = (colors: ReturnType<typeof useAdminTheme>['colors']) => ({
  healthy: {
    bg: `${colors.success}15`,
    border: colors.success,
    text: colors.success,
    label: 'All Systems Operational',
  },
  degraded: {
    bg: `${colors.warning}15`,
    border: colors.warning,
    text: colors.warning,
    label: 'Degraded Performance',
  },
  down: {
    bg: `${colors.error}15`,
    border: colors.error,
    text: colors.error,
    label: 'Service Disruption',
  },
})

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRefreshTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function ExchangeCard({ data, colors, isDark }: { data: ExchangeHealthStatus; colors: any; isDark: boolean }) {
  const statusColor =
    data.status === 'healthy'
      ? colors.success
      : data.status === 'degraded'
        ? colors.warning
        : colors.error

  return (
    <AdminCard padding="none">
      {/* Header */}
      <div
        className="p-5 flex items-center justify-between border-b"
        style={{ borderColor: colors.chipBorder }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}08 100%)`,
              border: `1px solid ${statusColor}25`,
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: statusColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {data.exchange}
          </h3>
        </div>
        <AdminChip color={statusColor} size="sm">
          {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
        </AdminChip>
      </div>

      {/* KPI Mini-Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div
            className="p-3 rounded-xl"
            style={{
              background: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: colors.textTertiary }}
            >
              Response Time
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: colors.textPrimary }}>
              {data.avgResponseTime}ms
            </p>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              background: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: colors.textTertiary }}
            >
              Uptime 24h
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: colors.textPrimary }}>
              {data.uptime24h}%
            </p>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              background: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: colors.textTertiary }}
            >
              Orders Today
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: colors.textPrimary }}>
              {data.ordersToday}
            </p>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              background: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: colors.textTertiary }}
            >
              Failed Today
            </p>
            <p
              className="text-lg font-bold mt-1"
              style={{ color: data.failedToday > 0 ? colors.error : colors.textPrimary }}
            >
              {data.failedToday}
            </p>
          </div>
        </div>

        {/* Endpoint Status Table */}
        {data.endpoints.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${colors.chipBorder}` }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ background: `${colors.primary}08` }}>
                  <th
                    className="text-left text-[10px] font-semibold uppercase tracking-wide px-3 py-2"
                    style={{ color: colors.primary }}
                  >
                    Endpoint
                  </th>
                  <th
                    className="text-center text-[10px] font-semibold uppercase tracking-wide px-3 py-2"
                    style={{ color: colors.primary }}
                  >
                    Status
                  </th>
                  <th
                    className="text-right text-[10px] font-semibold uppercase tracking-wide px-3 py-2"
                    style={{ color: colors.primary }}
                  >
                    Avg (ms)
                  </th>
                  <th
                    className="text-right text-[10px] font-semibold uppercase tracking-wide px-3 py-2"
                    style={{ color: colors.primary }}
                  >
                    Last Checked
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.endpoints.map((ep) => {
                  const epStatus = ep.status as HealthStatus
                  return (
                    <tr
                      key={ep.name}
                      className="transition-all"
                      style={{ borderTop: `1px solid ${colors.chipBorder}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.chipBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-3 py-2">
                        <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                          {ep.name}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              background:
                                epStatus === 'healthy'
                                  ? colors.success
                                  : epStatus === 'degraded'
                                    ? colors.warning
                                    : colors.error,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>
                          {ep.avgResponseTime}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>
                          {formatTime(ep.lastChecked)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Last Successful Order */}
        <div className="mt-4 flex items-center gap-2">
          <svg
            className="w-3.5 h-3.5"
            style={{ color: colors.textTertiary }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs" style={{ color: colors.textTertiary }}>
            Last successful order:{' '}
            {data.lastSuccessfulOrder ? formatTime(data.lastSuccessfulOrder) : 'N/A'}
          </span>
        </div>
      </div>
    </AdminCard>
  )
}

const ExchangeHealthPage = () => {
  const { colors, isDark } = useAdminTheme()
  const [loading, setLoading] = useState(true)
  const [healthData, setHealthData] = useState<CombinedExchangeHealth | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchHealth = async () => {
    try {
      const result = await adminExchangeHealthApi.getCombined()
      setHealthData(result)
      setLastRefreshed(new Date())
    } catch (err) {
      // keep stale data visible
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHealth, 60000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh])

  const overallStatus = healthData?.overallStatus ?? 'healthy'
  const sc = statusColors(colors)
  const banner = sc[overallStatus]

  return (
    <AdminLayout title="Exchange Health">
      <div
        style={{
          background: colors.background,
          minHeight: '100%',
          margin: '-2rem',
          padding: '2rem',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <AdminSpinner size="lg" />
          </div>
        ) : healthData ? (
          <>
            {/* Overall Status Banner */}
            <div
              className="mb-6 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3"
              style={{
                background: banner.bg,
                border: `1px solid ${banner.border}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ background: banner.border }}
                />
                <span className="text-sm font-semibold" style={{ color: banner.text }}>
                  {banner.label}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs" style={{ color: colors.textTertiary }}>
                  Last refreshed: {formatRefreshTime(lastRefreshed)}
                </span>
                <button
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: autoRefresh ? `${colors.success}15` : colors.chipBg,
                    color: autoRefresh ? colors.success : colors.textSecondary,
                    border: `1px solid ${autoRefresh ? `${colors.success}30` : colors.chipBorder}`,
                  }}
                >
                  <svg
                    className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '3s' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                    />
                  </svg>
                  {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                </button>
                <button
                  onClick={fetchHealth}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                  style={{
                    background: colors.chipBg,
                    color: colors.primary,
                    border: `1px solid ${colors.chipBorder}`,
                  }}
                >
                  Refresh Now
                </button>
              </div>
            </div>

            {/* Exchange Cards - 2-column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExchangeCard data={healthData.bse} colors={colors} isDark={isDark} />
              <ExchangeCard data={healthData.nse} colors={colors} isDark={isDark} />
            </div>
          </>
        ) : (
          <div className="text-center py-32">
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.error}10 0%, ${colors.error}05 100%)`,
                border: `1px solid ${colors.error}15`,
              }}
            >
              <svg
                className="w-7 h-7"
                style={{ color: colors.error }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>
              Unable to load exchange health data
            </p>
            <p className="text-sm mt-2" style={{ color: colors.textTertiary }}>
              Please try refreshing the page
            </p>
            <button
              onClick={fetchHealth}
              className="mt-4 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{
                background: colors.gradientPrimary,
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default ExchangeHealthPage
