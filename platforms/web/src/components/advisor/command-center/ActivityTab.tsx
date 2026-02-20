import { useState, useEffect, useCallback, useMemo } from 'react'
import { crmApi, CRMActivity, communicationsApi, CommunicationLog } from '@/services/api'
import { useFATheme, formatDate } from '@/utils/fa'

interface TimelineItem {
  id: string
  source: 'manual' | 'sent'
  timestamp: string
  type: string
  title: string
  subtitle?: string
  clientName?: string
  status?: string
}

interface ActivityTabProps {
  clientList: any[]
}

export default function ActivityTab({ clientList }: ActivityTabProps) {
  const { colors, isDark } = useFATheme()
  const [activities, setActivities] = useState<CRMActivity[]>([])
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<'' | 'manual' | 'sent'>('')
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityForm, setActivityForm] = useState({ type: 'CALL', summary: '', details: '', clientId: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [actResult, commResult] = await Promise.allSettled([
      crmApi.listActivities(),
      communicationsApi.getHistory({ page: 1, limit: 100 }),
    ])
    if (actResult.status === 'fulfilled') setActivities(actResult.value)
    else setActivities([])
    if (commResult.status === 'fulfilled') setCommLogs(commResult.value.data)
    else setCommLogs([])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const timeline = useMemo(() => {
    const items: TimelineItem[] = []

    activities.forEach(a => {
      items.push({
        id: `act-${a.id}`,
        source: 'manual',
        timestamp: a.createdAt,
        type: a.type,
        title: a.summary,
        subtitle: a.details,
        clientName: a.clientName,
      })
    })

    commLogs.forEach(log => {
      items.push({
        id: `comm-${log.id}`,
        source: 'sent',
        timestamp: log.sentAt || log.createdAt,
        type: log.channel,
        title: log.subject || log.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        subtitle: `${log.channel} · ${log.type.replace(/_/g, ' ')}`,
        clientName: log.client?.name,
        status: log.status,
      })
    })

    // Filter
    const filtered = sourceFilter ? items.filter(i => i.source === sourceFilter) : items

    // Sort by timestamp desc
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [activities, commLogs, sourceFilter])

  const handleLogActivity = async () => {
    if (!activityForm.summary.trim()) return
    try {
      setSaving(true)
      await crmApi.createActivity({
        type: activityForm.type,
        summary: activityForm.summary,
        details: activityForm.details || undefined,
        clientId: activityForm.clientId || undefined,
      })
      setShowActivityForm(false)
      setActivityForm({ type: 'CALL', summary: '', details: '', clientId: '' })
      fetchData()
    } catch {} finally { setSaving(false) }
  }

  const getSourceIcon = (item: TimelineItem) => {
    if (item.source === 'manual') {
      return (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${colors.primary}15` }}>
          <span className="text-xs font-bold" style={{ color: colors.primary }}>{item.type.charAt(0)}</span>
        </div>
      )
    }
    const channelColor = item.type === 'EMAIL' ? colors.primary : colors.success
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${channelColor}15`, color: channelColor }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={
            item.type === 'EMAIL'
              ? 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75'
              : 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z'
          } />
        </svg>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': case 'DELIVERED': return colors.success
      case 'FAILED': return colors.error
      case 'PENDING': return colors.warning
      default: return colors.textTertiary
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[
            { value: '' as const, label: 'All' },
            { value: 'manual' as const, label: 'Manual Logs' },
            { value: 'sent' as const, label: 'Sent Messages' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: sourceFilter === f.value ? `${colors.primary}20` : 'transparent',
                color: sourceFilter === f.value ? colors.primary : colors.textTertiary,
                border: `1px solid ${sourceFilter === f.value ? `${colors.primary}40` : colors.cardBorder}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowActivityForm(true)}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          + Log Activity
        </button>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.primary}30`, borderTopColor: colors.primary }} />
        </div>
      ) : timeline.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {timeline.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl flex items-start gap-3"
              style={{ background: isDark ? colors.chipBg : colors.inputBg, border: `1px solid ${colors.cardBorder}` }}
            >
              {getSourceIcon(item)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{
                    background: item.source === 'manual' ? `${colors.primary}15` : `${colors.success}15`,
                    color: item.source === 'manual' ? colors.primary : colors.success,
                  }}>
                    {item.source === 'manual' ? item.type : item.type}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: item.source === 'manual' ? `${colors.warning}15` : `${colors.primary}15`,
                      color: item.source === 'manual' ? colors.warning : colors.primary,
                    }}
                  >
                    {item.source === 'manual' ? 'Logged' : 'Sent'}
                  </span>
                  {item.clientName && (
                    <span className="text-xs" style={{ color: colors.textTertiary }}>| {item.clientName}</span>
                  )}
                  {item.status && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: `${getStatusColor(item.status)}15`, color: getStatusColor(item.status) }}
                    >
                      {item.status}
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1" style={{ color: colors.textPrimary }}>{item.title}</p>
                {item.subtitle && <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>{item.subtitle}</p>}
                <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                  {new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Activity Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowActivityForm(false)}>
          <div
            className="w-full max-w-md mx-4 p-6 rounded-2xl"
            style={{ background: isDark ? colors.backgroundSecondary : colors.background, border: `1px solid ${colors.cardBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-5" style={{ color: colors.textPrimary }}>Log Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Type</label>
                <select className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Meeting</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Summary *</label>
                <input className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={activityForm.summary} onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })}
                  placeholder="Brief summary of the activity" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Details</label>
                <textarea className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none resize-none" rows={3}
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={activityForm.details} onChange={(e) => setActivityForm({ ...activityForm, details: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Client</label>
                <select className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  value={activityForm.clientId} onChange={(e) => setActivityForm({ ...activityForm, clientId: e.target.value })}>
                  <option value="">-- None --</option>
                  {clientList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowActivityForm(false)} className="flex-1 py-2.5 rounded-full text-sm font-semibold" style={{ color: colors.textSecondary, border: `1px solid ${colors.cardBorder}` }}>Cancel</button>
              <button onClick={handleLogActivity} disabled={!activityForm.summary.trim() || saving}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white hover:shadow-lg disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}>
                {saving ? 'Logging...' : 'Log Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
