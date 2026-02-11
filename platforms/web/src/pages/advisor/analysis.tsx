import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import {
  useFATheme,
  formatCurrency,
  formatCurrencyCompact,
} from '@/utils/fa'
import {
  clientsApi,
  advisorInsightsApi,
  savedAnalysisApi,
  DeepAnalysisResult,
  PersonaAlignment,
  RiskAssessment,
  RebalancingRoadmap,
} from '@/services/api'
import { SavedAnalysisSummary } from '@/utils/faTypes'
import {
  FACard,
  FAEmptyState,
} from '@/components/advisor/shared'
import SavedAnalysesList from '@/components/advisor/SavedAnalysesList'
import VersionSelector from '@/components/advisor/VersionSelector'
import EditRebalancingModal from '@/components/advisor/EditRebalancingModal'

interface ClientOption {
  id: string
  name: string
  aum: number
}

// ========== Skeleton / Error helpers ==========

const SectionSkeleton = ({ colors }: { colors: any }) => (
  <div className="animate-pulse space-y-4">
    <div className="h-5 rounded w-1/4" style={{ background: colors.chipBg }} />
    <div className="h-4 rounded w-2/3" style={{ background: colors.chipBg }} />
    <div className="h-4 rounded w-1/2" style={{ background: colors.chipBg }} />
    <div className="h-4 rounded w-3/4" style={{ background: colors.chipBg }} />
    <div className="h-4 rounded w-1/3" style={{ background: colors.chipBg }} />
  </div>
)

const SectionError = ({ message, colors }: { message: string; colors: any }) => (
  <div className="p-4 rounded-xl" style={{ background: `${colors.error}08`, border: `1px solid ${colors.error}20` }}>
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 flex-shrink-0" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p className="text-sm" style={{ color: colors.error }}>{message}</p>
    </div>
  </div>
)

// ========== Persona Section (full-width) ==========

