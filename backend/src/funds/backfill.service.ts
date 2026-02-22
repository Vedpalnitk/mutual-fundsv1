import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MfApiService } from './mfapi.service';
import { Prisma } from '@prisma/client';

// UTI Nifty 50 Index Fund Direct Growth — benchmark for Alpha/Beta
const BENCHMARK_SCHEME_CODE = 120716;

@Injectable()
export class BackfillService {
  private readonly logger = new Logger(BackfillService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mfApiService: MfApiService,
  ) {}

  /**
   * Backfill NAV history for all scheme plans from MFAPI.in.
   * Uses tiered downsampling: daily for recent 3 months, month-end only for 3mo–5yr.
   * Estimated: ~122 data points per fund × 18K funds = ~2.2M rows.
   */
  async backfillAllHistory(years = 5): Promise<{ total: number; backfilled: number; failed: number }> {
    if (this.isRunning) {
      this.logger.warn('Backfill already in progress');
      return { total: 0, backfilled: 0, failed: 0 };
    }

    this.isRunning = true;

    try {
      // Get all scheme plans with MFAPI scheme codes
      const plans = await this.prisma.schemePlan.findMany({
        where: { mfapiSchemeCode: { not: null } },
        select: { id: true, mfapiSchemeCode: true, name: true },
      });

      // Ensure benchmark fund is included
      const hasBenchmark = plans.some(p => p.mfapiSchemeCode === BENCHMARK_SCHEME_CODE);
      if (!hasBenchmark) {
        this.logger.warn(`Benchmark fund ${BENCHMARK_SCHEME_CODE} not in DB — add it via AMFI sync first`);
      }

      this.logger.log(`Starting backfill for ${plans.length} funds (${years} years, tiered downsampling)...`);

      let backfilled = 0;
      let failed = 0;

      // Process in batches of 10
      const batchSize = 10;
      for (let i = 0; i < plans.length; i += batchSize) {
        const batch = plans.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(plan => this.backfillSingleFund(plan.id, plan.mfapiSchemeCode!, years)),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            backfilled++;
          } else {
            failed++;
          }
        }

        // Log progress every 100 funds
        if ((i + batchSize) % 100 < batchSize) {
          this.logger.log(`Backfill progress: ${Math.min(i + batchSize, plans.length)}/${plans.length} (${backfilled} ok, ${failed} failed)`);
        }

        // Delay between batches: 200ms
        if (i + batchSize < plans.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      this.logger.log(`Backfill complete: ${backfilled}/${plans.length} funds backfilled, ${failed} failed`);
      return { total: plans.length, backfilled, failed };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Backfill all scheme plans, skipping those that already have sufficient history.
   * Intended for one-time use after expanding to all ~18K funds.
   */
  async backfillAll(options?: { dailyMonths?: number; historyYears?: number }): Promise<{ total: number; backfilled: number; skipped: number; failed: number }> {
    if (this.isRunning) {
      this.logger.warn('Backfill already in progress');
      return { total: 0, backfilled: 0, skipped: 0, failed: 0 };
    }

    this.isRunning = true;
    const syncLog = await this.prisma.dataSyncLog.create({
      data: { syncType: 'fund_nav_backfill', status: 'started' },
    });

    const years = options?.historyYears ?? 5;

    try {
      // Get all scheme plans with MFAPI scheme codes
      const plans = await this.prisma.schemePlan.findMany({
        where: { mfapiSchemeCode: { not: null } },
        select: { id: true, mfapiSchemeCode: true },
      });

      // Check existing history counts to skip plans that already have enough data
      const historyCounts = await this.prisma.$queryRawUnsafe<Array<{ scheme_plan_id: string; count: bigint }>>(
        `SELECT scheme_plan_id, COUNT(*) as count FROM scheme_plan_nav_history GROUP BY scheme_plan_id HAVING COUNT(*) > 100`,
      );
      const sufficientHistory = new Set(historyCounts.map(h => h.scheme_plan_id));

      const plansToBackfill = plans.filter(p => !sufficientHistory.has(p.id));
      const skipped = plans.length - plansToBackfill.length;

      this.logger.log(`Backfill all: ${plans.length} total plans, ${skipped} already have sufficient history, ${plansToBackfill.length} to backfill`);

      let backfilled = 0;
      let failed = 0;

      const batchSize = 10;
      for (let i = 0; i < plansToBackfill.length; i += batchSize) {
        const batch = plansToBackfill.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(plan => this.backfillSingleFund(plan.id, plan.mfapiSchemeCode!, years)),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            backfilled++;
          } else {
            failed++;
          }
        }

        // Log progress every 100 funds
        if ((i + batchSize) % 100 < batchSize) {
          this.logger.log(`Backfill progress: ${Math.min(i + batchSize, plansToBackfill.length)}/${plansToBackfill.length} (${backfilled} ok, ${failed} failed)`);
        }

        // Delay between batches: 200ms
        if (i + batchSize < plansToBackfill.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          recordsTotal: plansToBackfill.length,
          recordsSynced: backfilled,
          recordsFailed: failed,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Backfill all complete: ${backfilled} backfilled, ${skipped} skipped, ${failed} failed`);
      return { total: plans.length, backfilled, skipped, failed };
    } catch (error) {
      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: { status: 'failed', errorMessage: error.message, completedAt: new Date() },
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Backfill a single fund's NAV history with tiered downsampling.
   * - Daily data for the most recent 3 months
   * - Month-end data only for 3 months to `years` years back
   */
  private async backfillSingleFund(schemePlanId: string, schemeCode: number, years: number): Promise<void> {
    const details = await this.mfApiService.getFundDetails(schemeCode);

    if (!details.data || details.data.length === 0) {
      throw new Error(`No NAV data for scheme ${schemeCode}`);
    }

    const now = new Date();
    const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate()));
    const cutoffDate = new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()));

    // Parse all data points
    const allPoints: { date: Date; nav: number }[] = [];
    for (const nav of details.data) {
      const navDate = this.parseNavDate(nav.date);
      const navValue = parseFloat(nav.nav);
      if (!navDate || isNaN(navValue) || navValue <= 0) continue;
      if (navDate < cutoffDate) break; // MFAPI returns newest first
      allPoints.push({ date: navDate, nav: navValue });
    }

    if (allPoints.length === 0) return;

    // Tier 1: Keep ALL daily data points within last 3 months
    const recentPoints = allPoints.filter(p => p.date >= threeMonthsAgo);

    // Tier 2: For older data (3mo–5yr), keep only month-end data points
    const olderPoints = allPoints.filter(p => p.date < threeMonthsAgo);
    const monthEndPoints = this.extractMonthEndPoints(olderPoints);

    // Combine
    const combined = [...recentPoints, ...monthEndPoints];

    // Prepare records
    const records = combined.map(p => ({
      schemePlanId,
      navDate: p.date,
      nav: new Prisma.Decimal(p.nav),
    }));

    if (records.length === 0) return;

    // Bulk insert with skipDuplicates
    await this.prisma.schemePlanNavHistory.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  /**
   * From a list of NAV data points, extract only the last available data point per calendar month.
   * Input is assumed to be sorted newest-first (as from MFAPI).
   */
  private extractMonthEndPoints(points: { date: Date; nav: number }[]): { date: Date; nav: number }[] {
    const monthMap = new Map<string, { date: Date; nav: number }>();

    for (const point of points) {
      const key = `${point.date.getFullYear()}-${String(point.date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key);
      // Keep the latest date within the month (points are newest-first, so first occurrence wins)
      if (!existing) {
        monthMap.set(key, point);
      }
    }

    return Array.from(monthMap.values());
  }

  /**
   * Parse MFAPI date format: DD-MM-YYYY → Date
   */
  private parseNavDate(dateStr: string): Date | null {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(Date.UTC(parts[2], parts[1] - 1, parts[0]));
  }
}
