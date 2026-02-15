/**
 * API Service for backend communication
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3501';

// Token storage key for FA Portal authentication
const FA_TOKEN_KEY = 'fa_auth_token';

// Get auth token from localStorage (client-side only)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FA_TOKEN_KEY);
}

// Set auth token in localStorage
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FA_TOKEN_KEY, token);
  }
}

// Clear auth token from localStorage
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(FA_TOKEN_KEY);
  }
}

// ============= Auth API =============

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  ownerId?: string;
  allowedPages?: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    }),
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, password, name },
      skipAuth: true,
    }),
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean; // Skip adding auth header (for public endpoints)
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  // Build headers with optional auth token
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============= Users Management API =============

export interface UserProfile {
  name: string;
}

export interface SystemUser {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  profile: UserProfile | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: string;
  phone?: string;
  isActive?: boolean;
}

export const usersApi = {
  getAll: () => request<SystemUser[]>('/api/v1/users'),

  getOne: (id: string) => request<SystemUser>(`/api/v1/users/${id}`),

  create: (data: CreateUserRequest) =>
    request<SystemUser>('/api/v1/users', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateUserRequest) =>
    request<SystemUser>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    request<void>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    }),

  resetPassword: (id: string, newPassword: string) =>
    request<{ message: string }>(`/api/v1/users/${id}/reset-password`, {
      method: 'POST',
      body: { newPassword },
    }),

  toggleActive: (id: string) =>
    request<SystemUser>(`/api/v1/users/${id}/toggle-active`, {
      method: 'POST',
    }),
};

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

export interface ProfileWithRecommendations {
  profile: ClassificationLog;
  recommendations?: BlendedRecommendResponse;
  loading?: boolean;
  error?: string;
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

// ============= Live Funds API =============

export interface LiveFundScheme {
  schemeCode: number;
  schemeName: string;
}

export interface LiveFundWithMetrics {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  schemeType: string;
  currentNav: number;
  previousNav: number;
  dayChange: number;
  dayChangePercent: number;
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  assetClass: string;
  // Risk data from Kuvera
  isin?: string;
  riskRating?: number;      // 1-5 scale
  crisilRating?: string;    // Original CRISIL text
  volatility?: number;      // Percentage
  // Additional Kuvera data
  fundRating?: number;      // Star rating 1-5
  expenseRatio?: number;    // TER percentage
  aum?: number;             // Assets Under Management in Crores
  fundManager?: string;     // Fund manager name
}

export const liveFundsApi = {
  search: (query: string, directOnly = true, growthOnly = true) => {
    const params = new URLSearchParams({ q: query });
    if (directOnly) params.append('direct_only', 'true');
    if (growthOnly) params.append('growth_only', 'true');
    return request<LiveFundScheme[]>(`/api/v1/funds/live/search?${params.toString()}`);
  },
  getPopular: () => request<LiveFundWithMetrics[]>('/api/v1/funds/live/popular'),
  // Get funds by category with full metrics (large_cap, mid_cap, small_cap, flexi_cap, elss, hybrid, debt, liquid, index, sectoral, international, gold)
  getByCategory: (category: string, limit = 20) =>
    request<LiveFundWithMetrics[]>(`/api/v1/funds/live/category/${encodeURIComponent(category)}?limit=${limit}`),
  // Search by category name (returns basic scheme info)
  searchByCategory: (category: string, limit = 10) =>
    request<LiveFundScheme[]>(`/api/v1/funds/live/search-category/${encodeURIComponent(category)}?limit=${limit}`),
  getDetails: (schemeCode: number) =>
    request<LiveFundWithMetrics>(`/api/v1/funds/live/${schemeCode}`),
  getBatchDetails: (schemeCodes: number[]) =>
    request<LiveFundWithMetrics[]>(`/api/v1/funds/live/batch/details?codes=${schemeCodes.join(',')}`),
};

// ============= Direct MFAPI.in API (for NAV history) =============

export interface NavDataPoint {
  date: string;  // DD-MM-YYYY format from MFAPI.in
  nav: string;   // NAV as string from API
}

export interface FundNavHistory {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: NavDataPoint[];
  status: string;
}

export const mfApi = {
  getNavHistory: async (schemeCode: number): Promise<FundNavHistory> => {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!res.ok) throw new Error('Failed to fetch NAV history');
    return res.json();
  }
};

// ============= Database-Backed Funds API (New Single Source of Truth) =============

// Raw API response format (snake_case from backend)
interface RawDatabaseFund {
  scheme_code: number;
  scheme_name: string;
  fund_house: string;
  category: string;
  sub_category?: string;
  asset_class: string;
  nav?: number;
  nav_date?: string;
  day_change?: number;
  day_change_percent?: number;
  return_1m?: number;
  return_3m?: number;
  return_6m?: number;
  return_1y?: number;
  return_3y?: number;
  return_5y?: number;
  risk_rating?: number;
  fund_rating?: number;
  expense_ratio?: number;
  aum?: number;
  fund_manager?: string;
  benchmark?: string;
  min_investment?: number;
  min_sip_amount?: number;
  exit_load?: string;
  launch_date?: string;
  volatility?: number;
  sharpe_ratio?: number;
  beta?: number;
  alpha?: number;
  sortino?: number;
  max_drawdown?: number;
  top_holdings?: { name: string; percentage: number }[];
}

// Normalized format for frontend use (camelCase)
export interface DatabaseFund {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  subCategory?: string;
  assetClass: string;
  currentNav: number;
  navDate?: string;
  dayChange: number;
  dayChangePercent: number;
  return1M?: number;
  return3M?: number;
  return6M?: number;
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  riskRating?: number;
  fundRating?: number;
  expenseRatio?: number;
  aum?: number;
  fundManager?: string;
  benchmark?: string;
  minInvestment?: number;
  minSipAmount?: number;
  exitLoad?: string;
  launchDate?: string;
  volatility?: number;
  sharpeRatio?: number;
  beta?: number;
  alpha?: number;
  sortino?: number;
  maxDrawdown?: number;
  topHoldings?: { name: string; percentage: number }[];
}

// Transform snake_case to camelCase
function transformFund(raw: RawDatabaseFund): DatabaseFund {
  return {
    schemeCode: raw.scheme_code,
    schemeName: raw.scheme_name,
    fundHouse: raw.fund_house,
    category: raw.category,
    subCategory: raw.sub_category,
    assetClass: raw.asset_class,
    currentNav: raw.nav || 0,
    navDate: raw.nav_date,
    dayChange: raw.day_change || 0,
    dayChangePercent: raw.day_change_percent || 0,
    return1M: raw.return_1m,
    return3M: raw.return_3m,
    return6M: raw.return_6m,
    return1Y: raw.return_1y,
    return3Y: raw.return_3y,
    return5Y: raw.return_5y,
    riskRating: raw.risk_rating,
    fundRating: raw.fund_rating,
    expenseRatio: raw.expense_ratio,
    aum: raw.aum,
    fundManager: raw.fund_manager,
    benchmark: raw.benchmark,
    minInvestment: raw.min_investment,
    minSipAmount: raw.min_sip_amount,
    exitLoad: raw.exit_load,
    launchDate: raw.launch_date,
    volatility: raw.volatility,
    sharpeRatio: raw.sharpe_ratio,
    beta: raw.beta,
    alpha: raw.alpha,
    sortino: raw.sortino,
    maxDrawdown: raw.max_drawdown,
    topHoldings: raw.top_holdings,
  };
}

export interface FundsStatsResponse {
  total: number;
  byAssetClass: Record<string, number>;
  byCategory: Record<string, number>;
}

export const dbFundsApi = {
  // Get all funds from database (single source of truth)
  getAllFunds: async (): Promise<DatabaseFund[]> => {
    const response = await request<{ funds: RawDatabaseFund[] }>('/api/v1/funds/live/ml/funds');
    return response.funds.map(transformFund);
  },

  // Get fund statistics
  getStats: () =>
    request<FundsStatsResponse>('/api/v1/funds/live/ml/funds/stats'),

  // Get single fund by scheme code
  getFund: async (schemeCode: number): Promise<DatabaseFund | null> => {
    try {
      const response = await request<{ fund: RawDatabaseFund }>(`/api/v1/funds/live/ml/funds/${schemeCode}`);
      return response.fund ? transformFund(response.fund) : null;
    } catch {
      return null;
    }
  },

  // Get multiple funds by scheme codes
  getBatchFunds: async (schemeCodes: number[]): Promise<DatabaseFund[]> => {
    const response = await request<{ funds: RawDatabaseFund[] }>(`/api/v1/funds/live/ml/funds/batch?codes=${schemeCodes.join(',')}`);
    return response.funds.map(transformFund);
  },

  // Search funds by name/AMC
  searchFunds: async (query: string): Promise<DatabaseFund[]> => {
    // Append "Direct Growth" to search for direct plans by default
    const searchQuery = query.toLowerCase().includes('direct') ? query : `${query} Direct Growth`;
    const response = await request<Array<{ schemeCode: number; schemeName: string }>>(`/api/v1/funds/live/search?q=${encodeURIComponent(searchQuery)}`);
    // Transform MFAPI response to DatabaseFund format
    return response.map(fund => ({
      schemeCode: fund.schemeCode,
      schemeName: fund.schemeName,
      fundHouse: fund.schemeName.split(' ')[0] || '',
      category: '',
      subCategory: '',
      assetClass: '',
      currentNav: 0,
      dayChange: 0,
      dayChangePercent: 0,
    }));
  },
};

// ============= FA Portal APIs =============
// Types for Client, Holding, Transaction, SIP are defined in @/utils/faTypes
// Import types from there when consuming these APIs

// Generic paginated response type for FA APIs
export interface FAPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============= Clients API =============

export interface ClientFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  riskProfile?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const clientsApi = {
  list: <T = unknown>(params?: ClientFilterParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.riskProfile) query.append('riskProfile', params.riskProfile);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    const queryString = query.toString();
    return request<FAPaginatedResponse<T>>(`/api/v1/clients${queryString ? `?${queryString}` : ''}`);
  },

  getById: <T = unknown>(id: string) =>
    request<T>(`/api/v1/clients/${id}`),

  create: <T = unknown>(data: Record<string, unknown>) =>
    request<T>('/api/v1/clients', { method: 'POST', body: data }),

  update: <T = unknown>(id: string, data: Record<string, unknown>) =>
    request<T>(`/api/v1/clients/${id}`, { method: 'PUT', body: data }),

  deactivate: (id: string) =>
    request<void>(`/api/v1/clients/${id}`, { method: 'DELETE' }),
};

// ============= Portfolio API =============

export interface CreateHoldingDto {
  fundName: string;
  fundSchemeCode: string;
  fundCategory: string;
  assetClass: string;
  folioNumber?: string;
  units: number;
  avgNav: number;
}

export const portfolioApi = {
  getClientHoldings: <T = unknown>(clientId: string) =>
    request<T[]>(`/api/v1/portfolio/clients/${clientId}/holdings`),

  getPortfolioSummary: <T = unknown>(clientId: string) =>
    request<T>(`/api/v1/portfolio/clients/${clientId}/summary`),

  addHolding: <T = unknown>(clientId: string, data: CreateHoldingDto) =>
    request<T>(`/api/v1/portfolio/clients/${clientId}/holdings`, { method: 'POST', body: data }),

  updateHolding: <T = unknown>(id: string, data: Partial<CreateHoldingDto>) =>
    request<T>(`/api/v1/portfolio/holdings/${id}`, { method: 'PUT', body: data }),

  deleteHolding: (id: string) =>
    request<void>(`/api/v1/portfolio/holdings/${id}`, { method: 'DELETE' }),

  syncNavs: () =>
    request<{ synced: number }>('/api/v1/portfolio/holdings/sync-nav', { method: 'POST' }),

  getAssetAllocation: (clientId: string) =>
    request<{ assetClass: string; value: number; percentage: number; color: string }[]>(
      `/api/v1/portfolio/clients/${clientId}/allocation`,
    ),

  getPortfolioHistory: (clientId: string, period: string = '1Y') =>
    request<{ date: string; value: number; invested: number; dayChange: number; dayChangePct: number }[]>(
      `/api/v1/portfolio/clients/${clientId}/history?period=${period}`,
    ),
};

// ============= Transactions API =============

export interface TransactionFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const transactionsApi = {
  list: <T = unknown>(params?: TransactionFilterParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.dateFrom) query.append('fromDate', params.dateFrom);
    if (params?.dateTo) query.append('toDate', params.dateTo);
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return request<FAPaginatedResponse<T>>(`/api/v1/transactions${queryString ? `?${queryString}` : ''}`);
  },

  getByClient: <T = unknown>(clientId: string) =>
    request<T[]>(`/api/v1/transactions/clients/${clientId}`),

  getById: <T = unknown>(id: string) =>
    request<T>(`/api/v1/transactions/${id}`),

  createLumpsum: <T = unknown>(data: Record<string, unknown>) =>
    request<T>('/api/v1/transactions/lumpsum', { method: 'POST', body: data }),

  createRedemption: <T = unknown>(data: Record<string, unknown>) =>
    request<T>('/api/v1/transactions/redemption', { method: 'POST', body: data }),

  updateStatus: <T = unknown>(id: string, status: string) =>
    request<T>(`/api/v1/transactions/${id}/status`, { method: 'PUT', body: { status } }),

  cancel: (id: string) =>
    request<void>(`/api/v1/transactions/${id}/cancel`, { method: 'POST' }),
};

// ============= SIPs API =============

export interface SipFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  search?: string;
}

export interface CreateSIPDto {
  clientId: string;
  fundName: string;
  fundSchemeCode: string;
  folioNumber?: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  sipDate: number;
  startDate: string;
  endDate?: string;
  isPerpetual?: boolean;
  stepUpPercent?: number;
  stepUpFrequency?: 'YEARLY' | 'HALF_YEARLY';
}

export interface UpdateSIPDto {
  amount?: number;
  sipDate?: number;
  endDate?: string;
  stepUpPercent?: number;
  stepUpFrequency?: 'YEARLY' | 'HALF_YEARLY';
}

export const sipsApi = {
  list: <T = unknown>(params?: SipFilterParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return request<FAPaginatedResponse<T>>(`/api/v1/sips${queryString ? `?${queryString}` : ''}`);
  },

  getByClient: <T = unknown>(clientId: string) =>
    request<T[]>(`/api/v1/sips/clients/${clientId}`),

  getById: <T = unknown>(id: string) =>
    request<T>(`/api/v1/sips/${id}`),

  create: <T = unknown>(data: CreateSIPDto) =>
    request<T>('/api/v1/sips', { method: 'POST', body: data }),

  update: <T = unknown>(id: string, data: UpdateSIPDto) =>
    request<T>(`/api/v1/sips/${id}`, { method: 'PUT', body: data }),

  pause: <T = unknown>(id: string) =>
    request<T>(`/api/v1/sips/${id}/pause`, { method: 'POST' }),

  resume: <T = unknown>(id: string) =>
    request<T>(`/api/v1/sips/${id}/resume`, { method: 'POST' }),

  cancel: (id: string) =>
    request<{ success: boolean }>(`/api/v1/sips/${id}/cancel`, { method: 'POST' }),
};

// ============= Goals API =============

export interface GoalFilterParams {
  clientId?: string;
}

export interface CreateGoalDto {
  name: string;
  category: string;
  icon?: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: string;
  monthlySip?: number;
  priority?: number;
  linkedFundCodes?: string[];
  notes?: string;
}

export interface UpdateGoalDto {
  name?: string;
  category?: string;
  icon?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  monthlySip?: number;
  status?: string;
  priority?: number;
  linkedFundCodes?: string[];
  notes?: string;
}

export interface AddContributionDto {
  amount: number;
  type: string;
  date: string;
  description?: string;
}

export interface GoalResponse {
  id: string;
  name: string;
  category: string;
  icon: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlySip: number | null;
  status: string;
  priority: number;
  linkedFundCodes: string[];
  notes: string | null;
  progress: number;
  daysRemaining: number;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  clientName?: string;
}

export interface ContributionResponse {
  id: string;
  amount: number;
  type: string;
  date: string;
  description: string | null;
  createdAt: string;
}

export const goalsApi = {
  // Advisor-wide goals (for dashboard)
  list: () =>
    request<GoalResponse[]>('/api/v1/goals'),

  // Client-specific goals
  getByClient: (clientId: string) =>
    request<GoalResponse[]>(`/api/v1/clients/${clientId}/goals`),

  getById: (clientId: string, goalId: string) =>
    request<GoalResponse>(`/api/v1/clients/${clientId}/goals/${goalId}`),

  create: (clientId: string, data: CreateGoalDto) =>
    request<GoalResponse>(`/api/v1/clients/${clientId}/goals`, { method: 'POST', body: data }),

  update: (clientId: string, goalId: string, data: UpdateGoalDto) =>
    request<GoalResponse>(`/api/v1/clients/${clientId}/goals/${goalId}`, { method: 'PUT', body: data }),

  delete: (clientId: string, goalId: string) =>
    request<{ message: string }>(`/api/v1/clients/${clientId}/goals/${goalId}`, { method: 'DELETE' }),

  addContribution: (clientId: string, goalId: string, data: AddContributionDto) =>
    request<GoalResponse>(`/api/v1/clients/${clientId}/goals/${goalId}/contributions`, { method: 'POST', body: data }),

  getContributions: (clientId: string, goalId: string) =>
    request<ContributionResponse[]>(`/api/v1/clients/${clientId}/goals/${goalId}/contributions`),
};

// ============= Insurance API =============

export const insuranceApi = {
  list: (clientId: string) =>
    request(`/api/v1/clients/${clientId}/insurance`),

  create: (clientId: string, data: any) =>
    request(`/api/v1/clients/${clientId}/insurance`, { method: 'POST', body: data }),

  update: (clientId: string, policyId: string, data: any) =>
    request(`/api/v1/clients/${clientId}/insurance/${policyId}`, { method: 'PUT', body: data }),

  delete: (clientId: string, policyId: string) =>
    request<{ message: string }>(`/api/v1/clients/${clientId}/insurance/${policyId}`, { method: 'DELETE' }),

  gapAnalysis: (clientId: string, params?: { annualIncome?: number; age?: number; familySize?: number }) => {
    const query = new URLSearchParams();
    if (params?.annualIncome) query.append('annualIncome', params.annualIncome.toString());
    if (params?.age) query.append('age', params.age.toString());
    if (params?.familySize) query.append('familySize', params.familySize.toString());
    const queryString = query.toString();
    return request(`/api/v1/clients/${clientId}/insurance/gap-analysis${queryString ? `?${queryString}` : ''}`);
  },

  recordPayment: (clientId: string, policyId: string, data: any) =>
    request(`/api/v1/clients/${clientId}/insurance/${policyId}/payments`, { method: 'POST', body: data }),

  getPaymentHistory: (clientId: string, policyId: string) =>
    request(`/api/v1/clients/${clientId}/insurance/${policyId}/payments`),
};

// ============= User Actions API =============

export type ActionType = 'SIP_DUE' | 'SIP_FAILED' | 'REBALANCE_RECOMMENDED' | 'GOAL_REVIEW' | 'TAX_HARVESTING' | 'KYC_EXPIRY' | 'DIVIDEND_RECEIVED' | 'NAV_ALERT' | 'CUSTOM';
export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserActionResponse {
  id: string;
  userId: string;
  type: ActionType;
  priority: ActionPriority;
  title: string;
  description?: string;
  actionUrl?: string;
  referenceId?: string;
  dueDate?: string;
  isRead: boolean;
  isDismissed: boolean;
  isCompleted: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface ActionFilterParams {
  type?: ActionType;
  priority?: ActionPriority;
  isCompleted?: boolean;
  isDismissed?: boolean;
  limit?: number;
}

export const actionsApi = {
  list: (params?: ActionFilterParams) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.isCompleted !== undefined) query.append('isCompleted', params.isCompleted.toString());
    if (params?.isDismissed !== undefined) query.append('isDismissed', params.isDismissed.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return request<UserActionResponse[]>(`/api/v1/actions${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) =>
    request<UserActionResponse>(`/api/v1/actions/${id}`),

  markAsRead: (id: string) =>
    request<UserActionResponse>(`/api/v1/actions/${id}/read`, { method: 'POST' }),

  markAsCompleted: (id: string) =>
    request<UserActionResponse>(`/api/v1/actions/${id}/complete`, { method: 'POST' }),

  dismiss: (id: string) =>
    request<UserActionResponse>(`/api/v1/actions/${id}/dismiss`, { method: 'POST' }),
};

// ============= Advisor Dashboard API =============

export interface KpiGrowth {
  momChange: number;
  momAbsolute: number;
  yoyChange: number;
  yoyAbsolute: number;
  prevMonthValue: number;
  prevYearValue: number;
  trend: { date: string; value: number }[];
}

export interface DashboardClient {
  id: string;
  name: string;
  email: string;
  aum: number;
  returns: number;
  riskProfile: string;
  status: string;
  sipCount: number;
  lastActive: string;
}

export interface DashboardTransaction {
  id: string;
  clientId: string;
  clientName: string;
  fundName: string;
  type: string;
  amount: number;
  status: string;
  date: string;
}

export interface DashboardSip {
  id: string;
  clientId: string;
  clientName: string;
  fundName: string;
  amount: number;
  nextDate: string;
  status: string;
}

export interface AdvisorDashboard {
  totalAum: number;
  totalClients: number;
  activeSips: number;
  pendingActions: number;
  avgReturns: number;
  monthlySipValue: number;
  recentClients: DashboardClient[];
  pendingTransactions: DashboardTransaction[];
  topPerformers: DashboardClient[];
  upcomingSips: DashboardSip[];
  failedSips: DashboardSip[];
  aumGrowth: KpiGrowth | null;
  clientsGrowth: KpiGrowth | null;
  sipsGrowth: KpiGrowth | null;
}

export const advisorDashboardApi = {
  get: () => request<AdvisorDashboard>('/api/v1/advisor/dashboard'),
};

// ============= Advisor Insights API =============

export interface PortfolioHealthItem {
  clientId: string;
  clientName: string;
  score: number;
  status: string;
  issues: string[];
  aum: number;
}

export interface RebalancingAlert {
  clientId: string;
  clientName: string;
  assetClass: string;
  currentAllocation: number;
  targetAllocation: number;
  deviation: number;
  action: string;
  amount: number;
}

export interface TaxHarvestingOpportunity {
  clientId: string;
  clientName: string;
  fundName: string;
  holdingId: string;
  investedValue: number;
  currentValue: number;
  unrealizedLoss: number;
  potentialSavings: number;
  holdingPeriod: string;
}

export interface GoalAlert {
  clientId: string;
  clientName: string;
  goalId: string;
  goalName: string;
  status: string;
  progress: number;
  targetAmount: number;
  currentAmount: number;
  daysRemaining: number;
}

export interface MarketInsight {
  id: string;
  title: string;
  summary: string;
  category: string;
  impact: string;
  date: string;
}

export interface AdvisorInsights {
  portfolioHealth: PortfolioHealthItem[];
  rebalancingAlerts: RebalancingAlert[];
  taxHarvesting: TaxHarvestingOpportunity[];
  goalAlerts: GoalAlert[];
  marketInsights: MarketInsight[];
}

export const advisorInsightsApi = {
  get: () => request<AdvisorInsights>('/api/v1/advisor/insights'),
  getDeepAnalysis: (clientId: string) =>
    request<DeepAnalysisResult>(`/api/v1/advisor/insights/deep/${clientId}`, { method: 'POST' }),
  getStrategicInsights: () =>
    request<StrategicInsights>('/api/v1/advisor/insights/strategic'),
};

// ============= Deep Analysis Types (Tier 2) =============

export interface PersonaAlignment {
  primaryPersona: string;
  riskBand: string;
  description?: string;
  confidence: number;
  blendedAllocation: Record<string, number>;
  distribution: { persona: string; weight: number }[];
}

export interface RiskAssessment {
  riskLevel: string;
  riskScore: number;
  riskFactors: {
    name: string;
    contribution: number;
    severity: string;
    description?: string;
  }[];
  recommendations: string[];
}

export interface RebalancingRoadmap {
  isAligned: boolean;
  alignmentScore: number;
  primaryIssues: string[];
  actions: {
    action: string;
    priority: string;
    schemeName: string;
    assetClass: string;
    currentValue?: number;
    targetValue: number;
    transactionAmount: number;
    taxStatus?: string;
    reason: string;
  }[];
  totalSellAmount: number;
  totalBuyAmount: number;
  taxImpactSummary: string;
}

export interface DeepAnalysisSection<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}

export interface DeepAnalysisResult {
  clientId: string;
  clientName: string;
  persona: DeepAnalysisSection<PersonaAlignment>;
  risk: DeepAnalysisSection<RiskAssessment>;
  rebalancing: DeepAnalysisSection<RebalancingRoadmap>;
}

// ============= Strategic Insights Types (Tier 3) =============

export interface FundOverlapItem {
  fundName: string;
  clientCount: number;
  totalValue: number;
  clients: string[];
}

export interface ConcentrationAlert {
  clientId: string;
  clientName: string;
  type: 'fund' | 'category';
  name: string;
  percentage: number;
  value: number;
}

export interface AumBucket {
  range: string;
  count: number;
  totalAum: number;
}

export interface RiskDistributionItem {
  profile: string;
  count: number;
  percentage: number;
}

export interface StrategicInsights {
  fundOverlap: FundOverlapItem[];
  concentrationAlerts: ConcentrationAlert[];
  aumDistribution: AumBucket[];
  riskDistribution: RiskDistributionItem[];
}

// ============= Notification Preferences API =============

export type NotificationPreferences = Record<string, Record<string, boolean>>;

export interface NotificationPreferenceUpdate {
  category: string;
  channel: string;
  enabled: boolean;
}

export const notificationPreferencesApi = {
  get: () => request<NotificationPreferences>('/notifications/preferences'),
  update: (updates: NotificationPreferenceUpdate[]) =>
    request<NotificationPreferences>('/notifications/preferences', {
      method: 'PUT',
      body: { updates },
    }),
};

// ============= Saved Analysis API =============

import type { SavedAnalysisSummary, AnalysisVersionDetail } from '@/utils/faTypes';

export const savedAnalysisApi = {
  save: (data: {
    title: string;
    clientId: string;
    personaData: any;
    riskData: any;
    rebalancingData: any;
    editNotes?: string;
  }) =>
    request<SavedAnalysisSummary>('/api/v1/advisor/analyses', {
      method: 'POST',
      body: data,
    }),

  list: (clientId?: string) =>
    request<SavedAnalysisSummary[]>(
      `/api/v1/advisor/analyses${clientId ? `?clientId=${clientId}` : ''}`,
    ),

  get: (id: string) =>
    request<SavedAnalysisSummary>(`/api/v1/advisor/analyses/${id}`),

  getVersion: (id: string, v: number) =>
    request<AnalysisVersionDetail>(`/api/v1/advisor/analyses/${id}/versions/${v}`),

  createVersion: (id: string, data: { rebalancingData: any; editNotes?: string }) =>
    request<AnalysisVersionDetail>(`/api/v1/advisor/analyses/${id}/versions`, {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: { title?: string; status?: string }) =>
    request<SavedAnalysisSummary>(`/api/v1/advisor/analyses/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  delete: (id: string) =>
    request<{ deleted: boolean }>(`/api/v1/advisor/analyses/${id}`, {
      method: 'DELETE',
    }),

  downloadPdf: async (id: string, v: number) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/advisor/analyses/${id}/versions/${v}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('PDF download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-v${v}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// ============= Auth Profile API =============

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  clientType?: string;
}

// ============= Staff API =============

export interface StaffMember {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  allowedPages: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStaffRequest {
  displayName: string;
  email: string;
  password: string;
  phone?: string;
  allowedPages: string[];
}

export interface UpdateStaffRequest {
  displayName?: string;
  allowedPages?: string[];
  isActive?: boolean;
}

export const staffApi = {
  list: () => request<StaffMember[]>('/api/v1/staff'),

  getById: (id: string) => request<StaffMember>(`/api/v1/staff/${id}`),

  create: (data: CreateStaffRequest) =>
    request<StaffMember>('/api/v1/staff', { method: 'POST', body: data }),

  update: (id: string, data: UpdateStaffRequest) =>
    request<StaffMember>(`/api/v1/staff/${id}`, { method: 'PUT', body: data }),

  deactivate: (id: string) =>
    request<StaffMember>(`/api/v1/staff/${id}`, { method: 'DELETE' }),
};

// ============= Communications API =============

export interface CommunicationTemplate {
  type: string;
  label: string;
  description: string;
}

export interface CommunicationPreview {
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
}

export interface CommunicationLog {
  id: string;
  advisorId: string;
  clientId: string;
  channel: string;
  type: string;
  subject: string | null;
  body: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface CommunicationStats {
  totalSent: number;
  emailCount: number;
  whatsappCount: number;
  thisMonthCount: number;
}

export const communicationsApi = {
  getTemplates: () =>
    request<CommunicationTemplate[]>('/api/v1/communications/templates'),

  preview: (data: { clientId: string; type: string; contextData?: Record<string, any>; customSubject?: string; customBody?: string }) =>
    request<CommunicationPreview>('/api/v1/communications/preview', { method: 'POST', body: data }),

  send: (data: { clientId: string; channel: string; type: string; subject: string; body: string; metadata?: Record<string, any> }) =>
    request<{ success: boolean; logId: string; waLink?: string; error?: string }>('/api/v1/communications/send', { method: 'POST', body: data }),

  getHistory: (params?: { clientId?: string; channel?: string; type?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.channel) query.append('channel', params.channel);
    if (params?.type) query.append('type', params.type);
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return request<FAPaginatedResponse<CommunicationLog>>(`/api/v1/communications/history${queryString ? `?${queryString}` : ''}`);
  },

  getStats: () =>
    request<CommunicationStats>('/api/v1/communications/history/stats'),

  sendBulk: (data: { clientIds: string[]; channel: string; type: string; subject: string; customBody?: string; metadata?: Record<string, any> }) =>
    request<{ total: number; sent: number; failed: number; results: { clientId: string; clientName: string; success: boolean; error?: string; logId?: string; waLink?: string }[] }>('/api/v1/communications/send-bulk', { method: 'POST', body: data }),
};

// ============= Auth Profile API =============

export const authProfileApi = {
  get: () => request<AuthProfile>('/api/v1/auth/me'),
  update: (data: { name?: string; phone?: string }) =>
    request<AuthProfile>('/api/v1/auth/me', {
      method: 'PUT',
      body: data,
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/v1/auth/me/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
};
