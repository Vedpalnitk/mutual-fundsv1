import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AmfiService, AmfiNavRecord } from './amfi.service';
import { MetricsCalculatorService } from './metrics-calculator.service';
import { Prisma } from '@prisma/client';

/**
 * Fund Sync Service — AMFI-based
 *
 * Synchronizes fund data from the AMFI daily NAV file to the ONDC-compliant database.
 * Replaces the old MFAPI.in + Kuvera approach with a single AMFI source + in-house calculations.
 *
 * Tables populated:
 * - providers (AMC/Fund Houses)
 * - schemes (Parent fund items)
 * - scheme_plans (Individual plans with ISIN)
 * - scheme_plan_nav (Current NAV)
 * - scheme_plan_nav_history (Historical NAV for charts)
 * - data_sync_logs (Sync tracking)
 */

// Map AMFI/MFAPI categories to ONDC L3 category IDs
const CATEGORY_TO_ONDC_L3: Record<string, string> = {
  // Equity
  'Large Cap Fund': 'L3-LARGE_CAP',
  'Large & Mid Cap Fund': 'L3-LARGE_MID_CAP',
  'Mid Cap Fund': 'L3-MID_CAP',
  'Small Cap Fund': 'L3-SMALL_CAP',
  'Multi Cap Fund': 'L3-MULTI_CAP',
  'Flexi Cap Fund': 'L3-FLEXI_CAP',
  'Focused Fund': 'L3-FOCUSED',
  'ELSS': 'L3-ELSS',
  'Value Fund': 'L3-VALUE',
  'Value/Contra Fund': 'L3-VALUE',
  'Contra Fund': 'L3-CONTRA',
  'Dividend Yield Fund': 'L3-DIVIDEND_YIELD',
  'Sectoral/Thematic': 'L3-SECTORAL',
  'Sectoral Fund': 'L3-SECTORAL',
  'Thematic Fund': 'L3-SECTORAL',
  // Debt
  'Liquid Fund': 'L3-LIQUID',
  'Overnight Fund': 'L3-OVERNIGHT',
  'Ultra Short Duration Fund': 'L3-ULTRA_SHORT',
  'Low Duration Fund': 'L3-LOW_DURATION',
  'Money Market Fund': 'L3-MONEY_MARKET',
  'Short Duration Fund': 'L3-SHORT_DURATION',
  'Medium Duration Fund': 'L3-MEDIUM_DURATION',
  'Medium to Long Duration Fund': 'L3-MEDIUM_LONG_DURATION',
  'Long Duration Fund': 'L3-LONG_DURATION',
  'Dynamic Bond Fund': 'L3-DYNAMIC_BOND',
  'Corporate Bond Fund': 'L3-CORPORATE_BOND',
  'Credit Risk Fund': 'L3-CREDIT_RISK',
  'Banking and PSU Fund': 'L3-BANKING_PSU',
  'Gilt Fund': 'L3-GILT',
  'Gilt Fund with 10 year constant duration': 'L3-GILT_10Y',
  'Floater Fund': 'L3-FLOATER',
  // Hybrid
  'Aggressive Hybrid Fund': 'L3-AGGRESSIVE_HYBRID',
  'Conservative Hybrid Fund': 'L3-CONSERVATIVE_HYBRID',
  'Balanced Advantage Fund': 'L3-DYNAMIC_ALLOCATION',
  'Dynamic Asset Allocation': 'L3-DYNAMIC_ALLOCATION',
  'Multi Asset Allocation Fund': 'L3-MULTI_ASSET',
  'Arbitrage Fund': 'L3-ARBITRAGE',
  'Equity Savings Fund': 'L3-EQUITY_SAVINGS',
  // Solution Oriented
  'Retirement Fund': 'L3-RETIREMENT',
  "Children's Fund": 'L3-CHILDRENS',
  // Other
  'Index Fund': 'L3-INDEX',
  'ETF': 'L3-INDEX',
  'Index Funds': 'L3-INDEX',
  'Fund of Funds (Overseas)': 'L3-FOF_OVERSEAS',
  'Fund of Funds (Domestic)': 'L3-FOF_DOMESTIC',
  'Gold': 'L3-GOLD',
  'Gold ETF': 'L3-GOLD',
};

