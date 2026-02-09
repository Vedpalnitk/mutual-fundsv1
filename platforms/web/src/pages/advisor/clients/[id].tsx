import { useState, useEffect } from 'react'
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

// Mock client data
const mockClient: Client = {
  id: '1',
  name: 'Rajesh Sharma',
  email: 'rajesh.sharma@email.com',
  phone: '+91 98765 43210',
  pan: 'ABCDE1234F',
  dateOfBirth: '1985-06-15',
  address: '123 Main Street, Koramangala',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560034',
  aum: 4500000,
  returns: 18.5,
  riskProfile: 'Moderate',
  lastActive: '2 hours ago',
  sipCount: 3,
  goalsCount: 2,
  joinedDate: '2022-03-15',
  status: 'Active',
  kycStatus: 'Verified',
  nominee: {
    name: 'Priya Sharma',
    relationship: 'Spouse',
    percentage: 100,
  },
}

// Mock holdings
const mockHoldings: Holding[] = [
  {
    id: '1',
    fundName: 'HDFC Flexi Cap Fund',
    fundSchemeCode: '118989',
    fundCategory: 'Flexi Cap',
    assetClass: 'Equity',
    folioNumber: 'FOL123456',
    units: 1250.45,
    avgNav: 1200.5,
    currentNav: 1425.3,
    investedValue: 1501688,
    currentValue: 1782376,
    absoluteGain: 280688,
    absoluteGainPercent: 18.7,
    xirr: 22.5,
    lastTransactionDate: '2025-01-05',
  },
  {
    id: '2',
    fundName: 'ICICI Prudential Bluechip Fund',
    fundSchemeCode: '120594',
    fundCategory: 'Large Cap',
    assetClass: 'Equity',
    folioNumber: 'FOL123457',
    units: 890.2,
    avgNav: 75.5,
    currentNav: 92.3,
    investedValue: 672101,
    currentValue: 821854,
    absoluteGain: 149753,
    absoluteGainPercent: 22.3,
    xirr: 25.1,
    lastTransactionDate: '2025-01-10',
  },
  {
    id: '3',
    fundName: 'Axis Long Term Equity Fund',
    fundSchemeCode: '112323',
    fundCategory: 'ELSS',
    assetClass: 'Equity',
    folioNumber: 'FOL123458',
    units: 450.8,
    avgNav: 85.2,
    currentNav: 98.7,
    investedValue: 384081,
    currentValue: 445040,
    absoluteGain: 60958,
    absoluteGainPercent: 15.9,
    xirr: 18.2,
    lastTransactionDate: '2025-01-15',
  },
  {
    id: '4',
    fundName: 'SBI Corporate Bond Fund',
    fundSchemeCode: '119598',
    fundCategory: 'Corporate Bond',
    assetClass: 'Debt',
    folioNumber: 'FOL123459',
    units: 12500,
    avgNav: 38.5,
    currentNav: 41.2,
    investedValue: 481250,
    currentValue: 515000,
    absoluteGain: 33750,
    absoluteGainPercent: 7.0,
    xirr: 7.5,
    lastTransactionDate: '2024-12-20',
  },
]

// Mock SIPs
const mockSIPs: SIP[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Rajesh Sharma',
    fundName: 'HDFC Flexi Cap Fund',
    fundSchemeCode: '118989',
    folioNumber: 'FOL123456',
    amount: 25000,
    frequency: 'Monthly',
    sipDate: 5,
    startDate: '2022-04-05',
    status: 'Active',
    totalInstallments: 34,
    completedInstallments: 34,
    totalInvested: 850000,
    currentValue: 1050000,
    returns: 200000,
    returnsPercent: 23.5,
    nextSipDate: '2025-02-05',
    lastSipDate: '2025-01-05',
  },
  {
    id: '2',
    clientId: '1',
    clientName: 'Rajesh Sharma',
    fundName: 'ICICI Prudential Bluechip Fund',
    fundSchemeCode: '120594',
    folioNumber: 'FOL123457',
    amount: 15000,
    frequency: 'Monthly',
    sipDate: 10,
    startDate: '2022-06-10',
    status: 'Active',
    totalInstallments: 32,
    completedInstallments: 32,
    totalInvested: 480000,
    currentValue: 580000,
    returns: 100000,
    returnsPercent: 20.8,
    nextSipDate: '2025-02-10',
    lastSipDate: '2025-01-10',
  },
  {
    id: '3',
    clientId: '1',
    clientName: 'Rajesh Sharma',
    fundName: 'Axis Long Term Equity Fund',
    fundSchemeCode: '112323',
    folioNumber: 'FOL123458',
    amount: 10000,
    frequency: 'Monthly',
    sipDate: 15,
    startDate: '2023-01-15',
    status: 'Active',
    totalInstallments: 24,
    completedInstallments: 24,
    totalInvested: 240000,
    currentValue: 285000,
    returns: 45000,
    returnsPercent: 18.8,
    nextSipDate: '2025-02-15',
    lastSipDate: '2025-01-15',
  },
]

