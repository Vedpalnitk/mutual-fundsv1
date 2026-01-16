import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageHeader from '@/components/layout/PageHeader';
import { mlApi, ClassifyResponse, RecommendResponse, RiskResponse, BlendedClassifyResponse, BlendedRecommendResponse, AllocationBreakdown } from '@/services/api';

type TabType = 'classify' | 'recommend' | 'recommend-blended' | 'risk';

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
  inputFocusShadow: 'rgba(37, 99, 235, 0.12)',
  cardBg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  chipBg: 'rgba(37, 99, 235, 0.06)',
  chipBorder: 'rgba(37, 99, 235, 0.12)',
  progressBg: 'rgba(37, 99, 235, 0.1)',
  cardBackground: '#FFFFFF',
};

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
  inputFocusShadow: 'rgba(96, 165, 250, 0.15)',
  cardBg: 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  chipBg: 'rgba(96, 165, 250, 0.08)',
  chipBorder: 'rgba(96, 165, 250, 0.15)',
  progressBg: 'rgba(96, 165, 250, 0.15)',
  cardBackground: '#111827',
};

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkClass = document.documentElement.classList.contains('dark');
      const isDarkMedia = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isLightClass = document.documentElement.classList.contains('light');
      setIsDark(isDarkClass || (isDarkMedia && !isLightClass));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  return isDark;
};

// Get colors based on dark mode
const useV4Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT;
};

