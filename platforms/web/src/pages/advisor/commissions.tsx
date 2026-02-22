import { useState, useEffect, useCallback, useMemo } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { commissionsApi, CommissionRate, CommissionRecord, BrokerageUploadHistory, BrokerageLineItem, OrganizationArn, organizationApi } from '@/services/api'
import { euinCommissionApi, EuinCommissionPayout, EuinCommissionSummary, EuinCommissionSplit, staffApi } from '@/services/api/business'
import { useFATheme, formatCurrency, formatCurrencyCompact } from '@/utils/fa'
import { useNotification } from '@/components/advisor/shared'

type TabKey = 'rates' | 'splits' | 'upload' | 'reports' | 'trends' | 'payouts'

interface AMC { id: string; name: string; shortName: string | null }

export default function CommissionsPage() {
  const { colors, isDark } = useFATheme()
  const { showNotification } = useNotification()
  const [activeTab, setActiveTab] = useState<TabKey>('rates')

  // ARN state (global selector)
  const [arns, setArns] = useState<OrganizationArn[]>([])
  const [selectedArn, setSelectedArn] = useState<string>('')
  const isMultiArn = arns.length > 1

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
  const [reconComputeResult, setReconComputeResult] = useState<any>(null)

  // Unified working period (replaces calcPeriod + reconcilePeriod)
  const [workingPeriod, setWorkingPeriod] = useState('')

  // Success feedback
  const [calcResult, setCalcResult] = useState<{ period: string; recordCount: number; totalExpectedTrail: number } | null>(null)

  // Upload step indicator
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1)

  // Drill-down modal
  const [drillDownRecord, setDrillDownRecord] = useState<CommissionRecord | null>(null)
  const [drillDownItems, setDrillDownItems] = useState<BrokerageLineItem[]>([])
  const [loadingDrillDown, setLoadingDrillDown] = useState(false)

  // EUIN Payouts state
  const [payouts, setPayouts] = useState<EuinCommissionPayout[]>([])
  const [payoutSummary, setPayoutSummary] = useState<EuinCommissionSummary | null>(null)
  const [payoutPeriod, setPayoutPeriod] = useState('')
  const [computingPayouts, setComputingPayouts] = useState(false)

  // Commission Splits state
  const [splits, setSplits] = useState<EuinCommissionSplit[]>([])
  const [splitStaffList, setSplitStaffList] = useState<any[]>([])
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [editingSplit, setEditingSplit] = useState<EuinCommissionSplit | null>(null)
  const [splitForm, setSplitForm] = useState({ staffMemberId: '', splitPercent: '', effectiveFrom: '', effectiveTo: '' })
  const [splitError, setSplitError] = useState('')
  const [loadingSplits, setLoadingSplits] = useState(false)

  // Trends tab state (Change B)
  const [trendRecords, setTrendRecords] = useState<CommissionRecord[]>([])
  const [loadingTrends, setLoadingTrends] = useState(false)

  // Granular loading states
  const [loadingRates, setLoadingRates] = useState(false)
  const [loadingUploads, setLoadingUploads] = useState(false)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [loadingPayouts, setLoadingPayouts] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [reconciling, setReconciling] = useState(false)

  // Clear results when working period changes
  useEffect(() => {
    setCalcResult(null)
    setReconComputeResult(null)
  }, [workingPeriod])

  // Fetch ARNs on mount
  useEffect(() => {
    organizationApi.listArns().then(setArns).catch((err: any) => { showNotification('error', err.message || 'Failed to load ARNs') })
  }, [])

  const fetchPayouts = useCallback(async () => {
    try {
      setLoadingPayouts(true)
      const [data, summary] = await Promise.all([
        euinCommissionApi.listPayouts(payoutPeriod ? { period: payoutPeriod } : undefined),
        euinCommissionApi.getSummary(),
      ])
      setPayouts(data)
      setPayoutSummary(summary)
    } catch (err: any) { showNotification('error', err.message || 'Failed to load payouts') } finally { setLoadingPayouts(false) }
  }, [payoutPeriod])

  const handleComputePayouts = async () => {
    if (!payoutPeriod) return
    try {
      setComputingPayouts(true)
      await euinCommissionApi.computePayouts(payoutPeriod)
      showNotification('success', 'EUIN payouts computed successfully')
      fetchPayouts()
    } catch (err: any) { showNotification('error', err.message || 'Failed to compute payouts') } finally { setComputingPayouts(false) }
  }

  const handleApprovePayout = async (id: string) => {
    try { await euinCommissionApi.approvePayout(id); showNotification('success', 'Payout approved'); fetchPayouts() } catch (err: any) { showNotification('error', err.message || 'Failed to approve payout') }
  }

  const handleMarkPaid = async (id: string) => {
    try { await euinCommissionApi.markPaid(id); showNotification('success', 'Payout marked as paid'); fetchPayouts() } catch (err: any) { showNotification('error', err.message || 'Failed to mark payout as paid') }
  }

  const handleDisputePayout = async (id: string) => {
    try { await euinCommissionApi.disputePayout(id); showNotification('warning', 'Payout disputed'); fetchPayouts() } catch (err: any) { showNotification('error', err.message || 'Failed to dispute payout') }
  }

  // Commission Splits handlers
  const fetchSplits = useCallback(async () => {
    try { setLoadingSplits(true); setSplits(await euinCommissionApi.listSplits()) } catch (err: any) { showNotification('error', err.message || 'Failed to load splits') } finally { setLoadingSplits(false) }
  }, [])

  const fetchSplitStaffList = useCallback(async () => {
    try { setSplitStaffList(await staffApi.list()) } catch (err: any) { showNotification('error', err.message || 'Failed to load staff') }
  }, [])

  const totalAllocated = splits.filter(s => !s.effectiveTo).reduce((sum, s) => sum + s.splitPercent, 0)

  const handleCreateSplit = async () => {
    setSplitError('')
    if (!splitForm.staffMemberId) { setSplitError('Select a staff member'); return }
    if (!splitForm.splitPercent || Number(splitForm.splitPercent) <= 0) { setSplitError('Enter a valid split %'); return }
    if (!splitForm.effectiveFrom) { setSplitError('Select effective from date'); return }
    try {
      await euinCommissionApi.createSplit({
        staffMemberId: splitForm.staffMemberId,
        splitPercent: Number(splitForm.splitPercent),
        effectiveFrom: splitForm.effectiveFrom,
        effectiveTo: splitForm.effectiveTo || undefined,
      })
      setShowSplitModal(false)
      setSplitForm({ staffMemberId: '', splitPercent: '', effectiveFrom: '', effectiveTo: '' })
      showNotification('success', 'Split created')
      fetchSplits()
    } catch (e: any) { setSplitError(e?.message || 'Failed to create split') }
  }

  const handleUpdateSplit = async () => {
    if (!editingSplit) return
    setSplitError('')
    try {
      await euinCommissionApi.updateSplit(editingSplit.id, {
        splitPercent: Number(splitForm.splitPercent),
        effectiveFrom: splitForm.effectiveFrom,
        effectiveTo: splitForm.effectiveTo || undefined,
      })
      setShowSplitModal(false)
      setEditingSplit(null)
      setSplitForm({ staffMemberId: '', splitPercent: '', effectiveFrom: '', effectiveTo: '' })
      showNotification('success', 'Split updated')
      fetchSplits()
    } catch (e: any) { setSplitError(e?.message || 'Failed to update split') }
  }

  const handleDeleteSplit = async (id: string) => {
    try { await euinCommissionApi.deleteSplit(id); showNotification('success', 'Split deleted'); fetchSplits() } catch (err: any) { showNotification('error', err.message || 'Failed to delete split') }
  }

  const fetchRates = useCallback(async () => {
    try { setLoadingRates(true); setRates(await commissionsApi.listRates()) } catch (err: any) { showNotification('error', err.message || 'Failed to load rates') } finally { setLoadingRates(false) }
  }, [])

  const fetchAMCs = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fa_auth_token') : null
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${API_BASE}/api/v1/funds/db/providers`, { headers })
      if (res.ok) setAmcList(await res.json())
    } catch (err: any) { showNotification('error', err.message || 'Failed to load AMC list') }
  }, [])

  const fetchUploads = useCallback(async () => {
    try { setLoadingUploads(true); setUploads(await commissionsApi.listUploads()) } catch (err: any) { showNotification('error', err.message || 'Failed to load uploads') } finally { setLoadingUploads(false) }
  }, [])

  const fetchRecords = useCallback(async () => {
    try {
      setLoadingRecords(true)
      const filters: any = {}
      if (filterPeriod) filters.period = filterPeriod
      if (filterStatus) filters.status = filterStatus
      if (selectedArn) filters.arnNumber = selectedArn
      setRecords(await commissionsApi.listRecords(filters))
    } catch (err: any) { showNotification('error', err.message || 'Failed to load records') } finally { setLoadingRecords(false) }
  }, [filterPeriod, filterStatus, selectedArn])

  const fetchTrends = useCallback(async () => {
    try {
      setLoadingTrends(true)
      const data = await commissionsApi.listRecords({ arnNumber: selectedArn || undefined })
      setTrendRecords(data)
    } catch (err: any) { showNotification('error', err.message || 'Failed to load trends') }
    finally { setLoadingTrends(false) }
  }, [selectedArn, showNotification])

  useEffect(() => {
    if (activeTab === 'rates') { fetchRates(); fetchAMCs() }
    if (activeTab === 'splits') { fetchSplits(); fetchSplitStaffList() }
    if (activeTab === 'upload') fetchUploads()
    if (activeTab === 'reports') fetchRecords()
    if (activeTab === 'trends') fetchTrends()
    if (activeTab === 'payouts') fetchPayouts()
  }, [activeTab, fetchRates, fetchAMCs, fetchSplits, fetchSplitStaffList, fetchUploads, fetchRecords, fetchTrends, fetchPayouts])

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
      showNotification('success', editingRate ? 'Rate updated' : 'Rate created')
      fetchRates()
    } catch (err: any) { showNotification('error', err.message || 'Failed to save rate') }
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Delete this commission rate?')) return
    try { await commissionsApi.deleteRate(id); showNotification('success', 'Rate deleted'); fetchRates() } catch (err: any) { showNotification('error', err.message || 'Failed to delete rate') }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)
      setUploadResult(null)
      const result = await commissionsApi.uploadBrokerage(file, selectedArn || undefined)
      setUploadResult(result)
      showNotification('success', `Uploaded ${result.lineItemCount} line items (${result.source})`)
      setUploadStep(2)
      fetchUploads()
    } catch (err: any) { showNotification('error', err.message || 'Upload failed') } finally { setUploading(false) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleCalculateExpected = async () => {
    if (!workingPeriod) return
    try {
      setCalculating(true)
      const result = await commissionsApi.calculateExpected(workingPeriod, selectedArn || undefined)
      setCalcResult(result)
      showNotification('success', `Expected commissions calculated for ${workingPeriod}`)
      setUploadStep(3)
      fetchRecords()
    } catch (err: any) { showNotification('error', err.message || 'Failed to calculate expected commissions') } finally { setCalculating(false) }
  }

  const handleReconcile = async () => {
    if (!workingPeriod) return
    try {
      setReconciling(true)
      await commissionsApi.reconcile(workingPeriod, selectedArn || undefined)
      showNotification('success', `Reconciliation complete for ${workingPeriod}`)
      setUploadStep(1)
      fetchRecords()
    } catch (err: any) { showNotification('error', err.message || 'Reconciliation failed') } finally { setReconciling(false) }
  }

  const handleReconcileAndCompute = async () => {
    if (!workingPeriod) return
    try {
      setReconciling(true)
      setReconComputeResult(null)
      const result = await commissionsApi.reconcileAndCompute(workingPeriod, selectedArn || undefined)
      setReconComputeResult(result)
      showNotification('success', `Reconciled & computed EUIN payouts for ${workingPeriod}`)
      setUploadStep(1)
      fetchRecords()
    } catch (err: any) { showNotification('error', err.message || 'Reconcile & compute failed') } finally { setReconciling(false) }
  }

  const handleDrillDown = async (record: CommissionRecord) => {
    try {
      setDrillDownRecord(record)
      setLoadingDrillDown(true)
      setDrillDownItems([])
      const items = await commissionsApi.getRecordLineItems(record.id)
      setDrillDownItems(items)
    } catch (err: any) { showNotification('error', err.message || 'Failed to load line items') } finally { setLoadingDrillDown(false) }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'rates', label: 'Rate Master' },
    { key: 'splits', label: 'Splits' },
    { key: 'upload', label: 'Upload & Reconcile' },
    { key: 'reports', label: 'Reports' },
    { key: 'trends', label: 'Trends' },
    { key: 'payouts', label: 'EUIN Payouts' },
  ]

  // ── Trends computed data (Change B) ──

  const trendsByPeriod = useMemo(() => {
    const map: Record<string, { expected: number; actual: number }> = {}
    trendRecords.forEach(r => {
      if (!map[r.period]) map[r.period] = { expected: 0, actual: 0 }
      map[r.period].expected += r.expectedTrail
      map[r.period].actual += r.actualTrail
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([period, data]) => ({ period, ...data }))
  }, [trendRecords])

  const trendsByAmc = useMemo(() => {
    const map: Record<string, { expected: number; actual: number }> = {}
    trendRecords.forEach(r => {
      const name = r.amcShortName || r.amcName
      if (!map[name]) map[name] = { expected: 0, actual: 0 }
      map[name].expected += r.expectedTrail
      map[name].actual += r.actualTrail
    })
    return Object.entries(map)
      .map(([amc, data]) => ({
        amc,
        expected: data.expected,
        actual: data.actual,
        realization: data.expected > 0 ? (data.actual / data.expected) * 100 : 0,
        diff: data.actual - data.expected,
      }))
      .sort((a, b) => a.realization - b.realization)
  }, [trendRecords])

  const trendDelta = useMemo(() => {
    if (trendsByPeriod.length < 2) return null
    const latest = trendsByPeriod[trendsByPeriod.length - 1]
    const prev = trendsByPeriod[trendsByPeriod.length - 2]
    if (prev.actual === 0) return null
    const pctChange = ((latest.actual - prev.actual) / prev.actual) * 100
    // Find biggest AMC change
    const latestByAmc: Record<string, number> = {}
    const prevByAmc: Record<string, number> = {}
    trendRecords.forEach(r => {
      const name = r.amcShortName || r.amcName
      if (r.period === latest.period) latestByAmc[name] = (latestByAmc[name] || 0) + r.actualTrail
      if (r.period === prev.period) prevByAmc[name] = (prevByAmc[name] || 0) + r.actualTrail
    })
    let biggestName = ''
    let biggestDelta = 0
    Object.keys({ ...latestByAmc, ...prevByAmc }).forEach(name => {
      const d = (latestByAmc[name] || 0) - (prevByAmc[name] || 0)
      if (Math.abs(d) > Math.abs(biggestDelta)) { biggestDelta = d; biggestName = name }
    })
    return { latestPeriod: latest.period, prevPeriod: prev.period, pctChange, biggestName, biggestDelta }
  }, [trendsByPeriod, trendRecords])

  const schemeCategories = ['EQUITY', 'DEBT', 'HYBRID', 'SOLUTION', 'LIQUID', 'ELSS', 'INDEX', 'FOF', 'OTHER']

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECONCILED': return colors.success
      case 'DISCREPANCY': return colors.error
      case 'RECEIVED': return colors.primary
      default: return colors.warning
    }
  }

  // Recon status bar data
  const reconciledCount = records.filter(r => r.status === 'RECONCILED').length
  const discrepancyCount = records.filter(r => r.status === 'DISCREPANCY').length
  const pendingCount = records.filter(r => r.status === 'EXPECTED' || r.status === 'RECEIVED').length
  const totalStatusCount = reconciledCount + discrepancyCount + pendingCount

  return (
    <AdvisorLayout title="Commissions & Brokerage">
      {/* Global ARN Selector (only for multi-ARN advisors) */}
      {isMultiArn && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
            <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>ARN</p>
          </div>
          <select
            className="h-10 px-4 rounded-xl text-sm focus:outline-none min-w-[200px]"
            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            value={selectedArn}
            onChange={(e) => setSelectedArn(e.target.value)}
          >
            <option value="">All ARNs</option>
            {arns.map((arn) => (
              <option key={arn.id} value={arn.arnNumber}>
                {arn.arnNumber}{arn.label ? ` (${arn.label})` : ''}{arn.isDefault ? ' - Primary' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

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

          {loadingRates ? (
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

      {/* ============= COMMISSION SPLITS TAB ============= */}
      {activeTab === 'splits' && (
        <div>
          {/* Allocation Progress Bar */}
          <div
            className="p-5 rounded-2xl mb-4"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(147, 197, 253, 0.06) 0%, rgba(191, 219, 254, 0.03) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(96, 165, 250, 0.01) 100%)',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Commission Allocation</h3>
                <p className="text-xs" style={{ color: colors.textTertiary }}>
                  {totalAllocated.toFixed(1)}% allocated to team, {(100 - totalAllocated).toFixed(1)}% retained by firm
                </p>
              </div>
              <button
                onClick={() => { setShowSplitModal(true); setEditingSplit(null); setSplitForm({ staffMemberId: '', splitPercent: '', effectiveFrom: '', effectiveTo: '' }) }}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
              >
                + Add Split
              </button>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: colors.chipBg }}>
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(totalAllocated, 100)}%`,
                  background: totalAllocated > 100
                    ? colors.error
                    : `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                }}
              />
            </div>
          </div>

          {/* Splits Table */}
          {loadingSplits ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : splits.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No commission splits configured</p>
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Add splits to share commissions with team members</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.cardBorder}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: colors.chipBg }}>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Staff Member</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>EUIN</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Split %</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Effective From</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Effective To</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splits.map((split) => (
                      <tr key={split.id} style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                        <td className="py-3 px-4 font-medium" style={{ color: colors.textPrimary }}>{split.staffName}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>
                            {split.euin || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold" style={{ color: colors.primary }}>{split.splitPercent}%</td>
                        <td className="py-3 px-4" style={{ color: colors.textSecondary }}>{split.effectiveFrom}</td>
                        <td className="py-3 px-4" style={{ color: colors.textTertiary }}>{split.effectiveTo || 'Ongoing'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingSplit(split)
                                setSplitForm({
                                  staffMemberId: split.staffMemberId,
                                  splitPercent: String(split.splitPercent),
                                  effectiveFrom: split.effectiveFrom,
                                  effectiveTo: split.effectiveTo || '',
                                })
                                setShowSplitModal(true)
                              }}
                              className="text-xs font-medium" style={{ color: colors.primary }}
                            >Edit</button>
                            <button
                              onClick={() => handleDeleteSplit(split.id)}
                              className="text-xs font-medium" style={{ color: colors.error }}
                            >Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Split Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md mx-4 p-6 rounded-2xl" style={{ background: isDark ? colors.backgroundSecondary : '#FFFFFF', border: `1px solid ${colors.cardBorder}` }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: colors.textPrimary }}>
              {editingSplit ? 'Edit Commission Split' : 'Add Commission Split'}
            </h3>
            <div className="space-y-3">
              {!editingSplit && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Staff Member</label>
                  <select
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    value={splitForm.staffMemberId}
                    onChange={(e) => setSplitForm({ ...splitForm, staffMemberId: e.target.value })}
                  >
                    <option value="">-- Select staff --</option>
                    {splitStaffList.filter((s: any) => s.isActive && s.euin).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.displayName} ({s.euin})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Split Percentage</label>
                <input
                  type="number" min="0.01" max="100" step="0.01"
                  value={splitForm.splitPercent}
                  onChange={(e) => setSplitForm({ ...splitForm, splitPercent: e.target.value })}
                  placeholder="e.g. 30"
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Effective From</label>
                  <input
                    type="date" value={splitForm.effectiveFrom}
                    onChange={(e) => setSplitForm({ ...splitForm, effectiveFrom: e.target.value })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Effective To</label>
                  <input
                    type="date" value={splitForm.effectiveTo}
                    onChange={(e) => setSplitForm({ ...splitForm, effectiveTo: e.target.value })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
              </div>
              {splitError && <p className="text-xs" style={{ color: colors.error }}>{splitError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowSplitModal(false); setSplitError('') }}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
                >Cancel</button>
                <button
                  onClick={editingSplit ? handleUpdateSplit : handleCreateSplit}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >{editingSplit ? 'Update' : 'Add Split'}</button>
              </div>
            </div>
          </div>
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
                <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                  Supports CAMS and KFintech brokerage statement formats
                  {selectedArn && <span> | ARN: {selectedArn}</span>}
                </p>
              </>
            )}
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className="p-4 rounded-xl mb-6" style={{ background: `${colors.success}08`, border: `1px solid ${isDark ? `${colors.success}20` : `${colors.success}15`}`, borderLeft: `4px solid ${colors.success}` }}>
              <p className="text-sm font-semibold" style={{ color: colors.success }}>Upload Successful</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Source</p>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{uploadResult.source}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Granularity</p>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {uploadResult.granularity === 'SCHEME_LEVEL' ? 'Scheme-level' : 'AMC Summary'}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Line Items</p>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{uploadResult.lineItemCount}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Total Brokerage</p>
                  <p className="text-sm font-bold" style={{ color: colors.primary }}>{formatCurrency(uploadResult.totalBrokerage)}</p>
                </div>
                {uploadResult.detectedArn && (
                  <div>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>Detected ARN</p>
                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{uploadResult.detectedArn}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-5">
            {[
              { step: 1 as const, label: 'Upload CSV' },
              { step: 2 as const, label: 'Calculate Expected' },
              { step: 3 as const, label: 'Reconcile' },
            ].map(({ step, label }, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px" style={{ background: uploadStep >= step ? colors.primary : colors.cardBorder }} />}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{
                      background: uploadStep >= step ? colors.primary : colors.chipBg,
                      color: uploadStep >= step ? '#FFFFFF' : colors.textTertiary,
                      border: uploadStep >= step ? 'none' : `1px solid ${colors.cardBorder}`,
                    }}
                  >{step}</div>
                  <span className="text-xs font-medium" style={{ color: uploadStep >= step ? colors.textPrimary : colors.textTertiary }}>{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Working Period */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Working Period</label>
            <input
              type="month"
              className="h-10 px-4 rounded-xl text-sm focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              value={workingPeriod}
              onChange={(e) => setWorkingPeriod(e.target.value)}
            />
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Calculate Expected</p>
              <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>Compute expected trail from AUM x rate master</p>
              <button
                onClick={handleCalculateExpected}
                disabled={!workingPeriod || calculating}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
              >{calculating ? 'Calculating...' : 'Calculate'}</button>
            </div>
            <div className="p-4 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Reconcile</p>
              <p className="text-xs mb-3" style={{ color: colors.textTertiary }}>Match expected vs received brokerage for a period</p>
              <div className="flex gap-2">
                <button
                  onClick={handleReconcile}
                  disabled={!workingPeriod || reconciling}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >{reconciling ? 'Reconciling...' : 'Reconcile'}</button>
                <button
                  onClick={handleReconcileAndCompute}
                  disabled={!workingPeriod || reconciling}
                  className="px-4 py-2 rounded-full text-xs font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: `${colors.secondary}15`, color: colors.secondary, border: `1px solid ${isDark ? `${colors.secondary}30` : `${colors.secondary}20`}` }}
                >
                  {reconciling ? 'Processing...' : 'Reconcile & Compute EUIN'}
                </button>
              </div>
            </div>
          </div>

          {/* Calculate Expected Result Banner */}
          {calcResult && (
            <div className="p-4 rounded-xl mb-4" style={{ background: `${colors.success}08`, border: `1px solid ${isDark ? `${colors.success}20` : `${colors.success}15`}`, borderLeft: `4px solid ${colors.success}` }}>
              <p className="text-sm font-semibold" style={{ color: colors.success }}>Expected Commissions Calculated</p>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {calcResult.recordCount} records for {calcResult.period} | Total expected trail: {formatCurrency(calcResult.totalExpectedTrail)}
              </p>
            </div>
          )}

          {/* Reconcile + Compute Result */}
          {reconComputeResult && (
            <div className="p-4 rounded-xl mb-6" style={{ background: `${colors.primary}08`, border: `1px solid ${isDark ? `${colors.primary}20` : `${colors.primary}15`}`, borderLeft: `4px solid ${colors.primary}` }}>
              <p className="text-sm font-semibold" style={{ color: colors.primary }}>Reconciliation Complete</p>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {reconComputeResult.reconciliation.matched} reconciled, {reconComputeResult.reconciliation.discrepancies} discrepancies.
                {' '}{reconComputeResult.euinPayouts.computed} EUIN payouts computed.
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => { setActiveTab('reports'); fetchRecords() }}
                  className="text-xs font-semibold underline"
                  style={{ color: colors.primary }}
                >View Reports</button>
                <button
                  onClick={() => { setActiveTab('payouts'); setPayoutPeriod(workingPeriod); fetchPayouts() }}
                  className="text-xs font-semibold underline"
                  style={{ color: colors.secondary }}
                >View EUIN Payouts</button>
              </div>
            </div>
          )}

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
                        {u.arnNumber && <> | {u.arnNumber}</>}
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

          {/* Recon Status Bar */}
          {totalStatusCount > 0 && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Reconciliation Status</p>
                <p className="text-xs" style={{ color: colors.textTertiary }}>{totalStatusCount} records</p>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden" style={{ background: `${colors.textTertiary}20` }}>
                {reconciledCount > 0 && (
                  <div style={{ width: `${(reconciledCount / totalStatusCount) * 100}%`, background: colors.success }} />
                )}
                {discrepancyCount > 0 && (
                  <div style={{ width: `${(discrepancyCount / totalStatusCount) * 100}%`, background: colors.error }} />
                )}
                {pendingCount > 0 && (
                  <div style={{ width: `${(pendingCount / totalStatusCount) * 100}%`, background: colors.warning }} />
                )}
              </div>
              <div className="flex gap-4 mt-2">
                {reconciledCount > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: colors.success }} />
                    <span className="text-xs" style={{ color: colors.textSecondary }}>Reconciled ({reconciledCount})</span>
                  </div>
                )}
                {discrepancyCount > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: colors.error }} />
                    <span className="text-xs" style={{ color: colors.textSecondary }}>Discrepancy ({discrepancyCount})</span>
                  </div>
                )}
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: colors.warning }} />
                    <span className="text-xs" style={{ color: colors.textSecondary }}>Pending ({pendingCount})</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Records Table */}
          {loadingRecords ? (
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
                    {isMultiArn && <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>ARN</th>}
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>AUM</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Expected</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Actual</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Diff</th>
                    <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Reconciled</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors cursor-pointer group"
                      style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `${colors.primary}05`}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => handleDrillDown(r)}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: colors.textPrimary }}>{r.period}</td>
                      <td className="px-4 py-3" style={{ color: colors.textSecondary }}>{r.amcShortName || r.amcName}</td>
                      {isMultiArn && <td className="px-4 py-3 text-xs" style={{ color: colors.textTertiary }}>{r.arnNumber || '-'}</td>}
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
                      <td className="px-4 py-3 text-xs" style={{ color: colors.textTertiary }}>
                        {r.reconciledAt ? new Date(r.reconciledAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-2 py-3">
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============= TRENDS TAB (Change B) ============= */}
      {activeTab === 'trends' && (
        <div>
          {loadingTrends ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : trendRecords.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No commission data for trends</p>
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Reconcile commission records to see trend analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Monthly Trail Chart */}
              <div className="p-4 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>Monthly Trail — Expected vs Actual</p>
                {trendsByPeriod.length > 0 && (() => {
                  const maxVal = Math.max(...trendsByPeriod.map(p => Math.max(p.expected, p.actual)), 1)
                  return (
                    <div>
                      <div className="flex items-end gap-2" style={{ height: '120px' }}>
                        {trendsByPeriod.map((p) => (
                          <div key={p.period} className="flex-1 flex gap-0.5 items-end h-full">
                            <div className="flex-1 rounded-t transition-all" style={{
                              height: `${Math.max((p.expected / maxVal) * 100, 4)}%`,
                              background: `${colors.primary}40`,
                            }} title={`Expected: ${formatCurrency(p.expected)}`} />
                            <div className="flex-1 rounded-t transition-all" style={{
                              height: `${Math.max((p.actual / maxVal) * 100, 4)}%`,
                              background: colors.primary,
                            }} title={`Actual: ${formatCurrency(p.actual)}`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {trendsByPeriod.map((p) => (
                          <div key={p.period} className="flex-1 text-center">
                            <p className="text-[10px] truncate" style={{ color: colors.textTertiary }}>{p.period}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-2 rounded-sm" style={{ background: `${colors.primary}40` }} />
                          <span className="text-[10px]" style={{ color: colors.textTertiary }}>Expected</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-2 rounded-sm" style={{ background: colors.primary }} />
                          <span className="text-[10px]" style={{ color: colors.textTertiary }}>Actual</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Period-over-Period Delta */}
              {trendDelta && (
                <div className="p-4 rounded-xl" style={{
                  background: `${trendDelta.pctChange >= 0 ? colors.success : colors.error}08`,
                  border: `1px solid ${isDark ? `${trendDelta.pctChange >= 0 ? colors.success : colors.error}20` : `${trendDelta.pctChange >= 0 ? colors.success : colors.error}15`}`,
                  borderLeft: `4px solid ${trendDelta.pctChange >= 0 ? colors.success : colors.error}`,
                }}>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Your <span className="font-semibold" style={{ color: colors.textPrimary }}>{trendDelta.latestPeriod}</span> trail was{' '}
                    <span className="font-bold" style={{ color: trendDelta.pctChange >= 0 ? colors.success : colors.error }}>
                      {Math.abs(trendDelta.pctChange).toFixed(1)}% {trendDelta.pctChange >= 0 ? 'higher' : 'lower'}
                    </span>{' '}
                    than {trendDelta.prevPeriod}.
                    {trendDelta.biggestName && (
                      <> Biggest change: <span className="font-semibold" style={{ color: colors.textPrimary }}>{trendDelta.biggestName}</span> ({trendDelta.biggestDelta >= 0 ? '+' : ''}{formatCurrencyCompact(trendDelta.biggestDelta)})</>
                    )}
                  </p>
                </div>
              )}

              {/* AMC Realization Rate Table */}
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.cardBorder}` }}>
                <div className="p-3" style={{ background: colors.chipBg }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>AMC Realization Rates</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: colors.chipBg, borderTop: `1px solid ${colors.cardBorder}` }}>
                        <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>AMC</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Expected</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Actual</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Realization</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendsByAmc.map((a) => {
                        const realColor = a.realization >= 95 ? colors.success : a.realization >= 80 ? colors.warning : colors.error
                        return (
                          <tr key={a.amc} style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                            <td className="px-4 py-2.5 font-medium" style={{ color: colors.textPrimary }}>{a.amc}</td>
                            <td className="px-4 py-2.5 text-right" style={{ color: colors.textSecondary }}>{formatCurrency(a.expected)}</td>
                            <td className="px-4 py-2.5 text-right" style={{ color: colors.textSecondary }}>{formatCurrency(a.actual)}</td>
                            <td className="px-4 py-2.5 text-right font-bold" style={{ color: realColor }}>{a.realization.toFixed(1)}%</td>
                            <td className="px-4 py-2.5 text-right font-semibold" style={{ color: a.diff >= 0 ? colors.success : colors.error }}>
                              {a.diff >= 0 ? '+' : ''}{formatCurrency(a.diff)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============= LINE ITEM DRILL-DOWN MODAL ============= */}
      {drillDownRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl flex flex-col" style={{ background: isDark ? colors.backgroundSecondary : '#FFFFFF', border: `1px solid ${colors.cardBorder}` }}>
            {/* Header */}
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                  {drillDownRecord.amcShortName || drillDownRecord.amcName} - Scheme Details
                </h3>
                <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                  Period: {drillDownRecord.period}
                  {drillDownRecord.arnNumber && <> | ARN: {drillDownRecord.arnNumber}</>}
                </p>
              </div>
              <button
                onClick={() => { setDrillDownRecord(null); setDrillDownItems([]) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: colors.chipBg }}
              >
                <svg className="w-4 h-4" style={{ color: colors.textSecondary }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-5">
              {loadingDrillDown ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
                </div>
              ) : drillDownItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: colors.textSecondary }}>No scheme-level line items found for this record</p>
                  <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Upload a scheme-level CSV to see drill-down data</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${colors.cardBorder}` }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: colors.chipBg }}>
                        <th className="text-left px-3 py-2 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Scheme</th>
                        <th className="text-left px-3 py-2 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Folio</th>
                        <th className="text-left px-3 py-2 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Investor</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>AUM</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Gross</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>TDS</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>Net</th>
                        <th className="text-left px-3 py-2 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.primary }}>EUIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drillDownItems.map((item) => (
                        <tr key={item.id} style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                          <td className="px-3 py-2 max-w-[200px] truncate" style={{ color: colors.textPrimary }} title={item.schemeName || ''}>
                            {item.schemeName || '-'}
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: colors.textTertiary }}>{item.folioNo || '-'}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: colors.textSecondary }}>{item.investorName || '-'}</td>
                          <td className="px-3 py-2 text-right" style={{ color: colors.textPrimary }}>{formatCurrency(item.aum)}</td>
                          <td className="px-3 py-2 text-right" style={{ color: colors.textPrimary }}>{formatCurrency(item.grossCommission)}</td>
                          <td className="px-3 py-2 text-right" style={{ color: colors.error }}>{formatCurrency(item.tds)}</td>
                          <td className="px-3 py-2 text-right font-semibold" style={{ color: colors.success }}>{formatCurrency(item.netCommission)}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: colors.textTertiary }}>{item.euin || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer summary */}
            {drillDownItems.length > 0 && (
              <div className="p-4 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${colors.cardBorder}`, background: colors.chipBg }}>
                <span style={{ color: colors.textTertiary }}>{drillDownItems.length} line items</span>
                <div className="flex gap-4">
                  <span style={{ color: colors.textSecondary }}>Total AUM: <strong style={{ color: colors.textPrimary }}>{formatCurrency(drillDownItems.reduce((s, i) => s + i.aum, 0))}</strong></span>
                  <span style={{ color: colors.textSecondary }}>Total Net: <strong style={{ color: colors.success }}>{formatCurrency(drillDownItems.reduce((s, i) => s + i.netCommission, 0))}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============= EUIN PAYOUTS TAB ============= */}
      {activeTab === 'payouts' && (
        <div>
          {/* Info Banner */}
          <div className="p-3 rounded-xl mb-4" style={{ background: `${colors.primary}08`, border: `1px solid ${isDark ? `${colors.primary}20` : `${colors.primary}15`}`, borderLeft: `4px solid ${colors.primary}` }}>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              EUIN payouts are computed from reconciled commissions. Use &quot;Reconcile & Compute EUIN Payouts&quot; on the{' '}
              <button onClick={() => setActiveTab('upload')} className="font-semibold underline" style={{ color: colors.primary }}>
                Upload & Reconcile
              </button>{' '}tab.
            </p>
          </div>

          {/* KPI Row */}
          {payoutSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Payable', value: formatCurrency(payoutSummary.totalPayable), color: colors.primary },
                { label: 'Total Paid (All Time)', value: formatCurrency(payoutSummary.totalPaid), color: colors.success },
                { label: 'Pending Approval', value: String(payoutSummary.pendingApproval), color: colors.warning },
                { label: 'Disputed', value: String(payoutSummary.disputed), color: colors.error },
              ].map((kpi) => (
                <div key={kpi.label} className="p-4 rounded-xl" style={{ background: `${kpi.color}08`, border: `1px solid ${isDark ? `${kpi.color}20` : `${kpi.color}15`}` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>{kpi.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Period Selector + Compute */}
          <div className="flex flex-wrap gap-3 mb-4 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Period</label>
              <input
                type="month"
                className="h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                value={payoutPeriod}
                onChange={(e) => setPayoutPeriod(e.target.value)}
              />
            </div>
            <button
              onClick={handleComputePayouts}
              disabled={!payoutPeriod || computingPayouts}
              className="h-10 px-4 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
            >
              {computingPayouts ? 'Computing...' : 'Compute Payouts'}
            </button>
          </div>

          {/* Payouts Table */}
          {loadingPayouts ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No EUIN payouts found</p>
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>Select a period and click &quot;Compute Payouts&quot; to generate payouts from commission splits</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${colors.cardBorder}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: colors.chipBg }}>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>EUIN</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>Staff</th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>Period</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>Gross</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>Split %</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>Payout</th>
                    <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: colors.textTertiary }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => {
                    const statusColor = p.status === 'PAID' ? colors.success
                      : p.status === 'APPROVED' ? colors.primary
                      : p.status === 'DISPUTED' ? colors.error
                      : colors.warning
                    return (
                      <tr key={p.id} style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>
                            {p.euin}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: colors.textPrimary }}>{p.staffName}</td>
                        <td className="px-4 py-3" style={{ color: colors.textSecondary }}>{p.period}</td>
                        <td className="px-4 py-3 text-right" style={{ color: colors.textPrimary }}>{formatCurrency(p.grossCommission)}</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: colors.primary }}>{p.splitPercent}%</td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: colors.success }}>{formatCurrency(p.payoutAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${statusColor}15`, color: statusColor }}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.status === 'PENDING' && (
                              <button
                                onClick={() => handleApprovePayout(p.id)}
                                className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
                                style={{ background: `${colors.success}15`, color: colors.success }}
                              >Approve</button>
                            )}
                            {p.status === 'APPROVED' && (
                              <button
                                onClick={() => handleMarkPaid(p.id)}
                                className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
                                style={{ background: `${colors.primary}15`, color: colors.primary }}
                              >Mark Paid</button>
                            )}
                            {(p.status === 'PENDING' || p.status === 'APPROVED') && (
                              <button
                                onClick={() => handleDisputePayout(p.id)}
                                className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
                                style={{ background: `${colors.error}15`, color: colors.error }}
                              >Dispute</button>
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
        </div>
      )}
    </AdvisorLayout>
  )
}