// Mock transactions
const mockTransactions: Transaction[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Rajesh Sharma',
    type: 'SIP',
    fundName: 'HDFC Flexi Cap Fund',
    fundSchemeCode: '118989',
    fundCategory: 'Flexi Cap',
    folioNumber: 'FOL123456',
    amount: 25000,
    units: 17.54,
    nav: 1425.3,
    date: '2025-01-05',
    status: 'Completed',
  },
  {
    id: '2',
    clientId: '1',
    clientName: 'Rajesh Sharma',
    type: 'SIP',
    fundName: 'ICICI Prudential Bluechip Fund',
    fundSchemeCode: '120594',
    fundCategory: 'Large Cap',
    folioNumber: 'FOL123457',
    amount: 15000,
    units: 162.5,
    nav: 92.3,
    date: '2025-01-10',
    status: 'Completed',
  },
  {
    id: '3',
    clientId: '1',
    clientName: 'Rajesh Sharma',
    type: 'Buy',
    fundName: 'SBI Corporate Bond Fund',
    fundSchemeCode: '119598',
    fundCategory: 'Corporate Bond',
    folioNumber: 'FOL123459',
    amount: 100000,
    units: 2427.18,
    nav: 41.2,
    date: '2024-12-20',
    status: 'Completed',
  },
  {
    id: '4',
    clientId: '1',
    clientName: 'Rajesh Sharma',
    type: 'SIP',
    fundName: 'Axis Long Term Equity Fund',
    fundSchemeCode: '112323',
    fundCategory: 'ELSS',
    folioNumber: 'FOL123458',
    amount: 10000,
    units: 101.32,
    nav: 98.7,
    date: '2025-01-15',
    status: 'Completed',
  },
]

