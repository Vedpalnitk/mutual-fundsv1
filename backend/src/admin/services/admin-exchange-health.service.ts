import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AdminExchangeHealthService {
  constructor(private prisma: PrismaService) {}

  async getCombinedHealth() {
    const [bse, nse] = await Promise.all([
      this.getBseHealth(),
      this.getNseHealth(),
    ])

    const overallStatus = bse.status === 'healthy' && nse.status === 'healthy'
      ? 'healthy'
      : bse.status === 'down' || nse.status === 'down'
        ? 'down'
        : 'degraded'

    return { overallStatus, bse, nse }
  }

  async getBseHealth() {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [ordersToday, failedToday, lastSuccessOrder, apiLogs] = await Promise.all([
      this.prisma.bseOrder.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
      this.prisma.bseOrder.count({
        where: { createdAt: { gte: twentyFourHoursAgo }, status: { in: ['FAILED', 'REJECTED'] } },
      }),
      this.prisma.bseOrder.findFirst({
        where: { status: { notIn: ['FAILED', 'REJECTED', 'CREATED'] } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.bseApiLog.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { endpoint: true, statusCode: true, latencyMs: true, createdAt: true },
      }),
    ])

    const successRate = ordersToday > 0
      ? (((ordersToday - failedToday) / ordersToday) * 100).toFixed(1)
      : '100.0'

    const avgResponseTime = apiLogs.length > 0
      ? Math.round(apiLogs.reduce((s, l) => s + (l.latencyMs || 0), 0) / apiLogs.length)
      : 0

    const failedApiCalls = apiLogs.filter(l => l.statusCode && l.statusCode >= 400).length
    const uptime = apiLogs.length > 0
      ? (((apiLogs.length - failedApiCalls) / apiLogs.length) * 100).toFixed(1)
      : '100.0'

    return {
      exchange: 'BSE',
      status: failedToday > ordersToday * 0.3 && ordersToday > 0 ? 'degraded' : 'healthy',
      ordersToday,
      failedToday,
      successRate: parseFloat(successRate),
      avgResponseTime,
      uptime24h: parseFloat(uptime),
      lastSuccessfulOrder: lastSuccessOrder?.createdAt || null,
      endpoints: this.summarizeEndpoints(apiLogs),
    }
  }

  async getNseHealth() {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [ordersToday, failedToday, lastSuccessOrder, apiLogs] = await Promise.all([
      this.prisma.nseOrder.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
      this.prisma.nseOrder.count({
        where: { createdAt: { gte: twentyFourHoursAgo }, status: { in: ['FAILED', 'REJECTED'] } },
      }),
      this.prisma.nseOrder.findFirst({
        where: { status: { notIn: ['FAILED', 'REJECTED', 'CREATED'] } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.nseApiLog.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { endpoint: true, statusCode: true, latencyMs: true, createdAt: true },
      }),
    ])

    const successRate = ordersToday > 0
      ? (((ordersToday - failedToday) / ordersToday) * 100).toFixed(1)
      : '100.0'

    const avgResponseTime = apiLogs.length > 0
      ? Math.round(apiLogs.reduce((s, l) => s + (l.latencyMs || 0), 0) / apiLogs.length)
      : 0

    const failedApiCalls = apiLogs.filter(l => l.statusCode && l.statusCode >= 400).length
    const uptime = apiLogs.length > 0
      ? (((apiLogs.length - failedApiCalls) / apiLogs.length) * 100).toFixed(1)
      : '100.0'

    return {
      exchange: 'NSE',
      status: failedToday > ordersToday * 0.3 && ordersToday > 0 ? 'degraded' : 'healthy',
      ordersToday,
      failedToday,
      successRate: parseFloat(successRate),
      avgResponseTime,
      uptime24h: parseFloat(uptime),
      lastSuccessfulOrder: lastSuccessOrder?.createdAt || null,
      endpoints: this.summarizeEndpoints(apiLogs),
    }
  }

  private summarizeEndpoints(logs: { endpoint: string; statusCode: number | null; latencyMs: number | null; createdAt: Date }[]) {
    const map = new Map<string, { total: number; failed: number; totalTime: number; lastChecked: Date }>()

    for (const log of logs) {
      const key = log.endpoint || 'unknown'
      const entry = map.get(key) || { total: 0, failed: 0, totalTime: 0, lastChecked: log.createdAt }
      entry.total++
      if (log.statusCode && log.statusCode >= 400) entry.failed++
      entry.totalTime += log.latencyMs || 0
      if (log.createdAt > entry.lastChecked) entry.lastChecked = log.createdAt
      map.set(key, entry)
    }

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      status: data.failed > data.total * 0.3 ? 'degraded' : 'healthy',
      avgResponseTime: data.total > 0 ? Math.round(data.totalTime / data.total) : 0,
      lastChecked: data.lastChecked,
    }))
  }
}
