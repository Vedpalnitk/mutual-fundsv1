import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { modelsApi, MlModel, ModelVersion } from '@/services/api'

// V4 Color Palette - Refined Blue Theme (Light Mode)
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryDeep: '#1E40AF',
  accent: '#3B82F6',
  secondary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  glassBackground: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(37, 99, 235, 0.12)',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  inputBg: 'rgba(37, 99, 235, 0.02)',
  inputBorder: 'rgba(37, 99, 235, 0.12)',
  cardBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.06)',
  chipBorder: 'rgba(37, 99, 235, 0.12)',
  progressBg: 'rgba(37, 99, 235, 0.1)',
  cardBackground: '#FFFFFF',
}

// V4 Color Palette - Refined Blue Theme (Dark Mode)
const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryDeep: '#2563EB',
  accent: '#93C5FD',
  secondary: '#38BDF8',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  background: '#0B1120',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1E293B',
  glassBackground: 'rgba(17, 24, 39, 0.88)',
  glassBorder: 'rgba(96, 165, 250, 0.12)',
  glassShadow: 'rgba(0, 0, 0, 0.35)',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  inputBg: 'rgba(96, 165, 250, 0.06)',
  inputBorder: 'rgba(96, 165, 250, 0.15)',
  cardBg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.08)',
  chipBorder: 'rgba(96, 165, 250, 0.15)',
  progressBg: 'rgba(96, 165, 250, 0.15)',
  cardBackground: '#111827',
}

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkClass = document.documentElement.classList.contains('dark')
      const isDarkMedia = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isLightClass = document.documentElement.classList.contains('light')
      setIsDark(isDarkClass || (isDarkMedia && !isLightClass))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  return isDark
}

// Get colors based on dark mode
const useV4Colors = () => {
  const isDark = useDarkMode()
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT
}

