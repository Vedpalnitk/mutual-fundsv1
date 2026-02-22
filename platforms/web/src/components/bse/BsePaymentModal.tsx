import { useState, useEffect } from 'react'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { bseApi } from '@/services/api'

interface BsePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (payment: any) => void
  orderId: string
  amount: number
  schemeName?: string
}

type PaymentMode = 'DIRECT' | 'NODAL' | 'NEFT' | 'UPI'

const PAYMENT_MODES: { value: PaymentMode; label: string; description: string; icon: string }[] = [
  {
    value: 'DIRECT',
    label: 'Direct Pay',
    description: '6 Banks',
    icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21',
  },
  {
    value: 'NODAL',
    label: 'Net Banking',
    description: '50+ Banks',
    icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
  },
  {
    value: 'NEFT',
    label: 'NEFT Transfer',
    description: 'Bank Transfer',
    icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
  },
  {
    value: 'UPI',
    label: 'UPI Payment',
    description: 'UPI Apps',
    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
  },
]

export default function BsePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  amount,
  schemeName,
}: BsePaymentModalProps) {
  const { colors, isDark } = useFATheme()

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('DIRECT')
  const [bankCode, setBankCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentMode('DIRECT')
      setBankCode('')
      setLoading(false)
      setError(null)
      setRedirectUrl(null)
    }
  }, [isOpen])

  const showBankCodeInput = paymentMode === 'DIRECT' || paymentMode === 'NODAL'

  const handleConfirm = async () => {
    setError(null)

    if (showBankCodeInput && !bankCode.trim()) {
      setError('Please enter a bank code')
      return
    }

    setLoading(true)
    try {
      const response = await bseApi.payments.initiate(orderId, {
        paymentMode,
        bankCode: showBankCodeInput ? bankCode.trim() : undefined,
      })

      const url = response?.redirectUrl || null

      if (url) {
        setRedirectUrl(url)
      } else {
        onSuccess?.(response)
        onClose()
      }
    } catch (err: any) {
      setError(err?.message || err?.data?.message || 'Payment initiation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Redirect state
  if (redirectUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
        <div
          className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
          }}
        >
          <div className="p-8 text-center">
            {/* Redirect icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${colors.primary}15` }}
            >
              <svg className="w-8 h-8" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Complete Payment
            </h3>
            <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              You will be redirected to complete payment of{' '}
              <span className="font-semibold" style={{ color: colors.primary }}>
                {formatCurrency(amount, { short: false })}
              </span>
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: colors.chipBg,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                Cancel
              </button>
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onSuccess?.({ redirectUrl })
                  onClose()
                }}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg inline-flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`,
                }}
              >
                Proceed to Payment
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-hidden rounded-2xl"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
        >
          <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
            Initiate Payment
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all"
            style={{ background: colors.chipBg, color: colors.textSecondary }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto space-y-5" style={{ maxHeight: 'calc(90vh - 130px)' }}>

          {/* Order Summary */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}08 0%, ${colors.primary}03 100%)`,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${colors.primary}15` }}
              >
                <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                {schemeName && (
                  <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                    {schemeName}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: colors.textTertiary }}>
                    Order #{orderId}
                  </span>
                  <span className="text-xs" style={{ color: colors.textTertiary }}>|</span>
                  <span className="text-sm font-bold" style={{ color: colors.primary }}>
                    {formatCurrency(amount, { short: false })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_MODES.map((mode) => {
                const isSelected = paymentMode === mode.value
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      setPaymentMode(mode.value)
                      setBankCode('')
                      setError(null)
                    }}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.primary}05 100%)`
                        : colors.inputBg,
                      border: `1.5px solid ${isSelected ? colors.primary : colors.inputBorder}`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isSelected ? `${colors.primary}20` : colors.chipBg,
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: isSelected ? colors.primary : colors.textTertiary }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={mode.icon} />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                        >
                          {mode.label}
                        </p>
                        <p className="text-xs" style={{ color: colors.textTertiary }}>
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bank Code (conditional) */}
          {showBankCodeInput && (
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: colors.primary }}
              >
                Bank Code
              </label>
              <input
                type="text"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC, ICICI, SBI"
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              />
              <p className="mt-1 text-xs" style={{ color: colors.textTertiary }}>
                {paymentMode === 'DIRECT'
                  ? 'Enter the bank code for direct payment (limited banks)'
                  : 'Enter the bank code for net banking'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl flex items-start gap-3"
              style={{
                background: `${colors.error}10`,
                border: `1px solid ${colors.error}25`,
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: colors.error }}>{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-xs font-medium mt-1 underline"
                  style={{ color: colors.error }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex gap-3"
          style={{ borderTop: `1px solid ${colors.cardBorder}` }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: colors.chipBg,
              color: colors.textPrimary,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'transparent' }}
                />
                Processing...
              </span>
            ) : (
              `Pay ${formatCurrency(amount, { short: false })}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
