/**
 * Clients, Portfolio, Transactions, SIPs, Goals, Insurance, Notes, Tax API
 */
import { request, getAuthToken, API_BASE } from '../api'

// ============= FA Portal APIs =============
// Types for Client, Holding, Transaction, SIP are defined in @/utils/faTypes

// Generic paginated response type for FA APIs
export interface FAPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============= Clients API =============

export interface ClientFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  riskProfile?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const clientsApi = {
  list: <T = unknown>(params?: ClientFilterParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.riskProfile) query.append('riskProfile', params.riskProfile);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    const queryString = query.toString();
    return request<FAPaginatedResponse<T>>(`/api/v1/clients${queryString ? `?${queryString}` : ''}`);
  },

  getById: <T = unknown>(id: string) =>
    request<T>(`/api/v1/clients/${id}`),

  create: <T = unknown>(data: Record<string, unknown>) =>
    request<T>('/api/v1/clients', { method: 'POST', body: data }),

  update: <T = unknown>(id: string, data: Record<string, unknown>) =>
    request<T>(`/api/v1/clients/${id}`, { method: 'PUT', body: data }),

  deactivate: (id: string) =>
    request<void>(`/api/v1/clients/${id}`, { method: 'DELETE' }),
};

// ============= Portfolio API =============

export interface CreateHoldingDto {
  fundName: string;
  fundSchemeCode: string;
  fundCategory: string;
  assetClass: string;
  folioNumber?: string;
  units: number;
  avgNav: number;
}

export const portfolioApi = {
  getClientHoldings: <T = unknown>(clientId: string) =>
    request<T[]>(`/api/v1/portfolio/clients/${clientId}/holdings`),

  getPortfolioSummary: <T = unknown>(clientId: string) =>
    request<T>(`/api/v1/portfolio/clients/${clientId}/summary`),

  addHolding: <T = unknown>(clientId: string, data: CreateHoldingDto) =>
    request<T>(`/api/v1/portfolio/clients/${clientId}/holdings`, { method: 'POST', body: data }),

  updateHolding: <T = unknown>(id: string, data: Partial<CreateHoldingDto>) =>
    request<T>(`/api/v1/portfolio/holdings/${id}`, { method: 'PUT', body: data }),

  deleteHolding: (id: string) =>
    request<void>(`/api/v1/portfolio/holdings/${id}`, { method: 'DELETE' }),

  syncNavs: () =>
    request<{ synced: number }>('/api/v1/portfolio/holdings/sync-nav', { method: 'POST' }),

  getAssetAllocation: (clientId: string) =>
    request<{ assetClass: string; value: number; percentage: number; color: string }[]>(
      `/api/v1/portfolio/clients/${clientId}/allocation`,
    ),

  getPortfolioHistory: (clientId: string, period: string = '1Y') =>
    request<{ date: string; value: number; invested: number; dayChange: number; dayChangePct: number }[]>(
      `/api/v1/portfolio/clients/${clientId}/history?period=${period}`,
    ),
};

// ============= Transactions API =============

export interface TransactionFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const transactionsApi = {
  list: <T = unknown>(params?: TransactionFilterParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.dateFrom) query.append('fromDate', params.dateFrom);
    if (params?.dateTo) query.append('toDate', params.dateTo);
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return request<FAPaginatedResponse<T>>(`/api/v1/transactions${queryString ? `?${queryString}` : ''}`);
  },

  getByClient: <T = unknown>(clientId: string) =>
    request<T[]>(`/api/v1/transactions/clients/${clientId}`),

  getById: <T = unknown>(id: string) =>
    request<T>(`/api/v1/transactions/${id}`),

  createLumpsum: <T = unknown>(data: Record<string, unknown>) =>
    request<T>('/api/v1/transactions/lumpsum', { method: 'POST', body: data }),

  createRedemption: <T = unknown>(data: Record<string, unknown>) =>
    request<T>('/api/v1/transactions/redemption', { method: 'POST', body: data }),

  updateStatus: <T = unknown>(id: string, status: string) =>
    request<T>(`/api/v1/transactions/${id}/status`, { method: 'PUT', body: { status } }),

  cancel: (id: string) =>
    request<void>(`/api/v1/transactions/${id}/cancel`, { method: 'POST' }),

  executeViaBse: (id: string) =>
    request<{ success: boolean; message: string; bseOrderId: string }>(`/api/v1/transactions/${id}/execute-bse`, { method: 'POST' }),
};

// ============= SIPs API =============

export interface SipFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  search?: string;
}

export interface CreateSIPDto {
  clientId: string;
  fundName: string;
  fundSchemeCode: string;
  folioNumber?: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  sipDate: number;
  startDate: string;
  endDate?: string;
  isPerpetual?: boolean;
  stepUpPercent?: number;
  stepUpFrequency?: 'YEARLY' | 'HALF_YEARLY';
}

export interface UpdateSIPDto {
  amount?: number;
  sipDate?: number;
  endDate?: string;
  stepUpPercent?: number;
  stepUpFrequency?: 'YEARLY' | 'HALF_YEARLY';
}

