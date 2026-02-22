import { useState, useMemo } from 'react'
import { useFATheme, formatCurrency, formatCurrencyCompact } from '@/utils/fa'
import { Client, Holding } from '@/utils/faTypes'
import {
  FACard,
  FASectionHeader,
  FAChip,
  FAEmptyState,
} from '@/components/advisor/shared'

type HoldingCategory = 'All' | 'Equity' | 'Debt' | 'Hybrid' | 'ELSS' | 'Others'
type HoldingSort = 'value-desc' | 'value-asc' | 'returns-desc' | 'returns-asc'

interface HoldingsTabProps {
  client: Client
  holdings: Holding[]
}

export default function HoldingsTab({ client, holdings }: HoldingsTabProps) {
  const { colors, isDark } = useFATheme()
  const [holdingCategory, setHoldingCategory] = useState<HoldingCategory>('All')
  const [holdingSort, setHoldingSort] = useState<HoldingSort>('value-desc')

  const filteredHoldings = useMemo(() => {
    let result = [...holdings]

    if (holdingCategory !== 'All') {
      if (holdingCategory === 'ELSS') {
        result = result.filter(h => h.fundCategory?.toLowerCase().includes('elss') || h.fundCategory?.toLowerCase().includes('tax'))
      } else if (holdingCategory === 'Others') {
        result = result.filter(h => !['Equity', 'Debt', 'Hybrid'].includes(h.assetClass) && !h.fundCategory?.toLowerCase().includes('elss'))
      } else {
        result = result.filter(h => h.assetClass === holdingCategory)
      }
    }

    switch (holdingSort) {
      case 'value-desc': result.sort((a, b) => b.currentValue - a.currentValue); break
      case 'value-asc': result.sort((a, b) => a.currentValue - b.currentValue); break
      case 'returns-desc': result.sort((a, b) => b.absoluteGainPercent - a.absoluteGainPercent); break
      case 'returns-asc': result.sort((a, b) => a.absoluteGainPercent - b.absoluteGainPercent); break
    }

    return result
  }, [holdings, holdingCategory, holdingSort])

  return (
    <FACard padding="md">
      <FASectionHeader title="Portfolio Holdings" />

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['All', 'Equity', 'Debt', 'Hybrid', 'ELSS', 'Others'] as HoldingCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setHoldingCategory(cat)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: holdingCategory === cat
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.chipBg,
                color: holdingCategory === cat ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={holdingSort}
          onChange={(e) => setHoldingSort(e.target.value as HoldingSort)}
          className="px-3 py-1.5 rounded-md text-xs font-medium focus:outline-none"
          style={{
            background: colors.inputBg,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textPrimary,
          }}
        >
          <option value="value-desc">Value: High to Low</option>
          <option value="value-asc">Value: Low to High</option>
          <option value="returns-desc">Returns: High to Low</option>
          <option value="returns-asc">Returns: Low to High</option>
        </select>
      </div>

      {filteredHoldings.length === 0 ? (
        <FAEmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          title="No Holdings Found"
          description={holdingCategory !== 'All' ? `No ${holdingCategory} holdings found` : 'No portfolio holdings yet'}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{
                  background: isDark
                    ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                    : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                  borderBottom: `1px solid ${colors.cardBorder}`,
                }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Fund Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Units</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>NAV</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Current Value</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Returns</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.map((holding) => (
                <tr key={holding.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{holding.fundName}</p>
                      {holding.fundCategory && <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{holding.fundCategory}</p>}
                    </div>
                  </td>
                  <td className="py-3 pr-4"><FAChip size="xs">{holding.assetClass}</FAChip></td>
                  <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{holding.units.toFixed(2)}</td>
                  <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{formatCurrency(holding.currentNav)}</td>
                  <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(holding.currentValue)}</td>
                  <td className="py-3 text-right">
                    <span className="font-medium" style={{ color: holding.absoluteGainPercent >= 0 ? colors.success : colors.error }}>
                      {holding.absoluteGainPercent >= 0 ? '+' : ''}{holding.absoluteGainPercent.toFixed(1)}%
                    </span>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>{formatCurrencyCompact(holding.absoluteGain)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FACard>
  )
}
