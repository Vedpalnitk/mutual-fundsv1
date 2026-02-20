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

  // ============= MONTHLY SCORECARD =============

  async getMonthlyScorecard(advisorId: string) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const period = `${currentMonthStart.getFullYear()}-${String(currentMonthStart.getMonth() + 1).padStart(2, '0')}`;
    const prevPeriod = `${prevMonthStart.getFullYear()}-${String(prevMonthStart.getMonth() + 1).padStart(2, '0')}`;

    // Get latest and previous month AUM snapshots
    const [latestSnap, prevSnap] = await Promise.all([
      this.prisma.aUMSnapshot.findFirst({
        where: { advisorId, date: { gte: currentMonthStart } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.aUMSnapshot.findFirst({
        where: { advisorId, date: { gte: prevMonthStart, lte: prevMonthEnd } },
        orderBy: { date: 'desc' },
      }),
    ]);

    // Fallback: compute current AUM from holdings if no snapshot
    let currentAum = latestSnap ? Number(latestSnap.totalAum) : 0;
    let currentSipBook = latestSnap ? Number(latestSnap.sipBookSize) : 0;
    let currentClientCount = latestSnap ? latestSnap.clientCount : 0;
    let currentNetFlows = latestSnap ? Number(latestSnap.netFlows) : 0;

    if (!latestSnap) {
      const overview = await this.getAumOverview(advisorId);
      currentAum = overview.totalAum;
      const sipHealth = await this.getSipHealth(advisorId);
      currentSipBook = sipHealth.totalMonthlyAmount;
      currentClientCount = await this.prisma.fAClient.count({ where: { advisorId } });
    }

    const prevAum = prevSnap ? Number(prevSnap.totalAum) : currentAum;
    const prevNetFlows = prevSnap ? Number(prevSnap.netFlows) : 0;
    const prevSipBook = prevSnap ? Number(prevSnap.sipBookSize) : currentSipBook;
    const prevClientCount = prevSnap ? prevSnap.clientCount : currentClientCount;

    // New and lost clients this month
    const newClients = await this.prisma.fAClient.count({
      where: { advisorId, createdAt: { gte: currentMonthStart } },
    });

    const lostClients = await this.prisma.fAClient.count({
      where: { advisorId, status: 'INACTIVE', updatedAt: { gte: currentMonthStart } },
    });

    const delta = (current: number, previous: number) => ({
      current,
      previous,
      delta: Math.round((current - previous) * 100) / 100,
      deltaPercent: previous > 0 ? Math.round(((current - previous) / previous) * 10000) / 100 : 0,
    });

    return {
      period,
      prevPeriod,
      aum: delta(currentAum, prevAum),
      netFlows: { current: currentNetFlows, previous: prevNetFlows, delta: currentNetFlows - prevNetFlows },
      sipBook: delta(currentSipBook, prevSipBook),
      clientCount: delta(currentClientCount, prevClientCount),
      newClients,
      lostClients,
    };
  }

  // ============= REVENUE ATTRIBUTION =============

  async getRevenueAttribution(advisorId: string) {
    // Get all holdings with scheme plan relations for AMC name
    const holdings = await this.prisma.fAHolding.findMany({
      where: { client: { advisorId } },
      include: {
        client: { select: { id: true } },
      },
    });

    // Get scheme plans for AMC resolution
    const schemePlanIds = holdings.map(h => h.schemePlanId).filter(Boolean) as string[];
    const schemePlans = schemePlanIds.length > 0
      ? await this.prisma.schemePlan.findMany({
          where: { id: { in: schemePlanIds } },
          include: { scheme: { include: { provider: { select: { id: true, name: true } } } } },
        })
      : [];

    const schemePlanMap = new Map(schemePlans.map(sp => [sp.id, sp]));

    // Get commission rates for trail rate lookup
    const rates = await this.prisma.commissionRateMaster.findMany({
      where: {
        advisorId,
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      include: { amc: { select: { id: true, name: true } } },
    });

    const rateMap = new Map<string, number>();
    for (const r of rates) {
      const key = `${r.amcId}:${r.schemeCategory}`;
      rateMap.set(key, Number(r.trailRatePercent));
      // Also store by AMC only as fallback
      if (!rateMap.has(r.amcId)) {
        rateMap.set(r.amcId, Number(r.trailRatePercent));
      }
    }

    // Aggregate by AMC
    const amcData = new Map<string, { amcName: string; aumAmount: number; trailRate: number; holdingsCount: number }>();

    for (const h of holdings) {
      const value = Number(h.currentValue || 0);
      let amcName = 'Unknown AMC';
      let amcId = '';

      // Try to resolve AMC from scheme plan
      if (h.schemePlanId && schemePlanMap.has(h.schemePlanId)) {
        const sp = schemePlanMap.get(h.schemePlanId)!;
        amcName = sp.scheme.provider.name;
        amcId = sp.scheme.provider.id;
      } else {
        // Fallback: extract AMC from fund name (first word(s) before "Mutual Fund" or common patterns)
        const name = h.fundName || '';
        const match = name.match(/^([\w\s]+?)\s+(Mutual Fund|MF|Fund|Liquid|Overnight|Money Market)/i);
        amcName = match ? match[1].trim() : name.split(' ').slice(0, 2).join(' ');
      }

      // Look up trail rate
      const categoryKey = `${amcId}:${h.fundCategory}`;
      const trailRate = rateMap.get(categoryKey) || rateMap.get(amcId) || 0.5; // default 0.5%

      const existing = amcData.get(amcName) || { amcName, aumAmount: 0, trailRate, holdingsCount: 0 };
      existing.aumAmount += value;
      existing.holdingsCount += 1;
      amcData.set(amcName, existing);
    }

    const totalAum = holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0);
    const byAmc = [...amcData.values()]
      .map(a => ({
        ...a,
        aumAmount: Math.round(a.aumAmount * 100) / 100,
        estimatedTrail: Math.round((a.aumAmount * a.trailRate / 100) * 100) / 100,
        percentOfTotal: totalAum > 0 ? Math.round((a.aumAmount / totalAum) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.aumAmount - a.aumAmount);

    const totalTrailIncome = byAmc.reduce((sum, a) => sum + a.estimatedTrail, 0);

    return {
      totalTrailIncome: Math.round(totalTrailIncome * 100) / 100,
      byAmc,
    };
  }

  // ============= CLIENT SEGMENTATION (TIERS) =============

  async getClientSegmentation(advisorId: string) {
    const clients = await this.prisma.fAClient.findMany({
      where: { advisorId },
      include: { holdings: true },
    });

    const tierDefs = [
      { tier: 'Diamond', min: 10000000, max: Infinity },  // >1Cr
      { tier: 'Gold', min: 2500000, max: 10000000 },      // 25L-1Cr
      { tier: 'Silver', min: 500000, max: 2500000 },      // 5L-25L
      { tier: 'Bronze', min: 0, max: 500000 },            // <5L
    ];

    let totalAum = 0;
    const tiers = tierDefs.map(def => {
      const tierClients: { id: string; name: string; aum: number }[] = [];
      for (const c of clients) {
        const aum = c.holdings.reduce((sum, h) => sum + Number(h.currentValue || 0), 0);
        if (aum >= def.min && aum < def.max) {
          tierClients.push({ id: c.id, name: c.name, aum: Math.round(aum * 100) / 100 });
        }
      }
      tierClients.sort((a, b) => b.aum - a.aum);
      const tierAum = tierClients.reduce((sum, c) => sum + c.aum, 0);
      totalAum += tierAum;
      return {
        tier: def.tier,
        clientCount: tierClients.length,
        totalAum: Math.round(tierAum * 100) / 100,
        avgAum: tierClients.length > 0 ? Math.round((tierAum / tierClients.length) * 100) / 100 : 0,
        clients: tierClients,
      };
    });

    // Compute percentOfAum after totalAum is known
    const tiersWithPercent = tiers.map(t => ({
      ...t,
      percentOfAum: totalAum > 0 ? Math.round((t.totalAum / totalAum) * 10000) / 100 : 0,
    }));

    return {
      tiers: tiersWithPercent,
      totalAum: Math.round(totalAum * 100) / 100,
      totalClients: clients.length,
    };
  }

  // ============= TRIGGER SNAPSHOT (manual) =============

  async triggerSnapshot(advisorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.snapshotScheduler.captureForAdvisor(advisorId, today);
    return { success: true, date: today.toISOString().split('T')[0] };
  }
}
