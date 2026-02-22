import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminCard, AdminStatCard, AdminChip, AdminPagination, AdminSpinner, AdminEmptyState } from '@/components/admin/shared'
import { useAdminTheme } from '@/utils/adminTheme'
import {
  adminAdvisorsApi,
  AdvisorOverviewKPIs,
  AdminAdvisorRow,
  PaginatedResponse,
} from '@/services/api/admin'

const formatCurrency = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`
  return `₹${val.toLocaleString('en-IN')}`
}

const formatRelativeTime = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

type SortField = 'aum' | 'clientCount' | 'lastLoginAt'

const AdvisorsPage = () => {
  const router = useRouter()
  const { isDark, colors } = useAdminTheme()

  // State
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<AdvisorOverviewKPIs | null>(null)
  const [advisors, setAdvisors] = useState<AdminAdvisorRow[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Controls
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('aum')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sortBy, sortDir])

  // Load overview KPIs
  useEffect(() => {
    adminAdvisorsApi.getOverview().then(setOverview).catch(() => {})
  }, [])

  // Load advisors list
  useEffect(() => {
    const loadAdvisors = async () => {
      setLoading(true)
      try {
        const params: Record<string, string | number> = {
          page,
          limit: itemsPerPage,
          sortBy,
          sortDir,
        }
        if (debouncedSearch) params.search = debouncedSearch

        const res: PaginatedResponse<AdminAdvisorRow> = await adminAdvisorsApi.list(params)
        setAdvisors(res.data)
        setTotalItems(res.pagination.total)
        setTotalPages(res.pagination.totalPages)
      } catch {
        setAdvisors([])
        setTotalItems(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    loadAdvisors()
  }, [page, itemsPerPage, debouncedSearch, sortBy, sortDir])

  return (
    <AdminLayout title="Advisors">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <AdminStatCard
            label="Total Advisors"
            value={overview?.totalAdvisors ?? '--'}
            variant="primary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Active Advisors"
            value={overview?.activeAdvisors ?? '--'}
            variant="secondary"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Total AUM"
            value={overview ? formatCurrency(overview.totalAUM) : '--'}
            variant="success"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Avg Clients/Advisor"
            value={overview?.avgClientsPerAdvisor?.toFixed(1) ?? '--'}
            variant="accent"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
        </div>

        {/* Controls Bar */}
        <div
          className="p-4 rounded-xl mb-6 flex flex-wrap items-center gap-4"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: colors.textTertiary }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-9 pl-10 pr-3 rounded-lg text-sm transition-all focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
              Sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="h-9 px-3 rounded-lg text-sm focus:outline-none"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                color: colors.textPrimary,
              }}
            >
              <option value="aum">AUM</option>
              <option value="clientCount">Clients</option>
              <option value="lastLoginAt">Activity</option>
            </select>
          </div>

          {/* Sort Direction Toggle */}
          <button
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            className="h-9 w-9 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
            style={{
              background: colors.chipBg,
              border: `1px solid ${colors.chipBorder}`,
            }}
            title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{
                color: colors.primary,
                transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none',
                transition: 'transform 200ms',
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
        </div>

        {/* Advisors Table */}
        <AdminCard padding="none">
          {/* Table Header Bar */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.chipBorder }}>
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              Financial Advisors
            </h2>
            <span className="text-sm" style={{ color: colors.textSecondary }}>
              {totalItems} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <AdminSpinner size="lg" />
            </div>
          ) : advisors.length === 0 ? (
            <AdminEmptyState
              title="No advisors found"
              description={search ? 'Try adjusting your search query.' : 'No financial advisors registered yet.'}
              icon={
                <svg className="w-7 h-7" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: `${colors.primary}08` }}>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Advisor
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Status
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Clients
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      AUM
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      30d Txns
                    </th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Last Login
                    </th>
                    <th className="text-center text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {advisors.map((advisor) => (
                    <tr
                      key={advisor.id}
                      className="transition-all"
                      style={{
                        background: 'transparent',
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.chipBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Advisor name + email */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {advisor.name || 'No Name'}
                        </p>
                        <p className="text-xs" style={{ color: colors.textTertiary }}>
                          {advisor.email}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <AdminChip
                          color={advisor.isActive ? colors.success : colors.error}
                          size="sm"
                        >
                          {advisor.isActive ? 'Active' : 'Inactive'}
                        </AdminChip>
                      </td>

                      {/* Clients */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {advisor.clientCount}
                        </span>
                      </td>

                      {/* AUM */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {formatCurrency(advisor.aum)}
                        </span>
                      </td>

                      {/* 30d Txns */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>
                          {advisor.txn30d}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>
                          {formatRelativeTime(advisor.lastLoginAt)}
                        </span>
                      </td>

                      {/* View Button */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/admin/advisors/${advisor.id}`)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:shadow-md hover:opacity-90"
                          style={{
                            background: colors.primary,
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {advisors.length > 0 && (
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setPage}
              onItemsPerPageChange={(newPerPage) => {
                setItemsPerPage(newPerPage)
                setPage(1)
              }}
              itemsPerPageOptions={[10, 25, 50]}
            />
          )}
        </AdminCard>
      </div>
    </AdminLayout>
  )
}

export default AdvisorsPage
