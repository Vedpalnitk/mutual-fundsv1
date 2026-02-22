/**
 * Analysis API — Saved Analysis, Whitelisted Funds (My Picks)
 */
import { request, getAuthToken, API_BASE } from '../api'
import type { SavedAnalysisSummary, AnalysisVersionDetail } from '@/utils/faTypes'

// Re-export the types so consumers importing from this file have access
export type { SavedAnalysisSummary, AnalysisVersionDetail }

// ============= Saved Analysis API =============

export const savedAnalysisApi = {
  save: (data: {
    title: string;
    clientId: string;
    personaData: any;
    riskData: any;
    rebalancingData: any;
    editNotes?: string;
  }) =>
    request<SavedAnalysisSummary>('/api/v1/advisor/analyses', {
      method: 'POST',
      body: data,
    }),

  list: (clientId?: string) =>
    request<SavedAnalysisSummary[]>(
      `/api/v1/advisor/analyses${clientId ? `?clientId=${clientId}` : ''}`,
    ),

  get: (id: string) =>
    request<SavedAnalysisSummary>(`/api/v1/advisor/analyses/${id}`),

  getVersion: (id: string, v: number) =>
    request<AnalysisVersionDetail>(`/api/v1/advisor/analyses/${id}/versions/${v}`),

  createVersion: (id: string, data: { rebalancingData: any; editNotes?: string }) =>
    request<AnalysisVersionDetail>(`/api/v1/advisor/analyses/${id}/versions`, {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: { title?: string; status?: string }) =>
    request<SavedAnalysisSummary>(`/api/v1/advisor/analyses/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  delete: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/advisor/analyses/${id}`, {
      method: 'DELETE',
    }),

  downloadPdf: async (id: string, v: number) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/advisor/analyses/${id}/versions/${v}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('PDF download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-v${v}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// ============= Whitelisted Funds (My Picks) API =============

export interface WhitelistedFund {
  id: string;
  schemeCode: number;
  schemeName: string;
  schemeCategory?: string;
  nav?: number;
  returns1y?: number;
  returns3y?: number;
  returns5y?: number;
  riskRating?: number;
  fundRating?: number;
  aum?: number;
  year: number;
  notes?: string;
  addedAt: string;
}

export interface AddToWhitelistRequest {
  schemeCode: number;
  year: number;
  notes?: string;
}

export const whitelistApi = {
  getAll: () =>
    request<WhitelistedFund[]>('/api/v1/advisor/whitelist'),

  add: (data: AddToWhitelistRequest) =>
    request<WhitelistedFund>('/api/v1/advisor/whitelist', {
      method: 'POST',
      body: data,
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/advisor/whitelist/${id}`, {
      method: 'DELETE',
    }),
};
