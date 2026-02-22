import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common'
import { Worker, Job, ConnectionOptions } from 'bullmq'
import { BULLMQ_CONNECTION } from './queue.module'
import { PrismaService } from '../../prisma/prisma.service'

export interface ApiLogJobData {
  table: 'bseApiLog' | 'nseApiLog'
  data: Record<string, any>
}

@Injectable()
export class ApiLogProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApiLogProcessor.name)
  private worker!: Worker

  constructor(
    @Inject(BULLMQ_CONNECTION) private readonly connection: any,
    private prisma: PrismaService,
  ) {}

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close()
      this.logger.log('API log worker closed gracefully')
    }
  }

  onModuleInit() {
    this.worker = new Worker<ApiLogJobData>(
      'api-logs',
      async (job: Job<ApiLogJobData>) => this.processLog(job),
      {
        connection: this.connection,
        concurrency: 10,
        removeOnComplete: { age: 3600, count: 500 },
        removeOnFail: { age: 86400, count: 1000 },
      },
    )

    this.worker.on('failed', (job, err) => {
      this.logger.warn(`API log job ${job?.id} failed: ${err.message}`)
    })
  }

  private async processLog(job: Job<ApiLogJobData>) {
    const { table, data } = job.data
    if (table === 'bseApiLog') {
      await this.prisma.bseApiLog.create({ data: data as any })
    } else if (table === 'nseApiLog') {
      await this.prisma.nseApiLog.create({ data: data as any })
    }
  }
}
