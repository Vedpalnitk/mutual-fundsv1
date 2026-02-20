import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { XMLParser } from 'fast-xml-parser'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseSoapBuilder } from '../core/bse-soap.builder'
import { BseErrorMapper } from '../core/bse-error.mapper'
import { BseReferenceNumberService } from '../core/bse-reference-number.service'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { BseAuthService } from '../auth/bse-auth.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { BSE_ENDPOINTS, BSE_SOAP_ACTIONS } from '../core/bse-config'
import { BseOrderType, BseOrderStatus } from '@prisma/client'
import { PlaceOrderDto, BseBuySell, BseBuySellType } from './dto/place-order.dto'
import { AuditLogService } from '../../common/services/audit-log.service'

interface OrderFilters {
  clientId?: string
  status?: BseOrderStatus
  orderType?: BseOrderType
  page?: number
  limit?: number
}

@Injectable()
export class BseOrderService {
  private readonly logger = new Logger(BseOrderService.name)
  private readonly xmlParser = new XMLParser()
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private httpClient: BseHttpClient,
    private soapBuilder: BseSoapBuilder,
    private errorMapper: BseErrorMapper,
    private refNumberService: BseReferenceNumberService,
    private credentialsService: BseCredentialsService,
    private authService: BseAuthService,
    private mockService: BseMockService,
    private config: ConfigService,
    private auditLogService: AuditLogService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  /**
   * Place a lumpsum purchase order via SOAP orderEntryParam
   * TransCode: NEW, BuySell: P
   */
  async placePurchase(advisorId: string, dto: PlaceOrderDto) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount is required for purchase orders')
    }

    dto.buySell = BseBuySell.PURCHASE
    if (!dto.buySellType) {
      dto.buySellType = BseBuySellType.FRESH
    }

    return this.placeOrder(advisorId, dto, 'NEW', BseOrderType.PURCHASE)
  }

  /**
   * Place a redemption order via SOAP orderEntryParam
   * TransCode: NEW, BuySell: R
   */
  async placeRedemption(advisorId: string, dto: PlaceOrderDto) {
    if (!dto.amount && !dto.units) {
      throw new BadRequestException('Either amount or units is required for redemption')
    }

    dto.buySell = BseBuySell.REDEMPTION

    return this.placeOrder(advisorId, dto, 'NEW', BseOrderType.REDEMPTION)
  }

  /**
   * Cancel an existing order via SOAP orderEntryParam
   * TransCode: CXL
   */
  async cancelOrder(orderId: string, advisorId: string) {
    const order = await this.prisma.bseOrder.findUnique({
      where: { id: orderId },
    })

    if (!order || order.advisorId !== advisorId) {
      throw new NotFoundException('Order not found')
    }

    if (!([BseOrderStatus.SUBMITTED, BseOrderStatus.ACCEPTED, BseOrderStatus.PAYMENT_PENDING] as BseOrderStatus[]).includes(order.status)) {
      throw new BadRequestException(`Order cannot be cancelled in status: ${order.status}`)
    }

    if (!order.bseOrderNumber) {
      throw new BadRequestException('Order has no BSE order number — cannot cancel')
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    if (this.isMockMode) {
      const mockResponse = this.mockService.mockOrderEntryResponse('CXL')
      const result = this.errorMapper.parsePipeResponse(mockResponse)

      await this.prisma.bseOrder.update({
        where: { id: orderId },
        data: {
          status: BseOrderStatus.CANCELLED,
          bseResponseCode: result.code,
          bseResponseMsg: result.message,
        },
      })

      this.auditLogService.log({
        userId: advisorId,
        action: 'CANCEL',
        entityType: 'BseOrder',
        entityId: orderId,
      })

      return {
        id: order.id,
        status: BseOrderStatus.CANCELLED,
        responseCode: result.code,
        message: result.message,
      }
    }

    const token = await this.authService.getOrderEntryToken(advisorId)

    // Build cancel pipe params: TransCode|UniqueRefNo|OrderId|...
    const pipeParams = this.soapBuilder.buildPipeParams([
      'CXL',                        // TransCode
      order.referenceNumber,         // UniqueRefNo
      order.bseOrderNumber,          // OrderId
      credentials.memberId,          // MemberId
      order.clientId,                // ClientCode
      order.schemeCode,              // SchemeCode
      order.buySell,                 // BuySell
      order.buySellType,             // BuySellType
      order.dpTxnMode || 'P',       // DPTxn
      order.amount?.toString() || '', // OrderVal
      '',                            // Qty
      '',                            // AllRedeem
      order.folioNumber || '',       // FolioNo
      '',                            // Remarks
      '',                            // KYCStatus
      '',                            // RefNo
      '',                            // SubBrCode
      credentials.euin || '',        // EUIN
      'N',                           // EUINVal
      '',                            // MinRedeem
      '',                            // DPC
      '',                            // IPAdd
      token,                         // Password
      '',                            // Param1
      '',                            // Param2
      '',                            // Param3
    ])

    const soapBody = this.soapBuilder.buildOrderEntryBody('CXL', pipeParams)

    const response = await this.httpClient.soapRequest(
      BSE_ENDPOINTS.ORDER_ENTRY,
      BSE_SOAP_ACTIONS.ORDER_ENTRY,
      soapBody,
      advisorId,
      'OrderEntry_CXL',
    )

    const responseValue = this.parseOrderEntryResponse(response.body)
    const result = this.errorMapper.parsePipeResponse(responseValue)
    this.errorMapper.throwIfError(result)

    await this.prisma.bseOrder.update({
      where: { id: orderId },
      data: {
        status: BseOrderStatus.CANCELLED,
        bseResponseCode: result.code,
        bseResponseMsg: result.message,
      },
    })

    this.auditLogService.log({
      userId: advisorId,
      action: 'CANCEL',
      entityType: 'BseOrder',
      entityId: orderId,
    })

    return {
      id: order.id,
      status: BseOrderStatus.CANCELLED,
      responseCode: result.code,
      message: result.message,
    }
  }

  /**
   * Get order detail from DB
   */
  async getOrder(orderId: string, advisorId: string) {
    const order = await this.prisma.bseOrder.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        childOrders: { orderBy: { installmentNo: 'asc' } },
      },
    })

    if (!order || order.advisorId !== advisorId) {
      throw new NotFoundException('Order not found')
    }

    return order
  }

  /**
   * List orders with pagination and filters
   */
  async listOrders(advisorId: string, filters: OrderFilters) {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    const where: any = { advisorId }
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.status) where.status = filters.status
    if (filters.orderType) where.orderType = filters.orderType

    const [orders, total] = await Promise.all([
      this.prisma.bseOrder.findMany({
        where,
        include: { payment: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bseOrder.count({ where }),
    ])

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // ---- Private helpers ----

  private async placeOrder(
    advisorId: string,
    dto: PlaceOrderDto,
    transCode: string,
    orderType: BseOrderType,
  ) {
    await this.verifyClientAccess(dto.clientId, advisorId)

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const referenceNumber = await this.refNumberService.generate(credentials.memberId)

    // Create order record in CREATED status
    const order = await this.prisma.bseOrder.create({
      data: {
        clientId: dto.clientId,
        advisorId,
        transactionId: dto.transactionId || null,
        orderType,
        status: BseOrderStatus.CREATED,
        transCode,
        schemeCode: dto.schemeCode,
        buySell: dto.buySell,
        buySellType: dto.buySellType || null,
        amount: dto.amount || null,
        units: dto.units || null,
        dpTxnMode: dto.dpTxnMode || 'P',
        folioNumber: dto.folioNumber || null,
        referenceNumber,
      },
    })

    try {
      if (this.isMockMode) {
        const mockResult = await this.handleMockOrderResponse(order.id, transCode)

        this.auditLogService.log({
          userId: advisorId,
          action: 'CREATE',
          entityType: 'BseOrder',
          entityId: order.id,
          details: { orderType, schemeCode: dto.schemeCode, amount: dto.amount, clientId: dto.clientId },
        })

        return mockResult
      }

      const token = await this.authService.getOrderEntryToken(advisorId)

      // Build pipe-separated order params per BSE specification
      const pipeParams = this.soapBuilder.buildPipeParams([
        transCode,                          // TransCode (NEW)
        referenceNumber,                    // UniqueRefNo
        order.bseOrderNumber || '',         // OrderId (empty for new)
        credentials.memberId,               // MemberId
        dto.clientId,                       // ClientCode
        dto.schemeCode,                     // SchemeCode
        dto.buySell,                        // BuySell (P/R)
        dto.buySellType || '',              // BuySellType (FRESH/ADDITIONAL)
        dto.dpTxnMode || 'P',              // DPTxn
        dto.amount?.toString() || '',       // OrderVal
        dto.units?.toString() || '',        // Qty
        '',                                 // AllRedeem
        dto.folioNumber || '',              // FolioNo
        dto.remarks || '',                  // Remarks
        '',                                 // KYCStatus
        '',                                 // RefNo
        '',                                 // SubBrCode
        credentials.euin || '',             // EUIN
        credentials.euin ? 'Y' : 'N',      // EUINVal
        '',                                 // MinRedeem
        '',                                 // DPC
        '',                                 // IPAdd
        token,                              // Password
        '',                                 // Param1
        '',                                 // Param2
        '',                                 // Param3
      ])

      const soapBody = this.soapBuilder.buildOrderEntryBody(transCode, pipeParams)

      const response = await this.httpClient.soapRequest(
        BSE_ENDPOINTS.ORDER_ENTRY,
        BSE_SOAP_ACTIONS.ORDER_ENTRY,
        soapBody,
        advisorId,
        `OrderEntry_${transCode}_${dto.buySell}`,
      )

      const responseValue = this.parseOrderEntryResponse(response.body)
      const result = this.errorMapper.parsePipeResponse(responseValue)

      // Update order with BSE response
      const bseOrderNumber = result.data?.[0] || null
      const newStatus = result.success ? BseOrderStatus.SUBMITTED : BseOrderStatus.REJECTED

      const updated = await this.prisma.bseOrder.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          bseOrderNumber,
          bseResponseCode: result.code,
          bseResponseMsg: result.message,
          submittedAt: result.success ? new Date() : null,
        },
      })

      this.errorMapper.throwIfError(result)

      this.auditLogService.log({
        userId: advisorId,
        action: 'CREATE',
        entityType: 'BseOrder',
        entityId: order.id,
        details: { orderType, schemeCode: dto.schemeCode, amount: dto.amount, clientId: dto.clientId },
      })

      return {
        id: updated.id,
        bseOrderNumber: updated.bseOrderNumber,
        referenceNumber: updated.referenceNumber,
        status: updated.status,
        responseCode: result.code,
        message: result.message,
      }
    } catch (error) {
      // Update order status to FAILED if not already updated
      await this.prisma.bseOrder.updateMany({
        where: { id: order.id, status: BseOrderStatus.CREATED },
        data: {
          status: BseOrderStatus.FAILED,
          bseResponseMsg: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      throw error
    }
  }

  private async handleMockOrderResponse(orderId: string, transCode: string) {
    const mockResponse = this.mockService.mockOrderEntryResponse(transCode)
    const result = this.errorMapper.parsePipeResponse(mockResponse)
    const bseOrderNumber = result.data?.[0] || null

    const updated = await this.prisma.bseOrder.update({
      where: { id: orderId },
      data: {
        status: BseOrderStatus.SUBMITTED,
        bseOrderNumber,
        bseResponseCode: result.code,
        bseResponseMsg: result.message,
        submittedAt: new Date(),
      },
    })

    return {
      id: updated.id,
      bseOrderNumber: updated.bseOrderNumber,
      referenceNumber: updated.referenceNumber,
      status: updated.status,
      responseCode: result.code,
      message: result.message,
    }
  }

  /**
   * Parse SOAP XML response to extract orderEntryParamResult value
   */
  private parseOrderEntryResponse(xml: string): string {
    const parsed = this.xmlParser.parse(xml)
    const envelope = parsed['soap:Envelope'] || parsed['s:Envelope']
    const body = envelope?.['soap:Body'] || envelope?.['s:Body']
    const result = body?.orderEntryParamResponse?.orderEntryParamResult

    if (!result) {
      throw new Error('Failed to parse BSE order entry response')
    }

    return String(result)
  }

  private async verifyClientAccess(clientId: string, advisorId: string) {
    const client = await this.prisma.fAClient.findUnique({
      where: { id: clientId },
      select: { advisorId: true },
    })
    if (!client || client.advisorId !== advisorId) {
      throw new NotFoundException('Client not found')
    }
  }
}