export const sipsApi = {
  list: <T = unknown>(params?: SipFilterParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return request<FAPaginatedResponse<T>>(`/api/v1/sips${queryString ? `?${queryString}` : ''}`);
  },

  getByClient: <T = unknown>(clientId: string) =>
    request<T[]>(`/api/v1/sips/clients/${clientId}`),

  getById: <T = unknown>(id: string) =>
    request<T>(`/api/v1/sips/${id}`),

  create: <T = unknown>(data: CreateSIPDto) =>
    request<T>('/api/v1/sips', { method: 'POST', body: data }),

  update: <T = unknown>(id: string, data: UpdateSIPDto) =>
    request<T>(`/api/v1/sips/${id}`, { method: 'PUT', body: data }),

  pause: <T = unknown>(id: string) =>
    request<T>(`/api/v1/sips/${id}/pause`, { method: 'POST' }),

  resume: <T = unknown>(id: string) =>
    request<T>(`/api/v1/sips/${id}/resume`, { method: 'POST' }),

  cancel: (id: string) =>
    request<{ success: boolean }>(`/api/v1/sips/${id}/cancel`, { method: 'POST' }),

  registerWithBse: (id: string) =>
    request<{ success: boolean; message: string; bseOrderId: string }>(`/api/v1/sips/${id}/register-bse`, { method: 'POST' }),

  // SIP Analytics & Retry
  retry: (id: string) =>
    request<any>(`/api/v1/sips/${id}/retry`, { method: 'POST' }),

  getMonthlyCollectionReport: (months?: number) =>
    request<{ month: string; expected: number; actual: number }[]>(`/api/v1/sips/report/monthly-collection${months ? `?months=${months}` : ''}`),

  getBookGrowth: () =>
    request<{ month: string; newSips: number; totalAmount: number; cumulativeSips: number }[]>('/api/v1/sips/report/book-growth'),

  getMandateExpiryAlerts: () =>
    request<any[]>('/api/v1/sips/mandate-expiry-alerts'),
};

// ============= Goals API =============

export interface GoalFilterParams {
  clientId?: string;
}

export interface CreateGoalDto {
  name: string;
  category: string;
  icon?: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: string;
  monthlySip?: number;
  priority?: number;
  linkedFundCodes?: string[];
  notes?: string;
}

export interface UpdateGoalDto {
  name?: string;
  category?: string;
  icon?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  monthlySip?: number;
  status?: string;
  priority?: number;
  linkedFundCodes?: string[];
  notes?: string;
}

export interface AddContributionDto {
  amount: number;
  type: string;
  date: string;
  description?: string;
}

export interface GoalResponse {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlySip: number | null;
  status: string;
  priority: number;
  linkedFundCodes: string[];
  notes: string | null;
  progress: number;
  daysRemaining: number;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  clientName?: string;
}

export interface ContributionResponse {
  id: string;
  amount: number;
  type: string;
  date: string;
  description: string | null;
  createdAt: string;
}

export const goalsApi = {
  // Advisor-wide goals (for dashboard)
  list: () =>
    request<GoalResponse[]>('/api/v1/goals'),

  // Client-specific goals
  getByClient: (clientId: string) =>
    request<GoalResponse[]>(`/api/v1/clients/${clientId}/goals`),

  getById: (clientId: string, goalId: string) =>
    request<GoalResponse>(`/api/v1/clients/${clientId}/goals/${goalId}`),

  create: (clientId: string, data: CreateGoalDto) =>
    request<GoalResponse>(`/api/v1/clients/${clientId}/goals`, { method: 'POST', body: data }),

  update: (clientId: string, goalId: string, data: UpdateGoalDto) =>
    request<GoalResponse>(`/api/v1/clients/${clientId}/goals/${goalId}`, { method: 'PUT', body: data }),

  delete: (clientId: string, goalId: string) =>
    request<{ message: string }>(`/api/v1/clients/${clientId}/goals/${goalId}`, { method: 'DELETE' }),

  addContribution: (clientId: string, goalId: string, data: AddContributionDto) =>
    request<GoalResponse>(`/api/v1/clients/${clientId}/goals/${goalId}/contributions`, { method: 'POST', body: data }),

  getContributions: (clientId: string, goalId: string) =>
    request<ContributionResponse[]>(`/api/v1/clients/${clientId}/goals/${goalId}/contributions`),

  // Asset Mappings (Multi-Asset Planning)
  getAssetMappings: (clientId: string, goalId: string) =>
    request<any[]>(`/api/v1/clients/${clientId}/goals/${goalId}/assets`),

  addAssetMapping: (clientId: string, goalId: string, data: any) =>
    request<any>(`/api/v1/clients/${clientId}/goals/${goalId}/assets`, { method: 'POST', body: data }),

  updateAssetMapping: (clientId: string, goalId: string, mappingId: string, data: any) =>
    request<any>(`/api/v1/clients/${clientId}/goals/${goalId}/assets/${mappingId}`, { method: 'PUT', body: data }),

  removeAssetMapping: (clientId: string, goalId: string, mappingId: string) =>
    request<any>(`/api/v1/clients/${clientId}/goals/${goalId}/assets/${mappingId}`, { method: 'DELETE' }),

  getShortfall: (clientId: string, goalId: string) =>
    request<any>(`/api/v1/clients/${clientId}/goals/${goalId}/shortfall`),
};

