import { useState, useEffect, useCallback } from 'react'
import { useFATheme, formatDate } from '@/utils/fa'
import { FACard, FASectionHeader, FAButton, FAEmptyState, FAChip } from '@/components/advisor/shared'
import GapAnalysisCard from './GapAnalysisCard'
import AddPolicyModal from './AddPolicyModal'
import RecordPaymentModal from './RecordPaymentModal'
import DocumentsModal from './DocumentsModal'
import { insuranceApi } from '@/services/api'

interface InsurancePolicy {
  id: string
  clientId: string
  policyNumber: string
  provider: string
  type: string
  status: string
  sumAssured: number
  premiumAmount: number
  premiumFrequency: string
  startDate: string
  maturityDate?: string
  nextPremiumDate?: string
  lastPremiumDate?: string
  nominees?: string
  notes?: string
}

interface PremiumPayment {
  id: string
  policyId: string
  amountPaid: number
  paymentDate: string
  paymentMode?: string
  receiptNumber?: string
  notes?: string
  createdAt?: string
}

interface GapAnalysisData {
  life: { recommended: number; current: number; gap: number; adequate: boolean }
  health: { recommended: number; current: number; gap: number; adequate: boolean }
  policies: InsurancePolicy[]
}

const TYPE_LABELS: Record<string, string> = {
  TERM_LIFE: 'Term Life',
  WHOLE_LIFE: 'Whole Life',
  ENDOWMENT: 'Endowment',
  ULIP: 'ULIP',
  HEALTH: 'Health',
  CRITICAL_ILLNESS: 'Critical Illness',
  PERSONAL_ACCIDENT: 'Personal Accident',
  OTHER: 'Other',
}

const MODE_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  UPI: 'UPI',
  AUTO_DEBIT: 'Auto Debit',
}

