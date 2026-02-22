import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common'
import { Worker, Job, ConnectionOptions } from 'bullmq'
import { BULLMQ_CONNECTION } from '../../common/queue/queue.module'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { ConfigService } from '@nestjs/config'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'
import { NSE_TRANSACTION_TYPES } from '../core/nse-config'
import { CacheService } from '../../common/services/cache.service'

export interface NseOrderJobData {
  orderId: string
  advisorId: string
  orderType: 'PURCHASE' | 'REDEMPTION'
}

@Injectable()
export class NseOrderProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NseOrderProcessor.name)
  private worker!: Worker

  constructor(
    @Inject(BULLMQ_CONNECTION) private readonly connection: any,
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
    private cacheService: CacheService,
  ) {}

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close()
      this.logger.log('NSE order worker closed gracefully')
    }
  }

  onModuleInit() {
    this.worker = new Worker<NseOrderJobData>(
      'nse-orders',
      async (job: Job<NseOrderJobData>) => this.processOrder(job),
      {
        connection: this.connection,
        concurrency: 5,
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800, count: 5000 },
      },
    )

    this.worker.on('completed', (job) => {
      this.logger.log(`NSE order job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      this.logger.error(`NSE order job ${job?.id} failed: ${err.message}`)
    })
  }

  private async processOrder(job: Job<NseOrderJobData>) {
    const { orderId, advisorId, orderType } = job.data

    const order = await this.prisma.nseOrder.findUnique({
      where: { id: orderId },
      include: { client: { include: { nseUccRegistration: true } } },
    })

    if (!order || order.status !== 'QUEUED') {
      this.logger.warn(`NSE order ${orderId} not found or not in QUEUED status`)
      return
    }

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    try {
      if (isMockMode) {
        const trxnType = orderType === 'PURCHASE'
          ? NSE_TRANSACTION_TYPES.PURCHASE
          : NSE_TRANSACTION_TYPES.REDEMPTION
        const mockResponse = this.mockService.mockOrderResponse(trxnType)

        await this.prisma.nseOrder.update({
          where: { id: orderId },
          data: {
            status: 'SUBMITTED',
            nseOrderId: mockResponse.trxn_order_id,
            nseResponseCode: mockResponse.trxn_status,
            nseResponseMsg: mockResponse.trxn_remark,
            submittedAt: new Date(),
          },
        })
        await this.invalidateClientCache(order.clientId, advisorId)
        return
      }

      const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

      // Build requestBody at processing time — no PAN stored in Redis
      const requestBody = {
        trxn_type: orderType === 'PURCHASE' ? NSE_TRANSACTION_TYPES.PURCHASE : NSE_TRANSACTION_TYPES.REDEMPTION,
        client_code: order.client?.nseUccRegistration?.clientCode || order.client?.pan,
        scheme_code: order.schemeCode,
        order_amount: order.amount?.toString(),
        order_units: order.units?.toString(),
        folio_no: order.folioNumber || '',
        demat_physical: order.dematPhysical || 'P',
        kyc_flag: 'Y',
        euin_number: '',
        euin_declaration: 'Y',
      }

      const response = await this.httpClient.jsonRequest(
        NSE_ENDPOINTS.NORMAL_ORDER,
        requestBody,
        credentials,
        advisorId,
        `ORDER_${orderType}`,
      )

      const result = this.errorMapper.parseResponse(response.parsed)

      await this.prisma.nseOrder.update({
        where: { id: orderId },
        data: {
          nseOrderId: result.data?.trxn_order_id || null,
          status: result.success ? 'SUBMITTED' : 'FAILED',
          nseResponseCode: result.status,
          nseResponseMsg: result.message,
          submittedAt: result.success ? new Date() : null,
        },
      })

      if (result.success) {
        await this.invalidateClientCache(order.clientId, advisorId)
      } else {
        throw new Error(`NSE order failed: ${result.message}`)
      }
    } catch (error) {
      await this.prisma.nseOrder.updateMany({
        where: { id: orderId, status: 'QUEUED' },
        data: {
          status: 'FAILED',
          nseResponseMsg: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      throw error
    }
  }

  private async invalidateClientCache(clientId: string, advisorId: string) {
    try {
      const client = await this.prisma.fAClient.findUnique({
        where: { id: clientId },
        select: { userId: true },
      })
      if (client?.userId) {
        await this.cacheService.del(`portfolio:${client.userId}`)
      }
      await this.cacheService.del(`dashboard:${advisorId}`)
    } catch (err) {
      this.logger.warn('Failed to invalidate cache after order update', err)
    }
  }
}
