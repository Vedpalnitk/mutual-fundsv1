import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import {
  AdminCard,
  AdminStatCard,
  AdminChip,
  AdminPagination,
  AdminSpinner,
  AdminEmptyState,
  AdminModal,
} from '@/components/admin/shared'
import { useAdminTheme } from '@/utils/adminTheme'
import {
  adminAuditLogsApi,
  AuditLogEntry,
  AuditLogStats,
  PaginatedResponse,
  adminExportApi,
} from '@/services/api/admin'
import { getAuthToken } from '@/services/api'

const ACTION_OPTIONS = ['all', 'CREATE', 'UPDATE', 'DELETE', 'EXECUTE', 'LOGIN', 'REGISTER'] as const
const ENTITY_OPTIONS = ['all', 'User', 'FATransaction', 'BseOrder', 'NseOrder', 'SystemSetting'] as const

function getActionColor(action: string, colors: ReturnType<typeof useAdminTheme>['colors']): string {
  switch (action.toUpperCase()) {
    case 'CREATE': return colors.success
    case 'UPDATE': return colors.primary
    case 'DELETE': return colors.error
    case 'LOGIN': return colors.secondary
    case 'REGISTER': return colors.primary
    case 'EXECUTE': return colors.warning
    default: return colors.textSecondary
  }
}

function getEntityColor(entity: string, colors: ReturnType<typeof useAdminTheme>['colors']): string {
  switch (entity) {
    case 'User': return colors.primary
    case 'FATransaction': return colors.secondary
    case 'BseOrder': return colors.success
    case 'NseOrder': return colors.warning
    case 'SystemSetting': return colors.error
    default: return colors.textSecondary
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const AuditLogsPage = () => {
  const { isDark, colors } = useAdminTheme()

  // Data state
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [logs, setLogs] = useState<PaginatedResponse<AuditLogEntry> | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const limit = 20

  // Load stats on mount
  useEffect(() => {
    adminAuditLogsApi.getStats().then(setStats).catch(() => {})
  }, [])

  // Load logs when filters / page change
  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      try {
        const params: Record<string, string | number> = { page, limit }
        if (search) params.search = search
        if (actionFilter !== 'all') params.action = actionFilter
        if (entityFilter !== 'all') params.entityType = entityFilter
        if (dateFrom) params.dateFrom = dateFrom
        if (dateTo) params.dateTo = dateTo
        const data = await adminAuditLogsApi.list(params)
        setLogs(data)
      } catch {
        setLogs(null)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [page, search, actionFilter, entityFilter, dateFrom, dateTo])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, actionFilter, entityFilter, dateFrom, dateTo])

  const handleExport = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3801'
    const params: Record<string, string> = {}
    if (actionFilter !== 'all') params.action = actionFilter
    if (entityFilter !== 'all') params.entityType = entityFilter
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    const path = adminExportApi.exportAuditLogs(Object.keys(params).length > 0 ? params : undefined)
    const token = getAuthToken()
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // Silently fail
    }
  }

  const totalPages = logs?.pagination?.totalPages || 1
  const totalItems = logs?.pagination?.total || 0
  const entries = logs?.data || []

  const inputStyle = {
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    color: colors.textPrimary,
  }

  return (
    <AdminLayout title="Audit Logs">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AdminStatCard
            label="Total Logs"
            value={stats?.totalLogs?.toLocaleString() ?? '--'}
            variant="primary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Today's Activity"
            value={stats?.todayActivity?.toLocaleString() ?? '--'}
            variant="secondary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Unique Users"
            value={stats?.uniqueUsersToday?.toLocaleString() ?? '--'}
            variant="success"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Top Action"
            value={stats?.topAction ?? '--'}
            variant="accent"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
        </div>

        {/* Filters */}
        <AdminCard padding="md" className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user, entity ID..."
                className="w-full h-9 px-3 rounded-lg text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt === 'all' ? 'All Actions' : opt}</option>
              ))}
            </select>
            {/* Entity Filter */}
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt === 'all' ? 'All Entities' : opt}</option>
              ))}
            </select>
            {/* Date From */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            />
            {/* Date To */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            />
            {/* Export */}
            <button
              onClick={handleExport}
              className="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:opacity-80"
              style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
          </div>
        </AdminCard>

        {/* Table */}
        <AdminCard padding="none">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <AdminSpinner size="lg" />
            </div>
          ) : entries.length === 0 ? (
            <AdminEmptyState
              title="No audit logs found"
              description="Try adjusting your filters or check back later."
              icon={
                <svg className="w-7 h-7" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3"
                        style={{ color: colors.textTertiary, borderBottom: `1px solid ${colors.cardBorder}` }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                      onClick={() => setSelectedLog(log)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.chipBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: colors.textSecondary }}>
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium" style={{ color: colors.textPrimary }}>
                            {log.user?.profile?.name || 'Unknown'}
                          </p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>
                            {log.user?.email || '--'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AdminChip color={getActionColor(log.action, colors)} size="xs">
                          {log.action}
                        </AdminChip>
                      </td>
                      <td className="px-4 py-3">
                        <AdminChip color={getEntityColor(log.entityType, colors)} size="xs" variant="outlined">
                          {log.entityType}
                        </AdminChip>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: colors.textTertiary }}>
                          {log.entityId ? log.entityId.slice(0, 12) + '...' : '--'}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: colors.textSecondary }}>
                        {log.ipAddress || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && entries.length > 0 && (
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={limit}
              onPageChange={setPage}
            />
          )}
        </AdminCard>

        {/* Detail Modal */}
        <AdminModal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Details"
          size="lg"
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                    Timestamp
                  </label>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>{formatTimestamp(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                    User
                  </label>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>
                    {selectedLog.user?.profile?.name || 'Unknown'}
                  </p>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>{selectedLog.user?.email}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                    Action
                  </label>
                  <AdminChip color={getActionColor(selectedLog.action, colors)} size="sm">
                    {selectedLog.action}
                  </AdminChip>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                    Entity Type
                  </label>
                  <AdminChip color={getEntityColor(selectedLog.entityType, colors)} size="sm" variant="outlined">
                    {selectedLog.entityType}
                  </AdminChip>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                    Entity ID
                  </label>
                  <p className="text-sm font-mono" style={{ color: colors.textPrimary }}>
                    {selectedLog.entityId || '--'}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                    IP Address
                  </label>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>{selectedLog.ipAddress || '--'}</p>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                    User Agent
                  </label>
                  <p className="text-xs break-all" style={{ color: colors.textSecondary }}>
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {/* Details JSON */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                    Details
                  </label>
                  <pre
                    className="p-4 rounded-xl text-xs overflow-auto max-h-64"
                    style={{
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                  >
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </AdminModal>
      </div>
    </AdminLayout>
  )
}

export default AuditLogsPage
