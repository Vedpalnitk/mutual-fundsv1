/**
 * ML & Personas API — Personas, Allocations, ML Models, ML Gateway
 */
import { request } from '../api'

// ============= Personas API =============

export interface Persona {
  id: string;
  name: string;
  slug: string;
  description?: string;
  riskBand: string;
  iconName?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rules?: PersonaRule[];
  insights?: PersonaInsight[];
}

export interface PersonaRule {
  id: string;
  personaId: string;
  ruleType: string;
  operator: string;
  value: any;
  priority: number;
}

export interface PersonaInsight {
  id: string;
  personaId: string;
  insightText: string;
  displayOrder: number;
}

// Bulk Create Types
export interface BulkCreateResult {
  created: Persona[];
  failed: Array<{ persona: Partial<Persona>; error: string }>;
}

// Classification Types
export interface ClassifyProfileData {
  horizonYears?: number;
  liquidity?: string;
  riskTolerance?: string;
  volatility?: string;
  knowledge?: string;
}

export interface SaveClassificationRequest {
  profile: ClassifyProfileData;
  name?: string;
  email?: string;
  age?: number;
  targetAmount?: number;
  monthlySip?: number;
}

export interface ClassificationResult {
  persona: Persona;
  confidence: number;
  method: string;
  profileId?: string;
  inferenceLogId?: string;
}

export interface ClassificationLog {
  id: string;
  inputFeatures: ClassifyProfileData;
  prediction: {
    personaId: string;
    personaSlug: string;
    distribution?: Record<string, number>;
    blendedAllocation?: AllocationBreakdown;
  };
  confidence: number;
  latencyMs: number;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    profile?: {
      id: string;
      name: string;
      age?: number;
      goal?: string;
      targetAmount?: number;
      monthlySip?: number;
      horizonYears?: number;
      riskTolerance?: string;
      personaDistribution?: Record<string, number>;
      blendedAllocation?: AllocationBreakdown;
      // Extended onboarding fields
      gender?: string;
      city?: string;
      occupation?: string;
      employmentType?: string;
      monthlyIncome?: number;
      monthlyExpenses?: number;
      existingSavings?: number;
      emergencyFundMonths?: number;
      dependents?: number;
      hasLoans?: boolean;
      totalEmi?: number;
      hasHealthInsurance?: boolean;
      hasLifeInsurance?: boolean;
      investmentExperience?: string;
      investmentKnowledge?: string;
      currentInvestments?: {
        mutualFunds?: boolean;
        stocks?: boolean;
        fixedDeposits?: boolean;
        ppf?: boolean;
        nps?: boolean;
        realEstate?: boolean;
        gold?: boolean;
        crypto?: boolean;
      };
      riskAppetite?: string;
      marketDropReaction?: string;
      preferredReturns?: string;
      volatilityComfort?: string;
      drawdownTolerance?: string;
      lumpSumAvailable?: number;
    };
  };
}

export interface ClassificationStats {
  personas: Array<{
    id: string;
    name: string;
    slug: string;
    userCount: number;
  }>;
  totalClassifications: number;
}

