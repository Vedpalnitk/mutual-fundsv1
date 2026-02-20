/**
 * SIP Management Dashboard
 *
 * Comprehensive dashboard for managing Systematic Investment Plans.
 * Features: Active SIPs, Calendar view, Performance tracking, SIP registration
 */

import { useState, useEffect, useCallback } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, getStatusColor } from '@/utils/fa'
import { SIP, SIPStatus, SIPFrequency, SIPFormData } from '@/utils/faTypes'
import {
  FACard,
  FAStatCard,
  FAChip,
  FASearchInput,
  FASelect,
  FAButton,
  FAEmptyState,
  FASectionHeader,
  FATintedCard,
  FALoadingState,
  useNotification,
} from '@/components/advisor/shared'
import { sipsApi } from '@/services/api'

type ViewMode = 'list' | 'calendar' | 'analytics'
type StatusFilter = 'all' | SIPStatus

const SIPsDashboard = () => {
  const { colors, isDark } = useFATheme()
  const { showNotification } = useNotification()
  const [sips, setSips] = useState<SIP[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null)

  // Fetch SIPs from API
  const fetchSIPs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await sipsApi.list<SIP>({
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      })
      setSips(response.data)
    } catch {
      setError('Failed to load SIPs - check backend connection')
      setSips([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterStatus])

  useEffect(() => {
    fetchSIPs()
  }, [fetchSIPs])

  // SIP Lifecycle Actions
  const handlePauseSIP = async (sipId: string) => {
    setActionLoading(sipId)
    try {
      await sipsApi.pause(sipId)
      showNotification('success', 'SIP paused successfully')
      fetchSIPs()
    } catch (err) {
      console.error('Failed to pause SIP:', err)
      showNotification('error', 'Failed to pause SIP')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResumeSIP = async (sipId: string) => {
    setActionLoading(sipId)
    try {
      await sipsApi.resume(sipId)
      showNotification('success', 'SIP resumed successfully')
      fetchSIPs()
    } catch (err) {
      console.error('Failed to resume SIP:', err)
      showNotification('error', 'Failed to resume SIP')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSIP = async (sipId: string) => {
    setActionLoading(sipId)
    try {
      await sipsApi.cancel(sipId)
      showNotification('success', 'SIP cancelled successfully')
      setShowCancelConfirm(null)
      fetchSIPs()
    } catch (err) {
      console.error('Failed to cancel SIP:', err)
      showNotification('error', 'Failed to cancel SIP')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRetrySIP = async (sipId: string) => {
    setActionLoading(sipId)
    try {
      await sipsApi.retry(sipId)
      showNotification('success', 'SIP retried successfully')
      fetchSIPs()
    } catch (err: any) {
      console.error('Failed to retry SIP:', err)
      showNotification('error', err?.message || 'Failed to retry SIP')
    } finally {
      setActionLoading(null)
    }
  }

  // Analytics state
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [bookGrowth, setBookGrowth] = useState<any[]>([])
  const [collectionReport, setCollectionReport] = useState<any[]>([])
  const [mandateAlerts, setMandateAlerts] = useState<any[]>([])

  useEffect(() => {
    if (viewMode === 'analytics') {
      setAnalyticsLoading(true)
      Promise.allSettled([
        sipsApi.getBookGrowth(),
        sipsApi.getMonthlyCollectionReport(6),
        sipsApi.getMandateExpiryAlerts(),
      ]).then(([growthRes, collectionRes, alertsRes]) => {
        if (growthRes.status === 'fulfilled') setBookGrowth(growthRes.value as any[])
        if (collectionRes.status === 'fulfilled') setCollectionReport(collectionRes.value as any[])
        if (alertsRes.status === 'fulfilled') setMandateAlerts(alertsRes.value as any[])
      }).finally(() => setAnalyticsLoading(false))
    }
  }, [viewMode])

  // Client-side filtering for mock data
  const filteredSIPs = error
    ? sips.filter(sip => {
        const matchesSearch = sip.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             sip.fundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             sip.folioNumber.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || sip.status === filterStatus
        return matchesSearch && matchesStatus
      })
    : sips

  // Stats calculations
  const activeSIPs = sips.filter(s => s.status === 'Active')
  const totalMonthlyInflow = activeSIPs.reduce((sum, s) => sum + s.amount, 0)
  const totalInvested = sips.reduce((sum, s) => sum + s.totalInvested, 0)
  const totalCurrentValue = sips.reduce((sum, s) => sum + s.currentValue, 0)
  const failedSIPs = sips.filter(s => s.status === 'Failed').length

  // Calendar calculations
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getSIPsForDay = (day: number) => {
    return activeSIPs.filter(sip => sip.sipDate === day)
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth)
    const firstDay = getFirstDayOfMonth(selectedMonth)
    const days = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Day headers
    const headers = dayNames.map(day => (
      <div
        key={day}
        className="text-center text-xs font-semibold uppercase tracking-wider p-2"
        style={{ color: colors.textTertiary }}
      >
        {day}
      </div>
    ))

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />)
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const sipsOnDay = getSIPsForDay(day)
      const hasSIP = sipsOnDay.length > 0
      const totalAmount = sipsOnDay.reduce((sum, s) => sum + s.amount, 0)

      days.push(
        <div
          key={day}
          className="p-2 min-h-[80px] rounded-lg transition-all"
          style={{
            background: hasSIP
              ? isDark
                ? colors.pastelIndigo
                : colors.pastelMint
              : 'transparent',
            border: hasSIP ? `1px solid ${colors.primary}30` : `1px solid ${colors.cardBorder}`,
          }}
        >
          <div className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
            {day}
          </div>
          {hasSIP && (
            <div>
              <div
                className="text-xs font-semibold"
                style={{ color: colors.primary }}
              >
                {sipsOnDay.length} SIP{sipsOnDay.length > 1 ? 's' : ''}
              </div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                {formatCurrency(totalAmount)}
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-1">{headers}</div>
        <div className="grid grid-cols-7 gap-1 mt-2">{days}</div>
      </div>
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getStatusChipColor = (status: SIPStatus) => {
    return getStatusColor(status, colors)
  }

  const upcomingSIPs = activeSIPs
    .filter(sip => sip.nextSipDate)
    .sort((a, b) => new Date(a.nextSipDate).getTime() - new Date(b.nextSipDate).getTime())
    .slice(0, 5)

  return (
    <AdvisorLayout title="SIP Management">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Manage and track Systematic Investment Plans
            </p>
          </div>
          <FAButton className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Register New SIP
          </FAButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <FAStatCard
            label="Active SIPs"
            value={activeSIPs.length.toString()}
            change={`${sips.length} total`}
          />
          <FAStatCard
            label="Monthly Inflow"
            value={formatCurrency(totalMonthlyInflow)}
            change="Expected this month"
          />
          <FAStatCard
            label="Total Invested"
            value={formatCurrency(totalInvested)}
            change="All SIPs combined"
          />
          <FAStatCard
            label="Current Value"
            value={formatCurrency(totalCurrentValue)}
            change={`+${formatCurrency(totalCurrentValue - totalInvested)} returns`}
            changeType="positive"
          />
          <FAStatCard
            label="Failed SIPs"
            value={failedSIPs.toString()}
            change="Needs attention"
            changeType={failedSIPs > 0 ? 'negative' : 'neutral'}
          />
        </div>

        {/* View Toggle & Filters */}
        <FACard className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <FASearchInput
                placeholder="Search by client, fund, or folio..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="flex-1 max-w-md"
              />
              <FASelect
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Paused', label: 'Paused' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Failed', label: 'Failed' },
                ]}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
                containerClassName="w-36"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: colors.chipBg }}>
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: viewMode === 'list'
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : 'transparent',
                  color: viewMode === 'list' ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: viewMode === 'calendar'
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : 'transparent',
                  color: viewMode === 'calendar' ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: viewMode === 'analytics'
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : 'transparent',
                  color: viewMode === 'analytics' ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                Analytics
              </button>
            </div>
          </div>
        </FACard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - List or Calendar */}
          <div className="col-span-1 lg:col-span-2">
            {loading ? (
              <FALoadingState message="Loading SIPs..." />
            ) : viewMode === 'list' ? (
              <FACard>
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: colors.chipBg }}>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Client / Fund</th>
                      <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Amount</th>
                      <th className="text-center p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Date</th>
                      <th className="text-center p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Status</th>
                      <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Returns</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSIPs.map((sip, i) => (
                      <tr
                        key={sip.id}
                        className="transition-colors"
                        style={{
                          borderTop: i > 0 ? `1px solid ${colors.cardBorder}` : undefined
                        }}
                      >
                        <td className="p-4">
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{sip.clientName}</p>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>{sip.fundName}</p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>
                            {sip.folioNumber} | {sip.completedInstallments}/{sip.totalInstallments || '∞'} installments
                          </p>
                        </td>
                        <td className="p-4 text-right">
                          <p className="font-bold" style={{ color: colors.textPrimary }}>
                            {formatCurrency(sip.amount)}
                          </p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>
                            {sip.frequency}
                          </p>
                          {(sip as any).stepUpPercent > 0 && (
                            <p className="text-xs font-medium mt-0.5" style={{ color: colors.success }}>
                              Step-up: +{(sip as any).stepUpPercent}% yearly
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <p className="font-medium" style={{ color: colors.textPrimary }}>
                            {sip.sipDate}{['st', 'nd', 'rd'][sip.sipDate - 1] || 'th'}
                          </p>
                          {sip.nextSipDate && (
                            <p className="text-xs" style={{ color: colors.textTertiary }}>
                              Next: {new Date(sip.nextSipDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <FAChip color={getStatusChipColor(sip.status)}>{sip.status}</FAChip>
                        </td>
                        <td className="p-4 text-right">
                          <p
                            className="font-bold"
                            style={{ color: sip.returnsPercent >= 0 ? colors.success : colors.error }}
                          >
                            {sip.returnsPercent >= 0 ? '+' : ''}{sip.returnsPercent.toFixed(1)}%
                          </p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>
                            {formatCurrency(sip.currentValue)}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 justify-end">
                            {/* Action buttons based on status */}
                            {sip.status === 'Active' && (
                              <>
                                <button
                                  onClick={() => {
                                    setActionLoading(sip.id)
                                    sipsApi.registerWithBse(sip.id)
                                      .then(() => {
                                        showNotification('success', 'SIP registered with BSE StAR MF')
                                        fetchSIPs()
                                      })
                                      .catch((err: any) => {
                                        showNotification('error', err?.message || 'Failed to register with BSE')
                                      })
                                      .finally(() => setActionLoading(null))
                                  }}
                                  disabled={actionLoading === sip.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                                  style={{ background: `${colors.primary}15`, color: colors.primary }}
                                  title="Register with BSE"
                                >
                                  BSE
                                </button>
                                <button
                                  onClick={() => handlePauseSIP(sip.id)}
                                  disabled={actionLoading === sip.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                                  style={{ background: `${colors.warning}15`, color: colors.warning }}
                                  title="Pause SIP"
                                >
                                  {actionLoading === sip.id ? (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => setShowCancelConfirm(sip.id)}
                                  disabled={actionLoading === sip.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                                  style={{ background: `${colors.error}15`, color: colors.error }}
                                  title="Cancel SIP"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {sip.status === 'Paused' && (
                              <>
                                <button
                                  onClick={() => handleResumeSIP(sip.id)}
                                  disabled={actionLoading === sip.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                                  style={{ background: `${colors.success}15`, color: colors.success }}
                                  title="Resume SIP"
                                >
                                  {actionLoading === sip.id ? (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => setShowCancelConfirm(sip.id)}
                                  disabled={actionLoading === sip.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                                  style={{ background: `${colors.error}15`, color: colors.error }}
                                  title="Cancel SIP"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {sip.status === 'Failed' && (
                              <button
                                onClick={() => handleRetrySIP(sip.id)}
                                disabled={actionLoading === sip.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                                style={{ background: `${colors.warning}15`, color: colors.warning }}
                                title="Retry SIP"
                              >
                                {actionLoading === sip.id ? (
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                )}
                              </button>
                            )}
                            {(sip.status === 'Completed' || sip.status === 'Cancelled') && (
                              <span className="text-xs" style={{ color: colors.textTertiary }}>
                                No actions
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                {filteredSIPs.length === 0 && (
                  <FAEmptyState
                    icon={
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    }
                    title="No SIPs found"
                    description="Try adjusting your search or filters"
                  />
                )}
              </FACard>
            ) : viewMode === 'calendar' ? (
              <FACard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                    {selectedMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{ background: colors.chipBg, color: colors.textPrimary }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{ background: colors.chipBg, color: colors.textPrimary }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                {renderCalendar()}
              </FACard>
            ) : (
              /* Analytics View */
              <div className="space-y-6">
                {analyticsLoading ? (
                  <FALoadingState message="Loading analytics..." />
                ) : (
                  <>
                    {/* SIP Book Growth */}
                    <FACard>
                      <FASectionHeader title="SIP Book Growth (12 Months)" />
                      <div className="mt-4 space-y-2">
                        {bookGrowth.length > 0 ? bookGrowth.map((m: any, i: number) => {
                          const maxAmount = Math.max(...bookGrowth.map((b: any) => b.totalAmount || 0), 1)
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs w-16 text-right" style={{ color: colors.textTertiary }}>{m.month}</span>
                              <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: colors.chipBg }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${((m.totalAmount || 0) / maxAmount) * 100}%`,
                                    background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                                    minWidth: '2px',
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium w-20 text-right" style={{ color: colors.textPrimary }}>
                                {formatCurrency(m.totalAmount || 0)}
                              </span>
                              <span className="text-xs w-8 text-right" style={{ color: colors.textTertiary }}>{m.count}</span>
                            </div>
                          )
                        }) : (
                          <p className="text-sm text-center py-4" style={{ color: colors.textTertiary }}>No growth data available</p>
                        )}
                      </div>
                    </FACard>

                    {/* Monthly Collection Report */}
                    <FACard>
                      <FASectionHeader title="Monthly Collection (Expected vs Actual)" />
                      <div className="mt-4 overflow-x-auto">
                        {collectionReport.length > 0 ? (
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                                <th className="text-left py-2 text-xs font-semibold" style={{ color: colors.textTertiary }}>Month</th>
                                <th className="text-right py-2 text-xs font-semibold" style={{ color: colors.textTertiary }}>Expected</th>
                                <th className="text-right py-2 text-xs font-semibold" style={{ color: colors.textTertiary }}>Actual</th>
                                <th className="text-right py-2 text-xs font-semibold" style={{ color: colors.textTertiary }}>Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {collectionReport.map((m: any, i: number) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                                  <td className="py-2" style={{ color: colors.textPrimary }}>{m.month}</td>
                                  <td className="py-2 text-right" style={{ color: colors.textSecondary }}>{formatCurrency(m.expected || 0)}</td>
                                  <td className="py-2 text-right" style={{ color: colors.textPrimary }}>{formatCurrency(m.actual || 0)}</td>
                                  <td className="py-2 text-right font-medium" style={{ color: (m.collectionRate || 0) >= 90 ? colors.success : colors.warning }}>
                                    {(m.collectionRate || 0).toFixed(0)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-sm text-center py-4" style={{ color: colors.textTertiary }}>No collection data available</p>
                        )}
                      </div>
                    </FACard>

                    {/* Mandate Expiry Alerts */}
                    <FACard>
                      <FASectionHeader title="Mandate Expiry Alerts" />
                      <div className="mt-4">
                        {mandateAlerts.length > 0 ? (
                          <div className="space-y-2">
                            {mandateAlerts.map((alert: any, i: number) => (
                              <FATintedCard key={i}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{alert.clientName}</p>
                                    <p className="text-xs" style={{ color: colors.textSecondary }}>{alert.fundName}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-medium" style={{ color: colors.error }}>
                                      Mandate expires: {alert.mandateExpiry ? new Date(alert.mandateExpiry).toLocaleDateString('en-IN') : 'N/A'}
                                    </p>
                                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                                      SIP ends: {alert.sipEndDate ? new Date(alert.sipEndDate).toLocaleDateString('en-IN') : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </FATintedCard>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-center py-4" style={{ color: colors.textTertiary }}>No mandate alerts</p>
                        )}
                      </div>
                    </FACard>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming SIPs */}
            <FACard>
              <FASectionHeader title="Upcoming SIPs" />
              <div className="space-y-3 mt-4">
                {upcomingSIPs.map(sip => (
                  <FATintedCard key={sip.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {sip.clientName}
                        </p>
                        <p className="text-xs" style={{ color: colors.textTertiary }}>
                          {sip.fundName.split(' ').slice(0, 3).join(' ')}...
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: colors.primary }}>
                          {formatCurrency(sip.amount)}
                        </p>
                        <p className="text-xs" style={{ color: colors.textTertiary }}>
                          {new Date(sip.nextSipDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </FATintedCard>
                ))}
                {upcomingSIPs.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: colors.textTertiary }}>
                    No upcoming SIPs
                  </p>
                )}
              </div>
            </FACard>

            {/* Failed SIPs Alert */}
            {failedSIPs > 0 && (
              <div
                className="p-4 rounded-xl"
                style={{
                  background: isDark
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(239, 68, 68, 0.04)',
                  border: `1px solid ${colors.error}30`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${colors.error}15` }}
                  >
                    <svg className="w-5 h-5" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {failedSIPs} Failed SIP{failedSIPs > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      Check mandate status and bank account details
                    </p>
                    <button
                      className="text-xs font-medium mt-2"
                      style={{ color: colors.error }}
                    >
                      View Failed SIPs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SIP Performance Summary */}
            <FACard>
              <FASectionHeader title="Performance Overview" />
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>Total Invested</span>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>
                    {formatCurrency(totalInvested)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>Current Value</span>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>
                    {formatCurrency(totalCurrentValue)}
                  </span>
                </div>
                <div
                  className="h-px w-full"
                  style={{ background: colors.cardBorder }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Total Returns</span>
                  <span
                    className="font-bold"
                    style={{ color: totalCurrentValue >= totalInvested ? colors.success : colors.error }}
                  >
                    {totalCurrentValue >= totalInvested ? '+' : ''}
                    {formatCurrency(totalCurrentValue - totalInvested)}
                    <span className="text-xs ml-1">
                      ({((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
              </div>
            </FACard>

            {/* Quick Stats by Status */}
            <FACard>
              <FASectionHeader title="By Status" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                {(['Active', 'Paused', 'Completed', 'Failed'] as SIPStatus[]).map(status => {
                  const count = sips.filter(s => s.status === status).length
                  return (
                    <div
                      key={status}
                      className="p-3 rounded-lg text-center"
                      style={{
                        background: `${getStatusChipColor(status)}10`,
                        border: `1px solid ${getStatusChipColor(status)}30`,
                      }}
                    >
                      <p className="text-lg font-bold" style={{ color: getStatusChipColor(status) }}>
                        {count}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {status}
                      </p>
                    </div>
                  )
                })}
              </div>
            </FACard>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCancelConfirm(null)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: colors.cardBackground,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${colors.error}15` }}
                >
                  <svg className="w-6 h-6" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                    Cancel SIP?
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                Are you sure you want to cancel this SIP? The SIP will be permanently cancelled and no future installments will be processed.
              </p>
              <div className="flex items-center justify-end gap-3">
                <FAButton
                  variant="secondary"
                  onClick={() => setShowCancelConfirm(null)}
                  disabled={actionLoading === showCancelConfirm}
                >
                  Keep SIP
                </FAButton>
                <button
                  onClick={() => handleCancelSIP(showCancelConfirm)}
                  disabled={actionLoading === showCancelConfirm}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${colors.error} 0%, #DC2626 100%)`,
                  }}
                >
                  {actionLoading === showCancelConfirm ? 'Cancelling...' : 'Cancel SIP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdvisorLayout>
  )
}

export default SIPsDashboard
