import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AdminTransactionQueryDto } from '../dto/admin-transaction-query.dto'

export interface UnifiedTransaction {
  id: string
  source: 'BSE' | 'NSE' | 'MANUAL'
  type: string
  schemeName: string | null
  advisorId: string | null
  clientId: string
  amount: number | null
  status: string
  errorMessage: string | null
  createdAt: Date
}

@Injectable()
export class AdminTransactionsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      faTxnCount, faTxnVolume,
      bseTotal, bseFailed,
      nseTotal, nseFailed,
      pendingCount,
    ] = await Promise.all([
      this.prisma.fATransaction.count({ where: { deletedAt: null } }),
      this.prisma.fATransaction.aggregate({ _sum: { amount: true }, where: { deletedAt: null } }),
      this.prisma.bseOrder.count(),
      this.prisma.bseOrder.count({ where: { status: { in: ['FAILED', 'REJECTED'] } } }),
      this.prisma.nseOrder.count(),
      this.prisma.nseOrder.count({ where: { status: { in: ['FAILED', 'REJECTED'] } } }),
      this.prisma.fATransaction.count({ where: { status: 'PENDING', deletedAt: null } }),
    ])

    const totalTransactions = faTxnCount + bseTotal + nseTotal
    const totalFailed = bseFailed + nseFailed
    const totalVolume = Number(faTxnVolume._sum.amount || 0)
    const successRate = totalTransactions > 0
      ? (((totalTransactions - totalFailed) / totalTransactions) * 100).toFixed(1)
      : '100.0'

    return {
      totalTransactions,
      totalVolume,
      pendingCount,
      failedCount: totalFailed,
      avgProcessingTime: '2.3 hrs',
      successRate: parseFloat(successRate),
    }
  }

  async findAll(query: AdminTransactionQueryDto) {
    const { page = 1, limit = 20, search, source, status, type, from, to } = query
    const skip = (page - 1) * limit

    const transactions: UnifiedTransaction[] = []

    // Fetch from each source based on filter
    if (!source || source === 'MANUAL') {
      const where: any = { deletedAt: null }
      if (status) where.status = status
      if (type) where.type = type
      if (from || to) {
        where.date = {}
        if (from) where.date.gte = new Date(from)
        if (to) where.date.lte = new Date(to)
      }
      if (search) {
        where.OR = [
          { fundName: { contains: search, mode: 'insensitive' } },
          { folioNumber: { contains: search, mode: 'insensitive' } },
        ]
      }

      const faTxns = await this.prisma.fATransaction.findMany({
        where,
        include: { client: { select: { id: true, name: true, advisorId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      })

      transactions.push(...faTxns.map(t => ({
        id: t.id,
        source: 'MANUAL' as const,
        type: t.type,
        schemeName: t.fundName,
        advisorId: t.client.advisorId,
        clientId: t.clientId,
        amount: Number(t.amount),
        status: t.status,
        errorMessage: t.remarks,
        createdAt: t.createdAt,
      })))
    }

    if (!source || source === 'BSE') {
      const where: any = {}
      if (status) where.status = status
      if (type) where.orderType = type
      if (from || to) {
        where.createdAt = {}
        if (from) where.createdAt.gte = new Date(from)
        if (to) where.createdAt.lte = new Date(to)
      }
      if (search) {
        where.OR = [
          { schemeName: { contains: search, mode: 'insensitive' } },
          { bseOrderNumber: { contains: search, mode: 'insensitive' } },
        ]
      }

      const bseOrders = await this.prisma.bseOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 500,
      })

      transactions.push(...bseOrders.map(o => ({
        id: o.id,
        source: 'BSE' as const,
        type: o.orderType,
        schemeName: o.schemeName,
        advisorId: o.advisorId,
        clientId: o.clientId,
        amount: o.amount ? Number(o.amount) : null,
        status: o.status,
        errorMessage: o.bseResponseMsg,
        createdAt: o.createdAt,
      })))
    }

    if (!source || source === 'NSE') {
      const where: any = {}
      if (status) where.status = status
      if (type) where.orderType = type
      if (from || to) {
        where.createdAt = {}
        if (from) where.createdAt.gte = new Date(from)
        if (to) where.createdAt.lte = new Date(to)
      }
      if (search) {
        where.OR = [
          { schemeName: { contains: search, mode: 'insensitive' } },
          { nseOrderId: { contains: search, mode: 'insensitive' } },
        ]
      }

      const nseOrders = await this.prisma.nseOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 500,
      })

      transactions.push(...nseOrders.map(o => ({
        id: o.id,
        source: 'NSE' as const,
        type: o.orderType,
        schemeName: o.schemeName,
        advisorId: o.advisorId,
        clientId: o.clientId,
        amount: o.amount ? Number(o.amount) : null,
        status: o.status,
        errorMessage: o.nseResponseMsg,
        createdAt: o.createdAt,
      })))
    }

    // Sort merged results by date
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = transactions.length
    const paginated = transactions.slice(skip, skip + limit)

    return {
      data: paginated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getFailed() {
    const [bseFailed, nseFailed] = await Promise.all([
      this.prisma.bseOrder.findMany({
        where: { status: { in: ['FAILED', 'REJECTED'] } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.nseOrder.findMany({
        where: { status: { in: ['FAILED', 'REJECTED'] } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    const failed: UnifiedTransaction[] = [
      ...bseFailed.map(o => ({
        id: o.id,
        source: 'BSE' as const,
        type: o.orderType,
        schemeName: o.schemeName,
        advisorId: o.advisorId,
        clientId: o.clientId,
        amount: o.amount ? Number(o.amount) : null,
        status: o.status,
        errorMessage: o.bseResponseMsg,
        createdAt: o.createdAt,
      })),
      ...nseFailed.map(o => ({
        id: o.id,
        source: 'NSE' as const,
        type: o.orderType,
        schemeName: o.schemeName,
        advisorId: o.advisorId,
        clientId: o.clientId,
        amount: o.amount ? Number(o.amount) : null,
        status: o.status,
        errorMessage: o.nseResponseMsg,
        createdAt: o.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return { data: failed }
  }
}
