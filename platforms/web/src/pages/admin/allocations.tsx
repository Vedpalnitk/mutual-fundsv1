import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { allocationsApi, AllocationStrategy, AllocationComponent, RiskConstraint } from '@/services/api'

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

// Allocation bar colors
const ALLOCATION_COLORS = [
  { bg: '#2563EB', light: 'rgba(37, 99, 235, 0.15)' },
  { bg: '#7C3AED', light: 'rgba(124, 58, 237, 0.15)' },
  { bg: '#10B981', light: 'rgba(16, 185, 129, 0.15)' },
  { bg: '#F59E0B', light: 'rgba(245, 158, 11, 0.15)' },
  { bg: '#EC4899', light: 'rgba(236, 72, 153, 0.15)' },
  { bg: '#06B6D4', light: 'rgba(6, 182, 212, 0.15)' },
]

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

const mockStrategies: AllocationStrategy[] = [
  {
    id: 'strat-1',
    personaId: 'persona-1',
    name: 'Conservative Shield Strategy',
    description: 'Low-risk allocation focused on capital preservation with stable returns.',
    version: '1.0.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      { id: 'comp-1', strategyId: 'strat-1', label: 'Debt Funds', allocationPercent: 60, note: 'Government and corporate bonds', displayOrder: 0 },
      { id: 'comp-2', strategyId: 'strat-1', label: 'Liquid Funds', allocationPercent: 25, note: 'Short-term money market', displayOrder: 1 },
      { id: 'comp-3', strategyId: 'strat-1', label: 'Large Cap Equity', allocationPercent: 15, note: 'Blue-chip stocks', displayOrder: 2 },
    ],
    constraints: [
      { id: 'con-1', strategyId: 'strat-1', constraintType: 'max_volatility', constraintValue: 8, description: 'Maximum portfolio volatility 8%' },
      { id: 'con-2', strategyId: 'strat-1', constraintType: 'min_liquidity', constraintValue: 0.3, description: 'Minimum 30% in liquid assets' },
    ],
  },
  {
    id: 'strat-2',
    personaId: 'persona-2',
    name: 'Balanced Growth Strategy',
    description: 'Balanced approach with moderate risk for steady growth over time.',
    version: '2.1.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      { id: 'comp-4', strategyId: 'strat-2', label: 'Large Cap Equity', allocationPercent: 35, note: 'Stable equity exposure', displayOrder: 0 },
      { id: 'comp-5', strategyId: 'strat-2', label: 'Mid Cap Equity', allocationPercent: 20, note: 'Growth potential', displayOrder: 1 },
      { id: 'comp-6', strategyId: 'strat-2', label: 'Debt Funds', allocationPercent: 30, note: 'Fixed income stability', displayOrder: 2 },
      { id: 'comp-7', strategyId: 'strat-2', label: 'Gold/Commodities', allocationPercent: 15, note: 'Inflation hedge', displayOrder: 3 },
    ],
    constraints: [
      { id: 'con-3', strategyId: 'strat-2', constraintType: 'max_volatility', constraintValue: 15, description: 'Maximum portfolio volatility 15%' },
    ],
  },
  {
    id: 'strat-3',
    personaId: 'persona-3',
    name: 'Aggressive Growth Strategy',
    description: 'High-growth allocation targeting maximum returns with higher risk tolerance.',
    version: '1.2.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      { id: 'comp-8', strategyId: 'strat-3', label: 'Small Cap Equity', allocationPercent: 30, note: 'High growth potential', displayOrder: 0 },
      { id: 'comp-9', strategyId: 'strat-3', label: 'Mid Cap Equity', allocationPercent: 35, note: 'Growth stocks', displayOrder: 1 },
      { id: 'comp-10', strategyId: 'strat-3', label: 'Sectoral Funds', allocationPercent: 20, note: 'Tech and healthcare focus', displayOrder: 2 },
      { id: 'comp-11', strategyId: 'strat-3', label: 'International Equity', allocationPercent: 15, note: 'Global diversification', displayOrder: 3 },
    ],
    constraints: [
      { id: 'con-4', strategyId: 'strat-3', constraintType: 'min_horizon', constraintValue: 7, description: 'Minimum investment horizon 7 years' },
    ],
  },
]

