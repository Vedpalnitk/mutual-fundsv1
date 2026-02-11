import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency, getRiskColor } from '@/utils/fa'
import { Client, ClientFormData, RiskProfile, FamilyGroup } from '@/utils/faTypes'
import {
  FACard,
  FATintedCard,
  FAChip,
  FASearchInput,
  FASelect,
  FAButton,
  FAIconButton,
  FAEmptyState,
  FALoadingState,
} from '@/components/advisor/shared'
import ClientFormModal from '@/components/advisor/ClientFormModal'
import { clientsApi, FAPaginatedResponse } from '@/services/api'

// Mock client data (fallback when API is not available)
const mockClients: Client[] = [
  // Sharma Family
  { id: '1', name: 'Rajesh Sharma', email: 'rajesh.sharma@email.com', phone: '+91 98765 43210', aum: 4500000, returns: 18.5, riskProfile: 'Moderate', lastActive: '2 hours ago', sipCount: 3, goalsCount: 2, joinedDate: '2022-03-15', status: 'Active', kycStatus: 'Verified', familyGroupId: 'family-sharma', familyRole: 'SELF', familyHeadId: '1' },
  { id: '9', name: 'Sunita Sharma', email: 'sunita.sharma@email.com', phone: '+91 98765 43211', aum: 2200000, returns: 16.2, riskProfile: 'Moderate', lastActive: '1 day ago', sipCount: 2, goalsCount: 1, joinedDate: '2022-03-15', status: 'Active', kycStatus: 'Verified', familyGroupId: 'family-sharma', familyRole: 'SPOUSE', familyHeadId: '1' },
  { id: '10', name: 'Arjun Sharma', email: 'arjun.sharma@email.com', phone: '+91 98765 43212', aum: 800000, returns: 24.5, riskProfile: 'Aggressive', lastActive: '3 hours ago', sipCount: 1, goalsCount: 1, joinedDate: '2023-06-01', status: 'Active', kycStatus: 'Verified', familyGroupId: 'family-sharma', familyRole: 'CHILD', familyHeadId: '1' },
  // Patel Family
  { id: '2', name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+91 87654 32109', aum: 2800000, returns: 22.3, riskProfile: 'Aggressive', lastActive: '1 day ago', sipCount: 5, goalsCount: 3, joinedDate: '2021-08-22', status: 'Active', kycStatus: 'Verified', familyGroupId: 'family-patel', familyRole: 'SELF', familyHeadId: '2' },
  { id: '11', name: 'Vikram Patel', email: 'vikram.patel@email.com', phone: '+91 87654 32110', aum: 3500000, returns: 19.8, riskProfile: 'Moderate', lastActive: '5 hours ago', sipCount: 4, goalsCount: 2, joinedDate: '2021-08-22', status: 'Active', kycStatus: 'Verified', familyGroupId: 'family-patel', familyRole: 'SPOUSE', familyHeadId: '2' },
  // Individuals
  { id: '3', name: 'Amit Kumar', email: 'amit.kumar@email.com', phone: '+91 76543 21098', aum: 1200000, returns: 12.8, riskProfile: 'Conservative', lastActive: '3 days ago', sipCount: 2, goalsCount: 1, joinedDate: '2023-01-10', status: 'Active', kycStatus: 'Pending' },
  { id: '4', name: 'Sneha Gupta', email: 'sneha.gupta@email.com', phone: '+91 65432 10987', aum: 8900000, returns: 15.6, riskProfile: 'Moderate', lastActive: '5 hours ago', sipCount: 4, goalsCount: 4, joinedDate: '2020-11-05', status: 'Active', kycStatus: 'Verified' },
  { id: '5', name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '+91 54321 09876', aum: 3400000, returns: 20.1, riskProfile: 'Aggressive', lastActive: '1 hour ago', sipCount: 6, goalsCount: 2, joinedDate: '2022-06-18', status: 'Active', kycStatus: 'Verified' },
  { id: '6', name: 'Meera Krishnan', email: 'meera.k@email.com', phone: '+91 43210 98765', aum: 6200000, returns: 16.9, riskProfile: 'Moderate', lastActive: '4 hours ago', sipCount: 3, goalsCount: 3, joinedDate: '2021-02-28', status: 'Active', kycStatus: 'Verified' },
  { id: '8', name: 'Kavita Rao', email: 'kavita.rao@email.com', phone: '+91 21098 76543', aum: 5100000, returns: 19.8, riskProfile: 'Aggressive', lastActive: '6 hours ago', sipCount: 4, goalsCount: 2, joinedDate: '2021-09-30', status: 'Active', kycStatus: 'Verified' },
]

const SORT_OPTIONS = [
  { value: 'aum', label: 'Sort by AUM' },
  { value: 'name', label: 'Sort by Name' },
  { value: 'returns', label: 'Sort by Returns' },
]

const RISK_FILTER_OPTIONS = [
  { value: 'all', label: 'All Risk Profiles' },
  { value: 'Conservative', label: 'Conservative' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Aggressive', label: 'Aggressive' },
]

const ClientsPage = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'aum' | 'returns'>('aum')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewMode, setViewMode] = useState<'individual' | 'family'>('individual')

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
      console.log('[Clients] Fetching from API...')
      const response = await clientsApi.list<Client>({
        search: searchTerm || undefined,
        riskProfile: filterRisk !== 'all' ? filterRisk : undefined,
        sortBy: sortBy,
        sortOrder: sortBy === 'name' ? 'asc' : 'desc',
      })
      console.log('[Clients] API Response:', response)
      setClients(response.data)
    } catch (err) {
      // Fall back to mock data if API fails
      console.error('[Clients] API Error:', err)
      setError('Using demo data - API not available')
      setClients(mockClients)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterRisk, sortBy])

  // Initial load and refetch on filter changes
  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Client-side filtering for mock data (when API is not available)
  const filteredClients = error
    ? clients
        .filter(client => {
          const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               client.email.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesRisk = filterRisk === 'all' || client.riskProfile === filterRisk
          return matchesSearch && matchesRisk
        })
        .sort((a, b) => {
          if (sortBy === 'name') return a.name.localeCompare(b.name)
          if (sortBy === 'aum') return b.aum - a.aum
          if (sortBy === 'returns') return b.returns - a.returns
          return 0
        })
    : clients

  const totalAum = clients.reduce((sum, c) => sum + c.aum, 0)
  const avgReturns = clients.length > 0 ? clients.reduce((sum, c) => sum + c.returns, 0) / clients.length : 0

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
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div
              className="flex items-center p-1 rounded-full"
              style={{
                background: isDark ? 'rgba(147, 197, 253, 0.08)' : 'rgba(59, 130, 246, 0.06)',
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <button
                onClick={() => setViewMode('individual')}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: viewMode === 'individual'
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : 'transparent',
                  color: viewMode === 'individual' ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                Individual
              </button>
              <button
                onClick={() => setViewMode('family')}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: viewMode === 'family'
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : 'transparent',
                  color: viewMode === 'family' ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                Family
              </button>
            </div>
            <FAButton onClick={handleAddClient} icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }>
              Add Client
            </FAButton>
          </div>
        </div>

        {/* Summary Cards - Clean Flat Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {(() => {
            const familyGroups = groupClientsByFamily(clients)
            const familyCount = familyGroups.filter(f => f.members.length > 1).length
            const individualCount = familyGroups.filter(f => f.members.length === 1).length
            return [
              viewMode === 'family'
                ? { label: 'Families', value: `${familyCount} + ${individualCount}`, change: `${familyCount} families, ${individualCount} individuals`, icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', variant: 'primary' }
                : { label: 'Total Clients', value: clients.length.toString(), change: '+2 this month', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', variant: 'primary' },
              { label: 'Total AUM', value: formatCurrency(totalAum), change: '+8.5% MoM', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', variant: 'success' },
              { label: 'Avg Returns', value: `${avgReturns.toFixed(1)}%`, change: 'vs 12% benchmark', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', variant: 'secondary' },
              { label: 'Active SIPs', value: clients.reduce((sum, c) => sum + c.sipCount, 0).toString(), change: '28 this month', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', variant: 'accent' },
            ]
          })().map((stat, i) => {
            const getAccentColor = () => {
              switch (stat.variant) {
                case 'secondary': return colors.secondary;
                case 'success': return colors.success;
                case 'accent': return colors.primaryDark;
                default: return colors.primary;
              }
            };
            const accentColor = getAccentColor();
            return (
              <div
                key={i}
                className="p-4 rounded-lg"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${accentColor}12` }}
                  >
                    <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      {stat.label}
                    </p>
                    <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      {stat.value}
                    </p>
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                  {stat.change}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <FACard padding="md" className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <FASearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search clients by name or email..."
              />
            </div>
            <FASelect
              options={RISK_FILTER_OPTIONS}
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              containerClassName="w-48"
            />
            <FASelect
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'aum' | 'returns')}
              containerClassName="w-40"
            />
          </div>
        </FACard>

        {/* Clients List */}
        {loading ? (
          <FALoadingState message="Loading clients..." />
        ) : viewMode === 'individual' ? (
          /* Individual View */
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <FATintedCard
                key={client.id}
                padding="md"
                onClick={() => handleViewClient(client.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                    >
                      {getInitials(client.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{client.name}</h3>
                        {client.kycStatus === 'Verified' && (
                          <svg className="w-4 h-4" style={{ color: colors.success }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {client.familyGroupId && (
                          <FAChip color={colors.secondary} size="xs">
                            {client.familyRole === 'SELF' ? 'Head' : client.familyRole}
                          </FAChip>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{client.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <FAChip color={getRiskColor(client.riskProfile, colors)} size="xs">
                          {client.riskProfile}
                        </FAChip>
                        <span className="text-xs" style={{ color: colors.textTertiary }}>
                          Active {client.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>AUM</p>
                      <p className="font-bold" style={{ color: colors.textPrimary }}>{formatCurrency(client.aum)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Returns</p>
                      <p className="font-bold" style={{ color: client.returns >= 15 ? colors.success : colors.primary }}>
                        +{client.returns}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>SIPs</p>
                      <p className="font-bold" style={{ color: colors.textPrimary }}>{client.sipCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Goals</p>
                      <p className="font-bold" style={{ color: colors.textPrimary }}>{client.goalsCount}</p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <FAIconButton
                        title="View Portfolio"
                        variant="secondary"
                        onClick={() => handleViewClient(client.id)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </FAIconButton>
                      <FAIconButton title="Send Message" variant="secondary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </FAIconButton>
                      <FAIconButton
                        title="Edit Client"
                        variant="secondary"
                        onClick={() => handleEditClient(client)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </FAIconButton>
                    </div>
                  </div>
                </div>
              </FATintedCard>
            ))}
          </div>
        ) : (
          /* Family View */
          <div className="space-y-4">
            {groupClientsByFamily(filteredClients).map((family) => (
              <FACard key={family.id} padding="md">
                {/* Family Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                      style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
                    >
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{family.name}</h3>
                        <FAChip color={colors.primary} size="xs">
                          {family.members.length} {family.members.length === 1 ? 'member' : 'members'}
                        </FAChip>
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Head: {family.members.find(m => m.id === family.headId)?.name || family.members[0].name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Family AUM</p>
                      <p className="text-lg font-bold" style={{ color: colors.primary }}>{formatCurrency(family.totalAum)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Avg Returns</p>
                      <p className="font-bold" style={{ color: family.avgReturns >= 15 ? colors.success : colors.primary }}>
                        +{family.avgReturns.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Total SIPs</p>
                      <p className="font-bold" style={{ color: colors.textPrimary }}>{family.totalSipCount}</p>
                    </div>
                  </div>
                </div>

                {/* Family Members */}
                <div className="space-y-2 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                  {family.members.map((member) => (
                    <FATintedCard
                      key={member.id}
                      padding="sm"
                      onClick={() => handleViewClient(member.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                          >
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{member.name}</h4>
                              {member.kycStatus === 'Verified' && (
                                <svg className="w-3.5 h-3.5" style={{ color: colors.success }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              <FAChip color={colors.secondary} size="xs">
                                {member.familyRole === 'SELF' ? 'Head' : member.familyRole || 'Member'}
                              </FAChip>
                            </div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{formatCurrency(member.aum)}</p>
                            <p className="text-xs" style={{ color: member.returns >= 15 ? colors.success : colors.textTertiary }}>
                              +{member.returns}%
                            </p>
                          </div>
                          <FAChip color={getRiskColor(member.riskProfile, colors)} size="xs">
                            {member.riskProfile}
                          </FAChip>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <FAIconButton
                              title="View Portfolio"
                              variant="secondary"
                              onClick={() => handleViewClient(member.id)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </FAIconButton>
                            <FAIconButton
                              title="Edit Client"
                              variant="secondary"
                              onClick={() => handleEditClient(member)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </FAIconButton>
                          </div>
                        </div>
                      </div>
                    </FATintedCard>
                  ))}
                </div>
              </FACard>
            ))}
          </div>
        )}

        {!loading && filteredClients.length === 0 && (
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
        )}
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
