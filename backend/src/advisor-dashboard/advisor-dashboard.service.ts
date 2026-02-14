import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MlGatewayService } from '../ml-gateway/ml-gateway.service'
import {
  AdvisorDashboardDto,
  AdvisorInsightsDto,
  KpiGrowthDto,
  PortfolioHealthItemDto,
  RebalancingAlertDto,
  TaxHarvestingOpportunityDto,
  GoalAlertDto,
  MarketInsightDto,
} from './dto/dashboard.dto'
import { DeepAnalysisResponseDto } from './dto/deep-analysis.dto'
import { StrategicInsightsResponseDto } from './dto/strategic-insights.dto'

// Target allocations by risk profile (used for rebalancing alerts)
const TARGET_ALLOCATIONS: Record<string, Record<string, number>> = {
  Conservative: { Equity: 30, Debt: 50, Hybrid: 10, Gold: 5, Liquid: 5 },
  Moderate: { Equity: 50, Debt: 30, Hybrid: 10, Gold: 5, Liquid: 5 },
  Aggressive: { Equity: 70, Debt: 15, Hybrid: 10, Gold: 5, Liquid: 0 },
}

const RISK_PROFILE_MAP: Record<string, string> = {
  CONSERVATIVE: 'Conservative',
  MODERATE: 'Moderate',
  AGGRESSIVE: 'Aggressive',
}

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING_KYC: 'Pending KYC',
}

const TYPE_MAP: Record<string, string> = {
  BUY: 'Buy',
  SELL: 'Sell',
  SIP: 'SIP',
  SWP: 'SWP',
  SWITCH: 'Switch',
  STP: 'STP',
}

const TXN_STATUS_MAP: Record<string, string> = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

@Injectable()
export class AdvisorDashboardService {
  private readonly logger = new Logger(AdvisorDashboardService.name)

  constructor(
    private prisma: PrismaService,
    private mlGateway: MlGatewayService,
  ) {}

