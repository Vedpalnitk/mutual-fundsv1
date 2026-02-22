import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { complianceApi, ComplianceRecordData, ComplianceDashboard, RiskCheckResult } from '@/services/api'
import { teamApi } from '@/services/api/business'
import { useFATheme } from '@/utils/fa'

type TabKey = 'dashboard' | 'records' | 'euin' | 'risk'

interface EuinRecord {
  id: string; displayName: string; email: string; euin: string
  euinExpiry: string; branchName: string; daysUntilExpiry: number
}

export default function CompliancePage() {
  const { colors, isDark } = useFATheme()
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [loading, setLoading] = useState(false)

  // Dashboard state
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null)

  // Records state
  const [records, setRecords] = useState<ComplianceRecordData[]>([])
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'ARN', entityName: '', expiryDate: '', documentUrl: '', notes: '' })

  // EUIN Tracker state
  const [euinData, setEuinData] = useState<EuinRecord[]>([])
  const [loadingEuin, setLoadingEuin] = useState(false)

  // Risk check state
  const [riskClientId, setRiskClientId] = useState('')
  const [riskResult, setRiskResult] = useState<RiskCheckResult | null>(null)

  const fetchDashboard = useCallback(async () => {
    try { setLoading(true); setDashboard(await complianceApi.getDashboard()) } catch {} finally { setLoading(false) }
  }, [])

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterType) filters.type = filterType
      if (filterStatus) filters.status = filterStatus
      setRecords(await complianceApi.listRecords(filters))
    } catch {} finally { setLoading(false) }
  }, [filterType, filterStatus])

  const fetchEuinExpiry = useCallback(async () => {
    try { setLoadingEuin(true); setEuinData(await teamApi.getEuinExpiry()) } catch {} finally { setLoadingEuin(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard()
    if (activeTab === 'records') fetchRecords()
    if (activeTab === 'euin') fetchEuinExpiry()
  }, [activeTab, fetchDashboard, fetchRecords, fetchEuinExpiry])

  const handleCreateRecord = async () => {
    try {
      await complianceApi.createRecord({
        type: form.type,
        entityName: form.entityName || undefined,
        expiryDate: form.expiryDate,
        documentUrl: form.documentUrl || undefined,
        notes: form.notes || undefined,
      })
      setShowForm(false)
      setForm({ type: 'ARN', entityName: '', expiryDate: '', documentUrl: '', notes: '' })
      fetchRecords()
    } catch {}
  }

  const handleRiskCheck = async () => {
    if (!riskClientId) return
    try {
      setLoading(true)
      setRiskResult(await complianceApi.riskCheck(riskClientId))
    } catch {} finally { setLoading(false) }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'records', label: 'Records' },
    { key: 'euin', label: 'EUIN Tracker' },
    { key: 'risk', label: 'Risk Check' },
  ]

  const complianceTypes = ['ARN', 'EUIN', 'KYC', 'SEBI_REGISTRATION', 'INSURANCE_LICENSE']

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID': return colors.success
      case 'EXPIRING_SOON': return colors.warning
      case 'EXPIRED': return colors.error
      default: return colors.textTertiary
    }
  }

  const getExpiryColor = (days: number) => {
    if (days <= 0) return colors.error
    if (days <= 30) return colors.warning
    if (days <= 60) return colors.warning
    return colors.success
  }

  return (
    <AdvisorLayout title="Compliance">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.key
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                : colors.chipBg,
              color: activeTab === tab.key ? '#FFFFFF' : colors.textSecondary,
              border: activeTab === tab.key ? 'none' : `1px solid ${colors.chipBorder}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============= DASHBOARD TAB ============= */}
      {activeTab === 'dashboard' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : dashboard && (
            <div className="space-y-4">
              {/* Status Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: dashboard.total, color: colors.primary },
                  { label: 'Valid', value: dashboard.valid, color: colors.success },
                  { label: 'Expiring Soon', value: dashboard.expiringSoon, color: colors.warning },
                  { label: 'Expired', value: dashboard.expired, color: colors.error },
                ].map((card) => (
                  <div key={card.label} className="p-4 rounded-xl" style={{
                    background: `${card.color}08`,
                    border: `1px solid ${isDark ? `${card.color}20` : `${card.color}15`}`,
                  }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>{card.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* By Type Breakdown */}
              {Object.keys(dashboard.byType).length > 0 && (
                <div className="p-5 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>By Type</p>
                  <div className="space-y-3">
                    {Object.entries(dashboard.byType).map(([type, counts]) => (
                      <div key={type} className="flex items-center justify-between p-3 rounded-xl" style={{ background: isDark ? colors.backgroundTertiary : colors.inputBg, border: `1px solid ${colors.cardBorder}` }}>
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{type.replace(/_/g, ' ')}</span>
                        <div className="flex gap-3">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.success}15`, color: colors.success }}>{counts.valid} valid</span>
                          {counts.expiringSoon > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.warning}15`, color: colors.warning }}>{counts.expiringSoon} expiring</span>
                          )}
                          {counts.expired > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.error}15`, color: colors.error }}>{counts.expired} expired</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Expirations */}
              {dashboard.upcoming.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.warning }}>Upcoming Expirations</p>
                  <div className="space-y-2">
                    {dashboard.upcoming.map((r) => (
                      <div key={r.id} className="p-3 rounded-xl flex items-center justify-between" style={{
                        background: colors.chipBg,
                        border: `1px solid ${colors.cardBorder}`,
                        borderLeft: `4px solid ${getExpiryColor(r.daysUntilExpiry)}`,
                      }}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>
                              {r.type.replace(/_/g, ' ')}
                            </span>
                            {r.entityName && <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{r.entityName}</span>}
                          </div>
                          {r.notes && <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>{r.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: colors.textTertiary }}>Expires</p>
                          <p className="text-sm font-semibold" style={{ color: getExpiryColor(r.daysUntilExpiry) }}>
                            {r.expiryDate}
                          </p>
                          <p className="text-xs font-medium" style={{ color: getExpiryColor(r.daysUntilExpiry) }}>
                            {r.daysUntilExpiry <= 0 ? 'Expired' : `${r.daysUntilExpiry} days left`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============= RECORDS TAB ============= */}
      {activeTab === 'records' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex gap-3">
              <select
                className="h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                {complianceTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <select
                className="h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="VALID">Valid</option>
                <option value="EXPIRING_SOON">Expiring Soon</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
            >
              + Add Record
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No compliance records found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div key={r.id} className="p-4 rounded-xl flex items-center justify-between" style={{
                  background: colors.chipBg,
                  border: `1px solid ${colors.cardBorder}`,
                  borderLeft: `4px solid ${getStatusColor(r.status)}`,
                }}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${getStatusColor(r.status)}15`, color: getStatusColor(r.status) }}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>
                        {r.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {r.entityName && <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{r.entityName}</p>}
                    {r.notes && <p className="text-xs" style={{ color: colors.textTertiary }}>{r.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: getExpiryColor(r.daysUntilExpiry) }}>
                      {r.expiryDate}
                    </p>
                    <p className="text-xs font-medium" style={{ color: getExpiryColor(r.daysUntilExpiry) }}>
                      {r.daysUntilExpiry <= 0 ? 'Expired' : `${r.daysUntilExpiry} days left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Record Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: isDark ? colors.backgroundSecondary : '#FFFFFF', border: `1px solid ${colors.cardBorder}` }}>
                <h3 className="text-base font-semibold mb-4" style={{ color: colors.textPrimary }}>Add Compliance Record</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Type</label>
                    <select
                      className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      {complianceTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Entity Name</label>
                    <input
                      className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      value={form.entityName}
                      onChange={(e) => setForm({ ...form, entityName: e.target.value })}
                      placeholder="e.g., Staff name, ARN number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Expiry Date</label>
                    <input
                      type="date"
                      className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Notes</label>
                    <input
                      className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
                    style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
                  >Cancel</button>
                  <button
                    onClick={handleCreateRecord}
                    disabled={!form.expiryDate}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                  >Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============= EUIN TRACKER TAB ============= */}
      {activeTab === 'euin' && (
        <div>
          <div
            className="p-5 rounded-2xl mb-4"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(191, 219, 254, 0.03) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(96, 165, 250, 0.01) 100%)',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
              EUIN Expiry Tracker
            </h3>
            <p className="text-xs" style={{ color: colors.textTertiary }}>
              Staff with EUINs expiring within 90 days
            </p>
          </div>

          {loadingEuin ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : euinData.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No expiring EUINs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {euinData.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl flex items-center justify-between"
                  style={{
                    background: isDark ? colors.chipBg : colors.inputBg,
                    border: `1px solid ${colors.cardBorder}`,
                    borderLeft: `4px solid ${getExpiryColor(item.daysUntilExpiry)}`,
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{item.displayName}</p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>{item.email}</p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      EUIN: <span className="font-medium">{item.euin}</span>
                      {item.branchName && <span> | {item.branchName}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: colors.textTertiary }}>Expires</p>
                    <p className="text-sm font-semibold" style={{ color: getExpiryColor(item.daysUntilExpiry) }}>
                      {item.euinExpiry}
                    </p>
                    <p className="text-xs font-medium" style={{ color: getExpiryColor(item.daysUntilExpiry) }}>
                      {item.daysUntilExpiry <= 0 ? 'Expired' : `${item.daysUntilExpiry} days left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============= RISK CHECK TAB ============= */}
      {activeTab === 'risk' && (
        <div>
          <div className="p-5 rounded-2xl mb-4" style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(191, 219, 254, 0.03) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(96, 165, 250, 0.01) 100%)',
            border: `1px solid ${colors.cardBorder}`,
          }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>Risk Suitability Check</h3>
            <p className="text-xs" style={{ color: colors.textTertiary }}>Verify client compliance before processing transactions</p>
          </div>

          <div className="flex gap-3 mb-4">
            <input
              className="flex-1 max-w-sm h-10 px-4 rounded-xl text-sm focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              value={riskClientId}
              onChange={(e) => setRiskClientId(e.target.value)}
              placeholder="Enter Client ID"
            />
            <button
              onClick={handleRiskCheck}
              disabled={!riskClientId || loading}
              className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
            >Check</button>
          </div>

          {riskResult && (
            <div className="p-5 rounded-xl" style={{
              background: riskResult.suitability === 'PASS' ? `${colors.success}08` : `${colors.error}08`,
              border: `1px solid ${isDark ? `${riskResult.suitability === 'PASS' ? colors.success : colors.error}20` : `${riskResult.suitability === 'PASS' ? colors.success : colors.error}15`}`,
              borderLeft: `4px solid ${riskResult.suitability === 'PASS' ? colors.success : colors.error}`,
            }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{riskResult.clientName}</p>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>KYC: {riskResult.kycStatus}</p>
                </div>
                <span className="text-sm font-bold px-3 py-1 rounded-full" style={{
                  background: riskResult.suitability === 'PASS' ? `${colors.success}15` : `${colors.error}15`,
                  color: riskResult.suitability === 'PASS' ? colors.success : colors.error,
                }}>
                  {riskResult.suitability}
                </span>
              </div>

              {riskResult.issues.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.error }}>Issues Found</p>
                  {riskResult.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: `${colors.error}06` }}>
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{issue}</p>
                    </div>
                  ))}
                </div>
              )}

              {riskResult.issues.length === 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <svg className="w-4 h-4" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-xs font-medium" style={{ color: colors.success }}>All compliance checks passed</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AdvisorLayout>
  )
}
