import { useFATheme, formatCurrency, formatCurrencyCompact, formatDate } from '@/utils/fa'
import { Client, Holding, SIP } from '@/utils/faTypes'
import {
  FACard,
  FASectionHeader,
  FAEmptyState,
} from '@/components/advisor/shared'
import PortfolioValueChart from '@/components/advisor/PortfolioValueChart'

type TabId = 'overview' | 'family' | 'holdings' | 'transactions' | 'sips' | 'goals' | 'notes' | 'reports' | 'insurance' | 'bse'

interface OverviewTabProps {
  client: Client
  clientId: string
  holdings: Holding[]
  sips: SIP[]
  allocationData: { assetClass: string; value: number; percentage: number; color: string }[]
  onTabChange: (tab: TabId) => void
}

export default function OverviewTab({ client, clientId, holdings, sips, allocationData, onTabChange }: OverviewTabProps) {
  const { colors, isDark } = useFATheme()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-1 lg:col-span-2 space-y-6">
        {/* Portfolio Value Chart */}
        {clientId && (
          <FACard padding="md">
            <FASectionHeader title="Portfolio Value" />
            <PortfolioValueChart clientId={clientId} />
          </FACard>
        )}

        {/* Holdings Summary */}
        <FACard padding="md">
          <FASectionHeader
            title="Holdings"
            action={
              holdings.length > 0 ? (
                <button
                  onClick={() => onTabChange('holdings')}
                  className="text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ color: colors.primary }}
                >
                  View All ({holdings.length})
                </button>
              ) : undefined
            }
          />
          {holdings.length === 0 ? (
            <FAEmptyState
              icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              title="No Holdings"
              description="This client has no portfolio holdings yet"
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
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Fund</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Value</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {[...holdings]
                    .sort((a, b) => b.currentValue - a.currentValue)
                    .slice(0, 5)
                    .map((holding) => (
                    <tr key={holding.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{holding.fundName}</p>
                        <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{holding.assetClass} &middot; {holding.units.toFixed(2)} units</p>
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <p className="font-medium" style={{ color: colors.textPrimary }}>{formatCurrencyCompact(holding.currentValue)}</p>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="font-medium" style={{ color: holding.absoluteGainPercent >= 0 ? colors.success : colors.error }}>
                          {holding.absoluteGainPercent >= 0 ? '+' : ''}{holding.absoluteGainPercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {holdings.length > 5 && (
                <button
                  onClick={() => onTabChange('holdings')}
                  className="w-full text-center text-xs font-medium py-3 transition-opacity hover:opacity-80"
                  style={{ color: colors.primary }}
                >
                  +{holdings.length - 5} more holdings
                </button>
              )}
            </div>
          )}
        </FACard>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Client Details */}
        <FACard padding="md">
          <FASectionHeader title="Client Details" />
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>PAN</p>
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.pan || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Date of Birth</p>
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.dateOfBirth ? formatDate(client.dateOfBirth) : 'N/A'}</p>
            </div>
            {client.address && (
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Address</p>
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {client.address}, {client.city}
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {client.state} - {client.pincode}
                </p>
              </div>
            )}
            {client.nominee && (
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Nominee</p>
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.nominee.name}</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {client.nominee.relationship} ({client.nominee.percentage}%)
                </p>
              </div>
            )}
          </div>
        </FACard>
      </div>
    </div>
  )
}
