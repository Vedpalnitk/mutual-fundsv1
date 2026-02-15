import { useState, useEffect } from 'react'
import { useFATheme, formatDate } from '@/utils/fa'
import { FACard, FASectionHeader, FAButton, FAEmptyState, FAChip } from '@/components/advisor/shared'
import GapAnalysisCard from './GapAnalysisCard'
import AddPolicyModal from './AddPolicyModal'
import RecordPaymentModal from './RecordPaymentModal'
import PaymentHistoryModal from './PaymentHistoryModal'
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

function formatAmount(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
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

export default function InsuranceTab({ clientId }: { clientId: string }) {
  const { colors, isDark } = useFATheme()
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [gapData, setGapData] = useState<GapAnalysisData | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [selectedPremiumAmount, setSelectedPremiumAmount] = useState(0)

  useEffect(() => {
    if (!clientId) return
    loadData()
  }, [clientId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [policiesRes, gapRes] = await Promise.allSettled([
        insuranceApi.list(clientId),
        insuranceApi.gapAnalysis(clientId),
      ])
      if (policiesRes.status === 'fulfilled') setPolicies(policiesRes.value as InsurancePolicy[])
      if (gapRes.status === 'fulfilled') setGapData(gapRes.value as GapAnalysisData)
    } catch {
      // Errors handled gracefully
    } finally {
      setLoading(false)
    }
  }

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
      setSelectedPolicyId(null)
      await loadData()
    } catch {
      // Handle error gracefully
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Gap Analysis */}
      <GapAnalysisCard data={gapData} />

      {/* Policies Table */}
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
          <div className="overflow-x-auto">
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
                  return (
                    <tr
                      key={policy.id}
                      className="transition-colors"
                      style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                    >
                      <td className="py-3 px-3">
                        <span className="font-medium" style={{ color: colors.textPrimary }}>{policy.provider}</span>
                        <div className="text-xs" style={{ color: colors.textTertiary }}>{policy.policyNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.primary}10`, color: colors.primary }}>
                          {TYPE_LABELS[policy.type] || policy.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: `${statusColor}15`, color: statusColor }}
                        >
                          {policy.status.charAt(0) + policy.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium" style={{ color: colors.textPrimary }}>
                        {formatAmount(policy.sumAssured)}
                      </td>
                      <td className="py-3 px-3" style={{ color: colors.textSecondary }}>
                        {formatAmount(policy.premiumAmount)}
                        <span className="text-xs ml-1" style={{ color: colors.textTertiary }}>
                          /{policy.premiumFrequency === 'ANNUAL' ? 'yr' : policy.premiumFrequency === 'MONTHLY' ? 'mo' : 'qtr'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {daysUntilDue !== null ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{ background: `${dueColor}15`, color: dueColor }}
                          >
                            {getDueLabel(daysUntilDue)}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: colors.textTertiary }}>-</span>
                        )}
                      </td>
                      <td className="py-3 px-3" style={{ color: colors.textSecondary }}>
                        {policy.startDate ? new Date(policy.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedPolicyId(policy.id)
                              setSelectedPremiumAmount(policy.premiumAmount)
                              setShowPaymentModal(true)
                            }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: colors.primary }}
                            title="Record payment"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPolicyId(policy.id)
                              setShowHistoryModal(true)
                            }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: colors.textTertiary }}
                            title="Payment history"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(policy.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                            title="Delete policy"
                          >
                            <svg className="w-4 h-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
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

      {showHistoryModal && selectedPolicyId && (
        <PaymentHistoryModal
          clientId={clientId}
          policyId={selectedPolicyId}
          onClose={() => { setShowHistoryModal(false); setSelectedPolicyId(null) }}
        />
      )}
    </div>
  )
}
