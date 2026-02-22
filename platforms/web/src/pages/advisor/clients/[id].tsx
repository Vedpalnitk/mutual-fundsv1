import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { clientsApi, portfolioApi, sipsApi, transactionsApi, goalsApi, notesApi, GoalResponse, MeetingNote, CreateNoteRequest } from '@/services/api'
import {
  useFATheme,
  formatCurrency,
  formatDate,
  getRiskColor,
} from '@/utils/fa'
import { Client, Holding, SIP, Goal, Transaction, TransactionType, TransactionFormData } from '@/utils/faTypes'
import {
  FACard,
  FAChip,
  FAButton,
  FAShareButton,
  useNotification,
} from '@/components/advisor/shared'
import TransactionFormModal from '@/components/advisor/TransactionFormModal'
import InsuranceTab from '@/components/clients/insurance/InsuranceTab'
import NoteFormModal from '@/components/advisor/NoteFormModal'
import {
  OverviewTab,
  FamilyTab,
  HoldingsTab,
  TransactionsTab,
  SipsTab,
  GoalsTab,
  ReportsTab,
  NotesTab,
} from '@/components/clients/tabs'

// Family member from backend
interface FamilyMember {
  id: string
  name: string
  relationship: string
  aum: number
  clientId: string
  holdingsCount: number
  sipCount: number
  returns: number
  kycStatus: string
  hasFolio: boolean
}

type TabId = 'overview' | 'family' | 'holdings' | 'transactions' | 'sips' | 'goals' | 'notes' | 'reports' | 'insurance' | 'bse'

