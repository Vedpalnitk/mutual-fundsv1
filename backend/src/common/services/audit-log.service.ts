import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface AuditEntry {
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'CANCEL' | 'PAYMENT' | 'LOGIN' | 'REGISTER'
  entityType: string
  entityId: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name)

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          details: entry.details || undefined,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      })
    } catch (error) {
      // Never let audit logging failures break the main flow
      this.logger.error(`Failed to write audit log: ${error}`, { entry })
    }
  }

  async logBatch(entries: AuditEntry[]): Promise<void> {
    try {
      await this.prisma.auditLog.createMany({
        data: entries.map(entry => ({
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          details: entry.details || undefined,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        })),
      })
    } catch (error) {
      this.logger.error(`Failed to write batch audit logs: ${error}`)
    }
  }

  async query(filters: {
    userId?: string
    entityType?: string
    entityId?: string
    action?: string
    from?: Date
    to?: Date
    limit?: number
    offset?: number
  }) {
    const where: any = {}
    if (filters.userId) where.userId = filters.userId
    if (filters.entityType) where.entityType = filters.entityType
    if (filters.entityId) where.entityId = filters.entityId
    if (filters.action) where.action = filters.action
    if (filters.from || filters.to) {
      where.createdAt = {}
      if (filters.from) where.createdAt.gte = filters.from
      if (filters.to) where.createdAt.lte = filters.to
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    })
  }
}
