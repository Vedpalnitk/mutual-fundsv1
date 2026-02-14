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
   * One-time operation: ~500 funds × ~1250 data points = ~625K rows.
   * Estimated time: 15-30 minutes.
   */
  async backfillAllHistory(years = 5): Promise<{ total: number; backfilled: number; failed: number }> {
    if (this.isRunning) {
      this.logger.warn('Backfill already in progress');
      return { total: 0, backfilled: 0, failed: 0 };
    }

    this.isRunning = true;
    const maxDataPoints = years * 250; // ~250 trading days/year

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

      this.logger.log(`Starting backfill for ${plans.length} funds (${years} years)...`);

      let backfilled = 0;
      let failed = 0;

      // Process in batches of 5
      const batchSize = 5;
      for (let i = 0; i < plans.length; i += batchSize) {
        const batch = plans.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(plan => this.backfillSingleFund(plan.id, plan.mfapiSchemeCode!, maxDataPoints)),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            backfilled++;
          } else {
            failed++;
          }
        }

        // Log progress every 50 funds
        if ((i + batchSize) % 50 === 0 || i + batchSize >= plans.length) {
          this.logger.log(`Backfill progress: ${Math.min(i + batchSize, plans.length)}/${plans.length} (${backfilled} ok, ${failed} failed)`);
        }

        // Delay between batches: 500ms
        if (i + batchSize < plans.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      this.logger.log(`Backfill complete: ${backfilled}/${plans.length} funds backfilled, ${failed} failed`);
      return { total: plans.length, backfilled, failed };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Backfill a single fund's NAV history.
   */
  private async backfillSingleFund(schemePlanId: string, schemeCode: number, maxDataPoints: number): Promise<void> {
    const details = await this.mfApiService.getFundDetails(schemeCode);

    if (!details.data || details.data.length === 0) {
      throw new Error(`No NAV data for scheme ${schemeCode}`);
    }

    // Take up to maxDataPoints (most recent first in MFAPI response)
    const navData = details.data.slice(0, maxDataPoints);

    // Prepare records
    const records = navData
      .map(nav => {
        const navDate = this.parseNavDate(nav.date);
        const navValue = parseFloat(nav.nav);
        if (!navDate || isNaN(navValue) || navValue <= 0) return null;
        return {
          schemePlanId,
          navDate,
          nav: new Prisma.Decimal(navValue),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (records.length === 0) return;

    // Bulk insert with skipDuplicates
    await this.prisma.schemePlanNavHistory.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  /**
   * Parse MFAPI date format: DD-MM-YYYY → Date
   */
  private parseNavDate(dateStr: string): Date | null {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
}
