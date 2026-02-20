import { useState, useEffect } from 'react'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { nmfApi } from '@/services/api'

interface NmfPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  amount: number
  onSuccess?: () => void
}

type PaymentMode = 'MANDATE' | 'UPI' | 'NETBANKING' | 'RTGS' | 'NEFT' | 'CHEQUE'

const PAYMENT_MODES: { value: PaymentMode; label: string; description: string; icon: string }[] = [
  {
    value: 'MANDATE',
    label: 'Mandate',
    description: 'Auto-debit mandate',
    icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
  },
  {
    value: 'UPI',
    label: 'UPI',
    description: 'UPI VPA payment',
    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
  },
  {
    value: 'NETBANKING',
    label: 'Net Banking',
    description: 'Online bank transfer',
    icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21',
  },
  {
    value: 'RTGS',
    label: 'RTGS',
    description: 'Real-time transfer',
    icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  },
  {
    value: 'NEFT',
    label: 'NEFT',
    description: 'Bank transfer',
    icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
  },
  {
    value: 'CHEQUE',
    label: 'Cheque',
    description: 'Physical cheque',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  },
]

export default function NmfPaymentModal({
  isOpen,
  onClose,
  orderId,
  amount,
  onSuccess,
}: NmfPaymentModalProps) {
  const { colors, isDark } = useFATheme()

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI')
  const [mandateId, setMandateId] = useState('')
  const [vpa, setVpa] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [utrNo, setUtrNo] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [chequeDate, setChequeDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPaymentMode('UPI')
      setMandateId('')
      setVpa('')
      setBankCode('')
      setUtrNo('')
      setChequeNo('')
      setChequeDate('')
      setLoading(false)
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  const validate = (): string | null => {
    switch (paymentMode) {
      case 'MANDATE':
        if (!mandateId.trim()) return 'Please enter a mandate ID'
        break
      case 'UPI':
        if (!vpa.trim()) return 'Please enter a UPI VPA'
        if (!vpa.includes('@')) return 'Please enter a valid UPI VPA (e.g., user@upi)'
        break
      case 'NETBANKING':
        if (!bankCode.trim()) return 'Please enter a bank code'
        break
      case 'RTGS':
      case 'NEFT':
        if (!utrNo.trim()) return 'Please enter a UTR number'
        break
      case 'CHEQUE':
        if (!chequeNo.trim()) return 'Please enter a cheque number'
        if (!chequeDate) return 'Please select a cheque date'
        break
    }
    return null
  }

  const handleSubmit = async () => {
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await nmfApi.payments.initiate(orderId, {
        paymentMode,
        mandateId: paymentMode === 'MANDATE' ? mandateId.trim() : undefined,
        vpa: paymentMode === 'UPI' ? vpa.trim() : undefined,
        bankCode: paymentMode === 'NETBANKING' ? bankCode.trim() : undefined,
        utrNo: ['RTGS', 'NEFT'].includes(paymentMode) ? utrNo.trim() : undefined,
        chequeNo: paymentMode === 'CHEQUE' ? chequeNo.trim() : undefined,
        chequeDate: paymentMode === 'CHEQUE' ? chequeDate : undefined,
      })

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err?.message || err?.data?.message || 'Payment initiation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}
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
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${colors.success}15` }}
            >
              <svg className="w-8 h-8" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Payment Initiated
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Payment of {formatCurrency(amount, { short: false })} has been initiated successfully.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderConditionalFields = () => {
    switch (paymentMode) {
      case 'MANDATE':
        return (
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Mandate ID
            </label>
            <input
              type="text"
              value={mandateId}
              onChange={(e) => setMandateId(e.target.value)}
              placeholder="Enter mandate ID"
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>
        )

      case 'UPI':
        return (
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              UPI VPA
            </label>
            <input
              type="text"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="e.g., username@upi"
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>
        )

      case 'NETBANKING':
        return (
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
              placeholder="e.g., HDFC, ICICI, SBI"
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>
        )

      case 'RTGS':
      case 'NEFT':
        return (
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              UTR Number
            </label>
            <input
              type="text"
              value={utrNo}
              onChange={(e) => setUtrNo(e.target.value.toUpperCase())}
              placeholder="Enter UTR number"
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
            <p className="mt-1 text-xs" style={{ color: colors.textTertiary }}>
              UTR from your {paymentMode} transfer
            </p>
          </div>
        )

      case 'CHEQUE':
        return (
          <div className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: colors.primary }}
              >
                Cheque Number
              </label>
              <input
                type="text"
                value={chequeNo}
                onChange={(e) => setChequeNo(e.target.value)}
                placeholder="Enter cheque number"
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: colors.primary }}
              >
                Cheque Date
              </label>
              <input
                type="date"
                value={chequeDate}
                onChange={(e) => setChequeDate(e.target.value)}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              />
            </div>
          </div>
        )

      default:
        return null
    }
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

          {/* Amount Display */}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: colors.textTertiary }}>
                    Order #{orderId}
                  </span>
                </div>
                <p className="text-lg font-bold mt-0.5" style={{ color: colors.primary }}>
                  {formatCurrency(amount, { short: false })}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Mode Selection */}
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
                        <p className="text-[11px]" style={{ color: colors.textTertiary }}>
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conditional Fields */}
          {renderConditionalFields()}

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
            onClick={handleSubmit}
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
