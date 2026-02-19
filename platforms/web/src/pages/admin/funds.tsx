import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminPagination } from '@/components/admin/shared'
import { useAdminColors, useDarkMode } from '@/utils/useAdminColors'

// Alias for backward compatibility
const useV4Colors = useAdminColors

// Asset class colors (using Sage & Cream theme)
const ASSET_CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  equity: { bg: 'rgba(91, 138, 114, 0.1)', text: '#5B8A72' },
  debt: { bg: 'rgba(91, 138, 114, 0.08)', text: '#6B9A82' },
  hybrid: { bg: 'rgba(196, 164, 132, 0.1)', text: '#C4A484' },
  gold: { bg: 'rgba(212, 165, 116, 0.1)', text: '#D4A574' },
  international: { bg: 'rgba(107, 154, 196, 0.1)', text: '#6B9AC4' },
  liquid: { bg: 'rgba(138, 154, 145, 0.1)', text: '#8A9A91' },
}

interface Fund {
  scheme_code: number
  scheme_name: string
  fund_house: string
  category: string
  asset_class: string
  return_1y: number
  return_3y: number
  return_5y: number
  volatility: number
  sharpe_ratio: number
  expense_ratio: number
  nav: number
  last_updated: string
}

interface FundsResponse {
  funds: Fund[]
  total: number
  filters: {
    categories: string[]
    asset_classes: string[]
  }
}

interface SyncStatus {
  isSyncing: boolean
  lastSync: {
    syncType: string
    status: string
    recordsSynced: number | null
    startedAt: string
    completedAt: string | null
  } | null
  counts: {
    providers: number
    schemes: number
    schemePlans: number
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export default function FundsUniversePage() {
  const router = useRouter()
  const colors = useV4Colors()
  const isDark = useDarkMode()

  // State
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)

  // Filters
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'return_1y' | 'return_3y' | 'sharpe_ratio' | 'expense_ratio'>('return_1y')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Available filters
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableAssetClasses, setAvailableAssetClasses] = useState<string[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  useEffect(() => {
    loadFunds()
    loadSyncStatus()
  }, [selectedAssetClass, selectedCategory])

  const loadFunds = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedAssetClass) params.append('asset_class', selectedAssetClass)
      if (selectedCategory) params.append('category', selectedCategory)

      const queryString = params.toString()
      const response = await fetch(`${API_BASE}/api/v1/funds/live/ml/funds${queryString ? `?${queryString}` : ''}`)

      if (!response.ok) {
        throw new Error(`Failed to load funds: ${response.status}`)
      }