// Modal Component
const Modal = ({ isOpen, onClose, title, children, colors }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; colors: typeof V4_COLORS_LIGHT }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 25px 50px -12px ${colors.glassShadow}`
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: colors.chipBg }}
          >
            <svg className="w-4 h-4" style={{ color: colors.textSecondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Use mock data for now
const useMockData = true

const mockModels: MlModel[] = [
  {
    id: 'model-1',
    name: 'Persona Classifier',
    slug: 'persona-classifier',
    modelType: 'classification',
    description: 'Classifies user profiles into investment personas using weighted scoring rules based on risk tolerance, horizon, and investment goals.',
    framework: 'Rules Engine',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [
      {
        id: 'ver-1',
        modelId: 'model-1',
        version: '1.0.0',
        storagePath: '/rules/persona-classifier/v1.0.0',
        fileSizeBytes: 0,
        metadata: { rule_count: 12, personas: 3 },
        metrics: { coverage: 1.0 },
        status: 'archived',
        isProduction: false,
        trainedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'ver-2',
        modelId: 'model-1',
        version: '2.0.0',
        storagePath: '/rules/persona-classifier/v2.0.0',
        fileSizeBytes: 0,
        metadata: { rule_count: 18, personas: 3, blended: true },
        metrics: { coverage: 1.0 },
        status: 'production',
        isProduction: true,
        trainedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'model-2',
    name: 'Fund Recommender',
    slug: 'fund-recommender',
    modelType: 'recommendation',
    description: 'Recommends mutual funds using rule-based filtering by category, risk profile, and performance thresholds.',
    framework: 'Rules Engine',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [
      {
        id: 'ver-3',
        modelId: 'model-2',
        version: '1.0.0',
        storagePath: '/rules/fund-recommender/v1.0.0',
        fileSizeBytes: 0,
        metadata: { categories: 30, scoring_factors: 8 },
        metrics: { fund_coverage: 0.95 },
        status: 'production',
        isProduction: true,
        trainedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'model-3',
    name: 'Allocation Engine',
    slug: 'allocation-engine',
    modelType: 'optimization',
    description: 'Calculates blended asset allocation using persona weights and predefined allocation templates per persona.',
    framework: 'Rules Engine',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [
      {
        id: 'ver-4',
        modelId: 'model-3',
        version: '1.0.0',
        storagePath: '/rules/allocation-engine/v1.0.0',
        fileSizeBytes: 0,
        metadata: { asset_classes: 6, constraints: 4 },
        metrics: { allocation_precision: 1.0 },
        status: 'production',
        isProduction: true,
        trainedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'model-4',
    name: 'Risk Assessor',
    slug: 'risk-assessor',
    modelType: 'assessment',
    description: 'Evaluates portfolio risk using rule-based checks for concentration, volatility limits, and diversification.',
    framework: 'Rules Engine',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [
      {
        id: 'ver-5',
        modelId: 'model-4',
        version: '1.0.0',
        storagePath: '/rules/risk-assessor/v1.0.0',
        fileSizeBytes: 0,
        metadata: { risk_factors: 5, thresholds: 12 },
        metrics: { factor_coverage: 1.0 },
        status: 'production',
        isProduction: true,
        trainedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
]

// Icon paths for model types
const modelTypeIcons: Record<string, string> = {
  classification: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  recommendation: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  optimization: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  assessment: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  rules: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  default: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
}

const ModelsPage = () => {
  const colors = useV4Colors()
  const isDark = useDarkMode()
  const [models, setModels] = useState<MlModel[]>([])
  const [selectedModel, setSelectedModel] = useState<MlModel | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set())

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    modelType: 'classification',
    description: '',
    framework: '',
  })

  const [versionForm, setVersionForm] = useState({
    version: '',
    storagePath: '',
    status: 'staging',
  })

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    setLoading(true)
    try {
      if (useMockData) {
        setModels(mockModels)
      } else {
        const data = await modelsApi.list()
        setModels(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreateMode(true)
    setFormData({
      name: '',
      slug: '',
      modelType: 'classification',
      description: '',
      framework: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (model: MlModel) => {
    setIsCreateMode(false)
    setSelectedModel(model)
    setFormData({
      name: model.name,
      slug: model.slug,
      modelType: model.modelType,
      description: model.description || '',
      framework: model.framework || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (useMockData) {
        if (isCreateMode) {
          const newModel: MlModel = {
            id: `model-${Date.now()}`,
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            versions: [],
          }
          setModels([...models, newModel])
        } else if (selectedModel) {
          setModels(models.map(m =>
            m.id === selectedModel.id
              ? { ...m, ...formData, updatedAt: new Date().toISOString() }
              : m
          ))
        }
      } else {
        if (isCreateMode) {
          await modelsApi.create(formData)
        } else if (selectedModel) {
          await modelsApi.update(selectedModel.id, formData)
        }
        await loadModels()
      }
      setIsModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return
    try {
      if (useMockData) {
        setModels(models.filter(m => m.id !== id))
      } else {
        await modelsApi.delete(id)
        await loadModels()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddVersion = (model: MlModel) => {
    setSelectedModel(model)
    const latestVersion = model.versions?.[model.versions.length - 1]?.version || '0.0.0'
    const parts = latestVersion.split('.')
    parts[2] = String(parseInt(parts[2]) + 1)
    setVersionForm({
      version: parts.join('.'),
      storagePath: `/models/${model.slug}/v${parts.join('.')}`,
      status: 'staging',
    })
    setIsVersionModalOpen(true)
  }

  const handleSaveVersion = async () => {
    if (!selectedModel) return
    try {
      if (useMockData) {
        const newVersion: ModelVersion = {
          id: `ver-${Date.now()}`,
          modelId: selectedModel.id,
          ...versionForm,
          fileSizeBytes: 1000000,
          metadata: {},
          metrics: {},
          isProduction: false,
          trainedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }
        setModels(models.map(m =>
          m.id === selectedModel.id
            ? { ...m, versions: [...(m.versions || []), newVersion] }
            : m
        ))
      } else {
        await modelsApi.createVersion(selectedModel.id, versionForm)
        await loadModels()
      }
      setIsVersionModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handlePromoteVersion = async (modelId: string, versionId: string) => {
    try {
      if (useMockData) {
        setModels(models.map(m => {
          if (m.id === modelId) {
            return {
              ...m,
              versions: m.versions?.map(v => ({
                ...v,
                isProduction: v.id === versionId,
                status: v.id === versionId ? 'production' : (v.isProduction ? 'archived' : v.status),
              })),
            }
          }
          return m
        }))
      } else {
        await modelsApi.promoteVersion(modelId, versionId)
        await loadModels()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const toggleExpanded = (modelId: string) => {
    setExpandedModels(prev => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        next.delete(modelId)
      } else {
        next.add(modelId)
      }
      return next
    })
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'production':
        return { background: `${colors.success}15`, color: colors.success }
      case 'staging':
        return { background: `${colors.warning}15`, color: colors.warning }
      case 'archived':
        return { background: colors.chipBg, color: colors.textTertiary }
      default:
        return { background: `${colors.primary}15`, color: colors.primary }
    }
  }

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return 'N/A'
    if (bytes === 0) return 'Config only'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      <Navbar mode="admin" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary }}>Admin</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Model Registry</h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Manage classification, recommendation, and allocation models (currently rule-based).</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Register Model
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-between" style={{
            background: `${colors.error}15`,
            border: `1px solid ${colors.error}30`,
            color: colors.error
          }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }} />
          </div>
        ) : (
          <div className="space-y-4">
            {models.map((model) => {
              const isExpanded = expandedModels.has(model.id)
              const productionVersion = model.versions?.find(v => v.isProduction)
              const iconPath = modelTypeIcons[model.modelType] || modelTypeIcons.default

              return (
                <div
                  key={model.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: colors.cardBackground,
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: `0 4px 24px ${colors.glassShadow}`
                  }}
                >
                  {/* Model Header */}
                  <div className="p-5 cursor-pointer" onClick={() => toggleExpanded(model.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{model.name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                              {model.modelType}
                            </span>
                            {model.framework && (
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.textSecondary }}>
                                {model.framework}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{model.description}</p>
                          <div className="flex items-center gap-4 text-xs" style={{ color: colors.textTertiary }}>
                            <span>{model.versions?.length || 0} versions</span>
                            {productionVersion && (
                              <span className="flex items-center gap-1" style={{ color: colors.success }}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Production: v{productionVersion.version}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(model) }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                          style={{ background: colors.chipBg, color: colors.textSecondary }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(model.id) }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                          style={{ background: `${colors.error}10`, color: colors.error }}
                        >
                          Delete
                        </button>
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform"
                          style={{ background: colors.chipBg, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <svg className="w-4 h-4" style={{ color: colors.textSecondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Versions */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Model Versions</span>
                          <button
                            onClick={() => handleAddVersion(model)}
                            className="text-xs font-medium flex items-center gap-1 transition-colors"
                            style={{ color: colors.primary }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Version
                          </button>
                        </div>

                        {model.versions && model.versions.length > 0 ? (
                          <div className="space-y-3">
                            {model.versions.map((version) => (
                              <div
                                key={version.id}
                                className="p-4 rounded-xl"
                                style={{
                                  background: version.isProduction ? `${colors.success}08` : colors.chipBg,
                                  border: `1px solid ${version.isProduction ? `${colors.success}30` : colors.chipBorder}`
                                }}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-sm" style={{ color: colors.textPrimary }}>v{version.version}</span>
                                    <span className="text-xs px-2 py-0.5 rounded" style={getStatusStyle(version.status)}>
                                      {version.status}
                                    </span>
                                    {version.isProduction && (
                                      <span className="text-xs flex items-center gap-1" style={{ color: colors.success }}>
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Production
                                      </span>
                                    )}
                                  </div>
                                  {!version.isProduction && (
                                    <button
                                      onClick={() => handlePromoteVersion(model.id, version.id)}
                                      className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                                      style={{ background: `${colors.success}15`, color: colors.success }}
                                    >
                                      Promote
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Size</span>
                                    <div className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>{formatBytes(version.fileSizeBytes)}</div>
                                  </div>
                                  <div>
                                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Created</span>
                                    <div className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>{version.createdAt ? formatDate(version.createdAt) : 'N/A'}</div>
                                  </div>
                                  {version.metrics && Object.keys(version.metrics).length > 0 && (
                                    <>
                                      {Object.entries(version.metrics).slice(0, 2).map(([key, value]) => (
                                        <div key={key}>
                                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>{key.replace(/_/g, ' ')}</span>
                                          <div className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>
                                            {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                          </div>
                                        </div>
                                      ))}
                                    </>
                                  )}
                                </div>

                                {version.storagePath && (
                                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.chipBorder}` }}>
                                    <span className="text-xs font-mono" style={{ color: colors.textTertiary }}>{version.storagePath}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: colors.chipBg }}>
                              <svg className="w-6 h-6" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>No versions yet. Add a version to get started.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />

      {/* Create/Edit Model Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isCreateMode ? 'Register Model' : 'Edit Model'}
        colors={colors}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value,
                slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
              })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="e.g., Persona Classifier"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="e.g., persona-classifier"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Model Type</label>
              <select
                value={formData.modelType}
                onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="classification">Classification</option>
                <option value="recommendation">Recommendation</option>
                <option value="optimization">Optimization</option>
                <option value="assessment">Assessment</option>
                <option value="rules">Rules Engine</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Framework</label>
              <input
                type="text"
                value={formData.framework}
                onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                placeholder="e.g., XGBoost, PyTorch"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none resize-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              rows={3}
              placeholder="Describe what this model does..."
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-10 rounded-full font-semibold text-sm transition-all"
              style={{ background: colors.chipBg, color: colors.textSecondary }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-10 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              {isCreateMode ? 'Register' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Version Modal */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="Add Model Version"
        colors={colors}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Version</label>
            <input
              type="text"
              value={versionForm.version}
              onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="e.g., 1.0.0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Storage Path</label>
            <input
              type="text"
              value={versionForm.storagePath}
              onChange={(e) => setVersionForm({ ...versionForm, storagePath: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="/models/model-name/v1.0.0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Status</label>
            <select
              value={versionForm.status}
              onChange={(e) => setVersionForm({ ...versionForm, status: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            >
              <option value="staging">Staging</option>
              <option value="production">Production</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setIsVersionModalOpen(false)}
              className="flex-1 h-10 rounded-full font-semibold text-sm transition-all"
              style={{ background: colors.chipBg, color: colors.textSecondary }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveVersion}
              className="flex-1 h-10 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              Add Version
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ModelsPage
