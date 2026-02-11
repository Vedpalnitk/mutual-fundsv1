import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import {
  advisorInsightsApi,
  AdvisorInsights,
  PortfolioHealthItem,
  RebalancingAlert,
  TaxHarvestingOpportunity,
  GoalAlert,
} from '@/services/api'
import {
  useFATheme,
  formatCurrency,
  formatCurrencyCompact,
} from '@/utils/fa'
import {
  FACard,
  FAChip,
  FAStatCard,
  FAEmptyState,
} from '@/components/advisor/shared'
import DeepAnalysisPanel from '@/components/advisor/DeepAnalysisPanel'

type InsightTab = 'health' | 'rebalancing' | 'goals' | 'tax'
type SortDirection = 'asc' | 'desc'
type SortConfig = { column: string; direction: SortDirection }

const getHealthColor = (status: string, colors: any) => {
  switch (status) {
    case 'healthy': return colors.success
    case 'needs_attention': return colors.warning
    case 'critical': return colors.error
    default: return colors.textTertiary
  }
}

const getHealthLabel = (status: string) => {
  switch (status) {
    case 'healthy': return 'Healthy'
    case 'needs_attention': return 'Attention'
    case 'critical': return 'Critical'
    default: return status
  }
}

const getGoalStatusColor = (status: string, colors: any) => {
  switch (status) {
    case 'ON_TRACK': return colors.success
    case 'AT_RISK': return colors.warning
    case 'OFF_TRACK': return colors.error
    default: return colors.textTertiary
  }
}

const getGoalStatusLabel = (status: string) => {
  switch (status) {
    case 'ON_TRACK': return 'On Track'
    case 'AT_RISK': return 'At Risk'
    case 'OFF_TRACK': return 'Off Track'
    default: return status
  }
}

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


