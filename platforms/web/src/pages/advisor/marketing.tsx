/**
 * Marketing Page
 *
 * Generate branded marketing images from templates.
 * Template gallery with category filtering, live preview, and image generation.
 */

import { useState, useEffect, useRef } from 'react'
import AdvisorLayout from '@/components/layout/AdvisorLayout'
import { useFATheme, formatCurrencyCompact } from '@/utils/fa'
import { useNotification } from '@/components/advisor/shared'
import { marketingApi, getAuthToken } from '@/services/api'

// ============= Types =============

interface MarketingTemplate {
  id: string
  category: string
  name: string
  description: string
}

type CategoryFilter = 'ALL' | 'FESTIVAL' | 'MARKET' | 'NFO' | 'BIRTHDAY' | 'GENERAL'

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'FESTIVAL', label: 'Festival' },
  { key: 'MARKET', label: 'Market' },
  { key: 'NFO', label: 'NFO' },
  { key: 'BIRTHDAY', label: 'Birthday' },
  { key: 'GENERAL', label: 'General' },
]

const CATEGORY_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  FESTIVAL: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B' },
  MARKET: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6' },
  NFO: { bg: 'rgba(168, 85, 247, 0.12)', text: '#A855F7' },
  BIRTHDAY: { bg: 'rgba(236, 72, 153, 0.12)', text: '#EC4899' },
  GENERAL: { bg: 'rgba(107, 114, 128, 0.12)', text: '#6B7280' },
}

// ============= SVG Icons =============

const TemplateIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
)

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
)

const CustomizeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
)

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

const EmptyIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
  </svg>
)

// ============= Template Card =============

function TemplateCard({
  template,
  colors,
  isDark,
  onCustomize,
  isSelected,
}: {
  template: MarketingTemplate
  colors: ReturnType<typeof useFATheme>['colors']
  isDark: boolean
  onCustomize: () => void
  isSelected: boolean
}) {
  const badgeColor = CATEGORY_BADGE_COLORS[template.category] || CATEGORY_BADGE_COLORS.GENERAL

  return (
    <div
      className="p-5 rounded-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${isSelected ? colors.primary : colors.cardBorder}`,
        boxShadow: isSelected
          ? `0 4px 20px ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'}`
          : `0 2px 12px ${colors.glassShadow}`,
      }}
      onClick={onCustomize}
    >
      {/* Template thumbnail */}
      <div
        className="w-full h-32 rounded-lg mb-4 relative overflow-hidden flex items-end p-3"
        style={{
          background: (() => {
            const gradients: Record<string, string> = {
              FESTIVAL: `linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #EC4899 100%)`,
              MARKET: `linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #10B981 100%)`,
              NFO: `linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)`,
              BIRTHDAY: `linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #FBBF24 100%)`,
              GENERAL: `linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #06B6D4 100%)`,
            }
            return gradients[template.category] || gradients.GENERAL
          })(),
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <div className="absolute top-6 -right-2 w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        {/* Template name overlay */}
        <span className="relative z-10 text-white text-xs font-bold leading-tight opacity-90 line-clamp-2">
          {template.name}
        </span>
      </div>

      {/* Category badge */}
      <span
        className="inline-block text-xs px-2 py-0.5 rounded font-medium mb-2"
        style={{
          background: badgeColor.bg,
          color: badgeColor.text,
        }}
      >
        {template.category}
      </span>

      {/* Name and description */}
      <h3
        className="text-sm font-semibold mb-1 line-clamp-1"
        style={{ color: colors.textPrimary }}
      >
        {template.name}
      </h3>
      <p
        className="text-xs line-clamp-2 mb-3"
        style={{ color: colors.textTertiary }}
      >
        {template.description}
      </p>

      {/* Customize button */}
      <button
        className="w-full py-2 rounded-full text-xs font-semibold transition-all hover:shadow-md flex items-center justify-center gap-1.5"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          color: '#FFFFFF',
          boxShadow: `0 2px 8px ${colors.glassShadow}`,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onCustomize()
        }}
      >
        <CustomizeIcon />
        Customize
      </button>
    </div>
  )
}

// ============= Customize Panel =============

