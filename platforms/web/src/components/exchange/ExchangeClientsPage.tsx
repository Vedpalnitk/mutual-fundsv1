/**
 * Shared Exchange Clients Page
 *
 * Parameterized component for BSE and NMF client registration dashboards.
 * Both exchanges follow the same pattern: fetch clients, check registration
 * status, display a filterable list with KPI tiles and status badges.
 */

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme } from '@/utils/fa'
import { Client } from '@/utils/faTypes'
import { clientsApi } from '@/services/api'
import {
  FAButton,
  FASearchInput,
  FAEmptyState,
  FASpinner,
} from '@/components/advisor/shared'

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export interface ExchangeConfig {
  /** Display name shown in the page title and empty states */
  exchangeName: 'BSE' | 'NMF'
  /** Subtitle shown below the page heading */
  subtitle: string
  /** Fetch a single client's registration status */
  getStatusFn: (clientId: string) => Promise<{ status?: string; clientCode?: string; updatedAt?: string } | null>
  /** Route to the registration page for a given client */
  registerRoute: (clientId: string) => string
  /** Route to the detail page for a given client */
  detailRoute: (clientId: string) => string
  /** Ordered list of status filter values */
  statusTypes: string[]
  /** Colour map for each status */
  statusColors: Record<string, string>
  /** Field name used to label the client code (e.g. "UCC") */
  codeLabel?: string
  /** Optional extra KPI tiles beyond the standard set */
  extraKpis?: (clients: ClientWithExchange[]) => Array<{ label: string; value: number; color: string }>
  /** If true, PAN values are masked (NMF style). Default false. */
  maskPan?: boolean
}

export interface ExchangeClientsPageProps {
  config: ExchangeConfig
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export interface ClientWithExchange extends Client {
  exchangeStatus?: string
  exchangeClientCode?: string
  exchangeLastUpdated?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const maskPanValue = (pan: string) => {
  if (!pan || pan.length < 10) return pan
  return pan.slice(0, 2) + '****' + pan.slice(-4)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExchangeClientsPage = ({ config }: ExchangeClientsPageProps) => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()

  const [clients, setClients] = useState<ClientWithExchange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const {
    exchangeName,
    subtitle,
    getStatusFn,
    registerRoute,
    statusTypes,
    statusColors,
    codeLabel = 'UCC',
    maskPan: shouldMaskPan = false,
  } = config

  // ── Fetch clients + registration statuses ──────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await clientsApi.list<Client>({
        search: searchTerm || undefined,
        limit: 200,
      })

      const clientsWithStatus: ClientWithExchange[] = await Promise.all(
        response.data.map(async (client) => {
          try {
            const data = await getStatusFn(client.id)
            return {
              ...client,
              exchangeStatus: data?.status || 'Not Registered',
              exchangeClientCode: data?.clientCode || undefined,
              exchangeLastUpdated: data?.updatedAt || undefined,
            }
          } catch {
            return {
              ...client,
              exchangeStatus: 'Not Registered',
            }
          }
        })
      )

      setClients(clientsWithStatus)
    } catch (err) {
      console.error(`[${exchangeName} Clients] Error:`, err)
      setError('Failed to load clients')
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, exchangeName, getStatusFn])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // ── KPI counts ─────────────────────────────────────────────────────────
  const countByStatus = (status: string) =>
    clients.filter(c => c.exchangeStatus === status).length

  const defaultKpis = [
    { label: 'TOTAL', value: clients.length, color: colors.primary },
    ...statusTypes
      .filter(s => s !== 'Not Registered')
      .map(s => ({
        label: s.toUpperCase(),
        value: countByStatus(s),
        color: statusColors[s] || colors.textTertiary,
      })),
    {
      label: 'NOT REG.',
      value: countByStatus('Not Registered'),
      color: statusColors['Not Registered'] || colors.textSecondary,
    },
  ]

  const kpis = config.extraKpis
    ? [...defaultKpis, ...config.extraKpis(clients)]
    : defaultKpis

  // ── Filter ─────────────────────────────────────────────────────────────
  const filteredClients = clients.filter(client => {
    if (statusFilter !== 'All' && client.exchangeStatus !== statusFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.pan && client.pan.toLowerCase().includes(term)) ||
        (client.exchangeClientCode && client.exchangeClientCode.toLowerCase().includes(term))
      )
    }
    return true
  })

  const handleClientClick = (clientId: string) => {
    router.push(registerRoute(clientId))
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <AdvisorLayout title={`${exchangeName} Client Registration`}>
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* KPI Tiles */}
        <div
          className="grid gap-4 mb-6"
          style={{ gridTemplateColumns: `repeat(${Math.min(kpis.length, 5)}, minmax(0, 1fr))` }}
        >
          {kpis.map(kpi => (
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
                {codeLabel} Status
              </h3>
              <div className="w-px h-4" style={{ background: colors.cardBorder }} />
              <div className="flex items-center gap-1">
                {(['All', ...statusTypes] as const).map(f => (
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
                  description={
                    searchTerm || statusFilter !== 'All'
                      ? 'Try adjusting your search or filters'
                      : `No clients available for ${exchangeName} registration`
                  }
                />
              </div>
            ) : (
              <div>
                {filteredClients.map(client => {
                  const status = client.exchangeStatus || 'Not Registered'
                  const statusColor = statusColors[status] || colors.textTertiary
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
                              <span className="text-xs" style={{ color: colors.textSecondary }}>
                                {shouldMaskPan ? maskPanValue(client.pan) : client.pan}
                              </span>
                            </>
                          )}
                          {client.exchangeClientCode && (
                            <>
                              <span className="text-xs" style={{ color: colors.textTertiary }}>|</span>
                              <span className="text-xs font-medium" style={{ color: colors.primary }}>
                                {codeLabel}: {client.exchangeClientCode}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
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
                          {status}
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

export default ExchangeClientsPage
