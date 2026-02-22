/**
 * CRM API — CRM Tasks/Activities, Prospects/Pipeline, Communications
 */
import { request } from '../api'
import type { FAPaginatedResponse } from './clients'

// Re-export so consumers importing from this file have access
export type { FAPaginatedResponse }

// ============= Communications API =============

export interface CommunicationTemplate {
  type: string;
  label: string;
  description: string;
}

export interface CommunicationPreview {
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
}

export interface CommunicationLog {
  id: string;
  advisorId: string;
  clientId: string;
  channel: string;
  type: string;
  subject: string | null;
  body: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface CommunicationStats {
  totalSent: number;
  emailCount: number;
  whatsappCount: number;
  thisMonthCount: number;
}

export const communicationsApi = {
  getTemplates: () =>
    request<CommunicationTemplate[]>('/api/v1/communications/templates'),

  preview: (data: { clientId: string; type: string; contextData?: Record<string, any>; customSubject?: string; customBody?: string }) =>
    request<CommunicationPreview>('/api/v1/communications/preview', { method: 'POST', body: data }),

  send: (data: { clientId: string; channel: string; type: string; subject: string; body: string; metadata?: Record<string, any> }) =>
    request<{ success: boolean; logId: string; waLink?: string; error?: string }>('/api/v1/communications/send', { method: 'POST', body: data }),

  getHistory: (params?: { clientId?: string; channel?: string; type?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.channel) query.append('channel', params.channel);
    if (params?.type) query.append('type', params.type);
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return request<FAPaginatedResponse<CommunicationLog>>(`/api/v1/communications/history${queryString ? `?${queryString}` : ''}`);
  },

  getStats: () =>
    request<CommunicationStats>('/api/v1/communications/history/stats'),

  sendBulk: (data: { clientIds: string[]; channel: string; type: string; subject: string; customBody?: string; metadata?: Record<string, any> }) =>
    request<{ total: number; sent: number; failed: number; results: { clientId: string; clientName: string; success: boolean; error?: string; logId?: string; waLink?: string }[] }>('/api/v1/communications/send-bulk', { method: 'POST', body: data }),
};

// ============= CRM API =============

export interface CRMTask {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  assignedToId?: string;
  assignedToName?: string;
  dueDate?: string;
  priority: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CRMTaskSummary {
  total: number;
  open: number;
  inProgress: number;
  overdue: number;
  completedThisMonth: number;
}

export interface CRMActivity {
  id: string;
  type: string;
  summary: string;
  details?: string;
  clientId?: string;
  clientName?: string;
  staffId?: string;
  staffName?: string;
  createdAt: string;
}

export const crmApi = {
  listTasks: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<CRMTask[]>(`/api/v1/crm/tasks${query}`);
  },
  createTask: (data: { title: string; description?: string; clientId?: string; assignedToId?: string; dueDate?: string; priority?: string; category?: string }) =>
    request<CRMTask>('/api/v1/crm/tasks', { method: 'POST', body: data }),
  updateTask: (id: string, data: Partial<CRMTask>) =>
    request<CRMTask>(`/api/v1/crm/tasks/${id}`, { method: 'PUT', body: data }),
  completeTask: (id: string) =>
    request<{ id: string; status: string }>(`/api/v1/crm/tasks/${id}/complete`, { method: 'PUT' }),
  getOverdueTasks: () =>
    request<CRMTask[]>('/api/v1/crm/tasks/overdue'),
  getTaskSummary: () =>
    request<CRMTaskSummary>('/api/v1/crm/tasks/summary'),
  listActivities: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<CRMActivity[]>(`/api/v1/crm/activities${query}`);
  },
  createActivity: (data: { type: string; summary: string; details?: string; clientId?: string }) =>
    request<CRMActivity>('/api/v1/crm/activities', { method: 'POST', body: data }),
};

// ============= Prospects / Pipeline API =============

export interface ProspectResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  potentialAum: number;
  stage: string;
  source: string;
  notes: string | null;
  referredBy: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  convertedClientId: string | null;
  createdAt: string;
  updatedAt: string;
  meetingNotes: Array<{
    id: string;
    title: string;
    content: string;
    meetingType: string;
    meetingDate: string;
    createdAt: string;
  }>;
}

export interface ProspectStats {
  total: number;
  byStage: Record<string, number>;
  activeCount: number;
  pipelineValue: number;
  wonCount: number;
  wonValue: number;
  conversionRate: number;
}

export const prospectApi = {
  list: (params?: { stage?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString() : '';
    return request<ProspectResponse[]>(`/api/v1/prospects${query}`);
  },
  getById: (id: string) =>
    request<ProspectResponse>(`/api/v1/prospects/${id}`),
  create: (data: { name: string; email: string; phone: string; potentialAum?: number; source?: string; notes?: string; referredBy?: string; nextAction?: string; nextActionDate?: string }) =>
    request<ProspectResponse>('/api/v1/prospects', { method: 'POST', body: data }),
  update: (id: string, data: Record<string, any>) =>
    request<ProspectResponse>(`/api/v1/prospects/${id}`, { method: 'PUT', body: data }),
  remove: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/api/v1/prospects/${id}`, { method: 'DELETE' }),
  convert: (id: string, clientData: { pan: string; dateOfBirth: string; riskProfile?: string; address?: string; city?: string; state?: string; pincode?: string }) =>
    request<{ clientId: string }>(`/api/v1/prospects/${id}/convert`, { method: 'POST', body: clientData }),
  addMeetingNote: (id: string, data: { title: string; content: string; meetingType?: string; meetingDate: string }) =>
    request<{ id: string; title: string; content: string; meetingType: string; meetingDate: string; createdAt: string }>(`/api/v1/prospects/${id}/meeting-notes`, { method: 'POST', body: data }),
  getStats: () =>
    request<ProspectStats>('/api/v1/prospects/stats'),
};
