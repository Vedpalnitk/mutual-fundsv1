import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { commissionsApi, CommissionRate, CommissionRecord, BrokerageUploadHistory } from '@/services/api'
import { useFATheme, formatCurrency } from '@/utils/fa'

type TabKey = 'rates' | 'upload' | 'reports'

interface AMC { id: string; name: string; shortName: string | null }

export default function CommissionsPage() {
  const { colors, isDark } = useFATheme()
  const [activeTab, setActiveTab] = useState<TabKey>('rates')

  // Rate Master state
  const [rates, setRates] = useState<CommissionRate[]>([])
  const [amcList, setAmcList] = useState<AMC[]>([])
  const [showRateForm, setShowRateForm] = useState(false)
  const [editingRate, setEditingRate] = useState<CommissionRate | null>(null)
  const [rateForm, setRateForm] = useState({ amcId: '', schemeCategory: 'EQUITY', trailRatePercent: '', upfrontRatePercent: '', effectiveFrom: '', effectiveTo: '' })

  // Upload state
  const [uploads, setUploads] = useState<BrokerageUploadHistory[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  // Reports state
  const [records, setRecords] = useState<CommissionRecord[]>([])
  const [filterPeriod, setFilterPeriod] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [calcPeriod, setCalcPeriod] = useState('')
  const [reconcilePeriod, setReconcilePeriod] = useState('')

  const [loading, setLoading] = useState(false)

  const fetchRates = useCallback(async () => {
    try { setLoading(true); setRates(await commissionsApi.listRates()) } catch {} finally { setLoading(false) }
  }, [])

  const fetchAMCs = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fa_auth_token') : null
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${API_BASE}/api/v1/funds/db/providers`, { headers })
      if (res.ok) setAmcList(await res.json())
    } catch {}
  }, [])

  const fetchUploads = useCallback(async () => {
    try { setLoading(true); setUploads(await commissionsApi.listUploads()) } catch {} finally { setLoading(false) }
  }, [])

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (filterPeriod) filters.period = filterPeriod
      if (filterStatus) filters.status = filterStatus
      setRecords(await commissionsApi.listRecords(filters))
    } catch {} finally { setLoading(false) }
  }, [filterPeriod, filterStatus])

  useEffect(() => {
    if (activeTab === 'rates') { fetchRates(); fetchAMCs() }
    if (activeTab === 'upload') fetchUploads()
    if (activeTab === 'reports') fetchRecords()
  }, [activeTab, fetchRates, fetchAMCs, fetchUploads, fetchRecords])

  const handleSaveRate = async () => {
    try {
      if (editingRate) {
        await commissionsApi.updateRate(editingRate.id, {
          trailRatePercent: parseFloat(rateForm.trailRatePercent) || 0,
          upfrontRatePercent: parseFloat(rateForm.upfrontRatePercent) || 0,
          effectiveFrom: rateForm.effectiveFrom,
          effectiveTo: rateForm.effectiveTo || undefined,
        })
      } else {
        await commissionsApi.createRate({
          amcId: rateForm.amcId,
          schemeCategory: rateForm.schemeCategory,
          trailRatePercent: parseFloat(rateForm.trailRatePercent) || 0,
          upfrontRatePercent: parseFloat(rateForm.upfrontRatePercent) || 0,
          effectiveFrom: rateForm.effectiveFrom,
          effectiveTo: rateForm.effectiveTo || undefined,
        })
      }
      setShowRateForm(false)
      setEditingRate(null)
      setRateForm({ amcId: '', schemeCategory: 'EQUITY', trailRatePercent: '', upfrontRatePercent: '', effectiveFrom: '', effectiveTo: '' })
      fetchRates()
    } catch {}
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Delete this commission rate?')) return
    try { await commissionsApi.deleteRate(id); fetchRates() } catch {}
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)
      setUploadResult(null)
      const result = await commissionsApi.uploadBrokerage(file)
      setUploadResult(result)
      fetchUploads()
    } catch {} finally { setUploading(false) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleCalculateExpected = async () => {
    if (!calcPeriod) return
    try {
      setLoading(true)
      await commissionsApi.calculateExpected(calcPeriod)
      fetchRecords()
    } catch {} finally { setLoading(false) }
  }

  const handleReconcile = async () => {
    if (!reconcilePeriod) return
    try {
      setLoading(true)
      await commissionsApi.reconcile(reconcilePeriod)
      fetchRecords()
    } catch {} finally { setLoading(false) }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'rates', label: 'Rate Master' },
    { key: 'upload', label: 'Upload & Reconcile' },
    { key: 'reports', label: 'Reports' },
  ]

  const schemeCategories = ['EQUITY', 'DEBT', 'HYBRID', 'SOLUTION', 'LIQUID', 'ELSS', 'INDEX', 'FOF', 'OTHER']

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECONCILED': return colors.success
      case 'DISCREPANCY': return colors.error
      case 'RECEIVED': return colors.primary
      default: return colors.warning
    }
  }

  return (
    <AdvisorLayout title="Commissions & Brokerage">
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

      {/* ============= RATE MASTER TAB ============= */}
      {activeTab === 'rates' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Commission Rate Master</h3>
              <p className="text-xs" style={{ color: colors.textTertiary }}>Trail and upfront rates by AMC and scheme category</p>
            </div>
            <button
              onClick={() => { setEditingRate(null); setRateForm({ amcId: '', schemeCategory: 'EQUITY', trailRatePercent: '', upfrontRatePercent: '', effectiveFrom: '', effectiveTo: '' }); setShowRateForm(true) }}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
            >
              + Add Rate
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : rates.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No commission rates configured yet</p>
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Add rates for each AMC and scheme category to track commissions</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${colors.cardBorder}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: colors.chipBg }}>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>AMC</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Category</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Trail %</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Upfront %</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Effective</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr key={rate.id} className="transition-colors" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <td className="px-4 py-3 font-medium" style={{ color: colors.textPrimary }}>{rate.amcShortName || rate.amcName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>
                          {rate.schemeCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: colors.primary }}>{rate.trailRatePercent}%</td>
                      <td className="px-4 py-3 text-right" style={{ color: colors.textSecondary }}>{rate.upfrontRatePercent}%</td>
                      <td className="px-4 py-3 text-xs" style={{ color: colors.textTertiary }}>
                        {rate.effectiveFrom}{rate.effectiveTo ? ` to ${rate.effectiveTo}` : ' onwards'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingRate(rate)
                            setRateForm({
                              amcId: rate.amcId, schemeCategory: rate.schemeCategory,
                              trailRatePercent: String(rate.trailRatePercent), upfrontRatePercent: String(rate.upfrontRatePercent),
                              effectiveFrom: rate.effectiveFrom, effectiveTo: rate.effectiveTo || '',
                            })
                            setShowRateForm(true)
                          }}
                          className="text-xs font-medium mr-3" style={{ color: colors.primary }}
                        >Edit</button>
                        <button onClick={() => handleDeleteRate(rate.id)} className="text-xs font-medium" style={{ color: colors.error }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rate Form Modal */}
          {showRateForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: isDark ? colors.backgroundSecondary : '#FFFFFF', border: `1px solid ${colors.cardBorder}` }}>
                <h3 className="text-base font-semibold mb-4" style={{ color: colors.textPrimary }}>
                  {editingRate ? 'Edit Commission Rate' : 'Add Commission Rate'}
                </h3>

                <div className="space-y-3">
                  {!editingRate && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>AMC</label>
                        <select
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          value={rateForm.amcId}
                          onChange={(e) => setRateForm({ ...rateForm, amcId: e.target.value })}
                        >
                          <option value="">-- Select AMC --</option>
                          {amcList.map((amc) => (
                            <option key={amc.id} value={amc.id}>{amc.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Scheme Category</label>
                        <select
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          value={rateForm.schemeCategory}
                          onChange={(e) => setRateForm({ ...rateForm, schemeCategory: e.target.value })}
                        >
                          {schemeCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Trail Rate %</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        value={rateForm.trailRatePercent}
                        onChange={(e) => setRateForm({ ...rateForm, trailRatePercent: e.target.value })}
                        placeholder="0.50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Upfront Rate %</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        value={rateForm.upfrontRatePercent}
                        onChange={(e) => setRateForm({ ...rateForm, upfrontRatePercent: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Effective From</label>
                      <input
                        type="date"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        value={rateForm.effectiveFrom}
                        onChange={(e) => setRateForm({ ...rateForm, effectiveFrom: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Effective To</label>
                      <input
                        type="date"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        value={rateForm.effectiveTo}
                        onChange={(e) => setRateForm({ ...rateForm, effectiveTo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => { setShowRateForm(false); setEditingRate(null) }}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
                    style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
                  >Cancel</button>
                  <button
                    onClick={handleSaveRate}
                    disabled={!editingRate && (!rateForm.amcId || !rateForm.trailRatePercent || !rateForm.effectiveFrom)}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                  >Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============= UPLOAD & RECONCILE TAB ============= */}
      {activeTab === 'upload' && (
        <div>
          {/* Upload Area */}
          <div
            className="p-8 rounded-2xl mb-6 text-center cursor-pointer transition-all"
            style={{
              background: dragOver
                ? `${colors.primary}10`
                : isDark
                  ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(191, 219, 254, 0.03) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(96, 165, 250, 0.01) 100%)',
              border: `2px dashed ${dragOver ? colors.primary : colors.cardBorder}`,
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.csv'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleFileUpload(file)
              }
              input.click()
            }}
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: colors.chipBg }}>
              <svg className="w-6 h-6" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
                <span className="text-sm font-medium" style={{ color: colors.primary }}>Uploading...</span>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Drop CSV file here or click to upload</p>
                <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Supports CAMS and KFintech brokerage statement formats</p>
              </>
            )}
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className="p-4 rounded-xl mb-6" style={{ background: `${colors.success}08`, border: `1px solid ${isDark ? `${colors.success}20` : `${colors.success}15`}`, borderLeft: `4px solid ${colors.success}` }}>
              <p className="text-sm font-semibold" style={{ color: colors.success }}>Upload Successful</p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Source</p>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{uploadResult.source}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Records</p>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{uploadResult.recordCount}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Total Brokerage</p>
                  <p className="text-sm font-bold" style={{ color: colors.primary }}>{formatCurrency(uploadResult.totalBrokerage)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Calculate Expected</p>
              <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>Compute expected trail from AUM x rate master</p>
              <div className="flex gap-2">
                <input
                  type="month"
                  className="flex-1 h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={calcPeriod}
                  onChange={(e) => setCalcPeriod(e.target.value)}
                />
                <button
                  onClick={handleCalculateExpected}
                  disabled={!calcPeriod || loading}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >Calculate</button>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Reconcile</p>
              <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>Match expected vs received brokerage for a period</p>
              <div className="flex gap-2">
                <input
                  type="month"
                  className="flex-1 h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={reconcilePeriod}
                  onChange={(e) => setReconcilePeriod(e.target.value)}
                />
                <button
                  onClick={handleReconcile}
                  disabled={!reconcilePeriod || loading}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >Reconcile</button>
              </div>
            </div>
          </div>

          {/* Upload History */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>Upload History</p>
            {uploads.length === 0 ? (
              <div className="text-center py-8 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
                <p className="text-sm" style={{ color: colors.textSecondary }}>No uploads yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploads.map((u) => (
                  <div key={u.id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{u.fileName}</p>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                        {u.source} | {u.recordCount} records | {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded" style={{
                        background: u.status === 'COMPLETED' ? `${colors.success}15` : `${colors.warning}15`,
                        color: u.status === 'COMPLETED' ? colors.success : colors.warning,
                      }}>{u.status}</span>
                      <p className="text-sm font-bold mt-1" style={{ color: colors.primary }}>{formatCurrency(u.totalBrokerage)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============= REPORTS TAB ============= */}
      {activeTab === 'reports' && (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Period</label>
              <input
                type="month"
                className="h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Status</label>
              <select
                className="h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="EXPECTED">Expected</option>
                <option value="RECEIVED">Received</option>
                <option value="DISCREPANCY">Discrepancy</option>
                <option value="RECONCILED">Reconciled</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          {records.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total AUM', value: formatCurrency(records.reduce((s, r) => s + r.aumAmount, 0)), color: colors.primary },
                { label: 'Expected Trail', value: formatCurrency(records.reduce((s, r) => s + r.expectedTrail, 0)), color: colors.warning },
                { label: 'Actual Trail', value: formatCurrency(records.reduce((s, r) => s + r.actualTrail, 0)), color: colors.success },
                { label: 'Difference', value: formatCurrency(records.reduce((s, r) => s + r.difference, 0)), color: records.reduce((s, r) => s + r.difference, 0) >= 0 ? colors.success : colors.error },
              ].map((card) => (
                <div key={card.label} className="p-4 rounded-xl" style={{ background: `${card.color}08`, border: `1px solid ${isDark ? `${card.color}20` : `${card.color}15`}` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>{card.label}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Records Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No commission records found</p>
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Use &quot;Calculate Expected&quot; to generate records from your AUM and rate master</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${colors.cardBorder}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: colors.chipBg }}>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Period</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>AMC</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>AUM</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Expected</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Actual</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Diff</th>
                    <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <td className="px-4 py-3 font-medium" style={{ color: colors.textPrimary }}>{r.period}</td>
                      <td className="px-4 py-3" style={{ color: colors.textSecondary }}>{r.amcShortName || r.amcName}</td>
                      <td className="px-4 py-3 text-right" style={{ color: colors.textPrimary }}>{formatCurrency(r.aumAmount)}</td>
                      <td className="px-4 py-3 text-right" style={{ color: colors.warning }}>{formatCurrency(r.expectedTrail)}</td>
                      <td className="px-4 py-3 text-right" style={{ color: colors.success }}>{formatCurrency(r.actualTrail)}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: r.difference >= 0 ? colors.success : colors.error }}>
                        {r.difference >= 0 ? '+' : ''}{formatCurrency(r.difference)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{
                          background: `${getStatusColor(r.status)}15`,
                          color: getStatusColor(r.status),
                        }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdvisorLayout>
  )
}
