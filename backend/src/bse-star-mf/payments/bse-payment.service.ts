import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseErrorMapper } from '../core/bse-error.mapper'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { BseAuthService } from '../auth/bse-auth.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { BSE_ENDPOINTS, BSE_TIMEOUTS } from '../core/bse-config'
import { BseOrderStatus, BsePaymentMode, BsePaymentStatus } from '@prisma/client'
import { InitiatePaymentDto, PaymentMode } from './dto/initiate-payment.dto'
import { AuditLogService } from '../../common/services/audit-log.service'

@Injectable()
export class BsePaymentService {
  private readonly logger = new Logger(BsePaymentService.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private httpClient: BseHttpClient,
    private errorMapper: BseErrorMapper,
    private credentialsService: BseCredentialsService,
    private authService: BseAuthService,
    private mockService: BseMockService,
    private config: ConfigService,
    private auditLogService: AuditLogService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  /**
   * Initiate payment for an order via REST SinglePayment API
   */
  async initiatePayment(orderId: string, advisorId: string, dto: InitiatePaymentDto) {
    const order = await this.prisma.bseOrder.findUnique({
      where: { id: orderId },
      include: { payment: true },
    })

    if (!order || order.advisorId !== advisorId) {
      throw new NotFoundException('Order not found')
    }

    if (!order.bseOrderNumber) {
      throw new BadRequestException('Order has not been submitted to BSE yet')
    }

    if (order.payment) {
      throw new BadRequestException('Payment already initiated for this order')
    }

    if (!([BseOrderStatus.SUBMITTED, BseOrderStatus.ACCEPTED, BseOrderStatus.PAYMENT_PENDING] as BseOrderStatus[]).includes(order.status)) {
      throw new BadRequestException(`Payment cannot be initiated for order in status: ${order.status}`)
    }

    const paymentMode = this.mapPaymentMode(dto.paymentMode)
    const amount = order.amount ? Number(order.amount) : 0

    if (amount <= 0) {
      throw new BadRequestException('Order amount is required for payment')
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    // Create payment record
    const payment = await this.prisma.bsePayment.create({
      data: {
        orderId: order.id,
        paymentMode,
        status: BsePaymentStatus.INITIATED,
        amount,
        bankCode: dto.bankCode || null,
      },
    })

    try {
      if (this.isMockMode) {
        const mockResult = await this.handleMockPaymentResponse(payment.id, order.id, order.bseOrderNumber)

        this.auditLogService.log({
          userId: advisorId,
          action: 'PAYMENT',
          entityType: 'BsePayment',
          entityId: payment.id,
          details: { orderId: order.id, paymentMode: dto.paymentMode, amount },
        })

        return mockResult
      }

      const token = await this.authService.getOrderEntryToken(advisorId)

      const requestBody = {
        MemberCode: credentials.memberId,
        ClientCode: order.clientId,
        OrderNumber: order.bseOrderNumber,
        PaymentMode: dto.paymentMode,
        BankCode: dto.bankCode || '',
        Amount: amount.toFixed(2),
        Password: token,
      }

      const response = await this.httpClient.jsonRequest(
        BSE_ENDPOINTS.SINGLE_PAYMENT,
        'POST',
        requestBody,
        advisorId,
        'SinglePayment',
        {},
        BSE_TIMEOUTS.PAYMENT,
      )

      const parsed = response.parsed
      const status = parsed?.Status || '200'
      const result = this.errorMapper.parseResponse(status, parsed?.Message)

      const redirectUrl = parsed?.RedirectURL || null
      const transactionRef = parsed?.TransactionRef || null
      const newPaymentStatus = result.success ? BsePaymentStatus.REDIRECTED : BsePaymentStatus.FAILED

      const updatedPayment = await this.prisma.bsePayment.update({
        where: { id: payment.id },
        data: {
          status: newPaymentStatus,
          redirectUrl,
          transactionRef,
          bseResponseCode: result.code,
          bseResponseMsg: result.message,
        },
      })

      // Update order status
      await this.prisma.bseOrder.update({
        where: { id: order.id },
        data: {
          status: result.success ? BseOrderStatus.PAYMENT_PENDING : order.status,
        },
      })

      this.errorMapper.throwIfError(result)

      this.auditLogService.log({
        userId: advisorId,
        action: 'PAYMENT',
        entityType: 'BsePayment',
        entityId: payment.id,
        details: { orderId: order.id, paymentMode: dto.paymentMode, amount },
      })

      return {
        id: updatedPayment.id,
        orderId: updatedPayment.orderId,
        status: updatedPayment.status,
        redirectUrl: updatedPayment.redirectUrl,
        transactionRef: updatedPayment.transactionRef,
        responseCode: result.code,
        message: result.message,
      }
    } catch (error) {
      // Mark payment as failed if not already updated
      await this.prisma.bsePayment.updateMany({
        where: { id: payment.id, status: BsePaymentStatus.INITIATED },
        data: {
          status: BsePaymentStatus.FAILED,
          bseResponseMsg: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      throw error
    }
  }

  /**
   * Check payment status for an order
   */
  async getPaymentStatus(orderId: string, advisorId: string) {
    const order = await this.prisma.bseOrder.findUnique({
      where: { id: orderId },
      include: { payment: true },
    })

    if (!order || order.advisorId !== advisorId) {
      throw new NotFoundException('Order not found')
    }

    if (!order.payment) {
      throw new NotFoundException('No payment found for this order')
    }

    return {
      id: order.payment.id,
      orderId: order.payment.orderId,
      paymentMode: order.payment.paymentMode,
      status: order.payment.status,
      amount: order.payment.amount,
      bankCode: order.payment.bankCode,
      redirectUrl: order.payment.redirectUrl,
      transactionRef: order.payment.transactionRef,
      paidAt: order.payment.paidAt,
      bseResponseCode: order.payment.bseResponseCode,
      bseResponseMsg: order.payment.bseResponseMsg,
      createdAt: order.payment.createdAt,
      updatedAt: order.payment.updatedAt,
    }
  }

  /**
   * Process payment callback from BSE (public endpoint)
   * BSE sends payment status updates via callback
   */
  async handleCallback(callbackData: any) {
    this.logger.log(`Payment callback received: ${JSON.stringify(callbackData)}`)

    const orderNumber = callbackData?.OrderNumber || callbackData?.orderNumber
    const status = callbackData?.Status || callbackData?.status
    const transactionRef = callbackData?.TransactionRef || callbackData?.transactionRef

    if (!orderNumber) {
      this.logger.warn('Payment callback missing OrderNumber')
      return { received: true, processed: false, reason: 'Missing OrderNumber' }
    }

    const order = await this.prisma.bseOrder.findUnique({
      where: { bseOrderNumber: orderNumber },
      include: { payment: true },
    })

    if (!order) {
      this.logger.warn(`Payment callback for unknown order: ${orderNumber}`)
      return { received: true, processed: false, reason: 'Order not found' }
    }

    if (!order.payment) {
      this.logger.warn(`Payment callback for order without payment record: ${orderNumber}`)
      return { received: true, processed: false, reason: 'Payment record not found' }
    }

    const isSuccess = status === '100' || status === 'SUCCESS'
    const newPaymentStatus = isSuccess ? BsePaymentStatus.SUCCESS : BsePaymentStatus.FAILED
    const newOrderStatus = isSuccess ? BseOrderStatus.PAYMENT_SUCCESS : BseOrderStatus.PAYMENT_FAILED

    await this.prisma.$transaction([
      this.prisma.bsePayment.update({
        where: { id: order.payment.id },
        data: {
          status: newPaymentStatus,
          transactionRef: transactionRef || order.payment.transactionRef,
          bseResponseCode: status,
          bseResponseMsg: callbackData?.Message || callbackData?.message || null,
          paidAt: isSuccess ? new Date() : null,
        },
      }),
      this.prisma.bseOrder.update({
        where: { id: order.id },
        data: { status: newOrderStatus },
      }),
    ])

    this.logger.log(`Payment callback processed: order=${orderNumber}, status=${newPaymentStatus}`)

    return { received: true, processed: true, status: newPaymentStatus }
  }

  // ---- Private helpers ----

  private async handleMockPaymentResponse(paymentId: string, orderId: string, bseOrderNumber: string) {
    const mockResult = this.mockService.mockPaymentResponse(bseOrderNumber)

    const updatedPayment = await this.prisma.bsePayment.update({
      where: { id: paymentId },
      data: {
        status: BsePaymentStatus.REDIRECTED,
        redirectUrl: mockResult.RedirectURL,
        transactionRef: mockResult.TransactionRef,
        bseResponseCode: mockResult.Status,
        bseResponseMsg: mockResult.Message,
      },
    })

    await this.prisma.bseOrder.update({
      where: { id: orderId },
      data: { status: BseOrderStatus.PAYMENT_PENDING },
    })

    return {
      id: updatedPayment.id,
      orderId: updatedPayment.orderId,
      status: updatedPayment.status,
      redirectUrl: updatedPayment.redirectUrl,
      transactionRef: updatedPayment.transactionRef,
      responseCode: mockResult.Status,
      message: mockResult.Message,
    }
  }

  private mapPaymentMode(mode: PaymentMode): BsePaymentMode {
    const mapping: Record<PaymentMode, BsePaymentMode> = {
      [PaymentMode.DIRECT]: BsePaymentMode.DIRECT,
      [PaymentMode.NODAL]: BsePaymentMode.NODAL,
      [PaymentMode.NEFT]: BsePaymentMode.NEFT,
      [PaymentMode.UPI]: BsePaymentMode.UPI,
    }
    return mapping[mode]
  }
}
