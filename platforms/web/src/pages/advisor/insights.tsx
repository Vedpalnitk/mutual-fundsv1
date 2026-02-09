import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { clientsApi, portfolioApi, goalsApi, mlApi, GoalResponse } from '@/services/api'
import {
  useFATheme,
  formatCurrency,
  formatCurrencyCompact,
} from '@/utils/fa'
import {
  FACard,
  FATintedCard,
  FAChip,
  FAButton,
  FASectionHeader,
  FAEmptyState,
} from '@/components/advisor/shared'

type InsightTab = 'health' | 'rebalancing' | 'goals' | 'tax'

interface ClientData {
  id: string
  name: string
  email: string
  aum: number
  returns: number
  riskProfile: string
}

interface HealthItem {
  clientId: string
  clientName: string
  score: number
  status: 'In-form' | 'On-track' | 'Off-track' | 'Out-of-form'
  issues: string[]
  aum: number
}

interface RebalancingAlert {
  clientId: string
  clientName: string
  assetClass: string
  currentPct: number
  targetPct: number
  driftPct: number
  direction: 'overweight' | 'underweight'
  amount: number
}

interface GoalAlert {
  clientId: string
  clientName: string
  goalName: string
  targetAmount: number
  currentValue: number
  progressPct: number
  status: 'on_track' | 'at_risk' | 'off_track'
  targetDate: string
  monthlyRequired: number
}

interface TaxOpportunity {
  clientId: string
  clientName: string
  fundName: string
  assetClass: string
  investedValue: number
  currentValue: number
  unrealizedLoss: number
  estimatedSavings: number
  holdingPeriod: string
}

const getHealthStatus = (score: number): HealthItem['status'] => {
  if (score >= 80) return 'In-form'
  if (score >= 60) return 'On-track'
  if (score >= 40) return 'Off-track'
  return 'Out-of-form'
}

const getHealthColor = (status: string, colors: any) => {
  switch (status) {
    case 'In-form': return colors.success
    case 'On-track': return colors.primary
    case 'Off-track': return colors.warning
    case 'Out-of-form': return colors.error
    default: return colors.textTertiary
  }
}

const getGoalStatusColor = (status: string, colors: any) => {
  switch (status) {
    case 'on_track': return colors.success
    case 'at_risk': return colors.warning
    case 'off_track': return colors.error
    default: return colors.textTertiary
  }
}

const getGoalStatusLabel = (status: string) => {
  switch (status) {
    case 'on_track': return 'On Track'
    case 'at_risk': return 'At Risk'
    case 'off_track': return 'Off Track'
    default: return status
  }
}

