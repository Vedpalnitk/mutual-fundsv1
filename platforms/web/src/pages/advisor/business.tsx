import { useState, useEffect, useCallback, useMemo } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { biApi, AumOverview, NetFlowPeriod, SipHealth, RevenueProjection, ClientConcentration, MonthlyScorecard, RevenueAttribution, ClientSegmentation } from '@/services/api'
import { useFATheme, formatCurrency, formatCurrencyCompact } from '@/utils/fa'
import { FACard, FAEmptyState } from '@/components/advisor/shared'
import { exportToCSV } from '@/utils/exportUtils'

type WidgetKey = 'category' | 'branch' | 'flows' | 'sip' | 'revenue' | 'rm' | 'concentration' | 'dormant' | 'revenueAttribution' | 'tiers'
type TabId = 'overview' | 'details' | 'projections'
type SortDirection = 'asc' | 'desc'
type SortConfig = { column: string; direction: SortDirection }

function sortBy<T>(data: T[], config: SortConfig, getters: Record<string, (item: T) => string | number>): T[] {
  if (!config.column || !getters[config.column]) return data
  const getter = getters[config.column]
  return [...data].sort((a, b) => {
    const aVal = getter(a)
    const bVal = getter(b)
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return config.direction === 'asc' ? aVal - bVal : bVal - aVal
    }
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    return config.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
  })
}

