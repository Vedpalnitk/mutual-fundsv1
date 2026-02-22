import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditLogQueryDto } from '../dto/audit-log-query.dto'

@Injectable()
export class AdminAuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AuditLogQueryDto) {
    const { page = 1, limit = 20, search, action, entityType, userId, from, to } = query
    const skip = (page - 1) * limit

    const where: any = {}
    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (userId) where.userId = userId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }
    if (search) {
      where.OR = [
        { entityType: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, profile: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getStats() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [total, todayCount, uniqueUsersToday, actionCounts] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.auditLog.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 1,
      }),
    ])

    return {
      totalLogs: total,
      todayActivity: todayCount,
      uniqueUsersToday: uniqueUsersToday.length,
      topAction: actionCounts[0]?.action || 'N/A',
    }
  }
}
