import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common'
import { Worker, Job, ConnectionOptions } from 'bullmq'
import { BULLMQ_CONNECTION } from '../../common/queue/queue.module'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseSoapBuilder } from '../core/bse-soap.builder'
import { BseErrorMapper } from '../core/bse-error.mapper'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { BseAuthService } from '../auth/bse-auth.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { ConfigService } from '@nestjs/config'
import { BSE_ENDPOINTS, BSE_SOAP_ACTIONS } from '../core/bse-config'
import { BseOrderStatus } from '@prisma/client'
import { CacheService } from '../../common/services/cache.service'
import { XMLParser } from 'fast-xml-parser'

export interface BseOrderJobData {
  orderId: string
  advisorId: string
}

@Injectable()
export class BseOrderProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BseOrderProcessor.name)
  private readonly xmlParser = new XMLParser()
  private readonly isMockMode: boolean
  private worker!: Worker

  constructor(
    @Inject(BULLMQ_CONNECTION) private readonly connection: any,
    private prisma: PrismaService,
    private httpClient: BseHttpClient,
    private soapBuilder: BseSoapBuilder,
    private errorMapper: BseErrorMapper,
    private credentialsService: BseCredentialsService,
    private authService: BseAuthService,
    private mockService: BseMockService,
    private config: ConfigService,
    private cacheService: CacheService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close()
      this.logger.log('BSE order worker closed gracefully')
    }
  }

  onModuleInit() {
    this.worker = new Worker<BseOrderJobData>(
      'bse-orders',
      async (job: Job<BseOrderJobData>) => this.processOrder(job),
      {
        connection: this.connection,
        concurrency: 5,
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800, count: 5000 },
      },
    )

    this.worker.on('completed', (job) => {
      this.logger.log(`BSE order job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      this.logger.error(`BSE order job ${job?.id} failed: ${err.message}`)
    })
  }

  private async processOrder(job: Job<BseOrderJobData>) {
    const { orderId, advisorId } = job.data

    const order = await this.prisma.bseOrder.findUnique({
      where: { id: orderId },
    })

    if (!order || order.status !== BseOrderStatus.CREATED) {
      this.logger.warn(`Order ${orderId} not found or not in CREATED status`)
      return
    }

    try {
      if (this.isMockMode) {
        const mockResponse = this.mockService.mockOrderEntryResponse(order.transCode || 'NEW')
        const result = this.errorMapper.parsePipeResponse(mockResponse)
        const bseOrderNumber = result.data?.[0] || null

        await this.prisma.bseOrder.update({
          where: { id: orderId },
          data: {
            status: BseOrderStatus.SUBMITTED,
            bseOrderNumber,
            bseResponseCode: result.code,
            bseResponseMsg: result.message,
            submittedAt: new Date(),
          },
        })
        await this.invalidateClientCache(order.clientId, advisorId)
        return
      }

      const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
      const token = await this.authService.getOrderEntryToken(advisorId)

      const pipeParams = this.soapBuilder.buildPipeParams([
        order.transCode || 'NEW',
        order.referenceNumber,
        order.bseOrderNumber || '',
        credentials.memberId,
        order.clientId,
        order.schemeCode,
        order.buySell || 'P',
        order.buySellType || '',
        order.dpTxnMode || 'P',
        order.amount?.toString() || '',
        order.units?.toString() || '',
        '', '', '', '', '', '',
        credentials.euin || '',
        credentials.euin ? 'Y' : 'N',
        '', '', '',
        token,
        '', '', '',
      ])

      const soapBody = this.soapBuilder.buildOrderEntryBody(order.transCode || 'NEW', pipeParams)

      const response = await this.httpClient.soapRequest(
        BSE_ENDPOINTS.ORDER_ENTRY,
        BSE_SOAP_ACTIONS.ORDER_ENTRY,
        soapBody,
        advisorId,
        `OrderEntry_${order.transCode || 'NEW'}_${order.buySell || 'P'}`,
      )

      const responseValue = this.parseOrderEntryResponse(response.body)
      const result = this.errorMapper.parsePipeResponse(responseValue)
      const bseOrderNumber = result.data?.[0] || null
      const newStatus = result.success ? BseOrderStatus.SUBMITTED : BseOrderStatus.REJECTED

      await this.prisma.bseOrder.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          bseOrderNumber,
          bseResponseCode: result.code,
          bseResponseMsg: result.message,
          submittedAt: result.success ? new Date() : null,
        },
      })

      if (result.success) {
        await this.invalidateClientCache(order.clientId, advisorId)
      } else {
        throw new Error(`BSE order rejected: ${result.message}`)
      }
    } catch (error) {
      await this.prisma.bseOrder.updateMany({
        where: { id: orderId, status: BseOrderStatus.CREATED },
        data: {
          status: BseOrderStatus.FAILED,
          bseResponseMsg: error instanceof Error ? error.message : 'Unknown error',
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

  private parseOrderEntryResponse(xml: string): string {
    const parsed = this.xmlParser.parse(xml)
    const envelope = parsed['soap:Envelope'] || parsed['s:Envelope']
    const body = envelope?.['soap:Body'] || envelope?.['s:Body']
    const result = body?.orderEntryParamResponse?.orderEntryParamResult
    if (!result) throw new Error('Failed to parse BSE order entry response')
    return String(result)
  }
}
