/**
 * Transactions Page
 *
 * Execute and track client mutual fund transactions.
 * Server-side pagination, filtering, and search for handling large datasets.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, getTransactionTypeColor, getStatusColor } from '@/utils/fa'
import { Transaction, TransactionType, TransactionFormData } from '@/utils/faTypes'
import {
  FACard,
  FAChip,
  FAStatCard,
  FAButton,
  FAEmptyState,
  useNotification,
} from '@/components/advisor/shared'
import TransactionFormModal from '@/components/advisor/TransactionFormModal'
import { transactionsApi, sipsApi, FAPaginatedResponse } from '@/services/api'

const PAGE_SIZE = 25

const TYPE_OPTIONS = ['All', 'Buy', 'Sell', 'SIP', 'SWP', 'Switch', 'STP'] as const
const STATUS_OPTIONS = ['All', 'Completed', 'Pending', 'Processing', 'Failed', 'Cancelled'] as const

const TransactionsPage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()
  const notification = useNotification()

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Transaction modal
  const [showNewTransaction, setShowNewTransaction] = useState(false)
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType>('Buy')
  const [submitting, setSubmitting] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)

  // Sort
  const [sortColumn, setSortColumn] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDir('asc')
    }
  }

  const sortIcon = (column: string) => {
    if (sortColumn === column) {
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

  // Search debounce
  const searchTimeout = useRef<NodeJS.Timeout>()
  const [searchInput, setSearchInput] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearchTerm(value)
      setPage(1)
    }, 300)
  }

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await transactionsApi.list<Transaction>({
        page,
        limit: PAGE_SIZE,
        search: searchTerm || undefined,
        type: filterType !== 'All' ? filterType : undefined,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setTransactions(response.data)
      setTotal(response.total)
      setTotalPages(response.totalPages)
    } catch {
      setTransactions([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, filterType, filterStatus, dateFrom, dateTo])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Stats
  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0)
  const completedCount = transactions.filter(t => t.status === 'Completed').length
  const pendingCount = transactions.filter(t => t.status === 'Pending' || t.status === 'Processing').length
  const failedCount = transactions.filter(t => t.status === 'Failed').length

  const sortedTransactions = useMemo(() => {
    if (!sortColumn) return transactions
    const getters: Record<string, (t: Transaction) => string | number> = {
      date: t => new Date(t.date).getTime(),
      client: t => t.clientName,
      fund: t => t.fundName,
      type: t => t.type,
      amount: t => t.amount,
      nav: t => t.nav || 0,
      status: t => t.status,
    }
    const getter = getters[sortColumn]
    if (!getter) return transactions
    return [...transactions].sort((a, b) => {
      const aVal = getter(a)
      const bVal = getter(b)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [transactions, sortColumn, sortDir])

  const handleQuickAction = (type: TransactionType) => {
    setSelectedTransactionType(type)
    setShowNewTransaction(true)
    setShowTypeMenu(false)
  }

  const handleNewTransaction = async (data: TransactionFormData) => {
    setSubmitting(true)
    try {
      // Map frontend type to backend UPPERCASE enum
      const typeMap: Record<string, string> = {
        Buy: 'BUY', Sell: 'SELL', SIP: 'SIP',
        SWP: 'SWP', Switch: 'SWITCH', STP: 'STP',
      }

      if (data.type === 'SIP') {
        // SIP uses separate endpoint
        await sipsApi.create({
          clientId: data.clientId,
          fundName: data.fundName || '',
          fundSchemeCode: data.fundSchemeCode,
          folioNumber: data.folioNumber || undefined,
          amount: data.amount,
          frequency: (data.sipFrequency?.toUpperCase() || 'MONTHLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
          sipDate: data.sipDate || 5,
          startDate: data.sipStartDate || new Date().toISOString().split('T')[0],
          endDate: data.sipEndDate || undefined,
          isPerpetual: data.isPerpetual ?? true,
        })
        notification.success('SIP Recorded', 'SIP registration recorded successfully.')
      } else {
        // All other types use the transaction endpoints
        const payload = {
          clientId: data.clientId,
          fundName: data.fundName || '',
          fundSchemeCode: data.fundSchemeCode,
          fundCategory: data.fundCategory || 'Equity',
          type: typeMap[data.type] || data.type,
          amount: data.amount,
          nav: data.nav || 0,
          folioNumber: data.folioNumber || 'NEW',
          date: new Date().toISOString().split('T')[0],
          paymentMode: data.paymentMode,
          remarks: data.remarks,
        }

        if (data.type === 'Sell' || data.type === 'SWP') {
          await transactionsApi.createRedemption(payload)
        } else {
          // Buy, Switch, STP
          await transactionsApi.createLumpsum(payload)
        }

        const labels: Record<string, string> = {
          Buy: 'Purchase', Sell: 'Redemption', Switch: 'Switch', SWP: 'SWP', STP: 'STP',
        }
        notification.success(
          `${labels[data.type]} Recorded`,
          `${labels[data.type]} transaction recorded successfully.`
        )
      }

      fetchTransactions()
      setShowNewTransaction(false)
    } catch (err) {
      notification.error('Transaction Failed', err instanceof Error ? err.message : 'Failed to record transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRowClick = (txn: Transaction) => {
    router.push(`/advisor/transactions/${txn.id}`)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setFilterType('All')
    setFilterStatus('All')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasActiveFilters = searchTerm || filterType !== 'All' || filterStatus !== 'All' || dateFrom || dateTo

  const startItem = (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, total)

  return (
    <AdvisorLayout title="Transactions">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {total > 0 ? `${total.toLocaleString('en-IN')} transactions` : 'Execute and track client transactions'}
            </p>
          </div>
          <div className="relative">
            <FAButton
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Record Transaction
              <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </FAButton>
            {showTypeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-50 shadow-xl"
                  style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
                >
                  {(['Buy', 'Sell', 'SIP', 'SWP', 'Switch', 'STP'] as TransactionType[]).map(type => {
                    const typeColor = getTransactionTypeColor(type, colors)
                    return (
                      <button
                        key={type}
                        onClick={() => handleQuickAction(type)}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 transition-colors"
                        style={{ color: colors.textPrimary }}
                        onMouseEnter={e => e.currentTarget.style.background = colors.chipBg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: typeColor }}
                        />
                        {type}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FAStatCard
            label="Total Volume"
            value={formatCurrency(totalVolume)}
            change="This page"
            accentColor={colors.primary}
          />
          <FAStatCard
            label="Transactions"
            value={total.toLocaleString('en-IN')}
            change="All time"
            accentColor={colors.secondary}
          />
          <FAStatCard
            label="Completed"
            value={completedCount.toString()}
            change={total > 0 ? `${((completedCount / transactions.length) * 100).toFixed(0)}% on this page` : ''}
            accentColor={colors.success}
          />
          <FAStatCard
            label="Pending"
            value={pendingCount.toString()}
            change={failedCount > 0 ? `${failedCount} failed` : 'Awaiting processing'}
            accentColor={colors.warning}
          />
        </div>

        {/* Filters Bar */}
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
                placeholder="Search client, fund, or folio..."
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

            {/* Divider */}
            <div className="w-px h-6" style={{ background: colors.cardBorder }} />

            {/* Type filter */}
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1) }}
              className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
              style={{
                background: colors.inputBg,
                border: `1px solid ${filterType !== 'All' ? colors.primary : colors.inputBorder}`,
                color: filterType !== 'All' ? colors.primary : colors.textSecondary,
              }}
            >
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
              style={{
                background: colors.inputBg,
                border: `1px solid ${filterStatus !== 'All' ? colors.primary : colors.inputBorder}`,
                color: filterStatus !== 'All' ? colors.primary : colors.textSecondary,
              }}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
            </select>

            {/* Divider */}
            <div className="w-px h-6" style={{ background: colors.cardBorder }} />

            {/* Date range */}
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1) }}
              className="h-9 px-2 rounded-lg text-sm focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${dateFrom ? colors.primary : colors.inputBorder}`,
                color: dateFrom ? colors.textPrimary : colors.textTertiary,
              }}
            />
            <span className="text-xs" style={{ color: colors.textTertiary }}>-</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1) }}
              className="h-9 px-2 rounded-lg text-sm focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${dateTo ? colors.primary : colors.inputBorder}`,
                color: dateTo ? colors.textPrimary : colors.textTertiary,
              }}
            />

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

        {/* Table */}
        <FACard padding="none" className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                />
                <span className="text-sm" style={{ color: colors.textSecondary }}>Loading transactions...</span>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8">
              <FAEmptyState
                icon={
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title={hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
                description={hasActiveFilters ? 'Try adjusting your filters' : 'Create your first transaction to get started'}
              />
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
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('date')}>
                      Date{sortIcon('date')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('client')}>
                      Client{sortIcon('client')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('fund')}>
                      Fund{sortIcon('fund')}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('type')}>
                      Type{sortIcon('type')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('amount')}>
                      Amount{sortIcon('amount')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('nav')}>
                      Units @ NAV{sortIcon('nav')}
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none group/th" style={{ color: colors.primary }} onClick={() => handleSort('status')}>
                      Status{sortIcon('status')}
                    </th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((txn) => {
                    const typeColor = getTransactionTypeColor(txn.type, colors)
                    const statusColor = getStatusColor(txn.status, colors)
                    return (
                      <tr
                        key={txn.id}
                        onClick={() => handleRowClick(txn)}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: colors.textSecondary }}>
                          {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium truncate max-w-[160px]" style={{ color: colors.textPrimary }}>{txn.clientName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm truncate max-w-[220px]" style={{ color: colors.textPrimary }}>{txn.fundName}</p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>{txn.folioNumber}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ background: `${typeColor}15`, color: typeColor }}
                          >
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap" style={{ color: colors.textPrimary }}>
                          {formatCurrency(txn.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm whitespace-nowrap" style={{ color: colors.textSecondary }}>
                          {txn.units?.toFixed(2)} @ {formatCurrency(txn.nav)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                            style={{ background: `${statusColor}15`, color: statusColor }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: statusColor }}
                            />
                            {txn.status}
                          </span>
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
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: `1px solid ${colors.cardBorder}` }}
              >
                <p className="text-sm" style={{ color: colors.textTertiary }}>
                  {startItem}-{endItem} of {total.toLocaleString('en-IN')}
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

                  {/* Page numbers */}
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
            </>
          )}
        </FACard>
      </div>

      {/* Transaction Modal */}
      <TransactionFormModal
        isOpen={showNewTransaction}
        onClose={() => setShowNewTransaction(false)}
        onSubmit={handleNewTransaction}
        initialType={selectedTransactionType}
      />
    </AdvisorLayout>
  )
}

export default TransactionsPage
