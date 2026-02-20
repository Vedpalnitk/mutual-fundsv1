import { useState, useEffect } from 'react'
import {
  advisorInsightsApi,
  DeepAnalysisResult,
  DeepAnalysisSection,
  PersonaAlignment,
  RiskAssessment,
  RebalancingRoadmap,
} from '@/services/api'
import {
  useFATheme,
  formatCurrency,
  formatCurrencyCompact,
} from '@/utils/fa'
import { FACard } from '@/components/advisor/shared'
import ExecuteRebalanceModal from '@/components/advisor/ExecuteRebalanceModal'

interface DeepAnalysisPanelProps {
  clientId: string
  clientName: string
}

const SectionSkeleton = ({ colors }: { colors: any }) => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 rounded w-1/3" style={{ background: colors.chipBg }} />
    <div className="h-3 rounded w-2/3" style={{ background: colors.chipBg }} />
    <div className="h-3 rounded w-1/2" style={{ background: colors.chipBg }} />
    <div className="h-3 rounded w-3/4" style={{ background: colors.chipBg }} />
  </div>
)

const SectionError = ({ message, colors }: { message: string; colors: any }) => (
  <div className="p-3 rounded-lg" style={{ background: `${colors.error}08`, border: `1px solid ${colors.error}20` }}>
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p className="text-xs" style={{ color: colors.error }}>{message}</p>
    </div>
  </div>
)

