/**
 * NMF Order Detail Page
 *
 * View full order details with lifecycle timeline, NSE response info, and actions.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, formatDate } from '@/utils/fa'
import { nmfApi } from '@/services/api'
import { FACard, FAButton, FASpinner } from '@/components/advisor/shared'
import NmfPaymentModal from '@/components/nmf/NmfPaymentModal'
import NmfStatusBadge from '@/components/nmf/NmfStatusBadge'
import NmfOrderTimeline from '@/components/nmf/NmfOrderTimeline'

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

interface OrderDetail {
  id: string
  orderId?: string
  clientId: string
  clientName?: string
  clientCode?: string
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
  updatedAt?: string
}

const ORDER_TYPE_COLORS: Record<NseOrderType, string> = {
  PURCHASE: '#10B981',
  REDEMPTION: '#EF4444',
  SWITCH: '#8B5CF6',
}

const ORDER_TYPE_LABELS: Record<NseOrderType, string> = {
  PURCHASE: 'Purchase',
  REDEMPTION: 'Redemption',
  SWITCH: 'Switch',
}

const TERMINAL_STATUSES: NseOrderStatus[] = ['REJECTED', 'CANCELLED', 'FAILED']

const NMFOrderDetailPage = () => {
  const router = useRouter()
  const { id } = router.query
  const { colors } = useFATheme()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Actions
  const [cancelling, setCancelling] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!id || typeof id !== 'string') return
    try {
      setLoading(true)
      setError(null)
      const data = await nmfApi.orders.getOne(id)
      setOrder(data)
    } catch (err) {
      console.error('[NMF Order Detail] Error:', err)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleCancel = async () => {
    if (!id || typeof id !== 'string') return
    try {
      setCancelling(true)
      setActionError(null)
      await nmfApi.orders.cancel(id)
      await fetchOrder()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    fetchOrder()
  }

  const typeColor = ORDER_TYPE_COLORS[order?.orderType || 'PURCHASE'] || colors.textTertiary
  const isCancellable = order?.status === 'PLACED' || order?.status === 'SUBMITTED'
  const isPaymentPending = order?.status === 'PAYMENT_PENDING' || order?.status === 'PAYMENT_CONFIRMATION_PENDING'
  const isTerminal = order ? TERMINAL_STATUSES.includes(order.status) : false

  if (loading) {
    return (
      <AdvisorLayout title="Order Detail">
        <div className="flex items-center justify-center py-20">
          <FASpinner size="lg" />
        </div>
      </AdvisorLayout>
    )
  }

  if (error || !order) {
    return (
      <AdvisorLayout title="Order Detail">
        <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: colors.error }}>{error || 'Order not found'}</p>
            <FAButton className="mt-4" variant="secondary" onClick={() => router.push('/advisor/nmf/orders')}>
              Back to Orders
            </FAButton>
          </div>
        </div>
      </AdvisorLayout>
    )
  }

  return (
    <AdvisorLayout title="Order Detail">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/advisor/nmf/orders')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              color: colors.primary,
              background: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                Order {order.nseOrderId || order.orderId || order.id.slice(0, 8)}
              </h1>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}
              >
                {ORDER_TYPE_LABELS[order.orderType]}
              </span>
              <NmfStatusBadge status={order.status} type="order" size="md" />
            </div>
            <p className="text-sm mt-0.5 truncate" style={{ color: colors.textSecondary }}>
              {order.schemeName}
            </p>
          </div>
        </div>

        {/* Order Lifecycle Timeline */}
        <FACard className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
            Order Progress
          </p>

          {/* Terminal status banner */}
          {isTerminal && (
            <div
              className="flex items-center gap-2 mb-4 p-3 rounded-lg"
              style={{
                background: `${colors.error}08`,
                border: `1px solid ${colors.error}20`,
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs font-medium" style={{ color: colors.error }}>
                This order has been {order.status.toLowerCase().replace(/_/g, ' ')}.
                {order.nseResponseMessage && ` Reason: ${order.nseResponseMessage}`}
              </p>
            </div>
          )}

          <NmfOrderTimeline currentStatus={order.status} />
        </FACard>

        {/* Order Details Card */}
        <FACard className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
            Order Details
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Scheme', value: order.schemeName },
              { label: 'Order Type', value: ORDER_TYPE_LABELS[order.orderType] },
              { label: 'Amount', value: formatCurrency(order.amount) },
              { label: 'Units', value: order.units ? order.units.toFixed(3) : '-' },
              { label: 'NAV', value: order.nav ? formatCurrency(order.nav) : '-' },
              { label: 'Client', value: order.clientName ? `${order.clientName}${order.clientCode ? ` (${order.clientCode})` : ''}` : order.clientId },
              { label: 'Folio', value: order.folioNo || '-' },
              { label: 'Scheme Code', value: order.schemeCode || '-' },
              { label: 'Order Date', value: order.orderDate ? formatDate(order.orderDate) : '-' },
              { label: 'Created', value: order.createdAt ? formatDate(order.createdAt) : '-' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs" style={{ color: colors.textTertiary }}>{item.label}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>{item.value}</p>
              </div>
            ))}
          </div>
        </FACard>

        {/* NSE Response Details */}
        {(order.nseOrderId || order.nseResponseCode || order.nseResponseMessage) && (
          <FACard className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
              NSE Response
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {order.nseOrderId && (
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>NSE Order ID</p>
                  <p className="text-sm font-medium font-mono mt-0.5" style={{ color: colors.textPrimary }}>{order.nseOrderId}</p>
                </div>
              )}
              {order.nseResponseCode && (
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Response Code</p>
                  <p className="text-sm font-medium font-mono mt-0.5" style={{ color: colors.textPrimary }}>{order.nseResponseCode}</p>
                </div>
              )}
              {order.nseResponseMessage && (
                <div className="col-span-full">
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Response Message</p>
                  <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>{order.nseResponseMessage}</p>
                </div>
              )}
            </div>
          </FACard>
        )}

        {/* Actions */}
        {(isCancellable || isPaymentPending) && (
          <FACard>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
              Actions
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {isPaymentPending && (
                <FAButton
                  onClick={() => setShowPaymentModal(true)}
                  size="sm"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  }
                >
                  Initiate Payment
                </FAButton>
              )}

              {isCancellable && (
                <FAButton
                  onClick={handleCancel}
                  loading={cancelling}
                  variant="danger"
                  size="sm"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                >
                  Cancel Order
                </FAButton>
              )}
            </div>

            {actionError && (
              <p className="text-xs mt-3" style={{ color: colors.error }}>{actionError}</p>
            )}
          </FACard>
        )}
      </div>

      {/* Payment Modal */}
      {id && typeof id === 'string' && (
        <NmfPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId={id}
          amount={order?.amount || 0}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </AdvisorLayout>
  )
}

export default NMFOrderDetailPage