// Curated ~500 popular Direct Growth fund scheme codes
const POPULAR_SCHEME_CODES = new Set([
  // ============= LARGE CAP (10 funds) =============
  120586, 118531, 119308, 120465, 120490, 118479, 118641, 119148, 119528, 120656,
  // ============= LARGE & MID CAP (8 funds) =============
  118510, 119350, 120596, 120665, 118834, 119202, 120158, 130498,
  // ============= FLEXI CAP (10 funds) =============
  120564, 120166, 119291, 120492, 118883, 120662, 120757, 118535, 120046, 120843,
  // ============= MULTI CAP (8 funds) =============
  118650, 119354, 120413, 120599, 119451, 118651, 119464, 131164,
  // ============= MID CAP (10 funds) =============
  120505, 119807, 118533, 119071, 120381, 120726, 119909, 118665, 120002, 125307,
  // ============= SMALL CAP (10 funds) =============
  120591, 120828, 118525, 119589, 119869, 120069, 120164, 120077, 125354, 130503,
  // ============= ELSS / TAX SAVER (8 funds) =============
  120503, 119871, 120079, 119773, 118540, 120592, 118946, 120494,
  // ============= FOCUSED (6 funds) =============
  120488, 120722, 118564, 119564, 120834, 127919,
  // ============= VALUE / CONTRA (6 funds) =============
  120699, 120751, 119231, 120386, 118784, 119404,
  // ============= SECTORAL - BANKING & FINANCIAL (5 funds) =============
  118588, 120244, 120733, 134017, 143353,
  // ============= SECTORAL - IT & TECHNOLOGY (5 funds) =============
  118758, 120782, 143783, 145454, 147409,
  // ============= SECTORAL - INFRASTRUCTURE (5 funds) =============
  118469, 118762, 118773, 118879, 119243,
  // ============= BALANCED ADVANTAGE (8 funds) =============
  120377, 120679, 118543, 119298, 120042, 120088, 134110, 134150,
  // ============= AGGRESSIVE HYBRID (6 funds) =============
  120484, 120674, 118546, 119019, 120261, 125711,
  // ============= CONSERVATIVE HYBRID (5 funds) =============
  120073, 120082, 118726, 119156, 119389,
  // ============= EQUITY SAVINGS (4 funds) =============
  120156, 120355, 119789, 120571,
  // ============= ARBITRAGE (4 funds) =============
  120179, 120421, 119224, 119501,
  // ============= MULTI ASSET ALLOCATION (5 funds) =============
  120160, 120524, 120760, 119208, 119572,
  // ============= CORPORATE BOND (6 funds) =============
  120497, 120692, 118807, 119104, 119479, 133791,
  // ============= BANKING & PSU (6 funds) =============
  120256, 120338, 120438, 119625, 119795, 121268,
  // ============= SHORT DURATION (6 funds) =============
  120458, 120510, 120525, 118796, 119379, 120541,
  // ============= LIQUID (6 funds) =============
  120104, 120123, 118610, 118636, 119091, 119303,
  // ============= OVERNIGHT (4 funds) =============
  120557, 120785, 145536, 145810,
  // ============= GOLD (5 funds) =============
  120531, 120685, 118604, 119344, 120000,
  // ============= INDEX - NIFTY 50 (6 funds) =============
  120307, 120716, 118482, 118741, 141877, 146376,
  // ============= INDEX - SENSEX (3 funds) =============
  118791, 120306, 120308,
  // ============= INTERNATIONAL (5 funds) =============
  118518, 118742, 118770, 119271, 120043,
  // ============= EXTENDED CATEGORY FUNDS =============
  // Large Cap
  118617, 118632, 118633, 118643, 118825, 118870, 119018, 119160, 119250, 119367,
  119893, 119914, 120030, 120100, 120152, 120267, 134001, 134134, 134413, 138312,
  // Large & Mid Cap
  118419, 118675, 118678, 119218, 119397, 119436, 119566, 120357, 120826, 133710,
  135677, 140175, 145110, 146772, 147704, 147750, 147840,
  // Mid Cap
  118668, 118872, 118989, 119178, 119182, 119581, 119620, 119775, 120297, 120403,
  120841, 127042, 133144, 138950, 140228, 140461, 141950, 142110, 144315, 147445,
  // Small Cap
  118777, 118778, 119212, 119556, 120828, 125497, 129649, 132985, 134297, 134373,
  141475, 141499, 141561, 142533, 143010, 143226, 143506, 144437, 144728, 144988,
  // Flexi Cap
  118424, 118955, 119076, 119292, 120264, 122639, 128236, 129046, 133839, 140353,
  141925, 143793, 144546, 144905, 148404, 148642, 148990, 149094, 149104, 149450,
  // Multi Cap
  119452, 119988, 141226, 143828, 144200, 147183, 149185, 149368, 149383, 149533,
  149668, 149669, 149882, 150659, 150858, 151232, 151290,
  // ELSS
  111549, 118473, 118620, 118803, 118866, 119060, 119242, 119307, 119351, 119417,
  119544, 119661, 119916, 120147, 120270, 120416, 120715, 120847, 126279, 131739,
  132756, 133324,
  // Focused
  118421, 118692, 118927, 118950, 119096, 120468, 122389, 126639, 131526, 131580,
  133105, 133529, 133897, 134334, 135351, 141813, 141920, 145376, 147206,
  // Value / Contra
  103490, 118481, 118494, 118935, 119323, 119549, 119659, 119769, 120323, 120348,
  120486, 120759, 123012, 133320,
  // Hybrid extended
  118615, 118736, 118737, 118968, 119482, 120333, 126393, 131355,
  118485, 118624, 118794, 119053, 120819,
  118486, 118491,
  // Balanced Advantage extended
  139872, 140357, 141642, 142038, 144335, 145396, 146010, 147406, 148026,
  // Arbitrage extended
  118561, 118735, 119700, 120680, 133727, 145012,
  // Debt extended
  118814, 118987, 119621, 119984,
  119400, 120062, 120560,
  // Liquid extended
  103734, 118345, 118364, 118701, 118857, 118859, 118893, 119135, 119164, 119173,
  119181, 119360, 119369, 119766, 119790, 119861, 119905, 120038, 120197,
  // Index extended
  118347, 118581, 147794, 148360, 149803, 151769, 152422, 129725, 148726, 148807,
  149343, 148519, 148815, 149283, 149894, 150677, 118266, 118348, 118545, 120684,
  126455,
  // Sectoral extended
  118589, 118868, 119333, 125597, 135793,
  118759, 135810, 146517,
  118763, 118774, 118722, 118724, 118837, 119595, 120587,
  // International extended
  102987, 118519, 118785, 118831, 118874, 118876, 118881, 118885, 118889, 118958,
  119000, 119420, 119578, 119977, 120017, 120027, 120340, 120345, 120461, 133115,
  // Gold extended
  115132, 118301, 118606, 118663, 119781, 120473, 133816, 150581, 150714, 151974,
  // Money Market
  118384, 118506, 118715, 118719, 119092, 119424, 119431, 119746, 120211, 120507,
  120845, 140237, 143597, 145050, 147377,
  // Overnight extended
  119110, 119283, 146062, 146141, 146191, 146675, 146963, 146980, 147003, 147125,
  147196, 147214, 147287, 147450, 147515, 147564,
  // Gilt
  118297, 118341, 118427, 118464, 118631, 118672, 118887, 119054, 119099, 119114,
  119116, 119341, 119425, 119603, 119757, 119759, 119762, 119859, 119944, 119966,
  // Retirement / Children
  118548, 119251, 119255, 119256, 133568, 133569, 135749, 135751, 135753, 136465,
  118521, 118523, 119312, 120285, 135762, 135764, 148490, 152219,
]);