export default function BusinessPage() {
  const { colors, isDark } = useFATheme()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [selectedTable, setSelectedTable] = useState<WidgetKey>('category')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' })

  // Data state
  const [aum, setAum] = useState<AumOverview | null>(null)
  const [branches, setBranches] = useState<{ name: string; aum: number; clientCount: number }[]>([])
  const [rms, setRms] = useState<{ id: string; name: string; aum: number; clientCount: number }[]>([])
  const [netFlows, setNetFlows] = useState<NetFlowPeriod[]>([])
  const [sipHealth, setSipHealth] = useState<SipHealth | null>(null)
  const [revenue, setRevenue] = useState<RevenueProjection | null>(null)
  const [concentration, setConcentration] = useState<ClientConcentration | null>(null)
  const [dormantClients, setDormantClients] = useState<{ id: string; name: string; email: string; aum: number; lastTransactionDate: string; daysSinceLastTxn: number }[]>([])
  const [scorecard, setScorecard] = useState<MonthlyScorecard | null>(null)
  const [revenueAttribution, setRevenueAttribution] = useState<RevenueAttribution | null>(null)
  const [segmentation, setSegmentation] = useState<ClientSegmentation | null>(null)

  // Projections tab state (client-side only)
  const [projGrowthRate, setProjGrowthRate] = useState(12)
  const [projSipGrowth, setProjSipGrowth] = useState(5)
  const [projTrailAdj, setProjTrailAdj] = useState(0)
  const [projHorizon, setProjHorizon] = useState(12)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [aumR, branchR, rmR, flowsR, sipR, revR, concR, dormR, scorecardR, revAttrR, segR] = await Promise.allSettled([
        biApi.getAumOverview(),
        biApi.getAumByBranch(),
        biApi.getAumByRm(),
        biApi.getNetFlows(6),
        biApi.getSipHealth(),
        biApi.getRevenueProjection(),
        biApi.getClientConcentration(10),
        biApi.getDormantClients(),
        biApi.getMonthlyScorecard(),
        biApi.getRevenueAttribution(),
        biApi.getClientSegmentation(),
      ])
      if (aumR.status === 'fulfilled') setAum(aumR.value)
      if (branchR.status === 'fulfilled') setBranches(branchR.value)
      if (rmR.status === 'fulfilled') setRms(rmR.value)
      if (flowsR.status === 'fulfilled') setNetFlows(flowsR.value)
      if (sipR.status === 'fulfilled') setSipHealth(sipR.value)
      if (revR.status === 'fulfilled') setRevenue(revR.value)
      if (concR.status === 'fulfilled') setConcentration(concR.value)
      if (dormR.status === 'fulfilled') setDormantClients(dormR.value)
      if (scorecardR.status === 'fulfilled') setScorecard(scorecardR.value)
      if (revAttrR.status === 'fulfilled') setRevenueAttribution(revAttrR.value)
      if (segR.status === 'fulfilled') setSegmentation(segR.value)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Reset sort and date filter when switching tables
  useEffect(() => {
    setSortConfig({ column: '', direction: 'asc' })
    setDateFilter('all')
  }, [selectedTable])

  // ── Computed helpers ──

  const totalBranchAum = branches.reduce((s, b) => s + b.aum, 0)
  const totalRmAum = rms.reduce((s, r) => s + r.aum, 0)
  const latestFlow = netFlows.length > 0 ? netFlows[netFlows.length - 1] : null
  const dormantAumAtRisk = dormantClients.reduce((s, c) => s + c.aum, 0)

  const maxFlowBar = netFlows.length > 0
    ? Math.max(...netFlows.map(f => Math.max(f.purchases, f.redemptions)), 1)
    : 1

  // Date filter options (for time-series tables)
  const dateFilterOptions = useMemo(() => {
    if (selectedTable === 'flows') {
      return netFlows.map(f => f.period)
    }
    if (selectedTable === 'revenue' && revenue) {
      return revenue.projections.map(p => p.period)
    }
    return []
  }, [selectedTable, netFlows, revenue])

  const hasDateFilter = selectedTable === 'flows' || selectedTable === 'revenue'

  // Projections computation (client-side only)
  const projections = useMemo(() => {
    const baseAum = aum?.totalAum || 0
    const baseSip = sipHealth?.totalMonthlyAmount || 0
    const baseTrailRate = (revenue?.avgTrailRate || 0.5) + projTrailAdj / 100
    const monthlyGrowth = projGrowthRate / 100 / 12
    const monthlySipGrowth = projSipGrowth / 100 / 12

    const rows: { month: number; projectedAum: number; projectedSipBook: number; projectedTrail: number; cumulative: number }[] = []
    let cumTrail = 0
    let currentAum = baseAum
    let currentSip = baseSip

    for (let i = 1; i <= projHorizon; i++) {
      currentAum = currentAum * (1 + monthlyGrowth) + currentSip
      currentSip = currentSip * (1 + monthlySipGrowth)
      const trail = (currentAum * baseTrailRate) / 100 / 12
      cumTrail += trail
      rows.push({
        month: i,
        projectedAum: Math.round(currentAum),
        projectedSipBook: Math.round(currentSip),
        projectedTrail: Math.round(trail * 100) / 100,
        cumulative: Math.round(cumTrail * 100) / 100,
      })
    }
    return rows
  }, [aum, sipHealth, revenue, projGrowthRate, projSipGrowth, projTrailAdj, projHorizon])

  // ── Sort handlers (Insights-style) ──

  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortIcon = (column: string) => {
    if (sortConfig.column === column) {
      return (
        <svg className="w-3 h-3 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={sortConfig.direction === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      )
    }
    return (
      <svg className="w-3 h-3 ml-0.5 inline-block opacity-0 group-hover/th:opacity-30 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }

  // ── Table styling (Insights-style) ──

  const theadStyle = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)'
      : 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)',
    borderBottom: `1px solid ${colors.cardBorder}`,
  }

  const thClass = 'text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th'
  const tdBase = { borderBottom: `1px solid ${colors.cardBorder}` }

  const rowHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.background = isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)',
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.background = 'transparent',
  }

  // ── Export handlers ──

  const handleExport = (key: WidgetKey) => {
    switch (key) {
      case 'category':
        if (aum) {
          const rows = Object.entries(aum.byCategory).map(([cat, val]) => ({
            category: cat,
            aum: val,
            percentOfTotal: aum.totalAum > 0 ? `${((val / aum.totalAum) * 100).toFixed(1)}%` : '0%',
          }))
          exportToCSV(rows, 'aum-by-category', [
            { key: 'category', header: 'Category' },
            { key: 'aum', header: 'AUM' },
            { key: 'percentOfTotal', header: '% of Total' },
          ])
        }
        break
      case 'branch':
        exportToCSV(
          branches.map(b => ({ ...b, percentOfTotal: totalBranchAum > 0 ? `${((b.aum / totalBranchAum) * 100).toFixed(1)}%` : '0%' })),
          'aum-by-branch',
          [
            { key: 'name', header: 'Branch' },
            { key: 'aum', header: 'AUM' },
            { key: 'clientCount', header: 'Clients' },
            { key: 'percentOfTotal', header: '% of Total' },
          ],
        )
        break
      case 'flows':
        exportToCSV(netFlows, 'net-flows', [
          { key: 'period', header: 'Month' },
          { key: 'purchases', header: 'Purchases' },
          { key: 'redemptions', header: 'Redemptions' },
          { key: 'net', header: 'Net' },
        ])
        break
      case 'sip':
        if (sipHealth) {
          const rows = [
            { metric: 'Active SIPs', value: String(sipHealth.active) },
            { metric: 'Paused SIPs', value: String(sipHealth.paused) },
            { metric: 'Cancelled SIPs', value: String(sipHealth.cancelled) },
            { metric: 'Total SIPs', value: String(sipHealth.total) },
            { metric: 'Monthly Book', value: String(sipHealth.totalMonthlyAmount) },
            { metric: 'Mandate Expiring', value: String(sipHealth.mandateExpiringCount) },
          ]
          exportToCSV(rows, 'sip-health', [
            { key: 'metric', header: 'Metric' },
            { key: 'value', header: 'Value' },
          ])
        }
        break
      case 'revenue':
        if (revenue) {
          let cumulative = 0
          const rows = revenue.projections.map(p => {
            cumulative += p.projectedTrail
            return {
              period: p.period,
              projectedAum: p.projectedAum,
              projectedTrail: p.projectedTrail,
              cumulative,
            }
          })
          exportToCSV(rows, 'revenue-projection', [
            { key: 'period', header: 'Month' },
            { key: 'projectedAum', header: 'Projected AUM' },
            { key: 'projectedTrail', header: 'Trail' },
            { key: 'cumulative', header: 'Cumulative' },
          ])
        }
        break
      case 'rm':
        exportToCSV(
          rms.map(r => ({ ...r, percentOfTotal: totalRmAum > 0 ? `${((r.aum / totalRmAum) * 100).toFixed(1)}%` : '0%' })),
          'rm-breakdown',
          [
            { key: 'name', header: 'RM Name' },
            { key: 'aum', header: 'AUM' },
            { key: 'clientCount', header: 'Clients' },
            { key: 'percentOfTotal', header: '% of Total' },
          ],
        )
        break
      case 'concentration':
        if (concentration) {
          let cum = 0
          const rows = concentration.clients.map(c => {
            cum += c.percentOfTotal
            return { ...c, cumulativePercent: `${cum.toFixed(1)}%` }
          })
          exportToCSV(rows, 'client-concentration', [
            { key: 'rank', header: 'Rank' },
            { key: 'name', header: 'Name' },
            { key: 'aum', header: 'AUM' },
            { key: 'percentOfTotal', header: '% of Total' },
            { key: 'cumulativePercent', header: 'Cumulative %' },
          ])
        }
        break
      case 'dormant':
        exportToCSV(dormantClients, 'dormant-clients', [
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'aum', header: 'AUM' },
          { key: 'daysSinceLastTxn', header: 'Days Inactive' },
        ])
        break
      case 'revenueAttribution':
        if (revenueAttribution) {
          exportToCSV(revenueAttribution.byAmc, 'revenue-by-amc', [
            { key: 'amcName', header: 'AMC' },
            { key: 'aumAmount', header: 'AUM' },
            { key: 'trailRate', header: 'Trail Rate %' },
            { key: 'estimatedTrail', header: 'Est. Trail' },
            { key: 'percentOfTotal', header: '% of Total' },
          ])
        }
        break
      case 'tiers':
        if (segmentation) {
          exportToCSV(segmentation.tiers, 'client-tiers', [
            { key: 'tier', header: 'Tier' },
            { key: 'clientCount', header: 'Clients' },
            { key: 'totalAum', header: 'Total AUM' },
            { key: 'avgAum', header: 'Avg AUM' },
            { key: 'percentOfAum', header: '% of AUM' },
          ])
        }
        break
    }
  }

  // ── Table dropdown options ──

  const tableOptions: { key: WidgetKey; label: string }[] = [
    { key: 'category', label: 'AUM by Category' },
    { key: 'branch', label: 'AUM by Branch' },
    { key: 'flows', label: 'Net Flows' },
    { key: 'sip', label: 'SIP Health' },
    { key: 'revenue', label: 'Revenue Projection' },
    { key: 'rm', label: 'Sub-broker / RM Breakdown' },
    { key: 'concentration', label: 'Client Concentration' },
    { key: 'dormant', label: 'Dormant Clients' },
    { key: 'revenueAttribution', label: 'Revenue by AMC' },
    { key: 'tiers', label: 'Client Tiers' },
  ]

  // ── Select style helper (FASelect pattern) ──

  const selectStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: isDark ? colors.inputBg : '#FFFFFF',
    border: `1px solid ${active ? colors.primary : colors.inputBorder}`,
    color: active ? colors.primary : colors.textSecondary,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    backgroundRepeat: 'no-repeat',
    paddingRight: '40px',
  })

  // ── Widget card (compact, no View All) ──

  const WidgetCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="p-4 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>{title}</p>
      {children}
    </div>
  )

  return (
    <AdvisorLayout title="AUM & Business Analytics">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
        </div>
      ) : (
        <div className="space-y-4">

          {/* ═══ Top 4 KPI Panels (Dashboard-style gradient) ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            {[
              {
                label: 'Net Flow (Latest)',
                value: latestFlow ? `${latestFlow.net >= 0 ? '+' : ''}${formatCurrencyCompact(latestFlow.net)}` : '--',
                change: latestFlow?.period ?? 'No data',
                variant: latestFlow && latestFlow.net >= 0 ? 'success' : 'primary',
              },
              {
                label: 'Monthly Trail',
                value: revenue ? formatCurrencyCompact(revenue.currentMonthlyTrail) : '--',
                change: revenue ? `${revenue.avgTrailRate.toFixed(2)}% trail rate` : 'No data',
                variant: 'success',
              },
              {
                label: 'Active SIPs',
                value: sipHealth ? String(sipHealth.active) : '--',
                change: sipHealth ? `${formatCurrency(sipHealth.totalMonthlyAmount)}/mo` : 'No data',
                variant: 'secondary',
              },
              {
                label: 'Dormant Clients',
                value: String(dormantClients.length),
                change: dormantClients.length > 0 ? `${formatCurrencyCompact(dormantAumAtRisk)} at risk` : 'All clear',
                variant: 'accent',
              },
            ].map((kpi) => {
              const getGradient = () => {
                switch (kpi.variant) {
                  case 'secondary': return `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`
                  case 'success': return `linear-gradient(135deg, ${colors.success} 0%, ${isDark ? '#059669' : '#047857'} 100%)`
                  case 'accent': return `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.secondary} 100%)`
                  default: return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                }
              }
              return (
                <div
                  key={kpi.label}
                  className="p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: getGradient(),
                    boxShadow: `0 8px 32px ${isDark ? 'rgba(59, 130, 246, 0.25)' : `${colors.primary}25`}`,
                  }}
                >
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <div className="relative z-10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{kpi.label}</p>
                    <p className="text-xl font-bold mt-2 text-white">{kpi.value}</p>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block"
                      style={{ background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#FFFFFF' }}
                    >
                      {kpi.change}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ═══ Monthly Scorecard Strip ═══ */}
          {scorecard && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: 'AUM Change', delta: scorecard.aum.delta, pct: scorecard.aum.deltaPercent },
                { label: 'Net Flows', delta: scorecard.netFlows.delta, pct: null },
                { label: 'SIP Book', delta: scorecard.sipBook.delta, pct: scorecard.sipBook.deltaPercent },
                { label: 'Client Count', delta: scorecard.clientCount.delta, pct: scorecard.clientCount.deltaPercent },
                { label: 'New Clients', delta: scorecard.newClients, pct: null },
                { label: 'Lost Clients', delta: -scorecard.lostClients, pct: null },
              ].map((item) => {
                const isPositive = item.delta >= 0
                return (
                  <div key={item.label} className="p-3 rounded-xl" style={{
                    background: colors.chipBg,
                    border: `1px solid ${colors.cardBorder}`,
                  }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>{item.label}</p>
                    <p className="text-sm font-bold" style={{ color: isPositive ? colors.success : colors.error }}>
                      {isPositive ? '+' : ''}{typeof item.delta === 'number' && Math.abs(item.delta) >= 1000
                        ? formatCurrencyCompact(item.delta)
                        : item.delta}
                    </p>
                    {item.pct !== null && item.pct !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{
                        background: `${isPositive ? colors.success : colors.error}15`,
                        color: isPositive ? colors.success : colors.error,
                      }}>
                        {isPositive ? '+' : ''}{item.pct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ═══ Tab Bar (Insights-style) ═══ */}
          <div className="flex gap-1">
            {([
              { id: 'overview' as TabId, label: 'Overview' },
              { id: 'details' as TabId, label: 'Details' },
              { id: 'projections' as TabId, label: 'Projections' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  background: activeTab === tab.id
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : 'transparent',
                  color: activeTab === tab.id ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ Overview Tab ═══ */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Hero: Asset Class Breakdown */}
              {aum && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Equity', value: aum.equityAum, color: colors.primary },
                    { label: 'Debt', value: aum.debtAum, color: colors.secondary },
                    { label: 'Hybrid', value: aum.hybridAum, color: colors.warning },
                    { label: 'Other', value: aum.otherAum, color: colors.textTertiary },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl" style={{
                      background: `${item.color}08`,
                      border: `1px solid ${isDark ? `${item.color}20` : `${item.color}15`}`,
                    }}>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: item.color }}>{item.label}</p>
                      <p className="text-lg font-bold mt-1" style={{ color: colors.textPrimary }}>{formatCurrency(item.value)}</p>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                        {aum.totalAum > 0 ? `${Math.round((item.value / aum.totalAum) * 100)}%` : '0%'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Widget Grid (2-col) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {/* 1. AUM by Category */}
                {aum && Object.keys(aum.byCategory).length > 0 && (
                  <WidgetCard title="AUM by Category">
                    <div className="space-y-2">
                      {Object.entries(aum.byCategory).slice(0, 4).map(([cat, val]) => {
                        const pct = aum.totalAum > 0 ? (val / aum.totalAum) * 100 : 0
                        return (
                          <div key={cat} className="flex items-center gap-2">
                            <span className="text-xs w-24 truncate" style={{ color: colors.textSecondary }}>{cat}</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.primary}15` }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }} />
                            </div>
                            <span className="text-xs font-semibold w-14 text-right" style={{ color: colors.textPrimary }}>{formatCurrencyCompact(val)}</span>
                          </div>
                        )
                      })}
                      {Object.keys(aum.byCategory).length > 4 && (
                        <p className="text-xs" style={{ color: colors.textTertiary }}>+{Object.keys(aum.byCategory).length - 4} more</p>
                      )}
                    </div>
                  </WidgetCard>
                )}

                {/* 2. AUM by Branch */}
                <WidgetCard title="AUM by Branch">
                  {branches.length === 0 ? (
                    <p className="text-xs" style={{ color: colors.textTertiary }}>No branch data available</p>
                  ) : (
                    <div className="space-y-2">
                      {branches.slice(0, 3).map((b) => (
                        <div key={b.name} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{b.name}</p>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>{b.clientCount} clients</p>
                          </div>
                          <p className="text-sm font-bold" style={{ color: colors.primary }}>{formatCurrencyCompact(b.aum)}</p>
                        </div>
                      ))}
                      {branches.length > 3 && (
                        <p className="text-xs" style={{ color: colors.textTertiary }}>+{branches.length - 3} more branches</p>
                      )}
                    </div>
                  )}
                </WidgetCard>

                {/* 3. Net Flows */}
                <WidgetCard title="Net Flows">
                  {netFlows.length === 0 ? (
                    <p className="text-xs" style={{ color: colors.textTertiary }}>No flow data available</p>
                  ) : (
                    <div>
                      {latestFlow && (
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-lg font-bold" style={{ color: latestFlow.net >= 0 ? colors.success : colors.error }}>
                            {latestFlow.net >= 0 ? '+' : ''}{formatCurrency(latestFlow.net)}
                          </span>
                          <span className="text-xs" style={{ color: colors.textTertiary }}>{latestFlow.period}</span>
                        </div>
                      )}
                      <div className="flex items-end gap-1" style={{ height: '40px' }}>
                        {netFlows.map((f) => (
                          <div key={f.period} className="flex-1 rounded-t" style={{
                            height: `${Math.max((Math.abs(f.net) / maxFlowBar) * 100, 8)}%`,
                            background: f.net >= 0 ? colors.success : colors.error,
                            opacity: 0.7,
                          }} />
                        ))}
                      </div>
                      <div className="flex gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: colors.success }} />
                          <span className="text-[10px]" style={{ color: colors.textTertiary }}>Inflow</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: colors.error }} />
                          <span className="text-[10px]" style={{ color: colors.textTertiary }}>Outflow</span>
                        </div>
                      </div>
                    </div>
                  )}
                </WidgetCard>

                {/* 4. SIP Health */}
                {sipHealth && (
                  <WidgetCard title="SIP Health">
                    <div className="flex items-baseline gap-4 mb-2">
                      <div>
                        <p className="text-lg font-bold" style={{ color: colors.success }}>{sipHealth.active}</p>
                        <p className="text-[10px]" style={{ color: colors.textTertiary }}>Active</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold" style={{ color: colors.primary }}>{formatCurrency(sipHealth.totalMonthlyAmount)}</p>
                        <p className="text-[10px]" style={{ color: colors.textTertiary }}>Monthly Book</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs" style={{ color: colors.textTertiary }}>
                      <span>{sipHealth.paused} paused</span>
                      <span>{sipHealth.cancelled} cancelled</span>
                      {sipHealth.mandateExpiringCount > 0 && (
                        <span style={{ color: colors.warning }}>{sipHealth.mandateExpiringCount} expiring</span>
                      )}
                    </div>
                  </WidgetCard>
                )}

                {/* 5. Revenue Forecast */}
                {revenue && (
                  <WidgetCard title="Revenue Forecast">
                    <div className="flex items-baseline gap-4 mb-2">
                      <div>
                        <p className="text-lg font-bold" style={{ color: colors.success }}>{formatCurrency(revenue.currentMonthlyTrail)}</p>
                        <p className="text-[10px]" style={{ color: colors.textTertiary }}>Monthly Trail</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold" style={{ color: colors.warning }}>{formatCurrency(revenue.annual12MProjection)}</p>
                        <p className="text-[10px]" style={{ color: colors.textTertiary }}>12M Projection</p>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      Avg trail rate: <span className="font-semibold" style={{ color: colors.textSecondary }}>{revenue.avgTrailRate.toFixed(2)}%</span>
                    </p>
                  </WidgetCard>
                )}

                {/* 6. Sub-broker / RM Revenue */}
                <WidgetCard title="Sub-broker / RM Revenue">
                  {rms.length === 0 ? (
                    <p className="text-xs" style={{ color: colors.textTertiary }}>No RM data available</p>
                  ) : (
                    <div className="space-y-2">
                      {rms.slice(0, 3).map((r) => (
                        <div key={r.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{r.name}</p>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>{r.clientCount} clients</p>
                          </div>
                          <p className="text-sm font-bold" style={{ color: colors.primary }}>{formatCurrencyCompact(r.aum)}</p>
                        </div>
                      ))}
                      {rms.length > 3 && (
                        <p className="text-xs" style={{ color: colors.textTertiary }}>+{rms.length - 3} more RMs</p>
                      )}
                    </div>
                  )}
                </WidgetCard>

                {/* 7. Client Concentration */}
                {concentration && (
                  <WidgetCard title="Client Concentration">
                    <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                      Top {concentration.topN} clients hold{' '}
                      <span className="font-bold" style={{ color: concentration.concentrationPercent > 60 ? colors.warning : colors.success }}>
                        {concentration.concentrationPercent}%
                      </span>{' '}
                      of total AUM
                    </p>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: `${colors.primary}15` }}>
                      <div className="h-full rounded-full" style={{
                        width: `${concentration.concentrationPercent}%`,
                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                      }} />
                    </div>
                  </WidgetCard>
                )}

                {/* 8. Dormant Clients */}
                <WidgetCard title="Dormant Clients">
                  {dormantClients.length === 0 ? (
                    <div>
                      <p className="text-sm" style={{ color: colors.success }}>All clear</p>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>No dormant clients found</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-3 mb-1">
                        <p className="text-lg font-bold" style={{ color: colors.warning }}>{dormantClients.length}</p>
                        <p className="text-xs" style={{ color: colors.textTertiary }}>clients inactive</p>
                      </div>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                        AUM at risk:{' '}
                        <span className="font-semibold" style={{ color: colors.warning }}>
                          {formatCurrencyCompact(dormantAumAtRisk)}
                        </span>
                      </p>
                    </div>
                  )}
                </WidgetCard>

                {/* 9. Revenue by AMC */}
                {revenueAttribution && revenueAttribution.byAmc.length > 0 && (
                  <WidgetCard title="Revenue by AMC">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-bold" style={{ color: colors.success }}>{formatCurrency(revenueAttribution.totalTrailIncome)}</span>
                      <span className="text-xs" style={{ color: colors.textTertiary }}>est. annual trail</span>
                    </div>
                    <div className="space-y-2">
                      {revenueAttribution.byAmc.slice(0, 3).map((a) => (
                        <div key={a.amcName} className="flex items-center gap-2">
                          <span className="text-xs w-24 truncate" style={{ color: colors.textSecondary }}>{a.amcName}</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.primary}15` }}>
                            <div className="h-full rounded-full" style={{ width: `${a.percentOfTotal}%`, background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }} />
                          </div>
                          <span className="text-xs font-semibold w-14 text-right" style={{ color: colors.textPrimary }}>{a.percentOfTotal}%</span>
                        </div>
                      ))}
                      {revenueAttribution.byAmc.length > 3 && (
                        <p className="text-xs" style={{ color: colors.textTertiary }}>+{revenueAttribution.byAmc.length - 3} more AMCs</p>
                      )}
                    </div>
                  </WidgetCard>
                )}

                {/* 10. Client Tiers */}
                {segmentation && (
                  <WidgetCard title="Client Tiers">
                    <div className="grid grid-cols-2 gap-2">
                      {segmentation.tiers.map((t) => {
                        const tierColors: Record<string, string> = {
                          Diamond: colors.primary,
                          Gold: colors.warning,
                          Silver: colors.textTertiary,
                          Bronze: '#CD7F32',
                        }
                        const c = tierColors[t.tier] || colors.primary
                        return (
                          <div key={t.tier} className="p-2 rounded-lg" style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                            <p className="text-[10px] font-semibold uppercase" style={{ color: c }}>{t.tier}</p>
                            <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{t.clientCount}</p>
                            <p className="text-[10px]" style={{ color: colors.textTertiary }}>{formatCurrencyCompact(t.totalAum)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </WidgetCard>
                )}
              </div>
            </div>
          )}

          {/* ═══ Details Tab ═══ */}
          {activeTab === 'details' && (
            <div className="space-y-3">
              {/* Filter Bar */}
              <FACard>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Table Selector */}
                  <div className="flex-1 min-w-0">
                    <select
                      value={selectedTable}
                      onChange={e => setSelectedTable(e.target.value as WidgetKey)}
                      className="w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                      style={{ ...selectStyle(true), focusRingColor: colors.primary } as React.CSSProperties}
                    >
                      {tableOptions.map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month/Year Filter (only for time-series tables) */}
                  {hasDateFilter && (
                    <>
                      <div className="w-px h-6 hidden sm:block" style={{ background: colors.cardBorder }} />
                      <select
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className="h-10 px-4 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                        style={selectStyle(dateFilter !== 'all')}
                      >
                        <option value="all">All Months</option>
                        {dateFilterOptions.map(period => (
                          <option key={period} value={period}>{period}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {/* CSV Download */}
                  <button
                    onClick={() => handleExport(selectedTable)}
                    className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full transition-all hover:shadow-md whitespace-nowrap"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      color: '#fff',
                    }}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download CSV
                  </button>
                </div>
              </FACard>

              {/* Table Content */}
              <FACard padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">

                  {/* Category Table */}
                  {selectedTable === 'category' && (() => {
                    if (!aum || Object.keys(aum.byCategory).length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No Category Data" description="AUM category breakdown is not available" />
                        </div>
                      )
                    }
                    const items = sortBy(
                      Object.entries(aum.byCategory).map(([cat, val]) => ({ cat, val, pct: aum.totalAum > 0 ? (val / aum.totalAum) * 100 : 0 })),
                      sortConfig,
                      { category: i => i.cat, aum: i => i.val, percent: i => i.pct }
                    )
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('category')}>Category {sortIcon('category')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>AUM {sortIcon('aum')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('percent')}>% of Total {sortIcon('percent')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(({ cat, val, pct }) => (
                            <tr key={cat} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{cat}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(val)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.primary }}>{pct.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* Branch Table */}
                  {selectedTable === 'branch' && (() => {
                    if (branches.length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No Branch Data" description="AUM branch breakdown is not available" />
                        </div>
                      )
                    }
                    const items = sortBy(branches, sortConfig, {
                      branch: i => i.name, aum: i => i.aum, clients: i => i.clientCount,
                      percent: i => totalBranchAum > 0 ? (i.aum / totalBranchAum) * 100 : 0,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('branch')}>Branch {sortIcon('branch')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>AUM {sortIcon('aum')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('clients')}>Clients {sortIcon('clients')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('percent')}>% of Total {sortIcon('percent')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((b) => (
                            <tr key={b.name} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{b.name}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(b.aum)}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{b.clientCount}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.primary }}>
                                {totalBranchAum > 0 ? `${((b.aum / totalBranchAum) * 100).toFixed(1)}%` : '0%'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* Flows Table */}
                  {selectedTable === 'flows' && (() => {
                    if (netFlows.length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No Flow Data" description="Net flow data is not available" />
                        </div>
                      )
                    }
                    let filtered = dateFilter === 'all' ? netFlows : netFlows.filter(f => f.period === dateFilter)
                    filtered = sortBy(filtered, sortConfig, {
                      period: i => i.period, purchases: i => i.purchases, redemptions: i => i.redemptions, net: i => i.net,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('period')}>Month {sortIcon('period')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('purchases')}>Purchases {sortIcon('purchases')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('redemptions')}>Redemptions {sortIcon('redemptions')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('net')}>Net {sortIcon('net')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((f) => (
                            <tr key={f.period} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{f.period}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.success }}>{formatCurrency(f.purchases)}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.error }}>{formatCurrency(f.redemptions)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: f.net >= 0 ? colors.success : colors.error }}>
                                {f.net >= 0 ? '+' : ''}{formatCurrency(f.net)}
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8">
                                <FAEmptyState title="No matching data" description="Try selecting a different month" />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* SIP Health Table */}
                  {selectedTable === 'sip' && (() => {
                    if (!sipHealth) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No SIP Data" description="SIP health data is not available" />
                        </div>
                      )
                    }
                    const rows = [
                      { metric: 'Active SIPs', value: sipHealth.active, display: String(sipHealth.active), color: colors.success },
                      { metric: 'Paused SIPs', value: sipHealth.paused, display: String(sipHealth.paused), color: colors.warning },
                      { metric: 'Cancelled SIPs', value: sipHealth.cancelled, display: String(sipHealth.cancelled), color: colors.error },
                      { metric: 'Total SIPs', value: sipHealth.total, display: String(sipHealth.total), color: colors.textPrimary },
                      { metric: 'Monthly Book', value: sipHealth.totalMonthlyAmount, display: formatCurrency(sipHealth.totalMonthlyAmount), color: colors.primary },
                      { metric: 'Mandate Expiring', value: sipHealth.mandateExpiringCount, display: String(sipHealth.mandateExpiringCount), color: sipHealth.mandateExpiringCount > 0 ? colors.warning : colors.success },
                    ]
                    const sorted = sortBy(rows, sortConfig, {
                      metric: i => i.metric, value: i => i.value,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('metric')}>Metric {sortIcon('metric')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('value')}>Value {sortIcon('value')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((row) => (
                            <tr key={row.metric} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{row.metric}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: row.color }}>{row.display}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* Revenue Table */}
                  {selectedTable === 'revenue' && (() => {
                    if (!revenue || revenue.projections.length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No Revenue Data" description="Revenue projection data is not available" />
                        </div>
                      )
                    }
                    let filtered = dateFilter === 'all' ? revenue.projections : revenue.projections.filter(p => p.period === dateFilter)
                    // Build cumulative on original order, then sort for display
                    let cumulative = 0
                    const withCumulative = filtered.map(p => {
                      cumulative += p.projectedTrail
                      return { ...p, cumulative }
                    })
                    const sorted = sortBy(withCumulative, sortConfig, {
                      period: i => i.period, aum: i => i.projectedAum, trail: i => i.projectedTrail, cumulative: i => i.cumulative,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('period')}>Month {sortIcon('period')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>Projected AUM {sortIcon('aum')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('trail')}>Trail {sortIcon('trail')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('cumulative')}>Cumulative {sortIcon('cumulative')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((p) => (
                            <tr key={p.period} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{p.period}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(p.projectedAum)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.success }}>{formatCurrency(p.projectedTrail)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.primary }}>{formatCurrency(p.cumulative)}</td>
                            </tr>
                          ))}
                          {sorted.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8">
                                <FAEmptyState title="No matching data" description="Try selecting a different month" />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* RM Table */}
                  {selectedTable === 'rm' && (() => {
                    if (rms.length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No RM Data" description="Sub-broker / RM data is not available" />
                        </div>
                      )
                    }
                    const items = sortBy(rms, sortConfig, {
                      name: i => i.name, aum: i => i.aum, clients: i => i.clientCount,
                      percent: i => totalRmAum > 0 ? (i.aum / totalRmAum) * 100 : 0,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('name')}>RM Name {sortIcon('name')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>AUM {sortIcon('aum')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('clients')}>Clients {sortIcon('clients')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('percent')}>% of Total {sortIcon('percent')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((r) => (
                            <tr key={r.id} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{r.name}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(r.aum)}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{r.clientCount}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.primary }}>
                                {totalRmAum > 0 ? `${((r.aum / totalRmAum) * 100).toFixed(1)}%` : '0%'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* Concentration Table */}
                  {selectedTable === 'concentration' && (() => {
                    if (!concentration || concentration.clients.length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No Concentration Data" description="Client concentration data is not available" />
                        </div>
                      )
                    }
                    // Build cumulative on original order
                    let cum = 0
                    const withCum = concentration.clients.map(c => {
                      cum += c.percentOfTotal
                      return { ...c, cumulative: cum }
                    })
                    const items = sortBy(withCum, sortConfig, {
                      rank: i => i.rank, name: i => i.name, aum: i => i.aum,
                      percent: i => i.percentOfTotal, cumulative: i => i.cumulative,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('rank')}>Rank {sortIcon('rank')}</th>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('name')}>Name {sortIcon('name')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>AUM {sortIcon('aum')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('percent')}>% of Total {sortIcon('percent')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('cumulative')}>Cumulative % {sortIcon('cumulative')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((c) => (
                            <tr key={c.id} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textSecondary }}>#{c.rank}</td>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{c.name}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(c.aum)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.primary }}>{c.percentOfTotal}%</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textTertiary }}>{c.cumulative.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* Dormant Table */}
                  {selectedTable === 'dormant' && (() => {
                    if (dormantClients.length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No Dormant Clients" description="All clients are active — great job!" />
                        </div>
                      )
                    }
                    const items = sortBy(dormantClients, sortConfig, {
                      name: i => i.name, email: i => i.email, aum: i => i.aum, days: i => i.daysSinceLastTxn ?? 0,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('name')}>Name {sortIcon('name')}</th>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('email')}>Email {sortIcon('email')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>AUM {sortIcon('aum')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('days')}>Days Inactive {sortIcon('days')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((c) => (
                            <tr key={c.id} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{c.name}</td>
                              <td className="px-4 py-3" style={{ ...tdBase, color: colors.textSecondary }}>{c.email}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(c.aum)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.warning }}>
                                {c.daysSinceLastTxn ? `${c.daysSinceLastTxn} days` : 'Never'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* Revenue Attribution Table */}
                  {selectedTable === 'revenueAttribution' && (() => {
                    if (!revenueAttribution || revenueAttribution.byAmc.length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No Revenue Data" description="Revenue attribution data is not available" />
                        </div>
                      )
                    }
                    const items = sortBy(revenueAttribution.byAmc, sortConfig, {
                      amc: i => i.amcName, aum: i => i.aumAmount, trailRate: i => i.trailRate,
                      trail: i => i.estimatedTrail, percent: i => i.percentOfTotal,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('amc')}>AMC {sortIcon('amc')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>AUM {sortIcon('aum')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('trailRate')}>Trail Rate {sortIcon('trailRate')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('trail')}>Est. Trail {sortIcon('trail')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('percent')}>% of Total {sortIcon('percent')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((a) => (
                            <tr key={a.amcName} {...rowHover}>
                              <td className="px-4 py-3 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>{a.amcName}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(a.aumAmount)}</td>
                              <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{a.trailRate.toFixed(2)}%</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.success }}>{formatCurrency(a.estimatedTrail)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.primary }}>{a.percentOfTotal}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}

                  {/* Client Tiers Table */}
                  {selectedTable === 'tiers' && (() => {
                    if (!segmentation || segmentation.tiers.length === 0) {
                      return (
                        <div className="py-8">
                          <FAEmptyState title="No Tier Data" description="Client segmentation data is not available" />
                        </div>
                      )
                    }
                    const items = sortBy(segmentation.tiers, sortConfig, {
                      tier: i => i.tier, clients: i => i.clientCount, aum: i => i.totalAum,
                      avg: i => i.avgAum, percent: i => i.percentOfAum,
                    })
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={theadStyle}>
                            <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('tier')}>Tier {sortIcon('tier')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('clients')}>Clients {sortIcon('clients')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>Total AUM {sortIcon('aum')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('avg')}>Avg AUM {sortIcon('avg')}</th>
                            <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('percent')}>% of AUM {sortIcon('percent')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((t) => {
                            const tierColors: Record<string, string> = { Diamond: colors.primary, Gold: colors.warning, Silver: colors.textTertiary, Bronze: '#CD7F32' }
                            return (
                              <tr key={t.tier} {...rowHover}>
                                <td className="px-4 py-3 font-semibold" style={{ ...tdBase, color: tierColors[t.tier] || colors.textPrimary }}>{t.tier}</td>
                                <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{t.clientCount}</td>
                                <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(t.totalAum)}</td>
                                <td className="px-4 py-3 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(t.avgAum)}</td>
                                <td className="px-4 py-3 text-right font-semibold" style={{ ...tdBase, color: colors.primary }}>{t.percentOfAum}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )
                  })()}

                </div>
              </FACard>
            </div>
          )}

          {/* ═══ Projections Tab ═══ */}
          {activeTab === 'projections' && (
            <div className="space-y-4">
              {/* Controls */}
              <FACard>
                <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>Growth Scenario</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Annual AUM Growth */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                      Annual AUM Growth: <span className="font-bold" style={{ color: colors.primary }}>{projGrowthRate}%</span>
                    </label>
                    <input type="range" min={0} max={30} step={1} value={projGrowthRate}
                      onChange={e => setProjGrowthRate(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: colors.primary, background: `${colors.primary}20` }}
                    />
                    <div className="flex justify-between text-[10px]" style={{ color: colors.textTertiary }}>
                      <span>0%</span><span>30%</span>
                    </div>
                  </div>
                  {/* SIP Growth */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                      SIP Growth: <span className="font-bold" style={{ color: colors.primary }}>{projSipGrowth}%</span>
                    </label>
                    <input type="range" min={0} max={20} step={1} value={projSipGrowth}
                      onChange={e => setProjSipGrowth(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: colors.primary, background: `${colors.primary}20` }}
                    />
                    <div className="flex justify-between text-[10px]" style={{ color: colors.textTertiary }}>
                      <span>0%</span><span>20%</span>
                    </div>
                  </div>
                  {/* Trail Rate Adjustment */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
                      Trail Adj (bps): <span className="font-bold" style={{ color: colors.primary }}>{projTrailAdj >= 0 ? '+' : ''}{projTrailAdj}</span>
                    </label>
                    <input type="range" min={-20} max={20} step={1} value={projTrailAdj}
                      onChange={e => setProjTrailAdj(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: colors.primary, background: `${colors.primary}20` }}
                    />
                    <div className="flex justify-between text-[10px]" style={{ color: colors.textTertiary }}>
                      <span>-20</span><span>+20</span>
                    </div>
                  </div>
                  {/* Horizon */}
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>Horizon</label>
                    <div className="flex gap-1">
                      {[12, 24, 36].map(m => (
                        <button key={m} onClick={() => setProjHorizon(m)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: projHorizon === m ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` : colors.chipBg,
                            color: projHorizon === m ? '#fff' : colors.textSecondary,
                            border: `1px solid ${projHorizon === m ? 'transparent' : colors.cardBorder}`,
                          }}
                        >
                          {m}M
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </FACard>

              {/* Projection Summary */}
              {projections.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl" style={{ background: `${colors.primary}08`, border: `1px solid ${colors.primary}15` }}>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: colors.primary }}>End AUM</p>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{formatCurrencyCompact(projections[projections.length - 1].projectedAum)}</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: `${colors.secondary}08`, border: `1px solid ${colors.secondary}15` }}>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: colors.secondary }}>End SIP Book</p>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{formatCurrencyCompact(projections[projections.length - 1].projectedSipBook)}</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}15` }}>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: colors.success }}>Cumulative Trail</p>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{formatCurrency(projections[projections.length - 1].cumulative)}</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: `${colors.warning}08`, border: `1px solid ${colors.warning}15` }}>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: colors.warning }}>AUM Growth</p>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                      {aum && aum.totalAum > 0
                        ? `${((projections[projections.length - 1].projectedAum - aum.totalAum) / aum.totalAum * 100).toFixed(1)}%`
                        : '--'}
                    </p>
                  </div>
                </div>
              )}

              {/* Projection Table */}
              <FACard padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={theadStyle}>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Month</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Projected AUM</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>SIP Book</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Trail</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map((p) => (
                        <tr key={p.month} {...rowHover}>
                          <td className="px-4 py-2.5 font-medium" style={{ ...tdBase, color: colors.textPrimary }}>Month {p.month}</td>
                          <td className="px-4 py-2.5 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(p.projectedAum)}</td>
                          <td className="px-4 py-2.5 text-right" style={{ ...tdBase, color: colors.textSecondary }}>{formatCurrency(p.projectedSipBook)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold" style={{ ...tdBase, color: colors.success }}>{formatCurrency(p.projectedTrail)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold" style={{ ...tdBase, color: colors.primary }}>{formatCurrency(p.cumulative)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </FACard>
            </div>
          )}

        </div>
      )}
    </AdvisorLayout>
  )
}
