import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface TrackRunResult {
  total?: number
  synced?: number
  failed?: number
}

@Injectable()
export class BatchJobsTracker {
  private readonly logger = new Logger(BatchJobsTracker.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Wrap a cron job handler with DataSyncLog tracking.
   * Creates a 'started' entry, runs the callback, then updates to 'completed' or 'failed'.
   * Re-throws errors so existing loggers still catch them.
   */
  async trackRun(
    syncType: string,
    fn: () => Promise<TrackRunResult | void>,
  ): Promise<void> {
    const log = await this.prisma.dataSyncLog.create({
      data: { syncType, status: 'started' },
    })

    try {
      const result = await fn()

      await this.prisma.dataSyncLog.update({
        where: { id: log.id },
        data: {
          status: 'completed',
          recordsTotal: result?.total ?? null,
          recordsSynced: result?.synced ?? null,
          recordsFailed: result?.failed ?? null,
          completedAt: new Date(),
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      await this.prisma.dataSyncLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          errorMessage: message.slice(0, 2000),
          completedAt: new Date(),
        },
      }).catch(updateErr => {
        this.logger.error(`Failed to update sync log ${log.id} for ${syncType}`, updateErr)
      })

      throw error
    }
  }
}
