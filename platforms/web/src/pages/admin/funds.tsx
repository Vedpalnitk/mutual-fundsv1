import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { fundsApi, Fund, FundsStatsResponse, liveFundsApi, LiveFundWithMetrics } from '@/services/api'

type DataSource = 'ml_database' | 'live_mfapi'

// V4 Color Palette - Refined Blue Theme (Light Mode)
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryDeep: '#1E40AF',
  accent: '#3B82F6',
  secondary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  glassBackground: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(37, 99, 235, 0.12)',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  inputBg: 'rgba(37, 99, 235, 0.02)',
  inputBorder: 'rgba(37, 99, 235, 0.12)',
  cardBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.06)',
  chipBorder: 'rgba(37, 99, 235, 0.12)',
  progressBg: 'rgba(37, 99, 235, 0.1)',
  cardBackground: '#FFFFFF',
}

// V4 Color Palette - Refined Blue Theme (Dark Mode)
const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryDeep: '#2563EB',
  accent: '#93C5FD',
  secondary: '#38BDF8',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  background: '#0B1120',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1E293B',
  glassBackground: 'rgba(17, 24, 39, 0.88)',
  glassBorder: 'rgba(96, 165, 250, 0.12)',
  glassShadow: 'rgba(0, 0, 0, 0.35)',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  inputBg: 'rgba(96, 165, 250, 0.06)',
  inputBorder: 'rgba(96, 165, 250, 0.15)',
  cardBg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.08)',
  chipBorder: 'rgba(96, 165, 250, 0.15)',
  progressBg: 'rgba(96, 165, 250, 0.15)',
  cardBackground: '#111827',
}

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkClass = document.documentElement.classList.contains('dark')
      const isDarkMedia = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isLightClass = document.documentElement.classList.contains('light')
      setIsDark(isDarkClass || (isDarkMedia && !isLightClass))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  return isDark
}

const useV4Colors = () => {
  const isDark = useDarkMode()
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT
}

// Asset class colors
const ASSET_CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  equity: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563EB' },
  debt: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
  hybrid: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' },
  gold: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' },
  international: { bg: 'rgba(236, 72, 153, 0.1)', text: '#EC4899' },
  liquid: { bg: 'rgba(6, 182, 212, 0.1)', text: '#06B6D4' },
}

