/**
 * Business API — Staff, Team, Branches, Compliance, BI, Commissions
 */
import { request, requestUpload, requestUploadWithFields } from '../api'

// ============= Staff API =============

export interface StaffMember {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  allowedPages: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStaffRequest {
  displayName: string;
  email: string;
  password: string;
  phone?: string;
  allowedPages: string[];
}

export interface UpdateStaffRequest {
  displayName?: string;
  allowedPages?: string[];
  isActive?: boolean;
}

export const staffApi = {
  list: () => request<StaffMember[]>('/api/v1/staff'),

  getById: (id: string) => request<StaffMember>(`/api/v1/staff/${id}`),

  create: (data: CreateStaffRequest) =>
    request<StaffMember>('/api/v1/staff', { method: 'POST', body: data }),

  update: (id: string, data: UpdateStaffRequest) =>
    request<StaffMember>(`/api/v1/staff/${id}`, { method: 'PUT', body: data }),

  deactivate: (id: string) =>
    request<StaffMember>(`/api/v1/staff/${id}`, { method: 'DELETE' }),
};

// ============= Team (Staff extensions) API =============

export const teamApi = {
  getEuinExpiry: () =>
    request<Array<{ id: string; displayName: string; email: string; euin: string; euinExpiry: string; branchName: string; daysUntilExpiry: number }>>('/api/v1/staff/euin-expiry'),
  getStaffClients: (staffId: string) =>
    request<Array<{ id: string; name: string; email: string; aum: number; sipCount: number; status: string }>>(`/api/v1/staff/${staffId}/clients`),
  reassignClients: (staffId: string, targetStaffId: string) =>
    request<{ reassignedCount: number }>(`/api/v1/staff/${staffId}/reassign-clients`, { method: 'POST', body: { targetStaffId } }),
  assignBranch: (staffId: string, branchId: string) =>
    request<{ id: string; branchId: string }>(`/api/v1/staff/${staffId}/assign-branch`, { method: 'PUT', body: { branchId } }),
};

// ============= Branches API =============

export interface Branch {
  id: string;
  name: string;
  city?: string;
  code?: string;
  isActive: boolean;
  staffCount: number;
  staff: Array<{ id: string; displayName: string; staffRole: string }>;
  createdAt: string;
  updatedAt: string;
}

export const branchesApi = {
  list: () =>
    request<Branch[]>('/api/v1/branches'),

  get: (id: string) =>
    request<Branch>(`/api/v1/branches/${id}`),

  create: (data: { name: string; city?: string; code?: string }) =>
    request<Branch>('/api/v1/branches', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: { name?: string; city?: string; code?: string; isActive?: boolean }) =>
    request<Branch>(`/api/v1/branches/${id}`, {
      method: 'PUT',
      body: data,
    }),

  remove: (id: string) =>
    request<{ success: boolean }>(`/api/v1/branches/${id}`, {
      method: 'DELETE',
    }),
};

// ============= Compliance API =============

export interface ComplianceRecordData {
  id: string; type: string; entityId: string | null; entityName: string | null
  expiryDate: string; status: string; documentUrl: string | null
  notes: string | null; daysUntilExpiry: number; createdAt: string
}

export interface ComplianceDashboard {
  total: number; valid: number; expiringSoon: number; expired: number
  byType: Record<string, { valid: number; expiringSoon: number; expired: number }>
  upcoming: ComplianceRecordData[]
}

export interface RiskCheckResult {
  clientId: string; clientName: string; kycStatus: string
  suitability: string; issueCount: number; issues: string[]
}

export const complianceApi = {
  listRecords: (filters?: { type?: string; status?: string }) => {
    const params = new URLSearchParams()
    if (filters?.type) params.set('type', filters.type)
    if (filters?.status) params.set('status', filters.status)
    const qs = params.toString()
    return request<ComplianceRecordData[]>(`/api/v1/compliance/records${qs ? `?${qs}` : ''}`)
  },
  createRecord: (data: { type: string; entityId?: string; entityName?: string; expiryDate: string; documentUrl?: string; notes?: string }) =>
    request<ComplianceRecordData>('/api/v1/compliance/records', { method: 'POST', body: data }),
  updateRecord: (id: string, data: { expiryDate?: string; status?: string; documentUrl?: string; notes?: string }) =>
    request<ComplianceRecordData>(`/api/v1/compliance/records/${id}`, { method: 'PUT', body: data }),
  getDashboard: () =>
    request<ComplianceDashboard>('/api/v1/compliance/dashboard'),
  riskCheck: (clientId: string) =>
    request<RiskCheckResult>(`/api/v1/compliance/risk-check/${clientId}`),
};

// ============= Business Intelligence API =============

export interface AumOverview {
  totalAum: number; equityAum: number; debtAum: number; hybridAum: number; otherAum: number
  byCategory: Record<string, number>
}

export interface AumSnapshot {
  date: string; totalAum: number; equityAum: number; debtAum: number; hybridAum: number
  clientCount: number; sipBookSize: number; netFlows: number
}

export interface NetFlowPeriod {
  period: string; purchases: number; redemptions: number; net: number
}

export interface SipHealth {
  total: number; active: number; paused: number; cancelled: number
  totalMonthlyAmount: number; mandateExpiringCount: number
}

export interface RevenueProjection {
  currentAum: number; avgTrailRate: number; currentMonthlyTrail: number; annual12MProjection: number
  projections: Array<{ period: string; projectedAum: number; projectedTrail: number }>
}

export interface ClientConcentration {
  totalAum: number; topN: number; topNAum: number; concentrationPercent: number
  clients: Array<{ id: string; name: string; aum: number; rank: number; percentOfTotal: number; cumulativePercent: number }>
}

export interface MonthlyScorecardDelta {
  current: number; previous: number; delta: number; deltaPercent?: number
}

export interface MonthlyScorecard {
  period: string; prevPeriod: string
  aum: MonthlyScorecardDelta & { deltaPercent: number }
  netFlows: { current: number; previous: number; delta: number }
  sipBook: MonthlyScorecardDelta & { deltaPercent: number }
  clientCount: MonthlyScorecardDelta & { deltaPercent: number }
  newClients: number; lostClients: number
}

export interface RevenueAttributionAmc {
  amcName: string; aumAmount: number; trailRate: number
  estimatedTrail: number; holdingsCount: number; percentOfTotal: number
}

export interface RevenueAttribution {
  totalTrailIncome: number
  byAmc: RevenueAttributionAmc[]
}

export interface ClientTier {
  tier: string; clientCount: number; totalAum: number
  avgAum: number; percentOfAum: number
  clients: Array<{ id: string; name: string; aum: number }>
}

export interface ClientSegmentation {
  tiers: ClientTier[]
  totalAum: number; totalClients: number
}

export const biApi = {
  getAumOverview: () =>
    request<AumOverview>('/api/v1/bi/aum'),
  getAumByBranch: () =>
    request<Array<{ name: string; aum: number; clientCount: number }>>('/api/v1/bi/aum/by-branch'),
  getAumByRm: () =>
    request<Array<{ id: string; name: string; aum: number; clientCount: number }>>('/api/v1/bi/aum/by-rm'),
  getAumByClient: (topN = 20) =>
    request<Array<{ id: string; name: string; aum: number; holdingsCount: number }>>(`/api/v1/bi/aum/by-client?topN=${topN}`),
  getAumSnapshots: (days = 90) =>
    request<AumSnapshot[]>(`/api/v1/bi/aum/snapshots?days=${days}`),
  getNetFlows: (months = 6) =>
    request<NetFlowPeriod[]>(`/api/v1/bi/net-flows?months=${months}`),
  getSipHealth: () =>
    request<SipHealth>('/api/v1/bi/sip-health'),
  getRevenueProjection: () =>
    request<RevenueProjection>('/api/v1/bi/revenue-projection'),
  getClientConcentration: (topN = 10) =>
    request<ClientConcentration>(`/api/v1/bi/client-concentration?topN=${topN}`),
  getDormantClients: () =>
    request<Array<{ id: string; name: string; email: string; aum: number; lastTransactionDate: string; daysSinceLastTxn: number }>>('/api/v1/bi/dormant-clients'),
  triggerSnapshot: () =>
    request<{ success: boolean; date: string }>('/api/v1/bi/snapshot', { method: 'POST' }),
  getMonthlyScorecard: () =>
    request<MonthlyScorecard>('/api/v1/bi/monthly-scorecard'),
  getRevenueAttribution: () =>
    request<RevenueAttribution>('/api/v1/bi/revenue-attribution'),
  getClientSegmentation: () =>
    request<ClientSegmentation>('/api/v1/bi/client-segmentation'),
};

// ============= Commissions API =============

export interface CommissionRate {
  id: string; amcId: string; amcName: string; amcShortName: string | null
  schemeCategory: string; trailRatePercent: number; upfrontRatePercent: number
  effectiveFrom: string; effectiveTo: string | null
}

export interface CommissionRecord {
  id: string; period: string; amcId: string; amcName: string; amcShortName: string | null
  aumAmount: number; expectedTrail: number; actualTrail: number
  difference: number; status: string
  arnNumber: string | null; reconciledAt: string | null; reconciledBy: string | null
}

export interface BrokerageUploadResult {
  id: string; fileName: string; source: string; recordCount: number
  status: string; totalBrokerage: number; amcBreakdown: Record<string, number>
  arnNumber: string | null; granularity: string; detectedArn: string | null; lineItemCount: number
}

export interface BrokerageUploadHistory {
  id: string; fileName: string; source: string; recordCount: number
  status: string; errorMessage: string | null; totalBrokerage: number; createdAt: string
  arnNumber: string | null
}

export interface BrokerageLineItem {
  id: string; uploadId: string; amcName: string; schemeName: string | null
  schemeCode: string | null; isin: string | null; folioNo: string | null
  investorName: string | null; transactionType: string | null
  aum: number; grossCommission: number; tds: number; netCommission: number
  euin: string | null; arnNumber: string | null
}

export interface ArnCommissionSummary {
  arnNumber: string; label: string | null
  totalAum: number; expectedTrail: number; actualTrail: number
  reconciledCount: number; discrepancyCount: number; pendingCount: number
}

export const commissionsApi = {
  // Rate Master
  listRates: () =>
    request<CommissionRate[]>('/api/v1/commissions/rates'),
  createRate: (data: { amcId: string; schemeCategory: string; trailRatePercent: number; upfrontRatePercent?: number; effectiveFrom: string; effectiveTo?: string }) =>
    request<CommissionRate>('/api/v1/commissions/rates', { method: 'POST', body: data }),
  updateRate: (id: string, data: { trailRatePercent?: number; upfrontRatePercent?: number; effectiveFrom?: string; effectiveTo?: string }) =>
    request<CommissionRate>(`/api/v1/commissions/rates/${id}`, { method: 'PUT', body: data }),
  deleteRate: (id: string) =>
    request<{ success: boolean }>(`/api/v1/commissions/rates/${id}`, { method: 'DELETE' }),

  // Expected Calculation
  calculateExpected: (period: string, arnNumber?: string) =>
    request<{ period: string; arnNumber: string | null; recordCount: number; totalExpectedTrail: number }>('/api/v1/commissions/calculate-expected', { method: 'POST', body: { period, arnNumber } }),

  // Upload
  uploadBrokerage: (file: File, arnNumber?: string) => {
    if (arnNumber) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('arnNumber', arnNumber)
      return requestUploadWithFields<BrokerageUploadResult>('/api/v1/commissions/upload', formData)
    }
    return requestUpload<BrokerageUploadResult>('/api/v1/commissions/upload', file)
  },
  listUploads: () =>
    request<BrokerageUploadHistory[]>('/api/v1/commissions/uploads'),

