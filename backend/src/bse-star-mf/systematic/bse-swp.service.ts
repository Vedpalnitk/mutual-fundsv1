import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseSoapBuilder } from '../core/bse-soap.builder'
import { BseAuthService } from '../auth/bse-auth.service'
import { BseErrorMapper } from '../core/bse-error.mapper'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { BseReferenceNumberService } from '../core/bse-reference-number.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { ConfigService } from '@nestjs/config'
import { BSE_ENDPOINTS, BSE_SOAP_ACTIONS } from '../core/bse-config'
import { RegisterSwpDto, CancelSystematicDto } from './dto/register-sip.dto'
import { BseOrderType, BseOrderStatus } from '@prisma/client'
import { XMLParser } from 'fast-xml-parser'

@Injectable()
export class BseSwpService {
  private readonly logger = new Logger(BseSwpService.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private httpClient: BseHttpClient,
    private soapBuilder: BseSoapBuilder,
    private authService: BseAuthService,
    private errorMapper: BseErrorMapper,
    private credentialsService: BseCredentialsService,
    private refNumberService: BseReferenceNumberService,
    private mockService: BseMockService,
    private config: ConfigService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  async registerSwp(advisorId: string, dto: RegisterSwpDto) {
    await this.verifyClientAccess(dto.clientId, advisorId)

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const ucc = await this.prisma.bseUccRegistration.findUnique({
      where: { clientId: dto.clientId },
    })

    if (!ucc?.clientCode) {
      throw new NotFoundException('Client not registered with BSE')
    }

    const refNumber = await this.refNumberService.generate(credentials.memberId)

    const order = await this.prisma.bseOrder.create({
      data: {
        clientId: dto.clientId,
        advisorId,
        orderType: BseOrderType.SWP,
        status: BseOrderStatus.CREATED,
        referenceNumber: refNumber,
        schemeCode: dto.schemeCode,
        amount: dto.amount,
        frequency: dto.frequency,
        sipStartDate: new Date(dto.startDate),
        sipEndDate: dto.endDate ? new Date(dto.endDate) : null,
        installments: dto.installments,
        folioNumber: dto.folioNumber,
      },
    })

    if (this.isMockMode) {
      const mockResult = this.mockService.mockSwpRegistrationResponse()
      const parsed = this.errorMapper.parsePipeResponse(mockResult)

      await this.prisma.bseOrder.update({
        where: { id: order.id },
        data: {
          status: parsed.success ? BseOrderStatus.ACCEPTED : BseOrderStatus.REJECTED,
          bseRegistrationNo: parsed.data?.[0],
          bseResponseCode: parsed.code,
          bseResponseMsg: parsed.message,
          submittedAt: new Date(),
        },
      })

      return {
        orderId: order.id,
        registrationNo: parsed.data?.[0],
        success: parsed.success,
        message: parsed.message,
      }
    }

    const token = await this.authService.getAdditionalServicesToken(advisorId)

    // SWP via Additional Services (flag 08)
    const swpParams = this.soapBuilder.buildPipeParams([
      ucc.clientCode,
      dto.schemeCode,
      dto.amount,
      dto.frequency,
      dto.startDate,
      dto.endDate || '',
      dto.installments || 999,
      dto.folioNumber || '',
      credentials.arn,
      credentials.euin || '',
      'N',
    ])

    const body = this.soapBuilder.buildAdditionalServicesBody(
      '08', // SWP registration flag
      credentials.userIdBse,
      credentials.memberId,
      token,
      swpParams,
    )

    const response = await this.httpClient.soapRequest(
      BSE_ENDPOINTS.ADDITIONAL_SERVICES,
      BSE_SOAP_ACTIONS.ADDITIONAL_RESPONSE,
      body,
      advisorId,
      'SWP_Registration',
    )

    const result = this.errorMapper.parsePipeResponse(response.body)

    await this.prisma.bseOrder.update({
      where: { id: order.id },
      data: {
        status: result.success ? BseOrderStatus.ACCEPTED : BseOrderStatus.REJECTED,
        bseRegistrationNo: result.data?.[0],
        bseResponseCode: result.code,
        bseResponseMsg: result.message,
        submittedAt: new Date(),
      },
    })

    return {
      orderId: order.id,
      registrationNo: result.data?.[0],
      success: result.success,
      message: result.message,
    }
  }

  async cancelSystematic(advisorId: string, orderId: string) {
    const order = await this.prisma.bseOrder.findUnique({
      where: { id: orderId },
    })

    if (!order || order.advisorId !== advisorId) {
      throw new NotFoundException('Order not found')
    }

    if (!order.bseRegistrationNo) {
      throw new NotFoundException('No BSE registration number found')
    }

    if (this.isMockMode) {
      await this.prisma.bseOrder.update({
        where: { id: orderId },
        data: { status: BseOrderStatus.CANCELLED },
      })
      return { success: true, message: 'Systematic plan cancelled (mock)' }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    // SIP/XSIP cancel via Order Entry endpoint with TransCode CXL
    // STP/SWP cancel via Additional Services flag 10
    if (order.orderType === BseOrderType.SIP || order.orderType === BseOrderType.XSIP) {
      return this.cancelSipXsip(order, credentials, advisorId)
    }

    // STP/SWP: cancel via Additional Services
    const token = await this.authService.getAdditionalServicesToken(advisorId)

    const cancelParams = this.soapBuilder.buildPipeParams([
      order.bseRegistrationNo,
      'CXL',
    ])

    const body = this.soapBuilder.buildAdditionalServicesBody(
      '10',
      credentials.userIdBse,
      credentials.memberId,
      token,
      cancelParams,
    )

    const response = await this.httpClient.soapRequest(
      BSE_ENDPOINTS.ADDITIONAL_SERVICES,
      BSE_SOAP_ACTIONS.ADDITIONAL_RESPONSE,
      body,
      advisorId,
      'Systematic_Cancel',
    )

    const result = this.errorMapper.parsePipeResponse(response.body)

    if (result.success) {
      await this.prisma.bseOrder.update({
        where: { id: orderId },
        data: { status: BseOrderStatus.CANCELLED },
      })
    }

    return { success: result.success, message: result.message }
  }

  private async cancelSipXsip(order: any, credentials: any, advisorId: string) {
    const token = await this.authService.getOrderEntryToken(advisorId)

    const ucc = await this.prisma.bseUccRegistration.findFirst({
      where: { clientId: order.clientId },
    })

    const cancelParams = this.soapBuilder.buildPipeParams([
      order.referenceNumber || '',       // TransNo
      ucc?.clientCode || '',             // ClientCode
      order.schemeCode || '',            // SchemeCode
      'CXL',                            // TransCode (cancel)
      credentials.memberId,             // MemberCode
      order.bseRegistrationNo,          // InternalRefNo / SIPRegNo
    ])

    const isSip = order.orderType === BseOrderType.SIP
    const soapBody = isSip
      ? this.soapBuilder.buildSipOrderEntryBody(token, cancelParams)
      : this.soapBuilder.buildXsipOrderEntryBody(token, cancelParams)
    const soapAction = isSip
      ? BSE_SOAP_ACTIONS.SIP_ORDER
      : BSE_SOAP_ACTIONS.XSIP_ORDER

    const response = await this.httpClient.soapRequest(
      BSE_ENDPOINTS.ORDER_ENTRY,
      soapAction,
      soapBody,
      advisorId,
      `${order.orderType}_Cancel`,
    )

    const xmlParser = new XMLParser()
    const parsedXml = xmlParser.parse(response.body)
    const resultField = isSip ? 'sipOrderEntryParamResult' : 'xsipOrderEntryParamResult'
    const envelope = parsedXml['soap:Envelope'] || parsedXml['s:Envelope'] || parsedXml
    const body = envelope?.['soap:Body'] || envelope?.['s:Body'] || envelope
    const resp = Object.values(body || {}).find((v: any) => typeof v === 'object') as any
    const resultStr = resp?.[resultField] || resp?.Result || ''

    const result = this.errorMapper.parsePipeResponse(resultStr)

    if (result.success) {
      await this.prisma.bseOrder.update({
        where: { id: order.id },
        data: { status: BseOrderStatus.CANCELLED },
      })
    }

    return { success: result.success, message: result.message }
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