export default function FundsUniversePage() {
  const colors = useV4Colors()
  const isDark = useDarkMode()

  // Data source toggle - default to live data
  const [dataSource, setDataSource] = useState<DataSource>('live_mfapi')

  // ML Database state
  const [funds, setFunds] = useState<Fund[]>([])
  const [stats, setStats] = useState<FundsStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Live MFAPI state
  const [liveFunds, setLiveFunds] = useState<LiveFundWithMetrics[]>([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [liveSearchQuery, setLiveSearchQuery] = useState('')

  // Filters
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'return_1y' | 'return_3y' | 'sharpe_ratio' | 'expense_ratio'>('return_1y')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Available filters
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableAssetClasses, setAvailableAssetClasses] = useState<string[]>([])

  useEffect(() => {
    if (dataSource === 'ml_database') {
      loadData()
    }
  }, [selectedAssetClass, selectedCategory, dataSource])

  useEffect(() => {
    if (dataSource === 'live_mfapi') {
      loadPopularFunds()
    }
  }, [dataSource])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [fundsData, statsData] = await Promise.all([
        fundsApi.getFunds({
          asset_class: selectedAssetClass || undefined,
          category: selectedCategory || undefined,
        }),
        fundsApi.getStats(),
      ])

      setFunds(fundsData.funds)
      setStats(statsData)
      setAvailableCategories(fundsData.filters.categories)
      setAvailableAssetClasses(fundsData.filters.asset_classes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funds')
    } finally {
      setLoading(false)
    }
  }

  const loadPopularFunds = async () => {
    try {
      setLiveLoading(true)
      setLiveError(null)
      const data = await liveFundsApi.getPopular()
      setLiveFunds(data)
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Failed to load live funds')
    } finally {
      setLiveLoading(false)
    }
  }

  const searchLiveFunds = async () => {
    if (!liveSearchQuery || liveSearchQuery.length < 2) return

    try {
      setLiveLoading(true)
      setLiveError(null)
      const results = await liveFundsApi.search(liveSearchQuery)
      // Get details for first 10 results
      if (results.length > 0) {
        const schemeCodes = results.slice(0, 10).map(r => r.schemeCode)
        const fundsWithMetrics = await liveFundsApi.getBatchDetails(schemeCodes)
        setLiveFunds(fundsWithMetrics)
      } else {
        setLiveFunds([])
      }
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLiveLoading(false)
    }
  }

  // Filter and sort funds
  const filteredFunds = funds
    .filter(fund => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          fund.scheme_name.toLowerCase().includes(query) ||
          fund.fund_house.toLowerCase().includes(query) ||
          fund.category.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      const aVal = a[sortBy] || 0
      const bVal = b[sortBy] || 0
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })

  const getReturnColor = (value: number) => {
    if (value >= 20) return colors.success
    if (value >= 10) return colors.primary
    if (value >= 0) return colors.textSecondary
    return colors.error
  }

  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      <Navbar mode="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                Funds Universe
              </h1>
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
              >
                Admin
              </span>
            </div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {dataSource === 'ml_database'
                ? 'Complete fund database available for portfolio recommendations'
                : 'Live fund data from MFAPI.in - Real-time NAV and metrics'}
            </p>
          </div>

          {/* Data Source Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setDataSource('ml_database')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: dataSource === 'ml_database'
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.chipBg,
                color: dataSource === 'ml_database' ? 'white' : colors.textSecondary,
                border: `1px solid ${dataSource === 'ml_database' ? 'transparent' : colors.chipBorder}`,
              }}
            >
              ML Database
            </button>
            <button
              onClick={() => setDataSource('live_mfapi')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: dataSource === 'live_mfapi'
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.chipBg,
                color: dataSource === 'live_mfapi' ? 'white' : colors.textSecondary,
                border: `1px solid ${dataSource === 'live_mfapi' ? 'transparent' : colors.chipBorder}`,
              }}
            >
              Live MFAPI
            </button>
          </div>
        </div>

        {/* ML Database View */}
        {dataSource === 'ml_database' && (
          <>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div
              className="p-4 rounded-3xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(14, 165, 233, 0.03) 100%)',
                backdropFilter: 'blur(24px)',
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                TOTAL FUNDS
              </p>
              <p className="text-2xl font-bold mt-2" style={{ color: colors.textPrimary }}>
                {stats.total_funds}
              </p>
            </div>

            <div
              className="p-4 rounded-3xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(52, 211, 153, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%)',
                border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)'}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.success }}>
                AVG 1Y RETURN
              </p>
              <p className="text-2xl font-bold mt-2" style={{ color: colors.success }}>
                {stats.averages.return_1y.toFixed(1)}%
              </p>
            </div>

            <div
              className="p-4 rounded-3xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(14, 165, 233, 0.03) 100%)',
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                AVG 3Y RETURN
              </p>
              <p className="text-2xl font-bold mt-2" style={{ color: colors.textPrimary }}>
                {stats.averages.return_3y.toFixed(1)}%
              </p>
            </div>

            <div
              className="p-4 rounded-3xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.03) 100%)',
                border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)'}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.warning }}>
                AVG EXPENSE
              </p>
              <p className="text-2xl font-bold mt-2" style={{ color: colors.warning }}>
                {stats.averages.expense_ratio.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        {/* Asset Class Distribution */}
        {stats && (
          <div
            className="p-5 rounded-xl mb-8"
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: `0 4px 24px ${colors.glassShadow}`,
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
              ASSET CLASS DISTRIBUTION
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.by_asset_class).map(([assetClass, count]) => (
                <button
                  key={assetClass}
                  onClick={() => setSelectedAssetClass(selectedAssetClass === assetClass ? '' : assetClass)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedAssetClass === assetClass ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{
                    background: ASSET_CLASS_COLORS[assetClass]?.bg || colors.chipBg,
                    color: ASSET_CLASS_COLORS[assetClass]?.text || colors.primary,
                  }}
                >
                  {assetClass.charAt(0).toUpperCase() + assetClass.slice(1)}: {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div
          className="p-5 rounded-xl mb-6"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                SEARCH
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search funds..."
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                CATEGORY
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              >
                <option value="">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                SORT BY
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              >
                <option value="return_1y">1Y Return</option>
                <option value="return_3y">3Y Return</option>
                <option value="sharpe_ratio">Sharpe Ratio</option>
                <option value="expense_ratio">Expense Ratio</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                ORDER
              </label>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Funds Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto mb-4" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
              <p style={{ color: colors.textSecondary }}>Loading funds...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p style={{ color: colors.error }}>{error}</p>
              <button onClick={loadData} className="mt-4 px-4 py-2 rounded-full text-sm font-medium" style={{ background: colors.primary, color: 'white' }}>
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: colors.backgroundTertiary }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Fund Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Asset Class</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>1Y Return</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>3Y Return</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Sharpe</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFunds.map((fund, idx) => (
                    <tr
                      key={fund.scheme_code}
                      className="transition-colors"
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : colors.backgroundSecondary,
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{fund.scheme_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{fund.fund_house}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>{fund.category}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            background: ASSET_CLASS_COLORS[fund.asset_class]?.bg || colors.chipBg,
                            color: ASSET_CLASS_COLORS[fund.asset_class]?.text || colors.primary,
                          }}
                        >
                          {fund.asset_class}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold" style={{ color: getReturnColor(fund.return_1y) }}>
                          {fund.return_1y > 0 ? '+' : ''}{fund.return_1y.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold" style={{ color: getReturnColor(fund.return_3y) }}>
                          {fund.return_3y > 0 ? '+' : ''}{fund.return_3y.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm" style={{ color: fund.sharpe_ratio >= 1 ? colors.success : colors.textSecondary }}>
                          {fund.sharpe_ratio.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm" style={{ color: fund.expense_ratio <= 0.5 ? colors.success : colors.textSecondary }}>
                          {fund.expense_ratio.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredFunds.length === 0 && (
                <div className="p-12 text-center">
                  <p style={{ color: colors.textTertiary }}>No funds match your filters</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fund Count */}
        <div className="mt-4 text-center">
          <p className="text-sm" style={{ color: colors.textTertiary }}>
            Showing {filteredFunds.length} of {funds.length} funds
          </p>
        </div>

        {/* Data Source Info */}
        <div
          className="mt-8 p-4 rounded-xl"
          style={{
            background: isDark ? 'rgba(96, 165, 250, 0.06)' : 'rgba(37, 99, 235, 0.04)',
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h4 className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Data Source</h4>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Fund data is sourced from the ML Service&apos;s internal database. This curated list of funds is used for
            persona-based recommendations. Returns and metrics are based on historical NAV data.
          </p>
        </div>
          </>
        )}

        {/* Live MFAPI View */}
        {dataSource === 'live_mfapi' && (
          <>
            {/* Live Search */}
            <div
              className="p-5 rounded-xl mb-6"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`,
              }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
                SEARCH LIVE FUNDS
              </h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={liveSearchQuery}
                  onChange={e => setLiveSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchLiveFunds()}
                  placeholder="Search for funds (e.g., 'HDFC Bluechip', 'Axis Small Cap')"
                  className="flex-1 h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textPrimary,
                  }}
                />
                <button
                  onClick={searchLiveFunds}
                  disabled={liveLoading || liveSearchQuery.length < 2}
                  className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    boxShadow: `0 4px 14px ${colors.glassShadow}`,
                  }}
                >
                  {liveLoading ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={loadPopularFunds}
                  disabled={liveLoading}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: colors.chipBg,
                    color: colors.primary,
                    border: `1px solid ${colors.chipBorder}`,
                  }}
                >
                  Show Popular
                </button>
              </div>
              <p className="text-xs mt-3" style={{ color: colors.textTertiary }}>
                Search by fund name, AMC, or category. Min 2 characters required. Popular funds shown by default.
              </p>
            </div>

            {/* Live Funds Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`,
              }}
            >
              {liveLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto mb-4" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
                  <p style={{ color: colors.textSecondary }}>Fetching live data from MFAPI.in...</p>
                </div>
              ) : liveError ? (
                <div className="p-12 text-center">
                  <p style={{ color: colors.error }}>{liveError}</p>
                  <button onClick={loadPopularFunds} className="mt-4 px-4 py-2 rounded-full text-sm font-medium" style={{ background: colors.primary, color: 'white' }}>
                    Retry
                  </button>
                </div>
              ) : liveFunds.length === 0 ? (
                <div className="p-12 text-center">
                  <p style={{ color: colors.textTertiary }}>No funds to display. Use the search above or click &quot;Show Popular&quot;.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: colors.backgroundTertiary }}>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Fund Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Asset Class</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>NAV</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>1Y Return</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>3Y Return</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Scheme Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveFunds.map((fund, idx) => (
                        <tr
                          key={fund.schemeCode}
                          className="transition-colors"
                          style={{
                            background: idx % 2 === 0 ? 'transparent' : colors.backgroundSecondary,
                            borderBottom: `1px solid ${colors.cardBorder}`,
                          }}
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{fund.schemeName}</p>
                              <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{fund.fundHouse}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="text-xs px-2 py-1 rounded-full font-medium"
                              style={{
                                background: ASSET_CLASS_COLORS[fund.assetClass]?.bg || colors.chipBg,
                                color: ASSET_CLASS_COLORS[fund.assetClass]?.text || colors.primary,
                              }}
                            >
                              {fund.assetClass}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                              ₹{fund.currentNav.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-semibold" style={{ color: getReturnColor(fund.return1Y || 0) }}>
                              {fund.return1Y !== undefined ? `${fund.return1Y > 0 ? '+' : ''}${fund.return1Y.toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-semibold" style={{ color: getReturnColor(fund.return3Y || 0) }}>
                              {fund.return3Y !== undefined ? `${fund.return3Y > 0 ? '+' : ''}${fund.return3Y.toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-xs px-2 py-1 rounded font-mono" style={{ background: colors.chipBg, color: colors.textSecondary }}>
                              {fund.schemeCode}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Fund Count */}
            <div className="mt-4 text-center">
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                Showing {liveFunds.length} funds from MFAPI.in
              </p>
            </div>

            {/* Live Data Info */}
            <div
              className="mt-8 p-4 rounded-xl"
              style={{
                background: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)',
                border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)'}`,
              }}
            >
              <h4 className="text-sm font-semibold mb-2" style={{ color: colors.success }}>Live Data Source</h4>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Fund data is fetched in real-time from MFAPI.in - a free public API for Indian mutual funds.
                NAV values are updated daily. Returns are calculated from historical NAV data.
                Scheme codes can be used to integrate funds into your portfolio recommendations.
              </p>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
