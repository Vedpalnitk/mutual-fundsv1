import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import MapAssetsModal from '@/components/advisor/MapAssetsModal'
import { clientsApi, portfolioApi, sipsApi, transactionsApi, goalsApi, notesApi, GoalResponse, CreateGoalDto, UpdateGoalDto, AddContributionDto, MeetingNote, CreateNoteRequest } from '@/services/api'
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
  FAShareButton,
  useNotification,
} from '@/components/advisor/shared'
import TransactionFormModal from '@/components/advisor/TransactionFormModal'
import AssetAllocationChart from '@/components/advisor/AssetAllocationChart'
import PortfolioValueChart from '@/components/advisor/PortfolioValueChart'
import InsuranceTab from '@/components/clients/insurance/InsuranceTab'
import NoteFormModal from '@/components/advisor/NoteFormModal'

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
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

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
  const [sipStatusFilter, setSipStatusFilter] = useState<'All' | 'Active' | 'Paused' | 'Cancelled'>('All')

  // Goal modal state
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalSubmitting, setGoalSubmitting] = useState(false)
  const [goalForm, setGoalForm] = useState({
    name: '',
    category: 'RETIREMENT',
    targetAmount: '',
    targetDate: '',
    monthlySip: '',
    priority: 2,
    notes: '',
  })

  // Goal edit/contribute/delete state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showEditGoalModal, setShowEditGoalModal] = useState(false)
  const [editGoalForm, setEditGoalForm] = useState({ name: '', category: '', targetAmount: '', currentAmount: '', targetDate: '', monthlySip: '', priority: 2, notes: '' })
  const [editGoalSubmitting, setEditGoalSubmitting] = useState(false)
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [contributeForm, setContributeForm] = useState({ amount: '', type: 'LUMPSUM', date: new Date().toISOString().split('T')[0], description: '' })
  const [contributeSubmitting, setContributeSubmitting] = useState(false)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)
  const [mapAssetsGoalId, setMapAssetsGoalId] = useState<string | null>(null)
  const [goalAssetMappings, setGoalAssetMappings] = useState<Record<string, any[]>>({})
  const [deleteGoalSubmitting, setDeleteGoalSubmitting] = useState(false)

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

  // Goal creation handler
  const handleCreateGoal = async () => {
    if (!client || !goalForm.name || !goalForm.targetAmount || !goalForm.targetDate) return
    setGoalSubmitting(true)
    try {
      const payload: CreateGoalDto = {
        name: goalForm.name,
        category: goalForm.category,
        targetAmount: Number(goalForm.targetAmount),
        targetDate: goalForm.targetDate,
        monthlySip: goalForm.monthlySip ? Number(goalForm.monthlySip) : undefined,
        priority: goalForm.priority,
        notes: goalForm.notes || undefined,
      }
      await goalsApi.create(client.id, payload)
      notification.success('Goal Created', `"${goalForm.name}" has been created successfully.`)
      setShowGoalModal(false)
      setGoalForm({ name: '', category: 'RETIREMENT', targetAmount: '', targetDate: '', monthlySip: '', priority: 2, notes: '' })
      // Refresh goals
      const goalsData = await goalsApi.getByClient(client.id)
      setGoals((goalsData || []).map((g: GoalResponse) => ({
        id: g.id,
        clientId: g.clientId || client.id,
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create goal'
      if (msg.toLowerCase().includes('user account')) {
        notification.error('Cannot Create Goal', 'This family member does not have a login account. Goals can only be created for primary account holders (Self).')
      } else {
        notification.error('Failed', msg)
      }
    } finally {
      setGoalSubmitting(false)
    }
  }

  // Refresh goals helper
  const refreshGoals = async (clientId: string) => {
    const goalsData = await goalsApi.getByClient(clientId)
    setGoals((goalsData || []).map((g: GoalResponse) => ({
      id: g.id,
      clientId: g.clientId || clientId,
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
  }

  // Open edit modal for a goal
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    const categoryMap: Record<string, string> = { Retirement: 'RETIREMENT', Education: 'EDUCATION', Home: 'HOME', Wealth: 'WEALTH', Emergency: 'EMERGENCY', Travel: 'TRAVEL', Wedding: 'WEDDING', Car: 'CAR', Custom: 'CUSTOM' }
    const priorityMap: Record<string, number> = { High: 1, Medium: 2, Low: 3 }
    setEditGoalForm({
      name: goal.name,
      category: categoryMap[goal.type] || 'CUSTOM',
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentValue ? goal.currentValue.toString() : '',
      targetDate: goal.targetDate,
      monthlySip: goal.monthlyRequired ? goal.monthlyRequired.toString() : '',
      priority: priorityMap[goal.priority] || 2,
      notes: goal.notes || '',
    })
    setShowEditGoalModal(true)
  }

  // Submit edit goal
  const handleEditGoalSubmit = async () => {
    if (!client || !editingGoal || !editGoalForm.name || !editGoalForm.targetAmount || !editGoalForm.targetDate) return
    setEditGoalSubmitting(true)
    try {
      const payload: UpdateGoalDto = {
        name: editGoalForm.name,
        category: editGoalForm.category,
        targetAmount: Number(editGoalForm.targetAmount),
        currentAmount: editGoalForm.currentAmount ? Number(editGoalForm.currentAmount) : undefined,
        targetDate: editGoalForm.targetDate,
        monthlySip: editGoalForm.monthlySip ? Number(editGoalForm.monthlySip) : undefined,
        priority: editGoalForm.priority,
        notes: editGoalForm.notes || undefined,
      }
      await goalsApi.update(client.id, editingGoal.id, payload)
      notification.success('Goal Updated', `"${editGoalForm.name}" has been updated.`)
      setShowEditGoalModal(false)
      setEditingGoal(null)
      await refreshGoals(client.id)
    } catch (err) {
      notification.error('Failed', err instanceof Error ? err.message : 'Failed to update goal')
    } finally {
      setEditGoalSubmitting(false)
    }
  }

  // Open contribute modal
  const handleContributeGoal = (goal: Goal) => {
    setContributingGoal(goal)
    setContributeForm({ amount: '', type: 'LUMPSUM', date: new Date().toISOString().split('T')[0], description: '' })
    setShowContributeModal(true)
  }

  // Submit contribution
  const handleContributeSubmit = async () => {
    if (!client || !contributingGoal || !contributeForm.amount) return
    setContributeSubmitting(true)
    try {
      const payload: AddContributionDto = {
        amount: Number(contributeForm.amount),
        type: contributeForm.type,
        date: contributeForm.date,
        description: contributeForm.description || undefined,
      }
      await goalsApi.addContribution(client.id, contributingGoal.id, payload)
      notification.success('Contribution Added', `${formatCurrency(Number(contributeForm.amount))} added to "${contributingGoal.name}".`)
      setShowContributeModal(false)
      setContributingGoal(null)
      await refreshGoals(client.id)
    } catch (err) {
      notification.error('Failed', err instanceof Error ? err.message : 'Failed to add contribution')
    } finally {
      setContributeSubmitting(false)
    }
  }

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!client) return
    setDeleteGoalSubmitting(true)
    try {
      await goalsApi.delete(client.id, goalId)
      notification.success('Goal Deleted', 'The goal has been removed.')
      setDeletingGoalId(null)
      await refreshGoals(client.id)
    } catch (err) {
      notification.error('Failed', err instanceof Error ? err.message : 'Failed to delete goal')
    } finally {
      setDeleteGoalSubmitting(false)
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
            absoluteGain: Number(h.absoluteGain) || 0,
            absoluteGainPercent: Number(h.absoluteGainPct) || 0,
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

        // Fetch notes
        try {
          const notesData = await notesApi.getByClient(id)
          setNotes(notesData || [])
        } catch {
          setNotes([])
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
    { id: 'notes', label: 'Notes', count: notes.length },
    { id: 'reports', label: 'Reports' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'bse', label: 'BSE' },
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

              {/* Holdings Summary */}
              <FACard padding="md">
                <FASectionHeader
                  title="Holdings"
                  action={
                    holdings.length > 0 ? (
                      <button
                        onClick={() => setActiveTab('holdings')}
                        className="text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ color: colors.primary }}
                      >
                        View All ({holdings.length})
                      </button>
                    ) : undefined
                  }
                />
                {holdings.length === 0 ? (
                  <FAEmptyState
                    icon={
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    }
                    title="No Holdings"
                    description="This client has no portfolio holdings yet"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{
                        background: isDark
                          ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                          : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Fund</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Value</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Returns</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...holdings]
                          .sort((a, b) => b.currentValue - a.currentValue)
                          .slice(0, 5)
                          .map((holding) => (
                          <tr key={holding.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                            <td className="py-2.5 pr-4">
                              <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>{holding.fundName}</p>
                              <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>{holding.assetClass} &middot; {holding.units.toFixed(2)} units</p>
                            </td>
                            <td className="py-2.5 pr-4 text-right">
                              <p className="font-medium" style={{ color: colors.textPrimary }}>{formatCurrencyCompact(holding.currentValue)}</p>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="font-medium" style={{ color: holding.absoluteGainPercent >= 0 ? colors.success : colors.error }}>
                                {holding.absoluteGainPercent >= 0 ? '+' : ''}{holding.absoluteGainPercent.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {holdings.length > 5 && (
                      <button
                        onClick={() => setActiveTab('holdings')}
                        className="w-full text-center text-xs font-medium py-3 transition-opacity hover:opacity-80"
                        style={{ color: colors.primary }}
                      >
                        +{holdings.length - 5} more holdings
                      </button>
                    )}
                  </div>
                )}
              </FACard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{
                        background: isDark
                          ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                          : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Member</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Relationship</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>KYC</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Holdings</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>SIPs</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>AUM</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...familyMembers]
                      .sort((a, b) => {
                        if (a.relationship === 'SELF') return -1
                        if (b.relationship === 'SELF') return 1
                        return b.aum - a.aum
                      })
                      .map((member) => (
                      <tr
                        key={member.id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
                        onClick={() => router.push(`/advisor/clients/${member.clientId}`)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(147, 197, 253, 0.04)' : 'rgba(59, 130, 246, 0.02)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${member.relationship === 'SELF' ? colors.primary : colors.secondary} 0%, ${member.relationship === 'SELF' ? colors.primaryDark : colors.secondaryDark} 100%)` }}
                            >
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium" style={{ color: colors.textPrimary }}>{member.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <FAChip size="xs" color={member.relationship === 'SELF' ? colors.primary : colors.secondary}>
                            {getRelationshipLabel(member.relationship)}
                          </FAChip>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <FAChip size="xs" color={member.kycStatus === 'VERIFIED' ? colors.success : colors.warning}>
                            {member.kycStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                          </FAChip>
                        </td>
                        <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{member.holdingsCount}</td>
                        <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{member.sipCount}</td>
                        <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(member.aum)}</td>
                        <td className="py-3 text-right">
                          <span className="font-medium" style={{ color: member.returns >= 0 ? colors.success : colors.error }}>
                            {member.returns >= 0 ? '+' : ''}{member.returns.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                        Family Total
                      </td>
                      <td className="py-3 pr-4 text-right font-bold" style={{ color: colors.primary }}>
                        {formatCurrency(familyMembers.reduce((sum, m) => sum + m.aum, 0))}
                      </td>
                      <td className="py-3 text-right font-bold" style={{ color: (() => { const avg = familyMembers.length > 0 ? familyMembers.reduce((s, m) => s + m.returns, 0) / familyMembers.length : 0; return avg >= 0 ? colors.success : colors.error })() }}>
                        {(() => { const avg = familyMembers.length > 0 ? familyMembers.reduce((s, m) => s + m.returns, 0) / familyMembers.length : 0; return `${avg >= 0 ? '+' : ''}${avg.toFixed(1)}%` })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
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
                    <tr style={{
                        background: isDark
                          ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                          : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Fund Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Category</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Units</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>NAV</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Current Value</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Returns</th>
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
                    <tr style={{
                        background: isDark
                          ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                          : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Fund Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Date</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Amount</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Units</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Status</th>
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
        {activeTab === 'sips' && (() => {
          const filteredSips = sips.filter(s => {
            if (sipStatusFilter === 'All') return true
            return s.status?.toLowerCase() === sipStatusFilter.toLowerCase()
          }).sort((a, b) => b.amount - a.amount)

          return (
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

              {/* Status Filters */}
              <div className="flex items-center gap-2 mb-4">
                {(['All', 'Active', 'Paused', 'Cancelled'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setSipStatusFilter(status)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: sipStatusFilter === status
                        ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                        : colors.chipBg,
                      color: sipStatusFilter === status ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {filteredSips.length === 0 ? (
                <FAEmptyState
                  icon={
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                  title="No SIPs Found"
                  description={sipStatusFilter !== 'All' ? `No ${sipStatusFilter.toLowerCase()} SIPs` : 'Create a new SIP for this client'}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{
                        background: isDark
                          ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                          : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Fund Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Amount</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Invested</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Current</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Returns</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSips.map((sip) => {
                        const sipStatus = sip.status?.toLowerCase()
                        const isActive = sipStatus === 'active'
                        const isPaused = sipStatus === 'paused'
                        const sipReturns = sip.returnsPercent !== 0
                          ? sip.returnsPercent
                          : sip.totalInvested > 0
                            ? ((sip.currentValue - sip.totalInvested) / sip.totalInvested) * 100
                            : 0

                        return (
                          <tr key={sip.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                            <td className="py-3 pr-4">
                              <p className="font-medium" style={{ color: colors.textPrimary }}>{sip.fundName}</p>
                              <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: colors.textTertiary }}>
                                <span>Day {sip.sipDate}</span>
                                <span>{sip.completedInstallments} installments</span>
                                {sip.nextSipDate && <span>Next: {formatDate(sip.nextSipDate)}</span>}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <FAChip color={getSipStatusColor(sip.status)} size="xs">{sip.status}</FAChip>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <p className="font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(sip.amount)}</p>
                              <p className="text-xs" style={{ color: colors.textTertiary }}>/ {sip.frequency.toLowerCase()}</p>
                            </td>
                            <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{formatCurrency(sip.totalInvested)}</td>
                            <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(sip.currentValue)}</td>
                            <td className="py-3 pr-4 text-right">
                              {sipReturns !== 0 ? (
                                <span className="font-medium" style={{ color: sipReturns >= 0 ? colors.success : colors.error }}>
                                  {sipReturns >= 0 ? '+' : ''}{sipReturns.toFixed(1)}%
                                </span>
                              ) : (
                                <span style={{ color: colors.textTertiary }}>&mdash;</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isActive && (
                                  <button
                                    onClick={() => handleSipPause(sip.id)}
                                    disabled={sipActionLoading === sip.id}
                                    className="p-1.5 rounded-md transition-all hover:scale-110"
                                    style={{ background: `${colors.warning}15`, color: colors.warning }}
                                    title="Pause SIP"
                                  >
                                    {sipActionLoading === sip.id ? (
                                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </button>
                                )}
                                {isPaused && (
                                  <button
                                    onClick={() => handleSipResume(sip.id)}
                                    disabled={sipActionLoading === sip.id}
                                    className="p-1.5 rounded-md transition-all hover:scale-110"
                                    style={{ background: `${colors.success}15`, color: colors.success }}
                                    title="Resume SIP"
                                  >
                                    {sipActionLoading === sip.id ? (
                                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </button>
                                )}
                                {(isActive || isPaused) && (
                                  <button
                                    onClick={() => handleSipCancel(sip.id)}
                                    disabled={sipActionLoading === sip.id}
                                    className="p-1.5 rounded-md transition-all hover:scale-110"
                                    style={{ background: `${colors.error}15`, color: colors.error }}
                                    title="Cancel SIP"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </FACard>
          )
        })()}

        {/* ==================== GOALS TAB ==================== */}
        {activeTab === 'goals' && (
          <>
            <FACard padding="md">
              <FASectionHeader
                title="Financial Goals"
                action={
                  <FAButton size="sm" onClick={() => setShowGoalModal(true)} icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  }>
                    New Goal
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{
                        background: isDark
                          ? `linear-gradient(135deg, rgba(147,197,253,0.06) 0%, rgba(125,211,252,0.03) 100%)`
                          : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(56,189,248,0.02) 100%)`,
                        borderBottom: `1px solid ${colors.cardBorder}`,
                      }}>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Goal</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Current</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Target</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Progress</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Monthly SIP</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goals.map((goal) => (
                        <tr key={goal.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                          <td className="py-3 pr-4">
                            <p className="font-medium" style={{ color: colors.textPrimary }}>{goal.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <FAChip size="xs">{goal.type}</FAChip>
                              <span className="text-xs" style={{ color: colors.textTertiary }}>Target: {formatDate(goal.targetDate)}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <FAChip color={goal.onTrack ? colors.success : colors.warning} size="xs">
                              {goal.onTrack ? 'On Track' : 'Behind'}
                            </FAChip>
                          </td>
                          <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(goal.currentValue)}</td>
                          <td className="py-3 pr-4 text-right" style={{ color: colors.textSecondary }}>{formatCurrencyCompact(goal.targetAmount)}</td>
                          <td className="py-3 pr-4" style={{ minWidth: 140 }}>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(goal.progressPercent, 100)}%`,
                                    background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.success} 100%)`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium whitespace-nowrap" style={{ color: colors.textSecondary }}>{goal.progressPercent.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right font-medium" style={{ color: colors.textPrimary }}>{formatCurrency(goal.monthlyRequired)}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Map Assets */}
                              <button
                                onClick={() => setMapAssetsGoalId(goal.id)}
                                title="Map Assets"
                                className="p-1.5 rounded-lg transition-all hover:scale-105"
                                style={{ background: `${colors.secondary}12`, color: colors.secondary }}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.364a4.5 4.5 0 00-6.364-6.364L4.5 8.879a4.5 4.5 0 006.364 6.364L13.5 12.5" />
                                </svg>
                              </button>
                              {/* Add Contribution */}
                              <button
                                onClick={() => handleContributeGoal(goal)}
                                title="Add Contribution"
                                className="p-1.5 rounded-lg transition-all hover:scale-105"
                                style={{ background: `${colors.success}12`, color: colors.success }}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                                </svg>
                              </button>
                              {/* Edit */}
                              <button
                                onClick={() => handleEditGoal(goal)}
                                title="Edit Goal"
                                className="p-1.5 rounded-lg transition-all hover:scale-105"
                                style={{ background: `${colors.primary}12`, color: colors.primary }}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => setDeletingGoalId(goal.id)}
                                title="Delete Goal"
                                className="p-1.5 rounded-lg transition-all hover:scale-105"
                                style={{ background: `${colors.error}12`, color: colors.error }}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FACard>

            {/* Edit Goal Modal */}
            {showEditGoalModal && editingGoal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div
                  className="w-full max-w-lg rounded-2xl p-6 mx-4"
                  style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 24px 48px rgba(0,0,0,0.2)` }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Edit Goal</h2>
                    <button
                      onClick={() => { setShowEditGoalModal(false); setEditingGoal(null) }}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                      style={{ color: colors.textTertiary }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Goal Name</label>
                      <input
                        type="text"
                        value={editGoalForm.name}
                        onChange={(e) => setEditGoalForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Category</label>
                        <select
                          value={editGoalForm.category}
                          onChange={(e) => setEditGoalForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        >
                          <option value="RETIREMENT">Retirement</option>
                          <option value="EDUCATION">Education</option>
                          <option value="HOME">Home</option>
                          <option value="WEALTH">Wealth Creation</option>
                          <option value="EMERGENCY">Emergency Fund</option>
                          <option value="TRAVEL">Travel</option>
                          <option value="WEDDING">Wedding</option>
                          <option value="CAR">Car</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Priority</label>
                        <select
                          value={editGoalForm.priority}
                          onChange={(e) => setEditGoalForm(f => ({ ...f, priority: Number(e.target.value) }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        >
                          <option value={1}>High</option>
                          <option value={2}>Medium</option>
                          <option value={3}>Low</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Target Amount</label>
                        <input
                          type="number"
                          value={editGoalForm.targetAmount}
                          onChange={(e) => setEditGoalForm(f => ({ ...f, targetAmount: e.target.value }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.success }}>Current Amount</label>
                        <input
                          type="number"
                          value={editGoalForm.currentAmount}
                          onChange={(e) => setEditGoalForm(f => ({ ...f, currentAmount: e.target.value }))}
                          placeholder="0"
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.success}30`, color: colors.textPrimary }}
                        />
                        {editGoalForm.targetAmount && editGoalForm.currentAmount && (
                          <p className="text-xs mt-1" style={{ color: colors.success }}>
                            Progress: {Math.min(100, Math.round((Number(editGoalForm.currentAmount) / Number(editGoalForm.targetAmount)) * 100))}%
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Target Date</label>
                        <input
                          type="date"
                          value={editGoalForm.targetDate}
                          onChange={(e) => setEditGoalForm(f => ({ ...f, targetDate: e.target.value }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Monthly SIP (Optional)</label>
                        <input
                          type="number"
                          value={editGoalForm.monthlySip}
                          onChange={(e) => setEditGoalForm(f => ({ ...f, monthlySip: e.target.value }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Notes (Optional)</label>
                      <input
                        type="text"
                        value={editGoalForm.notes}
                        onChange={(e) => setEditGoalForm(f => ({ ...f, notes: e.target.value }))}
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <FAButton variant="secondary" size="sm" onClick={() => { setShowEditGoalModal(false); setEditingGoal(null) }}>Cancel</FAButton>
                    <FAButton
                      size="sm"
                      onClick={handleEditGoalSubmit}
                      disabled={editGoalSubmitting || !editGoalForm.name || !editGoalForm.targetAmount || !editGoalForm.targetDate}
                      icon={editGoalSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : undefined}
                    >
                      {editGoalSubmitting ? 'Saving...' : 'Save Changes'}
                    </FAButton>
                  </div>
                </div>
              </div>
            )}

            {/* Add Contribution Modal */}
            {showContributeModal && contributingGoal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div
                  className="w-full max-w-md rounded-2xl p-6 mx-4"
                  style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 24px 48px rgba(0,0,0,0.2)` }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Add Contribution</h2>
                      <p className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                        {contributingGoal.name} — {formatCurrency(contributingGoal.currentValue)} / {formatCurrency(contributingGoal.targetAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => { setShowContributeModal(false); setContributingGoal(null) }}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                      style={{ color: colors.textTertiary }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Amount</label>
                      <input
                        type="number"
                        value={contributeForm.amount}
                        onChange={(e) => setContributeForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="e.g. 50000"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Type</label>
                        <select
                          value={contributeForm.type}
                          onChange={(e) => setContributeForm(f => ({ ...f, type: e.target.value }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        >
                          <option value="LUMPSUM">Lumpsum</option>
                          <option value="SIP">SIP</option>
                          <option value="RETURNS">Returns</option>
                          <option value="DIVIDEND">Dividend</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Date</label>
                        <input
                          type="date"
                          value={contributeForm.date}
                          onChange={(e) => setContributeForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Description (Optional)</label>
                      <input
                        type="text"
                        value={contributeForm.description}
                        onChange={(e) => setContributeForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="e.g. Monthly SIP for Jan 2025"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <FAButton variant="secondary" size="sm" onClick={() => { setShowContributeModal(false); setContributingGoal(null) }}>Cancel</FAButton>
                    <FAButton
                      size="sm"
                      onClick={handleContributeSubmit}
                      disabled={contributeSubmitting || !contributeForm.amount}
                      icon={contributeSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : undefined}
                    >
                      {contributeSubmitting ? 'Adding...' : 'Add Contribution'}
                    </FAButton>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Goal Confirmation */}
            {deletingGoalId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div
                  className="w-full max-w-sm rounded-2xl p-6 mx-4"
                  style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 24px 48px rgba(0,0,0,0.2)` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.error}12` }}>
                      <svg className="w-5 h-5" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base font-bold" style={{ color: colors.textPrimary }}>Delete Goal</h2>
                      <p className="text-xs" style={{ color: colors.textTertiary }}>This action cannot be undone</p>
                    </div>
                  </div>

                  <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                    Are you sure you want to delete <strong style={{ color: colors.textPrimary }}>{goals.find(g => g.id === deletingGoalId)?.name || 'this goal'}</strong>? All contributions and progress data will be permanently removed.
                  </p>

                  <div className="flex items-center justify-end gap-3">
                    <FAButton variant="secondary" size="sm" onClick={() => setDeletingGoalId(null)}>Cancel</FAButton>
                    <button
                      onClick={() => handleDeleteGoal(deletingGoalId)}
                      disabled={deleteGoalSubmitting}
                      className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${colors.error} 0%, #DC2626 100%)` }}
                    >
                      {deleteGoalSubmitting ? 'Deleting...' : 'Delete Goal'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Map Assets Modal */}
            {mapAssetsGoalId && client && (
              <MapAssetsModal
                clientId={client.id}
                goalId={mapAssetsGoalId}
                existingMappings={goalAssetMappings[mapAssetsGoalId] || []}
                clientHoldings={(holdings || []).map(h => ({
                  fundName: h.fundName,
                  fundSchemeCode: h.fundSchemeCode,
                  folioNumber: h.folioNumber,
                  assetClass: h.assetClass,
                  currentValue: h.currentValue,
                }))}
                onSave={async () => {
                  try {
                    const mappings = await goalsApi.getAssetMappings(client.id, mapAssetsGoalId)
                    setGoalAssetMappings(prev => ({ ...prev, [mapAssetsGoalId]: mappings }))
                  } catch { /* ignore */ }
                  setMapAssetsGoalId(null)
                }}
                onClose={() => setMapAssetsGoalId(null)}
              />
            )}

            {/* Goal Creation Modal */}
            {showGoalModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div
                  className="w-full max-w-lg rounded-2xl p-6 mx-4"
                  style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 24px 48px rgba(0,0,0,0.2)` }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Create New Goal</h2>
                    <button
                      onClick={() => setShowGoalModal(false)}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                      style={{ color: colors.textTertiary }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Goal Name */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Goal Name</label>
                      <input
                        type="text"
                        value={goalForm.name}
                        onChange={(e) => setGoalForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Retirement Fund, Child Education"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </div>

                    {/* Category + Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Category</label>
                        <select
                          value={goalForm.category}
                          onChange={(e) => setGoalForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        >
                          <option value="RETIREMENT">Retirement</option>
                          <option value="EDUCATION">Education</option>
                          <option value="HOME">Home</option>
                          <option value="WEALTH">Wealth Creation</option>
                          <option value="EMERGENCY">Emergency Fund</option>
                          <option value="TRAVEL">Travel</option>
                          <option value="WEDDING">Wedding</option>
                          <option value="CAR">Car</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Priority</label>
                        <select
                          value={goalForm.priority}
                          onChange={(e) => setGoalForm(f => ({ ...f, priority: Number(e.target.value) }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        >
                          <option value={1}>High</option>
                          <option value={2}>Medium</option>
                          <option value={3}>Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Target Amount + Target Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Target Amount</label>
                        <input
                          type="number"
                          value={goalForm.targetAmount}
                          onChange={(e) => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))}
                          placeholder="e.g. 5000000"
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Target Date</label>
                        <input
                          type="date"
                          value={goalForm.targetDate}
                          onChange={(e) => setGoalForm(f => ({ ...f, targetDate: e.target.value }))}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        />
                      </div>
                    </div>

                    {/* Monthly SIP */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Monthly SIP (Optional)</label>
                      <input
                        type="number"
                        value={goalForm.monthlySip}
                        onChange={(e) => setGoalForm(f => ({ ...f, monthlySip: e.target.value }))}
                        placeholder="e.g. 10000"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Notes (Optional)</label>
                      <input
                        type="text"
                        value={goalForm.notes}
                        onChange={(e) => setGoalForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Any additional notes"
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 mt-6">
                    <FAButton variant="secondary" size="sm" onClick={() => setShowGoalModal(false)}>Cancel</FAButton>
                    <FAButton
                      size="sm"
                      onClick={handleCreateGoal}
                      disabled={goalSubmitting || !goalForm.name || !goalForm.targetAmount || !goalForm.targetDate}
                      icon={goalSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : undefined}
                    >
                      {goalSubmitting ? 'Creating...' : 'Create Goal'}
                    </FAButton>
                  </div>
                </div>
              </div>
            )}
          </>
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
                <FAShareButton
                  clientId={id as string}
                  clientName={client?.name || 'Client'}
                  templateType="REPORT_SHARING"
                  contextData={{ reportType: reportType }}
                  label="Share Report"
                  size="md"
                />
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

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FASectionHeader title={`Meeting Notes (${notes.length})`} />
              <FAButton onClick={() => setShowNoteModal(true)}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Note
                </span>
              </FAButton>
            </div>

            {notes.length === 0 ? (
              <FAEmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                }
                title="No meeting notes yet"
                description="Record your client meetings, calls, and follow-ups here."
                action={
                  <FAButton onClick={() => setShowNoteModal(true)}>Add First Note</FAButton>
                }
              />
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const typeConfig: Record<string, { color: string; icon: string }> = {
                    CALL: { color: '#3B82F6', icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z' },
                    IN_PERSON: { color: '#10B981', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
                    VIDEO: { color: '#8B5CF6', icon: 'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z' },
                    EMAIL: { color: '#F59E0B', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
                    OTHER: { color: '#94A3B8', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
                  }
                  const config = typeConfig[note.meetingType] || typeConfig.OTHER
                  const isExpanded = expandedNoteId === note.id
                  const typeLabel = note.meetingType.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

                  return (
                    <FATintedCard
                      key={note.id}
                      accentColor={config.color}
                      hover={false}
                      padding="md"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${config.color}15` }}
                        >
                          <svg className="w-4 h-4" style={{ color: config.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                              {note.title}
                            </h4>
                            <span
                              className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                              style={{ background: `${config.color}12`, color: config.color }}
                            >
                              {typeLabel}
                            </span>
                          </div>
                          <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>
                            {formatDate(note.meetingDate)}
                          </p>
                          <p
                            className={`text-sm ${isExpanded ? '' : 'line-clamp-2'}`}
                            style={{ color: colors.textSecondary, cursor: 'pointer' }}
                            onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                          >
                            {note.content}
                          </p>
                          {note.content.length > 120 && (
                            <button
                              onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                              className="text-xs font-medium mt-1"
                              style={{ color: colors.primary }}
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this note?')) return
                            try {
                              await notesApi.delete(id as string, note.id)
                              setNotes(prev => prev.filter(n => n.id !== note.id))
                              notification.success('Note Deleted', 'Meeting note has been removed.')
                            } catch (err) {
                              notification.error('Delete Failed', err instanceof Error ? err.message : 'Failed to delete note')
                            }
                          }}
                          className="p-1.5 rounded-lg transition-colors hover:opacity-70 flex-shrink-0"
                          style={{ color: colors.textTertiary }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </FATintedCard>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'insurance' && id && (
          <InsuranceTab clientId={id as string} />
        )}

        {/* ==================== BSE REGISTRATION TAB ==================== */}
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
