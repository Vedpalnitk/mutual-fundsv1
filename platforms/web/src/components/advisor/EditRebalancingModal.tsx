import { useState } from 'react'
import { useFATheme, formatCurrencyCompact } from '@/utils/fa'
import { RebalancingRoadmap } from '@/services/api'
import {
  FAButton,
  FAInput,
  FASelect,
  FATextarea,
} from '@/components/advisor/shared'

interface EditRebalancingModalProps {
  data: RebalancingRoadmap
  onSave: (rebalancingData: RebalancingRoadmap, editNotes: string) => Promise<void>
  onClose: () => void
}

interface EditableAction {
  action: string
  priority: string
  schemeName: string
  schemeCode: string
  assetClass: string
  currentValue?: number
  targetValue: number
  transactionAmount: number
  taxStatus?: string
  reason: string
  folioNumber?: string
}

const ACTION_OPTIONS = [
  { value: 'SELL', label: 'SELL' },
  { value: 'BUY', label: 'BUY' },
  { value: 'ADD_NEW', label: 'ADD NEW' },
  { value: 'HOLD', label: 'HOLD' },
]

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

const EditRebalancingModal = ({ data, onSave, onClose }: EditRebalancingModalProps) => {
  const { colors, isDark } = useFATheme()
  const [actions, setActions] = useState<EditableAction[]>(
    data.actions.map(a => ({ ...a }))
  )
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const updateAction = (index: number, field: keyof EditableAction, value: any) => {
    setActions(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addAction = () => {
    setActions(prev => [...prev, {
      action: 'BUY',
      priority: 'MEDIUM',
      schemeName: '',
      schemeCode: '',
      assetClass: 'Equity',
      targetValue: 0,
      transactionAmount: 0,
      reason: '',
    }])
  }

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index))
  }

  const totalSell = actions
    .filter(a => a.action === 'SELL')
    .reduce((sum, a) => sum + Math.abs(a.transactionAmount || 0), 0)
  const totalBuy = actions
    .filter(a => a.action === 'BUY' || a.action === 'ADD_NEW')
    .reduce((sum, a) => sum + Math.abs(a.transactionAmount || 0), 0)

  const handleSave = async () => {
    if (!editNotes.trim()) {
      alert('Please add edit notes describing what changed.')
      return
    }
    setSaving(true)
    try {
      const updatedData: RebalancingRoadmap = {
        ...data,
        actions,
        totalSellAmount: totalSell,
        totalBuyAmount: totalBuy,
      }
      await onSave(updatedData, editNotes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: colors.cardBorder }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
              Edit Rebalancing Actions
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Modify fund recommendations and create a new version
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all hover:scale-105" style={{ background: colors.chipBg, color: colors.textSecondary }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ background: `${colors.error}08`, border: `1px solid ${colors.error}20` }}>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Total Sell</p>
              <p className="text-lg font-bold" style={{ color: colors.error }}>{formatCurrencyCompact(totalSell)}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}20` }}>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Total Buy</p>
              <p className="text-lg font-bold" style={{ color: colors.success }}>{formatCurrencyCompact(totalBuy)}</p>
            </div>
          </div>

          {/* Actions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <th className="text-left py-2 pr-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Action</th>
                  <th className="text-left py-2 pr-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Priority</th>
                  <th className="text-left py-2 pr-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Fund Name</th>
                  <th className="text-left py-2 pr-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Asset Class</th>
                  <th className="text-right py-2 pr-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Target (₹)</th>
                  <th className="text-right py-2 pr-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Amount (₹)</th>
                  <th className="text-left py-2 pr-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Reason</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <td className="py-2 pr-2">
                      <select
                        value={action.action}
                        onChange={e => updateAction(i, 'action', e.target.value)}
                        className="h-8 px-2 rounded-lg text-xs focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      >
                        {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={action.priority}
                        onChange={e => updateAction(i, 'priority', e.target.value)}
                        className="h-8 px-2 rounded-lg text-xs focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      >
                        {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={action.schemeName}
                        onChange={e => updateAction(i, 'schemeName', e.target.value)}
                        placeholder="Fund name..."
                        className="h-8 px-2 rounded-lg text-xs w-full min-w-[140px] focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={action.assetClass}
                        onChange={e => updateAction(i, 'assetClass', e.target.value)}
                        className="h-8 px-2 rounded-lg text-xs w-20 focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={action.targetValue || ''}
                        onChange={e => updateAction(i, 'targetValue', Number(e.target.value))}
                        className="h-8 px-2 rounded-lg text-xs w-24 text-right focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={action.transactionAmount || ''}
                        onChange={e => updateAction(i, 'transactionAmount', Number(e.target.value))}
                        className="h-8 px-2 rounded-lg text-xs w-24 text-right focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={action.reason}
                        onChange={e => updateAction(i, 'reason', e.target.value)}
                        placeholder="Reason..."
                        className="h-8 px-2 rounded-lg text-xs w-full min-w-[100px] focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeAction(i)}
                        className="p-1 rounded-md transition-all hover:scale-110"
                        style={{ color: colors.error }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addAction}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md"
            style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.cardBorder}` }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Action
          </button>

          {/* Edit Notes */}
          <div className="mt-6">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              Edit Notes *
            </label>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Describe what you changed and why (e.g., 'Replaced HDFC Flexi Cap with Parag Parikh for better international diversification')"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: colors.cardBorder }}>
          <FAButton variant="secondary" onClick={onClose}>Cancel</FAButton>
          <FAButton onClick={handleSave} loading={saving}>
            Save New Version
          </FAButton>
        </div>
      </div>
    </div>
  )
}

export default EditRebalancingModal
