import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AumSnapshotScheduler } from './aum-snapshot.scheduler';

@Injectable()
export class BusinessIntelligenceService {
  constructor(
    private prisma: PrismaService,
    private snapshotScheduler: AumSnapshotScheduler,
  ) {}

  // ============= AUM ANALYTICS =============

  async getAumOverview(advisorId: string) {
    const holdings = await this.prisma.fAHolding.findMany({
      where: { client: { advisorId } },
      include: { client: { select: { id: true, name: true } } },
    });

    let totalAum = 0, equityAum = 0, debtAum = 0, hybridAum = 0;
    const amcAum = new Map<string, number>();
    const categoryAum = new Map<string, number>();

    for (const h of holdings) {
      const val = Number(h.currentValue || 0);
      totalAum += val;

      const cls = (h.assetClass || h.fundCategory || 'EQUITY').toUpperCase();
      if (cls.includes('EQUITY') || cls.includes('ELSS')) equityAum += val;
      else if (cls.includes('DEBT') || cls.includes('LIQUID') || cls.includes('MONEY')) debtAum += val;
      else if (cls.includes('HYBRID') || cls.includes('BALANCED')) hybridAum += val;
      else equityAum += val;

      const category = h.fundCategory || h.assetClass || 'Other';
      categoryAum.set(category, (categoryAum.get(category) || 0) + val);
    }

    return {
      totalAum,
      equityAum,
      debtAum,
      hybridAum,
      otherAum: totalAum - equityAum - debtAum - hybridAum,
      byCategory: Object.fromEntries(
        [...categoryAum.entries()].sort((a, b) => b[1] - a[1]),
      ),
    };
  }

  async getAumByBranch(advisorId: string) {
    const clients = await this.prisma.fAClient.findMany({
      where: { advisorId },
      include: {
        holdings: true,
        assignedRm: {
          include: { branch: true },
        },
      },
    });

    const branchAum = new Map<string, { name: string; aum: number; clientCount: number }>();
    for (const c of clients) {
      const branchName = c.assignedRm?.branch?.name || 'Unassigned';
      const aum = c.holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0);
      const existing = branchAum.get(branchName) || { name: branchName, aum: 0, clientCount: 0 };
      existing.aum += aum;
      existing.clientCount += 1;
      branchAum.set(branchName, existing);
    }

