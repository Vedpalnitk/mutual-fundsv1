import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'
import { NSE_ACTION_FLAGS } from '../core/nse-config'

@Injectable()
export class NseUccService {
  private readonly logger = new Logger(NseUccService.name)

  constructor(
    private prisma: PrismaService,
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async getRegistrationStatus(clientId: string, advisorId: string) {
    const registration = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId },
    })

    if (!registration) {
      return { isRegistered: false, clientId }
    }

    return {
      isRegistered: true,
      clientId,
      clientCode: registration.clientCode,
      status: registration.status,
      fatcaStatus: registration.fatcaStatus,
      ekycStatus: registration.ekycStatus,
      ekycLink: registration.ekycLink,
      nseResponseMsg: registration.nseResponseMsg,
      updatedAt: registration.updatedAt,
    }
  }

  async registerUcc(clientId: string, advisorId: string, data: any) {
    // 1. Verify client exists and belongs to advisor
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId },
      include: { bankAccounts: true },
    })
    if (!client) throw new NotFoundException('Client not found')

    // 2. Create/update DB record
    const registration = await this.prisma.nseUccRegistration.upsert({
      where: { clientId },
      update: {
        submittedData: data,
        status: 'SUBMITTED',
        nseResponseCode: null,
        nseResponseMsg: null,
      },
      create: {
        clientId,
        advisorId,
        clientCode: data.client_code || client.pan,
        submittedData: data,
        status: 'SUBMITTED',
        taxStatus: data.tax_status,
        holdingNature: data.holding_nature,
        occupationCode: data.occupation_code,
      },
    })

    // 3. Mock or real
    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockUccRegistrationResponse(registration.clientCode || clientId)
      await this.prisma.nseUccRegistration.update({
        where: { id: registration.id },
        data: {
          status: 'APPROVED',
          clientCode: mockResponse.client_code,
          nseResponseCode: mockResponse.status,
          nseResponseMsg: mockResponse.remark,
        },
      })
      return { success: true, ...mockResponse }
    }

    // 4. Get credentials and send
    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      action_flag: NSE_ACTION_FLAGS.ADD,
      client_code: data.client_code || client.pan,
      ...data,
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.UCC_183,
      requestBody,
      credentials,
      advisorId,
      'UCC_REGISTRATION',
    )

    // 5. Parse response
    const result = this.errorMapper.parseResponse(response.parsed)

    // 6. Update DB
    await this.prisma.nseUccRegistration.update({
      where: { id: registration.id },
      data: {
        status: result.success ? 'APPROVED' : 'REJECTED',
        clientCode: data.client_code || client.pan,
        nseResponseCode: result.status,
        nseResponseMsg: result.message,
      },
    })

    // 7. Throw if error
    this.errorMapper.throwIfError(result)

    return result
  }

  async modifyUcc(clientId: string, advisorId: string, data: any) {
    const registration = await this.prisma.nseUccRegistration.findUnique({
      where: { clientId },
    })
    if (!registration) throw new NotFoundException('UCC registration not found')

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      const mockResponse = this.mockService.mockUccRegistrationResponse(registration.clientCode || clientId)
      await this.prisma.nseUccRegistration.update({
        where: { id: registration.id },
        data: {
          submittedData: data,
          status: 'APPROVED',
          nseResponseCode: mockResponse.status,
          nseResponseMsg: mockResponse.remark,
        },
      })
      return { success: true, ...mockResponse }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      action_flag: NSE_ACTION_FLAGS.MODIFY,
      client_code: registration.clientCode,
      ...data,
    }

    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.UCC_183,
      requestBody,
      credentials,
      advisorId,
      'UCC_MODIFICATION',
    )

    const result = this.errorMapper.parseResponse(response.parsed)

    await this.prisma.nseUccRegistration.update({
      where: { id: registration.id },
      data: {
        submittedData: data,
        status: result.success ? 'APPROVED' : 'MODIFICATION_PENDING',
        nseResponseCode: result.status,
        nseResponseMsg: result.message,
      },
    })

    this.errorMapper.throwIfError(result)
    return result
  }
}
