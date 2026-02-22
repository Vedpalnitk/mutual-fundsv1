import { Injectable, Logger, NotFoundException, ServiceUnavailableException, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@prisma/client'
import { Queue, ConnectionOptions } from 'bullmq'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'
import { NSE_TRANSACTION_TYPES } from '../core/nse-config'
import { PanCryptoService } from '../../common/services/pan-crypto.service'
import { AuditLogService } from '../../common/services/audit-log.service'
import { CacheService } from '../../common/services/cache.service'
import { BULLMQ_CONNECTION } from '../../common/queue/queue.module'
import { withTimeout } from '../../common/utils/timeout'
import { NseOrderJobData } from './nse-order.processor'

@Injectable()
export class NseOrderService {
  private readonly logger = new Logger(NseOrderService.name)
  private readonly orderQueue: Queue<NseOrderJobData>

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
    private panCrypto: PanCryptoService,
    private auditLogService: AuditLogService,
    private cacheService: CacheService,
    @Inject(BULLMQ_CONNECTION) connection: any,
  ) {
    this.orderQueue = new Queue('nse-orders', { connection })
  }

  async listOrders(advisorId: string, params?: {
    clientId?: string; status?: string; orderType?: string; page?: number; limit?: number
  }) {
    const where: any = { advisorId }
    if (params?.clientId) where.clientId = params.clientId
    if (params?.status) where.status = params.status
    if (params?.orderType) where.orderType = params.orderType

    const page = params?.page || 1
    const limit = params?.limit || 50

    const [orders, total] = await Promise.all([
      this.prisma.nseOrder.findMany({
        where,
        include: { client: { select: { id: true, name: true, pan: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.nseOrder.count({ where }),
    ])

    return {
      orders: orders.map((o) => ({
        ...o,
        client: o.client ? { ...o.client, pan: this.panCrypto.mask(o.client.pan) } : null,
      })),
      total,
      page,
      limit,
    }
  }

  async getOrder(id: string, advisorId: string) {
    const order = await this.prisma.nseOrder.findFirst({
      where: { id, advisorId },
      include: {
        client: { select: { id: true, name: true, pan: true } },
        payment: true,
        childOrders: { orderBy: { installmentNo: 'asc' } },
      },
    })
    if (!order) throw new NotFoundException('Order not found')

    return {
      ...order,
      client: order.client ? { ...order.client, pan: this.panCrypto.mask(order.client.pan) } : null,
    }
  }

  async placePurchase(advisorId: string, data: {
    clientId: string
    schemeCode: string
    schemeName?: string
    amount: number
    folioNumber?: string
    dematPhysical?: string
    mandateId?: string
    transactionId?: string
  }) {
    return this.placeOrder(advisorId, data, 'PURCHASE', NSE_TRANSACTION_TYPES.PURCHASE)
  }

  async placeRedemption(advisorId: string, data: {
    clientId: string
    schemeCode: string
    schemeName?: string
    amount?: number
    units?: number
    folioNumber?: string
    transactionId?: string
  }) {
    return this.placeOrder(advisorId, data, 'REDEMPTION', NSE_TRANSACTION_TYPES.REDEMPTION)
  }

  private async placeOrder(advisorId: string, data: any, orderType: 'PURCHASE' | 'REDEMPTION', trxnType: string) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: data.clientId, advisorId },
    })
    if (!client) throw new NotFoundException('Client not found')

    const nseUcc = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId: data.clientId },
    })

    // Create DB record in QUEUED status
    const order = await this.prisma.nseOrder.create({
      data: {
        clientId: data.clientId,
        advisorId,
        orderType,
        status: 'QUEUED',
        schemeCode: data.schemeCode,
        schemeName: data.schemeName,
        amount: data.amount,
        units: data.units,
        folioNumber: data.folioNumber,
        dematPhysical: data.dematPhysical || 'P',
        mandateId: data.mandateId,
        transactionId: data.transactionId,
        euin: data.euin || null,
        arnNumber: data.arnNumber || null,
      },
    })

    // Enqueue for async processing via BullMQ (requestBody built at processing time to avoid PAN in Redis)
    try {
      await withTimeout(
        this.orderQueue.add(
          'place-order',
          { orderId: order.id, advisorId, orderType },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { age: 86400, count: 1000 },
            removeOnFail: { age: 604800, count: 5000 },
          },
        ),
        5000,
        'Redis enqueue timeout',
      )
    } catch (err) {
      await this.prisma.nseOrder.update({
        where: { id: order.id },
        data: { status: 'FAILED', nseResponseMsg: 'Failed to enqueue order: Redis unavailable' },
      })
      throw new ServiceUnavailableException('Order processing temporarily unavailable')
    }

    this.auditLogService.log({
      userId: advisorId,
      action: 'CREATE',
      entityType: 'NseOrder',
      entityId: order.id,
      details: { orderType, schemeCode: data.schemeCode, amount: data.amount, clientId: data.clientId },
    })

    return { success: true, orderId: order.id, status: 'QUEUED', message: 'Order queued for processing' }
  }

  async searchSchemes(query: string, page = 1, limit = 20) {
    const cacheKey = `schemes:nse:${query}:${page}:${limit}`
    return this.cacheService.wrap(cacheKey, () => this._searchSchemes(query, page, limit), 3600 * 1000)
  }

  private async _searchSchemes(query: string, page = 1, limit = 20) {
    const where: Prisma.NseSchemeMasterWhereInput = query
      ? {
          OR: [
            { schemeName: { contains: query, mode: 'insensitive' } },
            { schemeCode: { contains: query, mode: 'insensitive' } },
            { isin: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}

    const [total, schemes] = await Promise.all([
      this.prisma.nseSchemeMaster.count({ where }),
      this.prisma.nseSchemeMaster.findMany({
        where,
        orderBy: { schemeName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return {
      data: schemes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async cancelOrder(id: string, advisorId: string) {
    const order = await this.prisma.nseOrder.findFirst({
      where: { id, advisorId },
    })
    if (!order) throw new NotFoundException('Order not found')

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockCancellationResponse('ORDER')
      await this.prisma.nseOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
      return { success: true, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.ORDER_CANCEL,
      { order_id: order.nseOrderId },
      credentials,
      advisorId,
      'ORDER_CANCEL',
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    if (result.success) {
      await this.prisma.nseOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
    }

    this.errorMapper.throwIfError(result)
    return result
  }
}
