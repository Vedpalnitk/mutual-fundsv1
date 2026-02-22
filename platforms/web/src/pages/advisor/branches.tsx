import { useState, useEffect, useCallback, useMemo } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { branchesApi, Branch } from '@/services/api'
import { biApi } from '@/services/api/business'
import { useFATheme, formatCurrency, formatCurrencyCompact } from '@/utils/fa'

interface BranchAum {
  name: string; aum: number; clientCount: number
}

export default function BranchesPage() {
  const { colors, isDark } = useFATheme()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState({ name: '', city: '', code: '' })
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [branchAum, setBranchAum] = useState<Record<string, BranchAum>>({})

  const fetchBranchAum = useCallback(async () => {
    try {
      const data = await biApi.getAumByBranch()
      const map: Record<string, BranchAum> = {}
      data.forEach((item: BranchAum) => { map[item.name] = item })
      setBranchAum(map)
    } catch {}
  }, [])

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true)
      const data = await branchesApi.list()
      setBranches(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load branches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBranches(); fetchBranchAum() }, [fetchBranches, fetchBranchAum])

  const handleSave = async () => {
    if (!formData.name.trim()) return
    try {
      setSaving(true)
      if (editingBranch) {
        await branchesApi.update(editingBranch.id, formData)
        setSuccessMsg('Branch updated')
      } else {
        await branchesApi.create(formData)
        setSuccessMsg('Branch created')
      }
      setShowForm(false)
      setEditingBranch(null)
      setFormData({ name: '', city: '', code: '' })
      fetchBranches()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save branch')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({ name: branch.name, city: branch.city || '', code: branch.code || '' })
    setShowForm(true)
  }

  const handleToggleActive = async (branch: Branch) => {
    try {
      await branchesApi.update(branch.id, { isActive: !branch.isActive })
      fetchBranches()
    } catch (err: any) {
      setError(err.message || 'Failed to update branch')
    }
  }

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`Delete branch "${branch.name}"? This cannot be undone.`)) return
    try {
      await branchesApi.remove(branch.id)
      setSuccessMsg('Branch deleted')
      fetchBranches()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete branch')
      setTimeout(() => setError(''), 3000)
    }
  }

  const openNewForm = () => {
    setEditingBranch(null)
    setFormData({ name: '', city: '', code: '' })
    setShowForm(true)
  }

  return (
    <AdvisorLayout title="Branches">
      {/* Success/Error messages */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: `${colors.success}15`, color: colors.success, border: `1px solid ${colors.success}30` }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: `${colors.error}15`, color: colors.error, border: `1px solid ${colors.error}30` }}>
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">x</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Manage your office branches and assign staff
          </p>
        </div>
        <button
          onClick={openNewForm}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            boxShadow: `0 4px 14px ${colors.glassShadow}`,
          }}
        >
          + Add Branch
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div
            className="w-full max-w-md mx-4 p-6 rounded-2xl"
            style={{
              background: isDark ? colors.backgroundSecondary : colors.background,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: `0 24px 48px ${colors.glassShadow}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-5" style={{ color: colors.textPrimary }}>
              {editingBranch ? 'Edit Branch' : 'New Branch'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                  Branch Name *
                </label>
                <input
                  className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mumbai Head Office"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                  City
                </label>
                <input
                  className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                  Branch Code
                </label>
                <input
                  className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. MUM-001"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setEditingBranch(null) }}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{ color: colors.textSecondary, border: `1px solid ${colors.cardBorder}` }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim() || saving}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`,
                }}
              >
                {saving ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Comparison Strip (Change D) */}
      {!loading && branches.length >= 2 && (
        <div className="mb-6 rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.cardBorder}` }}>
          <div className="p-3" style={{ background: colors.chipBg }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Branch Comparison</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: colors.chipBg, borderTop: `1px solid ${colors.cardBorder}` }}>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Branch</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>AUM</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Clients</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Staff</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>AUM/Client</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>AUM/Staff</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = branches
                    .map(b => {
                      const aum = branchAum[b.name]
                      const aumVal = aum?.aum || 0
                      const clients = aum?.clientCount || 0
                      const staff = b.staffCount || 0
                      return {
                        name: b.name,
                        aum: aumVal,
                        clients,
                        staff,
                        aumPerClient: clients > 0 ? aumVal / clients : 0,
                        aumPerStaff: staff > 0 ? aumVal / staff : 0,
                      }
                    })
                    .sort((a, b) => b.aum - a.aum)
                  const maxAumPerClient = Math.max(...rows.map(r => r.aumPerClient))
                  const maxAumPerStaff = Math.max(...rows.map(r => r.aumPerStaff))
                  return rows.map((r) => (
                    <tr key={r.name} style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <td className="px-3 py-2 text-xs font-medium" style={{ color: colors.textPrimary }}>{r.name}</td>
                      <td className="px-3 py-2 text-xs text-right font-semibold" style={{ color: colors.primary }}>{formatCurrencyCompact(r.aum)}</td>
                      <td className="px-3 py-2 text-xs text-right" style={{ color: colors.textSecondary }}>{r.clients}</td>
                      <td className="px-3 py-2 text-xs text-right" style={{ color: colors.textSecondary }}>{r.staff}</td>
                      <td className="px-3 py-2 text-xs text-right font-semibold" style={{ color: r.aumPerClient === maxAumPerClient && maxAumPerClient > 0 ? colors.success : colors.textSecondary }}>
                        {formatCurrencyCompact(r.aumPerClient)}
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-semibold" style={{ color: r.aumPerStaff === maxAumPerStaff && maxAumPerStaff > 0 ? colors.success : colors.textSecondary }}>
                        {formatCurrencyCompact(r.aumPerStaff)}
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
        </div>
      ) : branches.length === 0 ? (
        /* Empty state */
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
        >
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ color: colors.textTertiary }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
          <p className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>No branches yet</p>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>Create your first branch to organize your team</p>
          <button
            onClick={openNewForm}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
          >
            + Add Branch
          </button>
        </div>
      ) : (
        /* Branch cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(191, 219, 254, 0.03) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(96, 165, 250, 0.01) 100%)',
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 20px ${colors.glassShadow}`,
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${branch.isActive ? colors.primary : colors.textTertiary} 0%, ${branch.isActive ? colors.primaryDark : colors.textTertiary} 100%)`,
                    }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{branch.name}</h3>
                    {branch.city && (
                      <p className="text-xs" style={{ color: colors.textTertiary }}>{branch.city}</p>
                    )}
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: branch.isActive ? `${colors.success}15` : `${colors.error}15`,
                    color: branch.isActive ? colors.success : colors.error,
                    border: `1px solid ${branch.isActive ? `${colors.success}30` : `${colors.error}30`}`,
                  }}
                >
                  {branch.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {branch.code && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: colors.textTertiary }}>Code:</span>
                    <span className="text-xs font-semibold" style={{ color: colors.primary }}>{branch.code}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: colors.textTertiary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                    {branch.staffCount} staff
                  </span>
                </div>
                {branchAum[branch.name] && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: colors.textTertiary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                        {formatCurrency(branchAum[branch.name].aum)} AUM
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: colors.textTertiary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                        {branchAum[branch.name].clientCount} clients
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Staff list preview */}
              {branch.staff.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {branch.staff.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                        style={{ background: `${colors.primary}15`, color: colors.primary }}
                      >
                        {s.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>{s.displayName}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded ml-auto"
                        style={{ background: colors.chipBg, color: colors.textTertiary }}
                      >
                        {s.staffRole}
                      </span>
                    </div>
                  ))}
                  {branch.staff.length > 3 && (
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      +{branch.staff.length - 3} more
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                <button
                  onClick={() => handleEdit(branch)}
                  className="flex-1 py-2 rounded-full text-xs font-semibold transition-all"
                  style={{ color: colors.primary, background: `${colors.primary}10` }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(branch)}
                  className="flex-1 py-2 rounded-full text-xs font-semibold transition-all"
                  style={{
                    color: branch.isActive ? colors.warning : colors.success,
                    background: branch.isActive ? `${colors.warning}10` : `${colors.success}10`,
                  }}
                >
                  {branch.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(branch)}
                  className="py-2 px-3 rounded-full text-xs font-semibold transition-all"
                  style={{ color: colors.error, background: `${colors.error}10` }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdvisorLayout>
  )
}