const MLLabPage = () => {
  const colors = useV4Colors();
  const isDark = useDarkMode();
  const [activeTab, setActiveTab] = useState<TabType>('classify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Classify state
  const [classifyForm, setClassifyForm] = useState({
    age: 29,
    goal: 'Retirement',
    target_amount: 8500000,
    monthly_sip: 32000,
    lump_sum: 200000,
    liquidity: 'Medium' as const,
    risk_tolerance: 'Aggressive' as const,
    knowledge: 'Intermediate' as const,
    volatility: 'High' as const,
    horizon_years: 12,
  });
  const [classifyResult, setClassifyResult] = useState<ClassifyResponse | null>(null);
  const [blendedClassifyResult, setBlendedClassifyResult] = useState<BlendedClassifyResponse | null>(null);

  // Recommend state
  const [recommendForm, setRecommendForm] = useState({
    persona_id: 'accelerated-builder',
    top_n: 5,
    horizon_years: '12',
    risk_tolerance: 'Aggressive',
  });
  const [recommendResult, setRecommendResult] = useState<RecommendResponse | null>(null);

  // Blended Recommend state
  const [blendedRecommendForm, setBlendedRecommendForm] = useState<{
    blended_allocation: AllocationBreakdown;
    top_n: number;
    investment_amount: number;
    horizon_years: string;
  }>({
    blended_allocation: {
      equity: 60,
      debt: 20,
      hybrid: 10,
      gold: 5,
      international: 5,
      liquid: 0,
    },
    top_n: 6,
    investment_amount: 100000,
    horizon_years: '12',
  });
  const [blendedRecommendResult, setBlendedRecommendResult] = useState<BlendedRecommendResponse | null>(null);

  // Risk state
  const [riskForm, setRiskForm] = useState({
    risk_tolerance: 'Aggressive',
    horizon_years: 12,
    portfolio: [
      { scheme_code: 120503, scheme_name: 'Quant Flexi Cap', category: 'Flexi Cap', weight: 0.4, volatility: 18.5 },
      { scheme_code: 119064, scheme_name: 'Nippon Small Cap', category: 'Small Cap', weight: 0.35, volatility: 26.3 },
      { scheme_code: 120505, scheme_name: 'Quant Mid Cap', category: 'Mid Cap', weight: 0.25, volatility: 22.1 },
    ],
  });
  const [riskResult, setRiskResult] = useState<RiskResponse | null>(null);

  const handleClassify = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call blended classification API
      const result = await mlApi.classifyBlended({
        profile: classifyForm,
      });
      setBlendedClassifyResult(result);
      // Convert to ClassifyResponse format for backwards compatibility
      setClassifyResult({
        request_id: result.request_id,
        persona: result.primary_persona,
        confidence: result.confidence,
        probabilities: result.distribution.reduce((acc, item) => {
          acc[item.persona.slug] = item.weight;
          return acc;
        }, {} as Record<string, number>),
        model_version: result.model_version,
        latency_ms: result.latency_ms,
      });
      // Also update blended recommend form with the blended allocation
      // Convert from decimal (0-1) to percentage (0-100) if needed
      const allocation = result.blended_allocation;
      const needsConversion = Object.values(allocation).every(v => v <= 1);
      setBlendedRecommendForm(prev => ({
        ...prev,
        blended_allocation: needsConversion ? {
          equity: Math.round(allocation.equity * 100 * 10) / 10,
          debt: Math.round(allocation.debt * 100 * 10) / 10,
          hybrid: Math.round(allocation.hybrid * 100 * 10) / 10,
          gold: Math.round(allocation.gold * 100 * 10) / 10,
          international: Math.round(allocation.international * 100 * 10) / 10,
          liquid: Math.round(allocation.liquid * 100 * 10) / 10,
        } : allocation,
      }));
    } catch (err: any) {
      setError(err.message);
      // Mock result for demo
      const mockBlended: BlendedClassifyResponse = {
        request_id: 'demo-001',
        primary_persona: {
          id: 'accelerated-builder',
          name: 'Accelerated Builder',
          slug: 'accelerated-builder',
          risk_band: 'Accelerated Growth',
          description: 'Aggressive investor focused on long-term wealth creation',
        },
        distribution: [
          {
            persona: { id: 'accelerated-builder', name: 'Accelerated Builder', slug: 'accelerated-builder', risk_band: 'Accelerated Growth' },
            weight: 0.718,
            allocation: { equity: 75, debt: 10, hybrid: 5, gold: 5, international: 5, liquid: 0 },
          },
          {
            persona: { id: 'balanced-voyager', name: 'Balanced Voyager', slug: 'balanced-voyager', risk_band: 'Balanced Growth' },
            weight: 0.276,
            allocation: { equity: 50, debt: 25, hybrid: 15, gold: 5, international: 5, liquid: 0 },
          },
          {
            persona: { id: 'capital-guardian', name: 'Capital Guardian', slug: 'capital-guardian', risk_band: 'Capital Preservation' },
            weight: 0.006,
            allocation: { equity: 20, debt: 50, hybrid: 20, gold: 5, international: 0, liquid: 5 },
          },
        ],
        blended_allocation: { equity: 60.8, debt: 14.3, hybrid: 7.8, gold: 5.0, international: 5.0, liquid: 0.1 },
        confidence: 0.718,
        model_version: 'rules-v2-blended',
        latency_ms: 15,
      };
      setBlendedClassifyResult(mockBlended);
      setClassifyResult({
        request_id: mockBlended.request_id,
        persona: mockBlended.primary_persona,
        confidence: mockBlended.confidence,
        probabilities: mockBlended.distribution.reduce((acc, item) => {
          acc[item.persona.slug] = item.weight;
          return acc;
        }, {} as Record<string, number>),
        model_version: mockBlended.model_version,
        latency_ms: mockBlended.latency_ms,
      });
      // Convert from decimal (0-1) to percentage (0-100) if needed
      const mockAllocation = mockBlended.blended_allocation;
      const mockNeedsConversion = Object.values(mockAllocation).every(v => v <= 1);
      setBlendedRecommendForm(prev => ({
        ...prev,
        blended_allocation: mockNeedsConversion ? {
          equity: Math.round(mockAllocation.equity * 100 * 10) / 10,
          debt: Math.round(mockAllocation.debt * 100 * 10) / 10,
          hybrid: Math.round(mockAllocation.hybrid * 100 * 10) / 10,
          gold: Math.round(mockAllocation.gold * 100 * 10) / 10,
          international: Math.round(mockAllocation.international * 100 * 10) / 10,
          liquid: Math.round(mockAllocation.liquid * 100 * 10) / 10,
        } : mockAllocation,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mlApi.recommend({
        persona_id: recommendForm.persona_id,
        profile: {
          horizon_years: recommendForm.horizon_years,
          risk_tolerance: recommendForm.risk_tolerance,
        },
        top_n: recommendForm.top_n,
      });
      setRecommendResult(result);
    } catch (err: any) {
      setError(err.message);
      // Mock result for demo
      setRecommendResult({
        request_id: 'demo-002',
        recommendations: [
          {
            scheme_code: 119064,
            scheme_name: 'Nippon India Small Cap Fund Direct Growth',
            fund_house: 'Nippon India Mutual Fund',
            category: 'Small Cap',
            score: 0.83,
            suggested_allocation: 0.35,
            reasoning: 'Strong 3Y returns of 32.1%, excellent risk-adjusted returns (Sharpe: 1.18)',
            metrics: { return_3y: 32.1, sharpe_ratio: 1.18 },
          },
          {
            scheme_code: 120505,
            scheme_name: 'Quant Mid Cap Fund Direct Growth',
            fund_house: 'Quant Mutual Fund',
            category: 'Mid Cap',
            score: 0.77,
            suggested_allocation: 0.33,
            reasoning: 'Strong 3Y returns of 28.5%, excellent risk-adjusted returns (Sharpe: 1.15)',
            metrics: { return_3y: 28.5, sharpe_ratio: 1.15 },
          },
          {
            scheme_code: 120503,
            scheme_name: 'Quant Flexi Cap Fund Direct Growth',
            fund_house: 'Quant Mutual Fund',
            category: 'Flexi Cap',
            score: 0.72,
            suggested_allocation: 0.32,
            reasoning: 'Strong 3Y returns of 24.3%, good diversification across market caps',
            metrics: { return_3y: 24.3, sharpe_ratio: 1.2 },
          },
        ],
        persona_alignment: 'High growth potential aligned with Accelerated Builder profile',
        model_version: 'recommender-v1',
        latency_ms: 28,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRiskAssess = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mlApi.assessRisk({
        profile: {
          risk_tolerance: riskForm.risk_tolerance,
          horizon_years: String(riskForm.horizon_years),
        },
        current_portfolio: riskForm.portfolio,
      });
      setRiskResult(result);
    } catch (err: any) {
      setError(err.message);
      // Mock result for demo
      setRiskResult({
        request_id: 'demo-003',
        risk_level: 'Moderate-High',
        risk_score: 48,
        risk_factors: [
          { name: 'Equity Concentration', contribution: 0.25, severity: 'Moderate', description: '100% equity exposure exceeds 90% threshold' },
          { name: 'Fund Concentration', contribution: 0.13, severity: 'Moderate', description: 'Quant Flexi Cap has 40% allocation, exceeding 35% limit' },
          { name: 'Sector Concentration', contribution: 0.1, severity: 'Low', description: 'Diversified across sectors' },
        ],
        recommendations: [
          'Maintain SIP discipline during market corrections',
          'Review portfolio allocation annually',
        ],
        persona_alignment: 'Risk level appropriate for Accelerated Builder profile',
        model_version: 'risk-v1',
        latency_ms: 15,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlendedRecommend = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mlApi.recommendBlended({
        blended_allocation: blendedRecommendForm.blended_allocation,
        profile: {
          horizon_years: blendedRecommendForm.horizon_years,
        },
        top_n: blendedRecommendForm.top_n,
        investment_amount: blendedRecommendForm.investment_amount,
      });
      setBlendedRecommendResult(result);
    } catch (err: any) {
      setError(err.message);
      // Mock result for demo
      setBlendedRecommendResult({
        request_id: 'demo-blended-001',
        recommendations: [
          {
            scheme_code: 119064,
            scheme_name: 'Nippon India Small Cap Fund Direct Growth',
            fund_house: 'Nippon India Mutual Fund',
            category: 'Small Cap',
            asset_class: 'equity',
            score: 0.85,
            suggested_allocation: 0.25,
            suggested_amount: 25000,
            reasoning: 'High growth equity fund matching aggressive allocation target',
            metrics: { return_3y: 32.1, sharpe_ratio: 1.18 },
          },
          {
            scheme_code: 120505,
            scheme_name: 'Quant Mid Cap Fund Direct Growth',
            fund_house: 'Quant Mutual Fund',
            category: 'Mid Cap',
            asset_class: 'equity',
            score: 0.82,
            suggested_allocation: 0.20,
            suggested_amount: 20000,
            reasoning: 'Strong mid-cap exposure for equity allocation',
            metrics: { return_3y: 28.5, sharpe_ratio: 1.15 },
          },
          {
            scheme_code: 120503,
            scheme_name: 'Quant Flexi Cap Fund Direct Growth',
            fund_house: 'Quant Mutual Fund',
            category: 'Flexi Cap',
            asset_class: 'equity',
            score: 0.78,
            suggested_allocation: 0.15,
            suggested_amount: 15000,
            reasoning: 'Flexible large-cap exposure',
            metrics: { return_3y: 24.3, sharpe_ratio: 1.2 },
          },
          {
            scheme_code: 118834,
            scheme_name: 'HDFC Corporate Bond Fund Direct Growth',
            fund_house: 'HDFC Mutual Fund',
            category: 'Corporate Bond',
            asset_class: 'debt',
            score: 0.75,
            suggested_allocation: 0.20,
            suggested_amount: 20000,
            reasoning: 'Stable debt allocation with quality corporate bonds',
            metrics: { return_3y: 7.2, sharpe_ratio: 0.85 },
          },
          {
            scheme_code: 145552,
            scheme_name: 'ICICI Prudential Gold Fund Direct Growth',
            fund_house: 'ICICI Prudential',
            category: 'Gold',
            asset_class: 'gold',
            score: 0.70,
            suggested_allocation: 0.05,
            suggested_amount: 5000,
            reasoning: 'Gold allocation for portfolio diversification',
            metrics: { return_3y: 12.5, sharpe_ratio: 0.6 },
          },
        ],
        asset_class_breakdown: [
          { asset_class: 'equity', target_allocation: 60, actual_allocation: 60, fund_count: 3, total_amount: 60000 },
          { asset_class: 'debt', target_allocation: 20, actual_allocation: 20, fund_count: 1, total_amount: 20000 },
          { asset_class: 'hybrid', target_allocation: 10, actual_allocation: 10, fund_count: 1, total_amount: 10000 },
          { asset_class: 'gold', target_allocation: 5, actual_allocation: 5, fund_count: 1, total_amount: 5000 },
          { asset_class: 'international', target_allocation: 5, actual_allocation: 5, fund_count: 1, total_amount: 5000 },
        ],
        target_allocation: blendedRecommendForm.blended_allocation,
        alignment_score: 0.95,
        alignment_message: 'Excellent alignment with target allocation',
        model_version: 'blended-recommender-v1',
        latency_ms: 45,
      });
    } finally {
      setLoading(false);
    }
  };

  // Operation definitions with icons and descriptions
  const operations = [
    {
      id: 'classify' as TabType,
      label: 'Classify',
      description: 'Analyze investor profile to determine persona match',
      iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    {
      id: 'recommend' as TabType,
      label: 'Recommend',
      description: 'Get fund recommendations for single persona',
      iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    },
    {
      id: 'recommend-blended' as TabType,
      label: 'Blended',
      description: 'Recommendations based on blended allocation',
      iconPath: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    },
    {
      id: 'risk' as TabType,
      label: 'Risk',
      description: 'Assess portfolio risk factors and get insights',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
  ];

  // Get current result based on active tab
  const hasResult = (activeTab === 'classify' && classifyResult) ||
                   (activeTab === 'recommend' && recommendResult) ||
                   (activeTab === 'recommend-blended' && blendedRecommendResult) ||
                   (activeTab === 'risk' && riskResult);

  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      <Navbar mode="admin" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary }}>Admin</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>ML Lab</h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Test and validate ML models for persona classification, recommendations, and risk assessment.</p>
        </div>

        {/* Operation Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {operations.map((op) => (
            <button
              key={op.id}
              onClick={() => setActiveTab(op.id)}
              className="group relative p-4 rounded-xl text-left transition-all"
              style={{
                background: activeTab === op.id
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.cardBackground,
                border: `1px solid ${activeTab === op.id ? 'transparent' : colors.cardBorder}`,
                boxShadow: activeTab === op.id ? `0 4px 20px ${colors.glassShadow}` : 'none'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: activeTab === op.id ? 'rgba(255,255,255,0.2)' : colors.chipBg,
                    color: activeTab === op.id ? '#fff' : colors.primary
                  }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={op.iconPath} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: activeTab === op.id ? '#fff' : colors.textPrimary }}
                  >
                    {op.label}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: activeTab === op.id ? 'rgba(255,255,255,0.7)' : colors.textTertiary }}
                  >
                    {op.description}
                  </p>
                </div>
              </div>
              {activeTab === op.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rotate-45" style={{ background: colors.primary }} />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2" style={{
            background: isDark ? `${colors.warning}15` : `${colors.warning}10`,
            border: `1px solid ${isDark ? `${colors.warning}30` : `${colors.warning}20`}`,
            color: colors.warning
          }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            API unavailable - showing demo results
          </div>
        )}

        {/* Workbench Area */}
        <div className="rounded-xl overflow-hidden" style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 4px 24px ${colors.glassShadow}`
        }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: colors.success }} />
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {activeTab === 'classify' ? 'Profile Classification' :
                 activeTab === 'recommend' ? 'Single Persona Recommendations' :
                 activeTab === 'recommend-blended' ? 'Blended Allocation Recommendations' :
                 'Risk Assessment'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: colors.textTertiary }}>
              <span>Model v2.1</span>
              <span>•</span>
              <span>Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Input Section */}
            <div className="p-5" style={{ borderRight: `1px solid ${colors.cardBorder}` }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>Input</span>
              </div>

            {activeTab === 'classify' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Age</label>
                    <input
                      type="number"
                      value={classifyForm.age}
                      onChange={(e) => setClassifyForm({ ...classifyForm, age: Number(e.target.value) })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Horizon (Years)</label>
                    <input
                      type="number"
                      value={classifyForm.horizon_years}
                      onChange={(e) => setClassifyForm({ ...classifyForm, horizon_years: Number(e.target.value) })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Monthly SIP</label>
                    <input
                      type="number"
                      value={classifyForm.monthly_sip}
                      onChange={(e) => setClassifyForm({ ...classifyForm, monthly_sip: Number(e.target.value) })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Target Amount</label>
                    <input
                      type="number"
                      value={classifyForm.target_amount}
                      onChange={(e) => setClassifyForm({ ...classifyForm, target_amount: Number(e.target.value) })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Risk Tolerance</label>
                    <select
                      value={classifyForm.risk_tolerance}
                      onChange={(e) => setClassifyForm({ ...classifyForm, risk_tolerance: e.target.value as any })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    >
                      <option value="Conservative">Conservative</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Aggressive">Aggressive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Volatility Comfort</label>
                    <select
                      value={classifyForm.volatility}
                      onChange={(e) => setClassifyForm({ ...classifyForm, volatility: e.target.value as any })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Liquidity Need</label>
                    <select
                      value={classifyForm.liquidity}
                      onChange={(e) => setClassifyForm({ ...classifyForm, liquidity: e.target.value as any })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Knowledge</label>
                    <select
                      value={classifyForm.knowledge}
                      onChange={(e) => setClassifyForm({ ...classifyForm, knowledge: e.target.value as any })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <button onClick={handleClassify} disabled={loading} className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, boxShadow: `0 4px 14px ${colors.glassShadow}` }}>
                  {loading ? 'Classifying...' : 'Classify Profile'}
                </button>
              </div>
            )}

            {activeTab === 'recommend' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Persona</label>
                  <select
                    value={recommendForm.persona_id}
                    onChange={(e) => setRecommendForm({ ...recommendForm, persona_id: e.target.value })}
                    className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  >
                    <option value="capital-guardian">Capital Guardian</option>
                    <option value="balanced-voyager">Balanced Voyager</option>
                    <option value="accelerated-builder">Accelerated Builder</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Top N Recommendations</label>
                    <input
                      type="number"
                      value={recommendForm.top_n}
                      onChange={(e) => setRecommendForm({ ...recommendForm, top_n: Number(e.target.value) })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      min={1}
                      max={10}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Horizon (Years)</label>
                    <input
                      type="number"
                      value={recommendForm.horizon_years}
                      onChange={(e) => setRecommendForm({ ...recommendForm, horizon_years: e.target.value })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    />
                  </div>
                </div>

                <button onClick={handleRecommend} disabled={loading} className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, boxShadow: `0 4px 14px ${colors.glassShadow}` }}>
                  {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
                </button>
              </div>
            )}

            {activeTab === 'recommend-blended' && (
              <div className="space-y-3">
                {/* Blended Allocation Display */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Target Allocation (%)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['equity', 'debt', 'hybrid', 'gold', 'international', 'liquid'] as const).map((key) => (
                      <div key={key}>
                        <label className="block text-xs mb-1 capitalize" style={{ color: colors.textSecondary }}>{key}</label>
                        <input
                          type="number"
                          value={blendedRecommendForm.blended_allocation[key]}
                          onChange={(e) => setBlendedRecommendForm({
                            ...blendedRecommendForm,
                            blended_allocation: {
                              ...blendedRecommendForm.blended_allocation,
                              [key]: Number(e.target.value),
                            },
                          })}
                          className="w-full h-10 px-3 rounded-xl text-sm transition-all focus:outline-none"
                          style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                    Total: {Object.values(blendedRecommendForm.blended_allocation).reduce((a, b) => a + b, 0).toFixed(1)}%
                    {blendedClassifyResult && (
                      <span className="ml-2" style={{ color: colors.success }}>
                        (Auto-filled from classification)
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Investment Amount</label>
                    <input
                      type="number"
                      value={blendedRecommendForm.investment_amount}
                      onChange={(e) => setBlendedRecommendForm({ ...blendedRecommendForm, investment_amount: Number(e.target.value) })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      min={1000}
                      step={1000}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Top N Funds</label>
                    <input
                      type="number"
                      value={blendedRecommendForm.top_n}
                      onChange={(e) => setBlendedRecommendForm({ ...blendedRecommendForm, top_n: Number(e.target.value) })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      min={1}
                      max={15}
                    />
                  </div>
                </div>

                <button onClick={handleBlendedRecommend} disabled={loading} className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, boxShadow: `0 4px 14px ${colors.glassShadow}` }}>
                  {loading ? 'Getting Blended Recommendations...' : 'Get Blended Recommendations'}
                </button>
              </div>
            )}

            {activeTab === 'risk' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>Risk Tolerance</label>
                    <select
                      value={riskForm.risk_tolerance}
                      onChange={(e) => setRiskForm({ ...riskForm, risk_tolerance: e.target.value })}
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
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
                      className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none" style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
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

                <button onClick={handleRiskAssess} disabled={loading} className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, boxShadow: `0 4px 14px ${colors.glassShadow}` }}>
                  {loading ? 'Assessing Risk...' : 'Assess Risk'}
                </button>
              </div>
            )}
            </div>

            {/* Output Section */}
            <div className="p-5" style={{ background: isDark ? 'rgba(96, 165, 250, 0.03)' : 'rgba(37, 99, 235, 0.02)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>Output</span>
                {hasResult && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${colors.success}15`, color: colors.success }}>Complete</span>
                )}
              </div>

            {activeTab === 'classify' && classifyResult && (
              <div className="space-y-3">
                {/* Matched Persona */}
                <div className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}>
                      {classifyResult.persona.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{classifyResult.persona.name}</h4>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>{classifyResult.persona.risk_band}</span>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{classifyResult.persona.description}</p>
                </div>

                {/* Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Confidence</span>
                    <span className="text-lg font-bold" style={{ color: colors.primary }}>{(classifyResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                    <div className="h-full rounded-full" style={{ width: `${classifyResult.confidence * 100}%`, background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }} />
                  </div>
                </div>

                {/* Probabilities */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>All Probabilities</p>
                  <div className="space-y-2">
                    {Object.entries(classifyResult.probabilities).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize" style={{ color: colors.textSecondary }}>{key.replace(/-/g, ' ')}</span>
                        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{(value * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs pt-2 mt-1" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                  <span>Model: {classifyResult.model_version}</span>
                  <span>Latency: {classifyResult.latency_ms}ms</span>
                </div>
              </div>
            )}

            {activeTab === 'recommend' && recommendResult && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: colors.textSecondary }}>{recommendResult.persona_alignment}</p>

                <div className="space-y-2">
                  {recommendResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{rec.scheme_name}</span>
                        <span className="text-base font-bold" style={{ color: colors.primary }}>{(rec.suggested_allocation * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>{rec.category}</span>
                        <span className="text-xs" style={{ color: colors.textTertiary }}>Score: {rec.score.toFixed(2)}</span>
                      </div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{rec.reasoning}</p>
                      {rec.metrics && (
                        <div className="flex items-center gap-3 mt-1.5 text-sm" style={{ color: colors.textTertiary }}>
                          {rec.metrics.return_3y && <span>3Y Return: {rec.metrics.return_3y}%</span>}
                          {rec.metrics.sharpe_ratio && <span>Sharpe: {rec.metrics.sharpe_ratio}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs pt-2 mt-1" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                  <span>Model: {recommendResult.model_version}</span>
                  <span>Latency: {recommendResult.latency_ms}ms</span>
                </div>
              </div>
            )}

            {activeTab === 'recommend-blended' && blendedRecommendResult && (
              <div className="space-y-3">
                {/* Alignment Score */}
                <div className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Alignment Score</span>
                    <span className="text-lg font-bold" style={{
                      color: blendedRecommendResult.alignment_score >= 0.9 ? colors.success :
                             blendedRecommendResult.alignment_score >= 0.7 ? colors.warning : colors.error
                    }}>
                      {(blendedRecommendResult.alignment_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${blendedRecommendResult.alignment_score * 100}%`,
                        background: blendedRecommendResult.alignment_score >= 0.9 ? colors.success :
                                   blendedRecommendResult.alignment_score >= 0.7 ? colors.warning : colors.error
                      }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>{blendedRecommendResult.alignment_message}</p>
                </div>

                {/* Asset Class Breakdown */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Asset Class Breakdown</p>
                  <div className="space-y-2">
                    {blendedRecommendResult.asset_class_breakdown.map((asset, idx) => (
                      <div key={idx} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize" style={{ color: colors.textPrimary }}>{asset.asset_class}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: colors.textTertiary }}>Target: {(asset.target_allocation <= 1 ? asset.target_allocation * 100 : asset.target_allocation).toFixed(1)}%</span>
                            <span className="text-sm font-bold" style={{ color: colors.primary }}>{(asset.actual_allocation <= 1 ? asset.actual_allocation * 100 : asset.actual_allocation).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                          <span>{asset.fund_count} fund{asset.fund_count !== 1 ? 's' : ''}</span>
                          {asset.total_amount && <span>• ₹{(asset.total_amount / 1000).toFixed(1)}K</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fund Recommendations */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Recommended Funds ({blendedRecommendResult.recommendations.length})</p>
                  <div className="space-y-2">
                    {blendedRecommendResult.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{rec.scheme_name}</span>
                          <div className="text-right">
                            <span className="text-base font-bold" style={{ color: colors.primary }}>{(rec.suggested_allocation * 100).toFixed(0)}%</span>
                            {rec.suggested_amount && (
                              <span className="text-xs block" style={{ color: colors.textSecondary }}>₹{rec.suggested_amount.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}>{rec.category}</span>
                          {rec.asset_class && (
                            <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: `${colors.success}15`, color: colors.success, border: `1px solid ${colors.success}30` }}>{rec.asset_class}</span>
                          )}
                          <span className="text-xs" style={{ color: colors.textTertiary }}>Score: {rec.score.toFixed(2)}</span>
                        </div>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>{rec.reasoning}</p>
                        {rec.metrics && (
                          <div className="flex items-center gap-3 mt-1.5 text-sm" style={{ color: colors.textTertiary }}>
                            {rec.metrics.return_3y && <span>3Y Return: {rec.metrics.return_3y}%</span>}
                            {rec.metrics.sharpe_ratio && <span>Sharpe: {rec.metrics.sharpe_ratio}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs pt-2 mt-1" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                  <span>Model: {blendedRecommendResult.model_version}</span>
                  <span>Latency: {blendedRecommendResult.latency_ms}ms</span>
                </div>
              </div>
            )}

            {activeTab === 'risk' && riskResult && (
              <div className="space-y-3">
                {/* Risk Score */}
                <div className="p-4 rounded-xl" style={{ background: isDark ? `${colors.primary}15` : `${colors.primary}08`, border: `1px solid ${colors.chipBorder}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Risk Level</span>
                    <span className="text-base font-bold" style={{
                      color: riskResult.risk_score > 65 ? colors.error :
                             riskResult.risk_score > 45 ? colors.warning : colors.success
                    }}>
                      {riskResult.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${riskResult.risk_score}%`,
                          background: riskResult.risk_score > 65 ? colors.error :
                                     riskResult.risk_score > 45 ? colors.warning : colors.success
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>{riskResult.risk_score}/100</span>
                  </div>
                </div>

                <p className="text-sm" style={{ color: colors.textSecondary }}>{riskResult.persona_alignment}</p>

                {/* Risk Factors */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Risk Factors</p>
                  <div className="space-y-2">
                    {riskResult.risk_factors.map((factor, idx) => (
                      <div key={idx} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{factor.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{
                            background: factor.severity === 'High' ? `${colors.error}15` :
                                       factor.severity === 'Moderate' ? `${colors.warning}15` : `${colors.success}15`,
                            color: factor.severity === 'High' ? colors.error :
                                  factor.severity === 'Moderate' ? colors.warning : colors.success
                          }}>
                            {factor.severity}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>Recommendations</p>
                  <ul className="space-y-1.5">
                    {riskResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-1.5" style={{ color: colors.textSecondary }}>
                        <span style={{ color: colors.primary }}>•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-3 text-xs pt-2 mt-1" style={{ color: colors.textTertiary, borderTop: `1px solid ${colors.chipBorder}` }}>
                  <span>Model: {riskResult.model_version}</span>
                  <span>Latency: {riskResult.latency_ms}ms</span>
                </div>
              </div>
            )}

            {!classifyResult && !recommendResult && !blendedRecommendResult && !riskResult && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: colors.chipBg }}>
                  <svg className="w-5 h-5" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-xs" style={{ color: colors.textTertiary }}>Run a test to see results</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MLLabPage;
