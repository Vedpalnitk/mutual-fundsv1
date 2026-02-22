/**
 * Marketing API — CAS Import, Rebalancing Execution, Marketing Templates
 */
import { request, getAuthToken, API_BASE } from '../api'

// ============= CAS Import API =============

export interface CASImportResult {
  id: string;
  status: string;
  context: string;
  investorName?: string;
  investorEmail?: string;
  foliosImported: number;
  schemesImported: number;
  totalValue?: number;
  createdAt: string;
  errorMessage?: string;
}

export interface CASImportRecord {
  id: string;
  userId: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  context: string;
  investorName?: string;
  investorEmail?: string;
  casType?: string;
  fileType?: string;
  periodFrom?: string;
  periodTo?: string;
  foliosImported: number;
  schemesImported: number;
  totalValue?: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

export const casApi = {
  importCAS: async (file: File, password: string, clientId?: string): Promise<CASImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    if (clientId) formData.append('clientId', clientId);

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/v1/cas/import`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `Import failed: ${res.status}`);
    }

    return res.json();
  },
  getImports: (clientId?: string) =>
    request<CASImportRecord[]>(clientId ? `/api/v1/cas/imports/${clientId}` : '/api/v1/cas/imports'),
};

// ============= Rebalancing Execution API =============

export const rebalancingApi = {
  execute: (data: {
    clientId: string;
    actions: { schemeCode: string; action: string; transactionAmount: number; toSchemeCode?: string; folioNumber?: string; schemeName: string; assetClass: string }[];
    exchange: 'BSE' | 'NSE';
    analysisId?: string;
  }) =>
    request<{ results: any[]; successCount: number; failedCount: number; totalActions: number }>(
      '/api/v1/advisor/rebalancing/execute',
      { method: 'POST', body: data },
    ),
};

// ============= Marketing API =============

export const marketingApi = {
  listTemplates: () =>
    request<{ id: string; category: string; name: string; description: string }[]>('/api/v1/marketing/templates'),

  renderPreview: (templateId: string, customFields?: Record<string, string>) =>
    request<{ html: string }>('/api/v1/marketing/preview', { method: 'POST', body: { templateId, customFields } }),

  generateImageUrl: (templateId: string, customFields?: Record<string, string>) =>
    '/api/v1/marketing/generate-image',

  generateImage: (templateId: string, customFields?: Record<string, string>) =>
    request<Blob>('/api/v1/marketing/generate-image', {
      method: 'POST',
      body: { templateId, customFields },
    }),
};
