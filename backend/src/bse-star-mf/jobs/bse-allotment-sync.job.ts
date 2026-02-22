import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { BseReportsService } from '../reports/bse-reports.service'
import { ConfigService } from '@nestjs/config'
import { BseOrderStatus } from '@prisma/client'
import { BatchJobsTracker } from '../../common/batch-jobs.tracker'
import { withRetry } from '../../common/utils/retry'
import { DistributedLockService } from '../../common/services/distributed-lock.service'

@Injectable()
export class BseAllotmentSyncJob {
  private readonly logger = new Logger(BseAllotmentSyncJob.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private reportsService: BseReportsService,
    private config: ConfigService,
    private tracker: BatchJobsTracker,
    private lock: DistributedLockService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  // Nightly allotment reconciliation (weekdays 9pm)
  @Cron('0 21 * * 1-5')
  async syncAllotments() {
    if (this.isMockMode) return
    if (!await this.lock.acquire('bse-allotment-sync', 120)) return
    try {

    this.logger.log('Starting nightly allotment reconciliation')

    await this.tracker.trackRun('bse_allotment_sync', async () => {
      const activeAdvisors = await this.prisma.bsePartnerCredential.findMany({
        where: { isActive: true },
        select: { userId: true },
      })

      const today = new Date()
      const fromDate = new Date(today)
      fromDate.setDate(fromDate.getDate() - 7) // Look back 7 days

      let synced = 0
      let failed = 0
      for (const advisor of activeAdvisors) {
        try {
          const result = await withRetry(
            () => this.reportsService.queryAllotmentStatement(advisor.userId, {
              fromDate: fromDate.toISOString().split('T')[0],
              toDate: today.toISOString().split('T')[0],
            }),
            { maxRetries: 2, baseDelayMs: 2000 },
          )

          if (result?.Allotments?.length) {
            for (const allotment of result.Allotments) {
              const order = await this.prisma.bseOrder.findFirst({
                where: {
                  bseOrderNumber: allotment.OrderNumber,
                  advisorId: advisor.userId,
                },
              })

              if (order && order.status !== BseOrderStatus.ALLOTTED) {
                await this.prisma.bseOrder.update({
                  where: { id: order.id },
                  data: {
                    status: BseOrderStatus.ALLOTTED,
                    allottedUnits: allotment.Units ? parseFloat(allotment.Units) : null,
                    allottedNav: allotment.NAV ? parseFloat(allotment.NAV) : null,
                    allottedAmount: allotment.Amount ? parseFloat(allotment.Amount) : null,
                    allottedAt: new Date(),
                  },
                })

                this.logger.log(`Allotment synced for order ${allotment.OrderNumber}`)
                synced++
              }
            }
          }
        } catch (error) {
          failed++
          this.logger.warn(`Allotment sync failed for advisor ${advisor.userId}`, error)
        }
      }

      this.logger.log('Nightly allotment reconciliation complete')
      return { total: activeAdvisors.length, synced, failed }
    }).catch(err => {
      this.logger.error('BSE allotment sync job failed', err)
    })

    } finally {
      await this.lock.release('bse-allotment-sync')
    }
  }
}
