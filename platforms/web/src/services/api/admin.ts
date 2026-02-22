/**
 * Admin API — Batch Jobs, Audit Logs, Advisors, Transactions, Analytics,
 * Exchange Health, Settings, Export
 */
import { request } from '../api'

// ============= Types =============

export interface BatchJobLatestRun {
  id: number
  status: 'started' | 'completed' | 'failed'
  recordsTotal: number | null
  recordsSynced: number | null
  recordsFailed: number | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
}

export interface BatchJobStats24h {
  total: number
  completed: number
  failed: number
}

export interface BatchJobDefinition {
  id: string
  name: string
  group: string
  schedule: string
  cronExpression: string
  manualTrigger: boolean
  latestRun: BatchJobLatestRun | null
  stats24h: BatchJobStats24h
}

export interface BatchJobsListResponse {
  jobs: BatchJobDefinition[]
  summary: {
    totalJobs: number
    totalRuns24h: number
    totalFailed24h: number
    successRate: number
  }
}

export interface BatchJobRun {
  id: number
  syncType: string
  status: string
  recordsTotal: number | null
  recordsSynced: number | null
  recordsFailed: number | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
}

export interface BatchJobRunsResponse {
  runs: BatchJobRun[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============= API =============

export const adminBatchJobsApi = {
  list: () =>
    request<BatchJobsListResponse>('/api/v1/admin/batch-jobs'),

  getRuns: (jobId: string, page = 1, limit = 10) =>
    request<BatchJobRunsResponse>(`/api/v1/admin/batch-jobs/${jobId}/runs?page=${page}&limit=${limit}`),

  trigger: (jobId: string) =>
    request<{ message: string }>(`/api/v1/admin/batch-jobs/${jobId}/trigger`, {
      method: 'POST',
    }),
}

// ============= Pagination =============

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============= Audit Log Types =============

export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string | null
  details: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; email: string; profile: { name: string } | null }
}

export interface AuditLogStats {
  totalLogs: number
  todayActivity: number
  uniqueUsersToday: number
  topAction: string
}

export const adminAuditLogsApi = {
  list: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
    return request<PaginatedResponse<AuditLogEntry>>(`/api/v1/admin/audit-logs${qs}`)
  },
  getStats: () => request<AuditLogStats>('/api/v1/admin/audit-logs/stats'),
}

// ============= Advisor Types =============

export interface AdvisorOverviewKPIs {
  totalAdvisors: number
  activeAdvisors: number
  totalAUM: number
  avgClientsPerAdvisor: number
}

export interface AdminAdvisorRow {
  id: string
  email: string
  name: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  clientCount: number
  aum: number
  txn30d: number
}

export interface AdminAdvisorDetail {
  id: string
  email: string
  name: string
  city: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  totalAUM: number
  clientCount: number
  clients: {
    id: string
    name: string
    email: string
    status: string
    createdAt: string
    aum: number
  }[]
  recentTransactions: {
    id: string
    fundName: string
    type: string
    amount: number
    status: string
    date: string
  }[]
}

export const adminAdvisorsApi = {
  getOverview: () => request<AdvisorOverviewKPIs>('/api/v1/admin/advisors/overview'),
  list: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
    return request<PaginatedResponse<AdminAdvisorRow>>(`/api/v1/admin/advisors${qs}`)
  },
  getOne: (id: string) => request<AdminAdvisorDetail>(`/api/v1/admin/advisors/${id}`),
}

// ============= Transaction Types =============

export interface TransactionOverviewKPIs {
  totalTransactions: number
  totalVolume: number
  pendingCount: number
  failedCount: number
  avgProcessingTime: string
  successRate: number
}

export interface AdminTransaction {
  id: string
  source: 'BSE' | 'NSE' | 'MANUAL'
  type: string
  schemeName: string | null
  advisorId: string | null
  clientId: string
  amount: number | null
  status: string
  errorMessage: string | null
  createdAt: string
}

export const adminTransactionsApi = {
  getOverview: () => request<TransactionOverviewKPIs>('/api/v1/admin/transactions/overview'),
  list: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
    return request<PaginatedResponse<AdminTransaction>>(`/api/v1/admin/transactions${qs}`)
  },
  getFailed: () => request<{ data: AdminTransaction[] }>('/api/v1/admin/transactions/failed'),
}

// ============= Analytics Types =============

export interface AnalyticsOverview {
  totalUsers: number
  activeUsers: number
  totalAdvisors: number
  totalAUM: number
  totalTransactions: number
  totalVolume: number
  newUsersThisMonth: number
  growthRate: string
}

export interface AnalyticsTrend {
  date: string
  count: number
}

export interface AnalyticsDistribution {
  userDistribution: { label: string; value: number }[]
  transactionDistribution: { label: string; value: number }[]
}

export const adminAnalyticsApi = {
  getOverview: () => request<AnalyticsOverview>('/api/v1/admin/analytics/overview'),
  getTrends: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<AnalyticsTrend[]>(`/api/v1/admin/analytics/trends${qs}`)
  },
  getDistribution: () => request<AnalyticsDistribution>('/api/v1/admin/analytics/distribution'),
}

// ============= Exchange Health Types =============

export interface ExchangeHealthEndpoint {
  name: string
  status: string
  avgResponseTime: number
  lastChecked: string
}

export interface ExchangeHealthStatus {
  exchange: string
  status: 'healthy' | 'degraded' | 'down'
  ordersToday: number
  failedToday: number
  successRate: number
  avgResponseTime: number
  uptime24h: number
  lastSuccessfulOrder: string | null
  endpoints: ExchangeHealthEndpoint[]
}

export interface CombinedExchangeHealth {
  overallStatus: 'healthy' | 'degraded' | 'down'
  bse: ExchangeHealthStatus
  nse: ExchangeHealthStatus
}

export const adminExchangeHealthApi = {
  getCombined: () => request<CombinedExchangeHealth>('/api/v1/admin/exchange-health'),
  getBse: () => request<ExchangeHealthStatus>('/api/v1/admin/exchange-health/bse'),
  getNse: () => request<ExchangeHealthStatus>('/api/v1/admin/exchange-health/nse'),
}

// ============= System Settings Types =============

export interface SystemSetting {
  key: string
  value: any
  updatedBy: string | null
  updatedAt: string
  createdAt: string
}

export const adminSettingsApi = {
  list: () => request<SystemSetting[]>('/api/v1/admin/settings'),
  getOne: (key: string) => request<SystemSetting>(`/api/v1/admin/settings/${key}`),
  update: (key: string, value: any) =>
    request<SystemSetting>(`/api/v1/admin/settings/${key}`, {
      method: 'PUT',
      body: { value },
    }),
}

// ============= Export API =============

export const adminExportApi = {
  exportUsers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return `/api/v1/admin/export/users${qs}`
  },
  exportAuditLogs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return `/api/v1/admin/export/audit-logs${qs}`
  },
  exportTransactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return `/api/v1/admin/export/transactions${qs}`
  },
  exportAdvisors: () => '/api/v1/admin/export/advisors',
}
