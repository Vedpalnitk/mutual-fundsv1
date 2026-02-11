import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { clientsApi, portfolioApi, sipsApi, transactionsApi, goalsApi, GoalResponse } from '@/services/api'
import {
  useFATheme,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  getRiskColor,
  getTransactionTypeColor,
  getAssetClassColor,
} from '@/utils/fa'
import { Client, Holding, SIP, Goal, Transaction, TransactionType, TransactionFormData } from '@/utils/faTypes'
import {
  FACard,
  FATintedCard,
  FAChip,
  FAButton,
  FAIconButton,
  FASectionHeader,
  FAEmptyState,
  useNotification,
} from '@/components/advisor/shared'
import TransactionFormModal from '@/components/advisor/TransactionFormModal'
import AssetAllocationChart from '@/components/advisor/AssetAllocationChart'
import PortfolioValueChart from '@/components/advisor/PortfolioValueChart'

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

// Filter/sort types
type HoldingCategory = 'All' | 'Equity' | 'Debt' | 'Hybrid' | 'ELSS' | 'Others'
type HoldingSort = 'value-desc' | 'value-asc' | 'returns-desc' | 'returns-asc'
type TxnTypeFilter = 'All' | 'Buy' | 'Sell' | 'SIP' | 'Switch' | 'SWP' | 'STP'
type TxnStatusFilter = 'All' | 'Pending' | 'Completed' | 'Failed'
type TxnSort = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

