import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const AMFI_TER_URL = 'https://www.amfiindia.com/api/populate-te-rdata-revised';

interface AmfiTerRow {
  NSDLSchemeCode: string;
  Scheme_Name: string;
  R_TER: string;
  D_TER: string;
  TER_Date: string;
}

@Injectable()
export class AmfiTerService {
  private readonly logger = new Logger(AmfiTerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Monthly TER sync — runs 1st of every month at 4 AM IST.
   */
  @Cron('0 4 1 * *', { timeZone: 'Asia/Kolkata' })
  async scheduledTerSync(): Promise<void> {
    this.logger.log('Scheduled TER sync triggered');
    try {
      await this.fetchLatestTer();
    } catch (error) {
      this.logger.error(`Scheduled TER sync failed: ${error.message}`);
    }
  }

  /**
   * Fetch latest TER data from AMFI API and update SchemePlanMetrics.expenseRatio.
   */
  async fetchLatestTer(): Promise<{ total: number; updated: number; unmatched: number }> {
    const syncLog = await this.prisma.dataSyncLog.create({
      data: { syncType: 'amfi_ter', status: 'started' },
    });

    try {
      // Determine current month string (MM-YYYY)
      const now = new Date();
      const monthStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

      // Fetch all TER data (paginated)
      const allRows = await this.fetchAllTerPages(monthStr);
      this.logger.log(`Fetched ${allRows.length} TER rows from AMFI for ${monthStr}`);

      if (allRows.length === 0) {
        // Try previous month if current month data isn't available yet
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthStr = `${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${prevMonth.getFullYear()}`;
        const prevRows = await this.fetchAllTerPages(prevMonthStr);
        if (prevRows.length > 0) {
          this.logger.log(`Current month empty, using previous month ${prevMonthStr}: ${prevRows.length} rows`);
          allRows.push(...prevRows);
        }
      }

      // Pre-load all scheme plans with ISIN for matching
      const schemePlans = await this.prisma.schemePlan.findMany({
        select: { id: true, isin: true, plan: true, name: true },
      });

      // Build ISIN lookup map
      const isinToSchemePlan = new Map<string, { id: string; plan: string }>();
      for (const sp of schemePlans) {
        isinToSchemePlan.set(sp.isin, { id: sp.id, plan: sp.plan });
      }

      let updated = 0;
      let unmatched = 0;

      for (const row of allRows) {
        const nsdlCode = row.NSDLSchemeCode?.trim();
        if (!nsdlCode) {
          unmatched++;
          continue;
        }

        // Match by NSDLSchemeCode → SchemePlan.isin
        const matchedPlan = isinToSchemePlan.get(nsdlCode);
        if (!matchedPlan) {
          unmatched++;
          continue;
        }

        // Pick correct TER based on plan type (direct → D_TER, regular → R_TER)
        let terStr: string | undefined;
        if (matchedPlan.plan === 'direct') {
          terStr = row.D_TER;
        } else if (matchedPlan.plan === 'regular') {
          terStr = row.R_TER;
        } else {
          // Retail/institutional plans — try direct first, fall back to regular
          terStr = row.D_TER || row.R_TER;
        }

        const ter = parseFloat(terStr || '');
        if (isNaN(ter) || ter < 0) continue;

        try {
          await this.prisma.schemePlanMetrics.upsert({
            where: { schemePlanId: matchedPlan.id },
            update: { expenseRatio: new Prisma.Decimal(ter) },
            create: {
              schemePlanId: matchedPlan.id,
              expenseRatio: new Prisma.Decimal(ter),
            },
          });
          updated++;
        } catch (error) {
          this.logger.warn(`Failed to update TER for ${matchedPlan.id}: ${error.message}`);
        }
      }

      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          recordsTotal: allRows.length,
          recordsSynced: updated,
          recordsFailed: unmatched,
          completedAt: new Date(),
        },
      });

      this.logger.log(`TER sync complete: ${updated} updated, ${unmatched} unmatched out of ${allRows.length}`);
      return { total: allRows.length, updated, unmatched };
    } catch (error) {
      await this.prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: { status: 'failed', errorMessage: error.message, completedAt: new Date() },
      });
      throw error;
    }
  }

  /**
   * Paginate through AMFI TER API and collect all rows.
   */
  private async fetchAllTerPages(monthStr: string): Promise<AmfiTerRow[]> {
    const allRows: AmfiTerRow[] = [];
    const pageSize = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `${AMFI_TER_URL}?MF_ID=All&Month=${monthStr}&strCat=-1&strType=-1&page=${page}&pageSize=${pageSize}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          this.logger.warn(`AMFI TER API returned ${response.status} for page ${page}`);
          break;
        }

        const data = await response.json();

        // AMFI API may return array directly or wrapped in an object
        const rows: AmfiTerRow[] = Array.isArray(data) ? data : (data.data || data.Data || []);

        if (rows.length === 0) {
          hasMore = false;
        } else {
          allRows.push(...rows);
          // If fewer rows than pageSize, this is the last page
          if (rows.length < pageSize) {
            hasMore = false;
          } else {
            page++;
            // Safety limit to prevent infinite pagination
            if (page > 500) {
              this.logger.warn('TER pagination safety limit reached at page 500');
              break;
            }
          }
        }
      } catch (error) {
        this.logger.error(`TER fetch failed on page ${page}: ${error.message}`);
        break;
      }
    }

    return allRows;
  }
}
