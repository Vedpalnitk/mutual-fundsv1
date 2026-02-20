/**
 * NSE NMF Client Registration Dashboard
 *
 * View and manage NSE UCC registration status for clients.
 * Clients must be registered with NSE before placing orders via NMF.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatDate } from '@/utils/fa'
import { Client } from '@/utils/faTypes'
import { clientsApi, nmfApi, FAPaginatedResponse } from '@/services/api'
import {
  FACard,
  FAButton,
  FAChip,
  FASearchInput,
  FAEmptyState,
  FASpinner,
} from '@/components/advisor/shared'

type NMFStatus = 'Approved' | 'Submitted' | 'Rejected' | 'Not Registered'

interface ClientWithNMF extends Client {
  nmfStatus?: NMFStatus
  nmfClientCode?: string
  nmfLastUpdated?: string
}

const STATUS_COLORS: Record<NMFStatus, string> = {
  'Approved': '#10B981',
  'Submitted': '#F59E0B',
  'Rejected': '#EF4444',
  'Not Registered': '#6B7280',
}

const STATUS_FILTERS: NMFStatus[] = ['Approved', 'Submitted', 'Rejected', 'Not Registered']

const NMFClientsPage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()

  const [clients, setClients] = useState<ClientWithNMF[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<NMFStatus | 'All'>('All')

  // Stats
  const approvedCount = clients.filter(c => c.nmfStatus === 'Approved').length
  const submittedCount = clients.filter(c => c.nmfStatus === 'Submitted').length
  const rejectedCount = clients.filter(c => c.nmfStatus === 'Rejected').length
  const notRegisteredCount = clients.filter(c => c.nmfStatus === 'Not Registered').length

  // Fetch clients and their NMF status
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch FA clients
      const response = await clientsApi.list<Client>({
        search: searchTerm || undefined,
        limit: 200,
      })

      // Fetch NMF status for each client in parallel
      const clientsWithStatus: ClientWithNMF[] = await Promise.all(
        response.data.map(async (client) => {
          try {
            const nmfData = await nmfApi.ucc.getStatus(client.id)
            return {
              ...client,
              nmfStatus: (nmfData?.status as NMFStatus) || 'Not Registered',
              nmfClientCode: nmfData?.clientCode || undefined,
              nmfLastUpdated: nmfData?.updatedAt || undefined,
            }
          } catch {
            return {
              ...client,
              nmfStatus: 'Not Registered' as NMFStatus,
            }
          }
        })
      )

      setClients(clientsWithStatus)
    } catch (err) {
      console.error('[NMF Clients] Error:', err)
      setError('Failed to load clients')
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Filter clients
  const filteredClients = clients.filter(client => {
    if (statusFilter !== 'All' && client.nmfStatus !== statusFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.pan && client.pan.toLowerCase().includes(term)) ||
        (client.nmfClientCode && client.nmfClientCode.toLowerCase().includes(term))
      )
    }
    return true
  })

  const handleClientClick = (clientId: string) => {
    router.push(`/advisor/nmf/clients/${clientId}/register`)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const maskPan = (pan: string) => {
    if (!pan || pan.length < 10) return pan
    return pan.slice(0, 2) + '****' + pan.slice(-4)
  }

  return (
    <AdvisorLayout title="NMF Client Registration">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Manage NSE NMF UCC registration for your clients
            </p>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'TOTAL', value: clients.length, color: colors.primary, variant: 'primary' },
            { label: 'APPROVED', value: approvedCount, color: colors.success, variant: 'success' },
            { label: 'SUBMITTED', value: submittedCount, color: colors.warning, variant: 'warning' },
            { label: 'REJECTED', value: rejectedCount, color: colors.error, variant: 'error' },
            { label: 'NOT REG.', value: notRegisteredCount, color: colors.textSecondary, variant: 'neutral' },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="p-4 rounded-xl"
              style={{
                background: `${kpi.color}08`,
                border: `1px solid ${kpi.color}20`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: kpi.color }}>
                {kpi.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          {/* Header with filters */}
          <div
            className="flex items-center justify-between flex-wrap gap-2"
            style={{
              background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
              padding: '0.875rem 1.25rem',
              borderBottom: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                UCC Status
              </h3>
              <div className="w-px h-4" style={{ background: colors.cardBorder }} />
              <div className="flex items-center gap-1">
                {(['All', ...STATUS_FILTERS] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className="text-xs px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: statusFilter === f ? `${colors.primary}15` : 'transparent',
                      border: `1px solid ${statusFilter === f ? `${colors.primary}30` : 'transparent'}`,
                      color: statusFilter === f ? colors.primary : colors.textTertiary,
                      fontWeight: statusFilter === f ? 600 : 400,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${colors.primary}15`, color: colors.primary }}>
              {filteredClients.length} clients
            </span>
          </div>

          {/* Search */}
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
            <div className="max-w-sm">
              <FASearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by name, email, PAN, or client code..."
              />
            </div>
          </div>

          {/* Client List */}
          <div className="px-5 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <FASpinner />
              </div>
            ) : error ? (
              <div className="py-8">
                <FAEmptyState
                  icon={
                    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  }
                  title="Error loading clients"
                  description={error}
                  action={<FAButton onClick={fetchClients}>Retry</FAButton>}
                />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-8">
                <FAEmptyState
                  icon={
                    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  title="No clients found"
                  description={searchTerm || statusFilter !== 'All' ? 'Try adjusting your search or filters' : 'No clients available for NMF registration'}
                />
              </div>
            ) : (
              <div>
                {filteredClients.map(client => {
                  const statusColor = STATUS_COLORS[client.nmfStatus || 'Not Registered']
                  return (
                    <div
                      key={client.id}
                      onClick={() => handleClientClick(client.id)}
                      className="flex items-center gap-3 py-3 px-1 cursor-pointer transition-colors duration-150"
                      style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(147,197,253,0.04)' : 'rgba(59,130,246,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                      >
                        {getInitials(client.name)}
                      </div>

                      {/* Name + details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.name}</p>
                          {client.kycStatus === 'Verified' && (
                            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.success }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color: colors.textSecondary }}>{client.email}</span>
                          {client.pan && (
                            <>
                              <span className="text-xs" style={{ color: colors.textTertiary }}>|</span>
                              <span className="text-xs" style={{ color: colors.textSecondary }}>{maskPan(client.pan)}</span>
                            </>
                          )}
                          {client.nmfClientCode && (
                            <>
                              <span className="text-xs" style={{ color: colors.textTertiary }}>|</span>
                              <span className="text-xs font-medium" style={{ color: colors.primary }}>UCC: {client.nmfClientCode}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* NMF Status Badge */}
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{
                            background: `${statusColor}15`,
                            color: statusColor,
                            border: `1px solid ${statusColor}30`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                          {client.nmfStatus || 'Not Registered'}
                        </span>

                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: colors.textTertiary }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdvisorLayout>
  )
}

export default NMFClientsPage
