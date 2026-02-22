/**
 * Dashboard & Insights API — Actions, Dashboard KPIs, Advisor Insights
 */
import { request } from '../api'

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

export interface ActionCalendarItem {
  date: string; type: string; label: string; description: string
  clientId: string; clientName: string; priority: string; daysFromNow: number
}

export interface ActionCalendar {
  items: ActionCalendarItem[]
  summary: { total: number; sipExpiring: number; birthdays: number; followUps: number }
}

export const advisorDashboardApi = {
  get: () => request<AdvisorDashboard>('/api/v1/advisor/dashboard'),
  getActionCalendar: (days = 30) =>
    request<ActionCalendar>(`/api/v1/advisor/action-calendar?days=${days}`),
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
  getCrossSellOpportunities: () =>
    request<CrossSellOpportunity[]>('/api/v1/advisor/insights/cross-sell'),
  getChurnRisk: () =>
    request<ChurnRiskClient[]>('/api/v1/advisor/insights/churn-risk'),
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
    schemeCode: string;
    assetClass: string;
    currentValue?: number;
    targetValue: number;
    transactionAmount: number;
    taxStatus?: string;
    reason: string;
    folioNumber?: string;
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

// ============= Insights Extended Types =============

export interface CrossSellGap {
  type: string; label: string; description: string; priority: string
}

export interface CrossSellOpportunity {
  clientId: string; clientName: string; aum: number
  riskProfile: string; gaps: CrossSellGap[]; gapCount: number
}

export interface ChurnRiskFactor {
  factor: string; weight: number; detail: string
}

export interface ChurnRiskClient {
  clientId: string; clientName: string; aum: number
  riskScore: number; riskLevel: string
  factors: ChurnRiskFactor[]
  daysSinceLastTxn: number | null
  recentRedemptionTotal: number; sipTrend: string
}
