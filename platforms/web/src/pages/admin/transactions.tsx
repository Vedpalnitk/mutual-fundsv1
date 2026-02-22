import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminCard, AdminStatCard, AdminChip, AdminPagination, AdminSpinner, AdminEmptyState } from '@/components/admin/shared'
import { useAdminTheme } from '@/utils/adminTheme'
import {
  adminTransactionsApi,
  TransactionOverviewKPIs,
  AdminTransaction,
  PaginatedResponse,
  adminExportApi,
} from '@/services/api/admin'
import { getAuthToken } from '@/services/api'

// ============= Helpers =============

const formatCurrency = (val: number | null) => val ? `₹${val.toLocaleString('en-IN')}` : '-'
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function getStatusChipColor(status: string, colors: ReturnType<typeof useAdminTheme>['colors']): string {
  const upper = status.toUpperCase()
  if (['COMPLETED', 'ALLOTTED', 'SUCCESSFUL'].includes(upper)) return colors.success
  if (['PENDING', 'CREATED', 'SUBMITTED'].includes(upper)) return colors.warning
  if (['FAILED', 'REJECTED'].includes(upper)) return colors.error
  return colors.textSecondary
}

function getSourceChipColor(source: string, colors: ReturnType<typeof useAdminTheme>['colors']): string {
  switch (source) {
    case 'BSE': return colors.primary
    case 'NSE': return colors.secondary
    case 'MANUAL':
    default: return colors.textSecondary
  }
}

// ============= Page Component =============

type TabKey = 'all' | 'failed'

