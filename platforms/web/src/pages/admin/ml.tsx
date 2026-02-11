import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/layout/AdminLayout'
import {
  personasApi,
  mlApi,
  modelsApi,
  MlModel,
  ModelVersion,
  BlendedClassifyResponse,
  BlendedRecommendResponse,
  RiskResponse,
  AllocationBreakdown,
  PortfolioHolding,
  PortfolioAllocationTarget,
  PortfolioAnalysisResponse,
  OptimizeFundInput,
  OptimizationConstraints,
  OptimizePortfolioResponse,
} from '@/services/api'
import { useAdminColors, useDarkMode } from '@/utils/useAdminColors'
import { AdminModal } from '@/components/admin/shared'
import { AllocationPieChart, RiskGaugeChart } from '@/components/admin/ml'

// Alias for backward compatibility
const useV4Colors = useAdminColors

// ============= Types =============

type MainTab = 'overview' | 'testlab' | 'models'
type TestLabTab = 'classify' | 'recommend' | 'blended' | 'risk' | 'portfolio' | 'optimize'
type PipelineStage = 'idle' | 'classifying' | 'allocating' | 'recommending' | 'complete'

interface DemoFormData {
  age: number
  horizon_years: number
  risk_tolerance: 'Conservative' | 'Moderate' | 'Aggressive'
  liquidity: 'Low' | 'Medium' | 'High'
  volatility: 'Low' | 'Medium' | 'High'
  knowledge: 'Beginner' | 'Intermediate' | 'Advanced'
  monthly_sip: number
  target_amount: number
}

// ============= Constants =============

// Sage & Cream themed allocation colors
const ALLOCATION_COLORS = [
  { label: 'Equity', color: '#5B8A72' },      // Sage
  { label: 'Debt', color: '#7BA894' },        // Light sage
  { label: 'Hybrid', color: '#C4A484' },      // Warm sand
  { label: 'Gold', color: '#D4A574' },        // Warm amber
  { label: 'International', color: '#6B9AC4' }, // Soft blue
  { label: 'Liquid', color: '#8A9A91' },      // Sage gray
]

const DEMO_PRESETS: Record<string, DemoFormData> = {
  conservative: {
    age: 55,
    horizon_years: 3,
    risk_tolerance: 'Conservative',
    liquidity: 'High',
    volatility: 'Low',
    knowledge: 'Beginner',
    monthly_sip: 15000,
    target_amount: 1000000,
  },
  balanced: {
    age: 35,
    horizon_years: 8,
    risk_tolerance: 'Moderate',
    liquidity: 'Medium',
    volatility: 'Medium',
    knowledge: 'Intermediate',
    monthly_sip: 25000,
    target_amount: 5000000,
  },
  aggressive: {
    age: 28,
    horizon_years: 15,
    risk_tolerance: 'Aggressive',
    liquidity: 'Low',
    volatility: 'High',
    knowledge: 'Advanced',
    monthly_sip: 40000,
    target_amount: 10000000,
  },
}

const ICONS = {
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  chart: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
  sparkles: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  arrow: 'M13 7l5 5m0 0l-5 5m5-5H6',
  play: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M5 13l4 4L19 7',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  cpu: 'M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z',
  flask: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
}

const modelTypeIcons: Record<string, string> = {
  classification: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  recommendation: ICONS.sparkles,
  optimization: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  assessment: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  default: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
}

// ============= Main Component =============