  // Line Items
  getUploadLineItems: (uploadId: string, filters?: { amcName?: string; arnNumber?: string }) => {
    const params = new URLSearchParams()
    if (filters?.amcName) params.set('amcName', filters.amcName)
    if (filters?.arnNumber) params.set('arnNumber', filters.arnNumber)
    const qs = params.toString()
    return request<BrokerageLineItem[]>(`/api/v1/commissions/uploads/${uploadId}/line-items${qs ? `?${qs}` : ''}`)
  },
  getRecordLineItems: (recordId: string) =>
    request<BrokerageLineItem[]>(`/api/v1/commissions/records/${recordId}/line-items`),

  // Reconciliation
  reconcile: (period: string, arnNumber?: string) =>
    request<{ period: string; arnNumber: string | null; totalRecords: number; matched: number; discrepancies: number; records: CommissionRecord[] }>('/api/v1/commissions/reconcile', { method: 'POST', body: { period, arnNumber } }),

  reconcileAndCompute: (period: string, arnNumber?: string) =>
    request<{
      reconciliation: { period: string; arnNumber: string | null; totalRecords: number; matched: number; discrepancies: number }
      euinPayouts: { computed: number; message?: string }
    }>('/api/v1/commissions/reconcile-and-compute', { method: 'POST', body: { period, arnNumber } }),

