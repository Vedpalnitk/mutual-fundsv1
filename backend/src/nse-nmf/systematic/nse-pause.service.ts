import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'

@Injectable()
export class NsePauseService {
  private readonly logger = new Logger(NsePauseService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async pauseResume(registrationId: string, advisorId: string, action: 'PAUSE' | 'RESUME') {
    const registration = await this.prisma.nseSystematicRegistration.findFirst({
      where: { id: registrationId, advisorId, type: { in: ['SIP', 'XSIP'] } },
    })
    if (!registration) throw new NotFoundException('SIP/XSIP registration not found')

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockPauseResumeResponse(action)
      await this.prisma.nseSystematicRegistration.update({
        where: { id: registrationId },
        data: { status: action === 'PAUSE' ? 'PAUSED' : 'ACTIVE' },
      })
      return { success: true, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      reg_id: registration.nseRegistrationId,
      action: action,
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.XSIP_PAUSE,
      requestBody,
      credentials,
      advisorId,
      `SYSTEMATIC_${action}`,
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    if (result.success) {
      await this.prisma.nseSystematicRegistration.update({
        where: { id: registrationId },
        data: { status: action === 'PAUSE' ? 'PAUSED' : 'ACTIVE' },
      })
    }

    this.errorMapper.throwIfError(result)
    return result
  }
}