type TabId = 'overview' | 'family' | 'holdings' | 'transactions' | 'sips' | 'goals' | 'reports'

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

  // Transaction modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>('Buy')
  const [submitting, setSubmitting] = useState(false)

  // SIP action loading state
  const [sipActionLoading, setSipActionLoading] = useState<string | null>(null)

  // Filter/sort states
  const [holdingCategory, setHoldingCategory] = useState<HoldingCategory>('All')
  const [holdingSort, setHoldingSort] = useState<HoldingSort>('value-desc')
  const [txnTypeFilter, setTxnTypeFilter] = useState<TxnTypeFilter>('All')
  const [txnStatusFilter, setTxnStatusFilter] = useState<TxnStatusFilter>('All')
  const [txnSort, setTxnSort] = useState<TxnSort>('date-desc')

  // Report state
  const [reportType, setReportType] = useState<string>('portfolio-statement')
  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')

  // Quick action handlers
  const handleQuickAction = (type: TransactionType) => {
    setTransactionType(type)
    setShowTransactionModal(true)
  }

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

  // SIP actions
  const handleSipPause = async (sipId: string) => {
    setSipActionLoading(sipId)
    try {
      await sipsApi.pause(sipId)
      notification.success('SIP Paused', 'SIP has been paused successfully.')
      // Refresh SIPs
      if (id && typeof id === 'string' && client) {
        const sipsData = await sipsApi.getByClient(id)
        setSips(sipsData.map((s: any) => mapSip(s, client.name)))
      }
    } catch (err) {
      notification.error('Action Failed', err instanceof Error ? err.message : 'Failed to pause SIP')
    } finally {
      setSipActionLoading(null)
    }
  }

  const handleSipResume = async (sipId: string) => {
    setSipActionLoading(sipId)
    try {
      await sipsApi.resume(sipId)
      notification.success('SIP Resumed', 'SIP has been resumed successfully.')
      if (id && typeof id === 'string' && client) {
        const sipsData = await sipsApi.getByClient(id)
        setSips(sipsData.map((s: any) => mapSip(s, client.name)))
      }
    } catch (err) {
      notification.error('Action Failed', err instanceof Error ? err.message : 'Failed to resume SIP')
    } finally {
      setSipActionLoading(null)
    }
  }

  const handleSipCancel = async (sipId: string) => {
    if (!confirm('Are you sure you want to cancel this SIP? This action cannot be undone.')) return
    setSipActionLoading(sipId)
    try {
      await sipsApi.cancel(sipId)
      notification.success('SIP Cancelled', 'SIP has been cancelled successfully.')
      if (id && typeof id === 'string' && client) {
        const sipsData = await sipsApi.getByClient(id)
        setSips(sipsData.map((s: any) => mapSip(s, client.name)))
      }
    } catch (err) {
      notification.error('Action Failed', err instanceof Error ? err.message : 'Failed to cancel SIP')
    } finally {
      setSipActionLoading(null)
    }
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

        // Fetch holdings
        try {
          const holdingsData = await portfolioApi.getClientHoldings(id)
          setHoldings((holdingsData as any[]).map((h: any) => ({
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
            absoluteGain: Number(h.absoluteGain),
            absoluteGainPercent: Number(h.absoluteGainPct),
            xirr: Number(h.xirr) || 0,
            lastTransactionDate: h.lastTxnDate?.split('T')[0] || '',
          })))
        } catch {
          setHoldings([])
        }

        // Fetch asset allocation
        try {
          const allocData = await portfolioApi.getAssetAllocation(id)
          setAllocationData(allocData)
        } catch {
          setAllocationData([])
        }

        // Fetch SIPs
        try {
          const sipsData = await sipsApi.getByClient(id)
          setSips((sipsData as any[]).map((s: any) => mapSip(s, clientData.name)))
        } catch {
          setSips([])
        }

        // Fetch transactions
        try {
          const txnsData = await transactionsApi.getByClient(id)
          setTransactions(((txnsData || []) as any[]).map((t: any) => ({
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
        } catch {
          setTransactions([])
        }

        // Fetch goals
        try {
          const goalsData = await goalsApi.getByClient(id)
          setGoals((goalsData || []).map((g: GoalResponse) => ({
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
        } catch {
          setGoals([])
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load client data')
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [id])

  // Filtered & sorted holdings
  const filteredHoldings = useMemo(() => {
    let result = [...holdings]

    // Category filter
    if (holdingCategory !== 'All') {
      if (holdingCategory === 'ELSS') {
        result = result.filter(h => h.fundCategory?.toLowerCase().includes('elss') || h.fundCategory?.toLowerCase().includes('tax'))
      } else if (holdingCategory === 'Others') {
        result = result.filter(h => !['Equity', 'Debt', 'Hybrid'].includes(h.assetClass) && !h.fundCategory?.toLowerCase().includes('elss'))
      } else {
        result = result.filter(h => h.assetClass === holdingCategory)
      }
    }

    // Sort
    switch (holdingSort) {
      case 'value-desc': result.sort((a, b) => b.currentValue - a.currentValue); break
      case 'value-asc': result.sort((a, b) => a.currentValue - b.currentValue); break
      case 'returns-desc': result.sort((a, b) => b.absoluteGainPercent - a.absoluteGainPercent); break
      case 'returns-asc': result.sort((a, b) => a.absoluteGainPercent - b.absoluteGainPercent); break
    }

    return result
  }, [holdings, holdingCategory, holdingSort])

  // Filtered & sorted transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    if (txnTypeFilter !== 'All') {
      result = result.filter(t => t.type === txnTypeFilter)
    }
    if (txnStatusFilter !== 'All') {
      result = result.filter(t => t.status === txnStatusFilter)
    }

    switch (txnSort) {
      case 'date-desc': result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); break
      case 'date-asc': result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); break
      case 'amount-desc': result.sort((a, b) => b.amount - a.amount); break
      case 'amount-asc': result.sort((a, b) => a.amount - b.amount); break
    }

    return result
  }, [transactions, txnTypeFilter, txnStatusFilter, txnSort])

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
    { id: 'reports', label: 'Reports' },
  ]

  const getSipStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return colors.success
      case 'Paused': return colors.warning
      case 'Cancelled': case 'Failed': return colors.error
      default: return colors.textTertiary
    }
  }

  const getRelationshipLabel = (rel: string) => {
    const map: Record<string, string> = { SELF: 'Self', SPOUSE: 'Spouse', CHILD: 'Child', PARENT: 'Parent', SIBLING: 'Sibling' }
    return map[rel] || rel
  }

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
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: colors.textSecondary }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {client.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {client.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Client since {formatDate(client.joinedDate)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FAButton variant="secondary" icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }>
                Edit Profile
              </FAButton>
              <FAButton
                onClick={() => handleQuickAction('Buy')}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                New Transaction
              </FAButton>
            </div>
          </div>
        </FACard>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <FACard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
              Total Invested
            </p>
            <p className="text-xl font-bold mt-1" style={{ color: colors.textPrimary }}>
              {formatCurrency(totalInvested)}
            </p>
          </FACard>
          <FACard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
              Current Value
            </p>
            <p className="text-xl font-bold mt-1" style={{ color: colors.textPrimary }}>
              {formatCurrency(totalCurrent)}
            </p>
          </FACard>
          <FACard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
              Total Gain
            </p>
            <p className="text-xl font-bold mt-1" style={{ color: totalGain >= 0 ? colors.success : colors.error }}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
            </p>
          </FACard>
          <FACard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
              Returns
            </p>
            <p className="text-xl font-bold mt-1" style={{ color: overallReturn >= 0 ? colors.success : colors.error }}>
              {overallReturn >= 0 ? '+' : ''}{overallReturn.toFixed(1)}%
            </p>
          </FACard>
          <FACard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
              Monthly SIP
            </p>
            <p className="text-xl font-bold mt-1" style={{ color: colors.textPrimary }}>
              {formatCurrency(sips.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.amount, 0))}
            </p>
          </FACard>
        </div>

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

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2 space-y-6">
              {/* Portfolio Value Chart */}
              {id && typeof id === 'string' && (
                <FACard padding="md">
                  <FASectionHeader title="Portfolio Value" />
                  <PortfolioValueChart clientId={id} />
                </FACard>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FACard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                      <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>Holdings</p>
                      <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{holdings.length}</p>
                    </div>
                  </div>
                </FACard>
                <FACard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${colors.success}15` }}>
                      <svg className="w-5 h-5" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>Active SIPs</p>
                      <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{sips.filter(s => s.status === 'Active').length}</p>
                    </div>
                  </div>
                </FACard>
                <FACard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${colors.secondary}15` }}>
                      <svg className="w-5 h-5" style={{ color: colors.secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>Goals</p>
                      <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{goals.length}</p>
                    </div>
                  </div>
                </FACard>
                <FACard padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${colors.warning}15` }}>
                      <svg className="w-5 h-5" style={{ color: colors.warning }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>Risk Profile</p>
                      <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{client.riskProfile}</p>
                    </div>
                  </div>
                </FACard>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Asset Allocation */}
              <FACard padding="md">
                <FASectionHeader title="Asset Allocation" />
                {allocationData.length > 0 ? (
                  <AssetAllocationChart allocation={allocationData} height={240} />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(holdings.reduce((acc, h) => {
                      acc[h.assetClass] = (acc[h.assetClass] || 0) + h.currentValue
                      return acc
                    }, {} as Record<string, number>)).map(([asset, value]) => {
                      const percentage = totalCurrent > 0 ? (value / totalCurrent) * 100 : 0
                      return (
                        <div key={asset}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm" style={{ color: colors.textPrimary }}>{asset}</span>
                            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                background: asset === 'Equity' ? colors.primary : asset === 'Debt' ? colors.secondary : colors.warning,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </FACard>

              {/* Client Details */}
              <FACard padding="md">
                <FASectionHeader title="Client Details" />
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>PAN</p>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.pan || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Date of Birth</p>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.dateOfBirth ? formatDate(client.dateOfBirth) : 'N/A'}</p>
                  </div>
                  {client.address && (
                    <div>
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Address</p>
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {client.address}, {client.city}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {client.state} - {client.pincode}
                      </p>
                    </div>
                  )}
                  {client.nominee && (
                    <div>
                      <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Nominee</p>
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.nominee.name}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {client.nominee.relationship} ({client.nominee.percentage}%)
                      </p>
                    </div>
                  )}
                </div>
              </FACard>

              {/* Quick Actions */}
              <FACard padding="md">
                <FASectionHeader title="Quick Actions" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'New SIP', icon: 'M12 4v16m8-8H4', type: 'SIP' as TransactionType },
                    { label: 'Lumpsum', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', type: 'Buy' as TransactionType },
                    { label: 'Redeem', icon: 'M20 12H4', type: 'Sell' as TransactionType },
                    { label: 'Switch', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', type: 'Switch' as TransactionType },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.type)}
                      className="p-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-2 hover:scale-105 hover:shadow-md cursor-pointer"
                      style={{
                        background: isDark ? 'rgba(147, 197, 253, 0.08)' : 'rgba(59, 130, 246, 0.04)',
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                      </svg>
                      <span style={{ color: colors.textPrimary }}>{action.label}</span>
                    </button>
                  ))}
                </div>
              </FACard>
            </div>
          </div>
        )}

        {/* ==================== FAMILY TAB ==================== */}
        {activeTab === 'family' && (
          <FACard padding="md">
            <FASectionHeader title="Family Members" />
            {familyMembers.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
                title="No Family Members"
                description="This client is not part of a family group"
              />
            ) : (
              <div className="space-y-3">
                {familyMembers.map((member) => (
                  <FATintedCard
                    key={member.id}
                    padding="md"
                    accentColor={member.relationship === 'SELF' ? colors.primary : colors.secondary}
                    onClick={() => router.push(`/advisor/clients/${member.clientId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ background: `linear-gradient(135deg, ${member.relationship === 'SELF' ? colors.primary : colors.secondary} 0%, ${member.relationship === 'SELF' ? colors.primaryDark : colors.secondaryDark} 100%)` }}
                        >
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{member.name}</p>
                            <FAChip
                              size="xs"
                              color={member.relationship === 'SELF' ? colors.primary : colors.secondary}
                            >
                              {getRelationshipLabel(member.relationship)}
                            </FAChip>
                            {member.kycStatus === 'VERIFIED' && (
                              <FAChip size="xs" color={colors.success}>KYC</FAChip>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: colors.textTertiary }}>
                            <span>{member.holdingsCount} holdings</span>
                            <span>{member.sipCount} SIPs</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold" style={{ color: colors.textPrimary }}>
                          {formatCurrency(member.aum)}
                        </p>
                        <p className="text-sm" style={{ color: member.returns >= 0 ? colors.success : colors.error }}>
                          {member.returns >= 0 ? '+' : ''}{member.returns.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </FATintedCard>
                ))}

                {/* Family Total */}
                <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Family Total AUM</p>
                    <p className="text-lg font-bold" style={{ color: colors.primary }}>
                      {formatCurrency(familyMembers.reduce((sum, m) => sum + m.aum, 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </FACard>
        )}

        {/* ==================== HOLDINGS TAB ==================== */}
        {activeTab === 'holdings' && (
          <FACard padding="md">
            <FASectionHeader title="Portfolio Holdings" />

            {/* Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {(['All', 'Equity', 'Debt', 'Hybrid', 'ELSS', 'Others'] as HoldingCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setHoldingCategory(cat)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: holdingCategory === cat
                        ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                        : colors.chipBg,
                      color: holdingCategory === cat ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <select
                value={holdingSort}
                onChange={(e) => setHoldingSort(e.target.value as HoldingSort)}
                className="px-3 py-1.5 rounded-md text-xs font-medium focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
              >
                <option value="value-desc">Value: High to Low</option>
                <option value="value-asc">Value: Low to High</option>
                <option value="returns-desc">Returns: High to Low</option>
                <option value="returns-asc">Returns: Low to High</option>
              </select>
            </div>

            {filteredHoldings.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
                title="No Holdings Found"
                description={holdingCategory !== 'All' ? `No ${holdingCategory} holdings found` : 'No portfolio holdings yet'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                      <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Fund Name</th>
                      <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Category</th>
                      <th className="text-right py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Units</th>
                      <th className="text-right py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>NAV</th>
                      <th className="text-right py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Current Value</th>
                      <th className="text-right py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHoldings.map((holding) => (
                      <tr key={holding.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                        <td className="py-3 pr-4">
                          <div>
                            <p className="font-medium" style={{ color: colors.textPrimary }}>{holding.fundName}</p>
                            {holding.fundCategory && <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{holding.fundCategory}</p>}
                          </div>
                        </td>
                        <td className="py-3 pr-4"><FAChip size="xs">{holding.assetClass}</FAChip></td>
                        <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{holding.units.toFixed(2)}</td>
                        <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{formatCurrency(holding.currentNav)}</td>
                        <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(holding.currentValue)}</td>
                        <td className="py-3 text-right">
                          <span className="font-medium" style={{ color: holding.absoluteGainPercent >= 0 ? colors.success : colors.error }}>
                            {holding.absoluteGainPercent >= 0 ? '+' : ''}{holding.absoluteGainPercent.toFixed(1)}%
                          </span>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>{formatCurrencyCompact(holding.absoluteGain)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FACard>
        )}

        {/* ==================== TRANSACTIONS TAB ==================== */}
        {activeTab === 'transactions' && (
          <FACard padding="md">
            <FASectionHeader title="Transactions" />

            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {(['All', 'Buy', 'Sell', 'SIP', 'Switch', 'SWP', 'STP'] as TxnTypeFilter[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setTxnTypeFilter(type)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: txnTypeFilter === type
                          ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                          : colors.chipBg,
                        color: txnTypeFilter === type ? '#FFFFFF' : colors.textSecondary,
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {(['All', 'Pending', 'Completed', 'Failed'] as TxnStatusFilter[]).map(status => (
                    <button
                      key={status}
                      onClick={() => setTxnStatusFilter(status)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: txnStatusFilter === status
                          ? `${status === 'Completed' ? colors.success : status === 'Failed' ? colors.error : status === 'Pending' ? colors.warning : colors.primary}20`
                          : colors.chipBg,
                        color: txnStatusFilter === status
                          ? (status === 'Completed' ? colors.success : status === 'Failed' ? colors.error : status === 'Pending' ? colors.warning : colors.textSecondary)
                          : colors.textSecondary,
                        border: txnStatusFilter === status ? `1px solid ${status === 'Completed' ? colors.success : status === 'Failed' ? colors.error : status === 'Pending' ? colors.warning : colors.primary}40` : '1px solid transparent',
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <select
                  value={txnSort}
                  onChange={(e) => setTxnSort(e.target.value as TxnSort)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium focus:outline-none"
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textPrimary,
                  }}
                >
                  <option value="date-desc">Date: Newest First</option>
                  <option value="date-asc">Date: Oldest First</option>
                  <option value="amount-desc">Amount: High to Low</option>
                  <option value="amount-asc">Amount: Low to High</option>
                </select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                }
                title="No Transactions Found"
                description="No transactions match the selected filters"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                      <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Type</th>
                      <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Fund Name</th>
                      <th className="text-left py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Date</th>
                      <th className="text-right py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Amount</th>
                      <th className="text-right py-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Units</th>
                      <th className="text-left py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((txn) => (
                      <tr key={txn.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                              style={{ background: `${getTransactionTypeColor(txn.type, colors)}15` }}
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                style={{ color: getTransactionTypeColor(txn.type, colors) }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                {txn.type === 'Buy' || txn.type === 'SIP' ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                ) : txn.type === 'Sell' ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                )}
                              </svg>
                            </div>
                            <span className="font-medium" style={{ color: getTransactionTypeColor(txn.type, colors) }}>{txn.type}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium" style={{ color: colors.textPrimary }}>{txn.fundName}</p>
                        </td>
                        <td className="py-3 pr-4" style={{ color: colors.textSecondary }}>{formatDate(txn.date)}</td>
                        <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(txn.amount)}</td>
                        <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{txn.units.toFixed(2)}</td>
                        <td className="py-3">
                          <FAChip
                            size="xs"
                            color={txn.status === 'Completed' ? colors.success : txn.status === 'Failed' ? colors.error : colors.warning}
                          >
                            {txn.status}
                          </FAChip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FACard>
        )}

        {/* ==================== SIPS TAB ==================== */}
        {activeTab === 'sips' && (
          <FACard padding="md">
            <FASectionHeader
              title="SIP Management"
              action={
                <FAButton size="sm" onClick={() => handleQuickAction('SIP')} icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }>
                  New SIP
                </FAButton>
              }
            />
            {sips.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
                title="No SIPs"
                description="Create a new SIP for this client"
              />
            ) : (
              <div className="space-y-3">
                {sips.map((sip) => (
                  <FATintedCard key={sip.id} padding="md" accentColor={getSipStatusColor(sip.status)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{sip.fundName}</p>
                          <FAChip color={getSipStatusColor(sip.status)} size="xs">{sip.status}</FAChip>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs" style={{ color: colors.textTertiary }}>
                          <span>{formatCurrency(sip.amount)} / {sip.frequency.toLowerCase()}</span>
                          <span>Day {sip.sipDate}</span>
                          <span>{sip.completedInstallments} installments</span>
                          {sip.nextSipDate && <span>Next: {formatDate(sip.nextSipDate)}</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: colors.textSecondary }}>
                          <span>Invested: {formatCurrency(sip.totalInvested)}</span>
                          <span>Current: {formatCurrency(sip.currentValue)}</span>
                          {sip.returnsPercent !== 0 && (
                            <span style={{ color: sip.returnsPercent >= 0 ? colors.success : colors.error }}>
                              {sip.returnsPercent >= 0 ? '+' : ''}{sip.returnsPercent.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {sip.status === 'Active' && (
                          <button
                            onClick={() => handleSipPause(sip.id)}
                            disabled={sipActionLoading === sip.id}
                            className="p-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                            style={{ background: `${colors.warning}15`, color: colors.warning }}
                            title="Pause SIP"
                          >
                            {sipActionLoading === sip.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                        {sip.status === 'Paused' && (
                          <button
                            onClick={() => handleSipResume(sip.id)}
                            disabled={sipActionLoading === sip.id}
                            className="p-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                            style={{ background: `${colors.success}15`, color: colors.success }}
                            title="Resume SIP"
                          >
                            {sipActionLoading === sip.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                        {(sip.status === 'Active' || sip.status === 'Paused') && (
                          <button
                            onClick={() => handleSipCancel(sip.id)}
                            disabled={sipActionLoading === sip.id}
                            className="p-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                            style={{ background: `${colors.error}15`, color: colors.error }}
                            title="Cancel SIP"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </FATintedCard>
                ))}
              </div>
            )}
          </FACard>
        )}

        {/* ==================== GOALS TAB ==================== */}
        {activeTab === 'goals' && (
          <FACard padding="md">
            <FASectionHeader
              title="Financial Goals"
              action={
                <FAButton size="sm" variant="secondary">
                  + New Goal
                </FAButton>
              }
            />
            {goals.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                }
                title="No Goals Set"
                description="Create financial goals to help your client plan for the future"
              />
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <FATintedCard key={goal.id} padding="md" accentColor={goal.onTrack ? colors.success : colors.warning}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{goal.name}</p>
                          <FAChip size="xs">{goal.type}</FAChip>
                          <FAChip color={goal.onTrack ? colors.success : colors.warning} size="xs">
                            {goal.onTrack ? 'On Track' : 'Behind'}
                          </FAChip>
                        </div>
                        <p className="text-sm mt-1" style={{ color: colors.textTertiary }}>
                          Target: {formatDate(goal.targetDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold" style={{ color: colors.textPrimary }}>
                          {formatCurrency(goal.currentValue)}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          of {formatCurrencyCompact(goal.targetAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(goal.progressPercent, 100)}%`,
                          background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.success} 100%)`,
                        }}
                      />
                    </div>
                    <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                      {goal.progressPercent.toFixed(1)}% achieved • Monthly requirement: {formatCurrency(goal.monthlyRequired)}
                    </p>
                  </FATintedCard>
                ))}
              </div>
            )}
          </FACard>
        )}

        {/* ==================== REPORTS TAB ==================== */}
        {activeTab === 'reports' && (
          <FACard padding="md">
            <FASectionHeader title="Generate Reports" />
            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none"
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textPrimary,
                  }}
                >
                  <option value="portfolio-statement">Portfolio Statement</option>
                  <option value="tax-statement">Tax Statement (Capital Gains)</option>
                  <option value="performance-report">Performance Report</option>
                  <option value="transaction-report">Transaction Report</option>
                  <option value="sip-summary">SIP Summary</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none"
                    style={{
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                    className="w-full h-10 px-4 rounded-lg text-sm transition-all focus:outline-none"
                    style={{
                      background: colors.inputBg,
                      border: `1px solid ${colors.inputBorder}`,
                      color: colors.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* Generate Buttons */}
              <div className="flex gap-3 pt-2">
                <FAButton
                  onClick={() => notification.info('Coming Soon', 'PDF report generation will be available in the next release.')}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                >
                  Download PDF
                </FAButton>
                <FAButton
                  variant="secondary"
                  onClick={() => notification.info('Coming Soon', 'Excel report generation will be available in the next release.')}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                >
                  Download Excel
                </FAButton>
              </div>

              {/* Recent Reports Placeholder */}
              <div className="pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                <FASectionHeader title="Recent Reports" />
                <FAEmptyState
                  icon={
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  }
                  title="No Reports Generated"
                  description="Generate your first report using the form above"
                />
              </div>
            </div>
          </FACard>
        )}
      </div>

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
    </AdvisorLayout>
  )
}

export default ClientDetailPage
