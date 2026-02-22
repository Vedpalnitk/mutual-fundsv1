import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { organizationApi, OrganizationArn, OrgDashboard } from '@/services/api/business'
import { useFATheme, formatCurrency, formatCurrencyCompact } from '@/utils/fa'

export default function OrganizationPage() {
  const { colors, isDark } = useFATheme()
  const [arns, setArns] = useState<OrganizationArn[]>([])
  const [dashboard, setDashboard] = useState<OrgDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingArn, setEditingArn] = useState<OrganizationArn | null>(null)
  const [newArnNumber, setNewArnNumber] = useState('')
  const [newArnLabel, setNewArnLabel] = useState('')
  const [error, setError] = useState('')

  const fetchArns = useCallback(async () => {
    try {
      const data = await organizationApi.listArns()
      setArns(data)
    } catch {}
  }, [])

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const data = await organizationApi.getDashboard()
      setDashboard(data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchArns()
    fetchDashboard()
  }, [fetchArns, fetchDashboard])

  const handleAddArn = async () => {
    setError('')
    if (!newArnNumber.match(/^ARN-\d{1,6}$/)) {
      setError('ARN must be in format ARN-XXXXXX')
      return
    }
    try {
      await organizationApi.addArn({ arnNumber: newArnNumber, label: newArnLabel || undefined })
      setShowAddModal(false)
      setNewArnNumber('')
      setNewArnLabel('')
      fetchArns()
      fetchDashboard()
    } catch (e: any) {
      setError(e?.message || 'Failed to add ARN')
    }
  }

  const handleSetDefault = async (arn: OrganizationArn) => {
    try {
      await organizationApi.updateArn(arn.id, { isDefault: true })
      fetchArns()
    } catch {}
  }

  const handleDelete = async (arn: OrganizationArn) => {
    try {
      await organizationApi.deleteArn(arn.id)
      fetchArns()
      fetchDashboard()
    } catch (e: any) {
      alert(e?.message || 'Cannot delete this ARN')
    }
  }

  const handleUpdateLabel = async () => {
    if (!editingArn) return
    try {
      await organizationApi.updateArn(editingArn.id, { label: newArnLabel })
      setEditingArn(null)
      setNewArnLabel('')
      fetchArns()
    } catch {}
  }

  const maxAum = dashboard ? Math.max(...(dashboard.aumByArn.map(a => a.aum) || [1]), 1) : 1

  return (
    <AdvisorLayout title="Organization">
      {/* ARN Management Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>ARN Management</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add ARN
          </button>
        </div>

        <div
          className="p-5 rounded-xl"
          style={{ background: isDark ? colors.backgroundSecondary : colors.backgroundSecondary, border: `1px solid ${colors.cardBorder}` }}
        >
          {arns.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: colors.textTertiary }}>
              No ARNs found. Your ARN from the advisor profile will be auto-imported.
            </p>
          ) : (
            <div className="space-y-3">
              {arns.map((arn) => (
                <div
                  key={arn.id}
                  className="p-4 rounded-xl flex items-center justify-between transition-all"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(191, 219, 254, 0.03) 100%)'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(96, 165, 250, 0.01) 100%)',
                    border: `1px solid ${arn.isDefault ? colors.primary + '40' : colors.cardBorder}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: arn.isDefault ? `${colors.primary}20` : colors.chipBg }}
                    >
                      <svg className="w-5 h-5" style={{ color: arn.isDefault ? colors.primary : colors.textTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{arn.arnNumber}</p>
                        {arn.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.primary}15`, color: colors.primary, border: `1px solid ${colors.primary}30` }}>
                            Default
                          </span>
                        )}
                        {!arn.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.error}15`, color: colors.error }}>
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>{arn.label || 'No label'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!arn.isDefault && arn.isActive && (
                      <button
                        onClick={() => handleSetDefault(arn)}
                        className="p-2 rounded-lg transition-all hover:scale-105"
                        style={{ background: colors.chipBg }}
                        title="Set as Default"
                      >
                        <svg className="w-4 h-4" style={{ color: colors.warning }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingArn(arn); setNewArnLabel(arn.label || '') }}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{ background: colors.chipBg }}
                      title="Edit Label"
                    >
                      <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    {!arn.isDefault && (
                      <button
                        onClick={() => handleDelete(arn)}
                        className="p-2 rounded-lg transition-all hover:scale-105"
                        style={{ background: `${colors.error}10` }}
                        title="Deactivate"
                      >
                        <svg className="w-4 h-4" style={{ color: colors.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Organization Dashboard */}
      {dashboard && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Organization Dashboard</h2>

          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total AUM', value: formatCurrencyCompact(dashboard.totalAum), icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z', color: colors.primary },
              { label: 'Total Clients', value: String(dashboard.totalClients), icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', color: colors.secondary },
              { label: 'Team Members', value: String(dashboard.totalTeamMembers), icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z', color: colors.success },
              { label: 'Active ARNs', value: String(dashboard.activeArns), icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z', color: colors.warning },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="p-4 rounded-2xl"
                style={{
                  background: isDark
                    ? `linear-gradient(135deg, ${kpi.color}12 0%, ${kpi.color}06 100%)`
                    : `linear-gradient(135deg, ${kpi.color}08 0%, ${kpi.color}03 100%)`,
                  border: `1px solid ${isDark ? `${kpi.color}20` : `${kpi.color}15`}`,
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${kpi.color}15` }}>
                  <svg className="w-5 h-5" style={{ color: kpi.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={kpi.icon} />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>{kpi.label}</p>
                <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* AUM by ARN */}
          <div
            className="p-5 rounded-xl mb-6"
            style={{ background: isDark ? colors.backgroundSecondary : colors.backgroundSecondary, border: `1px solid ${colors.cardBorder}` }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>AUM by ARN</h3>
            {dashboard.aumByArn.length === 0 ? (
              <p className="text-sm" style={{ color: colors.textTertiary }}>No ARN data available</p>
            ) : (
              <div className="space-y-3">
                {dashboard.aumByArn.map((item) => (
                  <div key={item.arnNumber}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{item.arnNumber}</span>
                      <span className="text-sm font-bold" style={{ color: colors.primary }}>{formatCurrency(item.aum)}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: colors.chipBg }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.max((item.aum / maxAum) * 100, 2)}%`,
                          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                        }}
                      />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Performance */}
          <div
            className="p-5 rounded-xl mb-6"
            style={{ background: isDark ? colors.backgroundSecondary : colors.backgroundSecondary, border: `1px solid ${colors.cardBorder}` }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>Team Performance</h3>
            {dashboard.teamPerformance.length === 0 ? (
              <p className="text-sm" style={{ color: colors.textTertiary }}>No team members found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                      <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>Name</th>
                      <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>EUIN</th>
                      <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>Clients</th>
                      <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>AUM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.teamPerformance.map((member) => (
                      <tr key={member.staffId} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                        <td className="py-3 font-medium" style={{ color: colors.textPrimary }}>{member.displayName}</td>
                        <td className="py-3">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>
                            {member.euin || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 text-right" style={{ color: colors.textSecondary }}>{member.clientCount}</td>
                        <td className="py-3 text-right font-bold" style={{ color: colors.primary }}>{formatCurrency(member.aum)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Commission Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className="p-5 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 50%, ${colors.secondary} 100%)`,
                boxShadow: `0 8px 32px ${isDark ? 'rgba(0,0,0,0.4)' : `${colors.primary}25`}`,
              }}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-2">Current Period Trail</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(dashboard.commissionSummary.currentPeriodTotal)}</p>
            </div>
            <div
              className="p-5 rounded-2xl"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${colors.secondary}12 0%, ${colors.secondary}06 100%)`
                  : `linear-gradient(135deg, ${colors.secondary}08 0%, ${colors.secondary}03 100%)`,
                border: `1px solid ${isDark ? `${colors.secondary}20` : `${colors.secondary}15`}`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.secondary }}>YTD Trail Income</p>
              <p className="text-2xl font-bold" style={{ color: colors.secondary }}>{formatCurrency(dashboard.commissionSummary.ytdTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {loading && !dashboard && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
        </div>
      )}

      {/* Add ARN Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md mx-4 p-6 rounded-2xl"
            style={{ background: isDark ? colors.backgroundSecondary : '#FFFFFF', border: `1px solid ${colors.cardBorder}` }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Add New ARN</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>ARN Number</label>
                <input
                  value={newArnNumber}
                  onChange={(e) => setNewArnNumber(e.target.value)}
                  placeholder="ARN-123456"
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Label (Optional)</label>
                <input
                  value={newArnLabel}
                  onChange={(e) => setNewArnLabel(e.target.value)}
                  placeholder="e.g. HNI Desk, Mumbai Office"
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                />
              </div>
              {error && <p className="text-xs" style={{ color: colors.error }}>{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAddModal(false); setError('') }}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddArn}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >
                  Add ARN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Label Modal */}
      {editingArn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md mx-4 p-6 rounded-2xl"
            style={{ background: isDark ? colors.backgroundSecondary : '#FFFFFF', border: `1px solid ${colors.cardBorder}` }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Edit ARN Label</h3>
            <p className="text-sm mb-4" style={{ color: colors.textTertiary }}>{editingArn.arnNumber}</p>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Label</label>
              <input
                value={newArnLabel}
                onChange={(e) => setNewArnLabel(e.target.value)}
                placeholder="e.g. HNI Desk"
                className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingArn(null)}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLabel}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdvisorLayout>
  )
}
