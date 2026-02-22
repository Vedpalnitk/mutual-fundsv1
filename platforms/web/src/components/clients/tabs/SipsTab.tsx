import { useState } from 'react'
import { useFATheme, formatCurrency, formatDate } from '@/utils/fa'
import { Client, SIP, TransactionType } from '@/utils/faTypes'
import {
  FACard,
  FASectionHeader,
  FAChip,
  FAButton,
  FAEmptyState,
} from '@/components/advisor/shared'

interface SipsTabProps {
  client: Client
  sips: SIP[]
  onSipAction: (sipId: string, action: 'pause' | 'resume' | 'cancel') => Promise<void>
  onNewSip: () => void
}

export default function SipsTab({ client, sips, onSipAction, onNewSip }: SipsTabProps) {
  const { colors, isDark } = useFATheme()
  const [sipStatusFilter, setSipStatusFilter] = useState<'All' | 'Active' | 'Paused' | 'Cancelled'>('All')
  const [sipActionLoading, setSipActionLoading] = useState<string | null>(null)

  const getSipStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return colors.success
      case 'Paused': return colors.warning
      case 'Cancelled': case 'Failed': return colors.error
      default: return colors.textTertiary
    }
  }

  const handleAction = async (sipId: string, action: 'pause' | 'resume' | 'cancel') => {
    setSipActionLoading(sipId)
    try {
      await onSipAction(sipId, action)
    } finally {
      setSipActionLoading(null)
    }
  }

  const filteredSips = sips.filter(s => {
    if (sipStatusFilter === 'All') return true
    return s.status?.toLowerCase() === sipStatusFilter.toLowerCase()
  }).sort((a, b) => b.amount - a.amount)

  return (
    <FACard padding="md">
      <FASectionHeader
        title="SIP Management"
        action={
          <FAButton size="sm" onClick={onNewSip} icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }>
            New SIP
          </FAButton>
        }
      />

      {/* Status Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(['All', 'Active', 'Paused', 'Cancelled'] as const).map(status => (
          <button
            key={status}
            onClick={() => setSipStatusFilter(status)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: sipStatusFilter === status
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                : colors.chipBg,
              color: sipStatusFilter === status ? '#FFFFFF' : colors.textSecondary,
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredSips.length === 0 ? (
        <FAEmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          title="No SIPs Found"
          description={sipStatusFilter !== 'All' ? `No ${sipStatusFilter.toLowerCase()} SIPs` : 'Create a new SIP for this client'}
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
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Invested</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Current</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Returns</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSips.map((sip) => {
                const sipStatus = sip.status?.toLowerCase()
                const isActive = sipStatus === 'active'
                const isPaused = sipStatus === 'paused'
                const sipReturns = sip.returnsPercent !== 0
                  ? sip.returnsPercent
                  : sip.totalInvested > 0
                    ? ((sip.currentValue - sip.totalInvested) / sip.totalInvested) * 100
                    : 0

                return (
                  <tr key={sip.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <td className="py-3 pr-4">
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{sip.fundName}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: colors.textTertiary }}>
                        <span>Day {sip.sipDate}</span>
                        <span>{sip.completedInstallments} installments</span>
                        {sip.nextSipDate && <span>Next: {formatDate(sip.nextSipDate)}</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <FAChip color={getSipStatusColor(sip.status)} size="xs">{sip.status}</FAChip>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <p className="font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(sip.amount)}</p>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>/ {sip.frequency.toLowerCase()}</p>
                    </td>
                    <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{formatCurrency(sip.totalInvested)}</td>
                    <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(sip.currentValue)}</td>
                    <td className="py-3 pr-4 text-right">
                      {sipReturns !== 0 ? (
                        <span className="font-medium" style={{ color: sipReturns >= 0 ? colors.success : colors.error }}>
                          {sipReturns >= 0 ? '+' : ''}{sipReturns.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: colors.textTertiary }}>&mdash;</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isActive && (
                          <button
                            onClick={() => handleAction(sip.id, 'pause')}
                            disabled={sipActionLoading === sip.id}
                            className="p-1.5 rounded-md transition-all hover:scale-110"
                            style={{ background: `${colors.warning}15`, color: colors.warning }}
                            title="Pause SIP"
                          >
                            {sipActionLoading === sip.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                        {isPaused && (
                          <button
                            onClick={() => handleAction(sip.id, 'resume')}
                            disabled={sipActionLoading === sip.id}
                            className="p-1.5 rounded-md transition-all hover:scale-110"
                            style={{ background: `${colors.success}15`, color: colors.success }}
                            title="Resume SIP"
                          >
                            {sipActionLoading === sip.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                        {(isActive || isPaused) && (
                          <button
                            onClick={() => handleAction(sip.id, 'cancel')}
                            disabled={sipActionLoading === sip.id}
                            className="p-1.5 rounded-md transition-all hover:scale-110"
                            style={{ background: `${colors.error}15`, color: colors.error }}
                            title="Cancel SIP"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </FACard>
  )
}
