import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'

@Injectable()
export class NseFatcaService {
  private readonly logger = new Logger(NseFatcaService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async uploadFatca(clientId: string, advisorId: string, data: any) {
    const registration = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId },
    })
    if (!registration) throw new NotFoundException('NSE UCC registration not found. Register client first.')

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockFatcaUploadResponse()
      await this.prisma.nseUccRegistration.update({
        where: { id: registration.id },
        data: { fatcaStatus: 'SUBMITTED' },
      })
      return { success: true, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      client_code: registration.clientCode,
      ...data,
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.FATCA,
      requestBody,
      credentials,
      advisorId,
      'FATCA_UPLOAD',
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    await this.prisma.nseUccRegistration.update({
      where: { id: registration.id },
      data: {
        fatcaStatus: result.success ? 'SUBMITTED' : 'FAILED',
      },
    })

    this.errorMapper.throwIfError(result)
    return result
  }

  async uploadFatcaCorporate(clientId: string, advisorId: string, data: any) {
    const registration = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId },
    })
    if (!registration) throw new NotFoundException('NSE UCC registration not found. Register client first.')

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockFatcaUploadResponse()
      await this.prisma.nseUccRegistration.update({
        where: { id: registration.id },
        data: { fatcaStatus: 'SUBMITTED' },
      })
      return { success: true, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      client_code: registration.clientCode,
      ...data,
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.FATCA_COMMON,
      requestBody,
      credentials,
      advisorId,
      'FATCA_CORPORATE_UPLOAD',
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    await this.prisma.nseUccRegistration.update({
      where: { id: registration.id },
      data: {
        fatcaStatus: result.success ? 'SUBMITTED' : 'FAILED',
      },
    })

    this.errorMapper.throwIfError(result)
    return result
  }
}