  async getDashboard(advisorId: string): Promise<AdvisorDashboardDto> {
    // Run all queries in parallel for performance
    const [
      clients,
      activeSipsCount,
      monthlySipValue,
      pendingActionsCount,
      pendingTransactions,
      upcomingSips,
      failedSips,
    ] = await Promise.all([
      // All clients with holdings and active SIPs
      this.prisma.fAClient.findMany({
        where: { advisorId },
        include: {
          holdings: true,
          sips: { where: { status: 'ACTIVE' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Active SIP count
      this.prisma.fASIP.count({
        where: { client: { advisorId }, status: 'ACTIVE' },
      }),
      // Total monthly SIP value
      this.prisma.fASIP.aggregate({
        where: { client: { advisorId }, status: 'ACTIVE', frequency: 'MONTHLY' },
        _sum: { amount: true },
      }),
      // Pending actions count
      this.prisma.userAction.count({
        where: {
          userId: advisorId,
          isCompleted: false,
          isDismissed: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      // Pending transactions
      this.prisma.fATransaction.findMany({
        where: {
          client: { advisorId },
          status: 'PENDING',
        },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      // Upcoming SIPs (next 30 days) — use date-only for @db.Date field
      (() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const future = new Date(today)
        future.setDate(future.getDate() + 30)
        return this.prisma.fASIP.findMany({
          where: {
            client: { advisorId },
            status: 'ACTIVE',
            nextSipDate: { gte: today, lte: future },
          },
          include: { client: { select: { id: true, name: true } } },
          orderBy: { nextSipDate: 'asc' },
          take: 10,
        })
      })(),
      // Failed SIPs
      this.prisma.fASIP.findMany({
        where: {
          client: { advisorId },
          status: 'FAILED',
        },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ])

    // Compute client-level KPIs
    const clientData = clients.map((c) => {
      const holdings = c.holdings || []
      const sips = c.sips || []
      const aum = holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0)
      const invested = holdings.reduce((sum, h) => sum + Number(h.investedValue || 0), 0)
      const returns = invested > 0 ? ((aum - invested) / invested) * 100 : 0

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        aum,
        invested,
        returns: Math.round(returns * 100) / 100,
        riskProfile: RISK_PROFILE_MAP[c.riskProfile] || 'Moderate',
        status: STATUS_MAP[c.status] || 'Active',
        sipCount: sips.length,
        lastActive: this.formatLastActive(c.lastActiveAt),
        createdAt: c.createdAt,
      }
    })

    const totalAum = clientData.reduce((sum, c) => sum + c.aum, 0)
    const totalInvested = clientData.reduce((sum, c) => sum + c.invested, 0)
    const avgReturns = totalInvested > 0
      ? Math.round(((totalAum - totalInvested) / totalInvested) * 10000) / 100
      : 0

    // Top performers by returns
    const topPerformers = [...clientData]
      .filter((c) => c.aum > 0)
      .sort((a, b) => b.returns - a.returns)
      .slice(0, 5)
      .map(({ invested, createdAt, ...rest }) => rest)

    // Recent clients (last 5 by join date)
    const recentClients = [...clientData]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(({ invested, createdAt, ...rest }) => ({
        ...rest,
        joinedDate: createdAt ? createdAt.toISOString().split('T')[0] : null,
      }))

    // Compute growth metrics
    const aumGrowth = await this.computeAumGrowth(advisorId, totalAum)
    const clientsGrowth = await this.computeClientsGrowth(advisorId, clients.length)
    const sipsGrowth = await this.computeSipsGrowth(advisorId, activeSipsCount)

    return {
      totalAum: Math.round(totalAum * 100) / 100,
      totalClients: clients.length,
      activeSips: activeSipsCount,
      pendingActions: pendingActionsCount,
      avgReturns,
      monthlySipValue: Number(monthlySipValue._sum.amount || 0),
      recentClients,
      pendingTransactions: pendingTransactions.map((t) => ({
        id: t.id,
        clientId: t.clientId,
        clientName: t.client?.name || '',
        fundName: t.fundName,
        type: TYPE_MAP[t.type] || t.type,
        amount: Number(t.amount),
        status: TXN_STATUS_MAP[t.status] || t.status,
        date: t.date.toISOString().split('T')[0],
      })),
      topPerformers,
      upcomingSips: upcomingSips.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        clientName: s.client?.name || '',
        schemeCode: Number(s.fundSchemeCode || 0),
        fundName: s.fundName,
        amount: Number(s.amount),
        frequency: s.frequency,
        sipDate: s.sipDate,
        nextDate: s.nextSipDate.toISOString().split('T')[0],
        status: s.status,
        totalInvested: Number(s.totalInvested || 0),
        totalUnits: 0,
        installmentsPaid: s.completedInstallments || 0,
        startDate: s.startDate?.toISOString().split('T')[0] || null,
      })),
      failedSips: failedSips.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        clientName: s.client?.name || '',
        schemeCode: Number(s.fundSchemeCode || 0),
        fundName: s.fundName,
        amount: Number(s.amount),
        frequency: s.frequency,
        sipDate: s.sipDate,
        nextDate: s.nextSipDate.toISOString().split('T')[0],
        status: s.status,
        totalInvested: Number(s.totalInvested || 0),
        totalUnits: 0,
        installmentsPaid: s.completedInstallments || 0,
        startDate: s.startDate?.toISOString().split('T')[0] || null,
      })),
      aumGrowth,
      clientsGrowth,
      sipsGrowth,
    }
  }

  async getInsights(advisorId: string): Promise<AdvisorInsightsDto> {
    const [
      portfolioHealth,
      rebalancingAlerts,
      taxHarvesting,
      goalAlerts,
    ] = await Promise.all([
      this.computePortfolioHealth(advisorId),
      this.computeRebalancingAlerts(advisorId),
      this.computeTaxHarvesting(advisorId),
      this.computeGoalAlerts(advisorId),
    ])

    const marketInsights = this.getMarketInsights()

    return {
      portfolioHealth,
      rebalancingAlerts,
      taxHarvesting,
      goalAlerts,
      marketInsights,
    }
  }

  // ============================================================
  // Private: Growth computations
  // ============================================================

  private async computeAumGrowth(advisorId: string, currentAum: number): Promise<KpiGrowthDto | null> {
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    // Get historical AUM from portfolio history snapshots
    const [prevMonthSnap, prevYearSnap] = await Promise.all([
      this.prisma.userPortfolioHistory.findFirst({
        where: {
          client: { advisorId },
          date: { lte: oneMonthAgo },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.userPortfolioHistory.findFirst({
        where: {
          client: { advisorId },
          date: { lte: oneYearAgo },
        },
        orderBy: { date: 'desc' },
      }),
    ])

    // Use actual historical data; if unavailable, assume no change (don't fake growth)
    const prevMonthValue = prevMonthSnap ? Number(prevMonthSnap.totalValue) : currentAum
    const prevYearValue = prevYearSnap ? Number(prevYearSnap.totalValue) : currentAum

    const momAbsolute = currentAum - prevMonthValue
    const momChange = prevMonthValue > 0 ? (momAbsolute / prevMonthValue) * 100 : 0
    const yoyAbsolute = currentAum - prevYearValue
    const yoyChange = prevYearValue > 0 ? (yoyAbsolute / prevYearValue) * 100 : 0

    // Build trend (last 6 months)
    const trend = await this.buildAumTrend(advisorId, 6)

    return {
      momChange: Math.round(momChange * 100) / 100,
      momAbsolute: Math.round(momAbsolute * 100) / 100,
      yoyChange: Math.round(yoyChange * 100) / 100,
      yoyAbsolute: Math.round(yoyAbsolute * 100) / 100,
      prevMonthValue: Math.round(prevMonthValue * 100) / 100,
      prevYearValue: Math.round(prevYearValue * 100) / 100,
      trend,
    }
  }

  private async buildAumTrend(advisorId: string, months: number) {
    const trend: { date: string; value: number }[] = []
    const now = new Date()

    for (let i = months; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)

      const snap = await this.prisma.userPortfolioHistory.findFirst({
        where: {
          client: { advisorId },
          date: { lte: date },
        },
        orderBy: { date: 'desc' },
      })

      if (snap) {
        trend.push({
          date: date.toISOString().split('T')[0],
          value: Number(snap.totalValue),
        })
      }
    }

    // If no history exists, return current AUM as single point
    if (trend.length === 0) {
      const currentAum = await this.prisma.fAHolding.aggregate({
        where: { client: { advisorId } },
        _sum: { currentValue: true },
      })
      trend.push({
        date: now.toISOString().split('T')[0],
        value: Number(currentAum._sum.currentValue || 0),
      })
    }

    return trend
  }

  private async computeClientsGrowth(advisorId: string, currentCount: number): Promise<KpiGrowthDto | null> {
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    const [prevMonthCount, prevYearCount] = await Promise.all([
      this.prisma.fAClient.count({
        where: { advisorId, createdAt: { lte: oneMonthAgo } },
      }),
      this.prisma.fAClient.count({
        where: { advisorId, createdAt: { lte: oneYearAgo } },
      }),
    ])

    const momAbsolute = currentCount - prevMonthCount
    const momChange = prevMonthCount > 0 ? (momAbsolute / prevMonthCount) * 100 : 0
    const yoyAbsolute = currentCount - prevYearCount
    const yoyChange = prevYearCount > 0 ? (yoyAbsolute / prevYearCount) * 100 : 0

    return {
      momChange: Math.round(momChange * 100) / 100,
      momAbsolute,
      yoyChange: Math.round(yoyChange * 100) / 100,
      yoyAbsolute,
      prevMonthValue: prevMonthCount,
      prevYearValue: prevYearCount,
      trend: [],
    }
  }

  private async computeSipsGrowth(advisorId: string, currentCount: number): Promise<KpiGrowthDto | null> {
    const now = new Date()
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    const [prevMonthCount, prevYearCount] = await Promise.all([
      this.prisma.fASIP.count({
        where: { client: { advisorId }, status: 'ACTIVE', createdAt: { lte: oneMonthAgo } },
      }),
      this.prisma.fASIP.count({
        where: { client: { advisorId }, status: 'ACTIVE', createdAt: { lte: oneYearAgo } },
      }),
    ])

    const momAbsolute = currentCount - prevMonthCount
    const momChange = prevMonthCount > 0 ? (momAbsolute / prevMonthCount) * 100 : 0
    const yoyAbsolute = currentCount - prevYearCount
    const yoyChange = prevYearCount > 0 ? (yoyAbsolute / prevYearCount) * 100 : 0

    return {
      momChange: Math.round(momChange * 100) / 100,
      momAbsolute,
      yoyChange: Math.round(yoyChange * 100) / 100,
      yoyAbsolute,
      prevMonthValue: prevMonthCount,
      prevYearValue: prevYearCount,
      trend: [],
    }
  }

  // ============================================================
  // Private: Insights computations
  // ============================================================

  private async computePortfolioHealth(advisorId: string): Promise<PortfolioHealthItemDto[]> {
    const clients = await this.prisma.fAClient.findMany({
      where: { advisorId, status: 'ACTIVE' },
      include: {
        holdings: true,
        sips: { where: { status: 'ACTIVE' } },
      },
    })

    return clients.map((client) => {
      const holdings = client.holdings || []
      const sips = client.sips || []
      const aum = holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0)
      const invested = holdings.reduce((sum, h) => sum + Number(h.investedValue || 0), 0)
      const returns = invested > 0 ? ((aum - invested) / invested) * 100 : 0

      const issues: string[] = []
      let score = 100

      // Diversification check
      const assetClasses = new Set(holdings.map((h) => h.assetClass))
      if (assetClasses.size <= 1 && holdings.length > 0) {
        issues.push('Low diversification — concentrated in single asset class')
        score -= 20
      }

      // No active SIPs
      if (sips.length === 0 && aum > 0) {
        issues.push('No active SIPs — no systematic investments')
        score -= 15
      }

      // Negative returns
      if (returns < 0) {
        issues.push(`Negative returns (${returns.toFixed(1)}%)`)
        score -= 25
      } else if (returns < 5) {
        issues.push(`Below benchmark returns (${returns.toFixed(1)}%)`)
        score -= 10
      }

      // Very small portfolio
      if (aum > 0 && aum < 50000) {
        issues.push('Portfolio value below ₹50,000')
        score -= 10
      }

      // High concentration in single fund
      if (holdings.length > 0) {
        const maxHolding = Math.max(...holdings.map((h) => Number(h.currentValue || 0)))
        if (aum > 0 && maxHolding / aum > 0.5) {
          issues.push('Over 50% concentrated in a single fund')
          score -= 15
        }
      }

      score = Math.max(0, Math.min(100, score))
      const status = score >= 70 ? 'healthy' : score >= 40 ? 'needs_attention' : 'critical'

      return {
        clientId: client.id,
        clientName: client.name,
        score,
        status,
        issues,
        aum: Math.round(aum * 100) / 100,
      }
    })
  }

  private async computeRebalancingAlerts(advisorId: string): Promise<RebalancingAlertDto[]> {
    const clients = await this.prisma.fAClient.findMany({
      where: { advisorId, status: 'ACTIVE' },
      include: { holdings: true },
    })

    const alerts: RebalancingAlertDto[] = []

    for (const client of clients) {
      const holdings = client.holdings || []
      const totalValue = holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0)
      if (totalValue === 0) continue

      const riskProfile = RISK_PROFILE_MAP[client.riskProfile] || 'Moderate'
      const targets = TARGET_ALLOCATIONS[riskProfile] || TARGET_ALLOCATIONS.Moderate

      // Compute current allocation
      const currentAlloc: Record<string, number> = {}
      holdings.forEach((h) => {
        currentAlloc[h.assetClass] = (currentAlloc[h.assetClass] || 0) + Number(h.currentValue || 0)
      })

      // Check each target asset class for deviation > 5%
      for (const [assetClass, targetPct] of Object.entries(targets)) {
        const currentValue = currentAlloc[assetClass] || 0
        const currentPct = (currentValue / totalValue) * 100
        const deviation = currentPct - targetPct

        if (Math.abs(deviation) > 5) {
          alerts.push({
            clientId: client.id,
            clientName: client.name,
            assetClass,
            currentAllocation: Math.round(currentPct * 100) / 100,
            targetAllocation: targetPct,
            deviation: Math.round(deviation * 100) / 100,
            action: deviation > 0 ? 'decrease' : 'increase',
            amount: Math.abs(Math.round((deviation / 100) * totalValue * 100) / 100),
          })
        }
      }
    }

    return alerts.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
  }

  private async computeTaxHarvesting(advisorId: string): Promise<TaxHarvestingOpportunityDto[]> {
    const holdings = await this.prisma.fAHolding.findMany({
      where: {
        client: { advisorId },
        absoluteGain: { lt: 0 },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { absoluteGain: 'asc' },
      take: 20,
    })

    return holdings.map((h) => {
      const invested = Number(h.investedValue || 0)
      const current = Number(h.currentValue || 0)
      const unrealizedLoss = Math.abs(Number(h.absoluteGain || 0))

      // Determine holding period
      const daysSincePurchase = h.lastTxnDate
        ? Math.floor((Date.now() - h.lastTxnDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      const holdingPeriod = daysSincePurchase > 365 ? 'long_term' : 'short_term'

      // Potential tax savings (approximate: 15% STCG, 10% LTCG for equity)
      const taxRate = holdingPeriod === 'short_term' ? 0.15 : 0.10
      const potentialSavings = Math.round(unrealizedLoss * taxRate * 100) / 100

      return {
        clientId: h.client.id,
        clientName: h.client.name,
        fundName: h.fundName,
        holdingId: h.id,
        investedValue: invested,
        currentValue: current,
        unrealizedLoss: Math.round(unrealizedLoss * 100) / 100,
        potentialSavings,
        holdingPeriod,
      }
    })
  }

  private async computeGoalAlerts(advisorId: string): Promise<GoalAlertDto[]> {
    const goals = await this.prisma.userGoal.findMany({
      where: {
        client: { advisorId },
        status: 'ACTIVE',
      },
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { targetDate: 'asc' },
    })

    return goals.map((goal) => {
      const targetAmount = Number(goal.targetAmount)
      const currentAmount = Number(goal.currentAmount)
      const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

      const now = new Date()
      const targetDate = new Date(goal.targetDate)
      const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
      const elapsedDays = Math.ceil((now.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0
      const progressRatio = expectedProgress > 0 ? progress / expectedProgress : 1

      let status: string
      if (progressRatio >= 0.9) {
        status = 'ON_TRACK'
      } else if (progressRatio >= 0.6) {
        status = 'AT_RISK'
      } else {
        status = 'OFF_TRACK'
      }

      return {
        clientId: goal.client?.id || '',
        clientName: goal.client?.name || '',
        goalId: goal.id,
        goalName: goal.name,
        status,
        progress: Math.round(progress * 100) / 100,
        targetAmount,
        currentAmount,
        daysRemaining,
      }
    })
  }

  private getMarketInsights(): MarketInsightDto[] {
    // TODO: Replace with real market data feed (e.g., NSE/BSE API, news aggregator)
    // These are static placeholders shown until a live feed is integrated.
    return [
      {
        id: 'mi-1',
        title: 'RBI Monetary Policy Update',
        summary: 'Monitor RBI policy decisions for their impact on debt fund yields and overall market liquidity conditions.',
        category: 'Monetary Policy',
        impact: 'neutral',
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: 'mi-2',
        title: 'Equity Market Outlook',
        summary: 'Indian equity markets remain supported by domestic flows and earnings growth. Review portfolio allocation to stay aligned with client goals.',
        category: 'Markets',
        impact: 'positive',
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: 'mi-3',
        title: 'SEBI Regulatory Updates',
        summary: 'SEBI continues to enhance mutual fund regulations around stress testing and risk disclosure. Ensure client portfolios comply with new norms.',
        category: 'Regulation',
        impact: 'neutral',
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: 'mi-4',
        title: 'Gold as Portfolio Diversifier',
        summary: 'Gold ETFs continue to attract inflows amid global uncertainty. Consider gold allocation for conservative and moderate risk profiles.',
        category: 'Commodities',
        impact: 'positive',
        date: new Date().toISOString().split('T')[0],
      },
    ]
  }

  // ============================================================
  // Tier 2: Deep Analysis (per-client, ML-powered)
  // ============================================================

  async getDeepAnalysis(advisorId: string, clientId: string): Promise<DeepAnalysisResponseDto> {
    // Verify client belongs to this advisor and fetch data
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId },
      include: {
        holdings: true,
        sips: { where: { status: 'ACTIVE' } },
        goals: { where: { status: 'ACTIVE' } },
      },
    })

    if (!client) {
      throw new Error('Client not found or not assigned to this advisor')
    }

    const holdings = client.holdings || []
    const sips = client.sips || []
    const goals = client.goals || []
    const riskProfile = RISK_PROFILE_MAP[client.riskProfile] || 'Moderate'
    const targets = TARGET_ALLOCATIONS[riskProfile] || TARGET_ALLOCATIONS.Moderate

    // Build ML request data
    const totalSipAmount = sips.reduce((sum, s) => sum + Number(s.amount || 0), 0)
    const totalAum = holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0)
    const primaryGoal = goals[0]

    const horizonYears = primaryGoal
      ? Math.max(1, Math.ceil((new Date(primaryGoal.targetDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000)))
      : 10

    // Calculate age from DOB (fallback to risk-profile-based estimate)
    let clientAge = 35
    if (client.dateOfBirth) {
      const today = new Date()
      const dob = new Date(client.dateOfBirth)
      clientAge = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        clientAge--
      }
    }

    // Derive liquidity & knowledge from risk profile and age
    const liquidityMap: Record<string, string> = { Conservative: 'High', Moderate: 'Medium', Aggressive: 'Low' }
    const knowledgeMap: Record<string, string> = { Conservative: 'Beginner', Moderate: 'Intermediate', Aggressive: 'Advanced' }

    const profileForClassify = {
      age: clientAge,
      goal: primaryGoal?.name || 'Wealth Creation',
      target_amount: primaryGoal ? Number(primaryGoal.targetAmount) : totalAum * 2,
      target_year: primaryGoal ? new Date(primaryGoal.targetDate).getFullYear() : new Date().getFullYear() + 10,
      monthly_sip: totalSipAmount,
      lump_sum: totalAum,
      liquidity: liquidityMap[riskProfile] || 'Medium',
      risk_tolerance: riskProfile,
      knowledge: knowledgeMap[riskProfile] || 'Intermediate',
      volatility: riskProfile === 'Aggressive' ? 'High' : riskProfile === 'Conservative' ? 'Low' : 'Medium',
      horizon_years: horizonYears,
    } as any

    const holdingsForAnalysis = holdings
      .filter(h => h.fundSchemeCode)
      .map(h => ({
        scheme_code: Number(h.fundSchemeCode) || 0,
        scheme_name: h.fundName,
        amount: Number(h.currentValue || 0),
        units: Number(h.units || 0),
        purchase_date: h.lastTxnDate?.toISOString().split('T')[0],
        purchase_amount: Number(h.investedValue || 0),
      }))

    const profileForRisk: Record<string, string> = {
      risk_tolerance: riskProfile,
      investment_horizon: `${profileForClassify.horizon_years} years`,
      goal: profileForClassify.goal,
    }

    // Enrich holdings with real category data from fund DB
    const schemeCodes = holdingsForAnalysis.map(h => h.scheme_code).filter(Boolean)
    const fundCategoryMap = new Map<number, string>()
    if (schemeCodes.length > 0) {
      const plans = await this.prisma.schemePlan.findMany({
        where: { mfapiSchemeCode: { in: schemeCodes } },
        select: { mfapiSchemeCode: true, scheme: { select: { category: { select: { name: true } } } } },
      })
      for (const p of plans) {
        if (p.mfapiSchemeCode) {
          fundCategoryMap.set(p.mfapiSchemeCode, p.scheme.category.name)
        }
      }
    }

    const fundInputs = holdingsForAnalysis.map(h => ({
      scheme_code: h.scheme_code,
      scheme_name: h.scheme_name,
      category: fundCategoryMap.get(h.scheme_code) || '',
      weight: totalAum > 0 ? h.amount / totalAum : 0,
    }))

    // Run all 3 ML calls in parallel with independent error handling
    const [personaResult, riskResult, rebalancingResult] = await Promise.allSettled([
      this.mlGateway.classifyProfileBlended({
        request_id: `deep-${clientId}-persona`,
        profile: profileForClassify,
      } as any),
      this.mlGateway.assessRisk({
        request_id: `deep-${clientId}-risk`,
        profile: profileForRisk,
        current_portfolio: fundInputs,
      } as any),
      holdingsForAnalysis.length > 0
        ? this.mlGateway.analyzePortfolio({
            request_id: `deep-${clientId}-rebalance`,
            holdings: holdingsForAnalysis,
            target_allocation: {
              equity: (targets.Equity || 0) / 100,
              debt: (targets.Debt || 0) / 100,
              hybrid: (targets.Hybrid || 0) / 100,
              gold: (targets.Gold || 0) / 100,
              international: 0,
              liquid: (targets.Liquid || 0) / 100,
            },
            profile: profileForRisk,
          } as any)
        : Promise.reject(new Error('No holdings with scheme codes for analysis')),
    ])

    return {
      clientId: client.id,
      clientName: client.name,
      persona: personaResult.status === 'fulfilled'
        ? {
            status: 'success' as const,
            data: {
              primaryPersona: personaResult.value.primary_persona.name,
              riskBand: personaResult.value.primary_persona.risk_band,
              description: personaResult.value.primary_persona.description,
              confidence: personaResult.value.confidence,
              blendedAllocation: {
                equity: personaResult.value.blended_allocation.equity,
                debt: personaResult.value.blended_allocation.debt,
                hybrid: personaResult.value.blended_allocation.hybrid,
                gold: personaResult.value.blended_allocation.gold,
                international: personaResult.value.blended_allocation.international,
                liquid: personaResult.value.blended_allocation.liquid,
              } as Record<string, number>,
              distribution: personaResult.value.distribution.map(d => ({
                persona: d.persona.name,
                weight: d.weight,
              })),
            },
          }
        : { status: 'error' as const, error: (personaResult as PromiseRejectedResult).reason?.message || 'Persona classification failed' },
      risk: riskResult.status === 'fulfilled'
        ? {
            status: 'success' as const,
            data: {
              riskLevel: riskResult.value.risk_level,
              riskScore: riskResult.value.risk_score,
              riskFactors: riskResult.value.risk_factors.map(f => ({
                name: f.name,
                contribution: f.contribution,
                severity: f.severity,
                description: f.description,
              })),
              recommendations: riskResult.value.recommendations,
            },
          }
        : { status: 'error' as const, error: (riskResult as PromiseRejectedResult).reason?.message || 'Risk assessment failed' },
      rebalancing: rebalancingResult.status === 'fulfilled'
        ? {
            status: 'success' as const,
            data: {
              isAligned: rebalancingResult.value.summary.is_aligned,
              alignmentScore: rebalancingResult.value.summary.alignment_score,
              primaryIssues: rebalancingResult.value.summary.primary_issues,
              actions: rebalancingResult.value.rebalancing_actions.map(a => ({
                action: a.action,
                priority: a.priority,
                schemeName: a.scheme_name,
                assetClass: a.asset_class,
                currentValue: a.current_value,
                targetValue: a.target_value,
                transactionAmount: a.transaction_amount,
                taxStatus: a.tax_status,
                reason: a.reason,
              })),
              totalSellAmount: rebalancingResult.value.summary.total_sell_amount,
              totalBuyAmount: rebalancingResult.value.summary.total_buy_amount,
              taxImpactSummary: rebalancingResult.value.summary.tax_impact_summary,
            },
          }
        : { status: 'error' as const, error: (rebalancingResult as PromiseRejectedResult).reason?.message || 'Rebalancing analysis failed' },
    }
  }

  // ============================================================
  // Tier 3: Strategic Intelligence (cross-portfolio, pure SQL)
  // ============================================================

  async getStrategicInsights(advisorId: string): Promise<StrategicInsightsResponseDto> {
    const clients = await this.prisma.fAClient.findMany({
      where: { advisorId },
      include: { holdings: true },
    })

    // 1. Fund Overlap: group holdings by fund name across clients
    const fundMap = new Map<string, { clients: Set<string>; clientNames: string[]; totalValue: number }>()
    for (const client of clients) {
      for (const holding of client.holdings || []) {
        const key = holding.fundName
        if (!fundMap.has(key)) {
          fundMap.set(key, { clients: new Set(), clientNames: [], totalValue: 0 })
        }
        const entry = fundMap.get(key)!
        if (!entry.clients.has(client.id)) {
          entry.clients.add(client.id)
          entry.clientNames.push(client.name)
        }
        entry.totalValue += Number(holding.currentValue || 0)
      }
    }

    const fundOverlap = Array.from(fundMap.entries())
      .filter(([, data]) => data.clients.size > 1)
      .map(([fundName, data]) => ({
        fundName,
        clientCount: data.clients.size,
        totalValue: Math.round(data.totalValue * 100) / 100,
        clients: data.clientNames,
      }))
      .sort((a, b) => b.clientCount - a.clientCount)

    // 2. Concentration Alerts: flag clients with >40% in single fund or category
    const concentrationAlerts: StrategicInsightsResponseDto['concentrationAlerts'] = []
    for (const client of clients) {
      const holdings = client.holdings || []
      const totalValue = holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0)
      if (totalValue === 0) continue

      // Check per-fund concentration
      for (const holding of holdings) {
        const pct = (Number(holding.currentValue || 0) / totalValue) * 100
        if (pct > 40) {
          concentrationAlerts.push({
            clientId: client.id,
            clientName: client.name,
            type: 'fund',
            name: holding.fundName,
            percentage: Math.round(pct * 100) / 100,
            value: Number(holding.currentValue || 0),
          })
        }
      }

      // Check per-category concentration
      const categoryMap = new Map<string, number>()
      for (const holding of holdings) {
        const cat = holding.assetClass || 'Unknown'
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(holding.currentValue || 0))
      }
      for (const [category, value] of categoryMap) {
        const pct = (value / totalValue) * 100
        if (pct > 40 && category !== 'Unknown') {
          concentrationAlerts.push({
            clientId: client.id,
            clientName: client.name,
            type: 'category',
            name: category,
            percentage: Math.round(pct * 100) / 100,
            value: Math.round(value * 100) / 100,
          })
        }
      }
    }

    // 3. AUM Distribution: bucket clients by portfolio size
    const aumBuckets = [
      { range: '0 - 1L', min: 0, max: 100000 },
      { range: '1L - 5L', min: 100000, max: 500000 },
      { range: '5L - 10L', min: 500000, max: 1000000 },
      { range: '10L - 25L', min: 1000000, max: 2500000 },
      { range: '25L - 50L', min: 2500000, max: 5000000 },
      { range: '50L+', min: 5000000, max: Infinity },
    ]

    const aumDistribution = aumBuckets.map(bucket => {
      let count = 0
      let totalAum = 0
      for (const client of clients) {
        const aum = (client.holdings || []).reduce((sum, h) => sum + Number(h.currentValue || 0), 0)
        if (aum >= bucket.min && aum < bucket.max) {
          count++
          totalAum += aum
        }
      }
      return {
        range: bucket.range,
        count,
        totalAum: Math.round(totalAum * 100) / 100,
      }
    })

    // 4. Risk Distribution: count clients per risk profile
    const riskCounts = new Map<string, number>()
    for (const client of clients) {
      const profile = RISK_PROFILE_MAP[client.riskProfile] || 'Moderate'
      riskCounts.set(profile, (riskCounts.get(profile) || 0) + 1)
    }

    const totalClients = clients.length || 1
    const riskDistribution = Array.from(riskCounts.entries()).map(([profile, count]) => ({
      profile,
      count,
      percentage: Math.round((count / totalClients) * 10000) / 100,
    }))

    return {
      fundOverlap,
      concentrationAlerts: concentrationAlerts.sort((a, b) => b.percentage - a.percentage),
      aumDistribution,
      riskDistribution,
    }
  }

  // ============================================================
  // Helpers
  // ============================================================

  private formatLastActive(date: Date | null): string {
    if (!date) return 'Never'

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return date.toISOString().split('T')[0]
  }
}