const AllocationsPage = () => {
  const colors = useV4Colors()
  const isDark = useDarkMode()
  const [strategies, setStrategies] = useState<AllocationStrategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<AllocationStrategy | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    personaId: '',
    description: '',
    version: '1.0.0',
    isActive: true,
  })

  const [componentForm, setComponentForm] = useState({
    label: '',
    allocationPercent: 0,
    note: '',
  })

  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    setLoading(true)
    try {
      if (useMockData) {
        setStrategies(mockStrategies)
      } else {
        const data = await allocationsApi.list()
        setStrategies(data)
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
      personaId: '',
      description: '',
      version: '1.0.0',
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (strategy: AllocationStrategy) => {
    setIsCreateMode(false)
    setSelectedStrategy(strategy)
    setFormData({
      name: strategy.name,
      personaId: strategy.personaId,
      description: strategy.description || '',
      version: strategy.version,
      isActive: strategy.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      if (useMockData) {
        if (isCreateMode) {
          const newStrategy: AllocationStrategy = {
            id: `strat-${Date.now()}`,
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            components: [],
            constraints: [],
          }
          setStrategies([...strategies, newStrategy])
        } else if (selectedStrategy) {
          setStrategies(strategies.map(s =>
            s.id === selectedStrategy.id
              ? { ...s, ...formData, updatedAt: new Date().toISOString() }
              : s
          ))
        }
      } else {
        if (isCreateMode) {
          await allocationsApi.create(formData)
        } else if (selectedStrategy) {
          await allocationsApi.update(selectedStrategy.id, formData)
        }
        await loadStrategies()
      }
      setIsModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return
    try {
      if (useMockData) {
        setStrategies(strategies.filter(s => s.id !== id))
      } else {
        await allocationsApi.delete(id)
        await loadStrategies()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddComponent = (strategy: AllocationStrategy) => {
    setSelectedStrategy(strategy)
    setComponentForm({ label: '', allocationPercent: 0, note: '' })
    setIsComponentModalOpen(true)
  }

  const handleSaveComponent = async () => {
    if (!selectedStrategy) return
    try {
      if (useMockData) {
        const newComponent: AllocationComponent = {
          id: `comp-${Date.now()}`,
          strategyId: selectedStrategy.id,
          ...componentForm,
          displayOrder: selectedStrategy.components?.length || 0,
        }
        setStrategies(strategies.map(s =>
          s.id === selectedStrategy.id
            ? { ...s, components: [...(s.components || []), newComponent] }
            : s
        ))
      } else {
        await allocationsApi.addComponent(selectedStrategy.id, componentForm)
        await loadStrategies()
      }
      setIsComponentModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteComponent = async (strategyId: string, componentId: string) => {
    try {
      if (useMockData) {
        setStrategies(strategies.map(s =>
          s.id === strategyId
            ? { ...s, components: s.components?.filter(c => c.id !== componentId) }
            : s
        ))
      } else {
        await allocationsApi.deleteComponent(strategyId, componentId)
        await loadStrategies()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getTotalAllocation = (components?: AllocationComponent[]) => {
    return components?.reduce((sum, c) => sum + c.allocationPercent, 0) || 0
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
            <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Allocation Strategies</h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Manage investment allocation strategies with components and risk constraints.</p>
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
            Add Strategy
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
            {strategies.map((strategy) => {
              const totalAllocation = getTotalAllocation(strategy.components)
              const isComplete = totalAllocation === 100

              return (
                <div
                  key={strategy.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: colors.cardBackground,
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: `0 4px 24px ${colors.glassShadow}`
                  }}
                >
                  {/* Strategy Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{strategy.name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                              v{strategy.version}
                            </span>
                            {strategy.isActive ? (
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.success}15`, color: colors.success }}>
                                Active
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.textTertiary }}>
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>{strategy.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(strategy)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                          style={{ background: colors.chipBg, color: colors.textSecondary }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(strategy.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                          style={{ background: `${colors.error}10`, color: colors.error }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Allocation Components Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Allocation Components</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium" style={{ color: isComplete ? colors.success : colors.warning }}>
                            Total: {totalAllocation}%
                          </span>
                          <button
                            onClick={() => handleAddComponent(strategy)}
                            className="text-xs font-medium flex items-center gap-1 transition-colors"
                            style={{ color: colors.primary }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Component
                          </button>
                        </div>
                      </div>

                      {/* Allocation Bar */}
                      <div className="h-10 rounded-xl overflow-hidden flex mb-4" style={{ background: colors.chipBg }}>
                        {strategy.components?.map((comp, index) => {
                          const color = ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
                          return (
                            <div
                              key={comp.id}
                              className="flex items-center justify-center text-white text-xs font-semibold transition-all"
                              style={{ width: `${comp.allocationPercent}%`, background: color.bg }}
                              title={`${comp.label}: ${comp.allocationPercent}%`}
                            >
                              {comp.allocationPercent >= 12 && `${comp.allocationPercent}%`}
                            </div>
                          )
                        })}
                        {totalAllocation < 100 && (
                          <div
                            className="flex items-center justify-center text-xs font-medium"
                            style={{ width: `${100 - totalAllocation}%`, color: colors.textTertiary }}
                          >
                            {100 - totalAllocation >= 15 && 'Unallocated'}
                          </div>
                        )}
                      </div>

                      {/* Component Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {strategy.components?.map((comp, index) => {
                          const color = ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
                          return (
                            <div
                              key={comp.id}
                              className="p-3 rounded-xl"
                              style={{
                                background: isDark ? `${color.bg}25` : color.light,
                                borderLeft: `3px solid ${color.bg}`
                              }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{comp.label}</span>
                                <button
                                  onClick={() => handleDeleteComponent(strategy.id, comp.id)}
                                  className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:opacity-70"
                                  style={{ background: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: colors.error }}
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <div className="text-lg font-bold" style={{ color: isDark ? '#FFFFFF' : color.bg }}>{comp.allocationPercent}%</div>
                              {comp.note && (
                                <div className="text-xs mt-1" style={{ color: isDark ? colors.textSecondary : colors.textTertiary }}>{comp.note}</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Risk Constraints */}
                    {strategy.constraints && strategy.constraints.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Risk Constraints</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {strategy.constraints.map((constraint) => (
                            <span
                              key={constraint.id}
                              className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
                              style={{ background: `${colors.warning}15`, color: colors.warning }}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {constraint.description}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />

      {/* Create/Edit Strategy Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isCreateMode ? 'Create Strategy' : 'Edit Strategy'}
        colors={colors}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="e.g., Conservative Shield Strategy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none resize-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              rows={3}
              placeholder="Describe this strategy..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                placeholder="1.0.0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Persona ID</label>
              <input
                type="text"
                value={formData.personaId}
                onChange={(e) => setFormData({ ...formData, personaId: e.target.value })}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                placeholder="persona-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: colors.chipBg }}>
            <div
              className="w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors"
              style={{
                background: formData.isActive ? colors.primary : 'transparent',
                border: `2px solid ${formData.isActive ? colors.primary : colors.inputBorder}`
              }}
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            >
              {formData.isActive && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <label className="text-sm cursor-pointer" style={{ color: colors.textPrimary }} onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
              Active Strategy
            </label>
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
              {isCreateMode ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Component Modal */}
      <Modal
        isOpen={isComponentModalOpen}
        onClose={() => setIsComponentModalOpen(false)}
        title="Add Component"
        colors={colors}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Label</label>
            <input
              type="text"
              value={componentForm.label}
              onChange={(e) => setComponentForm({ ...componentForm, label: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="e.g., Large Cap Equity"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Allocation %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={componentForm.allocationPercent}
              onChange={(e) => setComponentForm({ ...componentForm, allocationPercent: parseInt(e.target.value) || 0 })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Note</label>
            <input
              type="text"
              value={componentForm.note}
              onChange={(e) => setComponentForm({ ...componentForm, note: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="Optional note about this component"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setIsComponentModalOpen(false)}
              className="flex-1 h-10 rounded-full font-semibold text-sm transition-all"
              style={{ background: colors.chipBg, color: colors.textSecondary }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveComponent}
              className="flex-1 h-10 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              Add Component
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AllocationsPage
