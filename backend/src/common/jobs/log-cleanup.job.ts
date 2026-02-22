import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { DistributedLockService } from '../services/distributed-lock.service'

@Injectable()
export class LogCleanupJob {
  private readonly logger = new Logger(LogCleanupJob.name)

  constructor(
    private prisma: PrismaService,
    private lockService: DistributedLockService,
  ) {}

  @Cron('0 3 * * *') // Daily at 3am
  async cleanOldLogs() {
    const acquired = await this.lockService.acquire('log-cleanup', 600) // 10 min
    if (!acquired) return

    try {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days

      await this.cleanTable('bseApiLog', cutoff)
      await this.cleanTable('nseApiLog', cutoff)
      await this.cleanTable('auditLog', cutoff)
    } catch (error) {
      this.logger.error('Log cleanup failed', error)
    } finally {
      await this.lockService.release('log-cleanup')
    }
  }

  private async cleanTable(table: 'bseApiLog' | 'nseApiLog' | 'auditLog', cutoff: Date) {
    let totalDeleted = 0
    let batch: number

    do {
      // Find a batch of stale IDs first, then delete by ID — avoids full-table lock
      const staleIds = await this.findStaleIds(table, cutoff)
      if (staleIds.length === 0) break

      batch = await this.deleteBatch(table, staleIds)
      totalDeleted += batch

      // Brief pause between batches to avoid locking pressure
      if (batch === 1000) {
        await new Promise((r) => setTimeout(r, 100))
      }
    } while (batch === 1000)

    if (totalDeleted > 0) {
      this.logger.log(`${table}: ${totalDeleted} rows cleaned up`)
    }
  }

  private async findStaleIds(table: 'bseApiLog' | 'nseApiLog' | 'auditLog', cutoff: Date): Promise<string[]> {
    const where = { createdAt: { lt: cutoff } }
    const select = { id: true }
    const take = 1000

    let rows: { id: string }[]
    switch (table) {
      case 'bseApiLog':
        rows = await this.prisma.bseApiLog.findMany({ where, select, take })
        break
      case 'nseApiLog':
        rows = await this.prisma.nseApiLog.findMany({ where, select, take })
        break
      case 'auditLog':
        rows = await this.prisma.auditLog.findMany({ where, select, take })
        break
    }
    return rows.map((r) => r.id)
  }

  private async deleteBatch(table: 'bseApiLog' | 'nseApiLog' | 'auditLog', ids: string[]): Promise<number> {
    const where = { id: { in: ids } }
    let result: { count: number }
    switch (table) {
      case 'bseApiLog':
        result = await this.prisma.bseApiLog.deleteMany({ where })
        break
      case 'nseApiLog':
        result = await this.prisma.nseApiLog.deleteMany({ where })
        break
      case 'auditLog':
        result = await this.prisma.auditLog.deleteMany({ where })
        break
    }
    return result.count
  }
}
