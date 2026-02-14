import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// 91-day T-bill rate (annualized)
const RISK_FREE_RATE = 0.07;
// Trading days per year
const TRADING_DAYS_PER_YEAR = 252;
// UTI Nifty 50 Index Fund Direct Growth — used as Nifty 50 proxy for Alpha/Beta
const BENCHMARK_SCHEME_CODE = 120716;

interface NavPoint {
  date: Date;
  nav: number;
}

@Injectable()
export class MetricsCalculatorService {
  private readonly logger = new Logger(MetricsCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalculate all metrics for every fund with NAV history.
   */
  async recalculateAll(): Promise<{ updated: number; skipped: number; failed: number }> {
    this.logger.log('Starting metrics recalculation for all funds...');

    // Get benchmark NAV history
    const benchmarkPlan = await this.prisma.schemePlan.findFirst({
      where: { mfapiSchemeCode: BENCHMARK_SCHEME_CODE },
      select: { id: true },
    });

    let benchmarkHistory: NavPoint[] = [];
    if (benchmarkPlan) {
      const raw = await this.prisma.schemePlanNavHistory.findMany({
        where: { schemePlanId: benchmarkPlan.id },
        orderBy: { navDate: 'asc' },
        select: { navDate: true, nav: true },
      });
      benchmarkHistory = raw.map(r => ({ date: r.navDate, nav: Number(r.nav) }));
    } else {
      this.logger.warn('Benchmark fund (UTI Nifty 50) not found — Alpha/Beta will be skipped');
    }

    // Get all scheme plans that have NAV history
    const plans = await this.prisma.schemePlan.findMany({
      where: {
        navHistory: { some: {} },
      },
      select: { id: true, mfapiSchemeCode: true },
    });

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const plan of plans) {
      try {
        const raw = await this.prisma.schemePlanNavHistory.findMany({
          where: { schemePlanId: plan.id },
          orderBy: { navDate: 'asc' },
          select: { navDate: true, nav: true },
        });

        const history: NavPoint[] = raw.map(r => ({ date: r.navDate, nav: Number(r.nav) }));

        if (history.length < 5) {
          skipped++;
          continue;
        }

        const metrics = this.computeMetrics(history, benchmarkHistory);

        await this.prisma.schemePlanMetrics.upsert({
          where: { schemePlanId: plan.id },
          update: {
            return1w: metrics.return1w != null ? new Prisma.Decimal(metrics.return1w) : null,
            return1m: metrics.return1m != null ? new Prisma.Decimal(metrics.return1m) : null,
            return3m: metrics.return3m != null ? new Prisma.Decimal(metrics.return3m) : null,
            return6m: metrics.return6m != null ? new Prisma.Decimal(metrics.return6m) : null,
            return1y: metrics.return1y != null ? new Prisma.Decimal(metrics.return1y) : null,
            return3y: metrics.return3y != null ? new Prisma.Decimal(metrics.return3y) : null,
            return5y: metrics.return5y != null ? new Prisma.Decimal(metrics.return5y) : null,
            returnSinceInception: metrics.returnSinceInception != null ? new Prisma.Decimal(metrics.returnSinceInception) : null,
            volatility: metrics.volatility != null ? new Prisma.Decimal(metrics.volatility) : null,
            sharpeRatio: metrics.sharpeRatio != null ? new Prisma.Decimal(metrics.sharpeRatio) : null,
            sortinoRatio: metrics.sortinoRatio != null ? new Prisma.Decimal(metrics.sortinoRatio) : null,
            alpha: metrics.alpha != null ? new Prisma.Decimal(metrics.alpha) : null,
            beta: metrics.beta != null ? new Prisma.Decimal(metrics.beta) : null,
            maxDrawdown: metrics.maxDrawdown != null ? new Prisma.Decimal(metrics.maxDrawdown) : null,
            riskRating: metrics.riskRating,
          },
          create: {
            schemePlanId: plan.id,
            return1w: metrics.return1w != null ? new Prisma.Decimal(metrics.return1w) : null,
            return1m: metrics.return1m != null ? new Prisma.Decimal(metrics.return1m) : null,
            return3m: metrics.return3m != null ? new Prisma.Decimal(metrics.return3m) : null,
            return6m: metrics.return6m != null ? new Prisma.Decimal(metrics.return6m) : null,
            return1y: metrics.return1y != null ? new Prisma.Decimal(metrics.return1y) : null,
            return3y: metrics.return3y != null ? new Prisma.Decimal(metrics.return3y) : null,
            return5y: metrics.return5y != null ? new Prisma.Decimal(metrics.return5y) : null,
            returnSinceInception: metrics.returnSinceInception != null ? new Prisma.Decimal(metrics.returnSinceInception) : null,
            volatility: metrics.volatility != null ? new Prisma.Decimal(metrics.volatility) : null,
            sharpeRatio: metrics.sharpeRatio != null ? new Prisma.Decimal(metrics.sharpeRatio) : null,
            sortinoRatio: metrics.sortinoRatio != null ? new Prisma.Decimal(metrics.sortinoRatio) : null,
            alpha: metrics.alpha != null ? new Prisma.Decimal(metrics.alpha) : null,
            beta: metrics.beta != null ? new Prisma.Decimal(metrics.beta) : null,
            maxDrawdown: metrics.maxDrawdown != null ? new Prisma.Decimal(metrics.maxDrawdown) : null,
            riskRating: metrics.riskRating,
          },
        });

        updated++;
      } catch (error) {
        this.logger.debug(`Failed metrics for plan ${plan.id}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`Metrics recalculation done: ${updated} updated, ${skipped} skipped, ${failed} failed`);

    // Phase 2: Calculate fund ratings (category-relative, Morningstar-style)
    const rated = await this.calculateFundRatings();
    this.logger.log(`Fund ratings assigned: ${rated} funds rated`);

    return { updated, skipped, failed };
  }

  /**
   * Morningstar-style fund star ratings.
   *
   * 1. Compute a risk-adjusted score per fund using Sortino ratio
   *    (penalizes downside risk, similar to Morningstar's MRAR).
   * 2. Weight by time period:
   *    - Has 5Y+ data: 60% × 5Y score + 40% × 3Y score
   *    - Has 3Y+ data only: 100% × 3Y score
   *    - Less than 3Y: no rating
   * 3. Group by category, rank by percentile within category.
   * 4. Assign stars:
   *    Top 10%     → 5★
   *    Next 22.5%  → 4★
   *    Next 35%    → 3★
   *    Next 22.5%  → 2★
   *    Bottom 10%  → 1★
   *
   * Minimum 3 funds in a category to assign ratings.
   */
  private async calculateFundRatings(): Promise<number> {
    // Fetch all funds with their metrics and category
    const funds = await this.prisma.schemePlan.findMany({
      where: {
        metrics: { isNot: null },
      },
      select: {
        id: true,
        scheme: {
          select: { categoryId: true },
        },
        metrics: {
          select: {
            return3y: true,
            return5y: true,
            volatility: true,
            sortinoRatio: true,
            sharpeRatio: true,
          },
        },
        navHistory: {
          orderBy: { navDate: 'asc' },
          select: { navDate: true },
          take: 1,
        },
      },
    });

    // Compute risk-adjusted score per fund
    interface ScoredFund {
      id: string;
      categoryId: string;
      score: number;
    }

    const scored: ScoredFund[] = [];
    const now = new Date();

    for (const fund of funds) {
      if (!fund.metrics) continue;

      const firstNavDate = fund.navHistory[0]?.navDate;
      if (!firstNavDate) continue;

      const yearsOfData = (now.getTime() - firstNavDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

      // Need at least ~3 years of history
      if (yearsOfData < 2.5) continue;

      const sortino = fund.metrics.sortinoRatio ? Number(fund.metrics.sortinoRatio) : null;
      const sharpe = fund.metrics.sharpeRatio ? Number(fund.metrics.sharpeRatio) : null;
      const return3y = fund.metrics.return3y ? Number(fund.metrics.return3y) : null;
      const return5y = fund.metrics.return5y ? Number(fund.metrics.return5y) : null;
      const volatility = fund.metrics.volatility ? Number(fund.metrics.volatility) : null;

      // Primary score: Sortino ratio (if available), fallback to Sharpe
      // Sortino better captures Morningstar's downside-penalty philosophy
      const riskAdjustedMetric = sortino ?? sharpe;
      if (riskAdjustedMetric == null) continue;

      let score: number;

      if (yearsOfData >= 4.5 && return5y != null && return3y != null && volatility != null && volatility > 0) {
        // Blend 5Y and 3Y risk-adjusted returns (60/40 weighting)
        const riskAdj5y = (return5y - RISK_FREE_RATE * 100) / volatility;
        const riskAdj3y = (return3y - RISK_FREE_RATE * 100) / volatility;
        score = 0.6 * riskAdj5y + 0.4 * riskAdj3y;
      } else {
        // Use the Sortino/Sharpe ratio directly as single-period score
        score = riskAdjustedMetric;
      }

      scored.push({ id: fund.id, categoryId: fund.scheme.categoryId, score });
    }

    // Group by category
    const byCategory = new Map<string, ScoredFund[]>();
    for (const fund of scored) {
      const list = byCategory.get(fund.categoryId) || [];
      list.push(fund);
      byCategory.set(fund.categoryId, list);
    }

    // Assign ratings within each category
    let totalRated = 0;

    for (const [, categoryFunds] of byCategory) {
      // Need at least 3 funds in category to rank meaningfully
      if (categoryFunds.length < 3) continue;

      // Sort descending by score (best first)
      categoryFunds.sort((a, b) => b.score - a.score);

      const n = categoryFunds.length;

      for (let i = 0; i < n; i++) {
        const percentile = i / n; // 0 = best, 1 = worst
        let rating: number;

        if (percentile < 0.10) rating = 5;
        else if (percentile < 0.325) rating = 4;  // 10% + 22.5%
        else if (percentile < 0.675) rating = 3;  // + 35%
        else if (percentile < 0.90) rating = 2;   // + 22.5%
        else rating = 1;

        await this.prisma.schemePlanMetrics.update({
          where: { schemePlanId: categoryFunds[i].id },
          data: { fundRating: rating },
        });

        totalRated++;
      }
    }

    return totalRated;
  }

  /**
   * Compute all metrics from NAV history.
   */
  private computeMetrics(
    history: NavPoint[],
    benchmarkHistory: NavPoint[],
  ): {
    return1w: number | null;
    return1m: number | null;
    return3m: number | null;
    return6m: number | null;
    return1y: number | null;
    return3y: number | null;
    return5y: number | null;
    returnSinceInception: number | null;
    volatility: number | null;
    sharpeRatio: number | null;
    sortinoRatio: number | null;
    alpha: number | null;
    beta: number | null;
    maxDrawdown: number | null;
    riskRating: number | null;
  } {
    const returns = this.calculateReturns(history);
    const volatility = this.calculateVolatility(history);
    const sharpeRatio = this.calculateSharpeRatio(history, volatility);
    const sortinoRatio = this.calculateSortinoRatio(history);
    const { alpha, beta } = this.calculateAlphaBeta(history, benchmarkHistory);
    const maxDrawdown = this.calculateMaxDrawdown(history);
    const riskRating = this.calculateRiskRating(volatility);

    return {
      ...returns,
      volatility,
      sharpeRatio,
      sortinoRatio,
      alpha,
      beta,
      maxDrawdown,
      riskRating,
    };
  }

  /**
   * CAGR returns for various periods.
   * CAGR = (NAV_end / NAV_start) ^ (1/years) - 1
   */
  private calculateReturns(history: NavPoint[]): {
    return1w: number | null;
    return1m: number | null;
    return3m: number | null;
    return6m: number | null;
    return1y: number | null;
    return3y: number | null;
    return5y: number | null;
    returnSinceInception: number | null;
  } {
    if (history.length < 2) {
      return { return1w: null, return1m: null, return3m: null, return6m: null, return1y: null, return3y: null, return5y: null, returnSinceInception: null };
    }

    const latest = history[history.length - 1];

    const findNavAtDaysAgo = (daysAgo: number): NavPoint | null => {
      const target = new Date(latest.date);
      target.setDate(target.getDate() - daysAgo);
      const targetTime = target.getTime();

      // Find closest NAV within 7-day tolerance
      let best: NavPoint | null = null;
      let bestDiff = Infinity;
      for (const p of history) {
        const diff = Math.abs(p.date.getTime() - targetTime);
        if (diff < bestDiff && diff <= 7 * 24 * 60 * 60 * 1000) {
          best = p;
          bestDiff = diff;
        }
      }
      return best;
    };

    const cagr = (startNav: number, endNav: number, years: number): number => {
      if (startNav <= 0 || years <= 0) return 0;
      return (Math.pow(endNav / startNav, 1 / years) - 1) * 100;
    };

    const simpleReturn = (startNav: number, endNav: number): number => {
      if (startNav <= 0) return 0;
      return ((endNav - startNav) / startNav) * 100;
    };

    const nav1w = findNavAtDaysAgo(7);
    const nav1m = findNavAtDaysAgo(30);
    const nav3m = findNavAtDaysAgo(91);
    const nav6m = findNavAtDaysAgo(182);
    const nav1y = findNavAtDaysAgo(365);
    const nav3y = findNavAtDaysAgo(365 * 3);
    const nav5y = findNavAtDaysAgo(365 * 5);
    const inception = history[0];

    const inceptionYears = (latest.date.getTime() - inception.date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    return {
      return1w: nav1w ? simpleReturn(nav1w.nav, latest.nav) : null,
      return1m: nav1m ? simpleReturn(nav1m.nav, latest.nav) : null,
      return3m: nav3m ? simpleReturn(nav3m.nav, latest.nav) : null,
      return6m: nav6m ? simpleReturn(nav6m.nav, latest.nav) : null,
      return1y: nav1y ? cagr(nav1y.nav, latest.nav, 1) : null,
      return3y: nav3y ? cagr(nav3y.nav, latest.nav, 3) : null,
      return5y: nav5y ? cagr(nav5y.nav, latest.nav, 5) : null,
      returnSinceInception: inceptionYears >= 0.1 ? cagr(inception.nav, latest.nav, inceptionYears) : null,
    };
  }

  /**
   * Annualized volatility = std_dev(daily_log_returns) × √252
   * Requires at least 1 year (252 trading days) of data.
   */
  private calculateVolatility(history: NavPoint[]): number | null {
    if (history.length < TRADING_DAYS_PER_YEAR) return null;

    const dailyLogReturns = this.getDailyLogReturns(history);
    if (dailyLogReturns.length < TRADING_DAYS_PER_YEAR) return null;

    // Use last 252 data points
    const recent = dailyLogReturns.slice(-TRADING_DAYS_PER_YEAR);
    const stdDev = this.standardDeviation(recent);

    return stdDev * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100; // as percentage
  }

  /**
   * Sharpe Ratio = (annualized_return - risk_free_rate) / volatility
   */
  private calculateSharpeRatio(history: NavPoint[], volatility: number | null): number | null {
    if (volatility == null || volatility === 0) return null;
    if (history.length < TRADING_DAYS_PER_YEAR) return null;

    const recent = history.slice(-TRADING_DAYS_PER_YEAR);
    const annualizedReturn = this.annualizedReturnFromNavs(recent[0].nav, recent[recent.length - 1].nav, 1);

    return (annualizedReturn - RISK_FREE_RATE * 100) / volatility;
  }

  /**
   * Sortino Ratio = (return - risk_free_rate) / downside_deviation
   * Only considers negative returns for the denominator.
   */
  private calculateSortinoRatio(history: NavPoint[]): number | null {
    if (history.length < TRADING_DAYS_PER_YEAR) return null;

    const dailyLogReturns = this.getDailyLogReturns(history);
    const recent = dailyLogReturns.slice(-TRADING_DAYS_PER_YEAR);

    // Daily risk-free rate
    const dailyRf = Math.log(1 + RISK_FREE_RATE) / TRADING_DAYS_PER_YEAR;

    // Downside returns (only negative excess returns)
    const downsideReturns = recent.filter(r => r < dailyRf).map(r => r - dailyRf);
    if (downsideReturns.length === 0) return null;

    const downsideDeviation = Math.sqrt(
      downsideReturns.reduce((sum, r) => sum + r * r, 0) / recent.length,
    ) * Math.sqrt(TRADING_DAYS_PER_YEAR);

    if (downsideDeviation === 0) return null;

    const recentHistory = history.slice(-TRADING_DAYS_PER_YEAR);
    const annualizedReturn = this.annualizedReturnFromNavs(
      recentHistory[0].nav, recentHistory[recentHistory.length - 1].nav, 1,
    );

    return (annualizedReturn - RISK_FREE_RATE * 100) / (downsideDeviation * 100);
  }

  /**
   * Alpha & Beta via linear regression of fund daily returns vs benchmark daily returns.
   * y = alpha + beta * x, where x = benchmark returns, y = fund returns.
   */
  private calculateAlphaBeta(
    history: NavPoint[],
    benchmarkHistory: NavPoint[],
  ): { alpha: number | null; beta: number | null } {
    if (history.length < TRADING_DAYS_PER_YEAR || benchmarkHistory.length < TRADING_DAYS_PER_YEAR) {
      return { alpha: null, beta: null };
    }

    // Build a map of benchmark returns by date string (YYYY-MM-DD)
    const benchmarkMap = new Map<string, number>();
    for (let i = 1; i < benchmarkHistory.length; i++) {
      const dateKey = benchmarkHistory[i].date.toISOString().slice(0, 10);
      benchmarkMap.set(dateKey, Math.log(benchmarkHistory[i].nav / benchmarkHistory[i - 1].nav));
    }

    // Align fund and benchmark daily returns by date
    const fundReturns: number[] = [];
    const benchReturns: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const dateKey = history[i].date.toISOString().slice(0, 10);
      const benchReturn = benchmarkMap.get(dateKey);
      if (benchReturn !== undefined) {
        fundReturns.push(Math.log(history[i].nav / history[i - 1].nav));
        benchReturns.push(benchReturn);
      }
    }

    // Use last 252 aligned points
    const n = Math.min(fundReturns.length, TRADING_DAYS_PER_YEAR);
    if (n < 60) return { alpha: null, beta: null }; // need at least ~3 months

    const x = benchReturns.slice(-n);
    const y = fundReturns.slice(-n);

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let covXY = 0;
    let varX = 0;
    for (let i = 0; i < n; i++) {
      covXY += (x[i] - meanX) * (y[i] - meanY);
      varX += (x[i] - meanX) * (x[i] - meanX);
    }

    if (varX === 0) return { alpha: null, beta: null };

    const beta = covXY / varX;
    // Annualize alpha: daily alpha × 252
    const dailyAlpha = meanY - beta * meanX;
    const alpha = dailyAlpha * TRADING_DAYS_PER_YEAR * 100; // as percentage

    return { alpha, beta };
  }

  /**
   * Max drawdown = largest peak-to-trough decline.
   */
  private calculateMaxDrawdown(history: NavPoint[]): number | null {
    if (history.length < 30) return null;

    let peak = history[0].nav;
    let maxDD = 0;

    for (const point of history) {
      if (point.nav > peak) {
        peak = point.nav;
      }
      const drawdown = (peak - point.nav) / peak;
      if (drawdown > maxDD) {
        maxDD = drawdown;
      }
    }

    return maxDD * 100; // as percentage
  }

  /**
   * Risk rating from annualized volatility:
   *   <3% → 1, 3-8% → 2, 8-15% → 3, 15-22% → 4, >22% → 5
   */
  private calculateRiskRating(volatility: number | null): number | null {
    if (volatility == null) return null;
    if (volatility < 3) return 1;
    if (volatility < 8) return 2;
    if (volatility < 15) return 3;
    if (volatility < 22) return 4;
    return 5;
  }

  // ============= Helpers =============

  private getDailyLogReturns(history: NavPoint[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < history.length; i++) {
      if (history[i - 1].nav > 0) {
        returns.push(Math.log(history[i].nav / history[i - 1].nav));
      }
    }
    return returns;
  }

  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / values.length;
    return Math.sqrt(variance);
  }

  private annualizedReturnFromNavs(startNav: number, endNav: number, years: number): number {
    if (startNav <= 0 || years <= 0) return 0;
    return (Math.pow(endNav / startNav, 1 / years) - 1) * 100;
  }
}
