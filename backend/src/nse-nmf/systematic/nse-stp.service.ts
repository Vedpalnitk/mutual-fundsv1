import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'

@Injectable()
export class NseStpService {
  private readonly logger = new Logger(NseStpService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async registerStp(advisorId: string, data: {
    clientId: string
    fromSchemeCode: string
    toSchemeCode: string
    fromSchemeName?: string
    toSchemeName?: string
    amount: number
    frequencyType: string
    startDate: string
    endDate?: string
    installments?: number
    folioNumber?: string
    sipId?: string
  }) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: data.clientId, advisorId },
    })
    if (!client) throw new NotFoundException('Client not found')

    const nseUcc = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId: data.clientId },
    })

    const registration = await this.prisma.nseSystematicRegistration.create({
      data: {
        clientId: data.clientId,
        advisorId,
        type: 'STP',
        status: 'SUBMITTED',
        schemeCode: data.fromSchemeCode,
        schemeName: data.fromSchemeName,
        switchSchemeCode: data.toSchemeCode,
        switchSchemeName: data.toSchemeName,
        amount: data.amount,
        frequencyType: data.frequencyType,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        installments: data.installments,
        folioNumber: data.folioNumber,
        sipId: data.sipId,
      },
    })

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockStpRegistrationResponse()
      await this.prisma.nseSystematicRegistration.update({
        where: { id: registration.id },
        data: {
          nseRegistrationId: mockResponse.reg_id,
          status: 'REGISTERED',
          nseResponseCode: mockResponse.reg_status,
          nseResponseMsg: mockResponse.reg_remark,
        },
      })
      return { success: true, registrationId: registration.id, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      client_code: nseUcc?.clientCode || client.pan,
      from_sch_code: data.fromSchemeCode,
      to_sch_code: data.toSchemeCode,
      installment_amount: data.amount.toString(),
      frequency_type: data.frequencyType,
      start_date: data.startDate,
      end_date: data.endDate || '',
      installment_no: data.installments?.toString() || '',
      folio_no: data.folioNumber || '',
      euin_number: '',
      euin_declaration: 'Y',
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.STP,
      requestBody,
      credentials,
      advisorId,
      'STP_REGISTRATION',
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    await this.prisma.nseSystematicRegistration.update({
      where: { id: registration.id },
      data: {
        nseRegistrationId: result.data?.reg_id || null,
        status: result.success ? 'REGISTERED' : 'FAILED',
        nseResponseCode: result.status,
        nseResponseMsg: result.message,
      },
    })

    this.errorMapper.throwIfError(result)
    return { ...result, success: true, registrationId: registration.id }
  }
}
