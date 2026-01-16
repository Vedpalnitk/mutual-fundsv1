import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  personasApi,
  allocationsApi,
  mlApi,
  Persona,
  AllocationStrategy,
  BlendedClassifyResponse,
  BlendedRecommendResponse,
  AllocationBreakdown,
} from '@/services/api'

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
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  glassBackground: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(37, 99, 235, 0.12)',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  inputBg: 'rgba(255, 255, 255, 0.9)',
  inputBorder: 'rgba(37, 99, 235, 0.2)',
  cardBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.06)',
  chipBorder: 'rgba(37, 99, 235, 0.12)',
  progressBg: 'rgba(37, 99, 235, 0.1)',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
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
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  glassBackground: 'rgba(30, 41, 59, 0.88)',
  glassBorder: 'rgba(96, 165, 250, 0.15)',
  glassShadow: 'rgba(0, 0, 0, 0.35)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  inputBg: 'rgba(30, 41, 59, 0.9)',
  inputBorder: 'rgba(96, 165, 250, 0.25)',
  cardBg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.08)',
  chipBorder: 'rgba(96, 165, 250, 0.15)',
  progressBg: 'rgba(96, 165, 250, 0.15)',
  cardBackground: 'rgba(30, 41, 59, 0.8)',
}

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

const useV4Colors = () => {
  const isDark = useDarkMode()
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT
}

// Icon paths
const ICONS = {
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  chart: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
  sparkles: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  arrow: 'M13 7l5 5m0 0l-5 5m5-5H6',
  play: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M5 13l4 4L19 7',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
}


// Allocation colors
const ALLOCATION_COLORS = [
  { label: 'Equity', color: '#2563EB' },
  { label: 'Debt', color: '#10B981' },
  { label: 'Hybrid', color: '#F59E0B' },
  { label: 'Gold', color: '#EAB308' },
  { label: 'International', color: '#8B5CF6' },
  { label: 'Liquid', color: '#64748B' },
]

// Demo presets
const DEMO_PRESETS = {
  conservative: {
    age: 55,
    horizon_years: 3,
    risk_tolerance: 'Conservative',
    liquidity: 'High',
    volatility: 'Low',
    knowledge: 'Beginner',
    monthly_sip: 15000,
  },
  balanced: {
    age: 35,
    horizon_years: 8,
    risk_tolerance: 'Moderate',
    liquidity: 'Medium',
    volatility: 'Medium',
    knowledge: 'Intermediate',
    monthly_sip: 25000,
  },
  aggressive: {
    age: 28,
    horizon_years: 15,
    risk_tolerance: 'Aggressive',
    liquidity: 'Low',
    volatility: 'High',
    knowledge: 'Advanced',
    monthly_sip: 40000,
  },
}

type DemoStage = 'idle' | 'classifying' | 'allocating' | 'recommending' | 'complete'