    return [...branchAum.values()].sort((a, b) => b.aum - a.aum);
  }

  async getAumByRm(advisorId: string) {
    const clients = await this.prisma.fAClient.findMany({
      where: { advisorId, assignedRmId: { not: null } },
      include: {
        holdings: true,
        assignedRm: { select: { id: true, displayName: true } },
      },
    });

    const rmAum = new Map<string, { id: string; name: string; aum: number; clientCount: number }>();
    for (const c of clients) {
      if (!c.assignedRm) continue;
      const key = c.assignedRm.id;
      const aum = c.holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0);
      const existing = rmAum.get(key) || { id: key, name: c.assignedRm.displayName, aum: 0, clientCount: 0 };
      existing.aum += aum;
      existing.clientCount += 1;
      rmAum.set(key, existing);
    }

    return [...rmAum.values()].sort((a, b) => b.aum - a.aum);
  }

  async getAumByClient(advisorId: string, topN = 20) {
    const clients = await this.prisma.fAClient.findMany({
      where: { advisorId },
      include: { holdings: true },
    });

    const result = clients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      aum: c.holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0),
      holdingsCount: c.holdings.length,
    }));

    result.sort((a, b) => b.aum - a.aum);
    return result.slice(0, topN);
  }

  // ============= AUM SNAPSHOTS (TRENDS) =============

  async getAumSnapshots(advisorId: string, days = 90) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const snapshots = await this.prisma.aUMSnapshot.findMany({
      where: {
        advisorId,
        date: { gte: from },
      },
      orderBy: { date: 'asc' },
    });

    return snapshots.map(s => ({
      date: s.date.toISOString().split('T')[0],
      totalAum: Number(s.totalAum),
      equityAum: Number(s.equityAum),
      debtAum: Number(s.debtAum),
      hybridAum: Number(s.hybridAum),
      clientCount: s.clientCount,
      sipBookSize: Number(s.sipBookSize),
      netFlows: Number(s.netFlows),
    }));
  }

  // ============= NET FLOWS =============

  async getNetFlows(advisorId: string, months = 6) {
    const results: { period: string; purchases: number; redemptions: number; net: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const period = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const txns = await this.prisma.fATransaction.findMany({
        where: {
          client: { advisorId },
          date: { gte: start, lte: end },
          status: 'COMPLETED',
        },
      });

      let purchases = 0, redemptions = 0;
      for (const t of txns) {
        const amt = Number(t.amount || 0);
        if (['BUY', 'SIP'].includes(t.type)) purchases += amt;
        if (['SELL', 'SWP'].includes(t.type)) redemptions += amt;
      }

      results.push({ period, purchases, redemptions, net: purchases - redemptions });
    }

    return results;
  }

  // ============= SIP HEALTH =============

  async getSipHealth(advisorId: string) {
    const sips = await this.prisma.fASIP.findMany({
      where: { client: { advisorId } },
    });

    const active = sips.filter(s => s.status === 'ACTIVE');
    const paused = sips.filter(s => s.status === 'PAUSED');
    const cancelled = sips.filter(s => s.status === 'CANCELLED');

    const totalMonthly = active.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Check for mandate expiry (SIPs with end dates within 30 days)
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const expiringCount = active.filter(s => s.endDate && s.endDate <= thirtyDays).length;

    return {
      total: sips.length,
      active: active.length,
      paused: paused.length,
      cancelled: cancelled.length,
      totalMonthlyAmount: totalMonthly,
      mandateExpiringCount: expiringCount,
    };
  }

  // ============= REVENUE PROJECTION =============

  async getRevenueProjection(advisorId: string) {
    // Get current trail rates
    const rates = await this.prisma.commissionRateMaster.findMany({
      where: {
        advisorId,
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      include: { amc: { select: { name: true } } },
    });

    // Get current AUM
    const overview = await this.getAumOverview(advisorId);

    // Average weighted trail rate
    const avgTrailRate = rates.length > 0
      ? rates.reduce((sum, r) => sum + Number(r.trailRatePercent), 0) / rates.length
      : 0.5; // default 0.5%

    // 12-month projection
    const projections: { period: string; projectedAum: number; projectedTrail: number }[] = [];
    const now = new Date();
    const monthlyTrail = (overview.totalAum * avgTrailRate) / 100 / 12;

    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const period = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      // Simple projection assuming 1% monthly AUM growth
      const growthFactor = Math.pow(1.01, i);
      projections.push({
        period,
        projectedAum: Math.round(overview.totalAum * growthFactor),
        projectedTrail: Math.round(monthlyTrail * growthFactor * 100) / 100,
      });
    }

    return {
      currentAum: overview.totalAum,
      avgTrailRate,
      currentMonthlyTrail: monthlyTrail,
      annual12MProjection: projections.reduce((sum, p) => sum + p.projectedTrail, 0),
      projections,
    };
  }

  // ============= CLIENT CONCENTRATION =============

  async getClientConcentration(advisorId: string, topN = 10) {
    const topClients = await this.getAumByClient(advisorId, topN);
    const overview = await this.getAumOverview(advisorId);

    const topAum = topClients.reduce((sum, c) => sum + c.aum, 0);
    const concentrationPct = overview.totalAum > 0
      ? Math.round((topAum / overview.totalAum) * 10000) / 100
      : 0;

    return {
      totalAum: overview.totalAum,
      topN,
      topNAum: topAum,
      concentrationPercent: concentrationPct,
      clients: topClients.map((c, idx) => ({
        ...c,
        rank: idx + 1,
        percentOfTotal: overview.totalAum > 0
          ? Math.round((c.aum / overview.totalAum) * 10000) / 100
          : 0,
        cumulativePercent: overview.totalAum > 0
          ? Math.round((topClients.slice(0, idx + 1).reduce((s, x) => s + x.aum, 0) / overview.totalAum) * 10000) / 100
          : 0,
      })),
    };
  }

  // ============= DORMANT CLIENTS =============

  async getDormantClients(advisorId: string) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 12);

    const clients = await this.prisma.fAClient.findMany({
      where: {
        advisorId,
        status: 'ACTIVE',
        transactions: {
          none: { date: { gte: cutoff } },
        },
      },
      include: {
        holdings: true,
        transactions: { orderBy: { date: 'desc' }, take: 1 },
      },
    });

    return clients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      aum: c.holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0),
      lastTransactionDate: c.transactions[0]?.date?.toISOString().split('T')[0] || null,
      daysSinceLastTxn: c.transactions[0]?.date
        ? Math.ceil((Date.now() - c.transactions[0].date.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));
  }

  // ============= TRIGGER SNAPSHOT (manual) =============

  async triggerSnapshot(advisorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.snapshotScheduler.captureForAdvisor(advisorId, today);
    return { success: true, date: today.toISOString().split('T')[0] };
  }
}