function extractPlanType(schemeName: string): 'direct' | 'regular' {
  return schemeName.toLowerCase().includes('direct') ? 'direct' : 'regular';
}

function extractOptionType(schemeName: string): 'growth' | 'idcw' {
  const name = schemeName.toLowerCase();
  if (name.includes('dividend') || name.includes('idcw') || name.includes('payout')) return 'idcw';
  return 'growth';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

@Injectable()
export class FundSyncService implements OnModuleInit {
  private readonly logger = new Logger(FundSyncService.name);
  private isSyncing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly amfiService: AmfiService,
    private readonly metricsCalculator: MetricsCalculatorService,
  ) {}

  async onModuleInit() {
    const schemeCount = await this.prisma.scheme.count();
    if (schemeCount === 0) {
      this.logger.log('No schemes found, starting initial AMFI sync in background...');
      this.syncFromAmfi().catch(err => {
        this.logger.error(`Initial AMFI sync failed: ${err.message}`);
      });
    }
  }

  /**
   * Daily NAV update cron — runs Mon-Fri at 00:30 IST (AMFI file updates ~23:30 IST).
   */
  @Cron('0 30 0 * * 1-5', { timeZone: 'Asia/Kolkata' })
  async dailyNavUpdate(): Promise<void> {
    this.logger.log('Daily NAV update cron triggered');

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.syncFromAmfi();
        return;
      } catch (error) {
        this.logger.error(`Daily NAV update attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 min backoff
        }
      }
    }

    this.logger.error('Daily NAV update failed after all retries');
  }

  /**
   * Full AMFI ingest: download NAVAll.txt, filter to curated funds, upsert everything.
   */
  async syncFromAmfi(): Promise<{ synced: number; failed: number; total: number }> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress');
      return { synced: 0, failed: 0, total: 0 };
    }

    this.isSyncing = true;
    const syncLog = await this.startSyncLog('amfi_nav');

    try {
      // 1. Fetch and parse the AMFI file
      const allRecords = await this.amfiService.fetchAndParseNavAll();
      const directGrowth = this.amfiService.filterDirectGrowth(allRecords);

      // 2. Filter to popular curated funds
      const matched = directGrowth.filter(r => POPULAR_SCHEME_CODES.has(r.schemeCode));
      this.logger.log(`AMFI: ${allRecords.length} total → ${directGrowth.length} direct-growth → ${matched.length} curated matches`);

      // 3. Check if AMFI date is same as last sync (holiday/weekend skip)
      if (matched.length > 0) {
        const lastSync = await this.prisma.dataSyncLog.findFirst({
          where: { syncType: 'amfi_nav', status: 'completed' },
          orderBy: { completedAt: 'desc' },
        });

        if (lastSync?.completedAt) {
          const lastSyncDate = lastSync.completedAt.toISOString().slice(0, 10);
          const amfiDate = matched[0].navDate.toISOString().slice(0, 10);
          if (lastSyncDate === amfiDate) {
            this.logger.log(`AMFI date ${amfiDate} matches last sync — skipping (holiday/weekend)`);
            await this.completeSyncLog(syncLog.id, matched.length, 0, 0);
            return { synced: 0, failed: 0, total: matched.length };
          }
        }
      }

      // 4. Sync each record
      let synced = 0;
      let failed = 0;

      for (const record of matched) {
        try {
          await this.syncAmfiRecord(record);
          synced++;
        } catch (error) {
          this.logger.debug(`Failed to sync ${record.schemeCode}: ${error.message}`);
          failed++;
        }
      }

      await this.completeSyncLog(syncLog.id, matched.length, synced, failed);
      this.logger.log(`AMFI sync completed: ${synced} synced, ${failed} failed`);

      // 5. Recalculate metrics after NAV update
      try {
        await this.metricsCalculator.recalculateAll();
      } catch (error) {
        this.logger.error(`Metrics recalculation failed: ${error.message}`);
      }

      return { synced, failed, total: matched.length };
    } catch (error) {
      await this.failSyncLog(syncLog.id, error.message);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    lastSync: any;
    counts: { providers: number; schemes: number; schemePlans: number; navHistoryRows: number };
  }> {
    const lastSync = await this.prisma.dataSyncLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    const [providers, schemes, schemePlans, navHistoryRows] = await Promise.all([
      this.prisma.provider.count(),
      this.prisma.scheme.count(),
      this.prisma.schemePlan.count(),
      this.prisma.schemePlanNavHistory.count(),
    ]);

    return {
      isSyncing: this.isSyncing,
      lastSync,
      counts: { providers, schemes, schemePlans, navHistoryRows },
    };
  }

  // ============= Private Methods =============

  /**
   * Sync a single AMFI NAV record to the database.
   */
  private async syncAmfiRecord(record: AmfiNavRecord): Promise<void> {
    // 1. Upsert Provider (Fund House)
    const providerId = slugify(record.fundHouse);
    await this.prisma.provider.upsert({
      where: { id: providerId },
      update: { name: record.fundHouse },
      create: {
        id: providerId,
        name: record.fundHouse,
        shortName: this.extractShortName(record.fundHouse),
      },
    });

    // 2. Map category to ONDC L3
    const categoryId = this.mapCategoryToOndcL3(record.schemeCategory);

    // 3. Create base scheme name (without plan/option)
    const baseSchemeName = this.extractBaseSchemeName(record.schemeName);
    const schemeId = `${providerId}-${slugify(baseSchemeName)}`;

    // 4. Upsert Scheme
    await this.prisma.scheme.upsert({
      where: { id: schemeId },
      update: {
        name: baseSchemeName,
        categoryId,
        mfapiSchemeCode: record.schemeCode,
      },
      create: {
        id: schemeId,
        providerId,
        name: baseSchemeName,
        categoryId,
        mfapiSchemeCode: record.schemeCode,
      },
    });

    // 5. Upsert Scheme Plan
    const planType = extractPlanType(record.schemeName);
    const optionType = extractOptionType(record.schemeName);
    const isin = record.isinGrowth || record.isinReinvestment || `TEMP-${record.schemeCode}`;
    const schemePlanId = `${schemeId}-${planType}-${optionType}`;

    await this.prisma.schemePlan.upsert({
      where: { id: schemePlanId },
      update: {
        name: record.schemeName,
        isin,
        mfapiSchemeCode: record.schemeCode,
      },
      create: {
        id: schemePlanId,
        schemeId,
        name: record.schemeName,
        isin,
        rtaIdentifier: `AMFI-${record.schemeCode}`,
        plan: planType,
        option: optionType,
        mfapiSchemeCode: record.schemeCode,
      },
    });

    // 6. Compute day change from previous NAV in history
    const previousNav = await this.prisma.schemePlanNavHistory.findFirst({
      where: { schemePlanId },
      orderBy: { navDate: 'desc' },
      select: { nav: true },
    });

    const prevNavValue = previousNav ? Number(previousNav.nav) : record.nav;
    const dayChange = record.nav - prevNavValue;
    const dayChangePct = prevNavValue > 0 ? (dayChange / prevNavValue) * 100 : 0;

    // 7. Upsert current NAV
    await this.prisma.schemePlanNav.upsert({
      where: { schemePlanId },
      update: {
        nav: new Prisma.Decimal(record.nav),
        navDate: record.navDate,
        dayChange: new Prisma.Decimal(dayChange),
        dayChangePct: new Prisma.Decimal(dayChangePct),
      },
      create: {
        schemePlanId,
        nav: new Prisma.Decimal(record.nav),
        navDate: record.navDate,
        dayChange: new Prisma.Decimal(dayChange),
        dayChangePct: new Prisma.Decimal(dayChangePct),
      },
    });

    // 8. Insert NAV history row for today (skip duplicates)
    await this.prisma.schemePlanNavHistory.upsert({
      where: {
        schemePlanId_navDate: {
          schemePlanId,
          navDate: record.navDate,
        },
      },
      update: { nav: new Prisma.Decimal(record.nav) },
      create: {
        schemePlanId,
        navDate: record.navDate,
        nav: new Prisma.Decimal(record.nav),
      },
    });
  }

  /**
   * Map AMFI category to ONDC L3 category ID
   */
  private mapCategoryToOndcL3(category: string): string {
    if (CATEGORY_TO_ONDC_L3[category]) {
      return CATEGORY_TO_ONDC_L3[category];
    }

    for (const [key, value] of Object.entries(CATEGORY_TO_ONDC_L3)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    const lower = category.toLowerCase();
    if (lower.includes('large') && lower.includes('mid')) return 'L3-LARGE_MID_CAP';
    if (lower.includes('large')) return 'L3-LARGE_CAP';
    if (lower.includes('mid')) return 'L3-MID_CAP';
    if (lower.includes('small')) return 'L3-SMALL_CAP';
    if (lower.includes('flexi')) return 'L3-FLEXI_CAP';
    if (lower.includes('multi')) return 'L3-MULTI_CAP';
    if (lower.includes('elss') || lower.includes('tax')) return 'L3-ELSS';
    if (lower.includes('liquid')) return 'L3-LIQUID';
    if (lower.includes('overnight')) return 'L3-OVERNIGHT';
    if (lower.includes('gilt')) return 'L3-GILT';
    if (lower.includes('hybrid') || lower.includes('balanced')) return 'L3-AGGRESSIVE_HYBRID';
    if (lower.includes('index') || lower.includes('etf')) return 'L3-INDEX';
    if (lower.includes('gold')) return 'L3-GOLD';

    return 'L3-OTHER';
  }

  /**
   * Extract base scheme name (without plan/option suffixes)
   */
  private extractBaseSchemeName(fullName: string): string {
    return fullName
      .replace(/\s*-?\s*(Direct|Regular)\s*(Plan)?/gi, '')
      .replace(/\s*-?\s*(Growth|Dividend|IDCW|Payout|Reinvestment)\s*(Option)?/gi, '')
      .replace(/\s*-?\s*Plan\s*$/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract short name from fund house
   */
  private extractShortName(fundHouse: string): string {
    const patterns = [
      /^(\w+)\s+Mutual\s+Fund$/i,
      /^(\w+)\s+Asset\s+Management$/i,
      /^(\w+)\s+AMC$/i,
    ];

    for (const pattern of patterns) {
      const match = fundHouse.match(pattern);
      if (match) return match[1];
    }

    return fundHouse.split(' ')[0];
  }

  // ============= Sync Log Methods =============

  private async startSyncLog(syncType: string) {
    return this.prisma.dataSyncLog.create({
      data: {
        syncType,
        status: 'started',
      },
    });
  }

  private async completeSyncLog(id: number, total: number, synced: number, failed: number) {
    return this.prisma.dataSyncLog.update({
      where: { id },
      data: {
        status: 'completed',
        recordsTotal: total,
        recordsSynced: synced,
        recordsFailed: failed,
        completedAt: new Date(),
      },
    });
  }

  private async failSyncLog(id: number, errorMessage: string) {
    return this.prisma.dataSyncLog.update({
      where: { id },
      data: {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      },
    });
  }
}