const PipelinePage = () => {
  const colors = useV4Colors()
  const isDark = useDarkMode()

  // Data state
  const [personas, setPersonas] = useState<any[]>([])
  const [allocations, setAllocations] = useState<AllocationStrategy[]>([])
  const [mlStatus, setMlStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Demo state
  const [demoStage, setDemoStage] = useState<DemoStage>('idle')
  const [demoForm, setDemoForm] = useState(DEMO_PRESETS.balanced)
  const [classifyResult, setClassifyResult] = useState<BlendedClassifyResponse | null>(null)
  const [recommendResult, setRecommendResult] = useState<BlendedRecommendResponse | null>(null)
  const [demoTiming, setDemoTiming] = useState<{ classify?: number; recommend?: number }>({})

  // Load data on mount
  useEffect(() => {
    loadPipelineData()
  }, [])

  const loadPipelineData = async () => {
    setLoading(true)
    setError(null)
    const errors: string[] = []

    try {
      // Fetch personas
      try {
        const personasData = await personasApi.list()
        if (personasData && personasData.length > 0) {
          setPersonas(personasData)
        } else {
          errors.push('No personas found')
        }
      } catch (err: any) {
        errors.push(`Personas API: ${err?.message || 'Failed to load'}`)
      }

      // Fetch allocations
      try {
        const allocationsData = await allocationsApi.list()
        if (allocationsData) {
          setAllocations(allocationsData)
        }
      } catch (err: any) {
        errors.push(`Allocations API: ${err?.message || 'Failed to load'}`)
      }

      // Check ML service health
      try {
        await mlApi.health()
        setMlStatus('online')
      } catch {
        setMlStatus('offline')
        errors.push('ML service is offline')
      }

      if (errors.length > 0) {
        setError(errors.join('. '))
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load pipeline data')
      setMlStatus('offline')
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (preset: keyof typeof DEMO_PRESETS) => {
    setDemoForm(DEMO_PRESETS[preset])
    setDemoStage('idle')
    setClassifyResult(null)
    setRecommendResult(null)
    setDemoTiming({})
  }

  const runPipeline = async () => {
    setError(null)
    setClassifyResult(null)
    setRecommendResult(null)
    setDemoTiming({})

    // Stage 1: Classification
    setDemoStage('classifying')
    const classifyStart = Date.now()

    try {
      const result = await mlApi.classifyBlended({
        profile: {
          age: demoForm.age,
          goal: 'Wealth Creation',
          target_amount: demoForm.monthly_sip * 12 * demoForm.horizon_years * 1.5,
          monthly_sip: demoForm.monthly_sip,
          lump_sum: 0,
          liquidity: demoForm.liquidity,
          risk_tolerance: demoForm.risk_tolerance,
          knowledge: demoForm.knowledge,
          volatility: demoForm.volatility,
          horizon_years: demoForm.horizon_years,
        },
      })
      setClassifyResult(result)
      setDemoTiming(prev => ({ ...prev, classify: Date.now() - classifyStart }))

      // Stage 2: Show allocation (instant from classification)
      setDemoStage('allocating')
      await new Promise(r => setTimeout(r, 500)) // Visual delay

      // Stage 3: Recommendations
      setDemoStage('recommending')
      const recommendStart = Date.now()

      // Convert allocation from decimal to percentage if needed
      const allocation = result.blended_allocation
      const needsConversion = Object.values(allocation).every(v => v <= 1)
      const normalizedAllocation: AllocationBreakdown = needsConversion
        ? {
            equity: Math.round(allocation.equity * 100),
            debt: Math.round(allocation.debt * 100),
            hybrid: Math.round(allocation.hybrid * 100),
            gold: Math.round(allocation.gold * 100),
            international: Math.round(allocation.international * 100),
            liquid: Math.round(allocation.liquid * 100),
          }
        : allocation

      const recommendations = await mlApi.recommendBlended({
        blended_allocation: normalizedAllocation,
        persona_distribution: result.distribution.reduce((acc, item) => {
          acc[item.persona.slug] = item.weight
          return acc
        }, {} as Record<string, number>),
        profile: {
          horizon_years: String(demoForm.horizon_years),
          risk_tolerance: demoForm.risk_tolerance,
        },
        top_n: 6,
        investment_amount: demoForm.monthly_sip * 12,
      })
      setRecommendResult(recommendations)
      setDemoTiming(prev => ({ ...prev, recommend: Date.now() - recommendStart }))

      setDemoStage('complete')
    } catch (err: any) {
      setError(err.message || 'Pipeline execution failed')
      setDemoStage('idle')
    }
  }

  const getRiskBandColor = (riskBand: string) => {
    switch (riskBand) {
      case 'Capital Protection':
        return colors.success
      case 'Balanced Growth':
        return colors.primary
      case 'Accelerated Growth':
        return '#7C3AED'
      default:
        return colors.textSecondary
    }
  }

  const getStageStatus = (stage: DemoStage, targetStage: DemoStage) => {
    const stageOrder: DemoStage[] = ['idle', 'classifying', 'allocating', 'recommending', 'complete']
    const currentIndex = stageOrder.indexOf(stage)
    const targetIndex = stageOrder.indexOf(targetStage)

    if (currentIndex > targetIndex) return 'complete'
    if (currentIndex === targetIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      <Navbar mode="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  Recommendation Pipeline
                </h1>
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                >
                  Admin
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                End-to-end visualization of persona classification, allocation strategy, and fund recommendations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-2"
              style={{
                background: mlStatus === 'online'
                  ? (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                  : (isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
                color: mlStatus === 'online' ? colors.success : colors.error,
                border: `1px solid ${mlStatus === 'online'
                  ? (isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.2)')
                  : (isDark ? 'rgba(248, 113, 113, 0.25)' : 'rgba(239, 68, 68, 0.2)')}`
              }}
            >
              <span className={`w-2 h-2 rounded-full ${mlStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
              ML Service {mlStatus === 'checking' ? 'Checking...' : mlStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center justify-between"
            style={{
              background: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.25)' : 'rgba(245, 158, 11, 0.2)'}`,
            }}
          >
            <span className="text-sm" style={{ color: colors.warning }}>{error}</span>
            <button onClick={() => setError(null)} className="text-sm font-medium" style={{ color: colors.warning }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Pipeline Stages */}
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
            Pipeline Stages
          </span>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stage 1: Personas */}
            <div
              className="p-5 rounded-xl"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >
                  1
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Investor Personas</h3>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Classification targets</p>
                </div>
              </div>

              <div className="space-y-3">
                {personas.length === 0 ? (
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ background: colors.chipBg, border: `1px dashed ${colors.chipBorder}` }}
                  >
                    <p className="text-sm" style={{ color: colors.textTertiary }}>
                      No personas loaded. Please ensure the API is running.
                    </p>
                  </div>
                ) : personas.map((persona) => (
                  <div
                    key={persona.id}
                    className="p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                        : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                      border: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {persona.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: `${getRiskBandColor(persona.riskBand)}15`,
                          color: getRiskBandColor(persona.riskBand),
                        }}
                      >
                        {persona.riskBand}
                      </span>
                    </div>
                    {/* Allocation bar */}
                    <div className="h-2 rounded-full overflow-hidden flex" style={{ background: colors.progressBg }}>
                      {persona.allocation && Object.entries(persona.allocation).map(([key, value], idx) => (
                        <div
                          key={key}
                          className="h-full"
                          style={{
                            width: `${value}%`,
                            background: ALLOCATION_COLORS[idx]?.color || colors.textTertiary,
                          }}
                          title={`${key}: ${value}%`}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {persona.allocation && Object.entries(persona.allocation).map(([key, value], idx) => (
                        <span key={key} className="text-xs" style={{ color: colors.textTertiary }}>
                          <span style={{ color: ALLOCATION_COLORS[idx]?.color }}>{key.charAt(0).toUpperCase()}</span> {value}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center -mx-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <path d={ICONS.arrow} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Stage 2: Allocation Strategy */}
            <div
              className="p-5 rounded-xl lg:col-start-2"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >
                  2
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Allocation Strategy</h3>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>Blended asset mix</p>
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>
                    Blending Logic
                  </p>
                  <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={colors.success}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.check} />
                      </svg>
                      Weighted persona distribution based on profile fit
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={colors.success}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.check} />
                      </svg>
                      Asset allocation computed from blended weights
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={colors.success}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.check} />
                      </svg>
                      Risk constraints applied per persona rules
                    </li>
                  </ul>
                </div>

                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>
                    Asset Classes
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALLOCATION_COLORS.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ background: item.color }} />
                        <span className="text-sm" style={{ color: colors.textSecondary }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden lg:flex items-center justify-center -mx-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <path d={ICONS.arrow} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Stage 3: Recommendations */}
            <div
              className="p-5 rounded-xl lg:col-start-3"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                >
                  3
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Fund Recommendations</h3>
                  <p className="text-xs" style={{ color: colors.textTertiary }}>ML-powered selection</p>
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: colors.primary }}>
                    Recommendation Engine
                  </p>
                  <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={colors.primary}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.sparkles} />
                      </svg>
                      Fund scoring based on historical performance
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={colors.primary}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.sparkles} />
                      </svg>
                      Category matching to target allocation
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={colors.primary}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.sparkles} />
                      </svg>
                      Diversification and expense optimization
                    </li>
                  </ul>
                </div>

                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>
                    Output
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Top-N Funds', 'Allocation %', 'Reasoning', 'Alignment Score'].map((item) => (
                      <span
                        key={item}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: colors.chipBg, color: colors.textSecondary, border: `1px solid ${colors.chipBorder}` }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Demo Section */}
        <div
          className="p-6 rounded-xl"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.play} />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Live Pipeline Demo</h2>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Test the full recommendation pipeline</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center gap-2">
              {(['classifying', 'allocating', 'recommending'] as const).map((stage, idx) => {
                const status = getStageStatus(demoStage, stage)
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        status === 'active' ? 'animate-pulse' : ''
                      }`}
                      style={{
                        background: status === 'complete'
                          ? colors.success
                          : status === 'active'
                          ? colors.primary
                          : colors.chipBg,
                        color: status === 'pending' ? colors.textTertiary : '#FFFFFF',
                      }}
                    >
                      {status === 'complete' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.check} />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < 2 && (
                      <div
                        className="w-8 h-0.5 rounded"
                        style={{
                          background: status === 'complete' ? colors.success : colors.chipBg,
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
                Investor Profile Input
              </p>

              {/* Presets */}
              <div className="flex gap-2 mb-4">
                {Object.keys(DEMO_PRESETS).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset as keyof typeof DEMO_PRESETS)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: demoForm === DEMO_PRESETS[preset as keyof typeof DEMO_PRESETS]
                        ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                        : colors.chipBg,
                      color: demoForm === DEMO_PRESETS[preset as keyof typeof DEMO_PRESETS]
                        ? '#FFFFFF'
                        : colors.textSecondary,
                      border: `1px solid ${colors.chipBorder}`,
                    }}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                ))}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Age
                  </label>
                  <input
                    type="number"
                    value={demoForm.age}
                    onChange={(e) => setDemoForm({ ...demoForm, age: Number(e.target.value) })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Horizon (Years)
                  </label>
                  <input
                    type="number"
                    value={demoForm.horizon_years}
                    onChange={(e) => setDemoForm({ ...demoForm, horizon_years: Number(e.target.value) })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Risk Tolerance
                  </label>
                  <select
                    value={demoForm.risk_tolerance}
                    onChange={(e) => setDemoForm({ ...demoForm, risk_tolerance: e.target.value })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Aggressive">Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Liquidity Need
                  </label>
                  <select
                    value={demoForm.liquidity}
                    onChange={(e) => setDemoForm({ ...demoForm, liquidity: e.target.value })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Monthly SIP
                  </label>
                  <input
                    type="number"
                    value={demoForm.monthly_sip}
                    onChange={(e) => setDemoForm({ ...demoForm, monthly_sip: Number(e.target.value) })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                    Knowledge
                  </label>
                  <select
                    value={demoForm.knowledge}
                    onChange={(e) => setDemoForm({ ...demoForm, knowledge: e.target.value })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Run Button */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={runPipeline}
                  disabled={demoStage !== 'idle' && demoStage !== 'complete'}
                  className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    boxShadow: `0 4px 14px ${colors.glassShadow}`,
                  }}
                >
                  {demoStage !== 'idle' && demoStage !== 'complete' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.refresh} />
                      </svg>
                      Running Pipeline...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.play} />
                      </svg>
                      Run Pipeline
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Panel */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
                Pipeline Output
              </p>

              {demoStage === 'idle' ? (
                <div
                  className="h-64 rounded-xl flex items-center justify-center"
                  style={{ background: colors.chipBg, border: `1px dashed ${colors.chipBorder}` }}
                >
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke={colors.textTertiary}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.sparkles} />
                    </svg>
                    <p className="text-sm" style={{ color: colors.textTertiary }}>
                      Click "Run Pipeline" to see results
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Classification Result */}
                  {classifyResult && (
                    <div
                      className="p-4 rounded-2xl"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                          Step 1: Classification
                        </span>
                        {demoTiming.classify && (
                          <span className="text-xs" style={{ color: colors.textTertiary }}>
                            {demoTiming.classify}ms
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${getRiskBandColor(classifyResult.primary_persona.riskBand)} 0%, ${getRiskBandColor(classifyResult.primary_persona.riskBand)}CC 100%)`,
                          }}
                        >
                          {classifyResult.primary_persona.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                            {classifyResult.primary_persona.name}
                          </p>
                          <p className="text-xs" style={{ color: colors.textSecondary }}>
                            Confidence: {(classifyResult.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      {/* Distribution */}
                      <div className="flex gap-2 flex-wrap">
                        {classifyResult.distribution.slice(0, 3).map((item) => (
                          <span
                            key={item.persona.slug}
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: colors.chipBg, color: colors.textSecondary }}
                          >
                            {item.persona.name.split(' ')[0]} {(item.weight * 100).toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allocation Result */}
                  {classifyResult && (demoStage === 'allocating' || demoStage === 'recommending' || demoStage === 'complete') && (
                    <div
                      className="p-4 rounded-2xl"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                        Step 2: Blended Allocation
                      </span>
                      <div className="mt-3 h-4 rounded-full overflow-hidden flex" style={{ background: colors.progressBg }}>
                        {Object.entries(classifyResult.blended_allocation)
                          .filter(([_, value]) => value > 0)
                          .map(([key, value], idx) => {
                            const pct = value <= 1 ? value * 100 : value
                            return (
                              <div
                                key={key}
                                className="h-full flex items-center justify-center text-white text-xs font-semibold"
                                style={{
                                  width: `${pct}%`,
                                  background: ALLOCATION_COLORS[idx]?.color || colors.textTertiary,
                                }}
                              >
                                {pct >= 10 && `${Math.round(pct)}%`}
                              </div>
                            )
                          })}
                      </div>
                      <div className="mt-2 flex gap-3 flex-wrap">
                        {Object.entries(classifyResult.blended_allocation)
                          .filter(([_, value]) => value > 0)
                          .map(([key, value], idx) => {
                            const pct = value <= 1 ? value * 100 : value
                            return (
                              <span key={key} className="text-xs flex items-center gap-1" style={{ color: colors.textSecondary }}>
                                <span
                                  className="w-2 h-2 rounded"
                                  style={{ background: ALLOCATION_COLORS[idx]?.color || colors.textTertiary }}
                                />
                                {key.charAt(0).toUpperCase() + key.slice(1)} {Math.round(pct)}%
                              </span>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Recommendations Result */}
                  {recommendResult && (
                    <div
                      className="p-4 rounded-2xl"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                          Step 3: Fund Recommendations
                        </span>
                        {demoTiming.recommend && (
                          <span className="text-xs" style={{ color: colors.textTertiary }}>
                            {demoTiming.recommend}ms
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Alignment Score:</span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color: recommendResult.alignment_score >= 0.8
                              ? colors.success
                              : recommendResult.alignment_score >= 0.6
                              ? colors.warning
                              : colors.error,
                          }}
                        >
                          {(recommendResult.alignment_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {recommendResult.recommendations.slice(0, 4).map((fund, idx) => (
                          <div
                            key={fund.scheme_code}
                            className="flex items-center justify-between p-2 rounded-xl"
                            style={{ background: colors.chipBg }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: colors.primary }}
                              >
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                                  {fund.scheme_name.length > 30 ? fund.scheme_name.slice(0, 30) + '...' : fund.scheme_name}
                                </p>
                                <p className="text-xs" style={{ color: colors.textTertiary }}>{fund.category}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold ml-2" style={{ color: colors.primary }}>
                              {Math.round(fund.suggested_allocation <= 1 ? fund.suggested_allocation * 100 : fund.suggested_allocation)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loading States */}
                  {(demoStage === 'classifying' || demoStage === 'recommending') && (
                    <div
                      className="p-4 rounded-2xl flex items-center justify-center"
                      style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
                    >
                      <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24" stroke={colors.primary}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.refresh} />
                      </svg>
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        {demoStage === 'classifying' ? 'Classifying investor profile...' : 'Generating fund recommendations...'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PipelinePage
