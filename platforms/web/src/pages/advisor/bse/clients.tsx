/**
 * BSE UCC Registration Dashboard
 *
 * View and manage BSE client registration (UCC) status.
 * Clients must be registered with BSE before placing orders.
 *
 * Thin wrapper around the shared ExchangeClientsPage component.
 */

import { ExchangeClientsPage } from '@/components/exchange'
import type { ExchangeConfig } from '@/components/exchange'
import { bseApi } from '@/services/api'

const BSE_STATUS_COLORS: Record<string, string> = {
  'Approved': '#10B981',
  'Submitted': '#F59E0B',
  'Draft': '#94A3B8',
  'Rejected': '#EF4444',
  'Not Registered': '#6B7280',
}

const bseConfig: ExchangeConfig = {
  exchangeName: 'BSE',
  subtitle: 'Manage BSE UCC registration for your clients',
  getStatusFn: async (clientId) => {
    const data = await bseApi.ucc.getStatus(clientId)
    return {
      status: data?.status,
      clientCode: data?.clientCode || undefined,
      updatedAt: data?.updatedAt || undefined,
    }
  },
  registerRoute: (id) => `/advisor/bse/clients/${id}/register`,
  detailRoute: (id) => `/advisor/bse/clients/${id}`,
  statusTypes: ['Approved', 'Submitted', 'Draft', 'Rejected', 'Not Registered'],
  statusColors: BSE_STATUS_COLORS,
  codeLabel: 'UCC',
  maskPan: false,
}

const BSEClientsPage = () => {
  return <ExchangeClientsPage config={bseConfig} />
}

export default BSEClientsPage