const MLStudioPage = () => {
  const router = useRouter()
  const colors = useV4Colors()
  const isDark = useDarkMode()

  // URL state
  const [mainTab, setMainTab] = useState<MainTab>('overview')
  const [testLabTab, setTestLabTab] = useState<TestLabTab>('classify')

  // Global state
  const [mlStatus, setMlStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [error, setError] = useState<string | null>(null)

  // Overview state
  const [models, setModels] = useState<MlModel[]>([])
  const [recentClassifications, setRecentClassifications] = useState(0)
  const [recentRecommendations, setRecentRecommendations] = useState(0)

  // Test Lab state
  const [loading, setLoading] = useState(false)
  const [demoForm, setDemoForm] = useState<DemoFormData>(DEMO_PRESETS.balanced)
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle')
  const [classifyResult, setClassifyResult] = useState<BlendedClassifyResponse | null>(null)
  const [recommendResult, setRecommendResult] = useState<BlendedRecommendResponse | null>(null)
  const [riskResult, setRiskResult] = useState<RiskResponse | null>(null)
  const [demoTiming, setDemoTiming] = useState<{ classify?: number; recommend?: number }>({})

  // Blended recommend form
  const [blendedRecommendForm, setBlendedRecommendForm] = useState<{
    blended_allocation: AllocationBreakdown
    top_n: number
    investment_amount: number
    horizon_years: string
  }>({
    blended_allocation: { equity: 60, debt: 20, hybrid: 10, gold: 5, international: 5, liquid: 0 },
    top_n: 6,
    investment_amount: 100000,
    horizon_years: '12',
  })

  // Risk form
  const [riskForm, setRiskForm] = useState({
    risk_tolerance: 'Aggressive',
    horizon_years: 12,
    portfolio: [
      { scheme_code: 120503, scheme_name: 'Quant Flexi Cap', category: 'Flexi Cap', weight: 0.4, volatility: 18.5 },
      { scheme_code: 119064, scheme_name: 'Nippon Small Cap', category: 'Small Cap', weight: 0.35, volatility: 26.3 },
      { scheme_code: 120505, scheme_name: 'Quant Mid Cap', category: 'Mid Cap', weight: 0.25, volatility: 22.1 },
    ],
  })

  // Portfolio Analysis form
  const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([
    { scheme_code: 120503, scheme_name: 'Quant Flexi Cap Fund', amount: 500000, purchase_date: '2024-01-15', purchase_amount: 400000 },
    { scheme_code: 119598, scheme_name: 'Parag Parikh Flexi Cap Fund', amount: 300000, purchase_date: '2023-06-01', purchase_amount: 280000 },
  ])
  const [portfolioTargetAllocation, setPortfolioTargetAllocation] = useState<PortfolioAllocationTarget>({
    equity: 0.40,
    debt: 0.35,
    hybrid: 0.15,
    gold: 0.05,
    international: 0.05,
    liquid: 0,
  })
  const [portfolioProfile, setPortfolioProfile] = useState({
    risk_tolerance: 'Moderate',
    horizon_years: 7,
  })
  const [portfolioResult, setPortfolioResult] = useState<PortfolioAnalysisResponse | null>(null)

  // Portfolio Optimization state
  const [optimizeFunds, setOptimizeFunds] = useState<OptimizeFundInput[]>([
    { scheme_code: 120503, scheme_name: 'Quant Flexi Cap Fund', category: 'Flexi Cap', asset_class: 'equity', return_1y: 28.5, volatility: 18.2 },
    { scheme_code: 119598, scheme_name: 'Parag Parikh Flexi Cap Fund', category: 'Flexi Cap', asset_class: 'equity', return_1y: 24.3, volatility: 14.8 },
    { scheme_code: 145552, scheme_name: 'HDFC Balanced Advantage Fund', category: 'Balanced Advantage', asset_class: 'hybrid', return_1y: 18.2, volatility: 10.5 },
  ])
  const [optimizeConstraints, setOptimizeConstraints] = useState<OptimizationConstraints>({
    min_funds: 2,
    max_funds: 8,
    min_weight_per_fund: 0.05,
    max_weight_per_fund: 0.40,
  })
  const [optimizePersona, setOptimizePersona] = useState('balanced-navigator')
  const [optimizeResult, setOptimizeResult] = useState<OptimizePortfolioResponse | null>(null)

  // Models state
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set())
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [selectedModel, setSelectedModel] = useState<MlModel | null>(null)
  const [modelFormData, setModelFormData] = useState({
    name: '',
    slug: '',
    modelType: 'classification',
    description: '',
    framework: '',
  })
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [versionForm, setVersionForm] = useState({
    version: '',
    storagePath: '',
    status: 'staging',
  })

  // Parse URL params on mount
  useEffect(() => {
    const { tab, op } = router.query
    if (tab === 'testlab') {
      setMainTab('testlab')
      if (op && ['classify', 'recommend', 'blended', 'risk', 'portfolio'].includes(op as string)) {
        setTestLabTab(op as TestLabTab)
      }
    } else if (tab === 'models') {
      setMainTab('models')
    } else {
      setMainTab('overview')
    }
  }, [router.query])

  // Update URL when tab changes
  const updateTab = (tab: MainTab, op?: TestLabTab) => {
    setMainTab(tab)
    if (op) setTestLabTab(op)

    const params = new URLSearchParams()
    if (tab !== 'overview') params.set('tab', tab)
    if (tab === 'testlab' && op) params.set('op', op)

    const queryString = params.toString()
    router.push(`/admin/ml${queryString ? `?${queryString}` : ''}`, undefined, { shallow: true })
  }

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    // Check ML service health
    try {
      await mlApi.health()
      setMlStatus('online')
    } catch {
      setMlStatus('offline')
    }

    // Load models
    try {
      const modelsData = await modelsApi.list()
      setModels(modelsData)
    } catch (err: any) {
      console.error('Failed to load models:', err)
    }

    // Mock stats for now
    setRecentClassifications(45)
    setRecentRecommendations(38)
  }

  // ============= Pipeline Functions =============

  const applyPreset = (preset: keyof typeof DEMO_PRESETS) => {
    setDemoForm(DEMO_PRESETS[preset])
    setPipelineStage('idle')
    setClassifyResult(null)
    setRecommendResult(null)
    setDemoTiming({})
  }

  const runFullPipeline = async () => {
    setError(null)
    setClassifyResult(null)
    setRecommendResult(null)
    setDemoTiming({})

    // Stage 1: Classification
    setPipelineStage('classifying')
    const classifyStart = Date.now()

    try {
      const result = await mlApi.classifyBlended({
        profile: {
          age: demoForm.age,
          goal: 'Wealth Creation',
          target_amount: demoForm.target_amount,
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

      // Update blended form with classification result
      const allocation = result.blended_allocation
      const needsConversion = Object.values(allocation).every(v => v <= 1)
      setBlendedRecommendForm(prev => ({
        ...prev,
        blended_allocation: needsConversion ? {
          equity: Math.round(allocation.equity * 100),
          debt: Math.round(allocation.debt * 100),
          hybrid: Math.round(allocation.hybrid * 100),
          gold: Math.round(allocation.gold * 100),
          international: Math.round(allocation.international * 100),
          liquid: Math.round(allocation.liquid * 100),
        } : allocation,
      }))

      // Stage 2: Show allocation
      setPipelineStage('allocating')
      await new Promise(r => setTimeout(r, 500))

      // Stage 3: Recommendations
      setPipelineStage('recommending')
      const recommendStart = Date.now()

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

      setPipelineStage('complete')
    } catch (err: any) {
      setError(err.message || 'Pipeline execution failed')
      setPipelineStage('idle')
    }
  }

  const handleClassify = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mlApi.classifyBlended({ profile: demoForm as any })
      setClassifyResult(result)

      // Update blended form
      const allocation = result.blended_allocation
      const needsConversion = Object.values(allocation).every(v => v <= 1)
      setBlendedRecommendForm(prev => ({
        ...prev,
        blended_allocation: needsConversion ? {
          equity: Math.round(allocation.equity * 100),
          debt: Math.round(allocation.debt * 100),
          hybrid: Math.round(allocation.hybrid * 100),
          gold: Math.round(allocation.gold * 100),
          international: Math.round(allocation.international * 100),
          liquid: Math.round(allocation.liquid * 100),
        } : allocation,
      }))
    } catch (err: any) {
      setError(err.message || 'Classification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBlendedRecommend = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mlApi.recommendBlended({
        blended_allocation: blendedRecommendForm.blended_allocation,
        profile: { horizon_years: blendedRecommendForm.horizon_years },
        top_n: blendedRecommendForm.top_n,
        investment_amount: blendedRecommendForm.investment_amount,
      })
      setRecommendResult(result)
    } catch (err: any) {
      setError(err.message || 'Recommendations failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRiskAssess = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mlApi.assessRisk({
        profile: {
          risk_tolerance: riskForm.risk_tolerance,
          horizon_years: String(riskForm.horizon_years),
        },
        current_portfolio: riskForm.portfolio,
      })
      setRiskResult(result)
    } catch (err: any) {
      setError(err.message || 'Risk assessment failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePortfolioAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mlApi.analyzePortfolio({
        holdings: portfolioHoldings,
        target_allocation: portfolioTargetAllocation,
        profile: portfolioProfile,
      })
      setPortfolioResult(result)
    } catch (err: any) {
      setError(err.message || 'Portfolio analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizePortfolio = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mlApi.optimizePortfolio({
        persona_id: optimizePersona,
        profile: { horizon_years: '10', risk_tolerance: 'Moderate' },
        available_funds: optimizeFunds,
        constraints: optimizeConstraints,
      })
      setOptimizeResult(result)
    } catch (err: any) {
      setError(err.message || 'Portfolio optimization failed')
    } finally {
      setLoading(false)
    }
  }

  const addOptimizeFund = () => {
    setOptimizeFunds([
      ...optimizeFunds,
      { scheme_code: 0, scheme_name: '', category: '', asset_class: 'equity', return_1y: 0, volatility: 0 },
    ])
  }

  const removeOptimizeFund = (index: number) => {
    setOptimizeFunds(optimizeFunds.filter((_, i) => i !== index))
  }

  const updateOptimizeFund = (index: number, field: keyof OptimizeFundInput, value: any) => {
    const updated = [...optimizeFunds]
    updated[index] = { ...updated[index], [field]: value }
    setOptimizeFunds(updated)
  }

  const addPortfolioHolding = () => {
    setPortfolioHoldings([
      ...portfolioHoldings,
      { scheme_code: 0, scheme_name: '', amount: 0, purchase_date: '', purchase_amount: 0 },
    ])
  }

  const removePortfolioHolding = (index: number) => {
    setPortfolioHoldings(portfolioHoldings.filter((_, i) => i !== index))
  }

  const updatePortfolioHolding = (index: number, field: keyof PortfolioHolding, value: any) => {
    const updated = [...portfolioHoldings]
    updated[index] = { ...updated[index], [field]: value }
    setPortfolioHoldings(updated)
  }

  // ============= Model Functions =============

  const toggleModelExpanded = (modelId: string) => {
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

  const handleCreateModel = () => {
    setIsCreateMode(true)
    setModelFormData({ name: '', slug: '', modelType: 'classification', description: '', framework: '' })
    setIsModelModalOpen(true)
  }

  const handleEditModel = (model: MlModel) => {
    setIsCreateMode(false)
    setSelectedModel(model)
    setModelFormData({
      name: model.name,
      slug: model.slug,
      modelType: model.modelType,
      description: model.description || '',
      framework: model.framework || '',
    })
    setIsModelModalOpen(true)
  }

  const handleSaveModel = async () => {
    try {
      if (isCreateMode) {
        await modelsApi.create(modelFormData)
      } else if (selectedModel) {
        await modelsApi.update(selectedModel.id, modelFormData)
      }
      await loadInitialData()
      setIsModelModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteModel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return
    try {
      await modelsApi.delete(id)
      await loadInitialData()
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
      await modelsApi.createVersion(selectedModel.id, versionForm)
      await loadInitialData()
      setIsVersionModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handlePromoteVersion = async (modelId: string, versionId: string) => {
    try {
      await modelsApi.promoteVersion(modelId, versionId)
      await loadInitialData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ============= Helper Functions =============

  const getRiskBandColor = (riskBand: string) => {
    switch (riskBand) {
      case 'Capital Protection': return colors.success
      case 'Balanced Growth': return colors.primary
      case 'Accelerated Growth': return '#7C3AED'
      default: return colors.textSecondary
    }
  }

  const getStageStatus = (stage: PipelineStage, targetStage: PipelineStage) => {
    const stageOrder: PipelineStage[] = ['idle', 'classifying', 'allocating', 'recommending', 'complete']
    const currentIndex = stageOrder.indexOf(stage)
    const targetIndex = stageOrder.indexOf(targetStage)
    if (currentIndex > targetIndex) return 'complete'
    if (currentIndex === targetIndex) return 'active'
    return 'pending'
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'production': return { background: `${colors.success}15`, color: colors.success }
      case 'staging': return { background: `${colors.warning}15`, color: colors.warning }
      case 'archived': return { background: colors.chipBg, color: colors.textTertiary }
      default: return { background: `${colors.primary}15`, color: colors.primary }
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ============= Render =============

  return (
    <AdminLayout title="ML Studio">
      <div style={{ background: colors.background, minHeight: '100%', margin: '-2rem', padding: '2rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            End-to-end ML recommendation pipeline
          </p>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
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
          </div>
        </div>

        {/* Pipeline Visualization (Always Visible) */}
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
            {[
              { num: 1, title: 'Classify', desc: 'Profile to Persona', icon: ICONS.users, tab: 'classify' as TestLabTab },
              { num: 2, title: 'Allocate', desc: 'Blended allocation', icon: ICONS.chart, tab: 'blended' as TestLabTab },
              { num: 3, title: 'Recommend', desc: 'Fund recommendations', icon: ICONS.sparkles, tab: 'recommend' as TestLabTab },
            ].map((stage, idx) => {
              const status = getStageStatus(pipelineStage, ['classifying', 'allocating', 'recommending'][idx] as PipelineStage)
              const isActive = status === 'active'
              const isComplete = status === 'complete'

              return (
                <div key={stage.num} className="relative">
                  <button
                    onClick={() => updateTab('testlab', stage.tab)}
                    className="w-full p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-1 text-left"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                        : isComplete
                        ? `linear-gradient(135deg, ${colors.success}20, ${colors.success}10)`
                        : colors.cardBackground,
                      border: `1px solid ${isActive ? 'transparent' : isComplete ? colors.success : colors.cardBorder}`,
                      boxShadow: isActive ? `0 8px 32px ${colors.glassShadow}` : `0 4px 24px ${colors.glassShadow}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isActive ? 'animate-pulse' : ''
                        }`}
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.2)' : isComplete ? colors.success : colors.chipBg,
                          color: isActive ? '#fff' : isComplete ? '#fff' : colors.primary,
                        }}
                      >
                        {isComplete ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.check} />
                          </svg>
                        ) : (
                          stage.num
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold" style={{ color: isActive ? '#fff' : colors.textPrimary }}>
                          {stage.title}
                        </h3>
                        <p className="text-xs" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : colors.textTertiary }}>
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Arrow connector */}
                  {idx < 2 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={isComplete ? colors.success : colors.primary} strokeWidth="2">
                        <path d={ICONS.arrow} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl" style={{ background: colors.chipBg }}>
          {[
            { id: 'overview' as MainTab, label: 'Overview' },
            { id: 'testlab' as MainTab, label: 'Test Lab' },
            { id: 'models' as MainTab, label: 'Models' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => updateTab(tab.id)}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: mainTab === tab.id
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                  : 'transparent',
                color: mainTab === tab.id ? '#fff' : colors.textSecondary,
              }}
            >
              {tab.label}
            </button>
          ))}
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

        {/* ============= OVERVIEW TAB ============= */}
        {mainTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="p-5 rounded-xl"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: `0 4px 24px ${colors.glassShadow}`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                    <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.users} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Classifications</p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{recentClassifications}</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Last 24 hours</p>
              </div>

              <div
                className="p-5 rounded-xl"
                style={{
                  background: colors.cardBackground,
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: `0 4px 24px ${colors.glassShadow}`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.success}15` }}>
                    <svg className="w-5 h-5" style={{ color: colors.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.sparkles} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.success }}>Recommendations</p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{recentRecommendations}</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Last 24 hours</p>
              </div>
            </div>

            {/* Active Models Status */}
            <div
              className="p-5 rounded-xl"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`,
              }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
                Active Models Status
              </h3>
              <div className="space-y-3">
                {models.length === 0 ? (
                  <p className="text-sm" style={{ color: colors.textTertiary }}>No models registered yet.</p>
                ) : (
                  models.slice(0, 4).map((model) => {
                    const prodVersion = model.versions?.find(v => v.isProduction)
                    return (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: colors.primary, color: '#fff' }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={modelTypeIcons[model.modelType] || modelTypeIcons.default} />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{model.name}</p>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>{model.modelType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                            {prodVersion ? `v${prodVersion.version}` : 'No version'}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ background: `${colors.success}15`, color: colors.success }}
                          >
                            Production
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============= TEST LAB TAB ============= */}
        {mainTab === 'testlab' && (
          <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex items-center gap-2">
              {[
                { id: 'classify' as TestLabTab, label: 'Classify' },
                { id: 'blended' as TestLabTab, label: 'Blended' },
                { id: 'risk' as TestLabTab, label: 'Risk' },
                { id: 'portfolio' as TestLabTab, label: 'Portfolio' },
                { id: 'optimize' as TestLabTab, label: 'Optimize' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTestLabTab(tab.id)
                    router.push(`/admin/ml?tab=testlab&op=${tab.id}`, undefined, { shallow: true })
                  }}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: testLabTab === tab.id
                      ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                      : colors.chipBg,
                    color: testLabTab === tab.id ? '#fff' : colors.textSecondary,
                    border: `1px solid ${colors.chipBorder}`,
                  }}
                >
                  {tab.label}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={runFullPipeline}
                disabled={pipelineStage !== 'idle' && pipelineStage !== 'complete'}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${colors.success}, #059669)`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`,
                }}
              >
                Run Full Pipeline
              </button>
            </div>

            {/* Workbench */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: colors.cardBackground,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: `0 4px 24px ${colors.glassShadow}`,
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Input Panel */}
                <div className="p-5" style={{ borderRight: `1px solid ${colors.cardBorder}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Input</span>
                    {testLabTab === 'classify' && (
                      <div className="flex gap-2">
                        {Object.keys(DEMO_PRESETS).map((preset) => (
                          <button
                            key={preset}
                            onClick={() => applyPreset(preset as keyof typeof DEMO_PRESETS)}
                            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                            style={{
                              background: demoForm === DEMO_PRESETS[preset as keyof typeof DEMO_PRESETS]
                                ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                                : colors.chipBg,
                              color: demoForm === DEMO_PRESETS[preset as keyof typeof DEMO_PRESETS] ? '#fff' : colors.textSecondary,
                              border: `1px solid ${colors.chipBorder}`,
                            }}
                          >
                            {preset.charAt(0).toUpperCase() + preset.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {testLabTab === 'classify' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Age</label>
                          <input
                            type="number"
                            value={demoForm.age}
                            onChange={(e) => setDemoForm({ ...demoForm, age: Number(e.target.value) })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Horizon (Years)</label>
                          <input
                            type="number"
                            value={demoForm.horizon_years}
                            onChange={(e) => setDemoForm({ ...demoForm, horizon_years: Number(e.target.value) })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Risk Tolerance</label>
                          <select
                            value={demoForm.risk_tolerance}
                            onChange={(e) => setDemoForm({ ...demoForm, risk_tolerance: e.target.value as DemoFormData['risk_tolerance'] })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          >
                            <option value="Conservative">Conservative</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Aggressive">Aggressive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Liquidity Need</label>
                          <select
                            value={demoForm.liquidity}
                            onChange={(e) => setDemoForm({ ...demoForm, liquidity: e.target.value as DemoFormData['liquidity'] })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Monthly SIP</label>
                          <input
                            type="number"
                            value={demoForm.monthly_sip}
                            onChange={(e) => setDemoForm({ ...demoForm, monthly_sip: Number(e.target.value) })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Knowledge</label>
                          <select
                            value={demoForm.knowledge}
                            onChange={(e) => setDemoForm({ ...demoForm, knowledge: e.target.value as DemoFormData['knowledge'] })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={handleClassify}
                        disabled={loading}
                        className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                          boxShadow: `0 4px 14px ${colors.glassShadow}`,
                        }}
                      >
                        {loading ? 'Classifying...' : 'Classify Profile'}
                      </button>
                    </div>
                  )}

                  {testLabTab === 'blended' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Target Allocation (%)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(['equity', 'debt', 'hybrid', 'gold', 'international', 'liquid'] as const).map((key) => (
                            <div key={key}>
                              <label className="block text-xs mb-1 capitalize" style={{ color: colors.textSecondary }}>{key}</label>
                              <input
                                type="number"
                                value={blendedRecommendForm.blended_allocation[key]}
                                onChange={(e) => setBlendedRecommendForm({
                                  ...blendedRecommendForm,
                                  blended_allocation: { ...blendedRecommendForm.blended_allocation, [key]: Number(e.target.value) },
                                })}
                                className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none"
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                min={0}
                                max={100}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                          Total: {Object.values(blendedRecommendForm.blended_allocation).reduce((a, b) => a + b, 0)}%
                          {classifyResult && <span className="ml-2" style={{ color: colors.success }}>(Auto-filled from classification)</span>}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Investment Amount</label>
                          <input
                            type="number"
                            value={blendedRecommendForm.investment_amount}
                            onChange={(e) => setBlendedRecommendForm({ ...blendedRecommendForm, investment_amount: Number(e.target.value) })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Top N Funds</label>
                          <input
                            type="number"
                            value={blendedRecommendForm.top_n}
                            onChange={(e) => setBlendedRecommendForm({ ...blendedRecommendForm, top_n: Number(e.target.value) })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                            min={1}
                            max={15}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleBlendedRecommend}
                        disabled={loading}
                        className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                          boxShadow: `0 4px 14px ${colors.glassShadow}`,
                        }}
                      >
                        {loading ? 'Getting Recommendations...' : 'Get Blended Recommendations'}
                      </button>
                    </div>
                  )}

                  {testLabTab === 'risk' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Risk Tolerance</label>
                          <select
                            value={riskForm.risk_tolerance}
                            onChange={(e) => setRiskForm({ ...riskForm, risk_tolerance: e.target.value })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          >
                            <option value="Conservative">Conservative</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Aggressive">Aggressive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Horizon (Years)</label>
                          <input
                            type="number"
                            value={riskForm.horizon_years}
                            onChange={(e) => setRiskForm({ ...riskForm, horizon_years: Number(e.target.value) })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Portfolio Holdings</label>
                        <div className="space-y-2">
                          {riskForm.portfolio.map((fund, idx) => (
                            <div key={idx} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{fund.scheme_name}</span>
                                <span className="text-sm font-bold" style={{ color: colors.primary }}>{(fund.weight * 100).toFixed(0)}%</span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{fund.category}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={handleRiskAssess}
                        disabled={loading}
                        className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                          boxShadow: `0 4px 14px ${colors.glassShadow}`,
                        }}
                      >
                        {loading ? 'Assessing Risk...' : 'Assess Risk'}
                      </button>
                    </div>
                  )}

                  {testLabTab === 'portfolio' && (
                    <div className="space-y-3">
                      {/* Holdings */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Portfolio Holdings</label>
                          <button
                            onClick={addPortfolioHolding}
                            className="text-xs font-medium flex items-center gap-1"
                            style={{ color: colors.primary }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {portfolioHoldings.map((holding, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                              <div className="flex items-start gap-2">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <input
                                    type="number"
                                    placeholder="Scheme Code"
                                    value={holding.scheme_code || ''}
                                    onChange={(e) => updatePortfolioHolding(idx, 'scheme_code', Number(e.target.value))}
                                    className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Amount (₹)"
                                    value={holding.amount || ''}
                                    onChange={(e) => updatePortfolioHolding(idx, 'amount', Number(e.target.value))}
                                    className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                  />
                                  <input
                                    type="date"
                                    placeholder="Purchase Date"
                                    value={holding.purchase_date || ''}
                                    onChange={(e) => updatePortfolioHolding(idx, 'purchase_date', e.target.value)}
                                    className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Purchase Amount (₹)"
                                    value={holding.purchase_amount || ''}
                                    onChange={(e) => updatePortfolioHolding(idx, 'purchase_amount', Number(e.target.value))}
                                    className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                  />
                                </div>
                                <button
                                  onClick={() => removePortfolioHolding(idx)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                                  style={{ background: `${colors.error}15` }}
                                >
                                  <svg className="w-3 h-3" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              {holding.scheme_name && (
                                <p className="text-xs mt-1.5 truncate" style={{ color: colors.textSecondary }}>{holding.scheme_name}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Target Allocation */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Target Allocation (0-1)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(['equity', 'debt', 'hybrid', 'gold', 'international', 'liquid'] as const).map((key) => (
                            <div key={key}>
                              <label className="block text-xs mb-1 capitalize" style={{ color: colors.textSecondary }}>{key}</label>
                              <input
                                type="number"
                                step="0.01"
                                value={portfolioTargetAllocation[key]}
                                onChange={(e) => setPortfolioTargetAllocation({
                                  ...portfolioTargetAllocation,
                                  [key]: parseFloat(e.target.value) || 0,
                                })}
                                className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                min={0}
                                max={1}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                          Total: {(Object.values(portfolioTargetAllocation).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
                        </p>
                      </div>

                      {/* Profile */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Risk Tolerance</label>
                          <select
                            value={portfolioProfile.risk_tolerance}
                            onChange={(e) => setPortfolioProfile({ ...portfolioProfile, risk_tolerance: e.target.value })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          >
                            <option value="Conservative">Conservative</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Aggressive">Aggressive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Horizon (Years)</label>
                          <input
                            type="number"
                            value={portfolioProfile.horizon_years}
                            onChange={(e) => setPortfolioProfile({ ...portfolioProfile, horizon_years: Number(e.target.value) })}
                            className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                            style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handlePortfolioAnalysis}
                        disabled={loading || portfolioHoldings.length === 0}
                        className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                          boxShadow: `0 4px 14px ${colors.glassShadow}`,
                        }}
                      >
                        {loading ? 'Analyzing...' : 'Analyze Portfolio'}
                      </button>
                    </div>
                  )}

                  {testLabTab === 'optimize' && (
                    <div className="space-y-3">
                      {/* Persona Selection */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Persona ID</label>
                        <select
                          value={optimizePersona}
                          onChange={(e) => setOptimizePersona(e.target.value)}
                          className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        >
                          <option value="capital-preserver">Capital Preserver</option>
                          <option value="balanced-navigator">Balanced Navigator</option>
                          <option value="accelerated-builder">Accelerated Builder</option>
                        </select>
                      </div>

                      {/* Available Funds */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Available Funds</label>
                          <button
                            onClick={addOptimizeFund}
                            className="text-xs font-medium flex items-center gap-1"
                            style={{ color: colors.primary }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                          </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {optimizeFunds.map((fund, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                              <div className="flex items-start gap-2">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="number"
                                    placeholder="Code"
                                    value={fund.scheme_code || ''}
                                    onChange={(e) => updateOptimizeFund(idx, 'scheme_code', Number(e.target.value))}
                                    className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Return 1Y %"
                                    value={fund.return_1y || ''}
                                    onChange={(e) => updateOptimizeFund(idx, 'return_1y', Number(e.target.value))}
                                    className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Volatility %"
                                    value={fund.volatility || ''}
                                    onChange={(e) => updateOptimizeFund(idx, 'volatility', Number(e.target.value))}
                                    className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                                  />
                                </div>
                                <button
                                  onClick={() => removeOptimizeFund(idx)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                                  style={{ background: `${colors.error}15` }}
                                >
                                  <svg className="w-3 h-3" style={{ color: colors.error }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              {fund.scheme_name && (
                                <p className="text-xs mt-1.5 truncate" style={{ color: colors.textSecondary }}>{fund.scheme_name}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Constraints */}
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Constraints</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Min Funds</label>
                            <input
                              type="number"
                              value={optimizeConstraints.min_funds || ''}
                              onChange={(e) => setOptimizeConstraints({ ...optimizeConstraints, min_funds: Number(e.target.value) })}
                              className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Max Funds</label>
                            <input
                              type="number"
                              value={optimizeConstraints.max_funds || ''}
                              onChange={(e) => setOptimizeConstraints({ ...optimizeConstraints, max_funds: Number(e.target.value) })}
                              className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Min Weight</label>
                            <input
                              type="number"
                              step="0.01"
                              value={optimizeConstraints.min_weight_per_fund || ''}
                              onChange={(e) => setOptimizeConstraints({ ...optimizeConstraints, min_weight_per_fund: Number(e.target.value) })}
                              className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: colors.textSecondary }}>Max Weight</label>
                            <input
                              type="number"
                              step="0.01"
                              value={optimizeConstraints.max_weight_per_fund || ''}
                              onChange={(e) => setOptimizeConstraints({ ...optimizeConstraints, max_weight_per_fund: Number(e.target.value) })}
                              className="w-full h-8 px-2 rounded-lg text-xs focus:outline-none"
                              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleOptimizePortfolio}
                        disabled={loading || optimizeFunds.length === 0}
                        className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                          boxShadow: `0 4px 14px ${colors.glassShadow}`,
                        }}
                      >
                        {loading ? 'Optimizing...' : 'Optimize Portfolio'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Output Panel */}
                <div className="p-5" style={{ background: isDark ? 'rgba(96, 165, 250, 0.03)' : 'rgba(37, 99, 235, 0.02)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>Output</span>
                  </div>

                  {/* Classification Result */}
                  {(testLabTab === 'classify' || pipelineStage !== 'idle') && classifyResult && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                            style={{ background: `linear-gradient(135deg, ${getRiskBandColor(classifyResult.primary_persona.risk_band)}, ${getRiskBandColor(classifyResult.primary_persona.risk_band)}CC)` }}
                          >
                            {classifyResult.primary_persona.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{classifyResult.primary_persona.name}</h4>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary }}>
                              {classifyResult.primary_persona.risk_band}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>{classifyResult.primary_persona.description}</p>
                      </div>

                      {/* Allocation Chart */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Blended Allocation</p>
                        <AllocationPieChart
                          allocation={(() => {
                            // Normalize allocation values (handle both 0-1 and 0-100 formats)
                            const alloc = classifyResult.blended_allocation;
                            const needsNormalize = Object.values(alloc).every(v => v <= 1);
                            if (needsNormalize) {
                              return {
                                equity: alloc.equity * 100,
                                debt: alloc.debt * 100,
                                hybrid: alloc.hybrid * 100,
                                gold: alloc.gold * 100,
                                international: alloc.international * 100,
                                liquid: alloc.liquid * 100,
                              };
                            }
                            return alloc;
                          })()}
                          height={200}
                          showLegend={true}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-2" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                        <span>Model: {classifyResult.model_version}</span>
                        {demoTiming.classify && <span>Latency: {demoTiming.classify}ms</span>}
                      </div>
                    </div>
                  )}

                  {/* Blended Recommendations Result */}
                  {(testLabTab === 'blended' || pipelineStage === 'complete') && recommendResult && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Alignment Score</span>
                          <span
                            className="text-lg font-bold"
                            style={{ color: recommendResult.alignment_score >= 0.9 ? colors.success : recommendResult.alignment_score >= 0.7 ? colors.warning : colors.error }}
                          >
                            {(recommendResult.alignment_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${recommendResult.alignment_score * 100}%`,
                              background: recommendResult.alignment_score >= 0.9 ? colors.success : recommendResult.alignment_score >= 0.7 ? colors.warning : colors.error
                            }}
                          />
                        </div>
                        <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>{recommendResult.alignment_message}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Recommended Funds ({recommendResult.recommendations.length})</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {recommendResult.recommendations.map((rec, idx) => (
                            <div key={rec.scheme_code} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                                  {rec.scheme_name.length > 35 ? rec.scheme_name.slice(0, 35) + '...' : rec.scheme_name}
                                </span>
                                <div className="text-right ml-2">
                                  <span className="text-sm font-bold" style={{ color: colors.primary }}>
                                    {Math.round(rec.suggested_allocation <= 1 ? rec.suggested_allocation * 100 : rec.suggested_allocation)}%
                                  </span>
                                  {rec.suggested_amount && (
                                    <span className="text-xs block" style={{ color: colors.textSecondary }}>₹{rec.suggested_amount.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.primary}15`, color: colors.primary }}>{rec.category}</span>
                                {rec.asset_class && (
                                  <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: `${colors.success}15`, color: colors.success }}>{rec.asset_class}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-2" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                        <span>Model: {recommendResult.model_version}</span>
                        {demoTiming.recommend && <span>Latency: {demoTiming.recommend}ms</span>}
                      </div>
                    </div>
                  )}

                  {/* Risk Result */}
                  {testLabTab === 'risk' && riskResult && (
                    <div className="space-y-3">
                      {/* Risk Gauge Chart */}
                      <div className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                        <RiskGaugeChart
                          score={riskResult.risk_score}
                          riskLevel={riskResult.risk_level}
                          height={180}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Risk Factors</p>
                        <div className="space-y-2">
                          {riskResult.risk_factors.map((factor, idx) => (
                            <div key={idx} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{factor.name}</span>
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded"
                                  style={{
                                    background: factor.severity === 'High' ? `${colors.error}15` : factor.severity === 'Moderate' ? `${colors.warning}15` : `${colors.success}15`,
                                    color: factor.severity === 'High' ? colors.error : factor.severity === 'Moderate' ? colors.warning : colors.success
                                  }}
                                >
                                  {factor.severity}
                                </span>
                              </div>
                              <p className="text-sm" style={{ color: colors.textSecondary }}>{factor.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-2" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                        <span>Model: {riskResult.model_version}</span>
                        <span>Latency: {riskResult.latency_ms}ms</span>
                      </div>
                    </div>
                  )}

                  {/* Portfolio Analysis Result */}
                  {testLabTab === 'portfolio' && portfolioResult && (
                    <div className="space-y-3">
                      {/* Alignment Score */}
                      <div className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Alignment Score</span>
                          <span
                            className="text-lg font-bold"
                            style={{ color: portfolioResult.summary.alignment_score >= 0.9 ? colors.success : portfolioResult.summary.alignment_score >= 0.7 ? colors.warning : colors.error }}
                          >
                            {(portfolioResult.summary.alignment_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${portfolioResult.summary.alignment_score * 100}%`,
                              background: portfolioResult.summary.alignment_score >= 0.9 ? colors.success : portfolioResult.summary.alignment_score >= 0.7 ? colors.warning : colors.error
                            }}
                          />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ background: portfolioResult.summary.is_aligned ? `${colors.success}15` : `${colors.warning}15`, color: portfolioResult.summary.is_aligned ? colors.success : colors.warning }}
                          >
                            {portfolioResult.summary.is_aligned ? 'Aligned' : 'Needs Rebalancing'}
                          </span>
                        </div>
                      </div>

                      {/* Allocation Comparison */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Current vs Target Allocation</p>
                        <div className="space-y-1.5">
                          {Object.entries(portfolioResult.allocation_gaps).map(([key, gap]) => {
                            const current = (portfolioResult.current_allocation as any)[key] || 0
                            const target = (portfolioResult.target_allocation as any)[key] || 0
                            return (
                              <div key={key} className="flex items-center gap-2 text-xs">
                                <span className="w-20 capitalize" style={{ color: colors.textSecondary }}>{key}</span>
                                <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: colors.progressBg }}>
                                  <div
                                    className="h-full"
                                    style={{ width: `${current * 100}%`, background: ALLOCATION_COLORS.find(c => c.label.toLowerCase() === key)?.color || colors.primary }}
                                  />
                                </div>
                                <span className="w-16 text-right" style={{ color: colors.textPrimary }}>
                                  {(current * 100).toFixed(0)}% / {(target * 100).toFixed(0)}%
                                </span>
                                <span
                                  className="w-12 text-right font-medium"
                                  style={{ color: gap > 0 ? colors.error : gap < 0 ? colors.success : colors.textTertiary }}
                                >
                                  {gap > 0 ? '+' : ''}{(gap * 100).toFixed(0)}%
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Portfolio Metrics */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>Total Value</p>
                          <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>₹{portfolioResult.current_metrics.total_value.toLocaleString()}</p>
                        </div>
                        <div className="p-2.5 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                          <p className="text-xs" style={{ color: colors.textTertiary }}>Holdings</p>
                          <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{portfolioResult.current_metrics.total_holdings}</p>
                        </div>
                      </div>

                      {/* Rebalancing Actions */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Rebalancing Actions ({portfolioResult.rebalancing_actions.length})</p>
                        <div className="space-y-2 max-h-52 overflow-y-auto">
                          {portfolioResult.rebalancing_actions.map((action, idx) => (
                            <div key={idx} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                    style={{
                                      background: action.action === 'SELL' ? `${colors.error}15` : action.action === 'BUY' || action.action === 'ADD_NEW' ? `${colors.success}15` : `${colors.warning}15`,
                                      color: action.action === 'SELL' ? colors.error : action.action === 'BUY' || action.action === 'ADD_NEW' ? colors.success : colors.warning
                                    }}
                                  >
                                    {action.action}
                                  </span>
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{
                                      background: action.priority === 'HIGH' ? `${colors.error}10` : action.priority === 'MEDIUM' ? `${colors.warning}10` : `${colors.textTertiary}10`,
                                      color: action.priority === 'HIGH' ? colors.error : action.priority === 'MEDIUM' ? colors.warning : colors.textTertiary
                                    }}
                                  >
                                    {action.priority}
                                  </span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: action.transaction_amount < 0 ? colors.error : colors.success }}>
                                  {action.transaction_amount < 0 ? '-' : '+'}₹{Math.abs(action.transaction_amount).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                                {action.scheme_name.length > 40 ? action.scheme_name.slice(0, 40) + '...' : action.scheme_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs" style={{ color: colors.textSecondary }}>{action.asset_class}</span>
                                {action.tax_status && (
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ background: action.tax_status === 'LTCG' ? `${colors.success}10` : `${colors.warning}10`, color: action.tax_status === 'LTCG' ? colors.success : colors.warning }}
                                  >
                                    {action.tax_status}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>{action.reason}</p>
                              {action.tax_note && (
                                <p className="text-xs mt-1 italic" style={{ color: colors.warning }}>{action.tax_note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="p-3 rounded-xl" style={{ background: isDark ? `${colors.warning}10` : `${colors.warning}08`, border: `1px solid ${colors.chipBorder}` }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.warning }}>Summary</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Sell</p>
                            <p className="text-sm font-bold" style={{ color: colors.error }}>₹{portfolioResult.summary.total_sell_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Buy</p>
                            <p className="text-sm font-bold" style={{ color: colors.success }}>₹{portfolioResult.summary.total_buy_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Net</p>
                            <p className="text-sm font-bold" style={{ color: portfolioResult.summary.net_transaction >= 0 ? colors.success : colors.error }}>
                              {portfolioResult.summary.net_transaction >= 0 ? '+' : ''}₹{portfolioResult.summary.net_transaction.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {portfolioResult.summary.primary_issues.length > 0 && (
                          <div className="pt-2" style={{ borderTop: `1px solid ${colors.chipBorder}` }}>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Issues:</p>
                            <ul className="text-xs mt-1 space-y-0.5" style={{ color: colors.textSecondary }}>
                              {portfolioResult.summary.primary_issues.slice(0, 3).map((issue, i) => (
                                <li key={i}>- {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs mt-2 italic" style={{ color: colors.textSecondary }}>{portfolioResult.summary.tax_impact_summary}</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-2" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                        <span>Model: {portfolioResult.model_version}</span>
                        <span>Latency: {portfolioResult.latency_ms.toFixed(0)}ms</span>
                      </div>
                    </div>
                  )}

                  {/* Optimize Result */}
                  {testLabTab === 'optimize' && optimizeResult && (
                    <div className="space-y-3">
                      {/* Expected Metrics */}
                      <div className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Expected Metrics</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Return</p>
                            <p className="text-lg font-bold" style={{ color: colors.success }}>{(optimizeResult.expected_metrics.expected_return * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Volatility</p>
                            <p className="text-lg font-bold" style={{ color: colors.warning }}>{(optimizeResult.expected_metrics.expected_volatility * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: colors.textTertiary }}>Sharpe</p>
                            <p className="text-lg font-bold" style={{ color: colors.primary }}>{optimizeResult.expected_metrics.sharpe_ratio.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Optimized Allocations */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Optimized Allocations ({optimizeResult.allocations.length})</p>
                        <div className="space-y-2 max-h-52 overflow-y-auto">
                          {optimizeResult.allocations.map((alloc, idx) => (
                            <div key={idx} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                                  {alloc.scheme_name.length > 35 ? alloc.scheme_name.slice(0, 35) + '...' : alloc.scheme_name}
                                </span>
                                <span className="text-sm font-bold" style={{ color: colors.primary }}>
                                  {(alloc.weight * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${colors.primary}15`, color: colors.primary }}>{alloc.category}</span>
                                {alloc.monthly_sip && (
                                  <span className="text-xs" style={{ color: colors.textSecondary }}>SIP: ₹{alloc.monthly_sip.toLocaleString()}</span>
                                )}
                              </div>
                              {/* Weight bar */}
                              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                                <div className="h-full rounded-full" style={{ width: `${alloc.weight * 100}%`, background: colors.primary }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-2" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                        <span>Model: {optimizeResult.model_version}</span>
                        <span>Latency: {optimizeResult.latency_ms.toFixed(0)}ms</span>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!classifyResult && !recommendResult && !riskResult && !portfolioResult && !optimizeResult && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: colors.chipBg }}>
                        <svg className="w-6 h-6" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-sm" style={{ color: colors.textTertiary }}>Run a test to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============= MODELS TAB ============= */}
        {mainTab === 'models' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Manage classification, recommendation, and allocation models.
              </p>
              <button
                onClick={handleCreateModel}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Register Model
              </button>
            </div>

            {models.length === 0 ? (
              <div
                className="p-8 rounded-xl text-center"
                style={{ background: colors.cardBackground, border: `1px dashed ${colors.cardBorder}` }}
              >
                <p className="text-sm" style={{ color: colors.textTertiary }}>No models registered yet. Click "Register Model" to get started.</p>
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
                      <div className="p-5 cursor-pointer" onClick={() => toggleModelExpanded(model.id)}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` }}
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
                              onClick={(e) => { e.stopPropagation(); handleEditModel(model) }}
                              className="px-3 py-1.5 rounded-full text-xs font-medium"
                              style={{ background: colors.chipBg, color: colors.textSecondary }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id) }}
                              className="px-3 py-1.5 rounded-full text-xs font-medium"
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
                                className="text-xs font-medium flex items-center gap-1"
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
                                          className="px-3 py-1 rounded-full text-xs font-medium"
                                          style={{ background: `${colors.success}15`, color: colors.success }}
                                        >
                                          Promote
                                        </button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div>
                                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Created</span>
                                        <div className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>{version.createdAt ? formatDate(version.createdAt) : 'N/A'}</div>
                                      </div>
                                      {version.metrics && Object.keys(version.metrics).length > 0 && (
                                        Object.entries(version.metrics).slice(0, 2).map(([key, value]) => (
                                          <div key={key}>
                                            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>{key.replace(/_/g, ' ')}</span>
                                            <div className="text-sm font-medium mt-0.5" style={{ color: colors.textPrimary }}>
                                              {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                            </div>
                                          </div>
                                        ))
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
          </div>
        )}

        {/* ============= MODALS ============= */}

        {/* Create/Edit Model Modal */}
        <AdminModal
          isOpen={isModelModalOpen}
          onClose={() => setIsModelModalOpen(false)}
          title={isCreateMode ? 'Register Model' : 'Edit Model'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Name</label>
              <input
                type="text"
                value={modelFormData.name}
                onChange={(e) => setModelFormData({
                  ...modelFormData,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                })}
                className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                placeholder="e.g., Persona Classifier"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Model Type</label>
                <select
                  value={modelFormData.modelType}
                  onChange={(e) => setModelFormData({ ...modelFormData, modelType: e.target.value })}
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                >
                  <option value="classification">Classification</option>
                  <option value="recommendation">Recommendation</option>
                  <option value="optimization">Optimization</option>
                  <option value="assessment">Assessment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Framework</label>
                <input
                  type="text"
                  value={modelFormData.framework}
                  onChange={(e) => setModelFormData({ ...modelFormData, framework: e.target.value })}
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  placeholder="e.g., Rules Engine"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Description</label>
              <textarea
                value={modelFormData.description}
                onChange={(e) => setModelFormData({ ...modelFormData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                rows={3}
                placeholder="Describe what this model does..."
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="flex-1 h-10 rounded-full font-semibold text-sm"
                style={{ background: colors.chipBg, color: colors.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModel}
                className="flex-1 h-10 rounded-full font-semibold text-sm text-white hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`
                }}
              >
                {isCreateMode ? 'Register' : 'Save Changes'}
              </button>
            </div>
          </div>
        </AdminModal>

        {/* Add Version Modal */}
        <AdminModal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
          title="Add Model Version"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Version</label>
              <input
                type="text"
                value={versionForm.version}
                onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
                className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
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
                className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                placeholder="/models/model-name/v1.0.0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Status</label>
              <select
                value={versionForm.status}
                onChange={(e) => setVersionForm({ ...versionForm, status: e.target.value })}
                className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
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
                className="flex-1 h-10 rounded-full font-semibold text-sm"
                style={{ background: colors.chipBg, color: colors.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                className="flex-1 h-10 rounded-full font-semibold text-sm text-white hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`
                }}
              >
                Add Version
              </button>
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  )
}

export default MLStudioPage