      const data: FundsResponse = await response.json()
      setFunds(data.funds)
      setAvailableCategories(data.filters.categories)
      setAvailableAssetClasses(data.filters.asset_classes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funds')
    } finally {
      setLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/funds/live/sync/status`)
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data)
      }
    } catch (err) {
      console.error('Failed to load sync status:', err)
    }
  }

  const syncFunds = async () => {
    try {
      setSyncing(true)
      const response = await fetch(`${API_BASE}/api/v1/funds/live/sync/popular`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`)
      }

      // Reload data after sync
      await loadFunds()
      await loadSyncStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  // Filter and sort funds
  const filteredFunds = useMemo(() => {
    return funds
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
  }, [funds, searchQuery, sortBy, sortOrder])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedAssetClass, selectedCategory, sortBy, sortOrder])

  // Pagination calculations
  const totalPages = Math.ceil(filteredFunds.length / itemsPerPage)
  const paginatedFunds = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredFunds.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredFunds, currentPage, itemsPerPage])

  const getReturnColor = (value: number) => {
    if (value >= 20) return colors.success
    if (value >= 10) return colors.primary
    if (value >= 0) return colors.textSecondary
    return colors.error
  }

  // Calculate stats from filtered funds
  const stats = {
    total: filteredFunds.length,
    avgReturn1y: filteredFunds.length > 0
      ? filteredFunds.reduce((sum, f) => sum + (f.return_1y || 0), 0) / filteredFunds.length
      : 0,
    avgReturn3y: filteredFunds.length > 0
      ? filteredFunds.reduce((sum, f) => sum + (f.return_3y || 0), 0) / filteredFunds.length
      : 0,
    avgExpense: filteredFunds.length > 0
      ? filteredFunds.reduce((sum, f) => sum + (f.expense_ratio || 0), 0) / filteredFunds.length
      : 0,
  }

  // Count by asset class
  const assetClassCounts: Record<string, number> = {}
  filteredFunds.forEach(fund => {
    assetClassCounts[fund.asset_class] = (assetClassCounts[fund.asset_class] || 0) + 1
  })

  return (
    <AdminLayout title="Funds Universe">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header with Sync Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Fund database synced from MFAPI.in - Used by ML recommendations
            </p>
            {syncStatus && (
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                {syncStatus.counts.schemePlans} funds synced from {syncStatus.counts.providers} AMCs
                {syncStatus.lastSync?.completedAt && (
                  <> • Last sync: {new Date(syncStatus.lastSync.completedAt).toLocaleString()}</>
                )}
              </p>
            )}
          </div>

          <button
            onClick={syncFunds}
            disabled={syncing}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`,
            }}
          >
            {syncing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 rounded-full" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Funds
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
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
              {stats.total}
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
              {stats.avgReturn1y.toFixed(1)}%
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
              {stats.avgReturn3y.toFixed(1)}%
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
              {stats.avgExpense.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Asset Class Distribution */}
        {Object.keys(assetClassCounts).length > 0 && (
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
              {Object.entries(assetClassCounts).map(([assetClass, count]) => (
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
              <button onClick={loadFunds} className="mt-4 px-4 py-2 rounded-full text-sm font-medium" style={{ background: colors.primary, color: 'white' }}>
                Retry
              </button>
            </div>
          ) : filteredFunds.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>No funds synced yet</p>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                Click &quot;Sync Funds&quot; to fetch fund data from MFAPI.in
              </p>
              <button
                onClick={syncFunds}
                disabled={syncing}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                }}
              >
                Sync Funds Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: `${colors.primary}08` }}>
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
                  {paginatedFunds.map((fund, idx) => (
                    <tr
                      key={fund.scheme_code}
                      className="transition-all cursor-pointer"
                      style={{
                        background: 'transparent',
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}
                      onClick={() => router.push(`/admin/fund/${fund.scheme_code}`)}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.chipBg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                          {fund.return_1y > 0 ? '+' : ''}{fund.return_1y?.toFixed(1) || '0.0'}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold" style={{ color: getReturnColor(fund.return_3y) }}>
                          {fund.return_3y > 0 ? '+' : ''}{fund.return_3y?.toFixed(1) || '0.0'}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm" style={{ color: fund.sharpe_ratio >= 1 ? colors.success : colors.textSecondary }}>
                          {fund.sharpe_ratio?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm" style={{ color: fund.expense_ratio <= 0.5 ? colors.success : colors.textSecondary }}>
                          {fund.expense_ratio?.toFixed(2) || '0.00'}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {filteredFunds.length > 0 && (
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredFunds.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage)
                    setCurrentPage(1)
                  }}
                  itemsPerPageOptions={[10, 25, 50, 100]}
                />
              )}
            </div>
          )}
        </div>

        {/* Data Source Info */}
        <div
          className="mt-8 p-4 rounded-xl"
          style={{
            background: isDark ? 'rgba(96, 165, 250, 0.06)' : 'rgba(37, 99, 235, 0.04)',
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h4 className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Data Architecture</h4>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Fund data flows: <strong>MFAPI.in</strong> → <strong>Sync</strong> → <strong>Database (SchemePlan)</strong> → <strong>ML Pipeline</strong>.
            Click &quot;Sync Funds&quot; to refresh with latest NAV data. The ML recommendation engine uses this synced data for persona-based fund recommendations.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
