import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminCard, AdminStatCard, AdminChip, AdminSpinner, AdminTintedCard } from '@/components/admin/shared'
import { useAdminTheme } from '@/utils/adminTheme'
import { adminAdvisorsApi, AdminAdvisorDetail } from '@/services/api/admin'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

// ============= Helpers =============

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

const formatRelativeTime = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getStatusChipColor = (status: string, colors: ReturnType<typeof useAdminTheme>['colors']) => {
  switch (status) {
    case 'PENDING_KYC': return colors.warning
    case 'ACTIVE': return colors.success
    case 'INACTIVE': return colors.error
    default: return colors.textSecondary
  }
}

const getTxnTypeChipColor = (type: string, colors: ReturnType<typeof useAdminTheme>['colors']) => {
  switch (type) {
    case 'PURCHASE':
    case 'ADDITIONAL_PURCHASE': return colors.success
    case 'REDEMPTION': return colors.error
    case 'SIP': return colors.primary
    default: return colors.secondary
  }
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ============= Generate mock AUM trend =============

const generateAumTrend = (currentAum: number) => {
  const now = new Date()
  const months: string[] = []
  const values: number[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }))
  }

  // Build values working backwards from currentAum with slight random growth
  let val = currentAum
  const tempValues: number[] = [val]
  for (let i = 0; i < 11; i++) {
    const factor = 0.92 + Math.random() * 0.1 // 0.92 to 1.02 decline going backwards
    val = Math.round(val * factor)
    tempValues.push(val)
  }
  tempValues.reverse()

  return { months, values: tempValues }
}

// ============= Page Component =============

const AdvisorDetailPage = () => {
  const router = useRouter()
  const { isDark, colors } = useAdminTheme()

  const [advisor, setAdvisor] = useState<AdminAdvisorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { id } = router.query
    if (!id || typeof id !== 'string') return

    const loadAdvisor = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await adminAdvisorsApi.getOne(id)
        setAdvisor(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load advisor details')
      } finally {
        setLoading(false)
      }
    }

    loadAdvisor()
  }, [router.query])

  // Loading state
  if (loading) {
    return (
      <AdminLayout title="Advisor Detail">
        <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
          <div className="flex flex-col items-center justify-center py-24">
            <AdminSpinner size="lg" />
            <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>Loading advisor details...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Error state
  if (error || !advisor) {
    return (
      <AdminLayout title="Advisor Detail">
        <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
          <div className="text-center py-24">
            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-medium text-lg mb-2" style={{ color: colors.error }}>{error || 'Advisor not found'}</p>
            <button
              onClick={() => router.push('/admin/advisors')}
              className="mt-4 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              Back to Advisors
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const initials = getInitials(advisor.name)
  const statusColor = getStatusChipColor(advisor.isActive ? 'ACTIVE' : 'INACTIVE', colors)
  const memberSince = new Date(advisor.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const { months, values } = generateAumTrend(advisor.totalAUM)

  const chartOptions = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: months, axisLine: { lineStyle: { color: colors.textTertiary } } },
    yAxis: { type: 'value' as const, axisLine: { lineStyle: { color: colors.textTertiary } }, splitLine: { lineStyle: { color: colors.cardBorder } } },
    series: [{ type: 'line' as const, data: values, smooth: true, areaStyle: { color: `${colors.primary}20` }, lineStyle: { color: colors.primary } }],
    grid: { top: 20, right: 20, bottom: 30, left: 60 },
  }

  return (
    <AdminLayout title="Advisor Detail">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/advisors')}
          className="flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ color: colors.textSecondary }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Advisors
        </button>

        {/* Profile Header Card */}
        <AdminCard padding="lg" className="mb-6">
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: colors.gradientPrimary }}
            >
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {advisor.name}
                </h1>
                <AdminChip color={statusColor} size="sm">
                  {advisor.isActive ? 'Active' : 'Inactive'}
                </AdminChip>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {advisor.email}
                </p>
                {advisor.city && (
                  <p className="text-sm flex items-center gap-1" style={{ color: colors.textTertiary }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {advisor.city}
                  </p>
                )}
                <p className="text-sm" style={{ color: colors.textTertiary }}>
                  Member since {memberSince}
                </p>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* KPIs Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <AdminStatCard
            label="Total AUM"
            value={formatCurrency(advisor.totalAUM)}
            variant="primary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Clients"
            value={advisor.clientCount}
            variant="secondary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <AdminStatCard
            label="30d Transactions"
            value={advisor.recentTransactions.length}
            variant="success"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            }
          />
          <AdminStatCard
            label="Last Login"
            value={formatRelativeTime(advisor.lastLoginAt)}
            variant="accent"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Two-column grid: Clients + Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Client List */}
          <AdminCard padding="none">
            <div className="p-4 border-b" style={{ borderColor: colors.cardBorder }}>
              <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                Clients ({advisor.clients.length})
              </h2>
            </div>
            {advisor.clients.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm" style={{ color: colors.textTertiary }}>No clients yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: `${colors.primary}08` }}>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Name</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Email</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Status</th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>AUM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisor.clients.map((client) => {
                      const clientStatusColor = getStatusChipColor(client.status, colors)
                      return (
                        <tr
                          key={client.id}
                          className="transition-all"
                          style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = colors.chipBg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm" style={{ color: colors.textSecondary }}>{client.email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <AdminChip color={clientStatusColor} size="xs">{client.status}</AdminChip>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(client.aum)}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>

          {/* Recent Transactions */}
          <AdminCard padding="none">
            <div className="p-4 border-b" style={{ borderColor: colors.cardBorder }}>
              <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                Recent Transactions ({advisor.recentTransactions.length})
              </h2>
            </div>
            {advisor.recentTransactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm" style={{ color: colors.textTertiary }}>No recent transactions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: `${colors.primary}08` }}>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Date</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Fund</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Type</th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Amount</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisor.recentTransactions.map((txn) => {
                      const typeColor = getTxnTypeChipColor(txn.type, colors)
                      const txnStatusColor = getStatusChipColor(txn.status, colors)
                      return (
                        <tr
                          key={txn.id}
                          className="transition-all"
                          style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = colors.chipBg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm" style={{ color: colors.textSecondary }}>
                              {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium truncate block max-w-[160px]" style={{ color: colors.textPrimary }} title={txn.fundName}>
                              {txn.fundName}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <AdminChip color={typeColor} size="xs">{txn.type}</AdminChip>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(txn.amount)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <AdminChip color={txnStatusColor} size="xs">{txn.status}</AdminChip>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </div>

        {/* AUM Trend Chart */}
        <AdminCard padding="md" className="mb-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: colors.textPrimary }}>
            AUM Trend (12 Months)
          </h2>
          <ReactECharts
            option={chartOptions}
            style={{ height: 300 }}
            opts={{ renderer: 'svg' }}
          />
        </AdminCard>
      </div>
    </AdminLayout>
  )
}

export default AdvisorDetailPage
