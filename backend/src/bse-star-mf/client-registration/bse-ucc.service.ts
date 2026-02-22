import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BseHttpClient } from '../core/bse-http.client'
import { BseErrorMapper } from '../core/bse-error.mapper'
import { BseCredentialsService } from '../credentials/bse-credentials.service'
import { BseMockService } from '../mocks/bse-mock.service'
import { ConfigService } from '@nestjs/config'
import { BSE_ENDPOINTS } from '../core/bse-config'
import { RegisterUccDto, UccTransactionType } from './dto/register-ucc.dto'
import { BseUccStatus } from '@prisma/client'

@Injectable()
export class BseUccService {
  private readonly logger = new Logger(BseUccService.name)
  private readonly isMockMode: boolean

  constructor(
    private prisma: PrismaService,
    private httpClient: BseHttpClient,
    private errorMapper: BseErrorMapper,
    private credentialsService: BseCredentialsService,
    private mockService: BseMockService,
    private config: ConfigService,
  ) {
    this.isMockMode = this.config.get<boolean>('bse.mockMode') === true
  }

  async getRegistrationStatus(clientId: string, advisorId: string) {
    await this.verifyClientAccess(clientId, advisorId)

    const registration = await this.prisma.bseUccRegistration.findUnique({
      where: { clientId },
    })

    if (!registration) {
      return { registered: false, clientId }
    }

    return {
      registered: true,
      clientId,
      clientCode: registration.clientCode,
      status: registration.status,
      fatcaStatus: registration.fatcaStatus,
      ckycStatus: registration.ckycStatus,
    }
  }

  async registerClient(clientId: string, advisorId: string, dto: RegisterUccDto) {
    await this.verifyClientAccess(clientId, advisorId)

    const client = await this.prisma.fAClient.findUnique({
      where: { id: clientId },
      include: { bankAccounts: { where: { isPrimary: true }, take: 1 } },
    })

    if (!client) throw new NotFoundException('Client not found')
    if (!client.pan) throw new BadRequestException('Client PAN is required for BSE registration')
    if (!client.email) throw new BadRequestException('Client email is required')
    if (!client.dateOfBirth) throw new BadRequestException('Client date of birth is required')

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    // Generate client code: PAN-based (BSE standard)
    const clientCode = client.pan

    if (this.isMockMode) {
      const mockResult = this.mockService.mockUccRegistrationResponse(clientCode)

      return this.saveRegistration(clientId, advisorId, clientCode, dto, {
        success: true,
        code: mockResult.Status,
        message: mockResult.Message,
      })
    }

    const bankAccount = client.bankAccounts[0]

    // Build Enhanced API request body
    const requestBody = {
      MemberCode: credentials.memberId,
      ClientCode: clientCode,
      Holding: dto.holdingNature || 'SI',
      TaxStatus: dto.taxStatus,
      OccCode: dto.occupationCode || '01',
      FirstName: client.name.split(' ')[0] || '',
      MiddleName: '',
      LastName: client.name.split(' ').slice(1).join(' ') || '',
      PAN: client.pan,
      DOB: client.dateOfBirth ? this.formatDate(client.dateOfBirth) : '',
      Email: client.email,
      Mobile: client.phone || '',
      Address1: client.address || '',
      City: client.city || '',
      State: client.state || '',
      Pincode: client.pincode || '',
      Country: 'IN',
      CommMode: dto.communicationMode || 'E',
      DivPayMode: dto.dividendPayMode || '02',
      BankName: bankAccount?.bankName || '',
      BankBranch: '',
      AccType: bankAccount?.accountType === 'Current' ? 'CC' : 'SB',
      AccNo: bankAccount?.accountNumber || '',
      IFSC: bankAccount?.ifsc || '',
      NomineeName: dto.nomineeName || client.nomineeName || '',
      NomineeRelation: dto.nomineeRelation || client.nomineeRelation || '',
      TransType: dto.transType,
    }

    const response = await this.httpClient.jsonRequest(
      BSE_ENDPOINTS.UCC_REGISTRATION,
      'POST',
      requestBody,
      advisorId,
      'UCC_Registration',
    )

    const result = this.errorMapper.parseResponse(
      response.parsed?.Status || '200',
      response.parsed?.Message,
    )

    return this.saveRegistration(clientId, advisorId, clientCode, dto, result)
  }

  private async saveRegistration(
    clientId: string,
    advisorId: string,
    clientCode: string,
    dto: RegisterUccDto,
    result: { success: boolean; code: string; message: string },
  ) {
    const status = result.success ? BseUccStatus.SUBMITTED : BseUccStatus.REJECTED

    const registration = await this.prisma.bseUccRegistration.upsert({
      where: { clientId },
      update: {
        clientCode,
        status,
        taxStatus: dto.taxStatus,
        holdingNature: dto.holdingNature,
        occupationCode: dto.occupationCode,
        bseResponseCode: result.code,
        bseResponseMsg: result.message,
      },
      create: {
        clientId,
        advisorId,
        clientCode,
        status,
        taxStatus: dto.taxStatus,
        holdingNature: dto.holdingNature,
        occupationCode: dto.occupationCode,
        bseResponseCode: result.code,
        bseResponseMsg: result.message,
      },
    })

    return {
      id: registration.id,
      clientCode: registration.clientCode,
      status: registration.status,
      responseCode: result.code,
      message: result.message,
    }
  }

  async batchRegistrationStatus(clientIds: string[], advisorId: string) {
    const registrations = await this.prisma.bseUccRegistration.findMany({
      where: { clientId: { in: clientIds }, advisorId },
      select: { clientId: true, status: true, clientCode: true },
    })
    const statusMap: Record<string, { status: string; bseClientCode: string | null }> = {}
    for (const reg of registrations) {
      statusMap[reg.clientId] = { status: reg.status, bseClientCode: reg.clientCode }
    }
    return statusMap
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

  private formatDate(date: Date): string {
    const d = new Date(date)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }
}
