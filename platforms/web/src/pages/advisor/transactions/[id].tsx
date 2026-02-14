import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { transactionsApi, clientsApi } from '@/services/api'
import {
  useFATheme,
  formatCurrency,
  formatDate,
  getTransactionTypeColor,
} from '@/utils/fa'
import { Transaction, TransactionStatus } from '@/utils/faTypes'
import {
  FACard,
  FATintedCard,
  FAChip,
  FAButton,
  FASectionHeader,
  FALoadingState,
  useNotification,
} from '@/components/advisor/shared'

const TransactionDetailPage = () => {
  const router = useRouter()
  const { id } = router.query
  const { colors, isDark } = useFATheme()
  const notification = useNotification()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [clientDetails, setClientDetails] = useState<{ name: string; email: string; phone: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    if (!id || typeof id !== 'string') return

    const fetchTransaction = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await transactionsApi.getById<Transaction>(id)
        setTransaction({
          id: data.id,
          clientId: data.clientId,
          clientName: data.clientName || 'Unknown',
          type: data.type,
          fundName: data.fundName,
          fundSchemeCode: data.fundSchemeCode,
          fundCategory: data.fundCategory || 'N/A',
          folioNumber: data.folioNumber || '',
          amount: Number(data.amount),
          units: Number(data.units),
          nav: Number(data.nav),
          date: data.date?.split('T')[0] || '',
          status: data.status,
          orderId: data.orderId,
          paymentMode: data.paymentMode,
          remarks: data.remarks,
        })

        // Fetch client details
        if (data.clientId) {
          try {
            const client = await clientsApi.getById<{ name: string; email: string; phone: string }>(data.clientId)
            setClientDetails(client)
          } catch {
            // Ignore client fetch errors
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction')
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [id])

  const handleUpdateStatus = async (newStatus: TransactionStatus) => {
    if (!transaction) return
    setUpdating(true)

    try {
      await transactionsApi.updateStatus(transaction.id, newStatus)
      setTransaction({ ...transaction, status: newStatus })
      notification.success('Status Updated', `Transaction status changed to ${newStatus}`)
    } catch (err) {
      notification.error('Update Failed', err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!transaction) return
    setUpdating(true)

    try {
      await transactionsApi.cancel(transaction.id)
      setTransaction({ ...transaction, status: 'Cancelled' })
      notification.success('Transaction Cancelled', 'The transaction has been cancelled successfully')
      setShowCancelConfirm(false)
    } catch (err) {
      notification.error('Cancellation Failed', err instanceof Error ? err.message : 'Failed to cancel transaction')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'Completed': return colors.success
      case 'Pending': return colors.warning
      case 'Processing': return colors.primary
      case 'Failed': return colors.error
      case 'Cancelled': return colors.textTertiary
      default: return colors.textSecondary
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Buy':
      case 'SIP':
        return 'M12 4v16m8-8H4'
      case 'Sell':
      case 'SWP':
        return 'M20 12H4'
      case 'Switch':
      case 'STP':
        return 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
      default:
        return 'M12 4v16m8-8H4'
    }
  }

  if (loading) {
    return (
      <AdvisorLayout title="Transaction Details">
        <FALoadingState message="Loading transaction..." />
      </AdvisorLayout>
    )
  }

  if (error && !transaction) {
    return (
      <AdvisorLayout title="Transaction Details">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <FAButton onClick={() => router.push('/advisor/transactions')}>
            Back to Transactions
          </FAButton>
        </div>
      </AdvisorLayout>
    )
  }

  if (!transaction) return null

  const canCancel = transaction.status === 'Pending' || transaction.status === 'Processing'
  const canUpdateStatus = transaction.status !== 'Completed' && transaction.status !== 'Cancelled' && transaction.status !== 'Failed'

  return (
    <AdvisorLayout title="Transaction Details">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Back Button */}
        <Link
          href="/advisor/transactions"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-all hover:opacity-80"
          style={{ color: colors.primary }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Transactions
        </Link>

        {/* Transaction Header */}
        <FACard padding="lg" className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: `${getTransactionTypeColor(transaction.type, colors)}15`,
                }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: getTransactionTypeColor(transaction.type, colors) }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={getTypeIcon(transaction.type)} />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    {transaction.type} Transaction
                  </h1>
                  <FAChip color={getStatusColor(transaction.status)} size="sm">
                    {transaction.status}
                  </FAChip>
                </div>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Order ID: {transaction.orderId || 'N/A'} • {formatDate(transaction.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canUpdateStatus && (
                <FAButton
                  variant="secondary"
                  onClick={() => handleUpdateStatus('Completed')}
                  disabled={updating}
                >
                  Mark Completed
                </FAButton>
              )}
              {canCancel && (
                <FAButton
                  variant="secondary"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={updating}
                  style={{ borderColor: colors.error, color: colors.error }}
                >
                  Cancel
                </FAButton>
              )}
            </div>
          </div>
        </FACard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Fund Details */}
            <FACard padding="md">
              <FASectionHeader title="Fund Details" />
              <div className="space-y-4">
                <div>
                  <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                    {transaction.fundName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                      {transaction.fundCategory}
                    </span>
                    <span className="text-sm" style={{ color: colors.textTertiary }}>•</span>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                      Scheme Code: {transaction.fundSchemeCode}
                    </span>
                  </div>
                </div>
                {transaction.folioNumber && (
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Folio Number
                    </p>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {transaction.folioNumber}
                    </p>
                  </div>
                )}
              </div>
            </FACard>

            {/* Transaction Details */}
            <FACard padding="md">
              <FASectionHeader title="Transaction Details" />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                    Amount
                  </p>
                  <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                    Units
                  </p>
                  <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    {transaction.units.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                    NAV
                  </p>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {formatCurrency(transaction.nav)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                    Transaction Date
                  </p>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {formatDate(transaction.date)}
                  </p>
                </div>
                {transaction.paymentMode && (
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Payment Mode
                    </p>
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      {transaction.paymentMode}
                    </p>
                  </div>
                )}
              </div>
              {transaction.remarks && (
                <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                    Remarks
                  </p>
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {transaction.remarks}
                  </p>
                </div>
              )}
            </FACard>

            {/* Status Timeline */}
            <FACard padding="md">
              <FASectionHeader title="Status" />
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: transaction.status === 'Completed' ? colors.success : transaction.status === 'Failed' ? '#EF4444' : colors.primary }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {transaction.status}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
            </FACard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <FACard padding="md">
              <FASectionHeader title="Client Information" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    }}
                  >
                    {transaction.clientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>
                      {transaction.clientName}
                    </p>
                    {clientDetails && (
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {clientDetails.email}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/advisor/clients/${transaction.clientId}`}
                  className="block w-full text-center py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: colors.chipBg,
                    color: colors.primary,
                    border: `1px solid ${colors.chipBorder}`,
                  }}
                >
                  View Client Profile
                </Link>
              </div>
            </FACard>

            {/* Quick Actions */}
            <FACard padding="md">
              <FASectionHeader title="Quick Actions" />
              <div className="space-y-2">
                <button
                  className="w-full p-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-3"
                  style={{
                    background: isDark
                      ? 'rgba(147, 197, 253, 0.08)'
                      : 'rgba(59, 130, 246, 0.04)',
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textPrimary,
                  }}
                >
                  <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Confirmation
                </button>
                <button
                  className="w-full p-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-3"
                  style={{
                    background: isDark
                      ? 'rgba(147, 197, 253, 0.08)'
                      : 'rgba(59, 130, 246, 0.04)',
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textPrimary,
                  }}
                >
                  <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Confirmation
                </button>
                <button
                  className="w-full p-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-3"
                  style={{
                    background: isDark
                      ? 'rgba(147, 197, 253, 0.08)'
                      : 'rgba(59, 130, 246, 0.04)',
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textPrimary,
                  }}
                >
                  <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Similar Transaction
                </button>
              </div>
            </FACard>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCancelConfirm(false)}
            />
            <div
              className="relative w-full max-w-md p-6 rounded-2xl"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
              }}
            >
              <h3 className="text-base font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Cancel Transaction?
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                Are you sure you want to cancel this transaction? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <FAButton
                  variant="secondary"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1"
                >
                  Keep Transaction
                </FAButton>
                <FAButton
                  onClick={handleCancel}
                  disabled={updating}
                  className="flex-1"
                  style={{ background: colors.error }}
                >
                  {updating ? 'Cancelling...' : 'Yes, Cancel'}
                </FAButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvisorLayout>
  )
}

export default TransactionDetailPage