const InsightsPage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()
  const [activeTab, setActiveTab] = useState<InsightTab>('health')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<AdvisorInsights | null>(null)

  // Tier 2: expanded client rows for deep analysis
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

  const toggleExpanded = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  // Search
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const searchTimeout = useRef<NodeJS.Timeout>()

  // Filters per tab
  const [healthFilter, setHealthFilter] = useState('All')
  const [rebalanceFilter, setRebalanceFilter] = useState('All')
  const [goalFilter, setGoalFilter] = useState('All')
  const [taxFilter, setTaxFilter] = useState('All')

  // Sort
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'desc' })

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setSearchTerm(value), 300)
  }

  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Reset sort when tab changes
  useEffect(() => {
    setSortConfig({ column: '', direction: 'desc' })
  }, [activeTab])

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await advisorInsightsApi.get()
        setInsights(data)
      } catch (err) {
        console.error('Failed to load insights:', err)
        setError('Failed to load insights data')
      } finally {
        setLoading(false)
      }
    }
    loadInsights()
  }, [])

  const healthItems = insights?.portfolioHealth || []
  const rebalancingAlerts = insights?.rebalancingAlerts || []
  const goalAlerts = insights?.goalAlerts || []
  const taxOpportunities = insights?.taxHarvesting || []

  // Filtered + sorted data
  const filteredHealth = useMemo(() => {
    let items = [...healthItems]
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(i => i.clientName.toLowerCase().includes(q))
    }
    if (healthFilter !== 'All') {
      items = items.filter(i => i.status === healthFilter)
    }
    return sortBy(items, sortConfig, {
      client: i => i.clientName,
      score: i => i.score,
      status: i => i.status,
      aum: i => i.aum,
    })
  }, [healthItems, searchTerm, healthFilter, sortConfig])

  const filteredRebalancing = useMemo(() => {
    let items = [...rebalancingAlerts]
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(i => i.clientName.toLowerCase().includes(q))
    }
    if (rebalanceFilter !== 'All') {
      items = items.filter(i => i.action === rebalanceFilter)
    }
    return sortBy(items, sortConfig, {
      client: i => i.clientName,
      assetClass: i => i.assetClass,
      action: i => i.action,
      current: i => i.currentAllocation,
      target: i => i.targetAllocation,
      drift: i => Math.abs(i.deviation),
      amount: i => i.amount,
    })
  }, [rebalancingAlerts, searchTerm, rebalanceFilter, sortConfig])

  const filteredGoals = useMemo(() => {
    let items = [...goalAlerts]
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(i => i.clientName.toLowerCase().includes(q) || i.goalName.toLowerCase().includes(q))
    }
    if (goalFilter !== 'All') {
      items = items.filter(i => i.status === goalFilter)
    }
    return sortBy(items, sortConfig, {
      goal: i => i.goalName,
      client: i => i.clientName,
      status: i => i.status,
      progress: i => i.progress,
      current: i => i.currentAmount,
      target: i => i.targetAmount,
      daysLeft: i => i.daysRemaining,
    })
  }, [goalAlerts, searchTerm, goalFilter, sortConfig])

  const filteredTax = useMemo(() => {
    let items = [...taxOpportunities]
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(i => i.clientName.toLowerCase().includes(q) || i.fundName.toLowerCase().includes(q))
    }
    if (taxFilter !== 'All') {
      items = items.filter(i => i.holdingPeriod === taxFilter)
    }
    return sortBy(items, sortConfig, {
      fund: i => i.fundName,
      client: i => i.clientName,
      holding: i => i.holdingPeriod,
      invested: i => i.investedValue,
      current: i => i.currentValue,
      loss: i => i.unrealizedLoss,
      savings: i => i.potentialSavings,
    })
  }, [taxOpportunities, searchTerm, taxFilter, sortConfig])

  const tabs = [
    { id: 'health' as const, label: 'Portfolio Health', count: healthItems.length },
    { id: 'rebalancing' as const, label: 'Rebalancing', count: rebalancingAlerts.length },
    { id: 'goals' as const, label: 'Goals', count: goalAlerts.filter(g => g.status !== 'ON_TRACK').length },
    { id: 'tax' as const, label: 'Tax Harvesting', count: taxOpportunities.length },
  ]

  const avgHealthScore = useMemo(() => {
    if (!healthItems.length) return 0
    return Math.round(healthItems.reduce((s, h) => s + h.score, 0) / healthItems.length)
  }, [healthItems])

  const totalTaxSavings = useMemo(() => {
    return taxOpportunities.reduce((s, t) => s + t.potentialSavings, 0)
  }, [taxOpportunities])

  const hasActiveFilters = searchTerm || healthFilter !== 'All' || rebalanceFilter !== 'All' || goalFilter !== 'All' || taxFilter !== 'All'

  const clearFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setHealthFilter('All')
    setRebalanceFilter('All')
    setGoalFilter('All')
    setTaxFilter('All')
    setSortConfig({ column: '', direction: 'desc' })
  }

  // Sort icon helper
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

  const theadStyle = {
    background: isDark
      ? 'linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)'
      : 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)',
    borderBottom: `1px solid ${colors.cardBorder}`,
  }

  const thClass = 'text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th'
  const rowHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.background = isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)',
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => e.currentTarget.style.background = 'transparent',
  }

  const selectStyle = (isActive: boolean) => ({
    background: colors.inputBg,
    border: `1px solid ${isActive ? colors.primary : colors.inputBorder}`,
    color: isActive ? colors.primary : colors.textSecondary,
  })

  if (loading) {
    return (
      <AdvisorLayout title="Insights">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
            />
            <span className="text-sm" style={{ color: colors.textSecondary }}>Loading insights...</span>
          </div>
        </div>
      </AdvisorLayout>
    )
  }

  return (
    <AdvisorLayout title="Insights">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            AI-powered analysis across {healthItems.length} client portfolios
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: `${colors.error}15`, border: `1px solid ${colors.error}30` }}>
            <p className="text-sm" style={{ color: colors.error }}>{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FAStatCard
            label="Avg Health Score"
            value={avgHealthScore.toString()}
            change={`${healthItems.length} clients`}
            accentColor={colors.primary}
          />
          <FAStatCard
            label="Rebalancing Alerts"
            value={rebalancingAlerts.length.toString()}
            change="Drift > 5%"
            accentColor={colors.warning}
          />
          <FAStatCard
            label="Goals At Risk"
            value={goalAlerts.filter(g => g.status !== 'ON_TRACK').length.toString()}
            change="Behind schedule"
            accentColor={colors.error}
          />
          <FAStatCard
            label="Tax Savings"
            value={formatCurrencyCompact(totalTaxSavings)}
            change={`${taxOpportunities.length} opportunities`}
            accentColor={colors.success}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {tabs.map((tab) => (
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
              {tab.count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : colors.chipBg,
                    color: activeTab === tab.id ? '#FFFFFF' : colors.textTertiary,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <FACard className="mb-4">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: colors.textTertiary }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={activeTab === 'tax' ? 'Search client or fund...' : activeTab === 'goals' ? 'Search client or goal...' : 'Search client...'}
                  value={searchInput}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg text-sm focus:outline-none"
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              <div className="w-px h-6" style={{ background: colors.cardBorder }} />

              {/* Tab-specific filter */}
              {activeTab === 'health' && (
                <select
                  value={healthFilter}
                  onChange={e => setHealthFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
                  style={selectStyle(healthFilter !== 'All')}
                >
                  <option value="All">All Status</option>
                  <option value="healthy">Healthy</option>
                  <option value="needs_attention">Needs Attention</option>
                  <option value="critical">Critical</option>
                </select>
              )}
              {activeTab === 'rebalancing' && (
                <select
                  value={rebalanceFilter}
                  onChange={e => setRebalanceFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
                  style={selectStyle(rebalanceFilter !== 'All')}
                >
                  <option value="All">All Actions</option>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </select>
              )}
              {activeTab === 'goals' && (
                <select
                  value={goalFilter}
                  onChange={e => setGoalFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
                  style={selectStyle(goalFilter !== 'All')}
                >
                  <option value="All">All Status</option>
                  <option value="ON_TRACK">On Track</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="OFF_TRACK">Off Track</option>
                </select>
              )}
              {activeTab === 'tax' && (
                <select
                  value={taxFilter}
                  onChange={e => setTaxFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
                  style={selectStyle(taxFilter !== 'All')}
                >
                  <option value="All">All Holdings</option>
                  <option value="short_term">Short Term</option>
                  <option value="long_term">Long Term</option>
                </select>
              )}

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                  style={{ color: colors.primary, background: colors.chipBg }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </FACard>

        {/* ========== PORTFOLIO HEALTH ========== */}
        {activeTab === 'health' && (
          <FACard padding="none" className="overflow-hidden">
            {filteredHealth.length === 0 ? (
              <div className="py-8">
                <FAEmptyState
                  icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  title={hasActiveFilters ? 'No matching clients' : 'No Health Data'}
                  description={hasActiveFilters ? 'Try adjusting your filters' : 'Add clients to see portfolio health analysis'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={theadStyle}>
                    <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('client')}>
                      Client{sortIcon('client')}
                    </th>
                    <th className={`text-center px-4 py-3 w-28 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('score')}>
                      Score{sortIcon('score')}
                    </th>
                    <th className={`text-center px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('status')}>
                      Status{sortIcon('status')}
                    </th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('aum')}>
                      AUM{sortIcon('aum')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Issues</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHealth.map((item) => {
                    const statusColor = getHealthColor(item.status, colors)
                    const isExpanded = expandedClients.has(item.clientId)
                    return [
                      <tr
                        key={item.clientId}
                        className="transition-colors cursor-pointer"
                        style={{
                          borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}`,
                          background: isExpanded ? (isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)') : 'transparent',
                        }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)' }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                      >
                        <td className="px-4 py-3" onClick={(e) => toggleExpanded(item.clientId, e)}>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-3.5 h-3.5 transition-transform flex-shrink-0"
                              style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{item.clientName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => toggleExpanded(item.clientId, e)}>
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${item.score}%`, background: statusColor }}
                              />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: statusColor }}>{item.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => toggleExpanded(item.clientId, e)}>
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                            style={{ background: `${statusColor}15`, color: statusColor }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                            {getHealthLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: colors.textPrimary }} onClick={(e) => toggleExpanded(item.clientId, e)}>
                          {formatCurrencyCompact(item.aum)}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => toggleExpanded(item.clientId, e)}>
                          {item.issues.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.issues.map((issue, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.warning}12`, color: colors.warning }}>
                                  {issue}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: colors.textTertiary }}>--</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <button
                            onClick={() => router.push(`/advisor/clients/${item.clientId}`)}
                            className="p-1 rounded-lg transition-colors"
                            style={{ color: colors.textTertiary }}
                            title="View client"
                            onMouseEnter={e => e.currentTarget.style.color = colors.primary}
                            onMouseLeave={e => e.currentTarget.style.color = colors.textTertiary}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </button>
                        </td>
                      </tr>,
                      isExpanded && (
                        <DeepAnalysisPanel
                          key={`deep-${item.clientId}`}
                          clientId={item.clientId}
                          clientName={item.clientName}
                        />
                      ),
                    ]
                  })}
                </tbody>
              </table>
              </div>
            )}
          </FACard>
        )}

        {/* ========== REBALANCING ========== */}
        {activeTab === 'rebalancing' && (
          <FACard padding="none" className="overflow-hidden">
            {filteredRebalancing.length === 0 ? (
              <div className="py-8">
                <FAEmptyState
                  icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" /></svg>}
                  title={hasActiveFilters ? 'No matching alerts' : 'All Balanced'}
                  description={hasActiveFilters ? 'Try adjusting your filters' : 'No portfolios have significant allocation drift'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={theadStyle}>
                    <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('client')}>Client{sortIcon('client')}</th>
                    <th className={`text-center px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('assetClass')}>Asset Class{sortIcon('assetClass')}</th>
                    <th className={`text-center px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('action')}>Action{sortIcon('action')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('current')}>Current{sortIcon('current')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('target')}>Target{sortIcon('target')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('drift')}>Drift{sortIcon('drift')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('amount')}>Amount{sortIcon('amount')}</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRebalancing.map((alert, i) => {
                    const actionColor = alert.action === 'decrease' ? colors.warning : colors.primary
                    return (
                      <tr
                        key={`${alert.clientId}-${alert.assetClass}-${i}`}
                        onClick={() => router.push(`/advisor/clients/${alert.clientId}`)}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                        {...rowHover}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{alert.clientName}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.textPrimary }}>{alert.assetClass}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${actionColor}15`, color: actionColor }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={alert.action === 'decrease' ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7m0 0l7 7m-7-7v18'} />
                            </svg>
                            {alert.action === 'decrease' ? 'Reduce' : 'Increase'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: colors.textPrimary }}>{alert.currentAllocation.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right text-sm" style={{ color: colors.textSecondary }}>{alert.targetAllocation.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold" style={{ color: actionColor }}>{Math.abs(alert.deviation).toFixed(1)}%</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm" style={{ color: colors.textSecondary }}>{formatCurrencyCompact(alert.amount)}</td>
                        <td className="px-2 py-3">
                          <svg className="w-4 h-4" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </FACard>
        )}

        {/* ========== GOALS ========== */}
        {activeTab === 'goals' && (
          <FACard padding="none" className="overflow-hidden">
            {filteredGoals.length === 0 ? (
              <div className="py-8">
                <FAEmptyState
                  icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>}
                  title={hasActiveFilters ? 'No matching goals' : 'All Goals On Track'}
                  description={hasActiveFilters ? 'Try adjusting your filters' : 'No client goals are currently at risk'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={theadStyle}>
                    <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('goal')}>Goal{sortIcon('goal')}</th>
                    <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('client')}>Client{sortIcon('client')}</th>
                    <th className={`text-center px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('status')}>Status{sortIcon('status')}</th>
                    <th className={`text-center px-4 py-3 w-40 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('progress')}>Progress{sortIcon('progress')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('current')}>Current{sortIcon('current')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('target')}>Target{sortIcon('target')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('daysLeft')}>Days Left{sortIcon('daysLeft')}</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.map((goal, i) => {
                    const statusColor = getGoalStatusColor(goal.status, colors)
                    return (
                      <tr
                        key={`${goal.clientId}-${goal.goalName}-${i}`}
                        onClick={() => router.push(`/advisor/clients/${goal.clientId}`)}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                        {...rowHover}
                      >
                        <td className="px-4 py-3"><p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{goal.goalName}</p></td>
                        <td className="px-4 py-3"><p className="text-sm" style={{ color: colors.textSecondary }}>{goal.clientName}</p></td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${statusColor}15`, color: statusColor }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                            {getGoalStatusLabel(goal.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(goal.progress, 100)}%`, background: statusColor }} />
                            </div>
                            <span className="text-xs font-medium w-8 text-right" style={{ color: statusColor }}>{goal.progress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrencyCompact(goal.currentAmount)}</td>
                        <td className="px-4 py-3 text-right text-sm" style={{ color: colors.textSecondary }}>{formatCurrencyCompact(goal.targetAmount)}</td>
                        <td className="px-4 py-3 text-right text-sm" style={{ color: colors.textSecondary }}>{goal.daysRemaining}</td>
                        <td className="px-2 py-3">
                          <svg className="w-4 h-4" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </FACard>
        )}

        {/* ========== TAX HARVESTING ========== */}
        {activeTab === 'tax' && (
          <FACard padding="none" className="overflow-hidden">
            {filteredTax.length === 0 ? (
              <div className="py-8">
                <FAEmptyState
                  icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
                  title={hasActiveFilters ? 'No matching opportunities' : 'No Harvesting Opportunities'}
                  description={hasActiveFilters ? 'Try adjusting your filters' : 'No holdings with unrealized losses found'}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={theadStyle}>
                    <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('fund')}>Fund{sortIcon('fund')}</th>
                    <th className={`text-left px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('client')}>Client{sortIcon('client')}</th>
                    <th className={`text-center px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('holding')}>Holding{sortIcon('holding')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('invested')}>Invested{sortIcon('invested')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('current')}>Current{sortIcon('current')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('loss')}>Loss{sortIcon('loss')}</th>
                    <th className={`text-right px-4 py-3 ${thClass}`} style={{ color: colors.primary }} onClick={() => handleSort('savings')}>Est. Savings{sortIcon('savings')}</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTax.map((opp, i) => (
                    <tr
                      key={`${opp.clientId}-${opp.fundName}-${i}`}
                      onClick={() => router.push(`/advisor/clients/${opp.clientId}`)}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                      {...rowHover}
                    >
                      <td className="px-4 py-3"><p className="text-sm font-medium truncate max-w-[200px]" style={{ color: colors.textPrimary }}>{opp.fundName}</p></td>
                      <td className="px-4 py-3"><p className="text-sm" style={{ color: colors.textSecondary }}>{opp.clientName}</p></td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.textPrimary }}>
                          {opp.holdingPeriod === 'short_term' ? 'Short' : 'Long'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm" style={{ color: colors.textPrimary }}>{formatCurrencyCompact(opp.investedValue)}</td>
                      <td className="px-4 py-3 text-right text-sm" style={{ color: colors.textSecondary }}>{formatCurrencyCompact(opp.currentValue)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: colors.error }}>-{formatCurrencyCompact(opp.unrealizedLoss)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: colors.success }}>{formatCurrencyCompact(opp.potentialSavings)}</td>
                      <td className="px-2 py-3">
                        <svg className="w-4 h-4" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </FACard>
        )}

      </div>
    </AdvisorLayout>
  )
}

export default InsightsPage
