import { useState, useEffect, useCallback } from 'react'
import { communicationsApi, CommunicationLog, CommunicationStats, CommunicationTemplate } from '@/services/api'
import { useFATheme, formatDate } from '@/utils/fa'
import {
  FACard,
  FALabel,
  FASelect,
  FAButton,
  FASearchInput,
  FAEmptyState,
  FALoadingState,
  FAChip,
} from '@/components/advisor/shared'
import ShareModal from '@/components/advisor/ShareModal'
import BulkComposeModal from '@/components/advisor/BulkComposeModal'

export default function ComposeTab() {
  const { colors } = useFATheme()
  const [stats, setStats] = useState<CommunicationStats | null>(null)
  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const [channelFilter, setChannelFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [clientSearch, setClientSearch] = useState('')

  const [showCompose, setShowCompose] = useState(false)
  const [showBulkCompose, setShowBulkCompose] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, historyData, templatesData] = await Promise.allSettled([
        communicationsApi.getStats(),
        communicationsApi.getHistory({
          channel: channelFilter || undefined,
          type: typeFilter || undefined,
          clientId: clientSearch || undefined,
          page,
          limit: 20,
        }),
        communicationsApi.getTemplates(),
      ])

      if (statsData.status === 'fulfilled') setStats(statsData.value)
      if (historyData.status === 'fulfilled') {
        setLogs(historyData.value.data)
        setTotal(historyData.value.total)
      }
      if (templatesData.status === 'fulfilled') setTemplates(templatesData.value)
    } catch (err) {
      console.error('Failed to load communications data:', err)
    } finally {
      setLoading(false)
    }
  }, [channelFilter, typeFilter, clientSearch, page])

  useEffect(() => { loadData() }, [loadData])

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'EMAIL': return colors.primary
      case 'WHATSAPP': return colors.success
      default: return colors.textTertiary
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': case 'DELIVERED': return colors.success
      case 'FAILED': return colors.error
      case 'PENDING': return colors.warning
      default: return colors.textTertiary
    }
  }

  const formatTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: colors.textSecondary }}>Send and track client communications</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkCompose(true)}
            className="px-4 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{ color: colors.primary, background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
          >
            Bulk Send
          </button>
          <FAButton onClick={() => setShowCompose(true)}>Quick Compose</FAButton>
        </div>
      </div>

      {/* KPI Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sent', value: stats.totalSent, color: colors.primary, icon: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5' },
            { label: 'Emails', value: stats.emailCount, color: colors.secondary, icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
            { label: 'WhatsApp', value: stats.whatsappCount, color: colors.success, icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' },
            { label: 'This Month', value: stats.thisMonthCount, color: colors.warning, icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
          ].map(kpi => (
            <FACard key={kpi.label}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${kpi.color}15`, color: kpi.color }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={kpi.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{kpi.value}</p>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>{kpi.label}</p>
                </div>
              </div>
            </FACard>
          ))}
        </div>
      )}

      {/* Filters */}
      <FACard className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <FALabel>Channel</FALabel>
            <FASelect
              options={[
                { value: '', label: 'All Channels' },
                { value: 'EMAIL', label: 'Email' },
                { value: 'WHATSAPP', label: 'WhatsApp' },
              ]}
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setPage(1) }}
            />
          </div>
          <div className="w-52">
            <FALabel>Type</FALabel>
            <FASelect
              options={[
                { value: '', label: 'All Types' },
                ...templates.map(t => ({ value: t.type, label: t.label })),
              ]}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <FALabel>Search Client</FALabel>
            <FASearchInput
              value={clientSearch}
              onChange={setClientSearch}
              placeholder="Client ID..."
            />
          </div>
        </div>
      </FACard>

      {/* History Table */}
      <FACard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Communication History</h3>
          <span className="text-xs" style={{ color: colors.textTertiary }}>{total} total</span>
        </div>

        {loading ? (
          <FALoadingState message="Loading history..." />
        ) : logs.length === 0 ? (
          <FAEmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            }
            title="No communications yet"
            description="Start sharing updates with your clients"
          />
        ) : (
          <>
            <div className="space-y-2">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl flex items-center justify-between"
                  style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${getChannelColor(log.channel)}15`, color: getChannelColor(log.channel) }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={
                          log.channel === 'EMAIL'
                            ? 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75'
                            : 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z'
                        } />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                        {log.subject || formatTypeLabel(log.type)}
                      </p>
                      <p className="text-xs truncate" style={{ color: colors.textTertiary }}>
                        {log.channel} · {formatTypeLabel(log.type)} · {log.sentAt ? formatDate(log.sentAt) : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <FAChip color={getStatusColor(log.status)} size="sm">{log.status}</FAChip>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-40"
                  style={{ background: colors.chipBg, color: colors.textSecondary }}
                >
                  Previous
                </button>
                <span className="text-xs" style={{ color: colors.textTertiary }}>
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= total}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-40"
                  style={{ background: colors.chipBg, color: colors.textSecondary }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </FACard>

      {/* Quick Compose Modal */}
      {showCompose && (
        <ShareModal
          clientId=""
          clientName="Client"
          onClose={() => { setShowCompose(false); loadData() }}
        />
      )}

      {/* Bulk Compose Modal */}
      {showBulkCompose && (
        <BulkComposeModal
          onClose={() => { setShowBulkCompose(false); loadData() }}
        />
      )}
    </>
  )
}