const TransactionsPage = () => {
  const { isDark, colors } = useAdminTheme()

  // Data state
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<TransactionOverviewKPIs | null>(null)
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  // Filters (only for "all" tab)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Load overview KPIs on mount
  useEffect(() => {
    adminTransactionsApi.getOverview()
      .then(setOverview)
      .catch(() => {})
  }, [])

  // Load transactions when tab / filters / page change
  useEffect(() => {
    loadTransactions()
  }, [activeTab, search, sourceFilter, statusFilter, typeFilter, dateFrom, dateTo, page, itemsPerPage])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [activeTab, search, sourceFilter, statusFilter, typeFilter, dateFrom, dateTo])

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'failed') {
        const result = await adminTransactionsApi.getFailed()
        setTransactions(result.data)
        setTotalItems(result.data.length)
        setTotalPages(Math.max(1, Math.ceil(result.data.length / itemsPerPage)))
      } else {
        const params: Record<string, string | number> = {
          page,
          limit: itemsPerPage,
        }
        if (search) params.search = search
        if (sourceFilter !== 'all') params.source = sourceFilter
        if (statusFilter !== 'all') params.status = statusFilter
        if (typeFilter !== 'all') params.type = typeFilter
        if (dateFrom) params.dateFrom = dateFrom
        if (dateTo) params.dateTo = dateTo

        const result = await adminTransactionsApi.list(params)
        setTransactions(result.data)
        setTotalItems(result.pagination.total)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // For the failed tab, we paginate client-side
  const displayedTransactions = activeTab === 'failed'
    ? transactions.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : transactions

  const handleExportCSV = async () => {
    const params: Record<string, string> = {}
    if (sourceFilter !== 'all') params.source = sourceFilter
    if (statusFilter !== 'all') params.status = statusFilter
    if (typeFilter !== 'all') params.type = typeFilter
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo

    const url = adminExportApi.exportTransactions(params)
    const token = getAuthToken()
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token}`
    window.open(fullUrl, '_blank')
  }

  return (
    <AdminLayout title="Transactions">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center justify-between"
            style={{
              background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${colors.error}`,
            }}
          >
            <span style={{ color: colors.error }}>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline" style={{ color: colors.error }}>
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <AdminStatCard
            label="Total Transactions"
            value={overview?.totalTransactions.toLocaleString('en-IN') ?? '-'}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            }
          />
          <AdminStatCard
            label="Total Volume"
            value={overview ? formatCurrency(overview.totalVolume) : '-'}
            variant="secondary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Pending"
            value={overview?.pendingCount ?? '-'}
            variant="accent"
            change={overview ? `${overview.pendingCount} awaiting` : undefined}
            changeType="neutral"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Failed — custom styled card */}
          <div
            className="p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{
              background: colors.gradientWarning,
              boxShadow: `0 8px 24px ${colors.error}25`,
            }}
          >
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Failed</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{overview?.failedCount ?? '-'}</p>
            </div>
          </div>

          <AdminStatCard
            label="Avg Processing Time"
            value={overview?.avgProcessingTime ?? '-'}
            variant="secondary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Success Rate"
            value={overview ? `${overview.successRate}%` : '-'}
            variant="success"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Tab Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: activeTab === 'all' ? colors.gradientPrimary : colors.chipBg,
                color: activeTab === 'all' ? '#fff' : colors.textSecondary,
              }}
            >
              All Transactions
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: activeTab === 'failed' ? colors.gradientPrimary : colors.chipBg,
                color: activeTab === 'failed' ? '#fff' : colors.textSecondary,
              }}
            >
              Failed & Stuck
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-md"
            style={{
              background: colors.chipBg,
              color: colors.textSecondary,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Filters Bar (only on "all" tab) */}
        {activeTab === 'all' && (
          <div
            className="p-4 rounded-xl mb-6"
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: `0 4px 24px ${colors.glassShadow}`,
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: colors.textTertiary }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by scheme, client, advisor..."
                    className="w-full h-10 pl-11 pr-4 rounded-xl text-sm transition-all focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
              </div>

              {/* Source Dropdown */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="all">All Sources</option>
                <option value="BSE">BSE</option>
                <option value="NSE">NSE</option>
                <option value="MANUAL">Manual</option>
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="all">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ALLOTTED">Allotted</option>
                <option value="FAILED">Failed</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Type Dropdown */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="all">All Types</option>
                <option value="PURCHASE">Purchase</option>
                <option value="REDEMPTION">Redemption</option>
                <option value="SIP">SIP</option>
                <option value="SWITCH">Switch</option>
                <option value="STP">STP</option>
                <option value="SWP">SWP</option>
              </select>

              {/* Date Range */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 px-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              />
              <span className="text-xs" style={{ color: colors.textTertiary }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 px-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              />
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          {/* Table Header Bar */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.chipBorder }}>
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {activeTab === 'all' ? 'All Transactions' : 'Failed & Stuck Transactions'}
            </h2>
            <span className="text-sm" style={{ color: colors.textSecondary }}>
              {totalItems} transaction{totalItems !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <AdminSpinner size="lg" />
            </div>
          ) : displayedTransactions.length === 0 ? (
            <AdminEmptyState
              title="No transactions found"
              description={
                activeTab === 'failed'
                  ? 'No failed or stuck transactions at this time.'
                  : 'Try adjusting your filters or check back later.'
              }
              icon={
                <svg className="w-7 h-7" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: `${colors.primary}08` }}>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Date
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Type
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Source
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Scheme
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Amount
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="transition-all"
                      style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.chipBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Date */}
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>
                          {formatDate(txn.createdAt)}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <AdminChip color={colors.primary} size="sm">
                          {txn.type}
                        </AdminChip>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        <AdminChip color={getSourceChipColor(txn.source, colors)} size="sm">
                          {txn.source}
                        </AdminChip>
                      </td>

                      {/* Scheme */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="text-sm truncate block" style={{ color: colors.textPrimary }}>
                          {txn.schemeName || '-'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <AdminChip color={getStatusChipColor(txn.status, colors)} size="sm">
                          {txn.status}
                        </AdminChip>
                      </td>

                      {/* Error */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <span
                          className="text-sm truncate block"
                          style={{ color: txn.errorMessage ? colors.error : colors.textTertiary }}
                          title={txn.errorMessage || ''}
                        >
                          {txn.errorMessage || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalItems > 0 && (
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val)
                setPage(1)
              }}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default TransactionsPage
