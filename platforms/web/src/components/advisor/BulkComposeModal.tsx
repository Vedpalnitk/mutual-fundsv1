import { useState, useEffect, useRef, useCallback } from 'react'
import { communicationsApi, clientsApi, CommunicationTemplate, CommunicationPreview } from '@/services/api'
import { useFATheme } from '@/utils/fa'
import {
  FALabel,
  FASelect,
  FAButton,
  FASearchInput,
  FALoadingState,
  FAChip,
} from '@/components/advisor/shared'

interface BulkComposeModalProps {
  onClose: () => void
}

type Step = 'recipients' | 'compose' | 'review'

interface ClientOption {
  id: string
  name: string
  email: string
  phone: string | null
}

interface SendResult {
  clientId: string
  clientName: string
  success: boolean
  error?: string
}

function HtmlPreview({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(`<!DOCTYPE html><html><head><style>body{font-family:system-ui,sans-serif;font-size:14px;color:#333;margin:8px;}</style></head><body>${html}</body></html>`)
        doc.close()
      }
    }
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      title="Email Preview"
      className="w-full rounded-xl"
      style={{ minHeight: 140, maxHeight: 250, border: 'none' }}
      sandbox="allow-same-origin"
    />
  )
}

export default function BulkComposeModal({ onClose }: BulkComposeModalProps) {
  const { colors } = useFATheme()
  const [step, setStep] = useState<Step>('recipients')

  // Step 1: Recipients
  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [selectedClients, setSelectedClients] = useState<ClientOption[]>([])
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 2: Compose (email only for bulk)
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [selectedType, setSelectedType] = useState('')
  const [preview, setPreview] = useState<CommunicationPreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Step 3: Review & Send
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null)
  const [error, setError] = useState('')

  // Fetch clients
  const fetchClients = useCallback(async (search: string) => {
    setLoadingClients(true)
    try {
      const result = await clientsApi.list<ClientOption>({ search, limit: 50 })
      setClients(result.data)
    } catch {
      setClients([])
    } finally {
      setLoadingClients(false)
    }
  }, [])

  useEffect(() => {
    fetchClients('')
  }, [fetchClients])

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      fetchClients(clientSearch)
    }, 300)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [clientSearch, fetchClients])

  // Load templates when entering compose step
  useEffect(() => {
    if (step === 'compose' && templates.length === 0) {
      communicationsApi.getTemplates().then(t => {
        setTemplates(t)
        if (t.length > 0 && !selectedType) setSelectedType(t[0].type)
      }).catch(() => {})
    }
  }, [step, templates.length, selectedType])

  // Load preview using first selected client's data
  useEffect(() => {
    if (step !== 'compose' || !selectedType || selectedClients.length === 0) return
    setLoadingPreview(true)
    communicationsApi.preview({
      clientId: selectedClients[0].id,
      type: selectedType,
    }).then(p => {
      setPreview(p)
    }).catch(() => {
      setPreview(null)
    }).finally(() => setLoadingPreview(false))
  }, [step, selectedType, selectedClients])

  const toggleClient = (client: ClientOption) => {
    setSelectedClients(prev => {
      const exists = prev.find(c => c.id === client.id)
      if (exists) return prev.filter(c => c.id !== client.id)
      return [...prev, client]
    })
  }

  const isSelected = (clientId: string) => selectedClients.some(c => c.id === clientId)

  const toggleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients([...clients])
    }
  }

  const handleSend = async () => {
    setSending(true)
    setSendProgress(0)
    setError('')
    try {
      // Simulate progress while waiting for response
      const progressInterval = setInterval(() => {
        setSendProgress(p => Math.min(p + 5, 90))
      }, 200)

      const result = await communicationsApi.sendBulk({
        clientIds: selectedClients.map(c => c.id),
        channel: channel === 'email' ? 'EMAIL' : 'WHATSAPP',
        type: selectedType,
        subject: preview?.emailSubject || '',
      })

      clearInterval(progressInterval)
      setSendProgress(100)
      setSendResults(result.results)

      // Open WhatsApp links if any
      if (channel === 'whatsapp') {
        const waLinks = result.results.filter(r => r.waLink)
        if (waLinks.length > 0) {
          window.open(waLinks[0].waLink, '_blank')
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const sentCount = sendResults?.filter(r => r.success).length || 0
  const failedCount = sendResults?.filter(r => !r.success).length || 0

  const steps = [
    { id: 'recipients' as Step, label: 'Recipients' },
    { id: 'compose' as Step, label: 'Compose' },
    { id: 'review' as Step, label: 'Review' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Bulk Send</h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Send communications to multiple clients</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg" style={{ background: colors.chipBg, color: colors.textSecondary }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{
                    background: step === s.id || steps.findIndex(x => x.id === step) > i
                      ? colors.primary
                      : colors.chipBg,
                    color: step === s.id || steps.findIndex(x => x.id === step) > i
                      ? '#fff'
                      : colors.textTertiary,
                  }}
                >
                  {steps.findIndex(x => x.id === step) > i ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: step === s.id ? colors.textPrimary : colors.textTertiary }}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px" style={{ background: colors.cardBorder }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          {/* Step 1: Select Recipients */}
          {step === 'recipients' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <FASearchInput
                    value={clientSearch}
                    onChange={setClientSearch}
                    placeholder="Search clients..."
                  />
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap"
                  style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.cardBorder}` }}
                >
                  {selectedClients.length === clients.length && clients.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {selectedClients.length > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm"
                  style={{ background: `${colors.primary}08`, border: `1px solid ${colors.cardBorder}` }}
                >
                  <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={{ color: colors.textPrimary }}>{selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected</span>
                </div>
              )}

              {loadingClients ? (
                <FALoadingState message="Loading clients..." />
              ) : clients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: colors.textTertiary }}>
                    {clientSearch ? 'No clients found' : 'No clients available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clients.map(client => {
                    const selected = isSelected(client.id)
                    return (
                      <button
                        key={client.id}
                        onClick={() => toggleClient(client)}
                        className="w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all"
                        style={{
                          background: selected ? `${colors.primary}08` : colors.chipBg,
                          border: `1px solid ${selected ? colors.primary : colors.cardBorder}`,
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            background: selected ? colors.primary : 'transparent',
                            border: `2px solid ${selected ? colors.primary : colors.textTertiary}`,
                          }}
                        >
                          {selected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                          style={{ background: `${colors.primary}15`, color: colors.primary }}
                        >
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                            {client.name}
                          </p>
                          <p className="text-xs truncate" style={{ color: colors.textTertiary }}>
                            {client.email}
                            {client.phone ? ` · ${client.phone}` : ''}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 2: Choose Template & Channel */}
          {step === 'compose' && (
            <>
              {/* Channel Toggle */}
              <div
                className="flex rounded-xl p-1 mb-5"
                style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
              >
                {([
                  { id: 'email' as Channel, label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                  { id: 'whatsapp' as Channel, label: 'WhatsApp', icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' },
                ]).map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setChannel(ch.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: channel === ch.id ? colors.background : 'transparent',
                      color: channel === ch.id ? colors.primary : colors.textSecondary,
                      boxShadow: channel === ch.id ? `0 1px 3px ${colors.glassShadow}` : 'none',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={ch.icon} />
                    </svg>
                    {ch.label}
                  </button>
                ))}
              </div>

              {/* Template */}
              <div className="mb-4">
                <FALabel>Template</FALabel>
                <FASelect
                  options={templates.map(t => ({ value: t.type, label: t.label }))}
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                />
              </div>

              {/* Preview */}
              <div className="mb-4">
                <FALabel>
                  Preview
                  <span className="normal-case font-normal ml-1" style={{ color: colors.textTertiary }}>
                    (showing for {selectedClients[0]?.name})
                  </span>
                </FALabel>
                {loadingPreview ? (
                  <div
                    className="h-32 rounded-xl flex items-center justify-center"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}` }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
                      />
                      <span className="text-sm" style={{ color: colors.textSecondary }}>Loading preview...</span>
                    </div>
                  </div>
                ) : preview ? (
                  channel === 'email' ? (
                    <>
                      <div
                        className="px-3 py-2 rounded-t-xl text-sm"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderBottom: 'none', color: colors.textSecondary }}
                      >
                        Subject: {preview.emailSubject}
                      </div>
                      <div
                        className="rounded-b-xl overflow-hidden"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}` }}
                      >
                        <HtmlPreview html={preview.emailBody} />
                      </div>
                    </>
                  ) : (
                    <div
                      className="px-4 py-3 rounded-xl text-sm whitespace-pre-wrap"
                      style={{
                        background: colors.inputBg,
                        border: `1px solid ${colors.inputBorder}`,
                        color: colors.textPrimary,
                      }}
                    >
                      {preview.whatsappBody}
                    </div>
                  )
                ) : (
                  <div
                    className="h-20 rounded-xl flex items-center justify-center"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}` }}
                  >
                    <span className="text-sm" style={{ color: colors.textTertiary }}>Select a template to see preview</span>
                  </div>
                )}
              </div>

              <p className="text-xs" style={{ color: colors.textTertiary }}>
                Each client will receive a personalized version of this template with their own data.
              </p>
            </>
          )}

          {/* Step 3: Review & Send */}
          {step === 'review' && (
            <>
              {sendResults ? (
                /* Results Summary */
                <>
                  <div className="text-center mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: failedCount === 0 ? `${colors.success}15` : `${colors.warning}15` }}
                    >
                      <svg
                        className="w-8 h-8"
                        style={{ color: failedCount === 0 ? colors.success : colors.warning }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={failedCount === 0
                          ? 'M5 13l4 4L19 7'
                          : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                        } />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      {failedCount === 0 ? 'All messages sent!' : 'Sending complete'}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <span className="text-sm" style={{ color: colors.success }}>{sentCount} sent</span>
                      {failedCount > 0 && (
                        <span className="text-sm" style={{ color: colors.error }}>{failedCount} failed</span>
                      )}
                    </div>
                  </div>

                  {/* Individual results */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {sendResults.map(result => (
                      <div
                        key={result.clientId}
                        className="flex items-center gap-3 p-2.5 rounded-lg"
                        style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: result.success ? `${colors.success}15` : `${colors.error}15` }}
                        >
                          {result.success ? (
                            <svg className="w-3 h-3" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm flex-1 truncate" style={{ color: colors.textPrimary }}>
                          {result.clientName}
                        </span>
                        {result.error && (
                          <span className="text-xs" style={{ color: colors.error }}>{result.error}</span>
                        )}
                        {result.waLink && (
                          <button
                            onClick={() => window.open(result.waLink, '_blank')}
                            className="text-xs font-medium"
                            style={{ color: colors.success }}
                          >
                            Open
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Review before send */
                <>
                  <div className="space-y-3 mb-6">
                    {/* Recipients summary */}
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Recipients</span>
                      </div>
                      <p className="text-sm" style={{ color: colors.textPrimary }}>
                        {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedClients.slice(0, 8).map(c => (
                          <FAChip key={c.id} size="sm" color={colors.primary}>{c.name}</FAChip>
                        ))}
                        {selectedClients.length > 8 && (
                          <FAChip size="sm" color={colors.textTertiary}>+{selectedClients.length - 8} more</FAChip>
                        )}
                      </div>
                    </div>

                    {/* Channel & Template */}
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: colors.chipBg, border: `1px solid ${colors.cardBorder}` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Channel & Template</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FAChip size="sm" color={channel === 'email' ? colors.primary : colors.success}>
                          {channel === 'email' ? 'Email' : 'WhatsApp'}
                        </FAChip>
                        <span className="text-sm" style={{ color: colors.textPrimary }}>
                          {templates.find(t => t.type === selectedType)?.label || selectedType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar while sending */}
                  {sending && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Sending...</span>
                        <span className="text-xs" style={{ color: colors.textTertiary }}>{sendProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.chipBg }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${sendProgress}%`,
                            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm"
                      style={{ background: `${colors.error}15`, color: colors.error }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                      </svg>
                      {error}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
          <div>
            {step !== 'recipients' && !sendResults && (
              <button
                onClick={() => setStep(step === 'compose' ? 'recipients' : 'compose')}
                disabled={sending}
                className="px-4 py-2.5 rounded-full text-sm font-medium"
                style={{ color: colors.textSecondary, background: colors.chipBg }}
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-sm font-medium"
              style={{ color: colors.textSecondary, background: colors.chipBg }}
            >
              {sendResults ? 'Close' : 'Cancel'}
            </button>
            {!sendResults && (
              <>
                {step === 'recipients' && (
                  <FAButton
                    onClick={() => setStep('compose')}
                    disabled={selectedClients.length === 0}
                  >
                    Next ({selectedClients.length})
                  </FAButton>
                )}
                {step === 'compose' && (
                  <FAButton
                    onClick={() => setStep('review')}
                    disabled={!selectedType}
                  >
                    Review
                  </FAButton>
                )}
                {step === 'review' && (
                  <FAButton
                    onClick={handleSend}
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : `Send to ${selectedClients.length} Client${selectedClients.length !== 1 ? 's' : ''}`}
                  </FAButton>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
