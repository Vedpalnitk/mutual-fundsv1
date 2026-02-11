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

// Mock SIP data
const mockSIPs: SIP[] = [
  {
    id: 's1',
    clientId: 'c1',
    clientName: 'Rajesh Sharma',
    fundName: 'HDFC Mid-Cap Opportunities Fund - Direct Growth',
    fundSchemeCode: '112090',
    folioNumber: 'HDFC-123456',
    amount: 25000,
    frequency: 'Monthly',
    sipDate: 5,
    startDate: '2023-01-05',
    status: 'Active',
    totalInstallments: 24,
    completedInstallments: 12,
    totalInvested: 300000,
    currentValue: 342000,
    returns: 42000,
    returnsPercent: 14.0,
    nextSipDate: '2024-02-05',
    lastSipDate: '2024-01-05',
  },
  {
    id: 's2',
    clientId: 'c2',
    clientName: 'Priya Patel',
    fundName: 'ICICI Prudential Bluechip Fund - Direct Growth',
    fundSchemeCode: '120594',
    folioNumber: 'ICICI-789012',
    amount: 15000,
    frequency: 'Monthly',
    sipDate: 10,
    startDate: '2023-06-10',
    status: 'Active',
    totalInstallments: 0,
    completedInstallments: 8,
    totalInvested: 120000,
    currentValue: 132600,
    returns: 12600,
    returnsPercent: 10.5,
    nextSipDate: '2024-02-10',
    lastSipDate: '2024-01-10',
    stepUpPercent: 10,
    stepUpFrequency: 'Yearly',
  },
  {
    id: 's3',
    clientId: 'c3',
    clientName: 'Amit Kumar',
    fundName: 'Axis Long Term Equity Fund - Direct Growth',
    fundSchemeCode: '112323',
    folioNumber: 'AXIS-345678',
    amount: 10000,
    frequency: 'Monthly',
    sipDate: 15,
    startDate: '2022-04-15',
    status: 'Active',
    totalInstallments: 36,
    completedInstallments: 22,
    totalInvested: 220000,
    currentValue: 268400,
    returns: 48400,
    returnsPercent: 22.0,
    nextSipDate: '2024-02-15',
    lastSipDate: '2024-01-15',
  },
  {
    id: 's4',
    clientId: 'c4',
    clientName: 'Sneha Gupta',
    fundName: 'SBI Equity Hybrid Fund - Direct Growth',
    fundSchemeCode: '119598',
    folioNumber: 'SBI-901234',
    amount: 20000,
    frequency: 'Monthly',
    sipDate: 1,
    startDate: '2023-03-01',
    status: 'Paused',
    totalInstallments: 24,
    completedInstallments: 10,
    totalInvested: 200000,
    currentValue: 218000,
    returns: 18000,
    returnsPercent: 9.0,
    nextSipDate: '',
    lastSipDate: '2023-12-01',
  },
  {
    id: 's5',
    clientId: 'c5',
    clientName: 'Vikram Singh',
    fundName: 'Mirae Asset Large Cap Fund - Direct Growth',
    fundSchemeCode: '122639',
    folioNumber: 'MIRAE-567890',
    amount: 50000,
    frequency: 'Monthly',
    sipDate: 5,
    startDate: '2023-09-05',
    status: 'Failed',
    totalInstallments: 12,
    completedInstallments: 4,
    totalInvested: 200000,
    currentValue: 208000,
    returns: 8000,
    returnsPercent: 4.0,
    nextSipDate: '2024-02-05',
    lastSipDate: '2023-12-05',
  },
  {
    id: 's6',
    clientId: 'c6',
    clientName: 'Meera Krishnan',
    fundName: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    fundSchemeCode: '135781',
    folioNumber: 'PPFAS-012678',
    amount: 30000,
    frequency: 'Monthly',
    sipDate: 20,
    startDate: '2022-01-20',
    status: 'Completed',
    totalInstallments: 24,
    completedInstallments: 24,
    totalInvested: 720000,
    currentValue: 892800,
    returns: 172800,
    returnsPercent: 24.0,
    nextSipDate: '',
    lastSipDate: '2023-12-20',
  },
]

type ViewMode = 'list' | 'calendar'
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
      setError('Using demo data - API not available')
      setSips(mockSIPs)
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
                            {(sip.status === 'Completed' || sip.status === 'Cancelled' || sip.status === 'Failed') && (
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
            ) : (
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
