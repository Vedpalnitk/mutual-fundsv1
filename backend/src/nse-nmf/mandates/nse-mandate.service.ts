import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS, NSE_TIMEOUTS } from '../core/constants/endpoints'
import { NSE_BATCH_LIMIT, NSE_MANDATE_TYPES } from '../core/nse-config'
import { PanCryptoService } from '../../common/services/pan-crypto.service'
import { AuditLogService } from '../../common/services/audit-log.service'

@Injectable()
export class NseMandateService {
  private readonly logger = new Logger(NseMandateService.name)

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

  async listMandates(advisorId: string, params?: { clientId?: string; status?: string }) {
    const where: any = { advisorId }
    if (params?.clientId) where.clientId = params.clientId
    if (params?.status) where.status = params.status

    const mandates = await this.prisma.nseMandate.findMany({
      where,
      include: { client: { select: { id: true, name: true, pan: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return mandates.map((m) => ({
      ...m,
      client: m.client ? { ...m.client, pan: this.panCrypto.mask(m.client.pan) } : null,
    }))
  }

  async getMandate(id: string, advisorId: string) {
    const mandate = await this.prisma.nseMandate.findFirst({
      where: { id, advisorId },
      include: {
        client: { select: { id: true, name: true, pan: true } },
        orders: { select: { id: true, nseOrderId: true, orderType: true, status: true, amount: true } },
      },
    })
    if (!mandate) throw new NotFoundException('Mandate not found')

    return {
      ...mandate,
      client: mandate.client ? { ...mandate.client, pan: this.panCrypto.mask(mandate.client.pan) } : null,
    }
  }

  async registerMandate(advisorId: string, data: {
    clientId: string
    mandateType: 'ENACH' | 'PHYSICAL'
    amount: number
    accountNo: string
    ifscCode: string
    bankName?: string
    startDate?: string
    endDate?: string
  }) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: data.clientId, advisorId },
    })
    if (!client) throw new NotFoundException('Client not found')

    // Create DB record
    const mandate = await this.prisma.nseMandate.create({
      data: {
        clientId: data.clientId,
        advisorId,
        mandateType: data.mandateType,
        status: 'SUBMITTED',
        amount: data.amount,
        accountNo: data.accountNo,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockMandateRegistrationResponse()
      await this.prisma.nseMandate.update({
        where: { id: mandate.id },
        data: {
          nseMandateId: mockResponse.mandate_id,
          nseResponseCode: mockResponse.status,
          nseResponseMsg: mockResponse.remark,
        },
      })
      this.auditLogService.log({
        userId: advisorId,
        action: 'CREATE',
        entityType: 'NseMandate',
        entityId: mandate.id,
        details: { mandateType: data.mandateType, amount: data.amount, clientId: data.clientId },
      })

      return { success: true, mandateId: mandate.id, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const nseUcc = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId: data.clientId },
    })

    const requestBody = {
      mandate_type: data.mandateType === 'ENACH' ? NSE_MANDATE_TYPES.ENACH : NSE_MANDATE_TYPES.PHYSICAL,
      client_code: nseUcc?.clientCode || client.pan,
      amount: data.amount.toString(),
      account_no: data.accountNo,
      ifsc_code: data.ifscCode,
      bank_name: data.bankName,
      start_date: data.startDate,
      end_date: data.endDate,
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.MANDATE,
      requestBody,
      credentials,
      advisorId,
      'MANDATE_REGISTRATION',
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    await this.prisma.nseMandate.update({
      where: { id: mandate.id },
      data: {
        nseMandateId: result.data?.mandate_id || null,
        authUrl: result.data?.auth_url || null,
        status: result.success ? 'SUBMITTED' : 'REJECTED',
        nseResponseCode: result.status,
        nseResponseMsg: result.message,
      },
    })

    this.errorMapper.throwIfError(result)

    this.auditLogService.log({
      userId: advisorId,
      action: 'CREATE',
      entityType: 'NseMandate',
      entityId: mandate.id,
      details: { mandateType: data.mandateType, amount: data.amount, clientId: data.clientId },
    })

    return { ...result, success: true, mandateId: mandate.id }
  }

  async refreshMandateStatus(id: string, advisorId: string) {
    const mandate = await this.prisma.nseMandate.findFirst({
      where: { id, advisorId },
    })
    if (!mandate) throw new NotFoundException('Mandate not found')

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockMandateStatusResponse(mandate.nseMandateId || id)
      await this.prisma.nseMandate.update({
        where: { id },
        data: {
          status: 'APPROVED',
          umrn: mockResponse.umrn,
        },
      })
      return mockResponse
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.MANDATE_STATUS,
      { mandate_id: mandate.nseMandateId },
      credentials,
      advisorId,
      'MANDATE_STATUS_CHECK',
      NSE_TIMEOUTS.REPORT,
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    if (result.success && result.data) {
      const mandateStatus = result.data.mandate_status?.toUpperCase()
      const statusMap: Record<string, string> = {
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
        CANCELLED: 'CANCELLED',
        EXPIRED: 'EXPIRED',
      }

      await this.prisma.nseMandate.update({
        where: { id },
        data: {
          status: (statusMap[mandateStatus] || mandate.status) as any,
          umrn: result.data.umrn || mandate.umrn,
        },
      })
    }

    return result.data
  }
}
