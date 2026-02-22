import { useState } from 'react'
import { useFATheme, formatCurrency, formatCurrencyCompact, formatDate } from '@/utils/fa'
import { Client, Holding, Goal } from '@/utils/faTypes'
import { GoalResponse, CreateGoalDto, UpdateGoalDto, AddContributionDto, goalsApi } from '@/services/api'
import {
  FACard,
  FASectionHeader,
  FAChip,
  FAButton,
  FAEmptyState,
  useNotification,
} from '@/components/advisor/shared'
import MapAssetsModal from '@/components/advisor/MapAssetsModal'

interface GoalsTabProps {
  client: Client
  goals: Goal[]
  holdings: Holding[]
  onGoalsChange: (goals: Goal[]) => void
}

// Helper to map GoalResponse to Goal
const mapGoalResponse = (g: GoalResponse, clientId: string): Goal => ({
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
})

export default function GoalsTab({ client, goals, holdings, onGoalsChange }: GoalsTabProps) {
  const { colors, isDark } = useFATheme()
  const notification = useNotification()

  // Goal creation modal
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

  // Goal edit modal
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showEditGoalModal, setShowEditGoalModal] = useState(false)
  const [editGoalForm, setEditGoalForm] = useState({ name: '', category: '', targetAmount: '', currentAmount: '', targetDate: '', monthlySip: '', priority: 2, notes: '' })
  const [editGoalSubmitting, setEditGoalSubmitting] = useState(false)

  // Contribute modal
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [contributeForm, setContributeForm] = useState({ amount: '', type: 'LUMPSUM', date: new Date().toISOString().split('T')[0], description: '' })
  const [contributeSubmitting, setContributeSubmitting] = useState(false)

  // Delete state
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)
  const [deleteGoalSubmitting, setDeleteGoalSubmitting] = useState(false)

  // Map assets
  const [mapAssetsGoalId, setMapAssetsGoalId] = useState<string | null>(null)
  const [goalAssetMappings, setGoalAssetMappings] = useState<Record<string, any[]>>({})

  // Refresh goals helper
  const refreshGoals = async () => {
    const goalsData = await goalsApi.getByClient(client.id)
    onGoalsChange((goalsData || []).map((g: GoalResponse) => mapGoalResponse(g, client.id)))
  }

  // Create goal
  const handleCreateGoal = async () => {
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.targetDate) return
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
      await refreshGoals()
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

  // Edit goal
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

  const handleEditGoalSubmit = async () => {
    if (!editingGoal || !editGoalForm.name || !editGoalForm.targetAmount || !editGoalForm.targetDate) return
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
      await refreshGoals()
    } catch (err) {
      notification.error('Failed', err instanceof Error ? err.message : 'Failed to update goal')
    } finally {
      setEditGoalSubmitting(false)
    }
  }

  // Contribute
  const handleContributeGoal = (goal: Goal) => {
    setContributingGoal(goal)
    setContributeForm({ amount: '', type: 'LUMPSUM', date: new Date().toISOString().split('T')[0], description: '' })
    setShowContributeModal(true)
  }

  const handleContributeSubmit = async () => {
    if (!contributingGoal || !contributeForm.amount) return
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
      await refreshGoals()
    } catch (err) {
      notification.error('Failed', err instanceof Error ? err.message : 'Failed to add contribution')
    } finally {
      setContributeSubmitting(false)
    }
  }

  // Delete
  const handleDeleteGoal = async (goalId: string) => {
    setDeleteGoalSubmitting(true)
    try {
      await goalsApi.delete(client.id, goalId)
      notification.success('Goal Deleted', 'The goal has been removed.')
      setDeletingGoalId(null)
      await refreshGoals()
    } catch (err) {
      notification.error('Failed', err instanceof Error ? err.message : 'Failed to delete goal')
    } finally {
      setDeleteGoalSubmitting(false)
    }
  }

  return (
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
      {mapAssetsGoalId && (
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
  )
}
