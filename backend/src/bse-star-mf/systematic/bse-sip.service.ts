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
import { RegisterSipDto } from './dto/register-sip.dto'
import { BseOrderType, BseOrderStatus } from '@prisma/client'
import { XMLParser } from 'fast-xml-parser'
import { AuditLogService } from '../../common/services/audit-log.service'

@Injectable()
export class BseSipService {
  private readonly logger = new Logger(BseSipService.name)
  private readonly isMockMode: boolean
  private readonly xmlParser = new XMLParser()

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
    private auditLogService: AuditLogService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  async registerSip(advisorId: string, dto: RegisterSipDto) {
    await this.verifyClientAccess(dto.clientId, advisorId)

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const ucc = await this.prisma.bseUccRegistration.findUnique({
      where: { clientId: dto.clientId },
    })

    if (!ucc?.clientCode) {
      throw new NotFoundException('Client not registered with BSE. Register UCC first.')
    }

    const refNumber = await this.refNumberService.generate(credentials.memberId)

    // Create BseOrder record
    const order = await this.prisma.bseOrder.create({
      data: {
        clientId: dto.clientId,
        advisorId,
        sipId: dto.sipId,
        orderType: BseOrderType.SIP,
        status: BseOrderStatus.CREATED,
        referenceNumber: refNumber,
        schemeCode: dto.schemeCode,
        amount: dto.amount,
        frequency: dto.frequency,
        sipStartDate: new Date(dto.startDate),
        sipEndDate: dto.endDate ? new Date(dto.endDate) : null,
        installments: dto.installments,
        firstOrderFlag: dto.firstOrderFlag,
        folioNumber: dto.folioNumber,
      },
    })

    if (this.isMockMode) {
      const mockResult = this.mockService.mockSipRegistrationResponse()
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

      this.auditLogService.log({
        userId: advisorId,
        action: 'CREATE',
        entityType: 'BseSip',
        entityId: order.id,
        details: { schemeCode: dto.schemeCode, amount: dto.amount, frequency: dto.frequency, clientId: dto.clientId },
      })

      return {
        orderId: order.id,
        registrationNo: parsed.data?.[0],
        success: parsed.success,
        message: parsed.message,
      }
    }

    const token = await this.authService.getOrderEntryToken(advisorId)

    const sipParams = this.soapBuilder.buildPipeParams([
      refNumber,                    // TransNo
      ucc.clientCode,              // ClientCode
      dto.schemeCode,              // SchemeCode
      'NEW',                       // TransCode
      credentials.memberId,        // MemberCode
      dto.amount,                  // InstallmentAmount
      dto.installments || 999,     // NoOfInstallments
      dto.frequency,               // Frequency
      dto.sipDay,                  // SIPDay
      dto.startDate,               // StartDate
      dto.endDate || '',           // EndDate
      dto.firstOrderFlag || 'Y',   // FirstOrderFlag
      dto.folioNumber || '',       // FolioNo
      credentials.arn,             // ARN
      credentials.euin || '',      // EUIN
      'N',                         // EUINDecl
      'P',                         // DPC (Demat/Physical)
      refNumber,                   // SubBrCode
    ])

    const body = this.soapBuilder.buildSipOrderEntryBody(token, sipParams)

    const response = await this.httpClient.soapRequest(
      BSE_ENDPOINTS.ORDER_ENTRY,
      BSE_SOAP_ACTIONS.SIP_ORDER,
      body,
      advisorId,
      'SIP_Registration',
    )

    const parsed = this.xmlParser.parse(response.body)
    const resultStr = this.extractSoapResult(parsed, 'sipOrderEntryParamResult')
    const result = this.errorMapper.parsePipeResponse(resultStr)

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

    this.auditLogService.log({
      userId: advisorId,
      action: 'CREATE',
      entityType: 'BseSip',
      entityId: order.id,
      details: { schemeCode: dto.schemeCode, amount: dto.amount, frequency: dto.frequency, clientId: dto.clientId },
    })

    return {
      orderId: order.id,
      registrationNo: result.data?.[0],
      success: result.success,
      message: result.message,
    }
  }

  private extractSoapResult(parsed: any, resultField: string): string {
    const envelope = parsed['soap:Envelope'] || parsed['s:Envelope'] || parsed
    const body = envelope?.['soap:Body'] || envelope?.['s:Body'] || envelope
    const response = Object.values(body || {}).find((v: any) => typeof v === 'object') as any
    return response?.[resultField] || response?.Result || ''
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
