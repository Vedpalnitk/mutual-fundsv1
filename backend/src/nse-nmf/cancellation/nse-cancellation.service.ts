import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'

const TYPE_CANCEL_ENDPOINT: Record<string, string> = {
  SIP: NSE_ENDPOINTS.SIP_CANCEL,
  XSIP: NSE_ENDPOINTS.XSIP_CANCEL,
  STP: NSE_ENDPOINTS.STP_CANCEL,
  SWP: NSE_ENDPOINTS.SWP_CANCEL,
}

@Injectable()
export class NseCancellationService {
  private readonly logger = new Logger(NseCancellationService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async cancelSystematic(registrationId: string, advisorId: string) {
    const registration = await this.prisma.nseSystematicRegistration.findFirst({
      where: { id: registrationId, advisorId },
    })
    if (!registration) throw new NotFoundException('Systematic registration not found')

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockCancellationResponse(registration.type)
      await this.prisma.nseSystematicRegistration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' },
      })
      return { success: true, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const endpoint = TYPE_CANCEL_ENDPOINT[registration.type]
    if (!endpoint) throw new NotFoundException(`No cancellation endpoint for type: ${registration.type}`)

    const response = await this.httpClient.jsonRequest(
      endpoint,
      { reg_id: registration.nseRegistrationId },
      credentials,
      advisorId,
      `CANCEL_${registration.type}`,
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    if (result.success) {
      await this.prisma.nseSystematicRegistration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' },
      })
    }

    this.errorMapper.throwIfError(result)
    return result
  }
}
