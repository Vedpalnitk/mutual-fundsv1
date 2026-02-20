import { useState } from 'react'
import { useFATheme, formatCurrencyCompact } from '@/utils/fa'
import { goalsApi } from '@/services/api'

interface MapAssetsModalProps {
  clientId: string
  goalId: string
  existingMappings: any[]
  clientHoldings: {
    fundName: string
    fundSchemeCode: string
    folioNumber: string
    currentValue: number
    assetClass: string
  }[]
  onSave: () => void
  onClose: () => void
}

type NonMFAssetType =
  | 'FIXED_DEPOSIT'
  | 'INSURANCE_POLICY'
  | 'REAL_ESTATE'
  | 'GOLD'
  | 'EQUITY_STOCKS'
  | 'PPF'
  | 'NPS'
  | 'OTHER'

interface ManualAsset {
  assetType: NonMFAssetType
  assetName: string
  currentValue: number
  allocationPercent: number
}

interface SelectedHolding {
  fundSchemeCode: string
  folioNumber: string
  allocationPercent: number
}

const ASSET_TYPE_OPTIONS: { value: NonMFAssetType; label: string }[] = [
  { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
  { value: 'INSURANCE_POLICY', label: 'Insurance Policy' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'EQUITY_STOCKS', label: 'Equity Stocks' },
  { value: 'PPF', label: 'PPF' },
  { value: 'NPS', label: 'NPS' },
  { value: 'OTHER', label: 'Other' },
]

const MapAssetsModal = ({
  clientId,
  goalId,
  existingMappings,
  clientHoldings,
  onSave,
  onClose,
}: MapAssetsModalProps) => {
  const { colors, isDark } = useFATheme()

  // MF holdings selection state
  const [selectedHoldings, setSelectedHoldings] = useState<Record<string, SelectedHolding>>(() => {
    const initial: Record<string, SelectedHolding> = {}
    existingMappings.forEach((m) => {
      if (m.fundSchemeCode) {
        const key = `${m.fundSchemeCode}-${m.folioNumber}`
        initial[key] = {
          fundSchemeCode: m.fundSchemeCode,
          folioNumber: m.folioNumber,
          allocationPercent: m.allocationPercent ?? 100,
        }
      }
    })
    return initial
  })

  // Manual assets state
  const [manualAssets, setManualAssets] = useState<ManualAsset[]>(() => {
    return existingMappings
      .filter((m) => !m.fundSchemeCode && m.assetType)
      .map((m) => ({
        assetType: m.assetType as NonMFAssetType,
        assetName: m.assetName || '',
        currentValue: m.currentValue || 0,
        allocationPercent: m.allocationPercent ?? 100,
      }))
  })

  // Manual entry form state
  const [newAssetType, setNewAssetType] = useState<NonMFAssetType>('FIXED_DEPOSIT')
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetValue, setNewAssetValue] = useState<number | ''>('')
  const [newAssetAllocation, setNewAssetAllocation] = useState(100)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleHolding = (holding: MapAssetsModalProps['clientHoldings'][0]) => {
    const key = `${holding.fundSchemeCode}-${holding.folioNumber}`
    setSelectedHoldings((prev) => {
      const next = { ...prev }
      if (next[key]) {
        delete next[key]
      } else {
        next[key] = {
          fundSchemeCode: holding.fundSchemeCode,
          folioNumber: holding.folioNumber,
          allocationPercent: 100,
        }
      }
      return next
    })
  }

  const updateHoldingAllocation = (key: string, value: number) => {
    setSelectedHoldings((prev) => ({
      ...prev,
      [key]: { ...prev[key], allocationPercent: Math.min(100, Math.max(0, value)) },
    }))
  }

  const addManualAsset = () => {
    if (!newAssetName.trim()) return
    if (!newAssetValue || newAssetValue <= 0) return

    setManualAssets((prev) => [
      ...prev,
      {
        assetType: newAssetType,
        assetName: newAssetName.trim(),
        currentValue: newAssetValue as number,
        allocationPercent: newAssetAllocation,
      },
    ])
    setNewAssetName('')
    setNewAssetValue('')
    setNewAssetAllocation(100)
    setNewAssetType('FIXED_DEPOSIT')
  }

  const removeManualAsset = (index: number) => {
    setManualAssets((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const promises: Promise<any>[] = []

      // Map selected MF holdings
      Object.values(selectedHoldings).forEach((h) => {
        const alreadyMapped = existingMappings.find(
          (m) => m.fundSchemeCode === h.fundSchemeCode && m.folioNumber === h.folioNumber
        )
        if (!alreadyMapped) {
          promises.push(
            goalsApi.addAssetMapping(clientId, goalId, {
              fundSchemeCode: h.fundSchemeCode,
              folioNumber: h.folioNumber,
              allocationPercent: h.allocationPercent,
              assetType: 'MUTUAL_FUND',
            })
          )
        }
      })

      // Map manual non-MF assets
      manualAssets.forEach((a) => {
        const alreadyMapped = existingMappings.find(
          (m) => m.assetType === a.assetType && m.assetName === a.assetName
        )
        if (!alreadyMapped) {
          promises.push(
            goalsApi.addAssetMapping(clientId, goalId, {
              assetType: a.assetType,
              assetName: a.assetName,
              currentValue: a.currentValue,
              allocationPercent: a.allocationPercent,
            })
          )
        }
      })

      await Promise.all(promises)
      onSave()
    } catch (err: any) {
      setError(err?.message || 'Failed to save asset mappings')
    } finally {
      setSaving(false)
    }
  }

  const totalMappedMF = Object.keys(selectedHoldings).length
  const totalManual = manualAssets.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: colors.cardBorder }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
              Map Assets to Goal
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Link mutual fund holdings and other assets to track goal progress
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{ background: colors.chipBg, color: colors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                background: `${colors.error}08`,
                border: `1px solid ${colors.error}20`,
                color: colors.error,
              }}
            >
              {error}
            </div>
          )}

          {/* ===== MF Holdings Section ===== */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: colors.chipBg }}
              >
                <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                Mutual Fund Holdings
              </span>
              {totalMappedMF > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                >
                  {totalMappedMF} selected
                </span>
              )}
            </div>

            {clientHoldings.length === 0 ? (
              <div
                className="p-4 rounded-xl text-center text-sm"
                style={{ background: colors.chipBg, color: colors.textTertiary }}
              >
                No mutual fund holdings found for this client
              </div>
            ) : (
              <div className="space-y-2">
                {clientHoldings.map((holding) => {
                  const key = `${holding.fundSchemeCode}-${holding.folioNumber}`
                  const isSelected = !!selectedHoldings[key]
                  const allocation = selectedHoldings[key]?.allocationPercent ?? 100

                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl transition-all duration-200"
                      style={{
                        background: isSelected
                          ? isDark
                            ? `${colors.primary}10`
                            : `${colors.primary}06`
                          : colors.chipBg,
                        border: `1px solid ${isSelected ? `${colors.primary}30` : colors.cardBorder}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleHolding(holding)}
                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            background: isSelected
                              ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                              : 'transparent',
                            border: `2px solid ${isSelected ? colors.primary : colors.inputBorder}`,
                          }}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Fund Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                            {holding.fundName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs" style={{ color: colors.textTertiary }}>
                              Folio: {holding.folioNumber}
                            </span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
                            >
                              {holding.assetClass}
                            </span>
                          </div>
                        </div>

                        {/* Value */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                            {formatCurrencyCompact(holding.currentValue)}
                          </p>
                        </div>
                      </div>

                      {/* Allocation slider (shown when selected) */}
                      {isSelected && (
                        <div className="mt-3 pl-8">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs" style={{ color: colors.textSecondary }}>
                              Allocation to this goal
                            </span>
                            <span className="text-xs font-bold" style={{ color: colors.primary }}>
                              {allocation}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={allocation}
                              onChange={(e) => updateHoldingAllocation(key, Number(e.target.value))}
                              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary} ${allocation}%, ${colors.progressBg} ${allocation}%, ${colors.progressBg} 100%)`,
                              }}
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={allocation}
                              onChange={(e) => updateHoldingAllocation(key, Number(e.target.value))}
                              className="w-16 h-8 px-2 rounded-lg text-xs text-center focus:outline-none"
                              style={{
                                background: colors.inputBg,
                                border: `1px solid ${colors.inputBorder}`,
                                color: colors.textPrimary,
                              }}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                            Mapped value: {formatCurrencyCompact((holding.currentValue * allocation) / 100)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: colors.cardBorder }} />

          {/* ===== Non-MF Assets Section ===== */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${colors.secondary}12` }}
              >
                <svg className="w-4 h-4" style={{ color: colors.secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                Other Assets
              </span>
              {totalManual > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                >
                  {totalManual} added
                </span>
              )}
            </div>

            {/* Added manual assets list */}
            {manualAssets.length > 0 && (
              <div className="space-y-2 mb-4">
                {manualAssets.map((asset, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl flex items-center gap-3"
                    style={{
                      background: isDark
                        ? `${colors.secondary}08`
                        : `${colors.secondary}04`,
                      border: `1px solid ${isDark ? `${colors.secondary}20` : `${colors.secondary}12`}`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                          {asset.assetName}
                        </p>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: colors.chipBg, color: colors.secondary, border: `1px solid ${colors.chipBorder}` }}
                        >
                          {ASSET_TYPE_OPTIONS.find((o) => o.value === asset.assetType)?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs" style={{ color: colors.textTertiary }}>
                          Value: {formatCurrencyCompact(asset.currentValue)}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: colors.primary }}>
                          {asset.allocationPercent}% allocated
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeManualAsset(index)}
                      className="p-1.5 rounded-lg transition-all hover:scale-110 flex-shrink-0"
                      style={{ color: colors.error, background: `${colors.error}08` }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add manual asset form */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: colors.chipBg,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.textTertiary }}>
                Add Non-MF Asset
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Asset Type */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Asset Type
                  </label>
                  <select
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value as NonMFAssetType)}
                    className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                    style={{
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                  >
                    {ASSET_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asset Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Asset Name
                  </label>
                  <input
                    type="text"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    placeholder="e.g. SBI FD, LIC Policy"
                    className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                    style={{
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                  />
                </div>

                {/* Current Value */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Current Value
                  </label>
                  <input
                    type="number"
                    value={newAssetValue}
                    onChange={(e) => setNewAssetValue(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    min={0}
                    className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                    style={{
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                  />
                </div>

                {/* Allocation % */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Allocation %
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={newAssetAllocation}
                      onChange={(e) => setNewAssetAllocation(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary} ${newAssetAllocation}%, ${colors.progressBg} ${newAssetAllocation}%, ${colors.progressBg} 100%)`,
                      }}
                    />
                    <span className="text-sm font-bold w-10 text-right" style={{ color: colors.primary }}>
                      {newAssetAllocation}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={addManualAsset}
                  disabled={!newAssetName.trim() || !newAssetValue || newAssetValue <= 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryDark} 100%)`,
                    color: '#FFFFFF',
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Asset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: colors.cardBorder }}
        >
          <div className="text-xs" style={{ color: colors.textTertiary }}>
            {totalMappedMF + totalManual} asset{totalMappedMF + totalManual !== 1 ? 's' : ''} mapped
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{
                background: colors.chipBg,
                color: colors.textSecondary,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (totalMappedMF + totalManual === 0)}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Mappings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapAssetsModal
