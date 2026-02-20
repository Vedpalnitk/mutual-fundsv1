import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSIPDto, UpdateSIPDto, SIPFrequency } from './dto/create-sip.dto';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification.events';

// Type mapping for display
const FREQUENCY_MAP: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
};

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

@Injectable()
export class SipsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    advisorId: string,
    filters: { page?: number; limit?: number; status?: string; clientId?: string; search?: string },
  ) {
    const { page = 1, limit = 20, status, clientId, search } = filters;

    const where: Prisma.FASIPWhereInput = {
      client: {
        advisorId,
      },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status as any;
    }

    if (search) {
      where.OR = [
        { fundName: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { folioNumber: { contains: search } },
      ];
    }

    const total = await this.prisma.fASIP.count({ where });

    const sips = await this.prisma.fASIP.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { nextSipDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: sips.map((s) => this.transformSIP(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByClient(clientId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId);

    const sips = await this.prisma.fASIP.findMany({
      where: { clientId },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { nextSipDate: 'asc' },
    });

    return sips.map((s) => this.transformSIP(s));
  }

  async findOne(id: string, advisorId: string) {
    const sip = await this.prisma.fASIP.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, advisorId: true },
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 12,
        },
      },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (sip.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    return this.transformSIP(sip);
  }

  async create(advisorId: string, dto: CreateSIPDto) {
    await this.verifyClientAccess(dto.clientId, advisorId);

    // Calculate next SIP date
    const startDate = new Date(dto.startDate);
    const nextSipDate = this.calculateNextSipDate(startDate, dto.sipDate, dto.frequency);

    // Calculate total installments if end date is provided
    let totalInstallments = 0;
    if (dto.endDate && !dto.isPerpetual) {
      totalInstallments = this.calculateTotalInstallments(
        startDate,
        new Date(dto.endDate),
        dto.frequency,
      );
    }

    const sip = await this.prisma.fASIP.create({
      data: {
        clientId: dto.clientId,
        fundName: dto.fundName,
        fundSchemeCode: dto.fundSchemeCode,
        folioNumber: dto.folioNumber,
        amount: dto.amount,
        frequency: dto.frequency,
        sipDate: dto.sipDate,
        startDate: startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'ACTIVE',
        totalInstallments,
        completedInstallments: 0,
        totalInvested: 0,
        currentValue: 0,
        returns: 0,
        returnsPct: 0,
        nextSipDate,
        stepUpPercent: dto.stepUpPercent,
        stepUpFrequency: dto.stepUpFrequency,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SIP_CREATED, {
      userId: advisorId,
      category: 'SIP_REMINDERS',
      title: 'SIP Created',
      body: `${dto.frequency} SIP of ₹${dto.amount.toLocaleString('en-IN')} for ${dto.fundName}`,
      metadata: { sipId: sip.id, clientId: dto.clientId },
    });

    return this.transformSIP(sip);
  }

  async update(id: string, advisorId: string, dto: UpdateSIPDto) {
    const sip = await this.prisma.fASIP.findUnique({
      where: { id },
      include: {
        client: {
          select: { advisorId: true },
        },
      },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (sip.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    if (sip.status !== 'ACTIVE' && sip.status !== 'PAUSED') {
      throw new BadRequestException('Cannot modify a completed or cancelled SIP');
    }

    // Recalculate total installments if end date changes
    let totalInstallments = sip.totalInstallments;
    if (dto.endDate) {
      totalInstallments = this.calculateTotalInstallments(
        sip.startDate,
        new Date(dto.endDate),
        sip.frequency,
      );
    }

    // Recalculate next SIP date if sipDate changes
    let nextSipDate = sip.nextSipDate;
    if (dto.sipDate && dto.sipDate !== sip.sipDate) {
      nextSipDate = this.calculateNextSipDate(new Date(), dto.sipDate, sip.frequency);
    }

    const updated = await this.prisma.fASIP.update({
      where: { id },
      data: {
        amount: dto.amount,
        sipDate: dto.sipDate,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        totalInstallments,
        nextSipDate,
        stepUpPercent: dto.stepUpPercent,
        stepUpFrequency: dto.stepUpFrequency,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return this.transformSIP(updated);
  }

  async pause(id: string, advisorId: string) {
    const sip = await this.prisma.fASIP.findUnique({
      where: { id },
      include: {
        client: {
          select: { advisorId: true },
        },
      },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (sip.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    if (sip.status !== 'ACTIVE') {
      throw new BadRequestException('Only active SIPs can be paused');
    }

    const updated = await this.prisma.fASIP.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return this.transformSIP(updated);
  }

  async resume(id: string, advisorId: string) {
    const sip = await this.prisma.fASIP.findUnique({
      where: { id },
      include: {
        client: {
          select: { advisorId: true },
        },
      },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (sip.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    if (sip.status !== 'PAUSED') {
      throw new BadRequestException('Only paused SIPs can be resumed');
    }

    // Recalculate next SIP date from today
    const nextSipDate = this.calculateNextSipDate(new Date(), sip.sipDate, sip.frequency);

    const updated = await this.prisma.fASIP.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        nextSipDate,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return this.transformSIP(updated);
  }

  async cancel(id: string, advisorId: string) {
    const sip = await this.prisma.fASIP.findUnique({
      where: { id },
      include: {
        client: {
          select: { advisorId: true },
        },
      },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (sip.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    if (sip.status === 'COMPLETED' || sip.status === 'CANCELLED') {
      throw new BadRequestException('SIP is already completed or cancelled');
    }

    await this.prisma.fASIP.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { success: true };
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

  private calculateNextSipDate(fromDate: Date, sipDate: number, frequency: string): Date {
    const next = new Date(fromDate);

    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        next.setDate(Math.min(sipDate, this.daysInMonth(next)));
        break;
      case 'MONTHLY':
      default:
        if (next.getDate() >= sipDate) {
          next.setMonth(next.getMonth() + 1);
        }
        next.setDate(Math.min(sipDate, this.daysInMonth(next)));
        break;
    }

    return next;
  }

  private calculateTotalInstallments(startDate: Date, endDate: Date, frequency: string): number {
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    switch (frequency) {
      case 'DAILY':
        return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      case 'WEEKLY':
        return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      case 'QUARTERLY':
        return Math.ceil(months / 3);
      case 'MONTHLY':
      default:
        return months;
    }
  }

  private daysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Register an existing FASIP with BSE StAR MF.
   * Creates a BseOrder of type SIP linked to the FASIP record.
   */
  async registerWithBse(id: string, advisorId: string) {
    const sip = await this.prisma.fASIP.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, advisorId: true },
        },
      },
    });

    if (!sip) {
      throw new NotFoundException(`SIP with ID ${id} not found`);
    }

    if (sip.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    if (sip.status !== 'ACTIVE') {
      throw new BadRequestException('Only active SIPs can be registered with BSE');
    }

    // Check if client has BSE UCC registration
    const uccReg = await this.prisma.bseUccRegistration.findUnique({
      where: { clientId: sip.clientId },
    });

    if (!uccReg || uccReg.status !== 'APPROVED') {
      throw new BadRequestException(
        'Client must have an approved BSE UCC registration before registering SIPs',
      );
    }

    // Check if already registered
    const existingOrder = await this.prisma.bseOrder.findFirst({
      where: { sipId: id },
    });

    if (existingOrder) {
      throw new BadRequestException(
        `SIP already registered with BSE (BSE Reg No: ${existingOrder.bseRegistrationNo || existingOrder.id})`,
      );
    }

    // Create BseOrder of type SIP
    const bseOrder = await this.prisma.bseOrder.create({
      data: {
        clientId: sip.clientId,
        advisorId,
        sipId: id,
        orderType: 'SIP',
        schemeCode: sip.fundSchemeCode || '',
        amount: Number(sip.amount),
        transCode: 'NEW',
        status: 'CREATED',
      },
    });

    return {
      success: true,
      message: 'BSE SIP registration order created. Submit via BSE Orders page.',
      bseOrderId: bseOrder.id,
      sipId: id,
    };
  }

  // ============================================================
  // Retry / Analytics Methods
  // ============================================================

  async retry(sipId: string, advisorId: string) {
    const sip = await this.prisma.fASIP.findUnique({
      where: { id: sipId },
      include: { client: { select: { id: true, name: true, advisorId: true } } },
    });

    if (!sip) throw new NotFoundException(`SIP with ID ${sipId} not found`);
    if (sip.client.advisorId !== advisorId) throw new ForbiddenException('Access denied');
    if (sip.status !== 'FAILED') throw new BadRequestException('Only failed SIPs can be retried');

    const nextSipDate = this.calculateNextSipDate(new Date(), sip.sipDate, sip.frequency);

    const updated = await this.prisma.fASIP.update({
      where: { id: sipId },
      data: { status: 'ACTIVE', nextSipDate },
      include: { client: { select: { id: true, name: true } } },
    });

    return this.transformSIP(updated);
  }

  async getMonthlyCollectionReport(advisorId: string, months: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const sips = await this.prisma.fASIP.findMany({
      where: { client: { advisorId }, status: { in: ['ACTIVE', 'COMPLETED'] } },
      select: { amount: true, frequency: true, startDate: true, endDate: true },
    });

    const transactions = await this.prisma.fATransaction.findMany({
      where: {
        client: { advisorId },
        type: 'SIP',
        status: 'COMPLETED',
        date: { gte: startDate },
      },
      select: { amount: true, date: true },
    });

    const report: { month: string; expected: number; actual: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Expected: sum of active SIP amounts for this month
      let expected = 0;
      for (const sip of sips) {
        const sipStart = new Date(sip.startDate);
        const sipEnd = sip.endDate ? new Date(sip.endDate) : new Date('2099-12-31');
        if (sipStart <= d && sipEnd >= d) {
          expected += Number(sip.amount);
        }
      }

      // Actual: sum of SIP transactions in this month
      const actual = transactions
        .filter(t => {
          const td = new Date(t.date);
          return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      report.push({ month: monthKey, expected: Math.round(expected), actual: Math.round(actual) });
    }

    return report;
  }

  async getBookGrowth(advisorId: string) {
    const sips = await this.prisma.fASIP.findMany({
      where: { client: { advisorId } },
      select: { amount: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const growth: { month: string; newSips: number; totalAmount: number; cumulativeSips: number }[] = [];
    const months = new Map<string, { count: number; amount: number }>();

    for (const sip of sips) {
      const d = new Date(sip.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months.has(key)) months.set(key, { count: 0, amount: 0 });
      const entry = months.get(key)!;
      entry.count++;
      entry.amount += Number(sip.amount);
    }

    let cumulative = 0;
    const sortedKeys = Array.from(months.keys()).sort().slice(-12);
    for (const key of sortedKeys) {
      const data = months.get(key)!;
      cumulative += data.count;
      growth.push({
        month: key,
        newSips: data.count,
        totalAmount: Math.round(data.amount),
        cumulativeSips: cumulative,
      });
    }

    return growth;
  }

  async getMandateExpiryAlerts(advisorId: string) {
    const sipsWithMandates = await this.prisma.fASIP.findMany({
      where: {
        client: { advisorId },
        status: 'ACTIVE',
        mandateId: { not: null },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    const alerts: any[] = [];
    for (const sip of sipsWithMandates) {
      if (!sip.mandateId) continue;

      const mandate = await this.prisma.bseMandate.findFirst({
        where: { id: sip.mandateId },
      });

      if (mandate && mandate.endDate && sip.endDate) {
        const mandateExpiry = new Date(mandate.endDate);
        const sipEnd = new Date(sip.endDate);
        if (mandateExpiry < sipEnd) {
          alerts.push({
            sipId: sip.id,
            clientId: sip.clientId,
            clientName: sip.client?.name || '',
            fundName: sip.fundName,
            sipAmount: Number(sip.amount),
            mandateId: sip.mandateId,
            mandateExpiry: mandateExpiry.toISOString().split('T')[0],
            sipEndDate: sipEnd.toISOString().split('T')[0],
            daysUntilExpiry: Math.ceil((mandateExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          });
        }
      }
    }

    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  private transformSIP(s: any) {
    return {
      id: s.id,
      clientId: s.clientId,
      clientName: s.client?.name || '',
      schemeCode: parseInt(s.fundSchemeCode) || 0,
      fundName: s.fundName,
      fundSchemeCode: s.fundSchemeCode,
      folioNumber: s.folioNumber,
      amount: Number(s.amount),
      frequency: s.frequency,
      sipDate: s.sipDate,
      startDate: s.startDate.toISOString().split('T')[0],
      endDate: s.endDate?.toISOString().split('T')[0],
      nextDate: s.nextSipDate.toISOString().split('T')[0],
      status: s.status,
      totalInstallments: s.totalInstallments,
      installmentsPaid: s.completedInstallments,
      completedInstallments: s.completedInstallments,
      totalInvested: Number(s.totalInvested),
      totalUnits: 0,
      currentValue: Number(s.currentValue),
      returns: Number(s.returns),
      returnsPercent: Number(s.returnsPct),
      nextSipDate: s.nextSipDate.toISOString().split('T')[0],
      lastSipDate: s.lastSipDate?.toISOString().split('T')[0],
      mandateId: s.mandateId,
      stepUpPercent: s.stepUpPercent,
      stepUpFrequency: s.stepUpFrequency,
      createdAt: s.createdAt?.toISOString() || null,
    };
  }
}
