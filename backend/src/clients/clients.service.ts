import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateClientDto,
  RiskProfile,
} from './dto/create-client.dto';
import { UpdateClientDto, ClientStatus, KycStatus } from './dto/update-client.dto';
import { ClientFilterDto, SortField, SortOrder } from './dto/client-filter.dto';
import { PanCryptoService } from '../common/services/pan-crypto.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private panCrypto: PanCryptoService,
  ) {}

  async findAll(advisorId: string, filters: ClientFilterDto) {
    const {
      page = 1,
      limit = 20,
      search,
      riskProfile,
      status,
      sortBy = SortField.AUM,
      sortOrder = SortOrder.DESC,
    } = filters;

    const where: Prisma.FAClientWhereInput = {
      advisorId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (riskProfile) {
      where.riskProfile = riskProfile as any;
    }

    if (status) {
      where.status = status as any;
    }

    // Get total count
    const total = await this.prisma.fAClient.count({ where });

    // Get clients with portfolio aggregations
    const clients = await this.prisma.fAClient.findMany({
      where,
      include: {
        holdings: true,
        sips: {
          where: { status: 'ACTIVE' },
        },
        bankAccounts: true,
        goals: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: this.getOrderBy(sortBy, sortOrder),
    });

    // Transform to response format
    const data = clients.map((client) => this.transformClient(client));

    // Sort by computed fields if needed
    if (sortBy === SortField.AUM || sortBy === SortField.RETURNS) {
      data.sort((a, b) => {
        const aVal = sortBy === SortField.AUM ? a.aum : a.returns;
        const bVal = sortBy === SortField.AUM ? b.aum : b.returns;
        return sortOrder === SortOrder.DESC ? bVal - aVal : aVal - bVal;
      });
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, advisorId: string) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id, advisorId },
      include: {
        holdings: true,
        sips: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        bankAccounts: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Query family members if client belongs to a family group
    let familyMembers: any[] = [];
    if (client.familyGroupId) {
      const familyClients = await this.prisma.fAClient.findMany({
        where: {
          familyGroupId: client.familyGroupId,
          advisorId,
        },
        include: {
          holdings: true,
          sips: { where: { status: 'ACTIVE' } },
        },
      });
      familyMembers = familyClients.map((fc) => this.transformFamilyMember(fc));
    }

    return this.transformClientWithPortfolio(client, familyMembers);
  }

  async create(advisorId: string, dto: CreateClientDto) {
    const client = await this.prisma.fAClient.create({
      data: {
        advisorId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        pan: dto.pan,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        riskProfile: dto.riskProfile || 'MODERATE',
        status: 'PENDING_KYC',
        kycStatus: 'PENDING',
        nomineeName: dto.nominee?.name,
        nomineeRelation: dto.nominee?.relationship,
        nomineePercent: dto.nominee?.percentage,
        assignedRmId: dto.assignedRmId || null,
        tags: dto.tags || [],
        importantDates: (dto.importantDates || null) as any,
      },
      include: {
        holdings: true,
        sips: true,
        bankAccounts: true,
      },
    });

    return this.transformClient(client);
  }

  async update(id: string, advisorId: string, dto: UpdateClientDto) {
    // Verify client exists and belongs to advisor
    await this.findOne(id, advisorId);

    const client = await this.prisma.fAClient.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        pan: dto.pan,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        riskProfile: dto.riskProfile,
        status: dto.status,
        kycStatus: dto.kycStatus,
        nomineeName: dto.nominee?.name,
        nomineeRelation: dto.nominee?.relationship,
        nomineePercent: dto.nominee?.percentage,
        assignedRmId: dto.assignedRmId,
        tags: dto.tags,
        importantDates: dto.importantDates,
      },
      include: {
        holdings: true,
        sips: true,
        bankAccounts: true,
      },
    });

    return this.transformClient(client);
  }

  async deactivate(id: string, advisorId: string) {
    await this.findOne(id, advisorId);

    await this.prisma.fAClient.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return { success: true };
  }

  async calculateClientAUM(clientId: string): Promise<number> {
    const holdings = await this.prisma.fAHolding.findMany({
      where: { clientId },
    });

    return holdings.reduce((sum, h) => sum + Number(h.currentValue), 0);
  }

  private getOrderBy(sortBy: SortField, sortOrder: SortOrder) {
    const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    switch (sortBy) {
      case SortField.NAME:
        return { name: order as Prisma.SortOrder };
      case SortField.JOINED_DATE:
        return { createdAt: order as Prisma.SortOrder };
      case SortField.LAST_ACTIVE:
        return { lastActiveAt: order as Prisma.SortOrder };
      default:
        return { createdAt: order as Prisma.SortOrder };
    }
  }

  private transformClient(client: any) {
    const holdings = client.holdings || [];
    const sips = client.sips || [];
    const goals = client.goals || [];

    // Calculate AUM from holdings
    const aum = holdings.reduce((sum: number, h: any) => sum + Number(h.currentValue || 0), 0);
    const invested = holdings.reduce((sum: number, h: any) => sum + Number(h.investedValue || 0), 0);
    const returns = invested > 0 ? ((aum - invested) / invested) * 100 : 0;

    // Map status to display format
    const statusMap: Record<string, string> = {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      PENDING_KYC: 'Pending KYC',
    };

    const kycStatusMap: Record<string, string> = {
      VERIFIED: 'Verified',
      PENDING: 'Pending',
      EXPIRED: 'Expired',
    };

    const riskProfileMap: Record<string, string> = {
      CONSERVATIVE: 'Conservative',
      MODERATE: 'Moderate',
      AGGRESSIVE: 'Aggressive',
    };

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      pan: this.panCrypto.mask(client.pan),
      dateOfBirth: client.dateOfBirth?.toISOString().split('T')[0],
      address: client.address,
      city: client.city,
      state: client.state,
      pincode: client.pincode,
      aum,
      returns: Math.round(returns * 100) / 100,
      riskProfile: riskProfileMap[client.riskProfile] || 'Moderate',
      lastActive: this.formatLastActive(client.lastActiveAt),
      sipCount: sips.length,
      goalsCount: goals.length,
      joinedDate: client.createdAt.toISOString().split('T')[0],
      status: statusMap[client.status] || 'Active',
      kycStatus: kycStatusMap[client.kycStatus],
      // Family grouping fields
      familyGroupId: client.familyGroupId,
      familyRole: client.familyRole,
      familyHeadId: client.familyHeadId,
      // Business management fields
      assignedRmId: client.assignedRmId,
      tags: client.tags || [],
      importantDates: client.importantDates,
      nominee: client.nomineeName
        ? {
            name: client.nomineeName,
            relationship: client.nomineeRelation,
            percentage: client.nomineePercent,
          }
        : undefined,
      bankAccounts: client.bankAccounts?.map((ba: any) => ({
        id: ba.id,
        bankName: ba.bankName,
        accountNumber: ba.accountNumber,
        ifsc: ba.ifsc,
        accountType: ba.accountType,
        isPrimary: ba.isPrimary,
        mandateStatus: ba.mandateStatus,
      })),
    };
  }

  private transformClientWithPortfolio(client: any, familyMembers: any[] = []) {
    const base = this.transformClient(client);
    const holdings = client.holdings || [];
    const sips = client.sips || [];
    const transactions = client.transactions || [];

    const totalInvested = holdings.reduce((sum: number, h: any) => sum + Number(h.investedValue || 0), 0);
    const currentValue = holdings.reduce((sum: number, h: any) => sum + Number(h.currentValue || 0), 0);
    const absoluteGain = currentValue - totalInvested;
    const absoluteGainPercent = totalInvested > 0 ? (absoluteGain / totalInvested) * 100 : 0;

    return {
      ...base,
      totalInvested,
      currentValue,
      absoluteGain,
      absoluteGainPercent: Math.round(absoluteGainPercent * 100) / 100,
      holdingsCount: holdings.length,
      holdings: holdings.map((h: any) => this.transformHolding(h)),
      sips: sips.map((s: any) => this.transformSip(s, client.name)),
      recentTransactions: transactions.map((t: any) => this.transformTransactionForClient(t, client.name)),
      familyMembers,
    };
  }

  private transformHolding(h: any) {
    const invested = Number(h.investedValue || 0);
    const current = Number(h.currentValue || 0);
    const gain = Number(h.absoluteGain || 0);
    const gainPct = Number(h.absoluteGainPct || 0);

    return {
      id: h.id,
      fundName: h.fundName,
      fundSchemeCode: h.fundSchemeCode,
      fundCategory: h.fundCategory,
      category: h.assetClass,
      units: Number(h.units),
      avgNav: Number(h.avgNav),
      currentNav: Number(h.currentNav),
      currentValue: current,
      investedValue: invested,
      absoluteGain: gain,
      absoluteGainPct: gainPct,
      returns: gain,
      returnsPercentage: gainPct,
      xirr: h.xirr ? Number(h.xirr) : null,
    };
  }

  private transformSip(s: any, clientName?: string) {
    return {
      id: s.id,
      clientId: s.clientId,
      clientName: clientName || '',
      schemeCode: parseInt(s.fundSchemeCode) || 0,
      fundName: s.fundName,
      amount: Number(s.amount),
      frequency: s.frequency,
      sipDate: s.sipDate,
      nextDate: s.nextSipDate?.toISOString().split('T')[0] || null,
      status: s.status,
      totalInvested: Number(s.totalInvested),
      totalUnits: 0,
      installmentsPaid: s.completedInstallments,
      startDate: s.startDate?.toISOString().split('T')[0] || null,
      createdAt: s.createdAt?.toISOString() || null,
    };
  }

  private static readonly TYPE_MAP: Record<string, string> = {
    BUY: 'Buy',
    SELL: 'Sell',
    SIP: 'SIP',
    SWP: 'SWP',
    SWITCH: 'Switch',
    STP: 'STP',
  };

  private static readonly STATUS_MAP: Record<string, string> = {
    COMPLETED: 'Completed',
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  };

  private transformTransactionForClient(t: any, clientName: string) {
    return {
      id: t.id,
      clientId: t.clientId,
      clientName,
      fundName: t.fundName,
      fundSchemeCode: t.fundSchemeCode,
      fundCategory: t.fundCategory,
      type: ClientsService.TYPE_MAP[t.type] || t.type,
      amount: Number(t.amount),
      units: Number(t.units),
      nav: Number(t.nav),
      status: ClientsService.STATUS_MAP[t.status] || t.status,
      date: t.date.toISOString().split('T')[0],
      folioNumber: t.folioNumber,
      orderId: t.orderId,
      paymentMode: t.paymentMode,
      remarks: t.remarks,
    };
  }

  private transformFamilyMember(fc: any) {
    const holdings = fc.holdings || [];
    const sips = fc.sips || [];
    const aum = holdings.reduce((sum: number, h: any) => sum + Number(h.currentValue || 0), 0);
    const invested = holdings.reduce((sum: number, h: any) => sum + Number(h.investedValue || 0), 0);
    const returns = invested > 0 ? ((aum - invested) / invested) * 100 : 0;

    return {
      id: fc.id,
      name: fc.name,
      relationship: fc.familyRole || 'SELF',
      aum,
      clientId: fc.id,
      holdingsCount: holdings.length,
      sipCount: sips.length,
      returns: Math.round(returns * 100) / 100,
      kycStatus: fc.kycStatus,
      hasFolio: holdings.length > 0,
    };
  }

  async assignRm(id: string, advisorId: string, assignedRmId: string | null) {
    await this.findOne(id, advisorId);
    const client = await this.prisma.fAClient.update({
      where: { id },
      data: { assignedRmId },
    });
    return { id: client.id, assignedRmId: client.assignedRmId };
  }

  async updateTags(id: string, advisorId: string, tags: string[]) {
    await this.findOne(id, advisorId);
    const client = await this.prisma.fAClient.update({
      where: { id },
      data: { tags },
    });
    return { id: client.id, tags: client.tags };
  }

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

    return clients.map((c) => ({
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

  private formatLastActive(date: Date | null): string {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toISOString().split('T')[0];
  }
}
