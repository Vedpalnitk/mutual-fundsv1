import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, getRiskColor } from '@/utils/fa'
import { Client, ClientFormData, RiskProfile, FamilyGroup } from '@/utils/faTypes'
import {
  FAChip,
  FASearchInput,
  FASelect,
  FAButton,
  FAEmptyState,
} from '@/components/advisor/shared'
import ClientFormModal from '@/components/advisor/ClientFormModal'
import { clientsApi, FAPaginatedResponse } from '@/services/api'

// Inline FilterPill component (matches dashboard pattern)
const FilterPill = ({
  label,
  active,
  onClick,
  colors,
}: {
  label: string
  active: boolean
  onClick: () => void
  colors: ReturnType<typeof useFATheme>['colors']
}) => (
  <button
    onClick={onClick}
    className="text-xs px-2.5 py-1 rounded-full transition-all"
    style={{
      background: active ? `${colors.primary}15` : 'transparent',
      border: `1px solid ${active ? `${colors.primary}30` : 'transparent'}`,
      color: active ? colors.primary : colors.textTertiary,
      fontWeight: active ? 600 : 400,
    }}
  >
    {label}
  </button>
)

const SORT_OPTIONS = [
  { value: 'aum', label: 'Sort by AUM' },
  { value: 'name', label: 'Sort by Name' },
  { value: 'returns', label: 'Sort by Returns' },
]

