import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BatchJobsTracker } from '../common/batch-jobs.tracker';

@Injectable()
export class AumSnapshotScheduler {
  private readonly logger = new Logger(AumSnapshotScheduler.name);

  constructor(
    private prisma: PrismaService,
    private tracker: BatchJobsTracker,
  ) {}

  /**
   * Daily cron at 11 PM IST (5:30 PM UTC).
   * Aggregates FAHoldings into AUMSnapshot for each advisor.
   */
  @Cron('30 17 * * *') // 17:30 UTC = 23:00 IST
  async captureDaily() {
    this.logger.log('Starting daily AUM snapshot capture...');

    await this.tracker.trackRun('aum_snapshot', async () => {
      // Get all advisors who have clients
      const advisors = await this.prisma.fAClient.groupBy({
        by: ['advisorId'],
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let synced = 0;
      let failed = 0;
      for (const { advisorId } of advisors) {
        try {
          await this.captureForAdvisor(advisorId, today);
          synced++;
        } catch (err) {
          failed++;
          this.logger.warn(`Failed snapshot for advisor ${advisorId}: ${err}`);
        }
      }

      this.logger.log(`Completed AUM snapshots for ${advisors.length} advisors`);
      return { total: advisors.length, synced, failed };
    }).catch(err => {
      this.logger.error('AUM snapshot cron failed', err);
    });
  }

  async captureForAdvisor(advisorId: string, date: Date) {
    // Get all holdings for advisor's clients
    const holdings = await this.prisma.fAHolding.findMany({
      where: { client: { advisorId } },
    });

    // Aggregate by asset class
    let totalAum = 0, equityAum = 0, debtAum = 0, hybridAum = 0;
    for (const h of holdings) {
      const val = Number(h.currentValue || 0);
      totalAum += val;
      const cls = (h.assetClass || h.fundCategory || '').toUpperCase();
      if (cls.includes('EQUITY') || cls.includes('ELSS')) equityAum += val;
      else if (cls.includes('DEBT') || cls.includes('LIQUID') || cls.includes('MONEY')) debtAum += val;
      else if (cls.includes('HYBRID') || cls.includes('BALANCED')) hybridAum += val;
      else equityAum += val; // default
    }

    // Count active clients
    const clientCount = await this.prisma.fAClient.count({
      where: { advisorId, status: 'ACTIVE' },
    });

    // SIP book size
    const sips = await this.prisma.fASIP.findMany({
      where: { client: { advisorId }, status: 'ACTIVE' },
    });
    const sipBookSize = sips.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Net flows = purchases - redemptions this month
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const txns = await this.prisma.fATransaction.findMany({
      where: {
        client: { advisorId },
        date: { gte: monthStart, lte: date },
        status: 'COMPLETED',
      },
    });
    let purchases = 0, redemptions = 0;
    for (const t of txns) {
      const amt = Number(t.amount || 0);
      if (['BUY', 'SIP'].includes(t.type)) purchases += amt;
      if (['SELL', 'SWP'].includes(t.type)) redemptions += amt;
    }
    const netFlows = purchases - redemptions;

    await this.prisma.aUMSnapshot.upsert({
      where: { advisorId_date: { advisorId, date } },
      update: { totalAum, equityAum, debtAum, hybridAum, clientCount, sipBookSize, netFlows },
      create: { advisorId, date, totalAum, equityAum, debtAum, hybridAum, clientCount, sipBookSize, netFlows },
    });
  }
}
