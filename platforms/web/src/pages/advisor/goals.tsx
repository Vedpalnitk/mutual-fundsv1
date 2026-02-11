/**
 * Goals Management Dashboard
 *
 * Comprehensive dashboard for managing client financial goals.
 * Features: Goal templates, Progress visualization, Investment mapping, Gap analysis
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { GoalType, GoalPriority } from '@/utils/faTypes'
import {
  FACard,
  FAStatCard,
  FAChip,
  FASearchInput,
  FASelect,
  FAButton,
  FAEmptyState,
  FASectionHeader,
  FATintedCard,
  FAInput,
  FAFormSection,
  useNotification,
} from '@/components/advisor/shared'
import { goalsApi, GoalResponse, clientsApi, CreateGoalDto } from '@/services/api'

// Map backend category to frontend GoalType
const categoryToGoalType: Record<string, GoalType> = {
  RETIREMENT: 'Retirement',
  EDUCATION: 'Education',
  HOME: 'Home',
  EMERGENCY: 'Emergency',
  WEALTH: 'Wealth',
  WEDDING: 'Wedding',
  TRAVEL: 'Travel',
  OTHER: 'Custom',
}

// Map frontend GoalType to backend category
const goalTypeToCategory: Record<GoalType, string> = {
  Retirement: 'RETIREMENT',
  Education: 'EDUCATION',
  Home: 'HOME',
  Emergency: 'EMERGENCY',
  Wealth: 'WEALTH',
  Wedding: 'WEDDING',
  Travel: 'TRAVEL',
  Custom: 'OTHER',
}

// Goal type icons and colors
const GOAL_CONFIG: Record<GoalType, { icon: string; color: string; bgLight: string; bgDark: string }> = {
  Retirement: {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: '#8B5CF6',
    bgLight: 'rgba(139, 92, 246, 0.08)',
    bgDark: 'rgba(139, 92, 246, 0.15)',
  },
  Education: {
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
    color: '#0EA5E9',
    bgLight: 'rgba(14, 165, 233, 0.08)',
    bgDark: 'rgba(14, 165, 233, 0.15)',
  },
  Home: {
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    color: '#F59E0B',
    bgLight: 'rgba(245, 158, 11, 0.08)',
    bgDark: 'rgba(245, 158, 11, 0.15)',
  },
  Emergency: {
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    color: '#EF4444',
    bgLight: 'rgba(239, 68, 68, 0.08)',
    bgDark: 'rgba(239, 68, 68, 0.15)',
  },
  Wealth: {
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.08)',
    bgDark: 'rgba(16, 185, 129, 0.15)',
  },
  Wedding: {
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    color: '#EC4899',
    bgLight: 'rgba(236, 72, 153, 0.08)',
    bgDark: 'rgba(236, 72, 153, 0.15)',
  },
  Travel: {
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#38BDF8',
    bgLight: 'rgba(56, 189, 248, 0.08)',
    bgDark: 'rgba(56, 189, 248, 0.15)',
  },
  Custom: {
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color: '#64748B',
    bgLight: 'rgba(100, 116, 139, 0.08)',
    bgDark: 'rgba(100, 116, 139, 0.15)',
  },
}

// Interface for enriched goal with computed fields
interface EnrichedGoal extends GoalResponse {
  type: GoalType;
  progressPercent: number;
  currentValue: number;
  onTrack: boolean;
  monthlyRequired: number;
  shortfall?: number;
  linkedSIPs: string[];
  linkedHoldings: string[];
}

// Client type for dropdown
interface ClientOption {
  id: string;
  name: string;
}

const GoalsDashboard = () => {
  const router = useRouter()
  const { colors, isDark } = useFATheme()
  const { showNotification } = useNotification()

  // State
  const [goals, setGoals] = useState<EnrichedGoal[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [selectedGoalType, setSelectedGoalType] = useState<GoalType>('Retirement')
  const [submitting, setSubmitting] = useState(false)

  // Form state for new goal
  const [newGoalForm, setNewGoalForm] = useState({
    clientId: '',
    name: '',
    targetAmount: '',
    targetDate: '',
    initialInvestment: '',
    monthlyContribution: '',
    priority: 'Medium' as GoalPriority,
    notes: '',
  })

  // Load goals and clients on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load goals and clients in parallel
      const [goalsData, clientsData] = await Promise.all([
        goalsApi.list(),
        clientsApi.list<{ id: string; name: string }>({ limit: 100 }),
      ])

      // Transform API goals to enriched goals
      const enrichedGoals: EnrichedGoal[] = goalsData.map(goal => {
        const type = categoryToGoalType[goal.category] || 'Custom'
        const yearsRemaining = Math.max(0.5, (new Date(goal.targetDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000))
        const monthlyRequired = goal.monthlySip || Math.ceil((goal.targetAmount - goal.currentAmount) / (yearsRemaining * 12))
        const projectedValue = goal.currentAmount + (monthlyRequired * yearsRemaining * 12)
        const onTrack = projectedValue >= goal.targetAmount
        const shortfall = onTrack ? 0 : goal.targetAmount - projectedValue

        return {
          ...goal,
          type,
          progressPercent: goal.progress,
          currentValue: goal.currentAmount,
          onTrack,
          monthlyRequired,
          shortfall: shortfall > 0 ? shortfall : undefined,
          linkedSIPs: goal.linkedFundCodes || [],
          linkedHoldings: [],
        }
      })

      setGoals(enrichedGoals)
      setClients(clientsData.data.map(c => ({ id: c.id, name: c.name })))
    } catch (error) {
      console.error('Failed to load goals:', error)
      showNotification('error', 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoalForm.clientId || !newGoalForm.name || !newGoalForm.targetAmount || !newGoalForm.targetDate) {
      showNotification('error', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const dto: CreateGoalDto = {
        name: newGoalForm.name,
        category: goalTypeToCategory[selectedGoalType],
        targetAmount: parseFloat(newGoalForm.targetAmount),
        currentAmount: parseFloat(newGoalForm.initialInvestment) || 0,
        targetDate: newGoalForm.targetDate,
        monthlySip: parseFloat(newGoalForm.monthlyContribution) || undefined,
        priority: newGoalForm.priority === 'High' ? 1 : newGoalForm.priority === 'Medium' ? 2 : 3,
        notes: newGoalForm.notes || undefined,
      }

      await goalsApi.create(newGoalForm.clientId, dto)
      showNotification('success', 'Goal created successfully')
      setShowNewGoal(false)
      setNewGoalForm({
        clientId: '',
        name: '',
        targetAmount: '',
        targetDate: '',
        initialInvestment: '',
        monthlyContribution: '',
        priority: 'Medium',
        notes: '',
      })
      loadData()
    } catch (error) {
      console.error('Failed to create goal:', error)
      showNotification('error', 'Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredGoals = goals.filter(goal => {
    const clientName = goal.clientName || ''
    const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || goal.type === filterType
    const goalPriority = goal.priority === 1 ? 'High' : goal.priority === 2 ? 'Medium' : 'Low'
    const matchesPriority = filterPriority === 'all' || goalPriority === filterPriority
    return matchesSearch && matchesType && matchesPriority
  })

  // Stats calculations
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalCurrentValue = goals.reduce((sum, g) => sum + g.currentValue, 0)
  const onTrackGoals = goals.filter(g => g.onTrack).length
  const offTrackGoals = goals.filter(g => !g.onTrack).length
  const totalShortfall = goals.reduce((sum, g) => sum + (g.shortfall || 0), 0)
  const progressPercent = totalTargetAmount > 0 ? ((totalCurrentValue / totalTargetAmount) * 100).toFixed(0) : 0

  const getPriorityColor = (priority: GoalPriority | number) => {
    const p = typeof priority === 'number'
      ? (priority === 1 ? 'High' : priority === 2 ? 'Medium' : 'Low')
      : priority
    switch (p) {
      case 'High': return colors.error
      case 'Medium': return colors.warning
      case 'Low': return colors.success
      default: return colors.textSecondary
    }
  }

  const getPriorityLabel = (priority: number): GoalPriority => {
    return priority === 1 ? 'High' : priority === 2 ? 'Medium' : 'Low'
  }

  const getProgressColor = (onTrack: boolean) => {
    return onTrack ? colors.success : colors.warning
  }

  const goalTemplates: { type: GoalType; name: string; description: string }[] = [
    { type: 'Retirement', name: 'Retirement', description: 'Build corpus for retirement years' },
    { type: 'Education', name: 'Education', description: "Fund children's higher education" },
    { type: 'Home', name: 'Home Purchase', description: 'Save for dream home down payment' },
    { type: 'Emergency', name: 'Emergency Fund', description: '6-12 months of expenses' },
    { type: 'Wealth', name: 'Wealth Creation', description: 'Long-term wealth building' },
    { type: 'Wedding', name: 'Wedding', description: 'Plan for wedding expenses' },
  ]

  return (
    <AdvisorLayout title="Goals Management">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Track and manage client financial goals
            </p>
          </div>
          <FAButton
            onClick={() => setShowNewGoal(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Goal
          </FAButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <FAStatCard
            label="Total Goals"
            value={goals.length.toString()}
            change={`${onTrackGoals} on track`}
          />
          <FAStatCard
            label="Target Amount"
            value={formatCurrency(totalTargetAmount)}
            change="All goals combined"
          />
          <FAStatCard
            label="Current Progress"
            value={formatCurrency(totalCurrentValue)}
            change={`${progressPercent}% achieved`}
          />
          <FAStatCard
            label="On Track"
            value={onTrackGoals.toString()}
            change={`${offTrackGoals} need attention`}
            changeType={offTrackGoals > 0 ? 'negative' : 'positive'}
          />
          <FAStatCard
            label="Total Shortfall"
            value={formatCurrency(totalShortfall)}
            change="Gap to target"
            changeType={totalShortfall > 0 ? 'negative' : 'positive'}
          />
        </div>

        {/* Goal Templates */}
        <FACard className="mb-6">
          <FASectionHeader title="Quick Start Templates" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            {goalTemplates.map(template => {
              const config = GOAL_CONFIG[template.type]
              return (
                <button
                  key={template.type}
                  onClick={() => {
                    setSelectedGoalType(template.type)
                    setShowNewGoal(true)
                  }}
                  className="p-4 rounded-xl transition-all hover:-translate-y-0.5 text-left"
                  style={{
                    background: isDark ? config.bgDark : config.bgLight,
                    border: `1px solid ${config.color}30`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: `${config.color}20` }}
                  >
                    <svg className="w-5 h-5" style={{ color: config.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {template.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                    {template.description}
                  </p>
                </button>
              )
            })}
          </div>
        </FACard>

        {/* Filters */}
        <FACard className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <FASearchInput
                placeholder="Search by goal name or client..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <FASelect
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'Retirement', label: 'Retirement' },
                { value: 'Education', label: 'Education' },
                { value: 'Home', label: 'Home' },
                { value: 'Emergency', label: 'Emergency' },
                { value: 'Wealth', label: 'Wealth' },
                { value: 'Wedding', label: 'Wedding' },
              ]}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              containerClassName="w-36"
            />
            <FASelect
              options={[
                { value: 'all', label: 'All Priority' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ]}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              containerClassName="w-36"
            />
          </div>
        </FACard>

        {/* Loading State */}
        {loading && (
          <FACard className="mb-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
              <span className="ml-3" style={{ color: colors.textSecondary }}>Loading goals...</span>
            </div>
          </FACard>
        )}

        {/* Goals Grid */}
        {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGoals.map(goal => {
            const config = GOAL_CONFIG[goal.type]
            const clientName = goal.clientName || 'Unknown Client'
            const yearsRemaining = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000))

            return (
              <FACard key={goal.id} className="overflow-hidden">
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: isDark ? config.bgDark : config.bgLight }}
                    >
                      <svg className="w-6 h-6" style={{ color: config.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                        {goal.name}
                      </h3>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FAChip color={getPriorityColor(goal.priority)}>
                      {getPriorityLabel(goal.priority)}
                    </FAChip>
                    <FAChip color={getProgressColor(goal.onTrack)}>
                      {goal.onTrack ? 'On Track' : 'Off Track'}
                    </FAChip>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Progress</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {goal.progressPercent}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: colors.progressBg }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${goal.progressPercent}%`,
                        background: goal.onTrack
                          ? `linear-gradient(90deg, ${colors.success} 0%, ${colors.primary} 100%)`
                          : `linear-gradient(90deg, ${colors.warning} 0%, ${colors.error} 100%)`,
                      }}
                    />
                  </div>
                </div>

                {/* Amount Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Current
                    </p>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                      {formatCurrency(goal.currentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Target
                    </p>
                    <p className="text-lg font-bold" style={{ color: config.color }}>
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Monthly
                    </p>
                    <p className="text-lg font-bold" style={{ color: colors.primary }}>
                      {formatCurrency(goal.monthlyRequired)}
                    </p>
                  </div>
                </div>

                {/* Gap Analysis */}
                {goal.shortfall && goal.shortfall > 0 && (
                  <div
                    className="p-3 rounded-lg mb-4"
                    style={{
                      background: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)',
                      border: `1px solid ${colors.error}30`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm font-medium" style={{ color: colors.error }}>
                          Projected Shortfall
                        </span>
                      </div>
                      <span className="font-bold" style={{ color: colors.error }}>
                        {formatCurrency(goal.shortfall)}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      Consider increasing monthly investment by {formatCurrency(Math.ceil(goal.shortfall / (yearsRemaining * 12)))}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-4"
                  style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                >
                  <div className="text-xs" style={{ color: colors.textTertiary }}>
                    Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    <span className="mx-1">|</span>
                    {yearsRemaining > 0 ? `${yearsRemaining} years remaining` : 'Target date passed'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: colors.textTertiary }}>
                      {goal.linkedSIPs.length} SIPs linked
                    </span>
                    <button
                      onClick={() => router.push(`/advisor/goals/${goal.id}?clientId=${goal.clientId}`)}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{ background: colors.chipBg, color: colors.primary }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </FACard>
            )
          })}
        </div>
        )}

        {!loading && filteredGoals.length === 0 && (
          <FACard>
            <FAEmptyState
              icon={
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
              title="No goals found"
              description="Create your first goal to start tracking"
            />
          </FACard>
        )}

        {/* Goal Summary by Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {(['Retirement', 'Education', 'Home', 'Wealth'] as GoalType[]).map(type => {
            const typeGoals = goals.filter(g => g.type === type)
            const config = GOAL_CONFIG[type]
            const totalTarget = typeGoals.reduce((sum, g) => sum + g.targetAmount, 0)
            const totalCurrent = typeGoals.reduce((sum, g) => sum + g.currentValue, 0)

            return (
              <FATintedCard key={type}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${config.color}20` }}
                  >
                    <svg className="w-5 h-5" style={{ color: config.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {type}
                    </p>
                    <p className="text-xs" style={{ color: colors.textTertiary }}>
                      {typeGoals.length} goal{typeGoals.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: colors.textTertiary }}>Progress</span>
                    <span className="font-medium" style={{ color: config.color }}>
                      {totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </FATintedCard>
            )
          })}
        </div>
      </div>

      {/* New Goal Modal */}
      {showNewGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewGoal(false)}
          />
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl"
            style={{
              background: colors.cardBackground,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: `0 25px 50px -12px ${colors.glassShadow}`,
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: colors.cardBorder }}
            >
              <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                Create New Goal
              </h2>
              <button
                onClick={() => setShowNewGoal(false)}
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{ background: colors.chipBg, color: colors.textSecondary }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
              {/* Client Selection */}
              <FAFormSection title="Client">
                <FASelect
                  options={[
                    { value: '', label: 'Select a client...' },
                    ...clients.map(c => ({ value: c.id, label: c.name }))
                  ]}
                  value={newGoalForm.clientId}
                  onChange={(e) => setNewGoalForm(prev => ({ ...prev, clientId: e.target.value }))}
                  containerClassName="w-full"
                />
              </FAFormSection>

              <FAFormSection title="Goal Type" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {(['Retirement', 'Education', 'Home', 'Emergency', 'Wealth', 'Wedding', 'Travel', 'Custom'] as GoalType[]).map(type => {
                    const config = GOAL_CONFIG[type]
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedGoalType(type)}
                        className="p-3 rounded-xl transition-all flex flex-col items-center gap-2"
                        style={{
                          background: selectedGoalType === type
                            ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%)`
                            : isDark ? config.bgDark : config.bgLight,
                          border: `1px solid ${selectedGoalType === type ? 'transparent' : config.color}30`,
                        }}
                      >
                        <svg
                          className="w-5 h-5"
                          style={{ color: selectedGoalType === type ? '#FFFFFF' : config.color }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                        </svg>
                        <span
                          className="text-xs font-medium"
                          style={{ color: selectedGoalType === type ? '#FFFFFF' : colors.textPrimary }}
                        >
                          {type}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </FAFormSection>

              <FAFormSection title="Goal Details" className="mt-6">
                <FAInput
                  label="Goal Name"
                  placeholder="e.g., Retirement Corpus"
                  value={newGoalForm.name}
                  onChange={(e) => setNewGoalForm(prev => ({ ...prev, name: e.target.value }))}
                  containerClassName="mb-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FAInput
                    label="Target Amount"
                    type="number"
                    placeholder="5000000"
                    helperText="Total amount needed"
                    value={newGoalForm.targetAmount}
                    onChange={(e) => setNewGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                  />
                  <FAInput
                    label="Target Date"
                    type="date"
                    value={newGoalForm.targetDate}
                    onChange={(e) => setNewGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>
              </FAFormSection>

              <FAFormSection title="Investment Plan" className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <FAInput
                    label="Initial Investment"
                    type="number"
                    placeholder="100000"
                    helperText="Optional lumpsum"
                    value={newGoalForm.initialInvestment}
                    onChange={(e) => setNewGoalForm(prev => ({ ...prev, initialInvestment: e.target.value }))}
                  />
                  <FAInput
                    label="Monthly Contribution"
                    type="number"
                    placeholder="25000"
                    helperText="Via SIP"
                    value={newGoalForm.monthlyContribution}
                    onChange={(e) => setNewGoalForm(prev => ({ ...prev, monthlyContribution: e.target.value }))}
                  />
                </div>
              </FAFormSection>

              <FAFormSection title="Priority" className="mt-6">
                <div className="flex gap-3">
                  {(['High', 'Medium', 'Low'] as GoalPriority[]).map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setNewGoalForm(prev => ({ ...prev, priority }))}
                      className="flex-1 p-3 rounded-xl text-sm font-medium transition-all text-center"
                      style={{
                        background: newGoalForm.priority === priority
                          ? getPriorityColor(priority)
                          : colors.chipBg,
                        color: newGoalForm.priority === priority
                          ? '#FFFFFF'
                          : getPriorityColor(priority),
                        border: `1px solid ${getPriorityColor(priority)}30`,
                      }}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </FAFormSection>
            </div>

            <div
              className="flex items-center justify-end gap-3 px-6 py-4 border-t"
              style={{ borderColor: colors.cardBorder }}
            >
              <FAButton variant="secondary" onClick={() => setShowNewGoal(false)} disabled={submitting}>
                Cancel
              </FAButton>
              <FAButton onClick={handleCreateGoal} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Goal'}
              </FAButton>
            </div>
          </div>
        </div>
      )}
    </AdvisorLayout>
  )
}

export default GoalsDashboard