const ClientsPage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientFilter, setClientFilter] = useState<'all' | 'kyc-pending' | 'inactive' | 'high-aum'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'aum' | 'returns'>('aum')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewMode, setViewMode] = useState<'individual' | 'family'>('individual')
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null)

  // Toggle helper (matches dashboard pattern)
  const toggleExpand = (
    current: string | null,
    id: string,
    setter: (v: string | null) => void,
  ) => setter(current === id ? null : id)

  // Group clients by family
  const groupClientsByFamily = useCallback((clientList: Client[]): FamilyGroup[] => {
    const familyMap = new Map<string, Client[]>()
    const individuals: Client[] = []

    clientList.forEach(client => {
      if (client.familyGroupId) {
        const existing = familyMap.get(client.familyGroupId) || []
        existing.push(client)
        familyMap.set(client.familyGroupId, existing)
      } else {
        individuals.push(client)
      }
    })

    const families: FamilyGroup[] = []

    familyMap.forEach((members, groupId) => {
      const head = members.find(m => m.familyRole === 'SELF') || members[0]
      const lastName = head.name.split(' ').slice(-1)[0]

      families.push({
        id: groupId,
        name: `${lastName} Family`,
        headId: head.id,
        members: members.sort((a, b) => {
          const roleOrder = { SELF: 0, SPOUSE: 1, CHILD: 2, PARENT: 3, SIBLING: 4 }
          return (roleOrder[a.familyRole || 'SIBLING'] || 5) - (roleOrder[b.familyRole || 'SIBLING'] || 5)
        }),
        totalAum: members.reduce((sum, m) => sum + m.aum, 0),
        avgReturns: members.reduce((sum, m) => sum + m.returns, 0) / members.length,
        totalSipCount: members.reduce((sum, m) => sum + m.sipCount, 0),
        totalGoalsCount: members.reduce((sum, m) => sum + m.goalsCount, 0),
      })
    })

    // Add individuals as single-member families
    individuals.forEach(client => {
      families.push({
        id: client.id,
        name: client.name,
        headId: client.id,
        members: [client],
        totalAum: client.aum,
        avgReturns: client.returns,
        totalSipCount: client.sipCount,
        totalGoalsCount: client.goalsCount,
      })
    })

    return families.sort((a, b) => b.totalAum - a.totalAum)
  }, [])

  // Fetch clients from API
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await clientsApi.list<Client>({
        search: searchTerm || undefined,
        sortBy: sortBy,
        sortOrder: sortBy === 'name' ? 'asc' : 'desc',
      })
      setClients(response.data)
    } catch (err) {
      console.error('[Clients] API Error:', err)
      setError('Failed to load clients - check backend connection')
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, sortBy])

  // Initial load and refetch on filter changes
  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const totalAum = clients.reduce((sum, c) => sum + c.aum, 0)
  const avgReturns = clients.length > 0 ? clients.reduce((sum, c) => sum + c.returns, 0) / clients.length : 0

  // Client-side filtering (always applied — status filters are client-side only)
  const filteredClients = clients
    .filter(client => {
      const matchesSearch = !searchTerm || client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.email.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
      switch (clientFilter) {
        case 'kyc-pending': return client.kycStatus !== 'Verified'
        case 'inactive': return !client.lastActive || client.lastActive === 'Never' || /\d+\s*day/i.test(client.lastActive) || /\d{4}-\d{2}-\d{2}/.test(client.lastActive)
        case 'high-aum': return client.aum >= (totalAum / (clients.length || 1))
        default: return true
      }
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'aum') return b.aum - a.aum
      if (sortBy === 'returns') return b.returns - a.returns
      return 0
    })

  const handleAddClient = () => {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleViewClient = (clientId: string) => {
    router.push(`/advisor/clients/${clientId}`)
  }

  const handleFormSubmit = async (formData: ClientFormData) => {
    try {
      if (editingClient) {
        // Update existing client via API
        await clientsApi.update<Client>(editingClient.id, formData as unknown as Record<string, unknown>)
      } else {
        // Create new client via API
        await clientsApi.create<Client>(formData as unknown as Record<string, unknown>)
      }
      // Refresh the list
      fetchClients()
    } catch {
      // Fall back to local state update for demo
      if (editingClient) {
        setClients(prev =>
          prev.map(c =>
            c.id === editingClient.id
              ? { ...c, ...formData }
              : c
          )
        )
      } else {
        const newClient: Client = {
          id: `${clients.length + 1}`,
          ...formData,
          aum: 0,
          returns: 0,
          lastActive: 'Just now',
          sipCount: 0,
          goalsCount: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          status: 'Pending KYC',
          kycStatus: 'Pending',
        }
        setClients(prev => [newClient, ...prev])
      }
    }
    setIsModalOpen(false)
    setEditingClient(null)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Compute client-focused KPI stats
  const familyGroups = groupClientsByFamily(clients)
  const familyCount = familyGroups.filter(f => f.members.length > 1).length
  const individualCount = familyGroups.filter(f => f.members.length === 1).length
  const kycPendingCount = clients.filter(c => c.kycStatus !== 'Verified').length
  const avgAumPerClient = clients.length > 0 ? totalAum / clients.length : 0
  const inactiveClients = clients.filter(c => c.lastActive.includes('day') || c.lastActive.includes('week')).length

  return (
    <AdvisorLayout title="Client Management">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Manage your client portfolios and relationships
            </p>
          </div>
          <FAButton onClick={handleAddClient} icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }>
            Add Client
          </FAButton>
        </div>

        {/* Gradient KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            viewMode === 'family'
              ? { label: 'FAMILIES', value: `${familyCount} + ${individualCount}`, change: `${familyCount} families, ${individualCount} individuals`, variant: 'primary' }
              : { label: 'TOTAL CLIENTS', value: clients.length.toString(), change: `${clients.filter(c => c.status === 'Active').length} active`, variant: 'primary' },
            { label: 'KYC PENDING', value: kycPendingCount.toString(), change: kycPendingCount > 0 ? 'needs attention' : 'all verified', variant: kycPendingCount > 0 ? 'accent' : 'success' },
            { label: 'AVG. AUM / CLIENT', value: formatCurrency(avgAumPerClient), change: `${formatCurrency(totalAum)} total`, variant: 'secondary' },
            { label: 'INACTIVE', value: inactiveClients.toString(), change: inactiveClients > 0 ? 'need check-in' : 'all engaged', variant: inactiveClients > 0 ? 'accent' : 'success' },
          ].map((kpi) => {
            const getGradient = () => {
              switch (kpi.variant) {
                case 'secondary': return `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`
                case 'success': return `linear-gradient(135deg, ${colors.success} 0%, ${isDark ? '#059669' : '#047857'} 100%)`
                case 'accent': return `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.secondary} 100%)`
                default: return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
              }
            }
            return (
              <div
                key={kpi.label}
                className="p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: getGradient(),
                  boxShadow: `0 8px 32px ${isDark ? 'rgba(59, 130, 246, 0.25)' : `${colors.primary}25`}`,
                }}
              >
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{kpi.label}</p>
                  <p className="text-xl font-bold mt-2 text-white">{kpi.value}</p>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block"
                    style={{ background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#FFFFFF' }}
                  >
                    {kpi.change}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Card with Tinted Header + Client List */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          {/* Tinted Section Header */}
          <div
            className="flex items-center justify-between flex-wrap gap-2"
            style={{
              background: isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.03)',
              padding: '0.875rem 1.25rem',
              borderBottom: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Clients</h3>
              <div className="flex items-center gap-1">
                <FilterPill label="Individual" active={viewMode === 'individual'} onClick={() => setViewMode('individual')} colors={colors} />
                <FilterPill label="Family" active={viewMode === 'family'} onClick={() => setViewMode('family')} colors={colors} />
              </div>
              <div className="w-px h-4" style={{ background: colors.cardBorder }} />
              <div className="flex items-center gap-1">
                {([
                  { key: 'all', label: 'All' },
                  { key: 'kyc-pending', label: 'KYC Pending' },
                  { key: 'inactive', label: 'Inactive' },
                  { key: 'high-aum', label: 'High AUM' },
                ] as const).map((f) => (
                  <FilterPill key={f.key} label={f.label} active={clientFilter === f.key} onClick={() => setClientFilter(f.key)} colors={colors} />
                ))}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${colors.primary}15`, color: colors.primary }}>
              {filteredClients.length} {viewMode === 'family' ? 'groups' : 'clients'}
            </span>
          </div>

          {/* Search + Sort Row */}
          <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
            <div className="max-w-xs flex-1">
              <FASearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search clients..."
              />
            </div>
            <FASelect
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'aum' | 'returns')}
              containerClassName="w-40"
            />
          </div>

          {/* Card Body */}
          <div className="px-5 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }} />
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
                  description="Try adjusting your search or filters"
                  action={
                    <FAButton variant="secondary" onClick={handleAddClient}>
                      Add New Client
                    </FAButton>
                  }
                />
              </div>
            ) : viewMode === 'individual' ? (
              /* Individual View — Expandable Rows */
              <div>
                {filteredClients.map((client) => {
                  const isExpanded = expandedClientId === client.id
                  return (
                    <div key={client.id}>
                      <div
                        onClick={() => toggleExpand(expandedClientId, client.id, setExpandedClientId)}
                        className="flex items-center gap-3 py-3 px-1 cursor-pointer transition-colors duration-150"
                        style={{ borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}` }}
                      >
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                        >
                          {getInitials(client.name)}
                        </div>

                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.name}</p>
                            {client.kycStatus === 'Verified' && (
                              <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.success }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${getRiskColor(client.riskProfile, colors)}15`, color: getRiskColor(client.riskProfile, colors) }}>
                              {client.riskProfile}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs" style={{ color: colors.textSecondary }}>{formatCurrency(client.aum)}</span>
                            <span className="text-xs" style={{ color: colors.textTertiary }}>|</span>
                            <span className="text-xs" style={{ color: colors.textSecondary }}>{client.sipCount} SIPs</span>
                          </div>
                        </div>

                        {/* Returns */}
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: client.returns >= 15 ? colors.success : colors.primary }}>
                            +{client.returns}%
                          </p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>{client.lastActive}</p>
                        </div>

                        {/* Chevron */}
                        <svg
                          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                          style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      {/* Expanded Detail Area */}
                      {isExpanded && (
                        <div
                          className="px-3 pb-3 pt-2 mb-1 rounded-b-xl"
                          style={{
                            background: isDark ? 'rgba(147, 197, 253, 0.03)' : 'rgba(59, 130, 246, 0.02)',
                            borderBottom: `1px solid ${colors.cardBorder}`,
                          }}
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-xs" style={{ color: colors.textTertiary }}>Email</p>
                              <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{client.email}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: colors.textTertiary }}>AUM</p>
                              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(client.aum)}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: colors.textTertiary }}>Goals</p>
                              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.goalsCount}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: colors.textTertiary }}>KYC Status</p>
                              <FAChip color={client.kycStatus === 'Verified' ? colors.success : colors.warning} size="xs">
                                {client.kycStatus}
                              </FAChip>
                            </div>
                            {client.familyRole && (
                              <div>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>Family Role</p>
                                <FAChip color={colors.secondary} size="xs">
                                  {client.familyRole === 'SELF' ? 'Head' : client.familyRole}
                                </FAChip>
                              </div>
                            )}
                            <div>
                              <p className="text-xs" style={{ color: colors.textTertiary }}>Active SIPs</p>
                              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.sipCount}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewClient(client.id) }}
                              className="px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:shadow"
                              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                            >
                              View Portfolio
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditClient(client) }}
                              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow"
                              style={{ background: `${colors.textTertiary}15`, color: colors.textSecondary }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewClient(client.id) }}
                              className="text-xs font-medium hover:underline ml-auto"
                              style={{ color: colors.primary }}
                            >
                              View Profile &rarr;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Family View — Grouped Expandable Rows */
              <div>
                {groupClientsByFamily(filteredClients).map((family) => {
                  const isExpanded = expandedFamilyId === family.id
                  return (
                    <div key={family.id}>
                      {/* Family Header Row */}
                      <div
                        onClick={() => toggleExpand(expandedFamilyId, family.id, setExpandedFamilyId)}
                        className="flex items-center gap-3 py-3 px-1 cursor-pointer transition-colors duration-150"
                        style={{ borderBottom: isExpanded ? 'none' : `1px solid ${colors.cardBorder}` }}
                      >
                        {/* Family Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                        </div>

                        {/* Family Name + Members Badge */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{family.name}</p>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                              {family.members.length} {family.members.length === 1 ? 'member' : 'members'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs" style={{ color: colors.textSecondary }}>{formatCurrency(family.totalAum)}</span>
                            <span className="text-xs" style={{ color: colors.textTertiary }}>|</span>
                            <span className="text-xs" style={{ color: colors.textSecondary }}>{family.totalSipCount} SIPs</span>
                          </div>
                        </div>

                        {/* Returns */}
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: family.avgReturns >= 15 ? colors.success : colors.primary }}>
                            +{family.avgReturns.toFixed(1)}%
                          </p>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>avg returns</p>
                        </div>

                        {/* Chevron */}
                        <svg
                          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                          style={{ color: colors.textTertiary, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      {/* Expanded: Member Sub-Rows */}
                      {isExpanded && (
                        <div
                          className="mb-1 rounded-b-xl"
                          style={{
                            background: isDark ? 'rgba(147, 197, 253, 0.03)' : 'rgba(59, 130, 246, 0.02)',
                            borderBottom: `1px solid ${colors.cardBorder}`,
                          }}
                        >
                          {family.members.map((member, memberIdx) => (
                            <div
                              key={member.id}
                              onClick={() => handleViewClient(member.id)}
                              className="flex items-center gap-3 py-2.5 pl-8 pr-3 cursor-pointer transition-colors duration-150 hover:opacity-80"
                              style={{
                                borderBottom: memberIdx < family.members.length - 1
                                  ? `1px solid ${isDark ? 'rgba(147, 197, 253, 0.06)' : 'rgba(59, 130, 246, 0.04)'}`
                                  : 'none',
                              }}
                            >
                              {/* Small Avatar */}
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                              >
                                {getInitials(member.name)}
                              </div>

                              {/* Name + Role */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{member.name}</p>
                                  {member.kycStatus === 'Verified' && (
                                    <svg className="w-3 h-3 flex-shrink-0" style={{ color: colors.success }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.secondary}15`, color: colors.secondary }}>
                                    {member.familyRole === 'SELF' ? 'Head' : member.familyRole || 'Member'}
                                  </span>
                                </div>
                                <p className="text-xs" style={{ color: colors.textSecondary }}>{formatCurrency(member.aum)}</p>
                              </div>

                              {/* Returns */}
                              <p className="text-sm font-semibold" style={{ color: member.returns >= 15 ? colors.success : colors.primary }}>
                                +{member.returns}%
                              </p>

                              {/* Chevron to detail */}
                              <svg
                                className="w-3.5 h-3.5 flex-shrink-0"
                                style={{ color: colors.textTertiary }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingClient(null)
        }}
        onSubmit={handleFormSubmit}
        mode={editingClient ? 'edit' : 'add'}
        initialData={editingClient ? {
          name: editingClient.name,
          email: editingClient.email,
          phone: editingClient.phone,
          pan: editingClient.pan || '',
          dateOfBirth: editingClient.dateOfBirth || '',
          address: editingClient.address || '',
          city: editingClient.city || '',
          state: editingClient.state || '',
          pincode: editingClient.pincode || '',
          riskProfile: editingClient.riskProfile,
          nominee: editingClient.nominee,
        } : undefined}
      />
    </AdvisorLayout>
  )
}

export default ClientsPage