const ClientDetailPage = () => {
  const router = useRouter()
  const { id } = router.query
  const { colors, isDark } = useFATheme()
  const notification = useNotification()
  const [activeTab, setActiveTab] = useState<'holdings' | 'sips' | 'goals' | 'transactions'>('holdings')

  // State for API data
  const [client, setClient] = useState<Client | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [sips, setSips] = useState<SIP[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [goalsLoading, setGoalsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allocationData, setAllocationData] = useState<{ assetClass: string; value: number; percentage: number; color: string }[]>([])

  // Transaction modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>('Buy')
  const [submitting, setSubmitting] = useState(false)


  // Quick action handlers
  const handleQuickAction = (type: TransactionType) => {
    setTransactionType(type)
    setShowTransactionModal(true)
  }

  const handleTransactionSubmit = async (data: TransactionFormData) => {
    if (!client) return
    setSubmitting(true)

    try {
      if (data.type === 'Buy') {
        await transactionsApi.createLumpsum({
          clientId: client.id,
          fundSchemeCode: data.fundSchemeCode,
          amount: data.amount,
          folioNumber: data.folioNumber || undefined,
          paymentMode: data.paymentMode,
        })
        notification.success('Order Placed', 'Lumpsum purchase order has been submitted successfully.')
      } else if (data.type === 'Sell') {
        await transactionsApi.createRedemption({
          clientId: client.id,
          fundSchemeCode: data.fundSchemeCode,
          amount: data.amount,
          folioNumber: data.folioNumber || undefined,
        })
        notification.success('Redemption Submitted', 'Redemption request has been submitted successfully.')
      } else if (data.type === 'SIP') {
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
        notification.success('SIP Registered', 'New SIP has been registered successfully.')
      } else {
        // For Switch, SWP, STP - show info that feature is coming
        notification.info('Coming Soon', `${data.type} transactions will be available soon.`)
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

        // Also refresh SIPs if SIP was created
        if (data.type === 'SIP') {
          const sipsData = await sipsApi.getByClient(id)
          setSips(sipsData.map((s: any) => ({
            id: s.id,
            clientId: s.clientId,
            clientName: client.name,
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
          })))
        }
      }
    } catch (err) {
      notification.error('Transaction Failed', err instanceof Error ? err.message : 'Failed to process transaction')
    } finally {
      setSubmitting(false)
    }
  }

  // Fetch client data from API
  useEffect(() => {
    if (!id || typeof id !== 'string') return

    const fetchClientData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch client details
        const clientData = await clientsApi.getById<Client>(id)
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

        // Fetch holdings
        try {
          const holdingsData = await portfolioApi.getClientHoldings(id)
          setHoldings(holdingsData.map((h: any) => ({
            id: h.id,
            fundName: h.fundName,
            fundSchemeCode: h.fundSchemeCode,
            fundCategory: h.fundCategory,
            assetClass: h.assetClass || 'Equity',
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
          setSips(sipsData.map((s: any) => ({
            id: s.id,
            clientId: s.clientId,
            clientName: clientData.name,
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
          })))
        } catch {
          setSips([])
        }

        // Fetch transactions
        try {
          const txnsData = await transactionsApi.getByClient(id)
          setTransactions((txnsData || []).map((t: any) => ({
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
        // Fall back to mock data if API fails
        setClient(mockClient)
        setHoldings(mockHoldings)
        setSips(mockSIPs)
        setTransactions(mockTransactions)
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
  const overallReturn = ((totalCurrent - totalInvested) / totalInvested) * 100

  const assetAllocation = holdings.reduce((acc, h) => {
    acc[h.assetClass] = (acc[h.assetClass] || 0) + h.currentValue
    return acc
  }, {} as Record<string, number>)

  const tabs = [
    { id: 'holdings', label: 'Holdings', count: holdings.length },
    { id: 'sips', label: 'SIPs', count: sips.length },
    { id: 'goals', label: 'Goals', count: goals.length },
    { id: 'transactions', label: 'Transactions', count: transactions.length },
  ] as const

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
            <div className="flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl"
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
        <div className="grid grid-cols-5 gap-4 mb-6">
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
              {formatCurrency(sips.reduce((sum, s) => sum + s.amount, 0))}
            </p>
          </FACard>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  style={{
                    background: activeTab === tab.id
                      ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                      : colors.chipBg,
                    color: activeTab === tab.id ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {tab.label}
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : colors.cardBorder,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Holdings Tab */}
            {activeTab === 'holdings' && (
              <FACard padding="md">
                <FASectionHeader title="Portfolio Holdings" />
                <div className="space-y-3">
                  {holdings.map((holding) => (
                    <FATintedCard key={holding.id} padding="sm" accentColor={getAssetClassColor(holding.assetClass, colors)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{holding.fundName}</p>
                            <FAChip size="xs">{holding.assetClass}</FAChip>
                          </div>
                          <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                            {holding.units.toFixed(2)} units @ {formatCurrency(holding.currentNav)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold" style={{ color: colors.textPrimary }}>
                            {formatCurrency(holding.currentValue)}
                          </p>
                          <p className="text-sm" style={{ color: holding.absoluteGainPercent >= 0 ? colors.success : colors.error }}>
                            {holding.absoluteGainPercent >= 0 ? '+' : ''}{holding.absoluteGainPercent.toFixed(1)}% ({formatCurrencyCompact(holding.absoluteGain)})
                          </p>
                        </div>
                      </div>
                    </FATintedCard>
                  ))}
                </div>
              </FACard>
            )}

            {/* SIPs Tab */}
            {activeTab === 'sips' && (
              <FACard padding="md">
                <FASectionHeader
                  title="Active SIPs"
                  action={
                    <FAButton size="sm" variant="secondary">
                      + New SIP
                    </FAButton>
                  }
                />
                <div className="space-y-3">
                  {sips.map((sip) => (
                    <FATintedCard key={sip.id} padding="sm" accentColor={colors.primary}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{sip.fundName}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm" style={{ color: colors.textSecondary }}>
                              {formatCurrency(sip.amount)} / month
                            </span>
                            <span className="text-sm" style={{ color: colors.textTertiary }}>
                              Day {sip.sipDate}
                            </span>
                            <FAChip color={colors.success} size="xs">{sip.status}</FAChip>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold" style={{ color: colors.textPrimary }}>
                            {formatCurrency(sip.totalInvested)}
                          </p>
                          <p className="text-sm" style={{ color: colors.textTertiary }}>
                            {sip.completedInstallments} installments
                          </p>
                        </div>
                      </div>
                    </FATintedCard>
                  ))}
                </div>
              </FACard>
            )}

            {/* Goals Tab */}
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

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <FACard padding="md">
                <FASectionHeader title="Recent Transactions" />
                <div className="space-y-2">
                  {transactions.map((txn) => (
                    <FATintedCard key={txn.id} padding="sm" accentColor={getTransactionTypeColor(txn.type, colors)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${getTransactionTypeColor(txn.type, colors)}15` }}
                          >
                            <svg
                              className="w-4 h-4"
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
                          <div>
                            <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>{txn.fundName}</p>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>
                              {txn.type} • {formatDate(txn.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold" style={{ color: colors.textPrimary }}>
                            {formatCurrency(txn.amount)}
                          </p>
                          <p className="text-sm" style={{ color: colors.textTertiary }}>
                            {txn.units.toFixed(2)} units
                          </p>
                        </div>
                      </div>
                    </FATintedCard>
                  ))}
                </div>
              </FACard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Portfolio Value Chart */}
            {id && typeof id === 'string' && (
              <FACard padding="md">
                <FASectionHeader title="Portfolio Value" />
                <PortfolioValueChart clientId={id} />
              </FACard>
            )}

            {/* Asset Allocation Donut Chart */}
            <FACard padding="md">
              <FASectionHeader title="Asset Allocation" />
              {allocationData.length > 0 ? (
                <AssetAllocationChart allocation={allocationData} height={240} />
              ) : (
                <div className="space-y-3">
                  {Object.entries(assetAllocation).map(([asset, value]) => {
                    const percentage = (value / totalCurrent) * 100
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
                        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                          {formatCurrency(value)}
                        </p>
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
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{client.pan}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Date of Birth</p>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatDate(client.dateOfBirth || '')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>Address</p>
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {client.address}, {client.city}
                  </p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {client.state} - {client.pincode}
                  </p>
                </div>
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
                  { label: 'New SIP', icon: 'M12 4v16m8-8H4', type: 'SIP' as TransactionType, enabled: true },
                  { label: 'Lumpsum', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', type: 'Buy' as TransactionType, enabled: true },
                  { label: 'Redeem', icon: 'M20 12H4', type: 'Sell' as TransactionType, enabled: true },
                  { label: 'Switch', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', type: 'Switch' as TransactionType, enabled: true },
                  { label: 'Statement', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', type: undefined, enabled: false },
                  { label: 'Report', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', type: undefined, enabled: false },
                ].map((action) => (
                  <button
                    key={action.label}
                    disabled={!action.enabled}
                    title={action.enabled ? action.label : 'Coming Soon'}
                    onClick={() => action.type && handleQuickAction(action.type)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 relative group ${
                      action.enabled ? 'hover:scale-105 hover:shadow-md cursor-pointer' : 'opacity-60 cursor-not-allowed'
                    }`}
                    style={{
                      background: isDark
                        ? 'rgba(147, 197, 253, 0.08)'
                        : 'rgba(59, 130, 246, 0.04)',
                      border: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                    </svg>
                    <span style={{ color: colors.textPrimary }}>{action.label}</span>
                    {!action.enabled && (
                      <span
                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                        style={{ background: colors.textPrimary, color: colors.background }}
                      >
                        Coming Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </FACard>
          </div>
        </div>
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
