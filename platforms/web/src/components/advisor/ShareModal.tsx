import { useState, useEffect, useRef } from 'react'
import { communicationsApi, CommunicationTemplate } from '@/services/api'
import { useFATheme } from '@/utils/fa'
import {
  FALabel,
  FAInput,
  FASelect,
  FAButton,
} from '@/components/advisor/shared'

interface ShareModalProps {
  clientId: string
  clientName: string
  defaultType?: string
  contextData?: Record<string, any>
  onClose: () => void
}

type Channel = 'email' | 'whatsapp'

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
      style={{ minHeight: 160, maxHeight: 300, border: 'none' }}
      sandbox="allow-same-origin"
    />
  )
}

export default function ShareModal({ clientId, clientName, defaultType, contextData, onClose }: ShareModalProps) {
  const { colors } = useFATheme()
  const [channel, setChannel] = useState<Channel>('email')
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [selectedType, setSelectedType] = useState(defaultType || '')
  const [subject, setSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [whatsappBody, setWhatsappBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Load templates
  useEffect(() => {
    communicationsApi.getTemplates().then(t => {
      setTemplates(t)
      if (!selectedType && t.length > 0) setSelectedType(t[0].type)
    }).catch(() => {})
  }, [])

  // Load preview when type changes
  useEffect(() => {
    if (!selectedType || !clientId) return
    setLoading(true)
    communicationsApi.preview({
      clientId,
      type: selectedType,
      contextData,
    }).then(preview => {
      setSubject(preview.emailSubject)
      setEmailBody(preview.emailBody)
      setWhatsappBody(preview.whatsappBody)
    }).catch(() => {
      setEmailBody('')
      setWhatsappBody('')
      setSubject('')
    }).finally(() => setLoading(false))
  }, [selectedType, clientId, contextData])

  const body = channel === 'email' ? emailBody : whatsappBody

  const handleSend = async () => {
    setSending(true)
    setError('')
    try {
      const result = await communicationsApi.send({
        clientId,
        channel: channel === 'email' ? 'EMAIL' : 'WHATSAPP',
        type: selectedType,
        subject,
        body,
        metadata: contextData,
      })

      if (result.waLink) {
        window.open(result.waLink, '_blank')
      }

      setSent(true)
      setTimeout(() => onClose(), 1500)
    } catch (err: any) {
      setError(err?.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              Share with {clientName}
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Send via email or WhatsApp</p>
          </div>
          <button onClick={onClose} style={{ color: colors.textSecondary }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {sent ? (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `${colors.success}15` }}
            >
              <svg className="w-8 h-8" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: colors.textPrimary }}>
              {channel === 'email' ? 'Email sent successfully!' : 'WhatsApp opened!'}
            </p>
          </div>
        ) : (
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

            {/* Template Type */}
            <div className="mb-4">
              <FALabel>Template</FALabel>
              <FASelect
                options={templates.map(t => ({ value: t.type, label: t.label }))}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              />
            </div>

            {/* Subject (email only) */}
            {channel === 'email' && (
              <div className="mb-4">
                <FALabel>Subject</FALabel>
                <FAInput
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
            )}

            {/* Body */}
            <div className="mb-4">
              <FALabel>{channel === 'email' ? 'Email Preview' : 'Message'}</FALabel>
              {loading ? (
                <div
                  className="h-40 rounded-xl flex items-center justify-center"
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
              ) : channel === 'email' ? (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}` }}
                >
                  <HtmlPreview html={emailBody} />
                </div>
              ) : (
                <textarea
                  value={whatsappBody}
                  onChange={(e) => setWhatsappBody(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.inputBorder}`,
                    color: colors.textPrimary,
                  }}
                />
              )}
            </div>

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

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-full text-sm font-medium"
                style={{ color: colors.textSecondary, background: colors.chipBg }}
              >
                Cancel
              </button>
              <FAButton
                onClick={handleSend}
                disabled={sending || !body || (channel === 'email' && !subject)}
              >
                {sending ? 'Sending...' : channel === 'email' ? 'Send Email' : 'Open WhatsApp'}
              </FAButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