// ========== Persona Section ==========
const PersonaSection = ({ data, colors, isDark }: { data: PersonaAlignment; colors: any; isDark: boolean }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{data.primaryPersona}</p>
        <p className="text-xs" style={{ color: colors.textTertiary }}>Risk Band: {data.riskBand}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold" style={{ color: colors.primary }}>{(data.confidence * 100).toFixed(0)}%</p>
        <p className="text-xs" style={{ color: colors.textTertiary }}>Confidence</p>
      </div>
    </div>
    {data.description && (
      <p className="text-xs" style={{ color: colors.textSecondary }}>{data.description}</p>
    )}
    {/* Blended Allocation Bar */}
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>Recommended Allocation</p>
      <div className="flex h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
        {Object.entries(data.blendedAllocation)
          .filter(([, val]) => val > 0.01)
          .map(([key, val]) => {
            const barColors: Record<string, string> = {
              equity: colors.primary,
              debt: colors.success,
              hybrid: colors.warning,
              gold: '#F59E0B',
              international: colors.secondary,
              liquid: colors.textTertiary,
            }
            return (
              <div
                key={key}
                style={{ width: `${val * 100}%`, background: barColors[key] || colors.primary }}
                title={`${key}: ${(val * 100).toFixed(1)}%`}
              />
            )
          })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {Object.entries(data.blendedAllocation)
          .filter(([, val]) => val > 0.01)
          .map(([key, val]) => {
            const dotColors: Record<string, string> = {
              equity: colors.primary,
              debt: colors.success,
              hybrid: colors.warning,
              gold: '#F59E0B',
              international: colors.secondary,
              liquid: colors.textTertiary,
            }
            return (
              <span key={key} className="flex items-center gap-1 text-xs" style={{ color: colors.textTertiary }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColors[key] || colors.primary }} />
                {key.charAt(0).toUpperCase() + key.slice(1)} {(val * 100).toFixed(0)}%
              </span>
            )
          })}
      </div>
    </div>
    {/* Persona Distribution */}
    {data.distribution.length > 1 && (
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Persona Distribution</p>
        <div className="space-y-1">
          {data.distribution.slice(0, 3).map(d => (
            <div key={d.persona} className="flex items-center gap-2">
              <span className="text-xs w-24 truncate" style={{ color: colors.textTertiary }}>{d.persona}</span>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full" style={{ width: `${d.weight * 100}%`, background: colors.primary }} />
              </div>
              <span className="text-xs font-medium w-8 text-right" style={{ color: colors.textSecondary }}>{(d.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)

// ========== Risk Section ==========
const RiskSection = ({ data, colors, isDark }: { data: RiskAssessment; colors: any; isDark: boolean }) => {
  const riskColor = data.riskScore >= 70 ? colors.error : data.riskScore >= 40 ? colors.warning : colors.success
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${riskColor}12` }}>
            <span className="text-sm font-bold" style={{ color: riskColor }}>{data.riskScore}</span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{data.riskLevel}</p>
            <p className="text-xs" style={{ color: colors.textTertiary }}>Risk Score</p>
          </div>
        </div>
      </div>
      {/* Risk Factors */}
      {data.riskFactors.length > 0 && (
        <div className="space-y-1.5">
          {data.riskFactors.slice(0, 4).map((f, i) => {
            const severityColor = f.severity === 'high' ? colors.error : f.severity === 'medium' ? colors.warning : colors.success
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: severityColor }} />
                <span className="text-xs flex-1" style={{ color: colors.textSecondary }}>{f.name}</span>
                <span className="text-xs font-medium" style={{ color: severityColor }}>{(f.contribution * 100).toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
      )}
      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Recommendations</p>
          <ul className="space-y-0.5">
            {data.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-xs flex gap-1.5" style={{ color: colors.textTertiary }}>
                <span style={{ color: colors.primary }}>-</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ========== Rebalancing Section ==========
const RebalancingSection = ({ data, colors, isDark, clientId, clientName }: { data: RebalancingRoadmap; colors: any; isDark: boolean; clientId?: string; clientName?: string }) => {
  const [showExecuteModal, setShowExecuteModal] = useState(false)
  const alignColor = data.alignmentScore >= 0.8 ? colors.success : data.alignmentScore >= 0.5 ? colors.warning : colors.error
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ background: `${alignColor}15`, color: alignColor }}
          >
            {data.isAligned ? 'Aligned' : 'Needs Rebalancing'}
          </span>
          <span className="text-xs" style={{ color: colors.textTertiary }}>
            Score: {(data.alignmentScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      {/* Primary Issues */}
      {data.primaryIssues.length > 0 && (
        <div className="space-y-1">
          {data.primaryIssues.slice(0, 3).map((issue, i) => (
            <p key={i} className="text-xs flex gap-1.5" style={{ color: colors.warning }}>
              <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              {issue}
            </p>
          ))}
        </div>
      )}
      {/* Actions Table */}
      {data.actions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                <th className="text-left py-1.5 pr-2 font-semibold" style={{ color: colors.textTertiary }}>Action</th>
                <th className="text-left py-1.5 pr-2 font-semibold" style={{ color: colors.textTertiary }}>Fund</th>
                <th className="text-right py-1.5 pr-2 font-semibold" style={{ color: colors.textTertiary }}>Amount</th>
                <th className="text-left py-1.5 font-semibold" style={{ color: colors.textTertiary }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.actions.slice(0, 5).map((action, i) => {
                const actionColor = action.action === 'SELL' ? colors.error
                  : action.action === 'BUY' || action.action === 'ADD_NEW' ? colors.success
                  : colors.textSecondary
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <td className="py-1.5 pr-2">
                      <span className="font-medium px-1.5 py-0.5 rounded" style={{ background: `${actionColor}12`, color: actionColor }}>
                        {action.action}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 truncate max-w-[140px]" style={{ color: colors.textPrimary }}>{action.schemeName}</td>
                    <td className="py-1.5 pr-2 text-right font-medium" style={{ color: actionColor }}>
                      {action.transactionAmount >= 0 ? '+' : ''}{formatCurrencyCompact(Math.abs(action.transactionAmount))}
                    </td>
                    <td className="py-1.5 truncate max-w-[160px]" style={{ color: colors.textTertiary }}>{action.reason}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Summary */}
      <div className="flex gap-4 text-xs">
        {data.totalSellAmount > 0 && (
          <span style={{ color: colors.error }}>Sell: {formatCurrencyCompact(data.totalSellAmount)}</span>
        )}
        {data.totalBuyAmount > 0 && (
          <span style={{ color: colors.success }}>Buy: {formatCurrencyCompact(data.totalBuyAmount)}</span>
        )}
        {data.taxImpactSummary && (
          <span style={{ color: colors.textTertiary }}>{data.taxImpactSummary}</span>
        )}
      </div>
      {/* Execute Rebalancing Button */}
      {!data.isAligned && data.actions.length > 0 && clientId && (
        <button
          onClick={() => setShowExecuteModal(true)}
          className="w-full mt-2 py-2 rounded-full text-xs font-semibold text-white transition-all hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            boxShadow: `0 4px 14px ${colors.glassShadow}`,
          }}
        >
          Execute Rebalancing
        </button>
      )}
      {showExecuteModal && clientId && (
        <ExecuteRebalanceModal
          clientId={clientId}
          clientName={clientName || ''}
          actions={data.actions}
          onClose={() => setShowExecuteModal(false)}
          onComplete={() => setShowExecuteModal(false)}
        />
      )}
    </div>
  )
}

// ========== Main Panel ==========
export default function DeepAnalysisPanel({ clientId, clientName }: DeepAnalysisPanelProps) {
  const { colors, isDark } = useFATheme()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<DeepAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await advisorInsightsApi.getDeepAnalysis(clientId)
        if (!cancelled) setResult(data)
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load deep analysis')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [clientId])

  if (error && !result) {
    return (
      <div className="px-4 py-3" style={{ background: isDark ? 'rgba(147,197,253,0.02)' : 'rgba(59,130,246,0.01)' }}>
        <SectionError message={error} colors={colors} />
      </div>
    )
  }

  const sections = [
    {
      id: 'persona',
      label: 'Persona Alignment',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      section: result?.persona,
      renderData: (data: PersonaAlignment) => <PersonaSection data={data} colors={colors} isDark={isDark} />,
    },
    {
      id: 'risk',
      label: 'Risk Assessment',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      ),
      section: result?.risk,
      renderData: (data: RiskAssessment) => <RiskSection data={data} colors={colors} isDark={isDark} />,
    },
    {
      id: 'rebalancing',
      label: 'Rebalancing Roadmap',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      section: result?.rebalancing,
      renderData: (data: RebalancingRoadmap) => <RebalancingSection data={data} colors={colors} isDark={isDark} clientId={clientId} clientName={clientName} />,
    },
  ]

  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div
          className="px-6 py-4"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(147,197,253,0.03) 0%, rgba(125,211,252,0.01) 100%)'
              : 'linear-gradient(135deg, rgba(59,130,246,0.02) 0%, rgba(56,189,248,0.01) 100%)',
            borderTop: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
              Deep Analysis — {clientName}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {sections.map(({ id, label, icon, section, renderData }) => (
              <div
                key={id}
                className="p-4 rounded-xl"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: colors.chipBg, color: colors.primary }}>
                    {icon}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>{label}</span>
                </div>
                {loading ? (
                  <SectionSkeleton colors={colors} />
                ) : section?.status === 'error' ? (
                  <SectionError message={section.error || 'Analysis failed'} colors={colors} />
                ) : section?.data ? (
                  (renderData as any)(section.data)
                ) : (
                  <p className="text-xs" style={{ color: colors.textTertiary }}>No data available</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  )
}
