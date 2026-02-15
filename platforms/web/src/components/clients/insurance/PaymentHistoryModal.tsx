import { useState, useEffect } from 'react'
import { useFATheme } from '@/utils/fa'
import { insuranceApi } from '@/services/api'

interface PremiumPayment {
  id: string
  policyId: string
  amountPaid: number
  paymentDate: string
  paymentMode?: string
  receiptNumber?: string
  notes?: string
  createdAt?: string
}

const MODE_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  UPI: 'UPI',
  AUTO_DEBIT: 'Auto Debit',
}

function formatAmount(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

interface PaymentHistoryModalProps {
  clientId: string
  policyId: string
  onClose: () => void
}

export default function PaymentHistoryModal({ clientId, policyId, onClose }: PaymentHistoryModalProps) {
  const { colors, isDark } = useFATheme()
  const [payments, setPayments] = useState<PremiumPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [clientId, policyId])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await insuranceApi.getPaymentHistory(clientId, policyId) as PremiumPayment[]
      setPayments(data)
    } catch {
      // Handle gracefully
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6"
        style={{
          background: isDark ? colors.backgroundSecondary : '#FFFFFF',
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.3)`,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Payment History
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: colors.chipBg }}
          >
            <svg className="w-4 h-4" style={{ color: colors.textSecondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No payments recorded</p>
            <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Record a premium payment to start tracking</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  {['Date', 'Amount', 'Mode', 'Receipt', 'Notes'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: colors.textTertiary }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                  >
                    <td className="py-3 px-3" style={{ color: colors.textPrimary }}>
                      {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3 font-medium" style={{ color: colors.primary }}>
                      {formatAmount(payment.amountPaid)}
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: colors.textSecondary }}>
                      {payment.paymentMode ? MODE_LABELS[payment.paymentMode] || payment.paymentMode : '-'}
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: colors.textTertiary }}>
                      {payment.receiptNumber || '-'}
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: colors.textTertiary }}>
                      {payment.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
