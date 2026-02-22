import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AnalyticsTrendQueryDto } from '../dto/analytics-query.dto'

@Injectable()
export class AdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers, activeUsers, totalAdvisors,
      aumData, txnCount, txnVolume,
      newUsersThisMonth,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.user.count({ where: { role: { in: ['advisor', 'fa_staff'] }, deletedAt: null } }),
      this.prisma.fAHolding.aggregate({ _sum: { currentValue: true } }),
      this.prisma.fATransaction.count({ where: { deletedAt: null } }),
      this.prisma.fATransaction.aggregate({ _sum: { amount: true }, where: { deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
    ])

    return {
      totalUsers,
      activeUsers,
      totalAdvisors,
      totalAUM: Number(aumData._sum.currentValue || 0),
      totalTransactions: txnCount,
      totalVolume: Number(txnVolume._sum.amount || 0),
      newUsersThisMonth,
      growthRate: totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : '0',
    }
  }

  async getTrends(query: AnalyticsTrendQueryDto) {
    const { metric = 'users', period = 'daily', range = '30d' } = query

    const rangeMap: Record<string, number> = {
      '7d': 7, '30d': 30, '90d': 90, '1y': 365,
    }
    const days = rangeMap[range] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (metric === 'users') {
      const users = await this.prisma.user.findMany({
        where: { createdAt: { gte: startDate }, deletedAt: null },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
      return this.aggregateByPeriod(users.map(u => u.createdAt), period)
    }

    if (metric === 'transactions') {
      const txns = await this.prisma.fATransaction.findMany({
        where: { createdAt: { gte: startDate }, deletedAt: null },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
      return this.aggregateByPeriod(txns.map(t => t.createdAt), period)
    }

    // Default: return empty series for unsupported metrics
    return []
  }

  async getDistribution() {
    const [roleCounts, txnTypeCounts] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: { deletedAt: null },
      }),
      this.prisma.fATransaction.groupBy({
        by: ['type'],
        _count: true,
        where: { deletedAt: null },
      }),
    ])

    return {
      userDistribution: roleCounts.map(r => ({ label: r.role, value: r._count })),
      transactionDistribution: txnTypeCounts.map(t => ({ label: t.type, value: t._count })),
    }
  }

  private aggregateByPeriod(dates: Date[], period: string) {
    const buckets: Record<string, number> = {}

    for (const date of dates) {
      let key: string
      if (period === 'daily') {
        key = date.toISOString().split('T')[0]
      } else if (period === 'weekly') {
        const d = new Date(date)
        d.setDate(d.getDate() - d.getDay())
        key = d.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }
      buckets[key] = (buckets[key] || 0) + 1
    }

    return Object.entries(buckets)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
}
