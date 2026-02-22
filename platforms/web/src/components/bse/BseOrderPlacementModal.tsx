import { useState, useEffect } from 'react'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { bseApi } from '@/services/api'
import { organizationApi, OrganizationArn } from '@/services/api/business'
import BseSchemePicker from '@/components/bse/BseSchemePicker'

interface BseOrderPlacementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (order: any) => void
  defaultType?: 'purchase' | 'redeem' | 'switch' | 'spread'
  clientId?: string
  staffEuin?: string // Auto-populated for fa_staff users
}

type OrderType = 'purchase' | 'redeem' | 'switch' | 'spread'

interface SelectedScheme {
  id: string
  schemeCode: string
  schemeName: string
  isin?: string | null
  amcCode?: string | null
  purchaseAllowed: boolean
  sipAllowed: boolean
  minPurchaseAmt?: number | null
  minSipAmt?: number | null
}

const ORDER_TABS: { value: OrderType; label: string; color: string }[] = [
  { value: 'purchase', label: 'Purchase', color: '#10B981' },
  { value: 'redeem', label: 'Redeem', color: '#EF4444' },
  { value: 'switch', label: 'Switch', color: '#3B82F6' },
  { value: 'spread', label: 'Spread', color: '#F59E0B' },
]

export default function BseOrderPlacementModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'purchase',
  clientId: presetClientId,
  staffEuin,
}: BseOrderPlacementModalProps) {
  const { colors, isDark } = useFATheme()

  const [orderType, setOrderType] = useState<OrderType>(defaultType)
  const [clientId, setClientId] = useState(presetClientId || '')
  const [selectedScheme, setSelectedScheme] = useState<SelectedScheme | null>(null)
  const [toScheme, setToScheme] = useState<SelectedScheme | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ orderId: string; message: string } | null>(null)

  // EUIN + ARN
  const [euin, setEuin] = useState(staffEuin || '')
  const [arns, setArns] = useState<OrganizationArn[]>([])
  const [selectedArn, setSelectedArn] = useState('')

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderType(defaultType)
      setClientId(presetClientId || '')
      setSelectedScheme(null)
      setToScheme(null)
      setAmount('')
      setLoading(false)
      setError(null)
      setSuccess(null)
      setEuin(staffEuin || '')
      // Fetch ARNs
      organizationApi.listArns().then((data) => {
        setArns(data)
        const defaultArn = data.find(a => a.isDefault)
        if (defaultArn) setSelectedArn(defaultArn.arnNumber)
      }).catch(() => {})
    }
  }, [isOpen, defaultType, presetClientId, staffEuin])

  const getFilterType = (): 'purchase' | 'sip' | 'switch' | 'redemption' => {
    switch (orderType) {
      case 'purchase':
      case 'spread':
        return 'purchase'
      case 'redeem':
        return 'redemption'
      case 'switch':
        return 'switch'
    }
  }

  const parsedAmount = parseFloat(amount) || 0

  const handleSubmit = async () => {
    setError(null)

    if (!clientId.trim()) {
      setError('Client ID is required')
      return
    }
    if (!selectedScheme) {
      setError('Please select a scheme')
      return
    }
    if (parsedAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (orderType === 'switch' && !toScheme) {
      setError('Please select the target scheme for switch')
      return
    }

    setLoading(true)
    try {
      let response: any

      const euinArn = {
        ...(euin ? { euin } : {}),
        ...(selectedArn ? { arnNumber: selectedArn } : {}),
      }

      switch (orderType) {
        case 'purchase':
          response = await bseApi.orders.purchase({
            clientId: clientId.trim(),
            schemeCode: selectedScheme.schemeCode,
            amount: parsedAmount,
            buySell: 'P',
            buySellType: 'FRESH',
            ...euinArn,
          })
          break
        case 'redeem':
          response = await bseApi.orders.redeem({
            clientId: clientId.trim(),
            schemeCode: selectedScheme.schemeCode,
            amount: parsedAmount,
            buySell: 'R',
            ...euinArn,
          })
          break
        case 'switch':
          response = await bseApi.orders.switchOrder({
            clientId: clientId.trim(),
            fromSchemeCode: selectedScheme.schemeCode,
            toSchemeCode: toScheme!.schemeCode,
            amount: parsedAmount,
            buySellType: 'FRESH',
            ...euinArn,
          })
          break
        case 'spread':
          response = await bseApi.orders.spread({
            clientId: clientId.trim(),
            schemeCode: selectedScheme.schemeCode,
            amount: parsedAmount,
            ...euinArn,
          })
          break
      }

      const orderId = response?.data?.orderId || response?.data?.id || response?.orderId || 'N/A'
      setSuccess({
        orderId: String(orderId),
        message: `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} order placed successfully`,
      })
      onSuccess?.(response?.data || response)
    } catch (err: any) {
      setError(err?.message || err?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAmountChange = (value: string) => {
    // Allow only digits and a single decimal point
    const cleaned = value.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    setAmount(cleaned)
  }

  if (!isOpen) return null

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
        <div
          className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
          }}
        >
          <div className="p-8 text-center">
            {/* Success icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${colors.success}15` }}
            >
              <svg className="w-8 h-8" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
              {success.message}
            </h3>

            <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
              Order ID
            </p>
            <p className="text-base font-bold mb-6" style={{ color: colors.primary }}>
              {success.orderId}
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
                Close
              </button>
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
        className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden rounded-2xl"
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
            Place BSE Order
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

          {/* Order Type Tabs */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Order Type
            </label>
            <div className="flex gap-2">
              {ORDER_TABS.map((tab) => {
                const isActive = orderType === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setOrderType(tab.value)
                      setSelectedScheme(null)
                      setToScheme(null)
                      setAmount('')
                      setError(null)
                    }}
                    className="flex-1 py-2 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: isActive ? tab.color : colors.chipBg,
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      border: `1px solid ${isActive ? tab.color : colors.chipBorder}`,
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Client ID */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter BSE client ID"
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>

          {/* Scheme Selection */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              {orderType === 'switch' ? 'From Scheme' : 'Scheme'}
            </label>
            <BseSchemePicker
              onSelect={(scheme) => setSelectedScheme(scheme)}
              filterType={getFilterType()}
              placeholder={orderType === 'switch' ? 'Search source scheme...' : 'Search BSE schemes...'}
            />
            {selectedScheme && (
              <div
                className="mt-2 px-3 py-2 rounded-xl flex items-center justify-between"
                style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>
                    {selectedScheme.schemeName}
                  </p>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>
                    {selectedScheme.schemeCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScheme(null)}
                  className="ml-2 p-1 rounded-lg flex-shrink-0"
                  style={{ color: colors.textTertiary }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* To Scheme (Switch only) */}
          {orderType === 'switch' && (
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: colors.primary }}
              >
                To Scheme
              </label>
              <BseSchemePicker
                onSelect={(scheme) => setToScheme(scheme)}
                filterType="purchase"
                placeholder="Search target scheme..."
              />
              {toScheme && (
                <div
                  className="mt-2 px-3 py-2 rounded-xl flex items-center justify-between"
                  style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>
                      {toScheme.schemeName}
                    </p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      {toScheme.schemeCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToScheme(null)}
                    className="ml-2 p-1 rounded-lg flex-shrink-0"
                    style={{ color: colors.textTertiary }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Amount
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: colors.textTertiary }}
              >
                &#8377;
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 pl-9 pr-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              />
            </div>
            {parsedAmount > 0 && (
              <p className="mt-1 text-xs" style={{ color: colors.textTertiary }}>
                {formatCurrency(parsedAmount, { short: true })}
              </p>
            )}
          </div>

          {/* EUIN & ARN */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: colors.primary }}
              >
                EUIN
              </label>
              <input
                type="text"
                value={euin}
                onChange={(e) => setEuin(e.target.value)}
                placeholder="E123456"
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              />
              {staffEuin && (
                <p className="mt-1 text-xs" style={{ color: colors.textTertiary }}>
                  Auto-filled from staff profile
                </p>
              )}
            </div>
            {arns.length > 1 && (
              <div className="flex-1">
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: colors.primary }}
                >
                  ARN
                </label>
                <select
                  value={selectedArn}
                  onChange={(e) => setSelectedArn(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textPrimary,
                  }}
                >
                  {arns.filter(a => a.isActive).map((arn) => (
                    <option key={arn.id} value={arn.arnNumber}>
                      {arn.arnNumber}{arn.label ? ` — ${arn.label}` : ''}{arn.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

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
                Placing...
              </span>
            ) : (
              `Place ${orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
