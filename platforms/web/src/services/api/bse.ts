/**
 * BSE StAR MF API
 */
import { request } from '../api'
import type {
  BseCredentialStatus,
  BseCredentialSetRequest,
  BseUccRegistration,
  BseUccRegisterRequest,
} from './types/bse'

export type * from './types/bse'

export const bseApi = {
  // Credentials
  credentials: {
    getStatus: () =>
      request<BseCredentialStatus>('/api/v1/bse/credentials'),
    set: (data: BseCredentialSetRequest) =>
      request<BseCredentialStatus>('/api/v1/bse/credentials', { method: 'POST', body: data }),
    test: () =>
      request<{ success: boolean; message: string }>('/api/v1/bse/credentials/test', { method: 'POST' }),
  },

  // UCC (Client Registration)
  ucc: {
    getStatus: (clientId: string) =>
      request<BseUccRegistration>(`/api/v1/bse/ucc/${clientId}`),
    batchStatus: (clientIds: string[]) =>
      request<Record<string, { status: string; bseClientCode: string | null }>>('/api/v1/bse/ucc/batch-status', {
        method: 'POST',
        body: { clientIds },
      }),
    register: (clientId: string, data: BseUccRegisterRequest) =>
      request<BseUccRegistration>(`/api/v1/bse/ucc/${clientId}/register`, { method: 'POST', body: data }),
    modify: (clientId: string, data: Record<string, unknown>) =>
      request<BseUccRegistration>(`/api/v1/bse/ucc/${clientId}`, { method: 'PUT', body: data }),
    uploadFatca: (clientId: string, data: Record<string, unknown>) =>
      request<BseUccRegistration>(`/api/v1/bse/ucc/${clientId}/fatca`, { method: 'POST', body: data }),
    uploadCkyc: (clientId: string, data: Record<string, unknown>) =>
      request<BseUccRegistration>(`/api/v1/bse/ucc/${clientId}/ckyc`, { method: 'POST', body: data }),
  },

  // Mandates
  mandates: {
    list: (params?: { clientId?: string; status?: string }) => {
      const query = new URLSearchParams()
      if (params?.clientId) query.set('clientId', params.clientId)
      if (params?.status) query.set('status', params.status)
      const qs = query.toString()
      return request<any>(`/api/v1/bse/mandates${qs ? `?${qs}` : ''}`)
    },
    create: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/mandates', { method: 'POST', body: data }),
    getOne: (id: string) =>
      request<any>(`/api/v1/bse/mandates/${id}`),
    getAuthUrl: (id: string) =>
      request<any>(`/api/v1/bse/mandates/${id}/auth-url`),
    refreshStatus: (id: string) =>
      request<any>(`/api/v1/bse/mandates/${id}/refresh-status`, { method: 'POST' }),
    shift: (id: string, data: Record<string, unknown>) =>
      request<any>(`/api/v1/bse/mandates/${id}/shift`, { method: 'POST', body: data }),
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
      return request<any>(`/api/v1/bse/orders${qs ? `?${qs}` : ''}`)
    },
    purchase: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/orders/purchase', { method: 'POST', body: data }),
    redeem: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/orders/redeem', { method: 'POST', body: data }),
    switchOrder: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/orders/switch', { method: 'POST', body: data }),
    spread: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/orders/spread', { method: 'POST', body: data }),
    getOne: (id: string) =>
      request<any>(`/api/v1/bse/orders/${id}`),
    cancel: (id: string) =>
      request<any>(`/api/v1/bse/orders/${id}/cancel`, { method: 'POST' }),
    cob: (data: { clientId: string; schemeCode: string; folioNumber: string; allUnits?: boolean; units?: number; fromArn?: string; remarks?: string }) =>
      request<any>('/api/v1/bse/orders/cob', { method: 'POST', body: data }),
  },

  // Payments
  payments: {
    initiate: (orderId: string, data: { paymentMode: string; bankCode?: string }) =>
      request<any>(`/api/v1/bse/payments/${orderId}`, { method: 'POST', body: data }),
    getStatus: (orderId: string) =>
      request<any>(`/api/v1/bse/payments/${orderId}/status`),
  },

  // Systematic Plans
  systematic: {
    registerSip: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/systematic/sip', { method: 'POST', body: data }),
    registerXsip: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/systematic/xsip', { method: 'POST', body: data }),
    registerStp: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/systematic/stp', { method: 'POST', body: data }),
    registerSwp: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/systematic/swp', { method: 'POST', body: data }),
    cancel: (id: string) =>
      request<any>(`/api/v1/bse/systematic/${id}/cancel`, { method: 'POST' }),
    getChildOrders: (id: string) =>
      request<any>(`/api/v1/bse/systematic/${id}/child-orders`),
  },

  // Reports
  reports: {
    orderStatus: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/reports/order-status', { method: 'POST', body: data }),
    allotment: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/reports/allotment', { method: 'POST', body: data }),
    redemption: (data: Record<string, unknown>) =>
      request<any>('/api/v1/bse/reports/redemption', { method: 'POST', body: data }),
    childOrders: (regnNo: string) =>
      request<any>(`/api/v1/bse/reports/child-orders/${regnNo}`),
  },

  // Masters
  masters: {
    searchSchemes: (query?: string, page?: number, limit?: number) => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (page) params.set('page', String(page))
      if (limit) params.set('limit', String(limit))
      const qs = params.toString()
      return request<any>(`/api/v1/bse/scheme-master${qs ? `?${qs}` : ''}`)
    },
    syncSchemes: () =>
      request<any>('/api/v1/bse/scheme-master/sync', { method: 'POST' }),
    listBanks: (mode?: string) =>
      request<any>(`/api/v1/bse/banks${mode ? `?mode=${mode}` : ''}`),
    taxStatusCodes: () =>
      request<any>('/api/v1/bse/masters/tax-status'),
  },
};