const ClientDetailPage = () => {
  const router = useRouter()
  const { id } = router.query
  const { colors, isDark } = useFATheme()
  const notification = useNotification()
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // State for API data
  const [client, setClient] = useState<Client | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [sips, setSips] = useState<SIP[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allocationData, setAllocationData] = useState<{ assetClass: string; value: number; percentage: number; color: string }[]>([])

  // Notes state
  const [notes, setNotes] = useState<MeetingNote[]>([])
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  // Transaction modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>('Buy')
  const [submitting, setSubmitting] = useState(false)

  // Edit client profile state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    pan: '',
    address: '',
    city: '',
    riskProfile: '' as string,
  })
  const [editProfileSubmitting, setEditProfileSubmitting] = useState(false)

  // Quick action handlers
  const handleQuickAction = (type: TransactionType) => {
    setTransactionType(type)
    setShowTransactionModal(true)
  }

  // Helper to map SIP response
  const mapSip = (s: any, clientName: string): SIP => ({
    id: s.id,
    clientId: s.clientId,
    clientName,
    fundName: s.fundName,
    fundSchemeCode: s.fundSchemeCode,
    folioNumber: s.folioNumber,
    amount: Number(s.amount),
    frequency: s.frequency || 'Monthly',
    sipDate: s.sipDate,
    startDate: s.startDate?.split('T')[0] || '',
    status: s.status || 'Active',
    totalInstallments: s.totalInstallments || 0,
    completedInstallments: s.completedInstallments || 0,
    totalInvested: Number(s.totalInvested) || 0,
    currentValue: Number(s.currentValue) || 0,
    returns: Number(s.returns) || 0,
    returnsPercent: Number(s.returnsPct) || 0,
    nextSipDate: s.nextSipDate?.split('T')[0] || '',
    lastSipDate: s.lastSipDate?.split('T')[0] || '',
  })

  const handleTransactionSubmit = async (data: TransactionFormData) => {
    if (!client) return
    setSubmitting(true)

    try {
      const typeMap: Record<string, string> = {
        Buy: 'BUY', Sell: 'SELL', SIP: 'SIP',
        SWP: 'SWP', Switch: 'SWITCH', STP: 'STP',
      }

      if (data.type === 'SIP') {
        await sipsApi.create({
          clientId: client.id,
          fundName: data.fundName || '',
          fundSchemeCode: data.fundSchemeCode,
          folioNumber: data.folioNumber || undefined,
          amount: data.amount,
          frequency: (data.sipFrequency?.toUpperCase() || 'MONTHLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
          sipDate: data.sipDate || 5,
          startDate: data.sipStartDate || new Date().toISOString().split('T')[0],
          endDate: data.sipEndDate || undefined,
          isPerpetual: data.isPerpetual ?? true,
        })
        notification.success('SIP Recorded', 'SIP registration recorded successfully.')
      } else {
        const payload = {
          clientId: client.id,
          fundName: data.fundName || '',
          fundSchemeCode: data.fundSchemeCode,
          fundCategory: data.fundCategory || 'Equity',
          type: typeMap[data.type] || data.type,
          amount: data.amount,
          nav: data.nav || 0,
          folioNumber: data.folioNumber || 'NEW',
          date: new Date().toISOString().split('T')[0],
          paymentMode: data.paymentMode,
          remarks: data.remarks,
        }

        if (data.type === 'Sell' || data.type === 'SWP') {
          await transactionsApi.createRedemption(payload)
        } else {
          await transactionsApi.createLumpsum(payload)
        }

        const labels: Record<string, string> = {
          Buy: 'Purchase', Sell: 'Redemption', Switch: 'Switch', SWP: 'SWP', STP: 'STP',
        }
        notification.success(
          `${labels[data.type]} Recorded`,
          `${labels[data.type]} transaction recorded successfully.`
        )
      }

      setShowTransactionModal(false)

      // Refresh transactions list
      if (id && typeof id === 'string') {
        const txnsData = await transactionsApi.getByClient(id)
        setTransactions((txnsData || []).map((t: any) => ({
          id: t.id,
          clientId: t.clientId,
          clientName: client.name,
          type: t.type || 'Buy',
          fundName: t.fundName,
          fundSchemeCode: t.fundSchemeCode,
          fundCategory: t.fundCategory,
          folioNumber: t.folioNumber,
          amount: Number(t.amount),
          units: Number(t.units),
          nav: Number(t.nav),
          date: t.date?.split('T')[0] || '',
          status: t.status || 'Completed',
        })))

        if (data.type === 'SIP') {
          const sipsData = await sipsApi.getByClient(id)
          setSips(sipsData.map((s: any) => mapSip(s, client.name)))
        }
      }
    } catch (err) {
      notification.error('Transaction Failed', err instanceof Error ? err.message : 'Failed to process transaction')
    } finally {
      setSubmitting(false)
    }
  }

  // SIP action handler (passed to SipsTab)
  const handleSipAction = async (sipId: string, action: 'pause' | 'resume' | 'cancel') => {
    if (!id || typeof id !== 'string' || !client) return
    try {
      if (action === 'pause') {
        await sipsApi.pause(sipId)
        notification.success('SIP Paused', 'SIP has been paused successfully.')
      } else if (action === 'resume') {
        await sipsApi.resume(sipId)
        notification.success('SIP Resumed', 'SIP has been resumed successfully.')
      } else {
        if (!confirm('Are you sure you want to cancel this SIP? This action cannot be undone.')) return
        await sipsApi.cancel(sipId)
        notification.success('SIP Cancelled', 'SIP has been cancelled successfully.')
      }
      const sipsData = await sipsApi.getByClient(id)
      setSips(sipsData.map((s: any) => mapSip(s, client.name)))
    } catch (err) {
      notification.error('Action Failed', err instanceof Error ? err.message : `Failed to ${action} SIP`)
    }
  }

  // Fetch client data from API
  useEffect(() => {
    if (!id || typeof id !== 'string') return

    const fetchClientData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch client details (includes familyMembers)
        const clientData = await clientsApi.getById<any>(id)
        setClient({
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          pan: clientData.pan || '',
          dateOfBirth: clientData.dateOfBirth || '',
          address: clientData.address || '',
          city: clientData.city || '',
          state: clientData.state || '',
          pincode: clientData.pincode || '',
          aum: clientData.aum || 0,
          returns: clientData.returns || 0,
          riskProfile: clientData.riskProfile || 'Moderate',
          lastActive: clientData.lastActive || 'Recently',
          sipCount: clientData.sipCount || 0,
          goalsCount: clientData.goalsCount || 0,
          joinedDate: clientData.joinedDate || '',
          status: clientData.status || 'Active',
          kycStatus: clientData.kycStatus || 'Pending',
          nominee: clientData.nominee,
        })

        // Set family members from client response
        if (clientData.familyMembers && Array.isArray(clientData.familyMembers)) {
          setFamilyMembers(clientData.familyMembers)
        }

        // Fetch all sub-resources in parallel
        const [holdingsResult, allocResult, sipsResult, txnsResult, goalsResult, notesResult] =
          await Promise.allSettled([
            portfolioApi.getClientHoldings(id),
            portfolioApi.getAssetAllocation(id),
            sipsApi.getByClient(id),
            transactionsApi.getByClient(id),
            goalsApi.getByClient(id),
            notesApi.getByClient(id),
          ])

        if (holdingsResult.status === 'fulfilled') {
          setHoldings((holdingsResult.value as any[]).map((h: any) => ({
            id: h.id,
            fundName: h.fundName,
            fundSchemeCode: h.fundSchemeCode,
            fundCategory: h.fundCategory,
            assetClass: h.assetClass || h.category || 'Equity',
            folioNumber: h.folioNumber,
            units: Number(h.units),
            avgNav: Number(h.avgNav),
            currentNav: Number(h.currentNav),
            investedValue: Number(h.investedValue),
            currentValue: Number(h.currentValue),
            absoluteGain: Number(h.absoluteGain) || 0,
            absoluteGainPercent: Number(h.absoluteGainPct) || 0,
            xirr: Number(h.xirr) || 0,
            lastTransactionDate: h.lastTxnDate?.split('T')[0] || '',
          })))
        } else { setHoldings([]) }

        if (allocResult.status === 'fulfilled') {
          setAllocationData(allocResult.value)
        } else { setAllocationData([]) }

        if (sipsResult.status === 'fulfilled') {
          setSips((sipsResult.value as any[]).map((s: any) => mapSip(s, clientData.name)))
        } else { setSips([]) }

        if (txnsResult.status === 'fulfilled') {
          setTransactions(((txnsResult.value || []) as any[]).map((t: any) => ({
            id: t.id,
            clientId: t.clientId,
            clientName: clientData.name,
            type: t.type || 'Buy',
            fundName: t.fundName,
            fundSchemeCode: t.fundSchemeCode,
            fundCategory: t.fundCategory,
            folioNumber: t.folioNumber,
            amount: Number(t.amount),
            units: Number(t.units),
            nav: Number(t.nav),
            date: t.date?.split('T')[0] || '',
            status: t.status || 'Completed',
          })))
        } else { setTransactions([]) }

        if (goalsResult.status === 'fulfilled') {
          setGoals((goalsResult.value || []).map((g: GoalResponse) => ({
            id: g.id,
            clientId: g.clientId || id,
            name: g.name,
            type: (g.category || 'Other') as Goal['type'],
            targetAmount: Number(g.targetAmount),
            currentValue: Number(g.currentAmount) || 0,
            targetDate: g.targetDate?.split('T')[0] || '',
            startDate: g.createdAt?.split('T')[0] || '',
            priority: g.priority === 1 ? 'High' : g.priority === 2 ? 'Medium' : 'Low',
            monthlyRequired: Number(g.monthlySip) || 0,
            onTrack: g.status === 'ON_TRACK' || g.progress >= 50,
            progressPercent: Number(g.progress) || 0,
            linkedSIPs: [],
            linkedHoldings: g.linkedFundCodes || [],
            projectedValue: Number(g.targetAmount) || 0,
            notes: g.notes || undefined,
          })))
        } else { setGoals([]) }

        if (notesResult.status === 'fulfilled') {
          setNotes(notesResult.value || [])
        } else { setNotes([]) }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load client data')
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [id])

  // Show loading state
  if (loading) {
    return (
      <AdvisorLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }} />
        </div>
      </AdvisorLayout>
    )
  }

  // Show error state
  if (error && !client) {
    return (
      <AdvisorLayout title="Error">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/advisor/clients')}
            className="px-4 py-2 rounded-lg"
            style={{ background: colors.primary, color: '#fff' }}
          >
            Back to Clients
          </button>
        </div>
      </AdvisorLayout>
    )
  }

  if (!client) return null

  const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0)
  const totalCurrent = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalGain = totalCurrent - totalInvested
  const overallReturn = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'family', label: 'Family', count: familyMembers.length },
    { id: 'holdings', label: 'Holdings', count: holdings.length },
    { id: 'transactions', label: 'Transactions', count: transactions.length },
    { id: 'sips', label: 'SIPs', count: sips.length },
    { id: 'goals', label: 'Goals', count: goals.length },
    { id: 'notes', label: 'Notes', count: notes.length },
    { id: 'reports', label: 'Reports' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'bse', label: 'BSE' },
  ]

  return (
    <AdvisorLayout title={`Client: ${client.name}`}>
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Back Button */}
        <Link href="/advisor/clients" className="inline-flex items-center gap-2 text-sm mb-6 transition-all hover:opacity-80" style={{ color: colors.primary }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Link>

        {/* Client Header */}
        <FACard padding="lg" className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
              >
                {client.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{client.name}</h1>
                  {client.kycStatus === 'Verified' && (
                    <FAChip color={colors.success} size="sm">KYC Verified</FAChip>
                  )}
                  <FAChip color={getRiskColor(client.riskProfile, colors)} size="sm">
                    {client.riskProfile}
                  </FAChip>
                  <FAShareButton
                    clientId={client.id}
                    clientName={client.name}
                    label="Share"
                  />
                </div>
                <div className="flex items-center flex-wrap gap-x-6 gap-y-1 mt-2 text-sm" style={{ color: colors.textSecondary }}>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {client.email}
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {client.phone}
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Client since {formatDate(client.joinedDate)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FAButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (client) {
                    setEditProfileForm({
                      name: client.name,
                      email: client.email,
                      phone: client.phone,
                      pan: client.pan || '',
                      address: client.address || '',
                      city: client.city || '',
                      riskProfile: client.riskProfile,
                    })
                    setShowEditProfileModal(true)
                  }
                }}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
              >
                Edit
              </FAButton>
              <FAButton
                size="sm"
                onClick={() => handleQuickAction('Buy')}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Transaction
              </FAButton>
            </div>
          </div>

          {/* Portfolio Stats Row */}
          <div
            className="flex items-center gap-6 mt-5 pt-5"
            style={{ borderTop: `1px solid ${colors.cardBorder}` }}
          >
            {[
              { label: 'Invested', value: formatCurrency(totalInvested) },
              { label: 'Current Value', value: formatCurrency(totalCurrent) },
              { label: 'Gain/Loss', value: `${totalGain >= 0 ? '+' : ''}${formatCurrency(totalGain)}`, color: totalGain >= 0 ? colors.success : colors.error },
              { label: 'Returns', value: `${overallReturn >= 0 ? '+' : ''}${overallReturn.toFixed(1)}%`, color: overallReturn >= 0 ? colors.success : colors.error },
              { label: 'Monthly SIP', value: formatCurrency(sips.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.amount, 0)) },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-6">
                {i > 0 && (
                  <div className="w-px h-8" style={{ background: colors.cardBorder }} />
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.textTertiary }}>{stat.label}</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: stat.color || colors.textPrimary }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </FACard>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap"
              style={{
                background: activeTab === tab.id
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.chipBg,
                color: activeTab === tab.id ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : colors.cardBorder,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending Actions Banner */}
        {client && (client.status === 'Pending KYC' || client.kycStatus === 'Pending') && (
          <div
            className="mb-4 p-3 rounded-xl flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${colors.warning}15 0%, ${colors.warning}08 100%)`,
              border: `1px solid ${colors.warning}25`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${colors.warning}20` }}
              >
                <svg className="w-4 h-4" style={{ color: colors.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Pending Actions</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {client.kycStatus === 'Pending' ? 'KYC verification pending' : 'Client has pending actions'}
                </p>
              </div>
            </div>
            <Link
              href="/advisor/command-center"
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.warning}DD 100%)`,
                color: '#FFFFFF',
              }}
            >
              View
            </Link>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab client={client} clientId={id as string} holdings={holdings} sips={sips} allocationData={allocationData} onTabChange={setActiveTab} />
        )}

        {activeTab === 'family' && (
          <FamilyTab client={client} familyMembers={familyMembers} />
        )}

        {activeTab === 'holdings' && (
          <HoldingsTab client={client} holdings={holdings} />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab client={client} transactions={transactions} />
        )}

        {activeTab === 'sips' && (
          <SipsTab client={client} sips={sips} onSipAction={handleSipAction} onNewSip={() => handleQuickAction('SIP')} />
        )}

        {activeTab === 'goals' && (
          <GoalsTab client={client} goals={goals} holdings={holdings} onGoalsChange={setGoals} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab client={client} clientId={id as string} />
        )}

        {activeTab === 'notes' && (
          <NotesTab
            client={client}
            clientId={id as string}
            notes={notes}
            onNotesChange={setNotes}
            onAddNote={() => setShowNoteModal(true)}
          />
        )}

        {activeTab === 'insurance' && id && (
          <InsuranceTab clientId={id as string} />
        )}

        {/* BSE Registration Tab */}
        {activeTab === 'bse' && id && (
          <div className="space-y-6">
            <FACard padding="md">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${colors.primary}15`, color: colors.primary }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: colors.textPrimary }}>BSE StAR MF Registration</h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Register this client with BSE to enable live transactions
                    </p>
                  </div>
                </div>
                <a
                  href={`/advisor/bse/clients/${id}/register`}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    boxShadow: `0 4px 14px ${colors.glassShadow}`,
                  }}
                >
                  Register / Update
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className="p-4 rounded-xl"
                  style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>UCC Status</p>
                  <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Check BSE Clients page</p>
                </div>
                <div
                  className="p-4 rounded-xl"
                  style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>FATCA</p>
                  <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>--</p>
                </div>
                <div
                  className="p-4 rounded-xl"
                  style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textTertiary }}>CKYC</p>
                  <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>--</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <a
                  href="/advisor/bse/clients"
                  className="text-sm font-medium hover:underline"
                  style={{ color: colors.primary }}
                >
                  View all BSE registrations
                </a>
                <span style={{ color: colors.textTertiary }}>|</span>
                <a
                  href="/advisor/bse/mandates"
                  className="text-sm font-medium hover:underline"
                  style={{ color: colors.primary }}
                >
                  Mandates
                </a>
                <span style={{ color: colors.textTertiary }}>|</span>
                <a
                  href="/advisor/bse/orders"
                  className="text-sm font-medium hover:underline"
                  style={{ color: colors.primary }}
                >
                  Orders
                </a>
              </div>
            </FACard>
          </div>
        )}
      </div>

      {/* Note Form Modal */}
      <NoteFormModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        submitting={noteSubmitting}
        onSubmit={async (data: CreateNoteRequest) => {
          if (!id || typeof id !== 'string') return
          setNoteSubmitting(true)
          try {
            const newNote = await notesApi.create(id, data)
            setNotes(prev => [newNote, ...prev])
            setShowNoteModal(false)
            notification.success('Note Added', 'Meeting note has been saved.')
          } catch (err) {
            notification.error('Save Failed', err instanceof Error ? err.message : 'Failed to save note')
          } finally {
            setNoteSubmitting(false)
          }
        }}
      />

      {/* Transaction Modal */}
      {client && (
        <TransactionFormModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSubmit={handleTransactionSubmit}
          clientId={client.id}
          clientName={client.name}
          initialType={transactionType}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && client && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-lg rounded-2xl p-6 mx-4"
            style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 24px 48px rgba(0,0,0,0.2)` }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Edit Client Profile</h2>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                style={{ color: colors.textTertiary }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Full Name</label>
                <input
                  type="text"
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Email</label>
                  <input
                    type="email"
                    value={editProfileForm.email}
                    onChange={(e) => setEditProfileForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Phone</label>
                  <input
                    type="tel"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>PAN</label>
                  <input
                    type="text"
                    value={editProfileForm.pan}
                    onChange={(e) => setEditProfileForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Risk Profile</label>
                  <select
                    value={editProfileForm.riskProfile}
                    onChange={(e) => setEditProfileForm(f => ({ ...f, riskProfile: e.target.value }))}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Aggressive">Aggressive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Address</label>
                <input
                  type="text"
                  value={editProfileForm.address}
                  onChange={(e) => setEditProfileForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>City</label>
                <input
                  type="text"
                  value={editProfileForm.city}
                  onChange={(e) => setEditProfileForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
              <FAButton variant="secondary" size="sm" onClick={() => setShowEditProfileModal(false)}>
                Cancel
              </FAButton>
              <FAButton
                size="sm"
                disabled={editProfileSubmitting || !editProfileForm.name || !editProfileForm.email}
                onClick={async () => {
                  setEditProfileSubmitting(true)
                  try {
                    await clientsApi.update(client.id, {
                      name: editProfileForm.name,
                      email: editProfileForm.email,
                      phone: editProfileForm.phone,
                      pan: editProfileForm.pan || undefined,
                      address: editProfileForm.address || undefined,
                      city: editProfileForm.city || undefined,
                      riskProfile: editProfileForm.riskProfile as any,
                    })
                    setClient({
                      ...client,
                      name: editProfileForm.name,
                      email: editProfileForm.email,
                      phone: editProfileForm.phone,
                      pan: editProfileForm.pan,
                      address: editProfileForm.address,
                      city: editProfileForm.city,
                      riskProfile: editProfileForm.riskProfile as any,
                    })
                    notification.success('Profile updated successfully')
                    setShowEditProfileModal(false)
                  } catch {
                    notification.error('Failed to update profile')
                  } finally {
                    setEditProfileSubmitting(false)
                  }
                }}
              >
                {editProfileSubmitting ? 'Saving...' : 'Save Changes'}
              </FAButton>
            </div>
          </div>
        </div>
      )}
    </AdvisorLayout>
  )
}

export default ClientDetailPage
