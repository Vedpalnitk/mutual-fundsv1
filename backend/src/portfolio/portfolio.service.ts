import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHoldingDto, UpdateHoldingDto } from './dto/create-holding.dto';

// Asset class color mapping
const ASSET_COLORS: Record<string, string> = {
  Equity: '#4CAF50',
  Debt: '#2196F3',
  Hybrid: '#FF9800',
  Gold: '#FFD700',
  International: '#9C27B0',
  Liquid: '#00BCD4',
  Other: '#607D8B',
};

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getClientHoldings(clientId: string, advisorId: string) {
    // Verify client belongs to advisor
    await this.verifyClientAccess(clientId, advisorId);

    const holdings = await this.prisma.fAHolding.findMany({
      where: { clientId },
      orderBy: { currentValue: 'desc' },
    });

    return holdings.map((h) => this.transformHolding(h));
  }

  async getPortfolioSummary(clientId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId);

    const holdings = await this.prisma.fAHolding.findMany({
      where: { clientId },
    });

    const totalInvested = holdings.reduce((sum, h) => sum + Number(h.investedValue), 0);
    const currentValue = holdings.reduce((sum, h) => sum + Number(h.currentValue), 0);
    const absoluteGain = currentValue - totalInvested;
    const absoluteGainPercent = totalInvested > 0 ? (absoluteGain / totalInvested) * 100 : 0;

    // Calculate asset allocation
    const assetMap = new Map<string, number>();
    holdings.forEach((h) => {
      const current = assetMap.get(h.assetClass) || 0;
      assetMap.set(h.assetClass, current + Number(h.currentValue));
    });

    const assetAllocation = Array.from(assetMap.entries()).map(([assetClass, value]) => ({
      assetClass,
      value,
      percentage: currentValue > 0 ? (value / currentValue) * 100 : 0,
      color: ASSET_COLORS[assetClass] || ASSET_COLORS.Other,
    }));

    // Calculate XIRR from holdings (purchase date + invested → current value today)
    const xirr = this.calculatePortfolioXirr(holdings, currentValue);

    // Day change: requires NAV history tracking (not yet in FAHolding model)
    // Will be populated once daily NAV sync updates holdings with previous NAV
    const dayChange = 0;
    const dayChangePercent = 0;

    return {
      clientId,
      totalInvested: Math.round(totalInvested * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      absoluteGain: Math.round(absoluteGain * 100) / 100,
      absoluteGainPercent: Math.round(absoluteGainPercent * 100) / 100,
      xirr: xirr !== null ? Math.round(xirr * 100) / 100 : null,
      dayChange: Math.round(dayChange * 100) / 100,
      dayChangePercent: Math.round(dayChangePercent * 100) / 100,
      holdings: holdings.map((h) => this.transformHolding(h)),
      assetAllocation,
      lastUpdated: new Date().toISOString(),
    };
  }

  async addHolding(clientId: string, advisorId: string, dto: CreateHoldingDto) {
    await this.verifyClientAccess(clientId, advisorId);

    const investedValue = dto.units * dto.avgNav;
    const currentValue = dto.units * dto.currentNav;

    const holding = await this.prisma.fAHolding.create({
      data: {
        clientId,
        fundName: dto.fundName,
        fundSchemeCode: dto.fundSchemeCode,
        fundCategory: dto.fundCategory,
        assetClass: dto.assetClass,
        folioNumber: dto.folioNumber,
        units: dto.units,
        avgNav: dto.avgNav,
        currentNav: dto.currentNav,
        investedValue,
        currentValue,
        absoluteGain: currentValue - investedValue,
        absoluteGainPct: investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0,
        lastTxnDate: dto.lastTransactionDate ? new Date(dto.lastTransactionDate) : new Date(),
      },
    });

    return this.transformHolding(holding);
  }

  async updateHolding(holdingId: string, advisorId: string, dto: UpdateHoldingDto) {
    const holding = await this.prisma.fAHolding.findUnique({
      where: { id: holdingId },
      include: { client: true },
    });

    if (!holding) {
      throw new NotFoundException(`Holding with ID ${holdingId} not found`);
    }

    if (holding.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    const units = dto.units ?? Number(holding.units);
    const avgNav = dto.avgNav ?? Number(holding.avgNav);
    const currentNav = dto.currentNav ?? Number(holding.currentNav);
    const investedValue = units * avgNav;
    const currentValue = units * currentNav;

    const updated = await this.prisma.fAHolding.update({
      where: { id: holdingId },
      data: {
        units: dto.units,
        avgNav: dto.avgNav,
        currentNav: dto.currentNav,
        investedValue,
        currentValue,
        absoluteGain: currentValue - investedValue,
        absoluteGainPct: investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0,
        lastTxnDate: dto.lastTransactionDate ? new Date(dto.lastTransactionDate) : undefined,
      },
    });

    return this.transformHolding(updated);
  }

  async deleteHolding(holdingId: string, advisorId: string) {
    const holding = await this.prisma.fAHolding.findUnique({
      where: { id: holdingId },
      include: { client: true },
    });

    if (!holding) {
      throw new NotFoundException(`Holding with ID ${holdingId} not found`);
    }

    if (holding.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.fAHolding.delete({ where: { id: holdingId } });

    return { success: true };
  }

  async syncNavBatch(advisorId: string, updates: { holdingId: string; currentNav: number }[]) {
    const results: { holdingId: string; success: boolean; error?: string }[] = [];

    for (const update of updates) {
      try {
        const holding = await this.prisma.fAHolding.findUnique({
          where: { id: update.holdingId },
          include: { client: true },
        });

        if (!holding || holding.client.advisorId !== advisorId) {
          results.push({ holdingId: update.holdingId, success: false, error: 'Not found or access denied' });
          continue;
        }

        const currentValue = Number(holding.units) * update.currentNav;
        const investedValue = Number(holding.investedValue);

        await this.prisma.fAHolding.update({
          where: { id: update.holdingId },
          data: {
            currentNav: update.currentNav,
            currentValue,
            absoluteGain: currentValue - investedValue,
            absoluteGainPct: investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0,
          },
        });

        results.push({ holdingId: update.holdingId, success: true });
      } catch (error) {
        results.push({ holdingId: update.holdingId, success: false, error: 'Update failed' });
      }
    }

    return { results, synced: results.filter((r) => r.success).length };
  }

  async getAssetAllocation(clientId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId);

    const holdings = await this.prisma.fAHolding.findMany({
      where: { clientId },
    });

    const currentValue = holdings.reduce((sum, h) => sum + Number(h.currentValue), 0);

    const assetMap = new Map<string, number>();
    holdings.forEach((h) => {
      const current = assetMap.get(h.assetClass) || 0;
      assetMap.set(h.assetClass, current + Number(h.currentValue));
    });

    return Array.from(assetMap.entries())
      .map(([assetClass, value]) => ({
        assetClass,
        value: Math.round(value * 100) / 100,
        percentage: currentValue > 0 ? Math.round((value / currentValue) * 10000) / 100 : 0,
        color: ASSET_COLORS[assetClass] || ASSET_COLORS.Other,
      }))
      .sort((a, b) => b.value - a.value);
  }

  async getPortfolioHistory(clientId: string, advisorId: string, period: string) {
    await this.verifyClientAccess(clientId, advisorId);

    const validPeriods = ['1M', '6M', '1Y', '3Y', '5Y', 'ALL'];
    if (!validPeriods.includes(period)) {
      throw new BadRequestException(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }

    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
      case '1M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case '3Y':
        startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
        break;
      case '5Y':
        startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        break;
      case 'ALL':
        startDate = undefined;
        break;
    }

    const where: any = { clientId };
    if (startDate) {
      where.date = { gte: startDate };
    }

    const history = await this.prisma.userPortfolioHistory.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        date: true,
        totalValue: true,
        totalInvested: true,
        dayChange: true,
        dayChangePct: true,
      },
    });

    return history.map((h) => ({
      date: h.date.toISOString().split('T')[0],
      value: Number(h.totalValue),
      invested: Number(h.totalInvested),
      dayChange: h.dayChange ? Number(h.dayChange) : 0,
      dayChangePct: h.dayChangePct ? Number(h.dayChangePct) : 0,
    }));
  }

  private async verifyClientAccess(clientId: string, advisorId: string) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return client;
  }

  private transformHolding(h: any) {
    return {
      id: h.id,
      fundName: h.fundName,
      fundSchemeCode: h.fundSchemeCode,
      fundCategory: h.fundCategory,
      assetClass: h.assetClass,
      folioNumber: h.folioNumber,
      units: Number(h.units),
      avgNav: Number(h.avgNav),
      currentNav: Number(h.currentNav),
      investedValue: Number(h.investedValue),
      currentValue: Number(h.currentValue),
      absoluteGain: Number(h.absoluteGain),
      absoluteGainPercent: Number(h.absoluteGainPct),
      xirr: h.xirr ? Number(h.xirr) : undefined,
      lastTransactionDate: h.lastTxnDate.toISOString().split('T')[0],
    };
  }

  /**
   * Calculate portfolio XIRR using Newton-Raphson method.
   * Each holding's purchase date + invested amount = cash outflow,
   * and today's current value = cash inflow.
   */
  private calculatePortfolioXirr(holdings: any[], currentValue: number): number | null {
    if (holdings.length === 0 || currentValue <= 0) return null;

    const today = new Date();
    const cashflows: { date: Date; amount: number }[] = [];

    for (const h of holdings) {
      const invested = Number(h.investedValue);
      const purchaseDate = h.lastTxnDate ? new Date(h.lastTxnDate) : h.createdAt ? new Date(h.createdAt) : null;
      if (!purchaseDate || invested <= 0) continue;
      cashflows.push({ date: purchaseDate, amount: -invested }); // outflow
    }

    if (cashflows.length === 0) return null;

    // Add today's value as inflow
    cashflows.push({ date: today, amount: currentValue });

    // Sort by date
    cashflows.sort((a, b) => a.date.getTime() - b.date.getTime());

    const daysBetween = (d1: Date, d2: Date) =>
      (d1.getTime() - d2.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    const d0 = cashflows[0].date;

    // NPV function
    const npv = (rate: number): number => {
      let sum = 0;
      for (const cf of cashflows) {
        const years = daysBetween(cf.date, d0);
        sum += cf.amount / Math.pow(1 + rate, years);
      }
      return sum;
    };

    // Derivative of NPV
    const dnpv = (rate: number): number => {
      let sum = 0;
      for (const cf of cashflows) {
        const years = daysBetween(cf.date, d0);
        if (years === 0) continue;
        sum += -years * cf.amount / Math.pow(1 + rate, years + 1);
      }
      return sum;
    };

    // Newton-Raphson iteration
    let rate = 0.1; // Initial guess: 10%
    for (let i = 0; i < 100; i++) {
      const f = npv(rate);
      const df = dnpv(rate);
      if (Math.abs(df) < 1e-12) break;
      const newRate = rate - f / df;
      if (Math.abs(newRate - rate) < 1e-9) {
        rate = newRate;
        break;
      }
      rate = newRate;
      // Guard against divergence
      if (rate < -0.99 || rate > 10) return null;
    }

    // Validate result
    if (isNaN(rate) || !isFinite(rate) || rate < -0.99 || rate > 10) return null;

    return rate * 100; // Return as percentage
  }
}
