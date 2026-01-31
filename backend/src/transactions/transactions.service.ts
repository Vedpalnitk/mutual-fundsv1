import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTransactionDto, UpdateTransactionStatusDto, CreateTradeRequestDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';

// Type mapping for display
const TYPE_MAP: Record<string, string> = {
  BUY: 'Buy',
  SELL: 'Sell',
  SIP: 'SIP',
  SWP: 'SWP',
  SWITCH: 'Switch',
  STP: 'STP',
};

const STATUS_MAP: Record<string, string> = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(advisorId: string, filters: TransactionFilterDto) {
    const {
      page = 1,
      limit = 20,
      clientId,
      search,
      type,
      status,
      fromDate,
      toDate,
    } = filters;

    // Build where clause
    const where: Prisma.FATransactionWhereInput = {
      client: {
        advisorId,
      },
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      where.OR = [
        { fundName: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { folioNumber: { contains: search } },
      ];
    }

    if (type) {
      where.type = type as any;
    }

    if (status) {
      where.status = status as any;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        where.date.gte = new Date(fromDate);
      }
      if (toDate) {
        where.date.lte = new Date(toDate);
      }
    }

    const total = await this.prisma.fATransaction.count({ where });

    const transactions = await this.prisma.fATransaction.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: transactions.map((t) => this.transformTransaction(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByClient(clientId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId);

    const transactions = await this.prisma.fATransaction.findMany({
      where: { clientId },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map((t) => this.transformTransaction(t));
  }

  async findOne(id: string, advisorId: string) {
    const transaction = await this.prisma.fATransaction.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, advisorId: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (transaction.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    return this.transformTransaction(transaction);
  }

  async createLumpsum(advisorId: string, dto: CreateTransactionDto) {
    await this.verifyClientAccess(dto.clientId, advisorId);

    const units = dto.amount / dto.nav;

    const transaction = await this.prisma.fATransaction.create({
      data: {
        clientId: dto.clientId,
        fundName: dto.fundName,
        fundSchemeCode: dto.fundSchemeCode,
        fundCategory: dto.fundCategory,
        type: dto.type,
        amount: dto.amount,
        units,
        nav: dto.nav,
        status: 'PENDING',
        date: dto.date ? new Date(dto.date) : new Date(),
        folioNumber: dto.folioNumber,
        paymentMode: dto.paymentMode,
        remarks: dto.remarks,
        orderId: this.generateOrderId(),
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return this.transformTransaction(transaction);
  }

  async createRedemption(advisorId: string, dto: CreateTransactionDto) {
    await this.verifyClientAccess(dto.clientId, advisorId);

    // For redemption, we use units as primary and calculate amount
    const units = dto.amount / dto.nav;

    const transaction = await this.prisma.fATransaction.create({
      data: {
        clientId: dto.clientId,
        fundName: dto.fundName,
        fundSchemeCode: dto.fundSchemeCode,
        fundCategory: dto.fundCategory,
        type: 'SELL',
        amount: dto.amount,
        units,
        nav: dto.nav,
        status: 'PENDING',
        date: dto.date ? new Date(dto.date) : new Date(),
        folioNumber: dto.folioNumber,
        remarks: dto.remarks,
        orderId: this.generateOrderId(),
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return this.transformTransaction(transaction);
  }

  async updateStatus(id: string, advisorId: string, dto: UpdateTransactionStatusDto) {
    const transaction = await this.prisma.fATransaction.findUnique({
      where: { id },
      include: {
        client: {
          select: { advisorId: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (transaction.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.fATransaction.update({
      where: { id },
      data: {
        status: dto.status as any,
        remarks: dto.remarks,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return this.transformTransaction(updated);
  }

  async cancelTransaction(id: string, advisorId: string) {
    const transaction = await this.prisma.fATransaction.findUnique({
      where: { id },
      include: {
        client: {
          select: { advisorId: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (transaction.client.advisorId !== advisorId) {
      throw new ForbiddenException('Access denied');
    }

    if (transaction.status !== 'PENDING') {
      throw new ForbiddenException('Only pending transactions can be cancelled');
    }

    const updated = await this.prisma.fATransaction.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return this.transformTransaction(updated);
  }

  /**
   * Create a trade request from a managed user (client).
   * This finds the FAClient by userId and creates a PENDING transaction
   * for the advisor to review and execute.
   */
  async createTradeRequest(userId: string, dto: CreateTradeRequestDto) {
    // Find the FAClient record for this user
    const client = await this.prisma.fAClient.findFirst({
      where: { userId },
      include: {
        advisor: {
          select: { id: true, email: true },
        },
        holdings: {
          where: { fundSchemeCode: dto.fundSchemeCode },
        },
      },
    });

    if (!client) {
      throw new BadRequestException('You are not registered as a managed client');
    }

    // Get current NAV for the fund (fallback to 0 if not available)
    // In production, this would fetch from the scheme plan
    let nav = 0;
    let folioNumber = 'NEW';

    // If user has existing holdings for this fund, use the folio number
    if (client.holdings.length > 0) {
      const holding = client.holdings[0];
      nav = Number(holding.currentNav);
      folioNumber = holding.folioNumber;
    }

    // Calculate units based on amount and NAV
    const units = nav > 0 ? dto.amount / nav : 0;

    const transaction = await this.prisma.fATransaction.create({
      data: {
        clientId: client.id,
        fundName: dto.fundName,
        fundSchemeCode: dto.fundSchemeCode,
        fundCategory: dto.fundCategory,
        type: dto.type as any,
        amount: dto.amount,
        units,
        nav,
        status: 'PENDING',
        date: new Date(),
        folioNumber,
        remarks: dto.remarks || `Trade request submitted by client via app`,
        orderId: this.generateOrderId(),
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      success: true,
      message: 'Your trade request has been submitted to your advisor',
      transaction: this.transformTransaction(transaction),
      advisorId: client.advisorId,
    };
  }

  /**
   * Get pending trade requests for a managed user
   */
  async getMyTradeRequests(userId: string) {
    const client = await this.prisma.fAClient.findFirst({
      where: { userId },
    });

    if (!client) {
      throw new BadRequestException('You are not registered as a managed client');
    }

    const transactions = await this.prisma.fATransaction.findMany({
      where: { clientId: client.id },
      orderBy: { date: 'desc' },
      take: 50,
    });

    return transactions.map((t) => this.transformTransaction({ ...t, client }));
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

  private generateOrderId(): string {
    const prefix = 'ORD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private transformTransaction(t: any) {
    return {
      id: t.id,
      clientId: t.clientId,
      clientName: t.client?.name || '',
      fundName: t.fundName,
      fundSchemeCode: t.fundSchemeCode,
      fundCategory: t.fundCategory,
      type: TYPE_MAP[t.type] || t.type,
      amount: Number(t.amount),
      units: Number(t.units),
      nav: Number(t.nav),
      status: STATUS_MAP[t.status] || t.status,
      date: t.date.toISOString().split('T')[0],
      folioNumber: t.folioNumber,
      orderId: t.orderId,
      paymentMode: t.paymentMode,
      remarks: t.remarks,
    };
  }
}
