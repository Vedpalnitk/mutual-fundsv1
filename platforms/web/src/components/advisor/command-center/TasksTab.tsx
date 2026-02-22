import { useState, useEffect, useCallback } from 'react'
import { crmApi, CRMTask, CRMTaskSummary } from '@/services/api'
import { useFATheme } from '@/utils/fa'
import SystemAlertsBanner from './SystemAlertsBanner'

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: '#EF444420', text: '#EF4444' },
  HIGH: { bg: '#F59E0B20', text: '#F59E0B' },
  MEDIUM: { bg: '#3B82F620', text: '#3B82F6' },
  LOW: { bg: '#6B728020', text: '#6B7280' },
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const CATEGORY_LABELS: Record<string, string> = {
  FOLLOW_UP: 'Follow Up',
  REVIEW: 'Review',
  ONBOARDING: 'Onboarding',
  KYC_UPDATE: 'KYC Update',
  COMPLAINT: 'Complaint',
  GENERAL: 'General',
}

interface TasksTabProps {
  staffList: any[]
  clientList: any[]
}

export default function TasksTab({ staffList, clientList }: TasksTabProps) {
  const { colors, isDark } = useFATheme()
  const [tasks, setTasks] = useState<CRMTask[]>([])
  const [summary, setSummary] = useState<CRMTaskSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<CRMTask | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', description: '', clientId: '', assignedToId: '', dueDate: '', priority: 'MEDIUM', category: 'GENERAL' })
  const [saving, setSaving] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      const [taskData, summaryData] = await Promise.all([
        crmApi.listTasks(params),
        crmApi.getTaskSummary(),
      ])
      setTasks(taskData)
      setSummary(summaryData)
    } catch {} finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return
    try {
      setSaving(true)
      const data = {
        title: taskForm.title,
        description: taskForm.description || undefined,
        clientId: taskForm.clientId || undefined,
        assignedToId: taskForm.assignedToId || undefined,
        dueDate: taskForm.dueDate || undefined,
        priority: taskForm.priority,
        category: taskForm.category,
      }
      if (editingTask) {
        await crmApi.updateTask(editingTask.id, data)
      } else {
        await crmApi.createTask(data)
      }
      setShowTaskForm(false)
      setEditingTask(null)
      setTaskForm({ title: '', description: '', clientId: '', assignedToId: '', dueDate: '', priority: 'MEDIUM', category: 'GENERAL' })
      fetchTasks()
    } catch {} finally { setSaving(false) }
  }

  const handleEditTask = (task: CRMTask) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      clientId: task.clientId || '',
      assignedToId: task.assignedToId || '',
      dueDate: task.dueDate || '',
      priority: task.priority,
      category: task.category,
    })
    setShowTaskForm(true)
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await crmApi.updateTask(id, { status: 'CANCELLED' } as Partial<CRMTask>)
      fetchTasks()
    } catch {}
  }

  const handleCompleteTask = async (id: string) => {
    try {
      await crmApi.completeTask(id)
      fetchTasks()
    } catch {}
  }

  return (
    <>
      {/* System Alerts Banner */}
      <SystemAlertsBanner />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: summary.total, color: colors.primary },
            { label: 'Open', value: summary.open, color: colors.primary },
            { label: 'In Progress', value: summary.inProgress, color: colors.warning },
            { label: 'Overdue', value: summary.overdue, color: colors.error },
            { label: 'Done (month)', value: summary.completedThisMonth, color: colors.success },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl"
              style={{
                background: `${stat.color}08`,
                border: `1px solid ${stat.color}20`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: stat.color }}>{stat.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: colors.textPrimary }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Add */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: statusFilter === s ? `${colors.primary}20` : 'transparent',
                color: statusFilter === s ? colors.primary : colors.textTertiary,
                border: `1px solid ${statusFilter === s ? `${colors.primary}40` : colors.cardBorder}`,
              }}
            >
              {s ? STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowTaskForm(true)}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          + New Task
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED'
            return (
              <div
                key={task.id}
                className="p-4 rounded-xl flex items-center gap-4"
                style={{
                  background: isDark ? colors.chipBg : colors.inputBg,
                  border: `1px solid ${isOverdue ? `${colors.error}40` : colors.cardBorder}`,
                }}
              >
                {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="w-5 h-5 rounded-md border-2 flex-shrink-0 transition-all hover:scale-110"
                    style={{ borderColor: colors.primary }}
                    title="Mark complete"
                  />
                )}
                {task.status === 'COMPLETED' && (
                  <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center" style={{ background: colors.success }}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`} style={{ color: colors.textPrimary }}>
                      {task.title}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: pc.bg, color: pc.text }}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.textTertiary }}>
                      {CATEGORY_LABELS[task.category] || task.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {task.clientName && (
                      <span className="text-xs" style={{ color: colors.textTertiary }}>Client: {task.clientName}</span>
                    )}
                    {task.assignedToName && (
                      <span className="text-xs" style={{ color: colors.textTertiary }}>Assigned: {task.assignedToName}</span>
                    )}
                  </div>
                </div>
                {task.dueDate && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: isOverdue ? colors.error : colors.textTertiary }}>
                      {isOverdue ? 'Overdue' : 'Due'}
                    </p>
                    <p className="text-xs font-medium" style={{ color: isOverdue ? colors.error : colors.textSecondary }}>
                      {task.dueDate}
                    </p>
                  </div>
                )}
                {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-1.5 rounded-lg transition-all hover:scale-110"
                      style={{ color: colors.textTertiary }}
                      title="Edit task"
                      onMouseEnter={e => e.currentTarget.style.color = colors.primary}
                      onMouseLeave={e => e.currentTarget.style.color = colors.textTertiary}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg transition-all hover:scale-110"
                      style={{ color: colors.textTertiary }}
                      title="Cancel task"
                      onMouseEnter={e => e.currentTarget.style.color = colors.error}
                      onMouseLeave={e => e.currentTarget.style.color = colors.textTertiary}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowTaskForm(false); setEditingTask(null) }}>
          <div
            className="w-full max-w-lg mx-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: isDark ? colors.backgroundSecondary : colors.background, border: `1px solid ${colors.cardBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-5" style={{ color: colors.textPrimary }}>{editingTask ? 'Edit Task' : 'New Task'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Title *</label>
                <input className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Task title" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Description</label>
                <textarea className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none resize-none" rows={3}
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Priority</label>
                  <select className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Category</label>
                  <select className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Due Date</label>
                <input type="date" className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Client</label>
                <select className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={taskForm.clientId} onChange={(e) => setTaskForm({ ...taskForm, clientId: e.target.value })}>
                  <option value="">-- None --</option>
                  {clientList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Assign To</label>
                <select className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={taskForm.assignedToId} onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}>
                  <option value="">-- Unassigned --</option>
                  {staffList.filter((s: any) => s.isActive).map((s: any) => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowTaskForm(false); setEditingTask(null) }} className="flex-1 py-2.5 rounded-full text-sm font-semibold" style={{ color: colors.textSecondary, border: `1px solid ${colors.cardBorder}` }}>Cancel</button>
              <button onClick={handleCreateTask} disabled={!taskForm.title.trim() || saving}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white hover:shadow-lg disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}>
                {saving ? (editingTask ? 'Saving...' : 'Creating...') : (editingTask ? 'Save Changes' : 'Create Task')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
