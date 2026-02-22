import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const AMFI_AUM_URL = 'https://www.amfiindia.com/api/average-aum-schemewise';

interface AmfiAumRow {
  AMFI_Code: string;
  SchemeNAVName: string;
  AverageAumForTheMonth: {
    ExcludingFundOfFundsDomesticButIncludingFundOfFundsOverseas: string;
  };
}

@Injectable()
export class AmfiAumService {
  private readonly logger = new Logger(AmfiAumService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Quarterly AUM sync — runs 15th of Jan/Apr/Jul/Oct at 5 AM IST.
   */
  @Cron('0 5 15 1,4,7,10 *', { timeZone: 'Asia/Kolkata' })
  async scheduledAumSync(): Promise<void> {
    this.logger.log('Scheduled AUM sync triggered');
    try {
      await this.fetchLatestAum();
    } catch (error) {
      this.logger.error(`Scheduled AUM sync failed: ${error.message}`);
    }
  }

  /**
   * Fetch latest AUM data from AMFI API and update SchemePlanMetrics.aum.
   */
  async fetchLatestAum(): Promise<{ total: number; updated: number; unmatched: number }> {
    const syncLog = await this.prisma.dataSyncLog.create({
      data: { syncType: 'amfi_aum', status: 'started' },
    });

    try {
      // Determine current financial year and quarter
      // NOTE: fyId is assumed to be a relative offset (1=most recent FY, 2=previous).
      // Verify by checking actual API response on first run.
      const { fyId, periodId } = this.getCurrentFyAndPeriod();

      // Fetch scheme-wise AUM data
      const url = `${AMFI_AUM_URL}?strType=Categorywise&MF_ID=0&fyId=${fyId}&periodId=${periodId}`;
      this.logger.log(`Fetching AUM data: fyId=${fyId}, periodId=${periodId}, URL=${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`AMFI AUM API returned ${response.status}`);
      }

      const data = await response.json();
      const rows: AmfiAumRow[] = Array.isArray(data) ? data : (data.data || data.Data || []);
      this.logger.log(`Fetched ${rows.length} AUM rows from AMFI`);

      // Pre-load all scheme plans with mfapiSchemeCode for matching
      const schemePlans = await this.prisma.schemePlan.findMany({
        where: { mfapiSchemeCode: { not: null } },
        select: { id: true, mfapiSchemeCode: true },
      });

      // Build scheme code lookup map
      const codeToSchemePlanId = new Map<number, string>();
      for (const sp of schemePlans) {
        if (sp.mfapiSchemeCode) {
          codeToSchemePlanId.set(sp.mfapiSchemeCode, sp.id);
        }
      }

      let updated = 0;
      let unmatched = 0;
      const today = new Date();

      for (const row of rows) {
        const amfiCode = parseInt(row.AMFI_Code, 10);
        if (isNaN(amfiCode)) {
          unmatched++;
          continue;
        }

        const schemePlanId = codeToSchemePlanId.get(amfiCode);
        if (!schemePlanId) {
          unmatched++;
          continue;
        }

        // AMFI scheme-wise AAUM is published in Crores directly
        const aumCrores = parseFloat(
          row.AverageAumForTheMonth?.ExcludingFundOfFundsDomesticButIncludingFundOfFundsOverseas || '0',
        );
        if (isNaN(aumCrores) || aumCrores <= 0) continue;

        try {
          await this.prisma.schemePlanMetrics.upsert({
            where: { schemePlanId },
            update: {
              aum: new Prisma.Decimal(aumCrores),
              aumDate: today,
            },
            create: {
              schemePlanId,
              aum: new Prisma.Decimal(aumCrores),
              aumDate: today,
            },
          });
          updated++;
        } catch (error) {
          this.logger.warn(`Failed to update AUM for ${schemePlanId}: ${error.message}`);
        }
      }

      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          recordsTotal: rows.length,
          recordsSynced: updated,
          recordsFailed: unmatched,
          completedAt: new Date(),
        },
      });

      this.logger.log(`AUM sync complete: ${updated} updated, ${unmatched} unmatched out of ${rows.length}`);
      return { total: rows.length, updated, unmatched };
    } catch (error) {
      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: { status: 'failed', errorMessage: error.message, completedAt: new Date() },
      });
      throw error;
    }
  }

  /**
   * Determine the financial year ID and period ID for AMFI AUM API.
   * Indian FY: April to March. AMFI uses fyId=1 for current FY, periodId=1-4 for quarters.
   * Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
   */
  private getCurrentFyAndPeriod(): { fyId: number; periodId: number } {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed

    // Use previous quarter's data (current quarter isn't published yet)
    // Map month to quarter: 0-2=Q4 (prev FY), 3-5=Q1, 6-8=Q2, 9-11=Q3
    let periodId: number;
    let fyId = 1; // Current FY

    if (month >= 0 && month <= 2) {
      // Jan-Mar → request Q3 (Oct-Dec) data of current FY
      periodId = 3;
    } else if (month >= 3 && month <= 5) {
      // Apr-Jun → request Q4 (Jan-Mar) of previous FY
      periodId = 4;
      fyId = 2; // Previous FY
    } else if (month >= 6 && month <= 8) {
      // Jul-Sep → request Q1 (Apr-Jun) of current FY
      periodId = 1;
    } else {
      // Oct-Dec → request Q2 (Jul-Sep) of current FY
      periodId = 2;
    }

    return { fyId, periodId };
  }
}
