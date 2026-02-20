import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { NseReportsService } from '../reports/nse-reports.service'

@Injectable()
export class NseOrderStatusPollJob {
  private readonly logger = new Logger(NseOrderStatusPollJob.name)

  constructor(
    private prisma: PrismaService,
    private reportsService: NseReportsService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async pollPendingOrders() {
    const pendingOrders = await this.prisma.nseOrder.findMany({
      where: {
        status: { in: ['SUBMITTED', 'TWO_FA_PENDING', 'AUTH_PENDING', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMATION_PENDING', 'PENDING_FOR_RTA'] },
        nseOrderId: { not: null },
      },
      take: 100,
    })

    if (pendingOrders.length === 0) return

    this.logger.log(`Polling ${pendingOrders.length} pending NSE orders`)

    // Group by advisorId to minimize credential lookups
    const byAdvisor = new Map<string, typeof pendingOrders>()
    for (const order of pendingOrders) {
      const existing = byAdvisor.get(order.advisorId) || []
      existing.push(order)
      byAdvisor.set(order.advisorId, existing)
    }

    for (const [advisorId, orders] of byAdvisor) {
      try {
        const orderIds = orders.map(o => o.nseOrderId).filter(Boolean)
        const report = await this.reportsService.getReport(advisorId, 'order-status', {
          order_ids: orderIds.join(','),
        }) as any

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
      } catch (err) {
        this.logger.warn(`Failed to poll orders for advisor ${advisorId}`, err)
      }
    }
  }
}
