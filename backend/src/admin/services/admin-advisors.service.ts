import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AdvisorQueryDto } from '../dto/advisor-query.dto'

@Injectable()
export class AdminAdvisorsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [totalAdvisors, activeAdvisors, clientCounts, aumData] = await Promise.all([
      this.prisma.user.count({ where: { role: { in: ['advisor', 'fa_staff'] }, deletedAt: null } }),
      this.prisma.user.count({ where: { role: { in: ['advisor', 'fa_staff'] }, isActive: true, deletedAt: null } }),
      this.prisma.fAClient.count({ where: { deletedAt: null } }),
      this.prisma.fAHolding.aggregate({ _sum: { currentValue: true } }),
    ])

    const totalAUM = Number(aumData._sum.currentValue || 0)
    const avgClientsPerAdvisor = totalAdvisors > 0 ? Math.round(clientCounts / totalAdvisors) : 0

    return {
      totalAdvisors,
      activeAdvisors,
      totalAUM,
      avgClientsPerAdvisor,
    }
  }

  async findAll(query: AdvisorQueryDto) {
    const { page = 1, limit = 20, search, sortBy = 'clients', sortDir = 'desc' } = query
    const skip = (page - 1) * limit

    const where: any = {
      role: { in: ['advisor', 'fa_staff'] },
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const advisors = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        profile: { select: { name: true } },
        advisorClients: {
          where: { deletedAt: null },
          select: {
            id: true,
            holdings: { select: { currentValue: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute derived fields
    const enriched = advisors.map(a => {
      const clientCount = a.advisorClients.length
      const aum = a.advisorClients.reduce(
        (sum, c) => sum + c.holdings.reduce((s, h) => s + Number(h.currentValue || 0), 0),
        0,
      )
      return {
        id: a.id,
        email: a.email,
        name: a.profile?.name || 'Unknown',
        isActive: a.isActive,
        lastLoginAt: a.lastLoginAt,
        createdAt: a.createdAt,
        clientCount,
        aum,
        txn30d: 0, // computed below if needed
      }
    })

    // Sort
    enriched.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'aum': cmp = a.aum - b.aum; break
        case 'clients': cmp = a.clientCount - b.clientCount; break
        case 'lastLogin':
          cmp = (a.lastLoginAt?.getTime() || 0) - (b.lastLoginAt?.getTime() || 0)
          break
        default: cmp = a.clientCount - b.clientCount
      }
      return sortDir === 'desc' ? -cmp : cmp
    })

    const total = enriched.length
    const paginated = enriched.slice(skip, skip + limit)

    return {
      data: paginated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async findOne(id: string) {
    const advisor = await this.prisma.user.findFirst({
      where: { id, role: { in: ['advisor', 'fa_staff'] } },
      select: {
        id: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        profile: { select: { name: true, city: true } },
        advisorClients: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
            holdings: { select: { currentValue: true } },
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                id: true,
                fundName: true,
                type: true,
                amount: true,
                status: true,
                date: true,
              },
            },
          },
        },
      },
    })

    if (!advisor) throw new NotFoundException('Advisor not found')

    const clients = advisor.advisorClients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      createdAt: c.createdAt,
      aum: c.holdings.reduce((s, h) => s + Number(h.currentValue || 0), 0),
    }))

    const recentTransactions = advisor.advisorClients
      .flatMap(c => c.transactions)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)

    const totalAUM = clients.reduce((s, c) => s + c.aum, 0)

    return {
      id: advisor.id,
      email: advisor.email,
      name: advisor.profile?.name || 'Unknown',
      city: advisor.profile?.city || null,
      isActive: advisor.isActive,
      lastLoginAt: advisor.lastLoginAt,
      createdAt: advisor.createdAt,
      totalAUM,
      clientCount: clients.length,
      clients,
      recentTransactions,
    }
  }
}