// ============= Insurance API =============

export const insuranceApi = {
  list: (clientId: string) =>
    request(`/api/v1/clients/${clientId}/insurance`),

  create: (clientId: string, data: any) =>
    request(`/api/v1/clients/${clientId}/insurance`, { method: 'POST', body: data }),

  update: (clientId: string, policyId: string, data: any) =>
    request(`/api/v1/clients/${clientId}/insurance/${policyId}`, { method: 'PUT', body: data }),

  delete: (clientId: string, policyId: string) =>
    request<{ message: string }>(`/api/v1/clients/${clientId}/insurance/${policyId}`, { method: 'DELETE' }),

  gapAnalysis: (clientId: string, params?: { annualIncome?: number; age?: number; familySize?: number }) => {
    const query = new URLSearchParams();
    if (params?.annualIncome) query.append('annualIncome', params.annualIncome.toString());
    if (params?.age) query.append('age', params.age.toString());
    if (params?.familySize) query.append('familySize', params.familySize.toString());
    const queryString = query.toString();
    return request(`/api/v1/clients/${clientId}/insurance/gap-analysis${queryString ? `?${queryString}` : ''}`);
  },

  recordPayment: (clientId: string, policyId: string, data: any) =>
    request(`/api/v1/clients/${clientId}/insurance/${policyId}/payments`, { method: 'POST', body: data }),

  getPaymentHistory: (clientId: string, policyId: string) =>
    request(`/api/v1/clients/${clientId}/insurance/${policyId}/payments`),

  uploadDocument: async (clientId: string, policyId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}/api/v1/clients/${clientId}/insurance/${policyId}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    return response.json();
  },

  listDocuments: (clientId: string, policyId: string) =>
    request(`/api/v1/clients/${clientId}/insurance/${policyId}/documents`),

  getDocumentUrl: (clientId: string, policyId: string, docId: string) =>
    request<{ url: string; fileName: string; mimeType: string }>(`/api/v1/clients/${clientId}/insurance/${policyId}/documents/${docId}/download`),

  deleteDocument: (clientId: string, policyId: string, docId: string) =>
    request<{ message: string }>(`/api/v1/clients/${clientId}/insurance/${policyId}/documents/${docId}`, { method: 'DELETE' }),
};

// ============= Meeting Notes API =============

export interface MeetingNote {
  id: string;
  clientId?: string;
  prospectId?: string;
  title: string;
  content: string;
  meetingType: 'CALL' | 'IN_PERSON' | 'VIDEO' | 'EMAIL' | 'OTHER';
  meetingDate: string;
  createdAt?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  meetingType: string;
  meetingDate: string;
}

export const notesApi = {
  getByClient: (clientId: string) =>
    request<MeetingNote[]>(`/api/v1/clients/${clientId}/notes`),

  create: (clientId: string, data: CreateNoteRequest) =>
    request<MeetingNote>(`/api/v1/clients/${clientId}/notes`, {
      method: 'POST',
      body: data,
    }),

  delete: (clientId: string, noteId: string) =>
    request<void>(`/api/v1/clients/${clientId}/notes/${noteId}`, {
      method: 'DELETE',
    }),
};

// ============= Client extensions API =============

export const clientExtApi = {
  assignRm: (clientId: string, assignedRmId: string | null) =>
    request<{ id: string; assignedRmId: string }>(`/api/v1/clients/${clientId}/assign-rm`, { method: 'PUT', body: { assignedRmId } }),
  updateTags: (clientId: string, tags: string[]) =>
    request<{ id: string; tags: string[] }>(`/api/v1/clients/${clientId}/tags`, { method: 'PUT', body: { tags } }),
  getDormantClients: () =>
    request<Array<{ id: string; name: string; email: string; aum: number; lastTransactionDate: string; daysSinceLastTxn: number }>>('/api/v1/clients/dormant'),
};

// ============= FA Tax API (Capital Gains) =============

export const faTaxApi = {
  getCapitalGains: (clientId: string, fy?: string) =>
    request<any>(`/api/v1/clients/${clientId}/taxes/capital-gains${fy ? `?fy=${fy}` : ''}`),

  getTaxSummary: (clientId: string, fy?: string) =>
    request<any>(`/api/v1/clients/${clientId}/taxes/summary${fy ? `?fy=${fy}` : ''}`),

  downloadCsv: (clientId: string, fy?: string) =>
    `/api/v1/clients/${clientId}/taxes/capital-gains/csv${fy ? `?fy=${fy}` : ''}`,
};