const PersonaSection = ({ data, colors, isDark }: { data: PersonaAlignment; colors: any; isDark: boolean }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{data.primaryPersona}</p>
        <p className="text-sm" style={{ color: colors.textTertiary }}>Risk Band: {data.riskBand}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold" style={{ color: colors.primary }}>{(data.confidence * 100).toFixed(0)}%</p>
        <p className="text-xs" style={{ color: colors.textTertiary }}>Confidence</p>
      </div>
    </div>
    {data.description && (
      <p className="text-sm" style={{ color: colors.textSecondary }}>{data.description}</p>
    )}
    {/* Blended Allocation Bar */}
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>Recommended Allocation</p>
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
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
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
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
              <span key={key} className="flex items-center gap-1.5 text-sm" style={{ color: colors.textSecondary }}>
                <span className="w-2 h-2 rounded-full" style={{ background: dotColors[key] || colors.primary }} />
                {key.charAt(0).toUpperCase() + key.slice(1)} {(val * 100).toFixed(0)}%
              </span>
            )
          })}
      </div>
    </div>
    {/* Persona Distribution — show ALL */}
    {data.distribution.length > 1 && (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>Persona Distribution</p>
        <div className="space-y-2">
          {data.distribution.map(d => (
            <div key={d.persona} className="flex items-center gap-3">
              <span className="text-sm w-32 truncate" style={{ color: colors.textPrimary }}>{d.persona}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                <div className="h-full rounded-full" style={{ width: `${d.weight * 100}%`, background: colors.primary }} />
              </div>
              <span className="text-sm font-semibold w-10 text-right" style={{ color: colors.primary }}>{(d.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)

// ========== Risk Section (full-width) ==========

const RiskSection = ({ data, colors, isDark }: { data: RiskAssessment; colors: any; isDark: boolean }) => {
  const riskColor = data.riskScore >= 70 ? colors.error : data.riskScore >= 40 ? colors.warning : colors.success
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${riskColor}12` }}>
          <span className="text-xl font-bold" style={{ color: riskColor }}>{data.riskScore}</span>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{data.riskLevel}</p>
          <p className="text-sm" style={{ color: colors.textTertiary }}>Overall Risk Score</p>
        </div>
      </div>
      {/* Risk Factors — show ALL */}
      {data.riskFactors.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>Risk Factors</p>
          <div className="space-y-2">
            {data.riskFactors.map((f, i) => {
              const severityColor = f.severity === 'high' ? colors.error : f.severity === 'medium' ? colors.warning : colors.success
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: `${severityColor}06` }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: severityColor }} />
                  <span className="text-sm flex-1" style={{ color: colors.textPrimary }}>{f.name}</span>
                  {f.description && (
                    <span className="text-xs flex-1" style={{ color: colors.textTertiary }}>{f.description}</span>
                  )}
                  <span className="text-sm font-semibold" style={{ color: severityColor }}>{(f.contribution * 100).toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Recommendations — show ALL */}
      {data.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>Recommendations</p>
          <ul className="space-y-1.5">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: colors.textSecondary }}>
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

// ========== Rebalancing Section (full-width) ==========

const RebalancingSection = ({ data, colors, isDark }: { data: RebalancingRoadmap; colors: any; isDark: boolean }) => {
  const alignColor = data.alignmentScore >= 0.8 ? colors.success : data.alignmentScore >= 0.5 ? colors.warning : colors.error

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SELL': return colors.error
      case 'BUY': return colors.success
      case 'ADD_NEW': return colors.primary
      case 'HOLD': return colors.warning
      default: return colors.textSecondary
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl" style={{ background: `${alignColor}08`, border: `1px solid ${alignColor}20` }}>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Alignment</p>
          <p className="text-xl font-bold" style={{ color: alignColor }}>{(data.alignmentScore * 100).toFixed(0)}%</p>
          <p className="text-xs" style={{ color: alignColor }}>{data.isAligned ? 'Aligned' : 'Needs Rebalancing'}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: `${colors.error}08`, border: `1px solid ${colors.error}20` }}>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Total Sell</p>
          <p className="text-xl font-bold" style={{ color: colors.error }}>{formatCurrencyCompact(data.totalSellAmount)}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}20` }}>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Total Buy</p>
          <p className="text-xl font-bold" style={{ color: colors.success }}>{formatCurrencyCompact(data.totalBuyAmount)}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Tax Impact</p>
          <p className="text-sm font-medium mt-1" style={{ color: colors.textPrimary }}>{data.taxImpactSummary || 'N/A'}</p>
        </div>
      </div>

      {/* Primary Issues */}
      {data.primaryIssues.length > 0 && (
        <div className="space-y-1.5">
          {data.primaryIssues.map((issue, i) => (
            <p key={i} className="text-sm flex gap-2" style={{ color: colors.warning }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              {issue}
            </p>
          ))}
        </div>
      )}

      {/* Actions Table — show ALL */}
      {data.actions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Action</th>
                <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Priority</th>
                <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Fund</th>
                <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Asset Class</th>
                <th className="text-right py-2 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Current</th>
                <th className="text-right py-2 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Target</th>
                <th className="text-right py-2 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Amount</th>
                <th className="text-center py-2 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Tax</th>
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.actions.map((action, i) => {
                const actionColor = getActionColor(action.action)
                const priorityColor = action.priority === 'HIGH' ? colors.error : action.priority === 'MEDIUM' ? colors.warning : colors.success
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <td className="py-2.5 pr-3">
                      <span className="font-semibold px-2 py-0.5 rounded text-xs" style={{ background: `${actionColor}12`, color: actionColor }}>
                        {action.action}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${priorityColor}12`, color: priorityColor }}>
                        {action.priority}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-sm" style={{ color: colors.textPrimary }}>{action.schemeName}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.textSecondary }}>
                        {action.assetClass}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-sm" style={{ color: colors.textSecondary }}>
                      {action.currentValue != null ? formatCurrencyCompact(action.currentValue) : '--'}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-sm" style={{ color: colors.textSecondary }}>
                      {formatCurrencyCompact(action.targetValue)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-sm font-semibold" style={{ color: actionColor }}>
                      {action.transactionAmount >= 0 ? '+' : ''}{formatCurrencyCompact(Math.abs(action.transactionAmount))}
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      {action.taxStatus ? (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.textSecondary }}>
                          {action.taxStatus}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: colors.textTertiary }}>--</span>
                      )}
                    </td>
                    <td className="py-2.5 text-sm" style={{ color: colors.textTertiary }}>{action.reason}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ========== Deep Analysis Page ==========

const DeepAnalysisPage = () => {
  const { colors, isDark } = useFATheme()
  const router = useRouter()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [loadingClients, setLoadingClients] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<DeepAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Saved analysis state
  const [savedId, setSavedId] = useState<string | null>(null)
  const [savedMeta, setSavedMeta] = useState<SavedAnalysisSummary | null>(null)
  const [currentVersion, setCurrentVersion] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true)
        const response = await clientsApi.list<ClientOption>({})
        setClients(response.data || [])
      } catch {
        setClients([
          { id: '1', name: 'Rajesh Sharma', aum: 4500000 },
          { id: '2', name: 'Priya Patel', aum: 2800000 },
          { id: '3', name: 'Amit Kumar', aum: 1200000 },
        ])
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  // Load from URL query param
  useEffect(() => {
    const id = router.query.id as string | undefined
    if (id && !savedId) {
      loadSavedAnalysis(id)
    }
  }, [router.query.id])

  const runAnalysis = async () => {
    if (!selectedClient) return
    setAnalyzing(true)
    setError(null)
    setResult(null)
    setSavedId(null)
    setSavedMeta(null)
    setSaveSuccess(false)
    try {
      const data = await advisorInsightsApi.getDeepAnalysis(selectedClient)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deep analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const saveAnalysis = async () => {
    if (!result || !selectedClient) return
    setSaving(true)
    try {
      const clientName = clients.find(c => c.id === selectedClient)?.name || 'Client'
      const saved = await savedAnalysisApi.save({
        title: `Deep Analysis - ${clientName}`,
        clientId: selectedClient,
        personaData: result.persona?.data || {},
        riskData: result.risk?.data || {},
        rebalancingData: result.rebalancing?.data || {},
        editNotes: 'Initial analysis from ML pipeline',
      })
      setSavedId(saved.id)
      setSavedMeta(saved)
      setCurrentVersion(1)
      setSaveSuccess(true)
      setRefreshKey(prev => prev + 1)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save analysis')
    } finally {
      setSaving(false)
    }
  }

  const loadSavedAnalysis = async (id: string) => {
    try {
      setAnalyzing(true)
      setError(null)
      const meta = await savedAnalysisApi.get(id)
      const version = await savedAnalysisApi.getVersion(id, meta.latestVersion)

      setSavedId(id)
      setSavedMeta(meta)
      setCurrentVersion(meta.latestVersion)
      setSelectedClient(meta.clientId)

      // Reconstruct result from version data
      setResult({
        clientId: meta.clientId,
        clientName: meta.clientName,
        persona: { status: 'success', data: version.personaData },
        risk: { status: 'success', data: version.riskData },
        rebalancing: { status: 'success', data: version.rebalancingData },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  const switchVersion = async (v: number) => {
    if (!savedId) return
    try {
      const version = await savedAnalysisApi.getVersion(savedId, v)
      setCurrentVersion(v)
      setResult(prev => prev ? {
        ...prev,
        persona: { status: 'success', data: version.personaData },
        risk: { status: 'success', data: version.riskData },
        rebalancing: { status: 'success', data: version.rebalancingData },
      } : null)
    } catch (err) {
      alert('Failed to load version')
    }
  }

  const handleDownloadPdf = async (v: number) => {
    if (!savedId) return
    try {
      await savedAnalysisApi.downloadPdf(savedId, v)
    } catch {
      alert('PDF download failed')
    }
  }

  const handleEditSave = async (rebalancingData: RebalancingRoadmap, editNotes: string) => {
    if (!savedId) return
    try {
      const newVersion = await savedAnalysisApi.createVersion(savedId, { rebalancingData, editNotes })
      setCurrentVersion(newVersion.versionNumber)
      setResult(prev => prev ? {
        ...prev,
        rebalancing: { status: 'success', data: newVersion.rebalancingData },
      } : null)
      // Refresh metadata
      const meta = await savedAnalysisApi.get(savedId)
      setSavedMeta(meta)
      setRefreshKey(prev => prev + 1)
      setShowEditModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save new version')
    }
  }

  const sections = result ? [
    {
      id: 'persona',
      label: 'Persona Alignment',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      section: result.persona,
      renderData: (data: PersonaAlignment) => <PersonaSection data={data} colors={colors} isDark={isDark} />,
    },
    {
      id: 'risk',
      label: 'Risk Assessment',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      ),
      section: result.risk,
      renderData: (data: RiskAssessment) => <RiskSection data={data} colors={colors} isDark={isDark} />,
    },
    {
      id: 'rebalancing',
      label: 'Rebalancing Roadmap',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      section: result.rebalancing,
      renderData: (data: RebalancingRoadmap) => <RebalancingSection data={data} colors={colors} isDark={isDark} />,
    },
  ] : []

  return (
    <AdvisorLayout title="Deep Analysis">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            ML-powered persona alignment, risk assessment, and rebalancing roadmap for individual clients
          </p>
        </div>

        {/* Client Selection */}
        <FACard className="mb-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                Select Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value)
                  setResult(null)
                  setError(null)
                  setSavedId(null)
                  setSavedMeta(null)
                  setSaveSuccess(false)
                }}
                disabled={loadingClients}
                className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({formatCurrency(client.aum)})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={runAnalysis}
              disabled={!selectedClient || analyzing}
              className="h-10 px-6 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`,
              }}
            >
              {analyzing ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.3) transparent rgba(255,255,255,0.3) rgba(255,255,255,0.3)' }}
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Run Deep Analysis
                </>
              )}
            </button>
            {/* Save Button - shown after analysis completes */}
            {result && !savedId && (
              <button
                onClick={saveAnalysis}
                disabled={saving}
                className="h-10 px-5 rounded-full text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                style={{
                  background: colors.chipBg,
                  color: colors.primary,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${colors.primary}40 transparent ${colors.primary}40 ${colors.primary}40` }} />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3v4H7M7 14h10" />
                  </svg>
                )}
                Save
              </button>
            )}
            {saveSuccess && (
              <span className="text-xs font-medium" style={{ color: colors.success }}>Saved!</span>
            )}
          </div>
        </FACard>

        {/* Saved Analyses List */}
        <SavedAnalysesList
          clientId={selectedClient}
          onLoad={loadSavedAnalysis}
          refreshKey={refreshKey}
        />

        {/* Top-level error */}
        {error && (
          <div className="mb-6">
            <SectionError message={error} colors={colors} />
          </div>
        )}

        {/* Empty state before running */}
        {!result && !analyzing && !error && (
          <FACard>
            <FAEmptyState
              icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              }
              title="Select a Client to Analyze"
              description="Choose a client from the dropdown above and run deep analysis to see persona alignment, risk assessment, and rebalancing recommendations."
            />
          </FACard>
        )}

        {/* Loading skeletons */}
        {analyzing && (
          <div className="space-y-6">
            {['Persona Alignment', 'Risk Assessment', 'Rebalancing Roadmap'].map(label => (
              <FACard key={label}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg" style={{ background: colors.chipBg }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>{label}</span>
                </div>
                <SectionSkeleton colors={colors} />
              </FACard>
            ))}
          </div>
        )}

        {/* Version Selector - shown when viewing a saved analysis */}
        {result && savedId && savedMeta && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
            <VersionSelector
              versions={savedMeta.versions}
              currentVersion={currentVersion}
              onSelect={switchVersion}
              onDownloadPdf={handleDownloadPdf}
            />
          </div>
        )}

        {/* Analysis Results — 3 full-width sections */}
        {result && (
          <div className="space-y-6">
            {sections.map(({ id, label, icon, section, renderData }) => (
              <FACard key={id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.chipBg, color: colors.primary }}>
                      {icon}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>{label}</span>
                  </div>
                  {/* Edit Rebalancing button */}
                  {id === 'rebalancing' && savedId && section?.data && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md"
                      style={{
                        background: colors.chipBg,
                        color: colors.primary,
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Rebalancing
                    </button>
                  )}
                </div>
                {section?.status === 'error' ? (
                  <SectionError message={section.error || 'Analysis failed'} colors={colors} />
                ) : section?.data ? (
                  (renderData as any)(section.data)
                ) : (
                  <p className="text-sm" style={{ color: colors.textTertiary }}>No data available</p>
                )}
              </FACard>
            ))}
          </div>
        )}
      </div>

      {/* Edit Rebalancing Modal */}
      {showEditModal && result?.rebalancing?.data && (
        <EditRebalancingModal
          data={result.rebalancing.data}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </AdvisorLayout>
  )
}

export default DeepAnalysisPage