function formatAmount(amount: number): string {
  if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)} L`
  return `\u20B9${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function getStatusColor(status: string, colors: any): string {
  switch (status) {
    case 'ACTIVE': return colors.success
    case 'LAPSED': return colors.error
    case 'SURRENDERED': return colors.warning
    case 'MATURED': return '#3B82F6'
    case 'CLAIMED': return '#8B5CF6'
    default: return colors.textTertiary
  }
}

function getDaysUntilDue(dateStr?: string): number | null {
  if (!dateStr) return null
  const due = new Date(dateStr)
  const now = new Date()
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getDueColor(days: number | null): string {
  if (days === null) return '#94A3B8'
  if (days < 0) return '#EF4444'
  if (days <= 7) return '#F59E0B'
  return '#10B981'
}

function getDueLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days}d`
}

function getFreqLabel(freq: string): string {
  switch (freq) {
    case 'ANNUAL': return '/yr'
    case 'MONTHLY': return '/mo'
    case 'QUARTERLY': return '/qtr'
    case 'HALF_YEARLY': return '/6mo'
    case 'SINGLE': return ''
    default: return ''
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function InsuranceTab({ clientId }: { clientId: string }) {
  const { colors, isDark } = useFATheme()
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [gapData, setGapData] = useState<GapAnalysisData | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Inline expansion
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PremiumPayment[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [selectedPremiumAmount, setSelectedPremiumAmount] = useState(0)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)

  useEffect(() => {
    if (!clientId) return
    loadData()
  }, [clientId])

  const loadData = async (gapParams?: { annualIncome?: number; age?: number; familySize?: number }) => {
    setLoading(true)
    try {
      const [policiesRes, gapRes] = await Promise.allSettled([
        insuranceApi.list(clientId),
        insuranceApi.gapAnalysis(clientId, gapParams),
      ])
      if (policiesRes.status === 'fulfilled') setPolicies(policiesRes.value as InsurancePolicy[])
      if (gapRes.status === 'fulfilled') setGapData(gapRes.value as GapAnalysisData)
    } catch {
      // Errors handled gracefully
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculateGap = async (params: { annualIncome?: number; age?: number; familySize?: number }) => {
    try {
      const gap = await insuranceApi.gapAnalysis(clientId, params) as GapAnalysisData
      setGapData(gap)
    } catch { /* ignore */ }
  }

  const toggleExpand = useCallback(async (policyId: string) => {
    if (expandedPolicyId === policyId) {
      setExpandedPolicyId(null)
      return
    }
    setExpandedPolicyId(policyId)
    setLoadingHistory(true)
    setPaymentHistory([])
    try {
      const data = await insuranceApi.getPaymentHistory(clientId, policyId) as PremiumPayment[]
      setPaymentHistory(data)
    } catch { /* ignore */ }
    setLoadingHistory(false)
  }, [clientId, expandedPolicyId])

  const handleSave = async (data: any) => {
    setIsSaving(true)
    try {
      const newPolicy = await insuranceApi.create(clientId, data) as InsurancePolicy
      setPolicies((prev) => [newPolicy, ...prev])
      setShowAddModal(false)
      try {
        const gap = await insuranceApi.gapAnalysis(clientId) as GapAnalysisData
        setGapData(gap)
      } catch { /* ignore */ }
    } catch {
      const fallback: InsurancePolicy = {
        id: `temp-${Date.now()}`,
        clientId,
        ...data,
        status: 'ACTIVE',
      }
      setPolicies((prev) => [fallback, ...prev])
      setShowAddModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (policyId: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== policyId))
    if (expandedPolicyId === policyId) setExpandedPolicyId(null)
    try {
      await insuranceApi.delete(clientId, policyId)
      const gap = await insuranceApi.gapAnalysis(clientId) as GapAnalysisData
      setGapData(gap)
    } catch { /* Already removed from UI */ }
  }

  const handleRecordPayment = async (data: any) => {
    if (!selectedPolicyId) return
    setIsSaving(true)
    try {
      await insuranceApi.recordPayment(clientId, selectedPolicyId, data)
      setShowPaymentModal(false)
      // Refresh history if this policy is expanded
      if (expandedPolicyId === selectedPolicyId) {
        const history = await insuranceApi.getPaymentHistory(clientId, selectedPolicyId) as PremiumPayment[]
        setPaymentHistory(history)
      }
      setSelectedPolicyId(null)
      await loadData()
    } catch {
      // Handle error gracefully
    } finally {
      setIsSaving(false)
    }
  }

  const renderInlineDetails = (policy: InsurancePolicy) => {
    if (expandedPolicyId !== policy.id) return null

    return (
      <div
        className="px-4 pb-4 pt-1"
        style={{ borderTop: `1px dashed ${colors.cardBorder}` }}
      >
        {/* Policy details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <DetailCell label="Policy Number" value={policy.policyNumber} colors={colors} />
          <DetailCell label="Start Date" value={formatDateShort(policy.startDate)} colors={colors} />
          <DetailCell label="Maturity" value={policy.maturityDate ? formatDateShort(policy.maturityDate) : '-'} colors={colors} />
          <DetailCell label="Frequency" value={policy.premiumFrequency.replace('_', ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())} colors={colors} />
          {policy.nominees && <DetailCell label="Nominees" value={policy.nominees} colors={colors} />}
          {policy.notes && <DetailCell label="Notes" value={policy.notes} colors={colors} />}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedPolicyId(policy.id)
              setSelectedPremiumAmount(policy.premiumAmount)
              setShowPaymentModal(true)
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:shadow-md"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
          >
            <PaymentIcon />
            Record Payment
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedPolicyId(policy.id)
              setShowDocumentsModal(true)
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{ color: colors.primary, background: `${colors.primary}10` }}
          >
            <DocIcon />
            Documents
          </button>
        </div>

        {/* Payment history */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
            Payment History
          </span>
          {loadingHistory ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : paymentHistory.length === 0 ? (
            <p className="text-xs mt-2 py-3 text-center" style={{ color: colors.textTertiary }}>
              No payments recorded yet
            </p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {paymentHistory.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                      {formatDateShort(p.paymentDate)}
                    </span>
                    <span className="text-xs font-medium" style={{ color: colors.primary }}>
                      {formatAmount(p.amountPaid)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.paymentMode && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.primary}08`, color: colors.textTertiary }}>
                        {MODE_LABELS[p.paymentMode] || p.paymentMode}
                      </span>
                    )}
                    {p.receiptNumber && (
                      <span className="text-xs hidden sm:inline" style={{ color: colors.textTertiary }}>
                        #{p.receiptNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Gap Analysis */}
      <GapAnalysisCard data={gapData} onRecalculate={handleRecalculateGap} />

      {/* Policies */}
      <FACard padding="md">
        <FASectionHeader
          title={`Insurance Policies (${policies.length})`}
          action={
            <FAButton
              size="sm"
              onClick={() => setShowAddModal(true)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Policy
            </FAButton>
          }
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
          </div>
        ) : policies.length === 0 ? (
          <FAEmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            }
            title="No Insurance Policies"
            description="Add insurance policies to track coverage and identify gaps"
          />
        ) : (
          <>
            {/* Desktop table — hidden below lg */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                    {['Provider', 'Type', 'Status', 'Sum Assured', 'Premium', 'Next Due', 'Start Date', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: colors.textTertiary }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => {
                    const statusColor = getStatusColor(policy.status, colors)
                    const daysUntilDue = getDaysUntilDue(policy.nextPremiumDate)
                    const dueColor = getDueColor(daysUntilDue)
                    const isExpanded = expandedPolicyId === policy.id
                    return (
                      <tr key={policy.id} className="contents">
                        <td colSpan={8} className="p-0">
                          <div
                            className="transition-colors rounded-lg"
                            style={{
                              background: isExpanded ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)') : 'transparent',
                              border: isExpanded ? `1px solid ${colors.cardBorder}` : '1px solid transparent',
                              marginBottom: isExpanded ? 4 : 0,
                            }}
                          >
                            {/* Row */}
                            <div
                              className="grid cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ gridTemplateColumns: '1fr 100px 80px 100px 110px 80px 100px 120px' }}
                              onClick={() => toggleExpand(policy.id)}
                            >
                              <div className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <svg
                                    className="w-3 h-3 transition-transform flex-shrink-0"
                                    style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                  </svg>
                                  <div>
                                    <span className="font-medium" style={{ color: colors.textPrimary }}>{policy.provider}</span>
                                    <div className="text-xs" style={{ color: colors.textTertiary }}>{policy.policyNumber}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="py-3 px-3 flex items-center">
                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.primary}10`, color: colors.primary }}>
                                  {TYPE_LABELS[policy.type] || policy.type}
                                </span>
                              </div>
                              <div className="py-3 px-3 flex items-center">
                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${statusColor}15`, color: statusColor }}>
                                  {policy.status.charAt(0) + policy.status.slice(1).toLowerCase()}
                                </span>
                              </div>
                              <div className="py-3 px-3 font-medium flex items-center" style={{ color: colors.textPrimary }}>
                                {formatAmount(policy.sumAssured)}
                              </div>
                              <div className="py-3 px-3 flex items-center" style={{ color: colors.textSecondary }}>
                                {formatAmount(policy.premiumAmount)}
                                <span className="text-xs ml-1" style={{ color: colors.textTertiary }}>{getFreqLabel(policy.premiumFrequency)}</span>
                              </div>
                              <div className="py-3 px-3 flex items-center">
                                {daysUntilDue !== null ? (
                                  <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${dueColor}15`, color: dueColor }}>
                                    {getDueLabel(daysUntilDue)}
                                  </span>
                                ) : (
                                  <span className="text-xs" style={{ color: colors.textTertiary }}>-</span>
                                )}
                              </div>
                              <div className="py-3 px-3 flex items-center text-sm" style={{ color: colors.textSecondary }}>
                                {formatDateShort(policy.startDate)}
                              </div>
                              <div className="py-3 px-3 flex items-center">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(policy.id) }}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                                  title="Delete policy"
                                >
                                  <DeleteIcon color={colors.error} />
                                </button>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {renderInlineDetails(policy)}
                          </div>

                          {/* Separator when not expanded */}
                          {!isExpanded && (
                            <div style={{ borderBottom: `1px solid ${colors.cardBorder}` }} />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — visible below lg */}
            <div className="lg:hidden space-y-3">
              {policies.map((policy) => {
                const statusColor = getStatusColor(policy.status, colors)
                const daysUntilDue = getDaysUntilDue(policy.nextPremiumDate)
                const dueColor = getDueColor(daysUntilDue)
                const isExpanded = expandedPolicyId === policy.id
                return (
                  <div
                    key={policy.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    {/* Clickable header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpand(policy.id)}
                    >
                      {/* Top row: chevron + provider + status + delete */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <svg
                            className="w-3.5 h-3.5 mt-0.5 transition-transform flex-shrink-0"
                            style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>
                                {policy.provider}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: `${statusColor}15`, color: statusColor }}>
                                {policy.status.charAt(0) + policy.status.slice(1).toLowerCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs" style={{ color: colors.textTertiary }}>{policy.policyNumber}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.primary}10`, color: colors.primary }}>
                                {TYPE_LABELS[policy.type] || policy.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(policy.id) }}
                          className="p-1.5 rounded-lg flex-shrink-0 hover:bg-red-500/10"
                          title="Delete policy"
                        >
                          <DeleteIcon color={colors.error} />
                        </button>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs" style={{ color: colors.textTertiary }}>Sum Assured</div>
                          <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatAmount(policy.sumAssured)}</div>
                        </div>
                        <div>
                          <div className="text-xs" style={{ color: colors.textTertiary }}>Premium</div>
                          <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                            {formatAmount(policy.premiumAmount)}
                            <span className="text-xs font-normal ml-0.5" style={{ color: colors.textTertiary }}>{getFreqLabel(policy.premiumFrequency)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs" style={{ color: colors.textTertiary }}>Next Due</div>
                          {daysUntilDue !== null ? (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded inline-block mt-0.5" style={{ background: `${dueColor}15`, color: dueColor }}>
                              {getDueLabel(daysUntilDue)}
                            </span>
                          ) : (
                            <div className="text-sm" style={{ color: colors.textTertiary }}>-</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded inline details */}
                    {renderInlineDetails(policy)}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </FACard>

      {showAddModal && (
        <AddPolicyModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {showPaymentModal && selectedPolicyId && (
        <RecordPaymentModal
          premiumAmount={selectedPremiumAmount}
          onClose={() => { setShowPaymentModal(false); setSelectedPolicyId(null) }}
          onSave={handleRecordPayment}
          isSaving={isSaving}
        />
      )}

      {showDocumentsModal && selectedPolicyId && (
        <DocumentsModal
          clientId={clientId}
          policyId={selectedPolicyId}
          onClose={() => { setShowDocumentsModal(false); setSelectedPolicyId(null) }}
        />
      )}
    </div>
  )
}

/* Helper components */
function DetailCell({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>{label}</div>
      <div className="text-sm" style={{ color: colors.textPrimary }}>{value}</div>
    </div>
  )
}

function PaymentIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function DeleteIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}
