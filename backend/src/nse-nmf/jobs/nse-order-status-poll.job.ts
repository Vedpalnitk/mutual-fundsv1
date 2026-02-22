import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { NseReportsService } from '../reports/nse-reports.service'
import { BatchJobsTracker } from '../../common/batch-jobs.tracker'
import { withRetry } from '../../common/utils/retry'
import { DistributedLockService } from '../../common/services/distributed-lock.service'

@Injectable()
export class NseOrderStatusPollJob {
  private readonly logger = new Logger(NseOrderStatusPollJob.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private reportsService: NseReportsService,
    private config: ConfigService,
    private tracker: BatchJobsTracker,
    private lock: DistributedLockService,
  ) {
    this.isMockMode = this.config.get<boolean>('nmf.mockMode') === true
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async pollPendingOrders() {
    if (this.isMockMode) return
    if (!await this.lock.acquire('nse-order-poll', 60)) return
    try {

    await this.tracker.trackRun('nse_order_poll', async () => {
      const pendingOrders = await this.prisma.nseOrder.findMany({
        where: {
          status: { in: ['SUBMITTED', 'TWO_FA_PENDING', 'AUTH_PENDING', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMATION_PENDING', 'PENDING_FOR_RTA'] },
          nseOrderId: { not: null },
        },
        take: 100,
        orderBy: { updatedAt: 'asc' },
      })

      if (pendingOrders.length === 0) return { total: 0, synced: 0, failed: 0 }

      this.logger.log(`Polling ${pendingOrders.length} pending NSE orders`)

      // Group by advisorId to minimize credential lookups
      const byAdvisor = new Map<string, typeof pendingOrders>()
      for (const order of pendingOrders) {
        const existing = byAdvisor.get(order.advisorId) || []
        existing.push(order)
        byAdvisor.set(order.advisorId, existing)
      }

      let synced = 0
      let failed = 0
      for (const [advisorId, orders] of byAdvisor) {
        try {
          const orderIds = orders.map(o => o.nseOrderId).filter(Boolean)
          const report = await withRetry(
            () => this.reportsService.getReport(advisorId, 'order-status', {
              order_ids: orderIds.join(','),
            }),
            { maxRetries: 2, baseDelayMs: 2000 },
          ) as any

          if (report?.data?.orders) {
            for (const orderData of report.data.orders) {
              const dbOrder = orders.find(o => o.nseOrderId === orderData.order_id)
              if (!dbOrder) continue

              const statusMap: Record<string, string> = {
                'ALLOTMENT_DONE': 'ALLOTMENT_DONE',
                'UNITS_TRANSFERRED': 'UNITS_TRANSFERRED',
                'VALIDATED_BY_RTA': 'VALIDATED_BY_RTA',
                'REJECTED': 'REJECTED',
                'CANCELLED': 'CANCELLED',
              }

              const newStatus = statusMap[orderData.status?.toUpperCase()]
              if (newStatus && newStatus !== dbOrder.status) {
                await this.prisma.nseOrder.update({
                  where: { id: dbOrder.id },
                  data: {
                    status: newStatus as any,
                    allottedUnits: orderData.allotted_units ? parseFloat(orderData.allotted_units) : null,
                    allottedNav: orderData.allotted_nav ? parseFloat(orderData.allotted_nav) : null,
                    allottedAmount: orderData.allotted_amount ? parseFloat(orderData.allotted_amount) : null,
                    allottedAt: newStatus === 'ALLOTMENT_DONE' ? new Date() : null,
                  },
                })
              }
            }
          }
          synced += orders.length
        } catch (err) {
          failed += orders.length
          this.logger.warn(`Failed to poll orders for advisor ${advisorId}`, err)
        }
      }

      return { total: pendingOrders.length, synced, failed }
    }).catch(err => {
      this.logger.error('NSE order poll job failed', err)
    })

    } finally {
      await this.lock.release('nse-order-poll')
    }
  }
}
