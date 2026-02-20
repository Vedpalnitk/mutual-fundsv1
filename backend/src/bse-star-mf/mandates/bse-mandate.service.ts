import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseSoapBuilder } from '../core/bse-soap.builder'
import { BseAuthService } from '../auth/bse-auth.service'
import { BseErrorMapper } from '../core/bse-error.mapper'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { ConfigService } from '@nestjs/config'
import { BSE_ENDPOINTS, BSE_SOAP_ACTIONS } from '../core/bse-config'
import { RegisterMandateDto, ShiftMandateDto } from './dto/register-mandate.dto'
import { BseMandateStatus, BseMandateType } from '@prisma/client'
import { PanCryptoService } from '../../common/services/pan-crypto.service'

@Injectable()
export class BseMandateService {
  private readonly logger = new Logger(BseMandateService.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private httpClient: BseHttpClient,
    private soapBuilder: BseSoapBuilder,
    private authService: BseAuthService,
    private errorMapper: BseErrorMapper,
    private credentialsService: BseCredentialsService,
    private mockService: BseMockService,
    private config: ConfigService,
    private panCrypto: PanCryptoService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  /**
   * Register a new mandate via Additional Services SOAP (flag 06)
   */
  async register(advisorId: string, dto: RegisterMandateDto) {
    await this.verifyClientAccess(dto.clientId, advisorId)

    const client = await this.prisma.fAClient.findUnique({
      where: { id: dto.clientId },
      include: {
        bseUccRegistration: true,
        bankAccounts: dto.bankAccountId
          ? { where: { id: dto.bankAccountId } }
          : { where: { isPrimary: true }, take: 1 },
      },
    })

    if (!client) throw new NotFoundException('Client not found')
    if (!client.bseUccRegistration?.clientCode) {
      throw new BadRequestException('Client must have an approved BSE UCC registration before creating a mandate')
    }

    const bankAccount = client.bankAccounts[0]
    if (!bankAccount) {
      throw new BadRequestException('No bank account found for the client')
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const clientCode = client.bseUccRegistration.clientCode

    // Map DTO mandate type to Prisma enum
    const mandateType = dto.mandateType as unknown as BseMandateType

    if (this.isMockMode) {
      const mockResult = this.mockService.mockMandateRegistrationResponse()
      const parsed = this.errorMapper.parsePipeResponse(mockResult)

      const bseMandateId = parsed.data?.[0] || null

      return this.saveMandate(dto, advisorId, mandateType, bseMandateId, {
        success: parsed.success,
        code: parsed.code,
        message: parsed.message,
      })
    }

    // Get Additional Services session token
    const passKey = await this.authService.getAdditionalServicesToken(advisorId)

    // Build pipe-separated params for mandate registration (flag 06)
    // Format: ClientCode|MandateType|Amount|BankCode|StartDate|EndDate|AccountNumber|IFSC
    const params = this.soapBuilder.buildPipeParams([
      clientCode,
      dto.mandateType,
      dto.amount,
      dto.bankCode || bankAccount.bankName,
      dto.startDate || '',
      dto.endDate || '',
      bankAccount.accountNumber,
      bankAccount.ifsc,
    ])

    const soapBody = this.soapBuilder.buildAdditionalServicesBody(
      '06',
      credentials.userIdBse,
      credentials.memberId,
      passKey,
      params,
    )

    const response = await this.httpClient.soapRequest(
      BSE_ENDPOINTS.ADDITIONAL_SERVICES,
      BSE_SOAP_ACTIONS.ADDITIONAL_RESPONSE,
      soapBody,
      advisorId,
      'Mandate_Registration',
    )

    const parsed = this.errorMapper.parsePipeResponse(response.body)
    const bseMandateId = parsed.data?.[0] || null

    return this.saveMandate(dto, advisorId, mandateType, bseMandateId, {
      success: parsed.success,
      code: parsed.code,
      message: parsed.message,
    })
  }

  /**
   * Query mandate status via REST MandateDetailsRequest
   */
  async getStatus(mandateId: string, advisorId: string) {
    const mandate = await this.findMandateOrThrow(mandateId, advisorId)

    if (!mandate.mandateId) {
      return {
        id: mandate.id,
        mandateId: mandate.mandateId,
        status: mandate.status,
        message: 'Mandate has not been assigned a BSE mandate ID yet',
      }
    }

    if (this.isMockMode) {
      const mockResult = this.mockService.mockMandateStatusResponse(mandate.mandateId)
      return {
        id: mandate.id,
        mandateId: mandate.mandateId,
        status: mandate.status,
        bseStatus: mockResult.Status,
        umrn: mockResult.UMRN,
      }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const response = await this.httpClient.jsonRequest(
      BSE_ENDPOINTS.MANDATE_DETAILS,
      'POST',
      {
        MemberCode: credentials.memberId,
        ClientCode: mandate.client?.bseUccRegistration?.clientCode || '',
        MandateId: mandate.mandateId,
      },
      advisorId,
      'Mandate_Status',
    )

    return {
      id: mandate.id,
      mandateId: mandate.mandateId,
      status: mandate.status,
      bseResponse: response.parsed,
    }
  }

  /**
   * Get e-NACH authentication URL via REST EMandateAuthURL
   */
  async getAuthUrl(mandateId: string, advisorId: string) {
    const mandate = await this.findMandateOrThrow(mandateId, advisorId)

    if (!mandate.mandateId) {
      throw new BadRequestException('Mandate must be submitted to BSE before generating auth URL')
    }

    if (this.isMockMode) {
      const mockResult = this.mockService.mockEMandateAuthUrl(mandate.mandateId)

      await this.prisma.bseMandate.update({
        where: { id: mandate.id },
        data: { authUrl: mockResult.AuthURL },
      })

      return {
        id: mandate.id,
        mandateId: mandate.mandateId,
        authUrl: mockResult.AuthURL,
      }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const response = await this.httpClient.jsonRequest(
      BSE_ENDPOINTS.EMANDATE_AUTH_URL,
      'POST',
      {
        MemberCode: credentials.memberId,
        ClientCode: mandate.client?.bseUccRegistration?.clientCode || '',
        MandateId: mandate.mandateId,
      },
      advisorId,
      'EMandate_AuthURL',
    )

    const authUrl = response.parsed?.AuthURL || null

    if (authUrl) {
      await this.prisma.bseMandate.update({
        where: { id: mandate.id },
        data: { authUrl },
      })
    }

    return {
      id: mandate.id,
      mandateId: mandate.mandateId,
      authUrl,
      bseResponse: response.parsed,
    }
  }

  /**
   * Poll BSE for latest mandate status and update DB
   */
  async refreshStatus(id: string, advisorId: string) {
    const mandate = await this.findMandateOrThrow(id, advisorId)

    if (!mandate.mandateId) {
      throw new BadRequestException('Mandate has not been assigned a BSE mandate ID yet')
    }

    if (this.isMockMode) {
      const mockResult = this.mockService.mockMandateStatusResponse(mandate.mandateId)
      const newStatus = this.mapBseStatusToEnum(mockResult.Status)

      const updated = await this.prisma.bseMandate.update({
        where: { id: mandate.id },
        data: {
          status: newStatus,
          umrn: mockResult.UMRN || mandate.umrn,
        },
      })

      return {
        id: updated.id,
        mandateId: updated.mandateId,
        previousStatus: mandate.status,
        currentStatus: updated.status,
        umrn: updated.umrn,
      }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const response = await this.httpClient.jsonRequest(
      BSE_ENDPOINTS.MANDATE_DETAILS,
      'POST',
      {
        MemberCode: credentials.memberId,
        ClientCode: mandate.client?.bseUccRegistration?.clientCode || '',
        MandateId: mandate.mandateId,
      },
      advisorId,
      'Mandate_RefreshStatus',
    )

    const bseStatus = response.parsed?.Status || response.parsed?.MandateStatus
    const umrn = response.parsed?.UMRN || mandate.umrn
    const newStatus = this.mapBseStatusToEnum(bseStatus)

    const updated = await this.prisma.bseMandate.update({
      where: { id: mandate.id },
      data: {
        status: newStatus,
        umrn,
        bseResponseCode: String(bseStatus || ''),
        bseResponseMsg: response.parsed?.Message || null,
      },
    })

    return {
      id: updated.id,
      mandateId: updated.mandateId,
      previousStatus: mandate.status,
      currentStatus: updated.status,
      umrn: updated.umrn,
      bseResponse: response.parsed,
    }
  }

  /**
   * Shift mandate via REST Mandate/MandateShift
   */
  async shiftMandate(advisorId: string, dto: ShiftMandateDto) {
    const fromMandate = await this.findMandateOrThrow(dto.fromMandateId, advisorId)
    const toMandate = await this.findMandateOrThrow(dto.toMandateId, advisorId)

    if (!fromMandate.mandateId) {
      throw new BadRequestException('Source mandate does not have a BSE mandate ID')
    }
    if (!toMandate.mandateId) {
      throw new BadRequestException('Target mandate does not have a BSE mandate ID')
    }
    if (fromMandate.status !== BseMandateStatus.APPROVED) {
      throw new BadRequestException('Source mandate must be in APPROVED status to shift')
    }
    if (toMandate.status !== BseMandateStatus.APPROVED) {
      throw new BadRequestException('Target mandate must be in APPROVED status to shift')
    }

    if (this.isMockMode) {
      await this.prisma.bseMandate.update({
        where: { id: fromMandate.id },
        data: { status: BseMandateStatus.SHIFTED },
      })

      return {
        success: true,
        fromMandateId: fromMandate.mandateId,
        toMandateId: toMandate.mandateId,
        message: 'Mandate shifted successfully (mock)',
      }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const response = await this.httpClient.jsonRequest(
      BSE_ENDPOINTS.MANDATE_SHIFT,
      'POST',
      {
        MemberCode: credentials.memberId,
        FromMandateId: fromMandate.mandateId,
        ToMandateId: toMandate.mandateId,
      },
      advisorId,
      'Mandate_Shift',
    )

    const result = this.errorMapper.parseResponse(
      response.parsed?.Status || response.parsed?.ResponseCode || '0',
      response.parsed?.Message,
    )

    if (result.success) {
      await this.prisma.bseMandate.update({
        where: { id: fromMandate.id },
        data: { status: BseMandateStatus.SHIFTED },
      })
    }

    return {
      success: result.success,
      fromMandateId: fromMandate.mandateId,
      toMandateId: toMandate.mandateId,
      responseCode: result.code,
      message: result.message,
    }
  }

  /**
   * List mandates with optional client/status filter
   */
  async listMandates(advisorId: string, filters?: { clientId?: string; status?: string }) {
    const where: any = { advisorId }

    if (filters?.clientId) {
      await this.verifyClientAccess(filters.clientId, advisorId)
      where.clientId = filters.clientId
    }

    if (filters?.status) {
      where.status = filters.status as BseMandateStatus
    }

    const mandates = await this.prisma.bseMandate.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            pan: true,
            bseUccRegistration: { select: { clientCode: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return mandates.map((m) => ({
      id: m.id,
      mandateId: m.mandateId,
      mandateType: m.mandateType,
      status: m.status,
      amount: m.amount,
      bankAccountId: m.bankAccountId,
      bankCode: m.bankCode,
      startDate: m.startDate,
      endDate: m.endDate,
      umrn: m.umrn,
      client: m.client
        ? {
            id: m.client.id,
            name: m.client.name,
            pan: this.panCrypto.mask(m.client.pan),
            clientCode: m.client.bseUccRegistration?.clientCode,
          }
        : null,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }))
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private async saveMandate(
    dto: RegisterMandateDto,
    advisorId: string,
    mandateType: BseMandateType,
    bseMandateId: string | null,
    result: { success: boolean; code: string; message: string },
  ) {
    const status = result.success ? BseMandateStatus.SUBMITTED : BseMandateStatus.REJECTED

    const mandate = await this.prisma.bseMandate.create({
      data: {
        clientId: dto.clientId,
        advisorId,
        mandateId: bseMandateId,
        mandateType,
        status,
        amount: dto.amount,
        bankAccountId: dto.bankAccountId || null,
        bankCode: dto.bankCode || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        bseResponseCode: result.code,
        bseResponseMsg: result.message,
      },
    })

    return {
      id: mandate.id,
      mandateId: mandate.mandateId,
      mandateType: mandate.mandateType,
      status: mandate.status,
      amount: mandate.amount,
      responseCode: result.code,
      message: result.message,
    }
  }

  private async findMandateOrThrow(id: string, advisorId: string) {
    const mandate = await this.prisma.bseMandate.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            advisorId: true,
            bseUccRegistration: { select: { clientCode: true } },
          },
        },
      },
    })

    if (!mandate) throw new NotFoundException('Mandate not found')
    if (mandate.advisorId !== advisorId) throw new NotFoundException('Mandate not found')

    return mandate
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

  private mapBseStatusToEnum(bseStatus: string | undefined): BseMandateStatus {
    if (!bseStatus) return BseMandateStatus.SUBMITTED

    const statusUpper = bseStatus.toUpperCase()

    if (statusUpper === 'APPROVED' || statusUpper === 'ACTIVE') {
      return BseMandateStatus.APPROVED
    }
    if (statusUpper === 'REJECTED' || statusUpper === 'FAILURE') {
      return BseMandateStatus.REJECTED
    }
    if (statusUpper === 'CANCELLED') {
      return BseMandateStatus.CANCELLED
    }
    if (statusUpper === 'EXPIRED') {
      return BseMandateStatus.EXPIRED
    }
    if (statusUpper === 'SHIFTED') {
      return BseMandateStatus.SHIFTED
    }
    if (statusUpper === 'CREATED') {
      return BseMandateStatus.CREATED
    }

    return BseMandateStatus.SUBMITTED
  }
}
