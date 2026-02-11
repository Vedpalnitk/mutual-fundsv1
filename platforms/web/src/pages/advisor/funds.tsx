import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { dbFundsApi, DatabaseFund } from '@/services/api'
import { useFATheme, getAssetClassColor, getRiskRatingInfo, ASSET_CLASS_LABELS } from '@/utils/fa'
import { FAStatCard } from '@/components/advisor/shared'

// Asset class values from backend (lowercase)
type AssetClass = 'equity' | 'debt' | 'hybrid' | 'liquid' | 'gold' | 'international'

const assetClasses: AssetClass[] = ['equity', 'debt', 'hybrid', 'liquid']

const FundsPage = () => {
  const { colors, isDark } = useFATheme()
  const router = useRouter()

  const [funds, setFunds] = useState<DatabaseFund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<DatabaseFund[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [filterAssetClass, setFilterAssetClass] = useState<string>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [sortColumn, setSortColumn] = useState('return1Y')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  // Load all funds from database on mount
  useEffect(() => {
    const loadFunds = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await dbFundsApi.getAllFunds()
        setFunds(data)
      } catch (err) {
        console.error('Failed to load funds:', err)
        const message = err instanceof Error ? err.message : 'Failed to load funds'
        if (message.includes('fetch') || message.includes('network')) {
          setError('Cannot connect to server. Make sure the backend is running on port 3501.')
        } else {
          setError(message)
        }
      } finally {
        setLoading(false)
      }
    }
    loadFunds()
  }, [])

  // Client-side search filtering
  const searchFunds = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    const lowerQuery = query.toLowerCase()
    const results = funds.filter(fund =>
      fund.schemeName.toLowerCase().includes(lowerQuery) ||
      fund.fundHouse.toLowerCase().includes(lowerQuery) ||
      fund.category.toLowerCase().includes(lowerQuery) ||
      (fund.subCategory && fund.subCategory.toLowerCase().includes(lowerQuery))
    )
    setSearchResults(results)
    setSearching(false)
  }, [funds])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchFunds(searchTerm)
      } else {
        setSearchResults(null)
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [searchTerm, searchFunds])

  const getCategoryColor = (assetClass: string) => getAssetClassColor(assetClass, colors)

  const displayFunds = searchResults !== null ? searchResults : funds

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDir(col === 'schemeName' || col === 'fundHouse' ? 'asc' : 'desc')
    }
  }

  const sortIcon = (col: string) => {
    if (sortColumn === col) {
      return (
        <svg className="w-3 h-3 ml-0.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      )
    }
    return (
      <svg className="w-3 h-3 ml-0.5 inline-block opacity-0 group-hover/th:opacity-30 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }

  const filteredAndSorted = useMemo(() => {
    const filtered = displayFunds.filter(fund => {
      const matchesAssetClass = filterAssetClass === 'all' || fund.assetClass === filterAssetClass
      const matchesRisk = filterRisk === 'all' || fund.riskRating?.toString() === filterRisk
      return matchesAssetClass && matchesRisk
    })

    const getters: Record<string, (f: DatabaseFund) => string | number> = {
      schemeName: f => f.schemeName.toLowerCase(),
      fundHouse: f => f.fundHouse.toLowerCase(),
      nav: f => f.currentNav,
      dayChange: f => f.dayChangePercent,
      return1Y: f => f.return1Y ?? -999,
      return3Y: f => f.return3Y ?? -999,
      return5Y: f => f.return5Y ?? -999,
      risk: f => f.riskRating ?? 0,
      expense: f => f.expenseRatio ?? 0,
    }
    const getter = getters[sortColumn]
    if (!getter) return filtered

    return [...filtered].sort((a, b) => {
      const aVal = getter(a), bVal = getter(b)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })
  }, [displayFunds, filterAssetClass, filterRisk, sortColumn, sortDir])

  const totalItems = filteredAndSorted.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const paginatedFunds = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredAndSorted.slice(start, start + PAGE_SIZE)
  }, [filteredAndSorted, page])
  const startItem = (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, totalItems)

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [filterAssetClass, filterRisk, searchResults])

  // Stats
  const stats = useMemo(() => {
    const total = filteredAndSorted.length
    const equity = filteredAndSorted.filter(f => f.assetClass === 'equity').length
    const avgReturn = total > 0
      ? filteredAndSorted.reduce((s, f) => s + (f.return1Y ?? 0), 0) / total
      : 0
    const topPerformers = filteredAndSorted.filter(f => (f.return1Y ?? 0) >= 20).length
    return { total, equity, avgReturn, topPerformers }
  }, [filteredAndSorted])

  const handleFundClick = (fund: DatabaseFund) => {
    router.push(`/advisor/fund/${fund.schemeCode}`)
  }

  const formatReturn = (val: number | undefined) => {
    if (val === undefined) return '-'
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`
  }

  return (
    <AdvisorLayout title="Fund Universe">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Browse and recommend funds to your clients
          </p>
          <span className="text-sm" style={{ color: colors.textTertiary }}>
            {filteredAndSorted.length} funds
          </span>
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FAStatCard label="Total Funds" value={stats.total.toLocaleString('en-IN')} change="In database" accentColor={colors.primary} />
          <FAStatCard label="Equity Funds" value={stats.equity.toLocaleString('en-IN')} change="Most popular" accentColor={colors.secondary || colors.primaryDark} />
          <FAStatCard label="Avg 1Y Return" value={`${stats.avgReturn > 0 ? '+' : ''}${stats.avgReturn.toFixed(1)}%`} change="Filtered funds" accentColor={colors.success} />
          <FAStatCard label="Top Performers" value={stats.topPerformers.toLocaleString('en-IN')} change="1Y return ≥ 20%" accentColor={colors.warning} />
        </div>

        {/* Filters Bar */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-6"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search funds by name or AMC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg text-sm focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                />
              </div>
            )}
          </div>

          <div className="w-px h-6" style={{ background: colors.cardBorder }} />

          {/* Asset Class filter */}
          <select
            value={filterAssetClass}
            onChange={(e) => setFilterAssetClass(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
            style={{
              background: colors.inputBg,
              border: `1px solid ${filterAssetClass !== 'all' ? colors.primary : colors.inputBorder}`,
              color: filterAssetClass !== 'all' ? colors.primary : colors.textSecondary,
            }}
          >
            <option value="all">All Categories</option>
            {assetClasses.map(ac => (
              <option key={ac} value={ac}>{ASSET_CLASS_LABELS[ac] || ac}</option>
            ))}
          </select>

          {/* Risk filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
            style={{
              background: colors.inputBg,
              border: `1px solid ${filterRisk !== 'all' ? colors.primary : colors.inputBorder}`,
              color: filterRisk !== 'all' ? colors.primary : colors.textSecondary,
            }}
          >
            <option value="all">All Risk Levels</option>
            <option value="1">Low Risk</option>
            <option value="2">Moderately Low</option>
            <option value="3">Moderate</option>
            <option value="4">Moderately High</option>
            <option value="5">Very High Risk</option>
          </select>

          {/* Clear filters */}
          {(searchTerm || filterAssetClass !== 'all' || filterRisk !== 'all') && (
            <>
              <div className="w-px h-6" style={{ background: colors.cardBorder }} />
              <button
                onClick={() => { setSearchTerm(''); setSearchResults(null); setFilterAssetClass('all'); setFilterRisk('all') }}
                className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                style={{ color: colors.primary, background: colors.chipBg }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </>
          )}
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 20px ${colors.glassShadow}`,
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                />
                <span className="text-sm" style={{ color: colors.textSecondary }}>Loading funds...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium text-sm" style={{ color: colors.error }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold"
                style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
              >
                Retry
              </button>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-16" style={{ color: colors.textSecondary }}>
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="font-medium text-sm">No funds found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background: isDark
                      ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                      : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                    borderBottom: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('schemeName')}>
                    Fund{sortIcon('schemeName')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('risk')}>
                    Category / Risk{sortIcon('risk')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('nav')}>
                    NAV{sortIcon('nav')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('dayChange')}>
                    Day{sortIcon('dayChange')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('return1Y')}>
                    1Y{sortIcon('return1Y')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('return3Y')}>
                    3Y{sortIcon('return3Y')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('return5Y')}>
                    5Y{sortIcon('return5Y')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th hidden xl:table-cell" style={{ color: colors.primary }} onClick={() => handleSort('expense')}>
                    TER{sortIcon('expense')}
                  </th>
                  <th className="w-8 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedFunds.map((fund) => {
                  const riskInfo = getRiskRatingInfo(fund.riskRating)
                  const catColor = getCategoryColor(fund.assetClass)
                  return (
                    <tr
                      key={fund.schemeCode}
                      onClick={() => handleFundClick(fund)}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? colors.backgroundTertiary : colors.backgroundSecondary}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-4 py-3 max-w-[320px]">
                        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{fund.schemeName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs truncate" style={{ color: colors.textTertiary }}>{fund.fundHouse}</span>
                          {fund.fundRating && fund.fundRating > 0 && (
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className="w-2.5 h-2.5"
                                  fill={i < fund.fundRating! ? colors.warning : 'none'}
                                  stroke={colors.warning}
                                  strokeWidth={1.5}
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded"
                            style={{ background: `${catColor}15`, color: catColor }}
                          >
                            {ASSET_CLASS_LABELS[fund.assetClass] || fund.assetClass}
                          </span>
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded"
                            style={{ background: `${riskInfo.color}15`, color: riskInfo.color }}
                          >
                            {riskInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap" style={{ color: colors.textPrimary }}>
                        ₹{fund.currentNav.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap" style={{ color: fund.dayChangePercent >= 0 ? colors.success : colors.error }}>
                        {fund.dayChangePercent >= 0 ? '+' : ''}{fund.dayChangePercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap" style={{ color: (fund.return1Y ?? 0) >= 15 ? colors.success : colors.textPrimary }}>
                        {formatReturn(fund.return1Y)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap" style={{ color: colors.textSecondary }}>
                        {formatReturn(fund.return3Y)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap" style={{ color: colors.textSecondary }}>
                        {formatReturn(fund.return5Y)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap hidden xl:table-cell" style={{ color: colors.textTertiary }}>
                        {fund.expenseRatio !== undefined && fund.expenseRatio > 0 ? `${fund.expenseRatio.toFixed(2)}%` : '-'}
                      </td>
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

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                >
                  <p className="text-sm" style={{ color: colors.textTertiary }}>
                    {startItem}-{endItem} of {totalItems.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{ color: colors.textSecondary }}
                      title="First page"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{ color: colors.textSecondary }}
                      title="Previous page"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | '...')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((p, i) =>
                        p === '...' ? (
                          <span key={`ellipsis-${i}`} className="px-1 text-sm" style={{ color: colors.textTertiary }}>...</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                            style={{
                              background: page === p ? colors.primary : 'transparent',
                              color: page === p ? 'white' : colors.textSecondary,
                            }}
                          >
                            {p}
                          </button>
                        )
                    )}

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{ color: colors.textSecondary }}
                      title="Next page"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{ color: colors.textSecondary }}
                      title="Last page"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdvisorLayout>
  )
}

export default FundsPage
