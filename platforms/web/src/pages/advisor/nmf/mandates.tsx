/**
 * NMF Mandate Management
 *
 * Create and manage NSE NMF mandates (eNACH / Physical).
 * Mandates authorize auto-debit for SIP execution via NSE NMF.
 */

import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, formatDate } from '@/utils/fa'
import { nmfApi } from '@/services/api'
import {
  FACard,
  FAButton,
  FAChip,
  FASearchInput,
  FAInput,
  FALabel,
  FAEmptyState,
  FASpinner,
} from '@/components/advisor/shared'

type MandateType = 'ENACH' | 'PHYSICAL'
type MandateStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PENDING_AUTH'

interface NmfMandate {
  id: string
  clientId: string
  clientName: string
  clientCode: string
  mandateType: MandateType
  amount: number
  umrn: string
  bankName: string
  bankAccountNo: string
  ifscCode: string
  status: MandateStatus
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<MandateStatus, string> = {
  'SUBMITTED': '#F59E0B',
  'APPROVED': '#10B981',
  'REJECTED': '#EF4444',
  'CANCELLED': '#94A3B8',
  'PENDING_AUTH': '#3B82F6',
}

const STATUS_LABELS: Record<MandateStatus, string> = {
  'SUBMITTED': 'Submitted',
  'APPROVED': 'Approved',
  'REJECTED': 'Rejected',
  'CANCELLED': 'Cancelled',
  'PENDING_AUTH': 'Pending Auth',
}

const TYPE_LABELS: Record<MandateType, string> = {
  'ENACH': 'eNACH',
  'PHYSICAL': 'Physical',
}

const NmfMandatesPage = () => {
  const { colors, isDark } = useFATheme()

  const [mandates, setMandates] = useState<NmfMandate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<MandateStatus | 'All'>('All')
  const [clientFilter, setClientFilter] = useState('')
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // New Mandate Form
  const [formClientId, setFormClientId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formType, setFormType] = useState<MandateType>('ENACH')
  const [formBankAccount, setFormBankAccount] = useState('')
  const [formBankName, setFormBankName] = useState('')
  const [formIfsc, setFormIfsc] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch mandates
  const fetchMandates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params: { clientId?: string; status?: string } = {}
      if (clientFilter) params.clientId = clientFilter
      if (statusFilter !== 'All') params.status = statusFilter
      const res = await nmfApi.mandates.list(params)
      setMandates(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error('[NMF Mandates] Error:', err)
      setError('Failed to load mandates')
      setMandates([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, clientFilter])

  useEffect(() => {
    fetchMandates()
  }, [fetchMandates])

  // Refresh single mandate status
  const handleRefreshStatus = async (mandate: NmfMandate) => {
    try {
      setRefreshingId(mandate.id)
      await nmfApi.mandates.refreshStatus(mandate.id)
      await fetchMandates()
    } catch {
      // Silent fail, user can retry
    } finally {
      setRefreshingId(null)
    }
  }

  // Create new mandate
  const handleCreateMandate = async () => {
    if (!formClientId || !formAmount) {
      setFormError('Please fill in all required fields')
      return
    }

    try {
      setFormSubmitting(true)
      setFormError(null)
      await nmfApi.mandates.create({
        clientId: formClientId,
        amount: parseFloat(formAmount),
        mandateType: formType,
        bankAccountNo: formBankAccount,
        bankName: formBankName,
        ifscCode: formIfsc,
      })
      setShowForm(false)
      resetForm()
      fetchMandates()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create mandate')
    } finally {
      setFormSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormClientId('')
    setFormAmount('')
    setFormType('ENACH')
    setFormBankAccount('')
    setFormBankName('')
    setFormIfsc('')
    setFormError(null)
  }

  // Stats
  const approvedCount = mandates.filter(m => m.status === 'APPROVED').length
  const pendingCount = mandates.filter(m => m.status === 'SUBMITTED' || m.status === 'PENDING_AUTH').length
  const totalAmount = mandates.filter(m => m.status === 'APPROVED').reduce((s, m) => s + m.amount, 0)

  return (
    <AdvisorLayout title="NMF Mandates">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Manage NSE NMF mandates for auto-debit authorization
            </p>
          </div>
          <FAButton
            onClick={() => setShowForm(!showForm)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
              </svg>
            }
          >
            {showForm ? 'Cancel' : 'Register Mandate'}
          </FAButton>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'TOTAL MANDATES', value: mandates.length.toString(), color: colors.primary },
            { label: 'APPROVED', value: approvedCount.toString(), color: colors.success },
            { label: 'PENDING', value: pendingCount.toString(), color: colors.warning },
            { label: 'APPROVED LIMIT', value: formatCurrency(totalAmount), color: colors.secondary },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="p-4 rounded-xl"
              style={{
                background: `${kpi.color}08`,
                border: `1px solid ${kpi.color}20`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: kpi.color }}>{kpi.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Inline Registration Form */}
        {showForm && (
          <div
            className="p-5 rounded-xl mb-6"
            style={{
              background: colors.cardBackground,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: `0 4px 24px ${colors.glassShadow}`,
            }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
              Register New Mandate
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FAInput
                  label="Client ID"
                  required
                  placeholder="Enter client ID"
                  value={formClientId}
                  onChange={e => setFormClientId(e.target.value)}
                />
                <FAInput
                  label="Amount Limit"
                  required
                  type="number"
                  placeholder="e.g. 100000"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                />
                <div>
                  <FALabel required>Mandate Type</FALabel>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as MandateType)}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{
                      background: isDark ? colors.inputBg : '#FFFFFF',
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="ENACH">eNACH (Electronic)</option>
                    <option value="PHYSICAL">Physical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FAInput
                  label="Bank Name"
                  placeholder="Enter bank name"
                  value={formBankName}
                  onChange={e => setFormBankName(e.target.value)}
                />
                <FAInput
                  label="Bank Account Number"
                  placeholder="Enter bank account number"
                  value={formBankAccount}
                  onChange={e => setFormBankAccount(e.target.value)}
                />
                <FAInput
                  label="IFSC Code"
                  placeholder="e.g. SBIN0001234"
                  value={formIfsc}
                  onChange={e => setFormIfsc(e.target.value)}
                />
              </div>

              {formError && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background: `${colors.error}10`,
                    border: `1px solid ${colors.error}30`,
                    color: colors.error,
                  }}
                >
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{ color: colors.textSecondary }}
                >
                  Cancel
                </button>
                <FAButton onClick={handleCreateMandate} loading={formSubmitting}>
                  Register Mandate
                </FAButton>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <FACard className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <FASearchInput
                value={clientFilter}
                onChange={setClientFilter}
                placeholder="Filter by client ID..."
              />
            </div>
            <div className="w-px h-6" style={{ background: colors.cardBorder }} />
            <div className="flex items-center gap-1">
              {(['All', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PENDING_AUTH'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: statusFilter === s ? `${colors.primary}15` : 'transparent',
                    border: `1px solid ${statusFilter === s ? `${colors.primary}30` : 'transparent'}`,
                    color: statusFilter === s ? colors.primary : colors.textTertiary,
                    fontWeight: statusFilter === s ? 600 : 400,
                  }}
                >
                  {s === 'All' ? 'All' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </FACard>

        {/* Mandates List */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FASpinner />
            </div>
          ) : error ? (
            <div className="py-8 px-5">
              <FAEmptyState
                icon={
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                }
                title="Error loading mandates"
                description={error}
                action={<FAButton onClick={fetchMandates}>Retry</FAButton>}
              />
            </div>
          ) : mandates.length === 0 ? (
            <div className="py-8 px-5">
              <FAEmptyState
                icon={
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                }
                title="No mandates found"
                description="Register a mandate to enable auto-debit for SIP orders"
                action={<FAButton onClick={() => setShowForm(true)}>Register Mandate</FAButton>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)',
                      borderBottom: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Client</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Type</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>UMRN</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Created</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Updated</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mandates.map(mandate => {
                    const statusColor = STATUS_COLORS[mandate.status]
                    const typeColor = mandate.mandateType === 'ENACH' ? colors.primary : colors.secondary
                    return (
                      <tr
                        key={mandate.id}
                        className="transition-colors"
                        style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{mandate.clientName || '-'}</p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>{mandate.clientCode || mandate.clientId}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: `${typeColor}15`,
                              color: typeColor,
                            }}
                          >
                            {TYPE_LABELS[mandate.mandateType] || mandate.mandateType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                            {formatCurrency(mandate.amount)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-mono" style={{ color: colors.textSecondary }}>
                            {mandate.umrn || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: `${statusColor}15`,
                              color: statusColor,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                            {STATUS_LABELS[mandate.status] || mandate.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className="text-xs" style={{ color: colors.textSecondary }}>
                            {mandate.createdAt ? formatDate(mandate.createdAt) : '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className="text-xs" style={{ color: colors.textSecondary }}>
                            {mandate.updatedAt ? formatDate(mandate.updatedAt) : '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRefreshStatus(mandate)}
                            disabled={refreshingId === mandate.id}
                            className="p-1.5 rounded-lg transition-all hover:opacity-80"
                            style={{ background: colors.chipBg }}
                            title="Refresh status"
                          >
                            {refreshingId === mandate.id ? (
                              <div
                                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                                style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                              />
                            ) : (
                              <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdvisorLayout>
  )
}

export default NmfMandatesPage
