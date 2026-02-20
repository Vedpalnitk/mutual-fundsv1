import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS, NSE_TIMEOUTS } from '../core/constants/endpoints'
import { AuditLogService } from '../../common/services/audit-log.service'

@Injectable()
export class NsePaymentService {
  private readonly logger = new Logger(NsePaymentService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
    private auditLogService: AuditLogService,
  ) {}

  async initiatePayment(orderId: string, advisorId: string, data: {
    paymentMode: string
    bankCode?: string
    vpa?: string
    utrNo?: string
    chequeNo?: string
    chequeDate?: string
    mandateId?: string
  }) {
    const order = await this.prisma.nseOrder.findFirst({
      where: { id: orderId, advisorId },
    })
    if (!order) throw new NotFoundException('Order not found')
    if (!order.nseOrderId) throw new BadRequestException('Order not submitted to NSE yet')

    // Create payment record
    const payment = await this.prisma.nsePayment.create({
      data: {
        orderId: order.id,
        paymentMode: data.paymentMode as any,
        status: 'INITIATED',
        amount: order.amount || 0,
        bankCode: data.bankCode,
        vpa: data.vpa,
        utrNo: data.utrNo,
        chequeNo: data.chequeNo,
        chequeDate: data.chequeDate ? new Date(data.chequeDate) : null,
        callbackUrl: this.config.get<string>('nmf.callbackUrl'),
      },
    })

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockPaymentResponse(order.nseOrderId)
      await this.prisma.nsePayment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          transactionRef: mockResponse.transaction_ref,
          nseResponseCode: mockResponse.status,
          nseResponseMsg: mockResponse.remark,
          paidAt: new Date(),
        },
      })
      await this.prisma.nseOrder.update({
        where: { id: order.id },
        data: { status: 'PAYMENT_PENDING' },
      })

      this.auditLogService.log({
        userId: advisorId,
        action: 'PAYMENT',
        entityType: 'NsePayment',
        entityId: payment.id,
        details: { orderId: order.id, paymentMode: data.paymentMode, amount: order.amount || 0 },
      })

      return { success: true, paymentId: payment.id, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody: any = {
      order_id: order.nseOrderId,
      payment_mode: data.paymentMode,
      bank_code: data.bankCode,
    }

    if (data.paymentMode === 'UPI') {
      requestBody.vpa = data.vpa
      requestBody.callback_url = this.config.get<string>('nmf.callbackUrl')
    }
    if (data.paymentMode === 'NETBANKING') {
      requestBody.callback_url = this.config.get<string>('nmf.callbackUrl')
    }
    if (data.paymentMode === 'MANDATE') {
      requestBody.mandate_id = data.mandateId
    }
    if (['RTGS', 'NEFT'].includes(data.paymentMode)) {
      requestBody.utr_no = data.utrNo
    }
    if (data.paymentMode === 'CHEQUE') {
      requestBody.cheque_no = data.chequeNo
      requestBody.cheque_date = data.chequeDate
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.PURCHASE_PAYMENT,
      requestBody,
      credentials,
      advisorId,
      'PURCHASE_PAYMENT',
      NSE_TIMEOUTS.PAYMENT,
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    await this.prisma.nsePayment.update({
      where: { id: payment.id },
      data: {
        status: result.success ? 'PENDING' : 'FAILED',
        transactionRef: result.data?.transaction_ref || null,
        nseResponseCode: result.status,
        nseResponseMsg: result.message,
      },
    })

    if (result.success) {
      await this.prisma.nseOrder.update({
        where: { id: order.id },
        data: { status: 'PAYMENT_PENDING' },
      })
    }

    this.errorMapper.throwIfError(result)

    this.auditLogService.log({
      userId: advisorId,
      action: 'PAYMENT',
      entityType: 'NsePayment',
      entityId: payment.id,
      details: { orderId: order.id, paymentMode: data.paymentMode, amount: order.amount || 0 },
    })

    return { ...result, success: true, paymentId: payment.id }
  }

  async getPaymentStatus(orderId: string, advisorId: string) {
    const payment = await this.prisma.nsePayment.findFirst({
      where: { order: { id: orderId, advisorId } },
      include: { order: { select: { id: true, nseOrderId: true, status: true } } },
    })
    if (!payment) throw new NotFoundException('Payment not found')
    return payment
  }

  async checkUpiStatus(advisorId: string, data: { orderId: string; vpa: string }) {
    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      return this.mockService.mockUpiStatusResponse()
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.UPI_STATUS_CHECK,
      { order_id: data.orderId, vpa: data.vpa },
      credentials,
      advisorId,
      'UPI_STATUS_CHECK',
    )

    return this.errorMapper.parseResponse(response.parsed)
  }

  async handlePaymentCallback(callbackData: any) {
    this.logger.log('Payment callback received', callbackData)

    const orderId = callbackData.order_id || callbackData.trxn_order_id
    if (!orderId) {
      this.logger.warn('Payment callback missing order_id')
      return { received: true }
    }

    const order = await this.prisma.nseOrder.findFirst({
      where: { nseOrderId: orderId },
      include: { payment: true },
    })

    if (!order || !order.payment) {
      this.logger.warn(`Payment callback for unknown order: ${orderId}`)
      return { received: true }
    }

    const isSuccess = callbackData.status?.toUpperCase()?.includes('SUCCESS')

    await this.prisma.nsePayment.update({
      where: { id: order.payment.id },
      data: {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        transactionRef: callbackData.transaction_ref || order.payment.transactionRef,
        paidAt: isSuccess ? new Date() : null,
      },
    })

    if (isSuccess) {
      await this.prisma.nseOrder.update({
        where: { id: order.id },
        data: { status: 'PAYMENT_CONFIRMATION_PENDING' },
      })
    }

    return { received: true }
  }
}
