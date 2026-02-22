/**
 * NMF Scheme Master Browser
 *
 * Search and browse NSE NMF scheme master data.
 * View scheme details, eligibility flags, and transaction limits.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { nmfApi } from '@/services/api'
import {
  FACard,
  FAButton,
  FAEmptyState,
} from '@/components/advisor/shared'

interface NmfScheme {
  id?: string
  schemeCode: string
  schemeName: string
  isin?: string
  amcCode?: string
  schemeType?: string
  schemePlan?: string
  schemeOption?: string
  purchaseAllowed: boolean
  redemptionAllowed: boolean
  sipAllowed: boolean
  stpAllowed: boolean
  swpAllowed: boolean
  switchAllowed: boolean
  minPurchaseAmt?: number | string
  maxPurchaseAmt?: number | string
  minRedemptionAmt?: number | string
  minSipAmt?: number | string
  maxSipAmt?: number | string
  sipDates?: string
  sipFrequencies?: string
  exitLoad?: string
  lockInPeriod?: string
  lastSyncedAt?: string
}

const PAGE_SIZE = 25

const SchemeFlag = ({
  label,
  allowed,
  colors,
}: {
  label: string
  allowed: boolean
  colors: any
}) => (
  <span
    className="text-xs px-1.5 py-0.5 rounded font-medium"
    style={{
      background: allowed ? `${colors.success}15` : `${colors.textTertiary}10`,
      color: allowed ? colors.success : colors.textTertiary,
    }}
  >
    {label}
  </span>
)

const NmfSchemeMasterPage = () => {
  const { colors, isDark } = useFATheme()

  const [schemes, setSchemes] = useState<NmfScheme[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  const searchTimeout = useRef<NodeJS.Timeout>()

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(value)
      setPage(1)
      setInitialLoad(false)
    }, 300)
  }

  const fetchSchemes = useCallback(async () => {
    if (initialLoad && !searchQuery) return

    try {
      setLoading(true)
      setError(null)
      const res = await nmfApi.masters.searchSchemes(searchQuery || '', page, PAGE_SIZE)
      const data = Array.isArray(res) ? res : res?.data || []
      setSchemes(data)
      setTotal(res?.total || data.length)
      setTotalPages(res?.totalPages || Math.ceil((res?.total || data.length) / PAGE_SIZE))
    } catch (err) {
      console.error('[NMF Scheme Master] Error:', err)
      setError('Failed to search schemes')
      setSchemes([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, page, initialLoad])

  useEffect(() => {
    fetchSchemes()
  }, [fetchSchemes])

  const toNumber = (val?: number | string): number | undefined => {
    if (val === undefined || val === null) return undefined
    const n = typeof val === 'string' ? parseFloat(val) : val
    return isNaN(n) ? undefined : n
  }

  const startItem = (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, total)

  return (
    <AdvisorLayout title="NMF Scheme Browser">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Browse NSE NMF scheme master for fund details and eligibility
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div
          className="p-5 rounded-xl mb-6"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: colors.textTertiary }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by scheme name, code, ISIN, or AMC..."
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl text-sm focus:outline-none"
              style={{
                background: isDark ? colors.inputBg : '#FFFFFF',
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
                fontSize: '15px',
              }}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  setSearchQuery('')
                  setInitialLoad(true)
                  setSchemes([])
                  setPage(1)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: colors.textTertiary }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {total > 0 && (
            <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
              {total.toLocaleString('en-IN')} schemes found
            </p>
          )}
        </div>

        {/* Results */}
        <FACard padding="none" className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                />
                <span className="text-sm" style={{ color: colors.textSecondary }}>
                  Searching schemes...
                </span>
              </div>
            </div>
          ) : initialLoad && schemes.length === 0 ? (
            <div className="py-16">
              <FAEmptyState
                icon={
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                }
                title="Search NMF scheme master"
                description="Start typing to search by scheme name, code, ISIN, or AMC code"
              />
            </div>
          ) : schemes.length === 0 ? (
            <div className="py-16">
              <FAEmptyState
                icon={
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                }
                title="No schemes found"
                description={`No schemes match "${searchQuery}". Try a different search term.`}
              />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(216,180,254,0.06) 0%, rgba(249,168,212,0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(168,85,247,0.05) 0%, rgba(244,114,182,0.02) 100%)',
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: colors.primary }}
                      >
                        Scheme Code
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: colors.primary }}
                      >
                        Scheme Name
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: colors.primary }}
                      >
                        ISIN
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: colors.primary }}
                      >
                        Type / Plan
                      </th>
                      <th
                        className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: colors.primary }}
                      >
                        Eligibility
                      </th>
                      <th className="w-8 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map(scheme => {
                      const isExpanded = expandedScheme === scheme.schemeCode
                      const minPurchase = toNumber(scheme.minPurchaseAmt)
                      const maxPurchase = toNumber(scheme.maxPurchaseAmt)
                      const minRedemption = toNumber(scheme.minRedemptionAmt)
                      const minSip = toNumber(scheme.minSipAmt)
                      const maxSip = toNumber(scheme.maxSipAmt)

                      return (
                        <tr key={scheme.schemeCode}>
                          <td colSpan={6} className="p-0">
                            {/* Main Row */}
                            <div
                              className="flex items-center transition-colors cursor-pointer"
                              style={{
                                borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}`,
                              }}
                              onClick={() => setExpandedScheme(isExpanded ? null : scheme.schemeCode)}
                              onMouseEnter={e =>
                                (e.currentTarget.style.background = isDark
                                  ? 'rgba(216,180,254,0.04)'
                                  : 'rgba(168,85,247,0.02)')
                              }
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              {/* Scheme Code */}
                              <div className="px-4 py-3 min-w-[120px]">
                                <p className="text-sm font-mono font-medium" style={{ color: colors.primary }}>
                                  {scheme.schemeCode}
                                </p>
                              </div>

                              {/* Scheme Name */}
                              <div className="px-4 py-3 flex-1 min-w-[260px]">
                                <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                                  {scheme.schemeName}
                                </p>
                                {scheme.amcCode && (
                                  <p className="text-xs truncate" style={{ color: colors.textTertiary }}>
                                    {scheme.amcCode}
                                  </p>
                                )}
                              </div>

                              {/* ISIN */}
                              <div className="px-4 py-3 min-w-[140px]">
                                <p className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                                  {scheme.isin || '-'}
                                </p>
                              </div>

                              {/* Type / Plan */}
                              <div className="px-4 py-3 min-w-[140px]">
                                {scheme.schemeType && (
                                  <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                                    {scheme.schemeType}
                                  </p>
                                )}
                                {scheme.schemePlan && (
                                  <p className="text-xs" style={{ color: colors.textTertiary }}>
                                    {scheme.schemePlan}
                                    {scheme.schemeOption ? ` · ${scheme.schemeOption}` : ''}
                                  </p>
                                )}
                                {!scheme.schemeType && !scheme.schemePlan && (
                                  <p className="text-xs" style={{ color: colors.textTertiary }}>
                                    -
                                  </p>
                                )}
                              </div>

                              {/* Eligibility Badges */}
                              <div className="px-4 py-3 min-w-[220px]">
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                  <SchemeFlag label="Buy" allowed={scheme.purchaseAllowed} colors={colors} />
                                  <SchemeFlag label="Redeem" allowed={scheme.redemptionAllowed} colors={colors} />
                                  <SchemeFlag label="SIP" allowed={scheme.sipAllowed} colors={colors} />
                                  <SchemeFlag label="STP" allowed={scheme.stpAllowed} colors={colors} />
                                  <SchemeFlag label="SWP" allowed={scheme.swpAllowed} colors={colors} />
                                  <SchemeFlag label="Switch" allowed={scheme.switchAllowed} colors={colors} />
                                </div>
                              </div>

                              {/* Chevron */}
                              <div className="px-2 py-3">
                                <svg
                                  className="w-4 h-4 transition-transform"
                                  style={{
                                    color: colors.textTertiary,
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                  }}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>

                            {/* Expanded Detail Panel */}
                            {isExpanded && (
                              <div
                                className="px-5 py-4"
                                style={{
                                  background: isDark
                                    ? 'rgba(216, 180, 254, 0.03)'
                                    : 'rgba(168, 85, 247, 0.02)',
                                  borderBottom: `1px solid ${colors.cardBorder}`,
                                }}
                              >
                                {/* Detail Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                                      Scheme Code
                                    </p>
                                    <p className="text-sm font-medium font-mono" style={{ color: colors.textPrimary }}>
                                      {scheme.schemeCode}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                                      ISIN
                                    </p>
                                    <p className="text-sm font-medium font-mono" style={{ color: colors.textPrimary }}>
                                      {scheme.isin || '-'}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                                      AMC Code
                                    </p>
                                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                      {scheme.amcCode || '-'}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                                      Scheme Type
                                    </p>
                                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                      {scheme.schemeType || '-'}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                                      Plan
                                    </p>
                                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                      {scheme.schemePlan || '-'}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                                      Option
                                    </p>
                                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                      {scheme.schemeOption || '-'}
                                    </p>
                                  </div>

                                  {minPurchase !== undefined && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        Min Purchase
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {formatCurrency(minPurchase)}
                                      </p>
                                    </div>
                                  )}

                                  {maxPurchase !== undefined && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        Max Purchase
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {formatCurrency(maxPurchase)}
                                      </p>
                                    </div>
                                  )}

                                  {minRedemption !== undefined && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        Min Redemption
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {formatCurrency(minRedemption)}
                                      </p>
                                    </div>
                                  )}

                                  {minSip !== undefined && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        Min SIP
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {formatCurrency(minSip)}
                                      </p>
                                    </div>
                                  )}

                                  {maxSip !== undefined && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        Max SIP
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {formatCurrency(maxSip)}
                                      </p>
                                    </div>
                                  )}

                                  {scheme.sipDates && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        SIP Dates
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {scheme.sipDates}
                                      </p>
                                    </div>
                                  )}

                                  {scheme.sipFrequencies && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        SIP Frequencies
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {scheme.sipFrequencies}
                                      </p>
                                    </div>
                                  )}

                                  {scheme.exitLoad && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        Exit Load
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {scheme.exitLoad}
                                      </p>
                                    </div>
                                  )}

                                  {scheme.lockInPeriod && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        Lock-in Period
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {scheme.lockInPeriod}
                                      </p>
                                    </div>
                                  )}

                                  {scheme.lastSyncedAt && (
                                    <div>
                                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                                        Last Synced
                                      </p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {new Date(scheme.lastSyncedAt).toLocaleDateString('en-IN', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Eligibility Flags Detail */}
                                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                                  <p
                                    className="text-xs font-semibold uppercase tracking-wide mb-2"
                                    style={{ color: colors.primary }}
                                  >
                                    Eligibility Flags
                                  </p>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {[
                                      { label: 'Purchase', allowed: scheme.purchaseAllowed },
                                      { label: 'Redemption', allowed: scheme.redemptionAllowed },
                                      { label: 'SIP', allowed: scheme.sipAllowed },
                                      { label: 'STP', allowed: scheme.stpAllowed },
                                      { label: 'SWP', allowed: scheme.swpAllowed },
                                      { label: 'Switch', allowed: scheme.switchAllowed },
                                    ].map(flag => (
                                      <div key={flag.label} className="flex items-center gap-1.5">
                                        {flag.allowed ? (
                                          <svg
                                            className="w-4 h-4"
                                            style={{ color: colors.success }}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        ) : (
                                          <svg
                                            className="w-4 h-4"
                                            style={{ color: colors.textTertiary }}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        )}
                                        <span
                                          className="text-sm"
                                          style={{ color: flag.allowed ? colors.textPrimary : colors.textTertiary }}
                                        >
                                          {flag.label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                >
                  <p className="text-sm" style={{ color: colors.textTertiary }}>
                    {startItem}–{endItem} of {total.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{ color: colors.textSecondary }}
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
                          <span key={`ellipsis-${i}`} className="px-1 text-sm" style={{ color: colors.textTertiary }}>
                            ...
                          </span>
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
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </FACard>

        {/* Error Banner */}
        {error && (
          <div
            className="mt-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: `${colors.error}10`,
              border: `1px solid ${colors.error}30`,
              color: colors.error,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </AdvisorLayout>
  )
}

export default NmfSchemeMasterPage