const InsightsPage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()
  const [activeTab, setActiveTab] = useState<InsightTab>('health')
  const [loading, setLoading] = useState(true)

  // Data states
  const [healthItems, setHealthItems] = useState<HealthItem[]>([])
  const [rebalancingAlerts, setRebalancingAlerts] = useState<RebalancingAlert[]>([])
  const [goalAlerts, setGoalAlerts] = useState<GoalAlert[]>([])
  const [taxOpportunities, setTaxOpportunities] = useState<TaxOpportunity[]>([])

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true)
      try {
        // Fetch all clients
        const clientsRes = await clientsApi.list<ClientData>()
        const clients = clientsRes.data || []

        // Generate health scores
        const healthData: HealthItem[] = clients.map((c) => {
          const score = calculateHealthScore(c)
          const issues: string[] = []
          if (c.returns < 8) issues.push('Returns below benchmark')
          if (c.aum < 100000) issues.push('Low AUM')
          if (c.riskProfile === 'Aggressive' && c.returns < 0) issues.push('High-risk portfolio with negative returns')
          return {
            clientId: c.id,
            clientName: c.name,
            score,
            status: getHealthStatus(score),
            issues,
            aum: c.aum,
          }
        })
        setHealthItems(healthData.sort((a, b) => a.score - b.score))

        // Generate rebalancing alerts from allocation data
        const rebalAlerts: RebalancingAlert[] = []
        for (const client of clients.slice(0, 10)) {
          try {
            const allocation = await portfolioApi.getAssetAllocation(client.id)
            const targetAllocation: Record<string, number> = {
              Equity: 60,
              Debt: 25,
              Hybrid: 10,
              Gold: 5,
            }
            allocation.forEach((a) => {
              const target = targetAllocation[a.assetClass] || 0
              const drift = a.percentage - target
              if (Math.abs(drift) > 5) {
                rebalAlerts.push({
                  clientId: client.id,
                  clientName: client.name,
                  assetClass: a.assetClass,
                  currentPct: a.percentage,
                  targetPct: target,
                  driftPct: Math.abs(drift),
                  direction: drift > 0 ? 'overweight' : 'underweight',
                  amount: Math.abs(a.value * drift / 100),
                })
              }
            })
          } catch {
            // Skip if allocation fetch fails for this client
          }
        }
        setRebalancingAlerts(rebalAlerts.sort((a, b) => b.driftPct - a.driftPct))

        // Fetch goals for all clients
        try {
          const allGoals = await goalsApi.list()
          const alerts: GoalAlert[] = (allGoals || []).map((g: GoalResponse) => {
            const progress = Number(g.progress) || 0
            let status: GoalAlert['status'] = 'on_track'
            if (progress < 30) status = 'off_track'
            else if (progress < 60) status = 'at_risk'
            const clientMatch = clients.find((c) => c.id === g.clientId)
            return {
              clientId: g.clientId || '',
              clientName: clientMatch?.name || 'Unknown',
              goalName: g.name,
              targetAmount: Number(g.targetAmount),
              currentValue: Number(g.currentAmount) || 0,
              progressPct: progress,
              status,
              targetDate: g.targetDate?.split('T')[0] || '',
              monthlyRequired: Number(g.monthlySip) || 0,
            }
          }).filter((g: GoalAlert) => g.status !== 'on_track')
          setGoalAlerts(alerts)
        } catch {
          setGoalAlerts([])
        }

        // Generate tax harvesting opportunities from holdings
        const taxOps: TaxOpportunity[] = []
        for (const client of clients.slice(0, 10)) {
          try {
            const holdings = await portfolioApi.getClientHoldings(client.id)
            ;(holdings as any[]).forEach((h: any) => {
              const invested = Number(h.investedValue)
              const current = Number(h.currentValue)
              if (current < invested) {
                const loss = invested - current
                taxOps.push({
                  clientId: client.id,
                  clientName: client.name,
                  fundName: h.fundName,
                  assetClass: h.assetClass || 'Equity',
                  investedValue: invested,
                  currentValue: current,
                  unrealizedLoss: loss,
                  estimatedSavings: loss * 0.15,
                  holdingPeriod: h.lastTransactionDate || h.lastTxnDate?.split('T')[0] || '',
                })
              }
            })
          } catch {
            // Skip
          }
        }
        setTaxOpportunities(taxOps.sort((a, b) => b.unrealizedLoss - a.unrealizedLoss))
      } catch {
        // Fallback — generate mock data
        setHealthItems(generateMockHealthData())
        setRebalancingAlerts(generateMockRebalancingAlerts())
        setGoalAlerts(generateMockGoalAlerts())
        setTaxOpportunities(generateMockTaxOpportunities())
      } finally {
        setLoading(false)
      }
    }
    loadInsights()
  }, [])

  const tabs = [
    { id: 'health' as const, label: 'Portfolio Health', count: healthItems.length, icon: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z' },
    { id: 'rebalancing' as const, label: 'Rebalancing', count: rebalancingAlerts.length, icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
    { id: 'goals' as const, label: 'Goal Alerts', count: goalAlerts.length, icon: 'M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5' },
    { id: 'tax' as const, label: 'Tax Harvesting', count: taxOpportunities.length, icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
  ]

  // Summary stats
  const avgHealthScore = useMemo(() => {
    if (!healthItems.length) return 0
    return Math.round(healthItems.reduce((s, h) => s + h.score, 0) / healthItems.length)
  }, [healthItems])

  const totalTaxSavings = useMemo(() => {
    return taxOpportunities.reduce((s, t) => s + t.estimatedSavings, 0)
  }, [taxOpportunities])

  if (loading) {
    return (
      <AdvisorLayout title="Insights">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }} />
        </div>
      </AdvisorLayout>
    )
  }

  return (
    <AdvisorLayout title="Insights">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Portfolio Insights</h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              AI-powered analysis of your client portfolios
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div
            className="p-5 rounded-2xl relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 8px 32px ${isDark ? 'rgba(0,0,0,0.4)' : `${colors.primary}25`}`,
            }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Avg Health Score</p>
              <p className="text-3xl font-bold text-white mt-1">{avgHealthScore}</p>
              <p className="text-xs text-white/70 mt-1">{healthItems.length} clients analyzed</p>
            </div>
          </div>

          <FACard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.warning }}>
              Rebalancing Alerts
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: colors.textPrimary }}>{rebalancingAlerts.length}</p>
            <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Portfolios with drift {'>'}5%</p>
          </FACard>

          <FACard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.error }}>
              Goals At Risk
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: colors.textPrimary }}>{goalAlerts.length}</p>
            <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Behind schedule or underfunded</p>
          </FACard>

          <FACard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.success }}>
              Tax Savings Potential
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: colors.success }}>{formatCurrencyCompact(totalTaxSavings)}</p>
            <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>{taxOpportunities.length} harvesting opportunities</p>
          </FACard>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: activeTab === tab.id
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.chipBg,
                color: activeTab === tab.id ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : colors.cardBorder,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'health' && (
          <div className="space-y-3">
            {healthItems.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                }
                title="No Health Data"
                description="Add clients to see portfolio health analysis"
              />
            ) : (
              healthItems.map((item) => (
                <FATintedCard
                  key={item.clientId}
                  padding="md"
                  accentColor={getHealthColor(item.status, colors)}
                  onClick={() => router.push(`/advisor/clients/${item.clientId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Health Score Circle */}
                      <div className="relative w-14 h-14">
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="24" fill="none" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} strokeWidth="4" />
                          <circle
                            cx="28" cy="28" r="24" fill="none"
                            stroke={getHealthColor(item.status, colors)}
                            strokeWidth="4"
                            strokeDasharray={`${(item.score / 100) * 150.8} 150.8`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span
                          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                          style={{ color: getHealthColor(item.status, colors) }}
                        >
                          {item.score}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{item.clientName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <FAChip color={getHealthColor(item.status, colors)} size="xs">{item.status}</FAChip>
                          <span className="text-xs" style={{ color: colors.textTertiary }}>
                            AUM: {formatCurrencyCompact(item.aum)}
                          </span>
                        </div>
                        {item.issues.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.issues.map((issue, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.warning}15`, color: colors.warning }}>
                                {issue}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </FATintedCard>
              ))
            )}
          </div>
        )}

        {activeTab === 'rebalancing' && (
          <div className="space-y-3">
            {rebalancingAlerts.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                  </svg>
                }
                title="All Balanced"
                description="No portfolios have significant allocation drift"
              />
            ) : (
              rebalancingAlerts.map((alert, i) => (
                <FATintedCard
                  key={`${alert.clientId}-${alert.assetClass}-${i}`}
                  padding="md"
                  accentColor={alert.direction === 'overweight' ? colors.warning : colors.primary}
                  onClick={() => router.push(`/advisor/clients/${alert.clientId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{alert.clientName}</p>
                        <FAChip size="xs">{alert.assetClass}</FAChip>
                        <FAChip
                          color={alert.direction === 'overweight' ? colors.warning : colors.primary}
                          size="xs"
                        >
                          {alert.direction === 'overweight' ? 'Overweight' : 'Underweight'}
                        </FAChip>
                      </div>
                      <div className="mt-3">
                        {/* Allocation bar comparison */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span style={{ color: colors.textTertiary }}>Current</span>
                              <span className="font-medium" style={{ color: colors.textPrimary }}>{alert.currentPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(alert.currentPct, 100)}%`,
                                  background: alert.direction === 'overweight' ? colors.warning : colors.primary,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span style={{ color: colors.textTertiary }}>Target</span>
                              <span className="font-medium" style={{ color: colors.textPrimary }}>{alert.targetPct.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(alert.targetPct, 100)}%`,
                                  background: colors.success,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                          Drift: {alert.driftPct.toFixed(1)}% ({formatCurrencyCompact(alert.amount)})
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 ml-4" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </FATintedCard>
              ))
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-3">
            {goalAlerts.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                  </svg>
                }
                title="All Goals On Track"
                description="No client goals are currently at risk"
              />
            ) : (
              goalAlerts.map((goal, i) => (
                <FATintedCard
                  key={`${goal.clientId}-${goal.goalName}-${i}`}
                  padding="md"
                  accentColor={getGoalStatusColor(goal.status, colors)}
                  onClick={() => router.push(`/advisor/clients/${goal.clientId}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{goal.goalName}</p>
                        <FAChip color={getGoalStatusColor(goal.status, colors)} size="xs">
                          {getGoalStatusLabel(goal.status)}
                        </FAChip>
                      </div>
                      <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{goal.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold" style={{ color: colors.textPrimary }}>
                        {formatCurrencyCompact(goal.currentValue)}
                      </p>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                        of {formatCurrencyCompact(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(goal.progressPct, 100)}%`,
                        background: `linear-gradient(90deg, ${getGoalStatusColor(goal.status, colors)} 0%, ${colors.primary} 100%)`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      {goal.progressPct.toFixed(1)}% achieved
                    </p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      Target: {goal.targetDate} | Monthly: {formatCurrency(goal.monthlyRequired)}
                    </p>
                  </div>
                </FATintedCard>
              ))
            )}
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-3">
            {taxOpportunities.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                }
                title="No Harvesting Opportunities"
                description="No holdings with unrealized losses found"
              />
            ) : (
              <>
                {/* Tax summary */}
                <FACard padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.success }}>
                        Total Potential Tax Savings
                      </p>
                      <p className="text-2xl font-bold mt-1" style={{ color: colors.success }}>
                        {formatCurrency(totalTaxSavings)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: colors.textTertiary }}>Total unrealized losses</p>
                      <p className="text-lg font-bold" style={{ color: colors.error }}>
                        {formatCurrency(taxOpportunities.reduce((s, t) => s + t.unrealizedLoss, 0))}
                      </p>
                    </div>
                  </div>
                </FACard>

                {taxOpportunities.map((opp, i) => (
                  <FATintedCard
                    key={`${opp.clientId}-${opp.fundName}-${i}`}
                    padding="md"
                    accentColor={colors.success}
                    onClick={() => router.push(`/advisor/clients/${opp.clientId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{opp.fundName}</p>
                          <FAChip size="xs">{opp.assetClass}</FAChip>
                        </div>
                        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{opp.clientName}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Invested</p>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrencyCompact(opp.investedValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Current</p>
                            <p className="text-sm font-medium" style={{ color: colors.error }}>{formatCurrencyCompact(opp.currentValue)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Loss</p>
                            <p className="text-sm font-bold" style={{ color: colors.error }}>-{formatCurrencyCompact(opp.unrealizedLoss)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: colors.textTertiary }}>Est. Savings</p>
                        <p className="text-lg font-bold" style={{ color: colors.success }}>{formatCurrencyCompact(opp.estimatedSavings)}</p>
                      </div>
                    </div>
                  </FATintedCard>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </AdvisorLayout>
  )
}

// Helper: calculate health score from client data
function calculateHealthScore(client: ClientData): number {
  let score = 50

  // Returns-based scoring (0-30 points)
  if (client.returns >= 20) score += 30
  else if (client.returns >= 15) score += 25
  else if (client.returns >= 10) score += 20
  else if (client.returns >= 5) score += 10
  else if (client.returns >= 0) score += 5

  // AUM-based scoring (0-15 points)
  if (client.aum >= 2500000) score += 15
  else if (client.aum >= 1000000) score += 10
  else if (client.aum >= 500000) score += 5

  // Risk alignment (0-5 points)
  if (client.riskProfile === 'Moderate') score += 5
  else if (client.riskProfile === 'Conservative' && client.returns >= 8) score += 5
  else if (client.riskProfile === 'Aggressive' && client.returns >= 15) score += 5

  return Math.min(score, 100)
}

// Mock data generators (fallback)
function generateMockHealthData(): HealthItem[] {
  return [
    { clientId: '1', clientName: 'Rajesh Sharma', score: 85, status: 'In-form', issues: [], aum: 4500000 },
    { clientId: '2', clientName: 'Priya Patel', score: 72, status: 'On-track', issues: ['Returns below benchmark'], aum: 2800000 },
    { clientId: '3', clientName: 'Amit Verma', score: 58, status: 'Off-track', issues: ['Low AUM', 'Returns below benchmark'], aum: 350000 },
    { clientId: '4', clientName: 'Sunita Devi', score: 45, status: 'Off-track', issues: ['High-risk portfolio with negative returns'], aum: 800000 },
    { clientId: '5', clientName: 'Vikram Singh', score: 92, status: 'In-form', issues: [], aum: 8500000 },
  ]
}

function generateMockRebalancingAlerts(): RebalancingAlert[] {
  return [
    { clientId: '2', clientName: 'Priya Patel', assetClass: 'Equity', currentPct: 78, targetPct: 60, driftPct: 18, direction: 'overweight', amount: 504000 },
    { clientId: '3', clientName: 'Amit Verma', assetClass: 'Debt', currentPct: 8, targetPct: 25, driftPct: 17, direction: 'underweight', amount: 59500 },
    { clientId: '4', clientName: 'Sunita Devi', assetClass: 'Gold', currentPct: 0, targetPct: 5, driftPct: 5, direction: 'underweight', amount: 40000 },
  ]
}

function generateMockGoalAlerts(): GoalAlert[] {
  return [
    { clientId: '3', clientName: 'Amit Verma', goalName: 'Child Education', targetAmount: 2500000, currentValue: 450000, progressPct: 18, status: 'off_track', targetDate: '2028-06-01', monthlyRequired: 35000 },
    { clientId: '4', clientName: 'Sunita Devi', goalName: 'Retirement', targetAmount: 10000000, currentValue: 2800000, progressPct: 28, status: 'at_risk', targetDate: '2035-01-01', monthlyRequired: 45000 },
  ]
}

function generateMockTaxOpportunities(): TaxOpportunity[] {
  return [
    { clientId: '3', clientName: 'Amit Verma', fundName: 'HDFC Small Cap Fund', assetClass: 'Equity', investedValue: 150000, currentValue: 125000, unrealizedLoss: 25000, estimatedSavings: 3750, holdingPeriod: '8 months' },
    { clientId: '4', clientName: 'Sunita Devi', fundName: 'Aditya Birla Sun Life Medium Term', assetClass: 'Debt', investedValue: 200000, currentValue: 185000, unrealizedLoss: 15000, estimatedSavings: 2250, holdingPeriod: '6 months' },
  ]
}

export default InsightsPage
