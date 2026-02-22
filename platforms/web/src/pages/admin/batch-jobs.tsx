import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import {
  AdminCard,
  AdminChip,
  AdminStatCard,
  AdminSpinner,
  AdminPagination,
} from '@/components/admin/shared'
import { useAdminTheme } from '@/utils/adminTheme'
import {
  adminBatchJobsApi,
  BatchJobDefinition,
  BatchJobsListResponse,
  BatchJobRun,
} from '@/services/api'

const GROUP_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  fund_sync: { label: 'Fund Sync', color: '#06B6D4', icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182' },
  compliance: { label: 'Compliance', color: '#8B5CF6', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  aum: { label: 'AUM', color: '#10B981', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  insurance: { label: 'Insurance', color: '#F59E0B', icon: 'M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
  bse: { label: 'BSE StAR MF', color: '#3B82F6', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
  nse: { label: 'NSE NMF', color: '#EC4899', icon: 'M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z' },
}

type JobTab = 'all' | 'fund_sync' | 'compliance' | 'aum' | 'insurance' | 'bse' | 'nse'

function getStatusColor(status: string | undefined, colors: any) {
  if (!status) return colors.textTertiary
  switch (status) {
    case 'completed': return colors.success
    case 'failed': return colors.error
    case 'started': return colors.warning
    default: return colors.textTertiary
  }
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'Running...'
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const BatchJobsPage = () => {
  const { colors, isDark } = useAdminTheme()
  const [data, setData] = useState<BatchJobsListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<JobTab>('all')
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Run history state
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [jobRuns, setJobRuns] = useState<BatchJobRun[]>([])
  const [runsLoading, setRunsLoading] = useState(false)
  const [runsPage, setRunsPage] = useState(1)
  const [runsTotalPages, setRunsTotalPages] = useState(1)
  const [runsTotalItems, setRunsTotalItems] = useState(0)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchJobs = useCallback(async () => {
    try {
      const result = await adminBatchJobsApi.list()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batch jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 60000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  // Tab counts
  const tabCounts = useMemo(() => {
    if (!data) return {} as Record<string, number>
    const counts: Record<string, number> = { all: data.jobs.length }
    for (const job of data.jobs) {
      counts[job.group] = (counts[job.group] || 0) + 1
    }
    return counts
  }, [data])

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (!data) return []
    if (activeTab === 'all') return data.jobs
    return data.jobs.filter(j => j.group === activeTab)
  }, [data, activeTab])

  // Reset page on tab change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  // Tab definitions
  const tabs: { key: JobTab; label: string; count: number; icon: string; color: string }[] = [
    {
      key: 'all',
      label: 'All Jobs',
      count: tabCounts.all || 0,
      icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
      color: colors.primary,
    },
    ...Object.entries(GROUP_CONFIG).map(([key, cfg]) => ({
      key: key as JobTab,
      label: cfg.label,
      count: tabCounts[key] || 0,
      icon: cfg.icon,
      color: cfg.color,
    })),
  ]

  const handleTrigger = async (jobId: string) => {
    setTriggeringJob(jobId)
    try {
      await adminBatchJobsApi.trigger(jobId)
      setSuccessMessage(`Job "${data?.jobs.find(j => j.id === jobId)?.name}" triggered successfully`)
      setTimeout(fetchJobs, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger job')
    } finally {
      setTriggeringJob(null)
    }
  }

  const fetchRuns = async (jobId: string, page = 1) => {
    setRunsLoading(true)
    try {
      const result = await adminBatchJobsApi.getRuns(jobId, page, 10)
      setJobRuns(result.runs)
      setRunsPage(result.pagination.page)
      setRunsTotalPages(result.pagination.totalPages)
      setRunsTotalItems(result.pagination.total)
    } catch {
      setJobRuns([])
    } finally {
      setRunsLoading(false)
    }
  }

  const openRunHistory = (jobId: string) => {
    setSelectedJob(jobId)
    setRunsPage(1)
    fetchRuns(jobId, 1)
  }

  const closeRunHistory = () => {
    setSelectedJob(null)
    setJobRuns([])
  }

  const selectedJobDef = data?.jobs.find(j => j.id === selectedJob)

  return (
    <AdminLayout title="Batch Jobs">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Success Message */}
        {successMessage && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center justify-between"
            style={{
              background: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${colors.success}`,
            }}
          >
            <span style={{ color: colors.success }}>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-sm underline" style={{ color: colors.success }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center justify-between"
            style={{
              background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${colors.error}`,
            }}
          >
            <span style={{ color: colors.error }}>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline" style={{ color: colors.error }}>
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <AdminSpinner size="lg" />
          </div>
        ) : data ? (
          <>
            {/* KPI Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <AdminStatCard
                label="Total Jobs"
                value={data.summary.totalJobs}
                icon={
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                }
              />
              <AdminStatCard
                label="Runs (24h)"
                value={data.summary.totalRuns24h}
                variant="secondary"
                icon={
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                }
              />
              <AdminStatCard
                label="Failures (24h)"
                value={data.summary.totalFailed24h}
                variant={data.summary.totalFailed24h > 0 ? 'accent' : 'success'}
                change={data.summary.totalFailed24h === 0 ? 'All clear' : undefined}
                changeType={data.summary.totalFailed24h === 0 ? 'positive' : 'negative'}
                icon={
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                }
              />
              <AdminStatCard
                label="Success Rate"
                value={`${data.summary.successRate}%`}
                variant="success"
                icon={
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Group Tabs */}
            <div className="mb-6">
              <div
                className="p-1.5 rounded-2xl inline-flex gap-1 flex-wrap"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: `0 4px 24px ${colors.glassShadow}`,
                }}
              >
                {tabs.map(tab => {
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}dd 100%)`
                          : 'transparent',
                        color: isActive ? '#FFFFFF' : colors.textSecondary,
                        boxShadow: isActive ? `0 4px 12px ${tab.color}40` : 'none',
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                      </svg>
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: isActive ? 'rgba(255, 255, 255, 0.2)' : colors.chipBg,
                          color: isActive ? '#FFFFFF' : colors.textTertiary,
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Jobs Table or Run History */}
            {selectedJob && selectedJobDef ? (
              /* Run History View */
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: `0 4px 24px ${colors.glassShadow}`,
                }}
              >
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.chipBorder }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeRunHistory}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                      style={{ background: colors.chipBg }}
                    >
                      <svg className="w-4 h-4" style={{ color: colors.textSecondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                      </svg>
                    </button>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                        {selectedJobDef.name}
                      </h2>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>
                        Run History — {selectedJobDef.schedule}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    {runsTotalItems} total runs
                  </span>
                </div>

                {runsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <AdminSpinner size="md" />
                  </div>
                ) : jobRuns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: colors.chipBg }}>
                      <svg className="w-6 h-6" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No run history yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: `${colors.primary}08` }}>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Status</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Started</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Duration</th>
                          <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Total</th>
                          <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Synced</th>
                          <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Failed</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobRuns.map(run => (
                          <tr
                            key={run.id}
                            className="transition-all"
                            style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = colors.chipBg)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td className="px-4 py-3">
                              <span
                                className="text-xs px-2 py-1 rounded font-medium"
                                style={{
                                  background: isDark
                                    ? `${getStatusColor(run.status, colors)}15`
                                    : `${getStatusColor(run.status, colors)}10`,
                                  color: getStatusColor(run.status, colors),
                                }}
                              >
                                {run.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm" style={{ color: colors.textSecondary }}>
                                {new Date(run.startedAt).toLocaleString('en-IN', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm" style={{ color: colors.textSecondary }}>
                                {formatDuration(run.startedAt, run.completedAt)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm" style={{ color: colors.textSecondary }}>
                                {run.recordsTotal != null ? run.recordsTotal : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm" style={{ color: run.recordsSynced != null ? colors.success : colors.textTertiary }}>
                                {run.recordsSynced != null ? run.recordsSynced : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm" style={{ color: run.recordsFailed ? colors.error : colors.textTertiary }}>
                                {run.recordsFailed != null ? run.recordsFailed : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-[250px]">
                              <span className="text-sm truncate block" style={{ color: colors.error }}>
                                {run.errorMessage || ''}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {jobRuns.length > 0 && (
                  <AdminPagination
                    currentPage={runsPage}
                    totalPages={runsTotalPages}
                    totalItems={runsTotalItems}
                    itemsPerPage={10}
                    onPageChange={(page) => fetchRuns(selectedJob, page)}
                    onItemsPerPageChange={() => {}}
                    itemsPerPageOptions={[10]}
                  />
                )}
              </div>
            ) : (
              /* Jobs Table */
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: `0 4px 24px ${colors.glassShadow}`,
                }}
              >
                {/* Table Header Bar */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.chipBorder }}>
                  <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                    {tabs.find(t => t.key === activeTab)?.label || 'Jobs'}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                      {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={fetchJobs}
                      className="h-8 px-3 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: colors.chipBg, color: colors.primary }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: colors.chipBg }}>
                      <svg className="w-6 h-6" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No jobs in this category</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: `${colors.primary}08` }}>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Job</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Group</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Schedule</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Status</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Last Run</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Duration</th>
                          <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>24h Runs</th>
                          <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedJobs.map(job => {
                          const groupCfg = GROUP_CONFIG[job.group]
                          return (
                            <tr
                              key={job.id}
                              className="transition-all"
                              style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = colors.chipBg)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              {/* Job Name */}
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                  {job.name}
                                </p>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>
                                  {job.id}
                                </p>
                              </td>

                              {/* Group */}
                              <td className="px-4 py-3">
                                <span
                                  className="text-xs px-2 py-1 rounded font-medium inline-flex items-center gap-1.5"
                                  style={{
                                    background: isDark ? `${groupCfg.color}15` : `${groupCfg.color}10`,
                                    color: groupCfg.color,
                                  }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: groupCfg.color }} />
                                  {groupCfg.label}
                                </span>
                              </td>

                              {/* Schedule */}
                              <td className="px-4 py-3">
                                <span className="text-sm" style={{ color: colors.textSecondary }}>
                                  {job.schedule}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="px-4 py-3">
                                <span
                                  className="text-xs px-2 py-1 rounded font-medium"
                                  style={{
                                    background: isDark
                                      ? `${getStatusColor(job.latestRun?.status, colors)}15`
                                      : `${getStatusColor(job.latestRun?.status, colors)}10`,
                                    color: getStatusColor(job.latestRun?.status, colors),
                                  }}
                                >
                                  {job.latestRun?.status || 'Never run'}
                                </span>
                              </td>

                              {/* Last Run */}
                              <td className="px-4 py-3">
                                <span className="text-sm" style={{ color: colors.textSecondary }}>
                                  {job.latestRun ? formatTimeAgo(job.latestRun.startedAt) : '-'}
                                </span>
                              </td>

                              {/* Duration */}
                              <td className="px-4 py-3">
                                <span className="text-sm" style={{ color: colors.textSecondary }}>
                                  {job.latestRun ? formatDuration(job.latestRun.startedAt, job.latestRun.completedAt) : '-'}
                                </span>
                              </td>

                              {/* 24h Runs */}
                              <td className="px-4 py-3 text-right">
                                {job.stats24h.total > 0 ? (
                                  <div>
                                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                      {job.stats24h.total}
                                    </span>
                                    {job.stats24h.failed > 0 && (
                                      <span className="text-xs ml-1.5" style={{ color: colors.error }}>
                                        ({job.stats24h.failed} failed)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm" style={{ color: colors.textTertiary }}>-</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openRunHistory(job.id)}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                                    style={{ background: colors.chipBg, color: colors.textSecondary }}
                                  >
                                    History
                                  </button>
                                  {job.manualTrigger && (
                                    <button
                                      onClick={() => handleTrigger(job.id)}
                                      disabled={triggeringJob === job.id}
                                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                                      style={{
                                        background: isDark ? `${colors.primary}15` : `${colors.primary}08`,
                                        color: colors.primary,
                                      }}
                                    >
                                      {triggeringJob === job.id ? (
                                        <AdminSpinner size="sm" />
                                      ) : (
                                        'Trigger'
                                      )}
                                    </button>
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

                {filteredJobs.length > 0 && (
                  <AdminPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredJobs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(val) => {
                      setItemsPerPage(val)
                      setCurrentPage(1)
                    }}
                    itemsPerPageOptions={[5, 10, 25]}
                  />
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  )
}

export default BatchJobsPage
