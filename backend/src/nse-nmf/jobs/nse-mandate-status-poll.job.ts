import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { NseMandateService } from '../mandates/nse-mandate.service'
import { BatchJobsTracker } from '../../common/batch-jobs.tracker'
import { withRetry } from '../../common/utils/retry'
import { DistributedLockService } from '../../common/services/distributed-lock.service'

@Injectable()
export class NseMandateStatusPollJob {
  private readonly logger = new Logger(NseMandateStatusPollJob.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private mandateService: NseMandateService,
    private config: ConfigService,
    private tracker: BatchJobsTracker,
    private lock: DistributedLockService,
  ) {
    this.isMockMode = this.config.get<boolean>('nmf.mockMode') === true
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async pollPendingMandates() {
    if (this.isMockMode) return
    if (!await this.lock.acquire('nse-mandate-poll', 60)) return
    try {

    await this.tracker.trackRun('nse_mandate_poll', async () => {
      const pendingMandates = await this.prisma.nseMandate.findMany({
        where: {
          status: { in: ['CREATED', 'SUBMITTED'] },
          nseMandateId: { not: null },
        },
        take: 50,
      })

      if (pendingMandates.length === 0) return { total: 0, synced: 0, failed: 0 }

      this.logger.log(`Polling ${pendingMandates.length} pending NSE mandates`)

      let synced = 0
      let failed = 0
      for (const mandate of pendingMandates) {
        try {
          await withRetry(
            () => this.mandateService.refreshMandateStatus(mandate.id, mandate.advisorId),
            { maxRetries: 2, baseDelayMs: 2000 },
          )
          synced++
        } catch (err) {
          failed++
          this.logger.warn(`Failed to poll mandate ${mandate.id}`, err)
        }
      }

      return { total: pendingMandates.length, synced, failed }
    }).catch(err => {
      this.logger.error('NSE mandate poll job failed', err)
    })

    } finally {
      await this.lock.release('nse-mandate-poll')
    }
  }
}
