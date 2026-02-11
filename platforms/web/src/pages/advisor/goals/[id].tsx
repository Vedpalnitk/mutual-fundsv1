/**
 * Goal Detail Page
 *
 * Detailed view of a client's financial goal with progress tracking,
 * contribution history, and linked investments.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrency } from '@/utils/fa'
import { GoalType, GoalPriority } from '@/utils/faTypes'
import {
  FACard,
  FAChip,
  FAButton,
  FASectionHeader,
  FATintedCard,
  FAInput,
  FAFormSection,
  useNotification,
} from '@/components/advisor/shared'
import { goalsApi, GoalResponse, ContributionResponse, UpdateGoalDto, AddContributionDto } from '@/services/api'

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

const GoalDetailPage = () => {
  const router = useRouter()
  const { id, clientId } = router.query
  const { colors, isDark } = useFATheme()
  const { showNotification } = useNotification()

  const [goal, setGoal] = useState<GoalResponse | null>(null)
  const [contributions, setContributions] = useState<ContributionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showContributionModal, setShowContributionModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    monthlySip: '',
    notes: '',
  })

  // Contribution form state
  const [contributionForm, setContributionForm] = useState({
    amount: '',
    type: 'SIP',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  useEffect(() => {
    if (id && clientId) {
      loadGoalData()
    }
  }, [id, clientId])

  const loadGoalData = async () => {
    setLoading(true)
    try {
      const [goalData, contribData] = await Promise.all([
        goalsApi.getById(clientId as string, id as string),
        goalsApi.getContributions(clientId as string, id as string),
      ])
      setGoal(goalData)
      setContributions(contribData)

      // Initialize edit form
      setEditForm({
        name: goalData.name,
        targetAmount: goalData.targetAmount.toString(),
        targetDate: goalData.targetDate,
        monthlySip: goalData.monthlySip?.toString() || '',
        notes: goalData.notes || '',
      })
    } catch (error) {
      console.error('Failed to load goal:', error)
      showNotification('error', 'Failed to load goal details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateGoal = async () => {
    if (!goal || !clientId) return

    setSubmitting(true)
    try {
      const dto: UpdateGoalDto = {
        name: editForm.name,
        targetAmount: parseFloat(editForm.targetAmount),
        targetDate: editForm.targetDate,
        monthlySip: editForm.monthlySip ? parseFloat(editForm.monthlySip) : undefined,
        notes: editForm.notes || undefined,
      }

      await goalsApi.update(clientId as string, goal.id, dto)
      showNotification('success', 'Goal updated successfully')
      setShowEditModal(false)
      loadGoalData()
    } catch (error) {
      console.error('Failed to update goal:', error)
      showNotification('error', 'Failed to update goal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddContribution = async () => {
    if (!goal || !clientId || !contributionForm.amount) return

    setSubmitting(true)
    try {
      const dto: AddContributionDto = {
        amount: parseFloat(contributionForm.amount),
        type: contributionForm.type,
        date: contributionForm.date,
        description: contributionForm.description || undefined,
      }

      await goalsApi.addContribution(clientId as string, goal.id, dto)
      showNotification('success', 'Contribution added successfully')
      setShowContributionModal(false)
      setContributionForm({
        amount: '',
        type: 'SIP',
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
      loadGoalData()
    } catch (error) {
      console.error('Failed to add contribution:', error)
      showNotification('error', 'Failed to add contribution')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGoal = async () => {
    if (!goal || !clientId) return

    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await goalsApi.delete(clientId as string, goal.id)
      showNotification('success', 'Goal deleted successfully')
      router.push('/advisor/goals')
    } catch (error) {
      console.error('Failed to delete goal:', error)
      showNotification('error', 'Failed to delete goal')
    }
  }

  const getPriorityLabel = (priority: number): GoalPriority => {
    return priority === 1 ? 'High' : priority === 2 ? 'Medium' : 'Low'
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return colors.error
      case 2: return colors.warning
      case 3: return colors.success
      default: return colors.textSecondary
    }
  }

  if (loading) {
    return (
      <AdvisorLayout title="Goal Details">
        <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
            <span className="ml-3" style={{ color: colors.textSecondary }}>Loading goal...</span>
          </div>
        </div>
      </AdvisorLayout>
    )
  }

  if (!goal) {
    return (
      <AdvisorLayout title="Goal Details">
        <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
          <FACard>
            <div className="text-center py-12">
              <p style={{ color: colors.textSecondary }}>Goal not found</p>
              <FAButton className="mt-4" onClick={() => router.push('/advisor/goals')}>
                Back to Goals
              </FAButton>
            </div>
          </FACard>
        </div>
      </AdvisorLayout>
    )
  }

  const goalType = categoryToGoalType[goal.category] || 'Custom'
  const config = GOAL_CONFIG[goalType]
  const yearsRemaining = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000)))
  const monthlyRequired = goal.monthlySip || Math.ceil((goal.targetAmount - goal.currentAmount) / Math.max(1, yearsRemaining * 12))
  const projectedValue = goal.currentAmount + (monthlyRequired * yearsRemaining * 12)
  const onTrack = projectedValue >= goal.targetAmount
  const shortfall = onTrack ? 0 : goal.targetAmount - projectedValue

  return (
    <AdvisorLayout title={goal.name}>
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Back Button */}
        <button
          onClick={() => router.push('/advisor/goals')}
          className="flex items-center gap-2 mb-6 text-sm transition-all hover:-translate-x-1"
          style={{ color: colors.textSecondary }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Goals
        </button>

        {/* Header Card */}
        <FACard className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: isDark ? config.bgDark : config.bgLight }}
              >
                <svg className="w-8 h-8" style={{ color: config.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {goal.name}
                </h1>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  {goal.clientName || 'Client'} | {goalType} Goal
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <FAChip color={getPriorityColor(goal.priority)}>
                    {getPriorityLabel(goal.priority)} Priority
                  </FAChip>
                  <FAChip color={onTrack ? colors.success : colors.warning}>
                    {onTrack ? 'On Track' : 'Needs Attention'}
                  </FAChip>
                  <FAChip color={goal.status === 'ACTIVE' ? colors.primary : colors.textTertiary}>
                    {goal.status}
                  </FAChip>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FAButton variant="secondary" onClick={() => setShowEditModal(true)}>
                Edit Goal
              </FAButton>
              <button
                onClick={handleDeleteGoal}
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{ background: `${colors.error}15`, color: colors.error }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </FACard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Progress & Details */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Progress Section */}
            <FACard>
              <FASectionHeader title="Progress Overview" />
              <div className="mt-4">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Overall Progress</span>
                    <span className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                      {goal.progress.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-4 rounded-full overflow-hidden"
                    style={{ background: colors.progressBg }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, goal.progress)}%`,
                        background: onTrack
                          ? `linear-gradient(90deg, ${colors.success} 0%, ${config.color} 100%)`
                          : `linear-gradient(90deg, ${colors.warning} 0%, ${colors.error} 100%)`,
                      }}
                    />
                  </div>
                </div>

                {/* Amount Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl" style={{ background: colors.chipBg }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Current Value
                    </p>
                    <p className="text-xl font-bold mt-1" style={{ color: colors.textPrimary }}>
                      {formatCurrency(goal.currentAmount)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: colors.chipBg }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Target Amount
                    </p>
                    <p className="text-xl font-bold mt-1" style={{ color: config.color }}>
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: colors.chipBg }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Monthly SIP
                    </p>
                    <p className="text-xl font-bold mt-1" style={{ color: colors.primary }}>
                      {formatCurrency(monthlyRequired)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: colors.chipBg }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                      Remaining
                    </p>
                    <p className="text-xl font-bold mt-1" style={{ color: colors.textPrimary }}>
                      {formatCurrency(goal.targetAmount - goal.currentAmount)}
                    </p>
                  </div>
                </div>

                {/* Shortfall Warning */}
                {shortfall > 0 && (
                  <div
                    className="mt-4 p-4 rounded-xl"
                    style={{
                      background: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)',
                      border: `1px solid ${colors.error}30`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium" style={{ color: colors.error }}>
                          Projected Shortfall
                        </span>
                      </div>
                      <span className="text-xl font-bold" style={{ color: colors.error }}>
                        {formatCurrency(shortfall)}
                      </span>
                    </div>
                    <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                      Consider increasing monthly contribution by {formatCurrency(Math.ceil(shortfall / Math.max(1, yearsRemaining * 12)))} to meet your target.
                    </p>
                  </div>
                )}
              </div>
            </FACard>

            {/* Contributions History */}
            <FACard>
              <div className="flex items-center justify-between mb-4">
                <FASectionHeader title="Contribution History" />
                <FAButton onClick={() => setShowContributionModal(true)}>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Contribution
                </FAButton>
              </div>

              {contributions.length === 0 ? (
                <div className="text-center py-8" style={{ color: colors.textTertiary }}>
                  No contributions recorded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {contributions.map(contrib => (
                    <FATintedCard key={contrib.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ background: `${colors.success}15` }}
                          >
                            <svg className="w-5 h-5" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: colors.textPrimary }}>
                              {contrib.type}
                            </p>
                            <p className="text-sm" style={{ color: colors.textTertiary }}>
                              {new Date(contrib.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {contrib.description && ` - ${contrib.description}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold" style={{ color: colors.success }}>
                          +{formatCurrency(contrib.amount)}
                        </span>
                      </div>
                    </FATintedCard>
                  ))}
                </div>
              )}
            </FACard>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Timeline */}
            <FACard>
              <FASectionHeader title="Timeline" />
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>Target Date</span>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>
                    {new Date(goal.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>Days Remaining</span>
                  <span className="font-medium" style={{ color: goal.daysRemaining > 365 ? colors.textPrimary : colors.warning }}>
                    {goal.daysRemaining} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>Years Remaining</span>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>
                    {yearsRemaining} years
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>Created</span>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>
                    {new Date(goal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </FACard>

            {/* Linked Investments */}
            <FACard>
              <FASectionHeader title="Linked Funds" />
              <div className="mt-4">
                {goal.linkedFundCodes && goal.linkedFundCodes.length > 0 ? (
                  <div className="space-y-2">
                    {goal.linkedFundCodes.map((code, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg"
                        style={{ background: colors.chipBg }}
                      >
                        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          Fund {code}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4" style={{ color: colors.textTertiary }}>
                    No funds linked yet
                  </div>
                )}
              </div>
            </FACard>

            {/* Notes */}
            {goal.notes && (
              <FACard>
                <FASectionHeader title="Notes" />
                <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>
                  {goal.notes}
                </p>
              </FACard>
            )}
          </div>
        </div>
      </div>

      {/* Edit Goal Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: colors.cardBackground,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: colors.cardBorder }}
            >
              <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                Edit Goal
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg transition-all"
                style={{ background: colors.chipBg, color: colors.textSecondary }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <FAFormSection title="Goal Details">
                <FAInput
                  label="Goal Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  containerClassName="mb-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FAInput
                    label="Target Amount"
                    type="number"
                    value={editForm.targetAmount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                  />
                  <FAInput
                    label="Target Date"
                    type="date"
                    value={editForm.targetDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>
              </FAFormSection>

              <FAFormSection title="Investment Plan" className="mt-6">
                <FAInput
                  label="Monthly SIP"
                  type="number"
                  value={editForm.monthlySip}
                  onChange={(e) => setEditForm(prev => ({ ...prev, monthlySip: e.target.value }))}
                />
              </FAFormSection>

              <FAFormSection title="Notes" className="mt-6">
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full h-24 px-4 py-3 rounded-xl text-sm resize-none"
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textPrimary,
                  }}
                  placeholder="Add notes about this goal..."
                />
              </FAFormSection>
            </div>

            <div
              className="flex items-center justify-end gap-3 px-6 py-4 border-t"
              style={{ borderColor: colors.cardBorder }}
            >
              <FAButton variant="secondary" onClick={() => setShowEditModal(false)} disabled={submitting}>
                Cancel
              </FAButton>
              <FAButton onClick={handleUpdateGoal} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </FAButton>
            </div>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {showContributionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowContributionModal(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: colors.cardBackground,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: colors.cardBorder }}
            >
              <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                Add Contribution
              </h2>
              <button
                onClick={() => setShowContributionModal(false)}
                className="p-2 rounded-lg transition-all"
                style={{ background: colors.chipBg, color: colors.textSecondary }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <FAFormSection title="Contribution Details">
                <FAInput
                  label="Amount"
                  type="number"
                  placeholder="Enter amount"
                  value={contributionForm.amount}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, amount: e.target.value }))}
                  containerClassName="mb-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                      Type
                    </label>
                    <select
                      value={contributionForm.type}
                      onChange={(e) => setContributionForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full h-10 px-4 rounded-xl text-sm"
                      style={{
                        background: colors.inputBg,
                        border: `1px solid ${colors.inputBorder}`,
                        color: colors.textPrimary,
                      }}
                    >
                      <option value="SIP">SIP</option>
                      <option value="LUMPSUM">Lumpsum</option>
                      <option value="RETURNS">Returns</option>
                      <option value="DIVIDEND">Dividend</option>
                    </select>
                  </div>
                  <FAInput
                    label="Date"
                    type="date"
                    value={contributionForm.date}
                    onChange={(e) => setContributionForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <FAInput
                  label="Description (Optional)"
                  placeholder="E.g., Monthly SIP"
                  value={contributionForm.description}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, description: e.target.value }))}
                  containerClassName="mt-4"
                />
              </FAFormSection>
            </div>

            <div
              className="flex items-center justify-end gap-3 px-6 py-4 border-t"
              style={{ borderColor: colors.cardBorder }}
            >
              <FAButton variant="secondary" onClick={() => setShowContributionModal(false)} disabled={submitting}>
                Cancel
              </FAButton>
              <FAButton onClick={handleAddContribution} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Contribution'}
              </FAButton>
            </div>
          </div>
        </div>
      )}
    </AdvisorLayout>
  )
}

export default GoalDetailPage
