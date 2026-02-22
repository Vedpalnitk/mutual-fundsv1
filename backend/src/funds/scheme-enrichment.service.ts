import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CATEGORY_BENCHMARK_MAP, CATEGORY_RISK_MAP } from './data/benchmark-map';
import { PROVIDER_METADATA } from './data/provider-metadata-map';

/**
 * One-time + weekly enrichment service that fills null metadata fields
 * on Scheme, SchemePlan, and Provider using data from BSE/NSE scheme
 * masters and static mappings.
 *
 * Four phases, all idempotent:
 *   A) enrichBenchmarks   — category → SEBI benchmark TRI
 *   B) enrichFromExchangeMasters — BSE/NSE → transaction flags, exitLoad, lockinPeriod
 *   C) enrichProviderMetadata — static map → logoUrl, websiteUrl
 *   D) enrichRiskRatings — category → default risk rating (fallback for missing volatility data)
 */
@Injectable()
export class SchemeEnrichmentService {
  private readonly logger = new Logger(SchemeEnrichmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Weekly cron — Sunday 4 AM IST (after BSE 2 AM + NSE 3 AM syncs).
   */
  @Cron('0 4 * * 0', { timeZone: 'Asia/Kolkata' })
  async scheduledEnrichment(): Promise<void> {
    this.logger.log('Scheduled scheme enrichment triggered');
    try {
      await this.enrichAll();
    } catch (error) {
      this.logger.error(`Scheduled enrichment failed: ${error.message}`);
    }
  }

  /**
   * Run all three enrichment phases. Tracked via DataSyncLog.
   */
  async enrichAll(): Promise<{
    benchmarks: { updated: number };
    exchangeMasters: { schemePlansUpdated: number; schemesUpdated: number; skipped: number };
    providers: { updated: number };
    riskRatings: { updated: number };
  }> {
    const syncLog = await this.prisma.dataSyncLog.create({
      data: { syncType: 'scheme_enrichment', status: 'started' },
    });

    try {
      const benchmarks = await this.enrichBenchmarks();
      const exchangeMasters = await this.enrichFromExchangeMasters();
      const providers = await this.enrichProviderMetadata();
      const riskRatings = await this.enrichRiskRatings();

      const totalUpdated =
        benchmarks.updated + exchangeMasters.schemePlansUpdated +
        exchangeMasters.schemesUpdated + providers.updated + riskRatings.updated;

      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          recordsTotal: totalUpdated,
          recordsSynced: totalUpdated,
          completedAt: new Date(),
        },
      });

      this.logger.log(
        `Enrichment complete: benchmarks=${benchmarks.updated}, ` +
        `schemePlans=${exchangeMasters.schemePlansUpdated}, ` +
        `schemes=${exchangeMasters.schemesUpdated}, ` +
        `providers=${providers.updated}, ` +
        `riskRatings=${riskRatings.updated}`,
      );

