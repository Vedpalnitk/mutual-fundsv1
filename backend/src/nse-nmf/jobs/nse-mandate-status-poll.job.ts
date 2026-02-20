import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { NseMandateService } from '../mandates/nse-mandate.service'

@Injectable()
export class NseMandateStatusPollJob {
  private readonly logger = new Logger(NseMandateStatusPollJob.name)

  constructor(
    private prisma: PrismaService,
    private mandateService: NseMandateService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async pollPendingMandates() {
    const pendingMandates = await this.prisma.nseMandate.findMany({
      where: {
        status: { in: ['CREATED', 'SUBMITTED'] },
        nseMandateId: { not: null },
      },
      take: 50,
    })

    if (pendingMandates.length === 0) return

    this.logger.log(`Polling ${pendingMandates.length} pending NSE mandates`)

    for (const mandate of pendingMandates) {
      try {
        await this.mandateService.refreshMandateStatus(mandate.id, mandate.advisorId)
      } catch (err) {
        this.logger.warn(`Failed to poll mandate ${mandate.id}`, err)
      }
    }
  }
}
