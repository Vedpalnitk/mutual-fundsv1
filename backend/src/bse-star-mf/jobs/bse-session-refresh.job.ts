import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { BseSessionManager } from '../core/bse-session.manager'
import { BseSessionType } from '@prisma/client'
import { BatchJobsTracker } from '../../common/batch-jobs.tracker'
import { DistributedLockService } from '../../common/services/distributed-lock.service'

@Injectable()
export class BseSessionRefreshJob {
  private readonly logger = new Logger(BseSessionRefreshJob.name)

  constructor(
    private prisma: PrismaService,
    private sessionManager: BseSessionManager,
    private tracker: BatchJobsTracker,
    private lock: DistributedLockService,
  ) {}

  // Refresh ORDER_ENTRY tokens 5 minutes before expiry
  @Cron('*/5 * * * *') // Every 5 minutes
  async refreshExpiringTokens() {
    if (!await this.lock.acquire('bse-token-refresh', 60)) return
    try {

    await this.tracker.trackRun('bse_token_refresh', async () => {
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

      const expiringSessions = await this.prisma.bseSessionToken.findMany({
        where: {
          sessionType: BseSessionType.ORDER_ENTRY,
          expiresAt: { lte: fiveMinutesFromNow },
        },
      })

      let synced = 0
      let failed = 0
      for (const session of expiringSessions) {
        try {
          await this.sessionManager.getSessionToken(session.userId, BseSessionType.ORDER_ENTRY)
          this.logger.log(`Refreshed ORDER_ENTRY token for user ${session.userId}`)
          synced++
        } catch (error) {
          this.logger.warn(`Failed to refresh token for user ${session.userId}`, error)
          failed++
        }
      }

      return { total: expiringSessions.length, synced, failed }
    }).catch(err => {
      this.logger.error('BSE token refresh job failed', err)
    })

    } finally {
      await this.lock.release('bse-token-refresh')
    }
  }

  // Clean up expired tokens daily
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    if (!await this.lock.acquire('bse-token-cleanup', 60)) return
    try {

    await this.tracker.trackRun('bse_token_cleanup', async () => {
      const result = await this.prisma.bseSessionToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      })

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired BSE session tokens`)
      }

      return { total: result.count, synced: result.count, failed: 0 }
    }).catch(err => {
      this.logger.error('BSE token cleanup job failed', err)
    })

    } finally {
      await this.lock.release('bse-token-cleanup')
    }
  }
}
