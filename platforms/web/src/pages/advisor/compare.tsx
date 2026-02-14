/**
 * Fund Comparison Page
 *
 * Compare 2-4 mutual funds side-by-side with returns,
 * risk metrics, holdings, and visual charts.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, formatPercent } from '@/utils/fa'
import {
  FACard,
  FASearchInput,
  FAButton,
  FAChip,
  FAEmptyState,
} from '@/components/advisor/shared'
import { dbFundsApi, DatabaseFund } from '@/services/api'

// Use DatabaseFund type from API
type CompareFund = DatabaseFund

const ComparePage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()
  const [allFunds, setAllFunds] = useState<CompareFund[]>([])
  const [selectedFunds, setSelectedFunds] = useState<CompareFund[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFundPicker, setShowFundPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all funds from database
  useEffect(() => {
    const loadFunds = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await dbFundsApi.getAllFunds()
        setAllFunds(data)
      } catch (err) {
        console.error('Failed to load funds:', err)
        setError('Failed to load funds. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    loadFunds()
  }, [])

  // Load funds from query params once all funds are loaded
  useEffect(() => {
    if (allFunds.length === 0) return

    const { funds } = router.query
    if (funds) {
      const codes = (typeof funds === 'string' ? funds : funds[0]).split(',').map(Number)
      const selected = codes
        .map(code => allFunds.find(f => f.schemeCode === code))
        .filter(Boolean) as CompareFund[]
      setSelectedFunds(selected)
    }
  }, [router.query, allFunds])

  const filteredFunds = allFunds.filter(fund =>
    !selectedFunds.find(s => s.schemeCode === fund.schemeCode) &&
    (fund.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     fund.fundHouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
     fund.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const addFund = (fund: CompareFund) => {
    if (selectedFunds.length < 4) {
      const newSelected = [...selectedFunds, fund]
      setSelectedFunds(newSelected)
      setSearchTerm('')
      setShowFundPicker(false)
      // Update URL
      router.push({
        pathname: '/advisor/compare',
        query: { funds: newSelected.map(f => f.schemeCode).join(',') }
      }, undefined, { shallow: true })
    }
  }

  const removeFund = (schemeCode: number) => {
    const newSelected = selectedFunds.filter(f => f.schemeCode !== schemeCode)
    setSelectedFunds(newSelected)
    if (newSelected.length > 0) {
      router.push({
        pathname: '/advisor/compare',
        query: { funds: newSelected.map(f => f.schemeCode).join(',') }
      }, undefined, { shallow: true })
    } else {
      router.push('/advisor/compare', undefined, { shallow: true })
    }
  }

  const getRiskColor = (rating: number) => {
    if (rating <= 2) return colors.success
    if (rating <= 3) return colors.warning
    return colors.error
  }

  const getRiskLabel = (rating: number) => {
    if (rating <= 2) return 'Low'
    if (rating <= 3) return 'Moderate'
    if (rating <= 4) return 'High'
    return 'Very High'
  }

  const getReturnColor = (value: number) => {
    return value >= 0 ? colors.success : colors.error
  }

  return (
    <AdvisorLayout title="Fund Comparison">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem', overflow: 'hidden' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Compare up to 4 mutual funds side-by-side
            </p>
          </div>
          {selectedFunds.length > 0 && selectedFunds.length < 4 && !loading && (
            <FAButton onClick={() => setShowFundPicker(true)} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Fund
            </FAButton>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <FACard className="p-8">
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-8 h-8 animate-spin mb-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p style={{ color: colors.textSecondary }}>Loading funds...</p>
            </div>
          </FACard>
        )}

        {/* Error State */}
        {error && !loading && (
          <FACard className="p-8">
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium mb-2" style={{ color: colors.error }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: colors.chipBg, color: colors.primary }}
              >
                Retry
              </button>
            </div>
          </FACard>
        )}

        {/* Empty State / Fund Picker */}
        {!loading && !error && selectedFunds.length === 0 ? (
          <FACard className="p-8">
            <div className="text-center max-w-md mx-auto">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: `${colors.primary}15`, color: colors.primary }}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Start Comparing Funds
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                Select 2-4 mutual funds to compare their performance, risk metrics, and holdings
              </p>
              <div className="space-y-3">
                <FASearchInput
                  placeholder="Search funds by name or category..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
                {searchTerm && (
                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                    {filteredFunds.map(fund => (
                      <button
                        key={fund.schemeCode}
                        onClick={() => addFund(fund)}
                        className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                        style={{
                          background: colors.chipBg,
                          border: `1px solid ${colors.cardBorder}`,
                        }}
                      >
                        <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>
                          {fund.schemeName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: colors.textTertiary }}>
                            {fund.fundHouse}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                            {fund.subCategory || fund.category}
                          </span>
                          {fund.return1Y !== undefined && (
                            <span className="text-xs font-semibold" style={{ color: fund.return1Y >= 0 ? colors.success : colors.error }}>
                              {fund.return1Y >= 0 ? '+' : ''}{fund.return1Y.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {filteredFunds.length === 0 && (
                      <p className="text-center text-sm py-4" style={{ color: colors.textTertiary }}>
                        No matching funds found
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </FACard>
        ) : (
          <>
            {/* Selected Funds Header */}
            <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${selectedFunds.length + (selectedFunds.length < 4 ? 1 : 0)}, minmax(0, 1fr))` }}>
              {selectedFunds.map((fund, i) => (
                <FACard key={fund.schemeCode} className="relative overflow-hidden">
                  <button
                    onClick={() => removeFund(fund.schemeCode)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg transition-all hover:scale-110"
                    style={{ background: `${colors.error}15`, color: colors.error }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      }}
                    >
                      {fund.schemeName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="font-semibold text-sm truncate" style={{ color: colors.textPrimary }}>
                        {fund.schemeName}
                      </p>
                      <p className="text-xs truncate" style={{ color: colors.textTertiary }}>
                        {fund.fundHouse}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <FAChip color={colors.primary}>{fund.subCategory || fund.category}</FAChip>
                    {fund.riskRating && (
                      <FAChip color={getRiskColor(fund.riskRating)}>{getRiskLabel(fund.riskRating)} Risk</FAChip>
                    )}
                  </div>
                </FACard>
              ))}
              {selectedFunds.length < 4 && (
                <button
                  onClick={() => setShowFundPicker(true)}
                  className="p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  style={{
                    background: colors.cardBackground,
                    border: `2px dashed ${colors.cardBorder}`,
                    minHeight: '120px',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: colors.chipBg, color: colors.primary }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Add Fund
                  </span>
                </button>
              )}
            </div>

            {/* Returns Comparison */}
            <FACard className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: colors.primary }}>
                Returns Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: colors.chipBg }}>
                      <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                        Period
                      </th>
                      {selectedFunds.map(fund => (
                        <th key={fund.schemeCode} className="text-right p-3 text-xs font-semibold" style={{ color: colors.textSecondary }}>
                          {fund.schemeName.split(' ').slice(0, 2).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: '1 Month', key: 'return1M' },
                      { label: '3 Months', key: 'return3M' },
                      { label: '6 Months', key: 'return6M' },
                      { label: '1 Year', key: 'return1Y' },
                      { label: '3 Years', key: 'return3Y' },
                      { label: '5 Years', key: 'return5Y' },
                    ].map((row, i) => {
                      const values = selectedFunds.map(f => f[row.key as keyof CompareFund] as number | undefined)
                      const validValues = values.filter((v): v is number => v !== undefined && v !== null)
                      const best = validValues.length > 0 ? Math.max(...validValues) : null
                      return (
                        <tr key={row.key} style={{ borderTop: i > 0 ? `1px solid ${colors.cardBorder}` : undefined }}>
                          <td className="p-3 text-sm font-medium" style={{ color: colors.textPrimary }}>
                            {row.label}
                          </td>
                          {selectedFunds.map(fund => {
                            const value = fund[row.key as keyof CompareFund] as number | undefined
                            const isBest = value !== undefined && value === best && selectedFunds.length > 1 && validValues.length > 1
                            return (
                              <td
                                key={fund.schemeCode}
                                className="p-3 text-right text-sm font-bold"
                                style={{
                                  color: value !== undefined ? getReturnColor(value) : colors.textTertiary,
                                  background: isBest ? `${colors.success}10` : undefined,
                                }}
                              >
                                {value !== undefined ? (
                                  <>
                                    {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                                    {isBest && <span className="ml-1 text-xs">★</span>}
                                  </>
                                ) : '-'}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </FACard>

            {/* Risk Metrics */}
            <FACard className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: colors.primary }}>
                Risk Metrics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: colors.chipBg }}>
                      <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                        Metric
                      </th>
                      {selectedFunds.map(fund => (
                        <th key={fund.schemeCode} className="text-right p-3 text-xs font-semibold" style={{ color: colors.textSecondary }}>
                          {fund.schemeName.split(' ').slice(0, 2).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Standard Deviation', key: 'standardDeviation', unit: '%', lowerBetter: true },
                      { label: 'Sharpe Ratio', key: 'sharpeRatio', unit: '', lowerBetter: false },
                      { label: 'Beta', key: 'beta', unit: '', lowerBetter: true },
                      { label: 'Alpha', key: 'alpha', unit: '%', lowerBetter: false },
                      { label: 'Sortino Ratio', key: 'sortino', unit: '', lowerBetter: false },
                      { label: 'Max Drawdown', key: 'maxDrawdown', unit: '%', lowerBetter: true },
                    ].map((row, i) => {
                      const values = selectedFunds.map(f => f[row.key as keyof CompareFund] as number | undefined)
                      const validValues = values.filter((v): v is number => v !== undefined && v !== null)
                      const best = validValues.length > 0
                        ? (row.lowerBetter ? Math.min(...validValues) : Math.max(...validValues))
                        : null
                      return (
                        <tr key={row.key} style={{ borderTop: i > 0 ? `1px solid ${colors.cardBorder}` : undefined }}>
                          <td className="p-3 text-sm font-medium" style={{ color: colors.textPrimary }}>
                            {row.label}
                          </td>
                          {selectedFunds.map(fund => {
                            const value = fund[row.key as keyof CompareFund] as number | undefined
                            const isBest = value !== undefined && value === best && selectedFunds.length > 1 && validValues.length > 1
                            return (
                              <td
                                key={fund.schemeCode}
                                className="p-3 text-right text-sm font-semibold"
                                style={{
                                  color: value !== undefined ? colors.textPrimary : colors.textTertiary,
                                  background: isBest ? `${colors.success}10` : undefined,
                                }}
                              >
                                {value !== undefined ? (
                                  <>
                                    {value.toFixed(2)}{row.unit}
                                    {isBest && <span className="ml-1 text-xs" style={{ color: colors.success }}>★</span>}
                                  </>
                                ) : '-'}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </FACard>

            {/* Fund Details */}
            <FACard className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: colors.primary }}>
                Fund Details
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: colors.chipBg }}>
                      <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                        Detail
                      </th>
                      {selectedFunds.map(fund => (
                        <th key={fund.schemeCode} className="text-right p-3 text-xs font-semibold" style={{ color: colors.textSecondary }}>
                          {fund.schemeName.split(' ').slice(0, 2).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'NAV', render: (f: CompareFund) => f.currentNav ? `₹${f.currentNav.toFixed(2)}` : '-' },
                      { label: 'AUM', render: (f: CompareFund) => f.aum ? formatCurrency(f.aum) : '-' },
                      { label: 'Expense Ratio', render: (f: CompareFund) => f.expenseRatio ? `${f.expenseRatio}%` : '-' },
                      { label: 'Min Investment', render: (f: CompareFund) => f.minInvestment ? formatCurrency(f.minInvestment) : '-' },
                      { label: 'Min SIP', render: (f: CompareFund) => f.minSipAmount ? formatCurrency(f.minSipAmount) : '-' },
                      { label: 'Exit Load', render: (f: CompareFund) => f.exitLoad || '-' },
                      { label: 'Fund Manager', render: (f: CompareFund) => f.fundManager || '-' },
                      { label: 'Benchmark', render: (f: CompareFund) => f.benchmark || '-' },
                      { label: 'Launch Date', render: (f: CompareFund) => f.launchDate ? new Date(f.launchDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-' },
                    ].map((row, i) => (
                      <tr key={row.label} style={{ borderTop: i > 0 ? `1px solid ${colors.cardBorder}` : undefined }}>
                        <td className="p-3 text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {row.label}
                        </td>
                        {selectedFunds.map(fund => (
                          <td
                            key={fund.schemeCode}
                            className="p-3 text-right text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            {row.render(fund)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FACard>

            {/* Top Holdings */}
            <FACard>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: colors.primary }}>
                Top 5 Holdings
              </h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedFunds.length}, minmax(0, 1fr))` }}>
                {selectedFunds.map(fund => (
                  <div key={fund.schemeCode}>
                    <p className="text-xs font-semibold mb-3" style={{ color: colors.textSecondary }}>
                      {fund.schemeName.split(' ').slice(0, 2).join(' ')}
                    </p>
                    <div className="space-y-2">
                      {fund.topHoldings && fund.topHoldings.length > 0 ? (
                        fund.topHoldings.slice(0, 5).map((holding, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg"
                            style={{ background: colors.chipBg }}
                          >
                            <span className="text-sm truncate flex-1" style={{ color: colors.textPrimary }}>
                              {holding.name}
                            </span>
                            <span className="text-sm font-semibold ml-2" style={{ color: colors.primary }}>
                              {holding.percentage}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm py-4 text-center" style={{ color: colors.textTertiary }}>
                          Holdings data not available
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </FACard>
          </>
        )}

        {/* Fund Picker Modal */}
        {showFundPicker && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowFundPicker(false)}
          >
            <div
              className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 25px 50px ${colors.glassShadow}`,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    Add Fund to Compare
                  </h2>
                  <button
                    onClick={() => setShowFundPicker(false)}
                    className="p-2 rounded-lg transition-all hover:scale-105"
                    style={{ background: colors.chipBg, color: colors.textSecondary }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <FASearchInput
                  placeholder="Search funds..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>
              <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                <div className="space-y-2">
                  {filteredFunds.map(fund => (
                    <button
                      key={fund.schemeCode}
                      onClick={() => addFund(fund)}
                      className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                      style={{
                        background: colors.chipBg,
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>
                        {fund.schemeName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>
                          {fund.fundHouse}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: `${colors.primary}15`, color: colors.primary }}
                        >
                          {fund.subCategory || fund.category}
                        </span>
                        {fund.return1Y !== undefined && (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: fund.return1Y >= 0 ? colors.success : colors.error }}
                          >
                            {fund.return1Y >= 0 ? '+' : ''}{fund.return1Y.toFixed(1)}% 1Y
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredFunds.length === 0 && (
                    <p className="text-center text-sm py-8" style={{ color: colors.textTertiary }}>
                      No matching funds found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvisorLayout>
  )
}

export default ComparePage