  // Records
  listRecords: (filters?: { period?: string; amcId?: string; status?: string; arnNumber?: string }) => {
    const params = new URLSearchParams()
    if (filters?.period) params.set('period', filters.period)
    if (filters?.amcId) params.set('amcId', filters.amcId)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.arnNumber) params.set('arnNumber', filters.arnNumber)
    const qs = params.toString()
    return request<CommissionRecord[]>(`/api/v1/commissions/records${qs ? `?${qs}` : ''}`)
  },
  getDiscrepancies: () =>
    request<CommissionRecord[]>('/api/v1/commissions/discrepancies'),

  // ARN Summary
  getSummaryByArn: () =>
    request<ArnCommissionSummary[]>('/api/v1/commissions/summary/by-arn'),
};

// ============= Organization (Multi-ARN) API =============

export interface OrganizationArn {
  id: string
  arnNumber: string
  label: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export interface OrgDashboard {
  totalAum: number
  totalClients: number
  totalTeamMembers: number
  activeArns: number
  aumByArn: Array<{ arnNumber: string; label: string; aum: number }>
  teamPerformance: Array<{ staffId: string; displayName: string; euin: string | null; clientCount: number; aum: number }>
  commissionSummary: { currentPeriodTotal: number; ytdTotal: number }
}

export const organizationApi = {
  listArns: () =>
    request<OrganizationArn[]>('/api/v1/organization/arns'),
  addArn: (data: { arnNumber: string; label?: string }) =>
    request<OrganizationArn>('/api/v1/organization/arns', { method: 'POST', body: data }),
  updateArn: (id: string, data: { label?: string; isDefault?: boolean; isActive?: boolean }) =>
    request<OrganizationArn>(`/api/v1/organization/arns/${id}`, { method: 'PUT', body: data }),
  deleteArn: (id: string) =>
    request<void>(`/api/v1/organization/arns/${id}`, { method: 'DELETE' }),
  getDashboard: () =>
    request<OrgDashboard>('/api/v1/organization/dashboard'),
};

// ============= EUIN Commission API =============

export interface EuinCommissionSplit {
  id: string
  staffMemberId: string
  staffName: string
  euin: string | null
  splitPercent: number
  effectiveFrom: string
  effectiveTo: string | null
}

export interface EuinCommissionPayout {
  id: string
  staffMemberId: string
  staffName: string
  euin: string
  period: string
  grossCommission: number
  splitPercent: number
  payoutAmount: number
  status: string
  paidAt: string | null
  createdAt: string
}

export interface EuinCommissionSummary {
  totalPayable: number
  totalPaid: number
  pendingApproval: number
  disputed: number
  byEuin: Array<{ euin: string; staffName: string; total: number }>
}

export const euinCommissionApi = {
  // Splits
  listSplits: () =>
    request<EuinCommissionSplit[]>('/api/v1/euin-commission/splits'),
  createSplit: (data: { staffMemberId: string; splitPercent: number; effectiveFrom: string; effectiveTo?: string }) =>
    request<EuinCommissionSplit>('/api/v1/euin-commission/splits', { method: 'POST', body: data }),
  updateSplit: (id: string, data: { splitPercent?: number; effectiveFrom?: string; effectiveTo?: string }) =>
    request<EuinCommissionSplit>(`/api/v1/euin-commission/splits/${id}`, { method: 'PUT', body: data }),
  deleteSplit: (id: string) =>
    request<void>(`/api/v1/euin-commission/splits/${id}`, { method: 'DELETE' }),

  // Compute
  computePayouts: (period: string) =>
    request<{ computed: number; message?: string }>('/api/v1/euin-commission/compute', { method: 'POST', body: { period } }),

  // Payouts
  listPayouts: (filters?: { period?: string; staffMemberId?: string; status?: string }) => {
    const params = new URLSearchParams()
    if (filters?.period) params.set('period', filters.period)
    if (filters?.staffMemberId) params.set('staffMemberId', filters.staffMemberId)
    if (filters?.status) params.set('status', filters.status)
    const qs = params.toString()
    return request<EuinCommissionPayout[]>(`/api/v1/euin-commission/payouts${qs ? `?${qs}` : ''}`)
  },
  approvePayout: (id: string) =>
    request<EuinCommissionPayout>(`/api/v1/euin-commission/payouts/${id}/approve`, { method: 'POST' }),
  markPaid: (id: string) =>
    request<EuinCommissionPayout>(`/api/v1/euin-commission/payouts/${id}/mark-paid`, { method: 'POST' }),
  disputePayout: (id: string) =>
    request<EuinCommissionPayout>(`/api/v1/euin-commission/payouts/${id}/dispute`, { method: 'POST' }),

  // Summary
  getSummary: () =>
    request<EuinCommissionSummary>('/api/v1/euin-commission/summary'),
};

// ============= Staff Performance API =============

export interface StaffPerformance {
  staffId: string
  displayName: string
  euin: string | null
  clientCount: number
  aum: number
  transactionCount30d: number
  commissionEarned: number
}

export const staffPerformanceApi = {
  get: (staffId: string) =>
    request<StaffPerformance>(`/api/v1/staff/${staffId}/performance`),
};
