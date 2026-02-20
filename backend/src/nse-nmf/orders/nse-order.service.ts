import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'
import { NSE_TRANSACTION_TYPES } from '../core/nse-config'
import { PanCryptoService } from '../../common/services/pan-crypto.service'
import { AuditLogService } from '../../common/services/audit-log.service'

@Injectable()
export class NseOrderService {
  private readonly logger = new Logger(NseOrderService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
    private panCrypto: PanCryptoService,
    private auditLogService: AuditLogService,
  ) {}

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

    // Create DB record
    const order = await this.prisma.nseOrder.create({
      data: {
        clientId: data.clientId,
        advisorId,
        orderType,
        status: 'SUBMITTED',
        schemeCode: data.schemeCode,
        schemeName: data.schemeName,
        amount: data.amount,
        units: data.units,
        folioNumber: data.folioNumber,
        dematPhysical: data.dematPhysical || 'P',
        mandateId: data.mandateId,
        transactionId: data.transactionId,
        submittedAt: new Date(),
      },
    })

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockOrderResponse(trxnType)
      await this.prisma.nseOrder.update({
        where: { id: order.id },
        data: {
          nseOrderId: mockResponse.trxn_order_id,
          nseResponseCode: mockResponse.trxn_status,
          nseResponseMsg: mockResponse.trxn_remark,
        },
      })
      this.auditLogService.log({
        userId: advisorId,
        action: 'CREATE',
        entityType: 'NseOrder',
        entityId: order.id,
        details: { orderType, schemeCode: data.schemeCode, amount: data.amount, clientId: data.clientId },
      })

      return { success: true, orderId: order.id, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      trxn_type: trxnType,
      client_code: nseUcc?.clientCode || client.pan,
      scheme_code: data.schemeCode,
      order_amount: data.amount?.toString(),
      order_units: data.units?.toString(),
      folio_no: data.folioNumber || '',
      demat_physical: data.dematPhysical || 'P',
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
      where: { id: order.id },
      data: {
        nseOrderId: result.data?.trxn_order_id || null,
        status: result.success ? 'SUBMITTED' : 'FAILED',
        nseResponseCode: result.status,
        nseResponseMsg: result.message,
      },
    })

    this.errorMapper.throwIfError(result)

    this.auditLogService.log({
      userId: advisorId,
      action: 'CREATE',
      entityType: 'NseOrder',
      entityId: order.id,
      details: { orderType, schemeCode: data.schemeCode, amount: data.amount, clientId: data.clientId },
    })

    return { ...result, success: true, orderId: order.id }
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
