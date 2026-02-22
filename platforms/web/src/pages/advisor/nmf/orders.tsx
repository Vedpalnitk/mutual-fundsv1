/**
 * NMF Orders Dashboard
 *
 * View and manage NSE NMF orders with filters, stats, and pagination.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { nmfApi } from '@/services/api'
import {
  FACard,
  FAButton,
  FAChip,
  FAEmptyState,
  FASpinner,
} from '@/components/advisor/shared'
import NmfOrderPlacementModal from '@/components/nmf/NmfOrderPlacementModal'
import NmfPaymentModal from '@/components/nmf/NmfPaymentModal'
import NmfStatusBadge from '@/components/nmf/NmfStatusBadge'

type NseOrderType = 'PURCHASE' | 'REDEMPTION' | 'SWITCH'
type NseOrderStatus =
  | 'PLACED'
  | 'TWO_FA_PENDING'
  | 'AUTH_PENDING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMATION_PENDING'
  | 'PENDING_RTA'
  | 'VALIDATED_RTA'
  | 'ALLOTMENT_DONE'
  | 'UNITS_TRANSFERRED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED'
  | 'SUBMITTED'

interface NseOrder {
  id: string
  orderId?: string
  clientId: string
  clientName?: string
  orderType: NseOrderType
  schemeName: string
  schemeCode?: string
  amount: number
  units?: number
  nav?: number
  folioNo?: string
  status: NseOrderStatus
  nseOrderId?: string
  nseResponseCode?: string
  nseResponseMessage?: string
  orderDate?: string
  createdAt: string
}

const ORDER_TYPE_COLORS: Record<NseOrderType, string> = {
  PURCHASE: '#10B981',
  REDEMPTION: '#EF4444',
  SWITCH: '#8B5CF6',
}

const ORDER_TYPE_LABELS: Record<NseOrderType, string> = {
  PURCHASE: 'Purchase',
  REDEMPTION: 'Redeem',
  SWITCH: 'Switch',
}

const STATUS_COLORS: Record<NseOrderStatus, string> = {
  PLACED: '#F59E0B',
  TWO_FA_PENDING: '#F59E0B',
  AUTH_PENDING: '#F59E0B',
  PAYMENT_PENDING: '#F97316',
  PAYMENT_CONFIRMATION_PENDING: '#F97316',
  PENDING_RTA: '#3B82F6',
  VALIDATED_RTA: '#3B82F6',
  ALLOTMENT_DONE: '#10B981',
  UNITS_TRANSFERRED: '#10B981',
  REJECTED: '#EF4444',
  CANCELLED: '#94A3B8',
  FAILED: '#EF4444',
  SUBMITTED: '#F59E0B',
}

const STATUS_LABELS: Record<NseOrderStatus, string> = {
  PLACED: 'Placed',
  TWO_FA_PENDING: '2FA Pending',
  AUTH_PENDING: 'Auth Pending',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_CONFIRMATION_PENDING: 'Payment Confirming',
  PENDING_RTA: 'Pending RTA',
  VALIDATED_RTA: 'Validated RTA',
  ALLOTMENT_DONE: 'Allotted',
  UNITS_TRANSFERRED: 'Units Transferred',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  SUBMITTED: 'Submitted',
}

const ORDER_TYPES: NseOrderType[] = ['PURCHASE', 'REDEMPTION', 'SWITCH']

const ALL_STATUSES: NseOrderStatus[] = [
  'PLACED', 'TWO_FA_PENDING', 'AUTH_PENDING', 'PAYMENT_PENDING',
  'PAYMENT_CONFIRMATION_PENDING', 'PENDING_RTA', 'VALIDATED_RTA',
  'ALLOTMENT_DONE', 'UNITS_TRANSFERRED', 'REJECTED', 'CANCELLED',
  'FAILED', 'SUBMITTED',
]

const PAGE_SIZE = 25

const PAYMENT_ELIGIBLE_STATUSES: NseOrderStatus[] = [
  'PAYMENT_PENDING',
  'PLACED',
  'TWO_FA_PENDING',
  'AUTH_PENDING',
]

const NMFOrdersPage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()

  const [orders, setOrders] = useState<NseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [typeFilter, setTypeFilter] = useState<NseOrderType | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<NseOrderStatus | 'All'>('All')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const searchTimeout = useRef<NodeJS.Timeout>()

  // Order placement modal
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Expanded row
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  // Payment modal
  const [paymentOrder, setPaymentOrder] = useState<NseOrder | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearchTerm(value)
      setPage(1)
    }, 300)
  }

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params: { clientId?: string; status?: string; orderType?: string; page?: number; limit?: number } = {
        page,
        limit: PAGE_SIZE,
      }
      if (typeFilter !== 'All') params.orderType = typeFilter
      if (statusFilter !== 'All') params.status = statusFilter
      if (searchTerm) params.clientId = searchTerm

      const res = await nmfApi.orders.list(params)
      const data = Array.isArray(res) ? res : res?.data || []
      setOrders(data)
      setTotal(res?.total || data.length)
      setTotalPages(res?.totalPages || Math.ceil((res?.total || data.length) / PAGE_SIZE))
    } catch (err) {
      console.error('[NMF Orders] Error:', err)
      setError('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter, searchTerm])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Stats
  const purchaseCount = orders.filter(o => o.orderType === 'PURCHASE').length
  const redeemCount = orders.filter(o => o.orderType === 'REDEMPTION').length
  const switchCount = orders.filter(o => o.orderType === 'SWITCH').length

  const clearFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setTypeFilter('All')
    setStatusFilter('All')
    setPage(1)
  }

  const hasActiveFilters = searchTerm || typeFilter !== 'All' || statusFilter !== 'All'
  const startItem = (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, total)

  const handleRowClick = (order: NseOrder) => {
    setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
  }

  const isPaymentEligible = (order: NseOrder) => {
    return order.orderType === 'PURCHASE' && PAYMENT_ELIGIBLE_STATUSES.includes(order.status)
  }

  return (
    <AdvisorLayout title="NMF Orders">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {total > 0 ? `${total.toLocaleString('en-IN')} NSE NMF orders` : 'Track NSE NMF order execution'}
            </p>
          </div>
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`,
            }}
          >
            + New Order
          </button>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'TOTAL ORDERS', value: total.toLocaleString('en-IN'), color: colors.primary },
            { label: 'PURCHASES', value: purchaseCount.toString(), color: '#10B981' },
            { label: 'REDEMPTIONS', value: redeemCount.toString(), color: '#EF4444' },
            { label: 'SWITCHES', value: switchCount.toString(), color: '#8B5CF6' },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="p-4 rounded-xl"
              style={{
                background: `${kpi.color}08`,
                border: `1px solid ${kpi.color}20`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: kpi.color }}>{kpi.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <FACard className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-xs relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: colors.textTertiary }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search client or scheme..."
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

            {/* Type filter pills */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setTypeFilter('All'); setPage(1) }}
                className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                style={{
                  background: typeFilter === 'All' ? `${colors.primary}15` : 'transparent',
                  border: `1px solid ${typeFilter === 'All' ? `${colors.primary}40` : colors.cardBorder}`,
                  color: typeFilter === 'All' ? colors.primary : colors.textTertiary,
                }}
              >
                All
              </button>
              {ORDER_TYPES.map(t => {
                const c = ORDER_TYPE_COLORS[t]
                const active = typeFilter === t
                return (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); setPage(1) }}
                    className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                    style={{
                      background: active ? `${c}15` : 'transparent',
                      border: `1px solid ${active ? `${c}40` : colors.cardBorder}`,
                      color: active ? c : colors.textTertiary,
                    }}
                  >
                    {ORDER_TYPE_LABELS[t]}
                  </button>
                )
              })}
            </div>

            <div className="w-px h-6" style={{ background: colors.cardBorder }} />

            {/* Status filter dropdown */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as NseOrderStatus | 'All'); setPage(1) }}
              className="h-9 px-3 rounded-lg text-sm focus:outline-none cursor-pointer"
              style={{
                background: colors.inputBg,
                border: `1px solid ${statusFilter !== 'All' ? colors.primary : colors.inputBorder}`,
                color: statusFilter !== 'All' ? colors.primary : colors.textSecondary,
              }}
            >
              <option value="All">All Status</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>

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

        {/* Orders Table */}
        <FACard padding="none" className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                />
                <span className="text-sm" style={{ color: colors.textSecondary }}>Loading orders...</span>
              </div>
            </div>
          ) : error ? (
            <div className="py-8">
              <FAEmptyState
                icon={
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                }
                title="Error loading orders"
                description={error}
                action={<FAButton onClick={fetchOrders}>Retry</FAButton>}
              />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-8">
              <FAEmptyState
                icon={
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title={hasActiveFilters ? 'No matching orders' : 'No NMF orders yet'}
                description={hasActiveFilters ? 'Try adjusting your filters' : 'Orders placed via NSE NMF will appear here'}
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
                          ? 'linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)',
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Scheme</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Type</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Amount</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Status</th>
                      <th className="w-8 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const typeColor = ORDER_TYPE_COLORS[order.orderType]
                      const statusColor = STATUS_COLORS[order.status] || colors.textTertiary
                      const statusLabel = STATUS_LABELS[order.status] || order.status
                      const dateStr = order.orderDate || order.createdAt
                      const isExpanded = expandedOrderId === order.id

                      return (
                        <>
                          <tr
                            key={order.id}
                            className="transition-colors cursor-pointer"
                            style={{
                              borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}`,
                              background: isExpanded
                                ? (isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)')
                                : 'transparent',
                            }}
                            onClick={() => handleRowClick(order)}
                            onMouseEnter={e => {
                              if (!isExpanded) e.currentTarget.style.background = isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)'
                            }}
                            onMouseLeave={e => {
                              if (!isExpanded) e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: colors.textSecondary }}>
                              {dateStr
                                ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                                : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium truncate max-w-[300px]" style={{ color: colors.textPrimary }}>
                                {order.schemeName}
                              </p>
                              {order.clientName && (
                                <p className="text-xs" style={{ color: colors.textTertiary }}>{order.clientName}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded"
                                style={{ background: `${typeColor}15`, color: typeColor }}
                              >
                                {ORDER_TYPE_LABELS[order.orderType]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap" style={{ color: colors.textPrimary }}>
                              {formatCurrency(order.amount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <NmfStatusBadge status={order.status} type="order" />
                            </td>
                            <td className="px-2 py-3">
                              <svg
                                className="w-4 h-4 transition-transform"
                                style={{
                                  color: colors.textTertiary,
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </td>
                          </tr>

                          {/* Expanded Detail Row */}
                          {isExpanded && (
                            <tr key={`${order.id}-detail`} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                              <td colSpan={6} className="px-4 pb-4 pt-0">
                                <div
                                  className="p-4 rounded-xl"
                                  style={{
                                    background: isDark
                                      ? 'linear-gradient(135deg, rgba(147,197,253,0.04) 0%, rgba(125,211,252,0.02) 100%)'
                                      : 'linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(56,189,248,0.01) 100%)',
                                    border: `1px solid ${colors.cardBorder}`,
                                  }}
                                >
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>Order ID</p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                        {order.nseOrderId || order.orderId || order.id.slice(0, 8)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>Client ID</p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{order.clientId}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>Scheme Code</p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{order.schemeCode || '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>Folio</p>
                                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{order.folioNo || '-'}</p>
                                    </div>
                                    {order.units != null && (
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>Units</p>
                                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{order.units.toFixed(4)}</p>
                                      </div>
                                    )}
                                    {order.nav != null && (
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>NAV</p>
                                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(order.nav)}</p>
                                      </div>
                                    )}
                                    {order.nseResponseMessage && (
                                      <div className="col-span-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: colors.textTertiary }}>NSE Response</p>
                                        <p className="text-sm" style={{ color: colors.textSecondary }}>{order.nseResponseMessage}</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/advisor/nmf/orders/${order.id}`)
                                      }}
                                      className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                                      style={{
                                        background: colors.chipBg,
                                        color: colors.primary,
                                        border: `1px solid ${colors.cardBorder}`,
                                      }}
                                    >
                                      View Details
                                    </button>

                                    {isPaymentEligible(order) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setPaymentOrder(order)
                                        }}
                                        className="px-4 py-2 rounded-full text-xs font-semibold text-white transition-all hover:shadow-lg"
                                        style={{
                                          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                                          boxShadow: `0 4px 14px ${colors.glassShadow}`,
                                        }}
                                      >
                                        Pay Now
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
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
                    {startItem}-{endItem} of {total.toLocaleString('en-IN')}
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
      </div>

      {/* Order Placement Modal */}
      <NmfOrderPlacementModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSuccess={() => {
          setShowOrderModal(false)
          fetchOrders()
        }}
      />

      {/* Payment Modal */}
      {paymentOrder && (
        <NmfPaymentModal
          isOpen={!!paymentOrder}
          onClose={() => setPaymentOrder(null)}
          orderId={paymentOrder.nseOrderId || paymentOrder.orderId || paymentOrder.id}
          amount={paymentOrder.amount}
          onSuccess={() => {
            setPaymentOrder(null)
            fetchOrders()
          }}
        />
      )}
    </AdvisorLayout>
  )
}

export default NMFOrdersPage
