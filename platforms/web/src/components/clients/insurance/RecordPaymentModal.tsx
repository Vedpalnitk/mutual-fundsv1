import { useState } from 'react'
import { useFATheme } from '@/utils/fa'

const PAYMENT_MODES = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'UPI', label: 'UPI' },
  { value: 'AUTO_DEBIT', label: 'Auto Debit' },
]

interface RecordPaymentModalProps {
  premiumAmount: number
  onClose: () => void
  onSave: (data: any) => void
  isSaving?: boolean
}

export default function RecordPaymentModal({ premiumAmount, onClose, onSave, isSaving }: RecordPaymentModalProps) {
  const { colors, isDark } = useFATheme()

  const [amountPaid, setAmountPaid] = useState(String(premiumAmount))
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [notes, setNotes] = useState('')

  const isValid = Number(amountPaid) > 0 && paymentDate !== ''

  const handleSubmit = () => {
    if (!isValid) return
    onSave({
      amountPaid: Number(amountPaid),
      paymentDate,
      paymentMode,
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl p-6"
        style={{
          background: isDark ? colors.backgroundSecondary : '#FFFFFF',
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.3)`,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Record Payment
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

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              Amount (₹)
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              Receipt Number (optional)
            </label>
            <input
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g. REC-2026-001"
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl text-sm transition-all focus:outline-none resize-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full font-semibold text-sm transition-all"
              style={{
                background: colors.chipBg,
                color: colors.textSecondary,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSaving}
              className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              {isSaving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
