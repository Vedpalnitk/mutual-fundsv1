import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'

@Injectable()
export class NseEkycService {
  private readonly logger = new Logger(NseEkycService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async initiateEkyc(clientId: string, advisorId: string, data: any) {
    const registration = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId },
    })
    if (!registration) throw new NotFoundException('NSE UCC registration not found. Register client first.')

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockEkycResponse(registration.clientCode || clientId)
      await this.prisma.nseUccRegistration.update({
        where: { id: registration.id },
        data: {
          ekycStatus: 'INITIATED',
          ekycLink: mockResponse.ekyc_link,
        },
      })
      return { success: true, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      client_code: registration.clientCode,
      ...data,
    }

    // eKYC uses v1 endpoint
    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.EKYC_REGISTER,
      requestBody,
      credentials,
      advisorId,
      'EKYC_REGISTRATION',
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    await this.prisma.nseUccRegistration.update({
      where: { id: registration.id },
      data: {
        ekycStatus: result.success ? 'INITIATED' : 'FAILED',
        ekycLink: result.data?.ekyc_link || null,
      },
    })

    this.errorMapper.throwIfError(result)
    return result
  }
}
