// Response DTOs matching Android FADashboard / FAInsights models

export class GrowthDataPointDto {
  date: string
  value: number
}

export class KpiGrowthDto {
  momChange: number       // month-over-month % change
  momAbsolute: number     // absolute change from prev month
  yoyChange: number       // year-over-year % change
  yoyAbsolute: number     // absolute change from prev year
  prevMonthValue: number
  prevYearValue: number
  trend: GrowthDataPointDto[]
}

export class DashboardClientDto {
  id: string
  name: string
  email: string
  aum: number
  returns: number
  riskProfile: string
  status: string
  sipCount: number
  lastActive: string
}

export class DashboardTransactionDto {
  id: string
  clientId: string
  clientName: string
  fundName: string
  type: string
  amount: number
  status: string
  date: string
}

export class DashboardSipDto {
  id: string
  clientId: string
  clientName: string
  fundName: string
  amount: number
  nextDate: string
  status: string
}

export class PaginationMeta {
  page: number
  limit: number
  total: number
}

export class PaginatedTransactions {
  data: DashboardTransactionDto[]
  pagination: PaginationMeta
}

export class PaginatedSips {
  data: DashboardSipDto[]
  pagination: PaginationMeta
}

export class AdvisorDashboardDto {
  totalAum: number
  totalClients: number
  activeSips: number
  pendingActions: number
  avgReturns: number
  monthlySipValue: number
  recentClients: DashboardClientDto[]
  pendingTransactions: PaginatedTransactions
  topPerformers: DashboardClientDto[]
  upcomingSips: PaginatedSips
  failedSips: PaginatedSips
  aumGrowth: KpiGrowthDto | null
  clientsGrowth: KpiGrowthDto | null
  sipsGrowth: KpiGrowthDto | null
}

// --- Insights DTOs ---

export class PortfolioHealthItemDto {
  clientId: string
  clientName: string
  score: number         // 0-100
  status: string        // 'healthy' | 'needs_attention' | 'critical'
  issues: string[]
  aum: number
}

export class RebalancingAlertDto {
  clientId: string
  clientName: string
  assetClass: string
  currentAllocation: number
  targetAllocation: number
  deviation: number
  action: string        // 'increase' | 'decrease'
  amount: number
}

export class TaxHarvestingOpportunityDto {
  clientId: string
  clientName: string
  fundName: string
  holdingId: string
  investedValue: number
  currentValue: number
  unrealizedLoss: number
  potentialSavings: number
  holdingPeriod: string   // 'short_term' | 'long_term'
}

export class GoalAlertDto {
  clientId: string
  clientName: string
  goalId: string
  goalName: string
  status: string          // 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'
  progress: number
  targetAmount: number
  currentAmount: number
  daysRemaining: number
}

export class MarketInsightDto {
  id: string
  title: string
  summary: string
  category: string
  impact: string          // 'positive' | 'negative' | 'neutral'
  date: string
}

export class AdvisorInsightsDto {
  portfolioHealth: PortfolioHealthItemDto[]
  rebalancingAlerts: RebalancingAlertDto[]
  taxHarvesting: TaxHarvestingOpportunityDto[]
  goalAlerts: GoalAlertDto[]
  marketInsights: MarketInsightDto[]
}