export const personasApi = {
  list: () => request<Persona[]>('/api/v1/admin/personas'),
  get: (id: string) => request<Persona>(`/api/v1/admin/personas/${id}`),
  create: (data: Partial<Persona>) => request<Persona>('/api/v1/admin/personas', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Persona>) => request<Persona>(`/api/v1/admin/personas/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => request<void>(`/api/v1/admin/personas/${id}`, { method: 'DELETE' }),
  duplicate: (id: string) => request<Persona>(`/api/v1/admin/personas/${id}/duplicate`, { method: 'POST' }),

  // Bulk Operations
  bulkCreate: (personas: Partial<Persona>[]) => request<BulkCreateResult>('/api/v1/admin/personas/bulk', { method: 'POST', body: { personas } }),

  // Classification
  classifyAndSave: (data: SaveClassificationRequest) => request<ClassificationResult>('/api/v1/admin/personas/classify', { method: 'POST', body: data }),
  getClassificationResults: (options?: { personaId?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.personaId) params.append('personaId', options.personaId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<ClassificationLog[]>(`/api/v1/admin/personas/classifications${query}`);
  },
  getClassificationStats: () => request<ClassificationStats>('/api/v1/admin/personas/classifications/stats'),

  // Rules
  listRules: (id: string) => request<PersonaRule[]>(`/api/v1/admin/personas/${id}/rules`),
  addRule: (id: string, data: Partial<PersonaRule>) => request<PersonaRule>(`/api/v1/admin/personas/${id}/rules`, { method: 'POST', body: data }),
  updateRule: (id: string, ruleId: string, data: Partial<PersonaRule>) => request<PersonaRule>(`/api/v1/admin/personas/${id}/rules/${ruleId}`, { method: 'PUT', body: data }),
  deleteRule: (id: string, ruleId: string) => request<void>(`/api/v1/admin/personas/${id}/rules/${ruleId}`, { method: 'DELETE' }),

  // Insights
  listInsights: (id: string) => request<PersonaInsight[]>(`/api/v1/admin/personas/${id}/insights`),
  addInsight: (id: string, data: Partial<PersonaInsight>) => request<PersonaInsight>(`/api/v1/admin/personas/${id}/insights`, { method: 'POST', body: data }),
  updateInsight: (id: string, insightId: string, data: Partial<PersonaInsight>) => request<PersonaInsight>(`/api/v1/admin/personas/${id}/insights/${insightId}`, { method: 'PUT', body: data }),
  deleteInsight: (id: string, insightId: string) => request<void>(`/api/v1/admin/personas/${id}/insights/${insightId}`, { method: 'DELETE' }),
};

// ============= Allocations API =============

export interface AllocationStrategy {
  id: string;
  personaId: string;
  name: string;
  description?: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  components?: AllocationComponent[];
  constraints?: RiskConstraint[];
}

export interface AllocationComponent {
  id: string;
  strategyId: string;
  label: string;
  allocationPercent: number;
  note?: string;
  displayOrder: number;
}

export interface RiskConstraint {
  id: string;
  strategyId: string;
  constraintType: string;
  constraintValue: any;
  description?: string;
}

export const allocationsApi = {
  list: () => request<AllocationStrategy[]>('/api/v1/admin/allocations'),
  get: (id: string) => request<AllocationStrategy>(`/api/v1/admin/allocations/${id}`),
  create: (data: Partial<AllocationStrategy>) => request<AllocationStrategy>('/api/v1/admin/allocations', { method: 'POST', body: data }),
  update: (id: string, data: Partial<AllocationStrategy>) => request<AllocationStrategy>(`/api/v1/admin/allocations/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => request<void>(`/api/v1/admin/allocations/${id}`, { method: 'DELETE' }),

  // Components
  addComponent: (id: string, data: Partial<AllocationComponent>) => request<AllocationComponent>(`/api/v1/admin/allocations/${id}/components`, { method: 'POST', body: data }),
  updateComponent: (id: string, componentId: string, data: Partial<AllocationComponent>) => request<AllocationComponent>(`/api/v1/admin/allocations/${id}/components/${componentId}`, { method: 'PUT', body: data }),
  deleteComponent: (id: string, componentId: string) => request<void>(`/api/v1/admin/allocations/${id}/components/${componentId}`, { method: 'DELETE' }),

  // Constraints
  addConstraint: (id: string, data: Partial<RiskConstraint>) => request<RiskConstraint>(`/api/v1/admin/allocations/${id}/constraints`, { method: 'POST', body: data }),
  updateConstraint: (id: string, constraintId: string, data: Partial<RiskConstraint>) => request<RiskConstraint>(`/api/v1/admin/allocations/${id}/constraints/${constraintId}`, { method: 'PUT', body: data }),
  deleteConstraint: (id: string, constraintId: string) => request<void>(`/api/v1/admin/allocations/${id}/constraints/${constraintId}`, { method: 'DELETE' }),
};

// ============= ML Models API =============

export interface MlModel {
  id: string;
  name: string;
  slug: string;
  modelType: string;
  description?: string;
  framework?: string;
  createdAt: string;
  updatedAt: string;
  versions?: ModelVersion[];
  productionVersion?: ModelVersion;
}

export interface ModelVersion {
  id: string;
  modelId: string;
  version: string;
  storagePath: string;
  fileSizeBytes?: number;
  metadata?: any;
  metrics?: any;
  status: string;
  isProduction: boolean;
  trainedAt?: string;
  createdAt: string;
}

export const modelsApi = {
  list: () => request<MlModel[]>('/api/v1/admin/models'),
  get: (id: string) => request<MlModel>(`/api/v1/admin/models/${id}`),
  create: (data: Partial<MlModel>) => request<MlModel>('/api/v1/admin/models', { method: 'POST', body: data }),
  update: (id: string, data: Partial<MlModel>) => request<MlModel>(`/api/v1/admin/models/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => request<void>(`/api/v1/admin/models/${id}`, { method: 'DELETE' }),

  // Versions
  listVersions: (id: string) => request<ModelVersion[]>(`/api/v1/admin/models/${id}/versions`),
  createVersion: (id: string, data: Partial<ModelVersion>) => request<ModelVersion>(`/api/v1/admin/models/${id}/versions`, { method: 'POST', body: data }),
  promoteVersion: (id: string, versionId: string) => request<ModelVersion>(`/api/v1/admin/models/${id}/versions/${versionId}/promote`, { method: 'PATCH' }),
  rollbackVersion: (id: string, versionId: string) => request<ModelVersion>(`/api/v1/admin/models/${id}/versions/${versionId}/rollback`, { method: 'PATCH' }),
  deleteVersion: (id: string, versionId: string) => request<void>(`/api/v1/admin/models/${id}/versions/${versionId}`, { method: 'DELETE' }),
};

// ============= ML Gateway API (Classification, Recommendations, etc.) =============

export interface ClassifyRequest {
  request_id?: string;
  profile: {
    age: number;
    goal?: string;
    target_amount?: number;
    target_year?: number;
    monthly_sip?: number;
    lump_sum?: number;
    liquidity: 'Low' | 'Medium' | 'High';
    risk_tolerance: 'Conservative' | 'Moderate' | 'Aggressive';
    knowledge: 'Beginner' | 'Intermediate' | 'Advanced';
    volatility: 'Low' | 'Medium' | 'High';
    horizon_years: number;
  };
}

export interface ClassifyResponse {
  request_id?: string;
  persona: {
    id: string;
    name: string;
    slug: string;
    risk_band: string;
    description?: string;
  };
  confidence: number;
  probabilities: Record<string, number>;
  model_version: string;
  latency_ms: number;
}

// Blended Classification Types
export interface AllocationBreakdown {
  equity: number;
  debt: number;
  hybrid: number;
  gold: number;
  international: number;
  liquid: number;
}

export interface PersonaDistributionItem {
  persona: {
    id: string;
    name: string;
    slug: string;
    risk_band: string;
    description?: string;
  };
  weight: number;
  allocation: AllocationBreakdown;
}

export interface BlendedClassifyResponse {
  request_id?: string;
  primary_persona: {
    id: string;
    name: string;
    slug: string;
    risk_band: string;
    description?: string;
  };
  distribution: PersonaDistributionItem[];
  blended_allocation: AllocationBreakdown;
  confidence: number;
  model_version: string;
  latency_ms: number;
}

export interface RecommendRequest {
  request_id?: string;
  persona_id: string;
  profile: Record<string, string>;
  top_n: number;
  category_filters?: string[];
  exclude_funds?: number[];
}

export interface FundRecommendation {
  scheme_code: number;
  scheme_name: string;
  fund_house?: string;
  category: string;
  score: number;
  suggested_allocation: number;
  reasoning: string;
  metrics?: Record<string, number>;
}

export interface RecommendResponse {
  request_id?: string;
  recommendations: FundRecommendation[];
  persona_alignment: string;
  model_version: string;
  latency_ms: number;
}

// Blended Recommendation Types
export interface BlendedRecommendRequest {
  request_id?: string;
  blended_allocation: AllocationBreakdown;
  persona_distribution?: Record<string, number>;
  profile: Record<string, any>;
  top_n: number;
  investment_amount?: number;
  category_filters?: string[];
  exclude_funds?: number[];
}

export interface BlendedFundRecommendation {
  scheme_code: number;
  scheme_name: string;
  fund_house?: string;
  category: string;
  asset_class?: string;
  score: number;
  suggested_allocation: number;
  suggested_amount?: number;
  reasoning: string;
  metrics?: Record<string, number>;
}

export interface AssetClassBreakdown {
  asset_class: string;
  target_allocation: number;
  actual_allocation: number;
  fund_count: number;
  total_amount?: number;
}

export interface BlendedRecommendResponse {
  request_id?: string;
  recommendations: BlendedFundRecommendation[];
  asset_class_breakdown: AssetClassBreakdown[];
  target_allocation: AllocationBreakdown;
  alignment_score: number;
  alignment_message: string;
  model_version: string;
  latency_ms: number;
}

export interface RiskFactor {
  name: string;
  contribution: number;
  severity: string;
  description?: string;
}

export interface RiskResponse {
  request_id?: string;
  risk_level: string;
  risk_score: number;
  risk_factors: RiskFactor[];
  recommendations: string[];
  persona_alignment: string;
  model_version: string;
  latency_ms: number;
}

// ============= Portfolio Analysis Types =============

export interface PortfolioHolding {
  scheme_code: number;
  scheme_name?: string;
  amount?: number;
  units?: number;
  purchase_date?: string;
  purchase_price?: number;
  purchase_amount?: number;
}

export interface PortfolioAllocationTarget {
  equity: number;
  debt: number;
  hybrid: number;
  gold: number;
  international: number;
  liquid: number;
}

export interface PortfolioAnalysisRequest {
  request_id?: string;
  holdings: PortfolioHolding[];
  target_allocation: PortfolioAllocationTarget;
  profile: Record<string, any>;
}

export interface EnrichedHolding {
  scheme_code: number;
  scheme_name: string;
  category: string;
  asset_class: string;
  current_value: number;
  weight: number;
  units?: number;
  nav?: number;
  return_1y?: number;
  return_3y?: number;
  volatility?: number;
  sharpe_ratio?: number;
  holding_period_days?: number;
  tax_status?: 'LTCG' | 'STCG';
  purchase_amount?: number;
  unrealized_gain?: number;
}

export interface RebalancingAction {
  action: 'SELL' | 'BUY' | 'HOLD' | 'ADD_NEW';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  scheme_code: number;
  scheme_name: string;
  category: string;
  asset_class: string;
  current_value?: number;
  current_weight?: number;
  current_units?: number;
  target_value: number;
  target_weight: number;
  transaction_amount: number;
  transaction_units?: number;
  tax_status?: 'LTCG' | 'STCG';
  holding_period_days?: number;
  estimated_gain?: number;
  tax_note?: string;
  reason: string;
}

export interface CurrentMetrics {
  total_value: number;
  total_holdings: number;
  weighted_return_1y?: number;
  weighted_return_3y?: number;
  weighted_volatility?: number;
  weighted_sharpe?: number;
  category_breakdown: Record<string, { allocation: number; count: number; value: number }>;
}

export interface AnalysisSummary {
  is_aligned: boolean;
  alignment_score: number;
  primary_issues: string[];
  total_sell_amount: number;
  total_buy_amount: number;
  net_transaction: number;
  tax_impact_summary: string;
}

export interface PortfolioAnalysisResponse {
  request_id?: string;
  current_allocation: PortfolioAllocationTarget;
  target_allocation: PortfolioAllocationTarget;
  allocation_gaps: Record<string, number>;
  current_metrics: CurrentMetrics;
  holdings: EnrichedHolding[];
  rebalancing_actions: RebalancingAction[];
  summary: AnalysisSummary;
  model_version: string;
  latency_ms: number;
}

// ============= Portfolio Optimization Types =============

export interface OptimizeFundInput {
  scheme_code: number;
  scheme_name: string;
  category: string;
  asset_class: string;
  return_1y: number;
  return_3y?: number;
  return_5y?: number;
  volatility: number;
  sharpe_ratio?: number;
  expense_ratio?: number;
  aum?: number;
}

export interface OptimizationConstraints {
  min_funds?: number;
  max_funds?: number;
  min_weight_per_fund?: number;
  max_weight_per_fund?: number;
  min_equity?: number;
  max_equity?: number;
  min_debt?: number;
  max_debt?: number;
  max_volatility?: number;
}

export interface OptimizePortfolioRequest {
  request_id?: string;
  persona_id: string;
  profile: Record<string, string>;
  available_funds: OptimizeFundInput[];
  constraints?: OptimizationConstraints;
}

export interface OptimizedAllocation {
  scheme_code: number;
  scheme_name: string;
  category: string;
  weight: number;
  monthly_sip?: number;
}

export interface OptimizedPortfolioMetrics {
  expected_return: number;
  expected_volatility: number;
  sharpe_ratio: number;
  max_drawdown?: number;
  projected_value?: number;
}

export interface OptimizePortfolioResponse {
  request_id?: string;
  allocations: OptimizedAllocation[];
  expected_metrics: OptimizedPortfolioMetrics;
  model_version: string;
  latency_ms: number;
}

export const mlApi = {
  health: () => request<{ status: string; services: any[] }>('/api/v1/ml/health'),
  classify: (data: ClassifyRequest) => request<ClassifyResponse>('/api/v1/classify', { method: 'POST', body: data }),
  classifyBlended: (data: ClassifyRequest) => request<BlendedClassifyResponse>('/api/v1/classify/blended', { method: 'POST', body: data }),
  recommend: (data: RecommendRequest) => request<RecommendResponse>('/api/v1/recommendations', { method: 'POST', body: data }),
  recommendBlended: (data: BlendedRecommendRequest) => request<BlendedRecommendResponse>('/api/v1/recommendations/blended', { method: 'POST', body: data }),
  assessRisk: (data: any) => request<RiskResponse>('/api/v1/risk', { method: 'POST', body: data }),
  analyzePortfolio: (data: PortfolioAnalysisRequest) => request<PortfolioAnalysisResponse>('/api/v1/analyze/portfolio', { method: 'POST', body: data }),
  optimizePortfolio: (data: OptimizePortfolioRequest) => request<OptimizePortfolioResponse>('/api/v1/recommendations/portfolio', { method: 'POST', body: data }),
};

// ProfileWithRecommendations depends on BlendedRecommendResponse above
export interface ProfileWithRecommendations {
  profile: ClassificationLog;
  recommendations?: BlendedRecommendResponse;
  loading?: boolean;
  error?: string;
}
