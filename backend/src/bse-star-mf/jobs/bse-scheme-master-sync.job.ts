import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { BseMastersService } from '../masters/bse-masters.service'
import { PrismaService } from '../../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'
import { BatchJobsTracker } from '../../common/batch-jobs.tracker'
import { withRetry } from '../../common/utils/retry'
import { DistributedLockService } from '../../common/services/distributed-lock.service'

@Injectable()
export class BseSchemeMasterSyncJob {
  private readonly logger = new Logger(BseSchemeMasterSyncJob.name)
  private readonly isMockMode: boolean

  constructor(
    private mastersService: BseMastersService,
    private prisma: PrismaService,
    private config: ConfigService,
    private tracker: BatchJobsTracker,
    private lock: DistributedLockService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  // Weekly scheme master sync (Sunday at 2am)
  @Cron('0 2 * * 0')
  async syncSchemeMaster() {
    if (this.isMockMode) return
    if (!await this.lock.acquire('bse-scheme-master', 300)) return
    try {

    this.logger.log('Starting weekly BSE scheme master sync')

    await this.tracker.trackRun('bse_scheme_master', async () => {
      const activeAdvisors = await this.prisma.bsePartnerCredential.findMany({
        where: { isActive: true },
        select: { userId: true },
        take: 1,
      })

      if (activeAdvisors.length === 0) {
        this.logger.warn('No active BSE credentials found, skipping scheme master sync')
        return { total: 0, synced: 0, failed: 0 }
      }

      const result = await withRetry(
        () => this.mastersService.syncSchemeMaster(activeAdvisors[0].userId),
        { maxRetries: 2, baseDelayMs: 2000 },
      )
      this.logger.log(`Scheme master sync complete: ${result.synced} schemes synced`)
      return { total: result.synced, synced: result.synced, failed: 0 }
    }).catch(err => {
      this.logger.error('BSE scheme master sync job failed', err)
    })

    } finally {
      await this.lock.release('bse-scheme-master')
    }
  }
}