      return { benchmarks, exchangeMasters, providers, riskRatings };
    } catch (error) {
      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          errorMessage: error.message?.slice(0, 1000),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  // ==================== Phase A: Benchmarks ====================

  /**
   * Populate Scheme.benchmark from CATEGORY_BENCHMARK_MAP for all schemes
   * where benchmark is currently null.
   */
  async enrichBenchmarks(): Promise<{ updated: number }> {
    let totalUpdated = 0;

    for (const [categoryId, benchmark] of Object.entries(CATEGORY_BENCHMARK_MAP)) {
      if (!benchmark) continue; // Skip empty benchmarks (L3-INDEX, L3-OTHER)

      const result = await this.prisma.scheme.updateMany({
        where: {
          categoryId,
          benchmark: null,
        },
        data: { benchmark },
      });

      if (result.count > 0) {
        this.logger.debug(`Benchmark: ${categoryId} → ${result.count} schemes`);
        totalUpdated += result.count;
      }
    }

    // Special handling for Index funds — infer benchmark from scheme name
    await this.enrichIndexFundBenchmarks();

    this.logger.log(`Phase A: ${totalUpdated} scheme benchmarks updated`);
    return { updated: totalUpdated };
  }

  /**
   * For L3-INDEX schemes, infer benchmark from scheme name keywords.
   */
  private async enrichIndexFundBenchmarks(): Promise<void> {
    const indexSchemes = await this.prisma.scheme.findMany({
      where: { categoryId: 'L3-INDEX', benchmark: null },
      select: { id: true, name: true },
    });

    if (indexSchemes.length === 0) return;

    const nameToIndex: Array<[RegExp, string]> = [
      [/nifty\s*50(?!\d)/i, 'NIFTY 50 TRI'],
      [/nifty\s*next\s*50/i, 'NIFTY Next 50 TRI'],
      [/nifty\s*100/i, 'NIFTY 100 TRI'],
      [/nifty\s*500/i, 'NIFTY 500 TRI'],
      [/nifty\s*midcap\s*150/i, 'Nifty Midcap 150 TRI'],
      [/nifty\s*smallcap\s*250/i, 'Nifty Smallcap 250 TRI'],
      [/sensex/i, 'S&P BSE Sensex TRI'],
      [/nifty\s*bank/i, 'NIFTY Bank TRI'],
      [/nifty\s*it/i, 'NIFTY IT TRI'],
      [/nifty\s*midcap\s*50/i, 'Nifty Midcap 50 TRI'],
    ];

    let count = 0;
    for (const scheme of indexSchemes) {
      for (const [pattern, benchmark] of nameToIndex) {
        if (pattern.test(scheme.name)) {
          await this.prisma.scheme.update({
            where: { id: scheme.id },
            data: { benchmark },
          });
          count++;
          break;
        }
      }
    }

    if (count > 0) {
      this.logger.debug(`Index fund benchmarks inferred: ${count}`);
    }
  }

  // ==================== Phase B: Exchange Masters ====================

  /**
   * Populate SchemePlan transaction flags and Scheme exitLoad/lockinPeriod
   * from BseSchemeMaster and NseSchemeMaster, matched by ISIN.
   */
  async enrichFromExchangeMasters(): Promise<{
    schemePlansUpdated: number;
    schemesUpdated: number;
    skipped: number;
  }> {
    // Pre-load all SchemePlans
    const schemePlans = await this.prisma.schemePlan.findMany({
      select: { id: true, isin: true, schemeId: true },
    });

    // Pre-load BSE masters indexed by ISIN
    const bseMasters = await this.prisma.bseSchemeMaster.findMany({
      where: { isin: { not: null } },
    });
    const bseByIsin = new Map(
      bseMasters.filter(m => m.isin).map(m => [m.isin!, m]),
    );

    // Pre-load NSE masters indexed by ISIN
    const nseMasters = await this.prisma.nseSchemeMaster.findMany({
      where: { isin: { not: null } },
    });
    const nseByIsin = new Map(
      nseMasters.filter(m => m.isin).map(m => [m.isin!, m]),
    );

    if (bseByIsin.size === 0 && nseByIsin.size === 0) {
      this.logger.log('Phase B: No BSE/NSE master data — skipping');
      return { schemePlansUpdated: 0, schemesUpdated: 0, skipped: schemePlans.length };
    }

    let schemePlansUpdated = 0;
    let skipped = 0;
    const schemeUpdates = new Map<string, { exitLoad?: string; lockinPeriod?: number }>();

    for (const sp of schemePlans) {
      const bse = bseByIsin.get(sp.isin);
      const nse = nseByIsin.get(sp.isin);
      const master = bse || nse; // Prefer BSE

      if (!master) {
        skipped++;
        continue;
      }

      // Update SchemePlan transaction flags
      await this.prisma.schemePlan.update({
        where: { id: sp.id },
        data: {
          purchaseAllowed: master.purchaseAllowed,
          redemptionAllowed: master.redemptionAllowed,
          sipAllowed: master.sipAllowed,
          swpAllowed: master.swpAllowed,
          switchInAllowed: 'switchAllowed' in master ? master.switchAllowed : undefined,
          switchOutAllowed: 'switchAllowed' in master ? master.switchAllowed : undefined,
          stpInAllowed: master.stpAllowed,
          stpOutAllowed: master.stpAllowed,
        },
      });
      schemePlansUpdated++;

      // Collect parent Scheme updates (exitLoad, lockinPeriod)
      if (!schemeUpdates.has(sp.schemeId)) {
        const update: { exitLoad?: string; lockinPeriod?: number } = {};

        if (master.exitLoad) {
          update.exitLoad = master.exitLoad;
        }
        if (master.lockInPeriod) {
          const days = this.parseLockInPeriodToDays(master.lockInPeriod);
          if (days > 0) {
            update.lockinPeriod = days;
          }
        }

        if (update.exitLoad || update.lockinPeriod) {
          schemeUpdates.set(sp.schemeId, update);
        }
      }
    }

    // Bulk-update parent Schemes (only where currently null)
    let schemesUpdated = 0;
    for (const [schemeId, data] of schemeUpdates) {
      const updateData: any = {};
      if (data.exitLoad) updateData.exitLoad = data.exitLoad;
      if (data.lockinPeriod) updateData.lockinPeriod = data.lockinPeriod;

      // Only update if at least one field is currently null
      const scheme = await this.prisma.scheme.findUnique({
        where: { id: schemeId },
        select: { exitLoad: true, lockinPeriod: true },
      });

      if (!scheme) continue;

      const fieldsToUpdate: any = {};
      if (scheme.exitLoad === null && updateData.exitLoad) {
        fieldsToUpdate.exitLoad = updateData.exitLoad;
      }
      if (scheme.lockinPeriod === null && updateData.lockinPeriod) {
        fieldsToUpdate.lockinPeriod = updateData.lockinPeriod;
      }

      if (Object.keys(fieldsToUpdate).length > 0) {
        await this.prisma.scheme.update({
          where: { id: schemeId },
          data: fieldsToUpdate,
        });
        schemesUpdated++;
      }
    }

    this.logger.log(
      `Phase B: ${schemePlansUpdated} scheme plans updated, ` +
      `${schemesUpdated} schemes updated, ${skipped} skipped (no match)`,
    );

    return { schemePlansUpdated, schemesUpdated, skipped };
  }

  /**
   * Parse BSE lock-in period string to days.
   * BSE formats: "3 Years", "1095 Days", "36 Months", "0", etc.
   */
  private parseLockInPeriodToDays(raw: string): number {
    if (!raw || raw === '0' || raw === 'NIL' || raw === 'Nil') return 0;

    const cleaned = raw.trim().toLowerCase();
    const numMatch = cleaned.match(/^(\d+(?:\.\d+)?)/);
    if (!numMatch) return 0;

    const num = parseFloat(numMatch[1]);
    if (num === 0) return 0;

    if (cleaned.includes('year')) return Math.round(num * 365);
    if (cleaned.includes('month')) return Math.round(num * 30);
    if (cleaned.includes('day')) return Math.round(num);

    // If just a number with no unit and > 30, assume days; otherwise assume years
    if (num > 30) return Math.round(num);
    return Math.round(num * 365);
  }

  // ==================== Phase C: Provider Metadata ====================

  /**
   * Populate Provider.logoUrl and Provider.websiteUrl from static map.
   */
  async enrichProviderMetadata(): Promise<{ updated: number }> {
    const providers = await this.prisma.provider.findMany({
      where: {
        OR: [{ logoUrl: null }, { websiteUrl: null }],
      },
      select: { id: true, logoUrl: true, websiteUrl: true },
    });

    let updated = 0;

    for (const provider of providers) {
      const metadata = PROVIDER_METADATA[provider.id];
      if (!metadata) continue;

      const fieldsToUpdate: { logoUrl?: string; websiteUrl?: string } = {};
      if (provider.logoUrl === null) fieldsToUpdate.logoUrl = metadata.logoUrl;
      if (provider.websiteUrl === null) fieldsToUpdate.websiteUrl = metadata.websiteUrl;

      if (Object.keys(fieldsToUpdate).length > 0) {
        await this.prisma.provider.update({
          where: { id: provider.id },
          data: fieldsToUpdate,
        });
        updated++;
      }
    }

    this.logger.log(`Phase C: ${updated} providers updated`);
    return { updated };
  }

  // ==================== Phase D: Risk Ratings ====================

  /**
   * Populate SchemePlanMetrics.riskRating from category-based defaults
   * for all scheme plans where riskRating is currently null.
   *
   * This serves as a fallback when volatility-based risk rating is unavailable
   * (e.g., insufficient NAV history). Once metrics recalculation computes
   * volatility, it will overwrite with the actual volatility-based rating.
   */
  async enrichRiskRatings(): Promise<{ updated: number }> {
    // Find all scheme plans with metrics but no risk rating
    const plans = await this.prisma.schemePlan.findMany({
      where: {
        metrics: {
          riskRating: null,
        },
      },
      select: {
        id: true,
        scheme: {
          select: { categoryId: true },
        },
        metrics: {
          select: { schemePlanId: true },
        },
      },
    });

    // Also find scheme plans with NO metrics record at all
    const plansWithoutMetrics = await this.prisma.schemePlan.findMany({
      where: {
        metrics: null,
      },
      select: {
        id: true,
        scheme: {
          select: { categoryId: true },
        },
      },
    });

    let updated = 0;

    // Update existing metrics records
    for (const plan of plans) {
      const riskRating = CATEGORY_RISK_MAP[plan.scheme.categoryId];
      if (!riskRating) continue;

      await this.prisma.schemePlanMetrics.update({
        where: { schemePlanId: plan.id },
        data: { riskRating },
      });
      updated++;
    }

    // Create metrics records for plans that don't have one
    for (const plan of plansWithoutMetrics) {
      const riskRating = CATEGORY_RISK_MAP[plan.scheme.categoryId];
      if (!riskRating) continue;

      await this.prisma.schemePlanMetrics.create({
        data: {
          schemePlanId: plan.id,
          riskRating,
        },
      });
      updated++;
    }

    this.logger.log(`Phase D: ${updated} risk ratings updated (${plans.length} existing + ${plansWithoutMetrics.length} new metrics)`);
    return { updated };
  }
}