function CustomizePanel({
  template,
  colors,
  isDark,
  onClose,
}: {
  template: MarketingTemplate
  colors: ReturnType<typeof useFATheme>['colors']
  isDark: boolean
  onClose: () => void
}) {
  const { success, error: showError } = useNotification()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [customFields, setCustomFields] = useState<Record<string, string>>({})
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)

  // Load initial preview when template selected
  useEffect(() => {
    loadPreview()
  }, [template.id])

  const loadPreview = async () => {
    setLoadingPreview(true)
    try {
      const result = await marketingApi.renderPreview(template.id, customFields)
      setPreviewHtml(result.html)
    } catch (err: any) {
      showError('Preview failed', err?.message || 'Could not render preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleFieldChange = (key: string, value: string) => {
    setCustomFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddField = () => {
    const nextKey = `field${Object.keys(customFields).length + 1}`
    setCustomFields((prev) => ({ ...prev, [nextKey]: '' }))
  }

  const handleRemoveField = (key: string) => {
    setCustomFields((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleFieldKeyRename = (oldKey: string, newKey: string) => {
    if (!newKey.trim() || newKey === oldKey) return
    setCustomFields((prev) => {
      const entries = Object.entries(prev)
      const updated: Record<string, string> = {}
      for (const [k, v] of entries) {
        updated[k === oldKey ? newKey : k] = v
      }
      return updated
    })
  }

  const handleRefreshPreview = () => {
    loadPreview()
  }

  // Extract current HTML from iframe (includes user edits)
  const getEditedHtml = (): string | undefined => {
    if (iframeRef.current?.contentDocument) {
      // Remove contentEditable attributes and edit styles before extracting
      const doc = iframeRef.current.contentDocument
      const clone = doc.documentElement.cloneNode(true) as HTMLElement
      clone.querySelectorAll('[contenteditable]').forEach((el: any) => {
        el.removeAttribute('contenteditable')
        el.style.cursor = ''
        el.style.outline = ''
        el.style.borderRadius = ''
        el.style.transition = ''
        el.style.boxShadow = ''
      })
      return `<!DOCTYPE html><html>${clone.innerHTML}</html>`
    }
    return undefined
  }

  const handleGenerateImage = async () => {
    setGeneratingImage(true)
    try {
      const editedHtml = getEditedHtml()
      const token = getAuthToken()
      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiBase}/api/v1/marketing/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ templateId: template.id, customFields, html: editedHtml }),
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      success('Image downloaded', 'Your marketing image has been saved')
    } catch (err: any) {
      showError('Generation failed', err?.message || 'Could not generate image')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleShare = () => {
    const text = encodeURIComponent(`Check out this ${template.name} from Sparrow Invest!`)
    const whatsappUrl = `https://wa.me/?text=${text}`
    window.open(whatsappUrl, '_blank')
    success('Share link opened', 'WhatsApp share dialog opened in a new tab')
  }

  // Write preview HTML into iframe and make text editable
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(previewHtml)
        doc.close()

        // Make text elements editable after a tick
        setTimeout(() => {
          const editableSelectors = 'h1, h2, p, .brand-name, .brand-arn, .highlight'
          const elements = doc.querySelectorAll(editableSelectors)
          elements.forEach((el: any) => {
            el.contentEditable = 'true'
            el.style.cursor = 'text'
            el.style.outline = 'none'
            el.style.borderRadius = '4px'
            el.style.transition = 'box-shadow 0.2s'
          })

          // Add focus/hover styles via a style tag
          const style = doc.createElement('style')
          style.textContent = `
            [contenteditable]:hover { box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
            [contenteditable]:focus { box-shadow: 0 0 0 2px rgba(255,255,255,0.6); }
          `
          doc.head.appendChild(style)
        }, 50)
      }
    }
  }, [previewHtml])

  const badgeColor = CATEGORY_BADGE_COLORS[template.category] || CATEGORY_BADGE_COLORS.GENERAL

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.cardBorder}`,
        boxShadow: `0 4px 24px ${colors.glassShadow}`,
        height: 'fit-content',
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: colors.chipBg }}
          >
            <div style={{ color: colors.primary }}>
              <CustomizeIcon />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {template.name}
            </h3>
            <span
              className="inline-block text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: badgeColor.bg, color: badgeColor.text }}
            >
              {template.category}
            </span>
          </div>
        </div>
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: colors.chipBg, color: colors.textSecondary }}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Custom fields */}
      <div className="p-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
        <div className="flex items-center justify-between mb-3">
          <label
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            Custom Fields
          </label>
          <button
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-all hover:opacity-80"
            style={{
              background: colors.chipBg,
              color: colors.primary,
              border: `1px solid ${colors.chipBorder}`,
            }}
            onClick={handleAddField}
          >
            <PlusIcon />
            Add Field
          </button>
        </div>

        {Object.keys(customFields).length === 0 && (
          <p className="text-xs py-2" style={{ color: colors.textTertiary }}>
            No custom fields yet. Add fields like clientName, nfoName, etc.
          </p>
        )}

        <div className="space-y-2">
          {Object.entries(customFields).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <input
                className="w-[120px] h-9 px-3 rounded-lg text-xs transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
                value={key}
                placeholder="Key"
                onChange={(e) => handleFieldKeyRename(key, e.target.value)}
              />
              <input
                className="flex-1 h-9 px-3 rounded-lg text-xs transition-all focus:outline-none"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.textPrimary,
                }}
                value={value}
                placeholder="Value"
                onChange={(e) => handleFieldChange(key, e.target.value)}
              />
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80 flex-shrink-0"
                style={{ background: `${colors.error}12`, color: colors.error }}
                onClick={() => handleRemoveField(key)}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>

        {/* Refresh preview button */}
        <button
          className="mt-3 w-full py-2 rounded-full text-xs font-semibold transition-all hover:shadow-md"
          style={{
            background: colors.chipBg,
            color: colors.primary,
            border: `1px solid ${colors.chipBorder}`,
          }}
          onClick={handleRefreshPreview}
          disabled={loadingPreview}
        >
          {loadingPreview ? 'Loading...' : 'Refresh Preview'}
        </button>
      </div>

      {/* Live preview */}
      <div className="p-4" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
        <div className="flex items-center justify-between mb-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            Preview
          </label>
          {previewHtml && (
            <span className="text-xs" style={{ color: colors.textTertiary }}>
              Click text to edit directly
            </span>
          )}
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: `1px solid ${colors.cardBorder}`,
            width: '100%',
            height: 400,
            background: isDark ? '#1a1a2e' : '#f8fafc',
          }}
        >
          {loadingPreview ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <SpinnerIcon />
                <span className="text-xs" style={{ color: colors.textTertiary }}>
                  Loading preview...
                </span>
              </div>
            </div>
          ) : previewHtml ? (
            <iframe
              ref={iframeRef}
              className="w-full h-full"
              sandbox="allow-same-origin allow-scripts"
              title="Template Preview"
              style={{ border: 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2" style={{ color: colors.textTertiary }}>
                <EmptyIcon />
                <span className="text-xs">No preview available</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 flex gap-2">
        <button
          className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            boxShadow: `0 4px 14px ${colors.glassShadow}`,
          }}
          onClick={handleGenerateImage}
          disabled={generatingImage}
        >
          {generatingImage ? <SpinnerIcon /> : <DownloadIcon />}
          {generatingImage ? 'Generating...' : 'Generate Image'}
        </button>
        <button
          className="py-2.5 px-4 rounded-full font-semibold text-sm transition-all hover:shadow-md flex items-center gap-2"
          style={{
            background: colors.chipBg,
            color: colors.primary,
            border: `1px solid ${colors.chipBorder}`,
          }}
          onClick={handleShare}
        >
          <ShareIcon />
          Share
        </button>
      </div>
    </div>
  )
}

// ============= Main Page =============

export default function MarketingPage() {
  const { colors, isDark } = useFATheme()
  const [templates, setTemplates] = useState<MarketingTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL')
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null)

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await marketingApi.listTemplates()
        setTemplates(data)
      } catch {
        // Silently handle — empty state will show
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const filteredTemplates = activeCategory === 'ALL'
    ? templates
    : templates.filter((t) => t.category === activeCategory)

  return (
    <AdvisorLayout title="Marketing">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
          Marketing
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Create branded marketing images for clients and social media
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: activeCategory === cat.key
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                : colors.chipBg,
              color: activeCategory === cat.key ? '#FFFFFF' : colors.textSecondary,
              border: activeCategory === cat.key ? 'none' : `1px solid ${colors.chipBorder}`,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left: Template gallery */}
        <div className={selectedTemplate ? 'flex-1 min-w-0' : 'w-full'}>
          {loading ? (
            <div
              className="p-12 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <SpinnerIcon />
              <span className="text-sm mt-3" style={{ color: colors.textTertiary }}>
                Loading templates...
              </span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div
              className="p-12 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <div style={{ color: colors.textTertiary }}>
                <EmptyIcon />
              </div>
              <p className="text-sm mt-3 font-medium" style={{ color: colors.textSecondary }}>
                No templates found
              </p>
              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                {activeCategory !== 'ALL'
                  ? 'Try selecting a different category'
                  : 'Templates will appear here once configured'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  colors={colors}
                  isDark={isDark}
                  isSelected={selectedTemplate?.id === template.id}
                  onCustomize={() => setSelectedTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Customize panel */}
        {selectedTemplate && (
          <div className="w-[420px] flex-shrink-0 sticky top-6">
            <CustomizePanel
              key={selectedTemplate.id}
              template={selectedTemplate}
              colors={colors}
              isDark={isDark}
              onClose={() => setSelectedTemplate(null)}
            />
          </div>
        )}
      </div>
    </AdvisorLayout>
  )
}
