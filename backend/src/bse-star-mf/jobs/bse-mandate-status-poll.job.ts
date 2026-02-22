import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { ConfigService } from '@nestjs/config'
import { BSE_ENDPOINTS } from '../core/bse-config'
import { BseMandateStatus } from '@prisma/client'
import { BatchJobsTracker } from '../../common/batch-jobs.tracker'
import { withRetry } from '../../common/utils/retry'
import { DistributedLockService } from '../../common/services/distributed-lock.service'

@Injectable()
export class BseMandateStatusPollJob {
  private readonly logger = new Logger(BseMandateStatusPollJob.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private httpClient: BseHttpClient,
    private credentialsService: BseCredentialsService,
    private config: ConfigService,
    private tracker: BatchJobsTracker,
    private lock: DistributedLockService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  @Cron('*/30 * * * *') // Every 30 minutes
  async pollPendingMandates() {
    if (this.isMockMode) return
    if (!await this.lock.acquire('bse-mandate-poll', 60)) return
    try {

    await this.tracker.trackRun('bse_mandate_poll', async () => {
      const pendingMandates = await this.prisma.bseMandate.findMany({
        where: {
          status: { in: [BseMandateStatus.SUBMITTED, BseMandateStatus.CREATED] },
          mandateId: { not: null },
        },
        take: 50,
      })

      let synced = 0
      let failed = 0
      for (const mandate of pendingMandates) {
        try {
          const credentials = await this.credentialsService.getDecryptedCredentials(mandate.advisorId)

          const response = await withRetry(
            () => this.httpClient.jsonRequest(
              BSE_ENDPOINTS.MANDATE_DETAILS,
              'POST',
              {
                MemberCode: credentials.memberId,
                MandateId: mandate.mandateId,
              },
              mandate.advisorId,
              'MandateStatusPoll',
            ),
            { maxRetries: 2, baseDelayMs: 2000 },
          )

          if (response.parsed?.Status) {
            const newStatus = this.mapBseStatus(response.parsed.Status)
            if (newStatus && newStatus !== mandate.status) {
              await this.prisma.bseMandate.update({
                where: { id: mandate.id },
                data: {
                  status: newStatus,
                  umrn: response.parsed.UMRN || mandate.umrn,
                },
              })
              this.logger.log(`Mandate ${mandate.mandateId} status updated: ${mandate.status} → ${newStatus}`)
            }
          }
          synced++
        } catch (error) {
          failed++
          this.logger.warn(`Failed to poll mandate ${mandate.mandateId}`, error)
        }
      }

      return { total: pendingMandates.length, synced, failed }
    }).catch(err => {
      this.logger.error('BSE mandate poll job failed', err)
    })

    } finally {
      await this.lock.release('bse-mandate-poll')
    }
  }

  private mapBseStatus(bseStatus: string): BseMandateStatus | null {
    const map: Record<string, BseMandateStatus> = {
      APPROVED: BseMandateStatus.APPROVED,
      REJECTED: BseMandateStatus.REJECTED,
      CANCELLED: BseMandateStatus.CANCELLED,
      EXPIRED: BseMandateStatus.EXPIRED,
    }
    return map[bseStatus?.toUpperCase()] || null
  }
}
