/**
 * NSE NMF Client Registration Dashboard
 *
 * View and manage NSE UCC registration status for clients.
 * Clients must be registered with NSE before placing orders via NMF.
 *
 * Thin wrapper around the shared ExchangeClientsPage component.
 */

import { ExchangeClientsPage } from '@/components/exchange'
import type { ExchangeConfig } from '@/components/exchange'
import { nmfApi } from '@/services/api'

const NMF_STATUS_COLORS: Record<string, string> = {
  'Approved': '#10B981',
  'Submitted': '#F59E0B',
  'Rejected': '#EF4444',
  'Not Registered': '#6B7280',
}

const nmfConfig: ExchangeConfig = {
  exchangeName: 'NMF',
  subtitle: 'Manage NSE NMF UCC registration for your clients',
  getStatusFn: async (clientId) => {
    const data = await nmfApi.ucc.getStatus(clientId)
    return {
      status: data?.status,
      clientCode: data?.clientCode || undefined,
      updatedAt: data?.updatedAt || undefined,
    }
  },
  registerRoute: (id) => `/advisor/nmf/clients/${id}/register`,
  detailRoute: (id) => `/advisor/nmf/clients/${id}`,
  statusTypes: ['Approved', 'Submitted', 'Rejected', 'Not Registered'],
  statusColors: NMF_STATUS_COLORS,
  codeLabel: 'UCC',
  maskPan: true,
}

const NMFClientsPage = () => {
  return <ExchangeClientsPage config={nmfConfig} />
}

export default NMFClientsPage
