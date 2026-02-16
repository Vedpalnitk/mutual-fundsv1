/**
 * My Picks / Whitelisted Funds Page
 *
 * Advisors curate a yearly shortlist of recommended funds for their clients.
 * Supports year-based filtering, fund search/add modal, and remove with confirmation.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatDate, getRiskRatingInfo } from '@/utils/fa'
import {
  FACard,
  FAChip,
  FAButton,
  FAEmptyState,
  FASectionHeader,
  FASearchInput,
  FALoadingState,
  useNotification,
} from '@/components/advisor/shared'
import { whitelistApi, WhitelistedFund, AddToWhitelistRequest, dbFundsApi, DatabaseFund } from '@/services/api'

// ---- Helpers ----

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2]

const formatReturn = (val: number | undefined): string => {
  if (val === undefined || val === null) return '-'
  return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`
}

const returnColor = (val: number | undefined, colors: { success: string; error: string; textTertiary: string }): string => {
  if (val === undefined || val === null) return colors.textTertiary
  return val >= 0 ? colors.success : colors.error
}

// ---- Add Fund Modal ----

const AddFundModal = ({
  open,
  onClose,
  selectedYear,
  existingCodes,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  selectedYear: number
  existingCodes: Set<number>
  onAdded: (fund: WhitelistedFund) => void
}) => {
  const { colors, isDark } = useFATheme()
  const { success, error: showError } = useNotification()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DatabaseFund[]>([])
  const [searching, setSearching] = useState(false)
  const [addingCode, setAddingCode] = useState<number | null>(null)

  // Debounced search
  useEffect(() => {
    if (!open) return
    if (query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true)
        const data = await dbFundsApi.searchFunds(query)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, open])

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  const handleAdd = async (fund: DatabaseFund) => {
    try {
      setAddingCode(fund.schemeCode)
      const payload: AddToWhitelistRequest = {
        schemeCode: fund.schemeCode,
        year: selectedYear,
      }
      const added = await whitelistApi.add(payload)
      onAdded(added)
      success('Fund Added', `${fund.schemeName} added to ${selectedYear} picks`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add fund'
      showError('Error', msg)
    } finally {
      setAddingCode(null)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 24px 48px ${colors.glassShadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
        >
          <div>
            <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
              Add Fund to My Picks
            </h3>
            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
              Search and add funds to your {selectedYear} shortlist
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: colors.chipBg, color: colors.textTertiary }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <FASearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by fund name or AMC..."
          />
        </div>

        {/* Results */}
        <div
          className="px-6 pb-4 overflow-y-auto"
          style={{ maxHeight: '360px' }}
        >
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
              />
              <span className="ml-3 text-sm" style={{ color: colors.textSecondary }}>
                Searching...
              </span>
            </div>
          ) : query.length < 2 ? (
            <div className="text-center py-8">
              <svg
                className="w-10 h-10 mx-auto mb-3 opacity-40"
                style={{ color: colors.textTertiary }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                Type at least 2 characters to search
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: colors.textTertiary }}>
                No funds found for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((fund) => {
                const alreadyAdded = existingCodes.has(fund.schemeCode)
                const isAdding = addingCode === fund.schemeCode

                return (
                  <div
                    key={fund.schemeCode}
                    className="flex items-center justify-between p-3 rounded-xl transition-colors"
                    style={{
                      background: isDark
                        ? 'rgba(147, 197, 253, 0.04)'
                        : 'rgba(59, 130, 246, 0.02)',
                      border: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: colors.textPrimary }}
                      >
                        {fund.schemeName}
                      </p>
                      {fund.category && (
                        <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                          {fund.category}
                        </p>
                      )}
                    </div>

                    {alreadyAdded ? (
                      <span
                        className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
                        style={{ background: `${colors.success}15`, color: colors.success }}
                      >
                        Added
                      </span>
                    ) : (
                      <FAButton
                        size="sm"
                        loading={isAdding}
                        onClick={() => handleAdd(fund)}
                        icon={
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        }
                      >
                        Add
                      </FAButton>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Confirm Delete Dialog ----

const ConfirmDeleteDialog = ({
  open,
  fundName,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  fundName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) => {
  const { colors } = useFATheme()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 24px 48px ${colors.glassShadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${colors.error}15` }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: colors.error }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>
        <h3
          className="text-base font-semibold text-center mb-1"
          style={{ color: colors.textPrimary }}
        >
          Remove Fund?
        </h3>
        <p
          className="text-sm text-center mb-6"
          style={{ color: colors.textSecondary }}
        >
          Remove <strong>{fundName}</strong> from your picks? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: colors.chipBg,
              color: colors.textSecondary,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            Cancel
          </button>
          <FAButton
            variant="danger"
            className="flex-1"
            loading={loading}
            onClick={onConfirm}
          >
            Remove
          </FAButton>
        </div>
      </div>
    </div>
  )
}

// ---- Main Page ----

const MyPicksPage = () => {
  const { colors, isDark } = useFATheme()
  const router = useRouter()
  const { success, error: showError } = useNotification()

  // State
  const [funds, setFunds] = useState<WhitelistedFund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingFund, setDeletingFund] = useState<WhitelistedFund | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch all whitelisted funds on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await whitelistApi.getAll()
        setFunds(data)
      } catch (err) {
        console.error('Failed to load whitelisted funds:', err)
        const msg = err instanceof Error ? err.message : 'Failed to load picks'
        if (msg.includes('fetch') || msg.includes('network')) {
          setError('Cannot connect to server. Make sure the backend is running on port 3501.')
        } else {
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter by selected year
  const filteredFunds = useMemo(
    () => funds.filter((f) => f.year === selectedYear),
    [funds, selectedYear]
  )

  // Existing scheme codes for the selected year (used by Add Modal)
  const existingCodes = useMemo(
    () => new Set(filteredFunds.map((f) => f.schemeCode)),
    [filteredFunds]
  )

  // Summary stats
  const summary = useMemo(() => {
    const total = filteredFunds.length
    if (total === 0) return { total: 0, avg1Y: 0, avg3Y: 0, categories: {} as Record<string, number> }

    const sum1Y = filteredFunds.reduce((s, f) => s + (f.returns1y ?? 0), 0)
    const sum3Y = filteredFunds.reduce((s, f) => s + (f.returns3y ?? 0), 0)
    const count1Y = filteredFunds.filter((f) => f.returns1y !== undefined).length
    const count3Y = filteredFunds.filter((f) => f.returns3y !== undefined).length

    const categories: Record<string, number> = {}
    filteredFunds.forEach((f) => {
      const cat = f.schemeCategory || 'Other'
      categories[cat] = (categories[cat] || 0) + 1
    })

    return {
      total,
      avg1Y: count1Y > 0 ? sum1Y / count1Y : 0,
      avg3Y: count3Y > 0 ? sum3Y / count3Y : 0,
      categories,
    }
  }, [filteredFunds])

  // Handlers
  const handleFundAdded = useCallback((fund: WhitelistedFund) => {
    setFunds((prev) => [...prev, fund])
  }, [])

  const handleDelete = async () => {
    if (!deletingFund) return
    try {
      setDeleteLoading(true)
      await whitelistApi.remove(deletingFund.id)
      setFunds((prev) => prev.filter((f) => f.id !== deletingFund.id))
      success('Fund Removed', `${deletingFund.schemeName} removed from picks`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove fund'
      showError('Error', msg)
    } finally {
      setDeleteLoading(false)
      setDeletingFund(null)
    }
  }

  return (
    <AdvisorLayout title="My Picks">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Your curated shortlist of recommended funds for clients
            </p>
          </div>
          <FAButton
            onClick={() => setShowAddModal(true)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Fund
          </FAButton>
        </div>

        {/* Summary Hero Card */}
        {!loading && !error && filteredFunds.length > 0 && (
          <div
            className="p-6 rounded-2xl relative overflow-hidden mb-6"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              boxShadow: `0 8px 32px ${isDark ? 'rgba(0,0,0,0.4)' : `${colors.primary}30`}`,
            }}
          >
            {/* Decorative shapes */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            />
            <div
              className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />

            <div className="relative z-10">
              <div className="grid grid-cols-3 gap-6 mb-5">
                {/* Total Funds */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                    Total Funds
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {summary.total}
                  </p>
                </div>
                {/* Avg 1Y Return */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                    Avg 1Y Return
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {summary.avg1Y > 0 ? '+' : ''}{summary.avg1Y.toFixed(1)}%
                  </p>
                </div>
                {/* Avg 3Y Return */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                    Avg 3Y Return
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {summary.avg3Y > 0 ? '+' : ''}{summary.avg3Y.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Category Breakdown Chips */}
              {Object.keys(summary.categories).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.categories)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <span
                        key={cat}
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                      >
                        {cat} ({count})
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Year Picker */}
        <div className="flex items-center gap-2 mb-6">
          <span
            className="text-xs font-semibold uppercase tracking-wider mr-2"
            style={{ color: colors.textTertiary }}
          >
            Year
          </span>
          {YEAR_OPTIONS.map((year) => {
            const isSelected = year === selectedYear
            return (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={
                  isSelected
                    ? {
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                        color: 'white',
                        boxShadow: `0 4px 14px ${colors.glassShadow}`,
                      }
                    : {
                        background: isDark
                          ? 'rgba(147, 197, 253, 0.06)'
                          : 'rgba(59, 130, 246, 0.04)',
                        color: colors.textSecondary,
                        border: `1px solid ${colors.cardBorder}`,
                      }
                }
              >
                {year}
              </button>
            )
          })}

          <span className="ml-auto text-sm" style={{ color: colors.textTertiary }}>
            {filteredFunds.length} fund{filteredFunds.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <FALoadingState message="Loading your picks..." />
        ) : error ? (
          <FACard padding="lg">
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: colors.error }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium text-sm" style={{ color: colors.error }}>
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: colors.chipBg,
                  color: colors.primary,
                  border: `1px solid ${colors.chipBorder}`,
                }}
              >
                Retry
              </button>
            </div>
          </FACard>
        ) : filteredFunds.length === 0 ? (
          <FACard padding="lg">
            <FAEmptyState
              icon={
                <svg
                  className="w-12 h-12"
                  style={{ color: colors.textTertiary }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              title={`No picks for ${selectedYear}`}
              description="Start building your shortlist by adding funds you recommend"
              action={
                <FAButton
                  onClick={() => setShowAddModal(true)}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                >
                  Browse Funds
                </FAButton>
              }
            />
          </FACard>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: `0 4px 20px ${colors.glassShadow}`,
            }}
          >
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)',
                      borderBottom: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                      Fund
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                      Category / Risk
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                      1Y
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                      3Y
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                      5Y
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: colors.primary }}>
                      Added
                    </th>
                    <th className="w-10 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredFunds.map((fund) => {
                    const riskInfo = getRiskRatingInfo(fund.riskRating)

                    return (
                      <tr
                        key={fund.id}
                        className="transition-colors cursor-pointer group"
                        style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark
                            ? colors.backgroundTertiary
                            : colors.backgroundSecondary
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                        onClick={() => router.push(`/advisor/fund/${fund.schemeCode}`)}
                      >
                        {/* Fund Name */}
                        <td className="px-4 py-3 max-w-[320px]">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: colors.textPrimary }}
                          >
                            {fund.schemeName}
                          </p>
                          {fund.nav !== undefined && fund.nav > 0 && (
                            <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                              NAV: {fund.nav.toFixed(2)}
                            </p>
                          )}
                        </td>

                        {/* Category / Risk */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {fund.schemeCategory && (
                              <FAChip size="xs" color={colors.primary}>
                                {fund.schemeCategory}
                              </FAChip>
                            )}
                            <FAChip size="xs" color={riskInfo.color}>
                              {riskInfo.label}
                            </FAChip>
                          </div>
                        </td>

                        {/* 1Y */}
                        <td
                          className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap"
                          style={{ color: returnColor(fund.returns1y, colors) }}
                        >
                          {formatReturn(fund.returns1y)}
                        </td>

                        {/* 3Y */}
                        <td
                          className="px-4 py-3 text-right text-sm whitespace-nowrap"
                          style={{ color: returnColor(fund.returns3y, colors) }}
                        >
                          {formatReturn(fund.returns3y)}
                        </td>

                        {/* 5Y */}
                        <td
                          className="px-4 py-3 text-right text-sm whitespace-nowrap"
                          style={{ color: returnColor(fund.returns5y, colors) }}
                        >
                          {formatReturn(fund.returns5y)}
                        </td>

                        {/* Added Date */}
                        <td
                          className="px-4 py-3 text-right text-xs whitespace-nowrap hidden lg:table-cell"
                          style={{ color: colors.textTertiary }}
                        >
                          {formatDate(fund.addedAt, { format: 'short' })}
                        </td>

                        {/* Delete */}
                        <td className="px-2 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingFund(fund)
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            style={{ background: `${colors.error}12`, color: colors.error }}
                            title="Remove from picks"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        <AddFundModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          selectedYear={selectedYear}
          existingCodes={existingCodes}
          onAdded={handleFundAdded}
        />

        <ConfirmDeleteDialog
          open={!!deletingFund}
          fundName={deletingFund?.schemeName || ''}
          onConfirm={handleDelete}
          onCancel={() => setDeletingFund(null)}
          loading={deleteLoading}
        />
      </div>
    </AdvisorLayout>
  )
}

export default MyPicksPage
