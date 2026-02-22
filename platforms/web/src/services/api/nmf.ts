/**
 * NSE NMF (MFSS) API
 */
import { request } from '../api'
import type {
  NmfCredentialStatus,
  NmfCredentialSetRequest,
  NmfUccRegistration,
} from './types/nmf'

export type * from './types/nmf'

export const nmfApi = {
  // Credentials
  credentials: {
    getStatus: () =>
      request<NmfCredentialStatus>('/api/v1/nmf/credentials'),
    set: (data: NmfCredentialSetRequest) =>
      request<NmfCredentialStatus>('/api/v1/nmf/credentials', { method: 'POST', body: data }),
    test: () =>
      request<{ success: boolean; message: string }>('/api/v1/nmf/credentials/test', { method: 'POST' }),
  },

  // UCC (Client Registration)
  ucc: {
    getStatus: (clientId: string) =>
      request<NmfUccRegistration>(`/api/v1/nmf/ucc/${clientId}`),
    batchStatus: (clientIds: string[]) =>
      request<Record<string, { status: string; nseClientCode: string | null }>>('/api/v1/nmf/ucc/batch-status', {
        method: 'POST',
        body: { clientIds },
      }),
    register: (clientId: string, data: Record<string, unknown>) =>
      request<NmfUccRegistration>(`/api/v1/nmf/ucc/${clientId}/register`, { method: 'POST', body: data }),
    modify: (clientId: string, data: Record<string, unknown>) =>
      request<NmfUccRegistration>(`/api/v1/nmf/ucc/${clientId}`, { method: 'PUT', body: data }),
    uploadFatca: (clientId: string, data: Record<string, unknown>) =>
      request<NmfUccRegistration>(`/api/v1/nmf/ucc/${clientId}/fatca`, { method: 'POST', body: data }),
    uploadFatcaCorporate: (clientId: string, data: Record<string, unknown>) =>
      request<NmfUccRegistration>(`/api/v1/nmf/ucc/${clientId}/fatca-corporate`, { method: 'POST', body: data }),
    addBankDetail: (clientId: string, data: Record<string, unknown>) =>
      request<NmfUccRegistration>(`/api/v1/nmf/ucc/${clientId}/bank-detail`, { method: 'POST', body: data }),
    deleteBankDetail: (clientId: string, data: { account_no: string; ifsc_code: string }) =>
      request<NmfUccRegistration>(`/api/v1/nmf/ucc/${clientId}/bank-detail`, { method: 'DELETE', body: data }),
    initiateEkyc: (clientId: string) =>
      request<any>(`/api/v1/nmf/ucc/${clientId}/ekyc`, { method: 'POST' }),
  },

  // Mandates
  mandates: {
    list: (params?: { clientId?: string; status?: string }) => {
      const query = new URLSearchParams()
      if (params?.clientId) query.set('clientId', params.clientId)
      if (params?.status) query.set('status', params.status)
      const qs = query.toString()
      return request<any>(`/api/v1/nmf/mandates${qs ? `?${qs}` : ''}`)
    },
    create: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/mandates', { method: 'POST', body: data }),
    getOne: (id: string) =>
      request<any>(`/api/v1/nmf/mandates/${id}`),
    refreshStatus: (id: string) =>
      request<any>(`/api/v1/nmf/mandates/${id}/refresh-status`, { method: 'POST' }),
    uploadImage: (id: string, data: Record<string, unknown>) =>
      request<any>(`/api/v1/nmf/mandates/${id}/upload-image`, { method: 'POST', body: data }),
  },

  // Scheme Master
  masters: {
    searchSchemes: (q: string, page = 1, limit = 20) =>
      request<any>(`/api/v1/nmf/orders/scheme-master?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`),
  },

  // Orders
  orders: {
    list: (params?: { clientId?: string; status?: string; orderType?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams()
      if (params?.clientId) query.set('clientId', params.clientId)
      if (params?.status) query.set('status', params.status)
      if (params?.orderType) query.set('orderType', params.orderType)
      if (params?.page) query.set('page', String(params.page))
      if (params?.limit) query.set('limit', String(params.limit))
      const qs = query.toString()
      return request<any>(`/api/v1/nmf/orders${qs ? `?${qs}` : ''}`)
    },
    purchase: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/orders/purchase', { method: 'POST', body: data }),
    redeem: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/orders/redeem', { method: 'POST', body: data }),
    switchOrder: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/orders/switch', { method: 'POST', body: data }),
    getOne: (id: string) =>
      request<any>(`/api/v1/nmf/orders/${id}`),
    cancel: (id: string) =>
      request<any>(`/api/v1/nmf/orders/${id}/cancel`, { method: 'POST' }),
  },

  // Payments
  payments: {
    initiate: (orderId: string, data: { paymentMode: string; bankCode?: string; vpa?: string; utrNo?: string; chequeNo?: string; chequeDate?: string; mandateId?: string }) =>
      request<any>(`/api/v1/nmf/payments/${orderId}`, { method: 'POST', body: data }),
    getStatus: (orderId: string) =>
      request<any>(`/api/v1/nmf/payments/${orderId}/status`),
    checkUpiStatus: (data: { orderId: string; vpa: string }) =>
      request<any>('/api/v1/nmf/payments/upi-status', { method: 'POST', body: data }),
  },

  // Systematic Plans
  systematic: {
    registerSip: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/systematic/sip', { method: 'POST', body: data }),
    registerXsip: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/systematic/xsip', { method: 'POST', body: data }),
    registerStp: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/systematic/stp', { method: 'POST', body: data }),
    registerSwp: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/systematic/swp', { method: 'POST', body: data }),
    sipTopup: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/systematic/sip-topup', { method: 'POST', body: data }),
    cancel: (id: string) =>
      request<any>(`/api/v1/nmf/systematic/${id}/cancel`, { method: 'POST' }),
    pause: (id: string) =>
      request<any>(`/api/v1/nmf/systematic/${id}/pause`, { method: 'POST' }),
    resume: (id: string) =>
      request<any>(`/api/v1/nmf/systematic/${id}/resume`, { method: 'POST' }),
  },

  // Reports
  reports: {
    orderStatus: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/reports/order-status', { method: 'POST', body: data }),
    allotment: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/reports/allotment', { method: 'POST', body: data }),
    orderLifecycle: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/reports/order-lifecycle', { method: 'POST', body: data }),
    mandateStatus: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/reports/mandate-status', { method: 'POST', body: data }),
    sipRegistration: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/reports/sip-registration', { method: 'POST', body: data }),
    schemeMaster: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/reports/scheme-master', { method: 'POST', body: data }),
    generic: (reportType: string, data: Record<string, unknown>) =>
      request<any>(`/api/v1/nmf/reports/${reportType}`, { method: 'POST', body: data }),
  },

  // Uploads
  uploads: {
    aof: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/uploads/aof', { method: 'POST', body: data }),
    fatca: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/uploads/fatca', { method: 'POST', body: data }),
    mandate: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/uploads/mandate', { method: 'POST', body: data }),
    cancelCheque: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/uploads/cancel-cheque', { method: 'POST', body: data }),
    generic: (type: string, data: Record<string, unknown>) =>
      request<any>(`/api/v1/nmf/uploads/${type}`, { method: 'POST', body: data }),
  },

  // Utilities
  utilities: {
    utrUpdate: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/utilities/utr-update', { method: 'POST', body: data }),
    shortUrl: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/utilities/short-url', { method: 'POST', body: data }),
    kycCheck: (data: { pan: string }) =>
      request<any>('/api/v1/nmf/utilities/kyc-check', { method: 'POST', body: data }),
    resendComm: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/utilities/resend-comm', { method: 'POST', body: data }),
    sipUmrnMapping: (data: Record<string, unknown>) =>
      request<any>('/api/v1/nmf/utilities/sip-umrn', { method: 'POST', body: data }),
  },
};
