import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { NseCryptoService } from '../core/nse-crypto.service'
import { NseHttpClient } from '../core/nse-http.client'
import { NseAuthBuilder } from '../core/nse-auth.builder'
import { ConfigService } from '@nestjs/config'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'
import { SetCredentialsDto } from '../dto/nmf.dto'

/** @deprecated Use SetCredentialsDto from dto/nmf.dto.ts */
export type SetNseCredentialsDto = SetCredentialsDto

export interface NseCredentialStatusResponse {
  isConfigured: boolean
  memberId?: string
  loginUserId?: string
  ipWhitelist?: string[]
  isActive?: boolean
  lastTestedAt?: Date | null
  testStatus?: string | null
}

@Injectable()
export class NseCredentialsService {
  constructor(
    private prisma: PrismaService,
    private crypto: NseCryptoService,
    private httpClient: NseHttpClient,
    private authBuilder: NseAuthBuilder,
    private config: ConfigService,
  ) {}

  async getStatus(userId: string): Promise<NseCredentialStatusResponse> {
    const credential = await this.prisma.nsePartnerCredential.findUnique({
      where: { userId },
    })

    if (!credential) {
      return { isConfigured: false }
    }

    return {
      isConfigured: true,
      memberId: credential.memberId,
      loginUserId: credential.loginUserId,
      ipWhitelist: credential.ipWhitelist,
      isActive: credential.isActive,
      lastTestedAt: credential.lastTestedAt,
      testStatus: credential.testStatus,
    }
  }

  async setCredentials(userId: string, dto: SetNseCredentialsDto): Promise<NseCredentialStatusResponse> {
    const { encrypted: apiSecretEnc, iv: ivApiSecret } = this.crypto.encrypt(dto.apiSecret)
    const { encrypted: memberLicenseKeyEnc, iv: ivMemberLicenseKey } = this.crypto.encrypt(dto.memberLicenseKey)

    const credential = await this.prisma.nsePartnerCredential.upsert({
      where: { userId },
      update: {
        memberId: dto.memberId,
        loginUserId: dto.loginUserId,
        apiSecretEnc,
        memberLicenseKeyEnc,
        ivApiSecret,
        ivMemberLicenseKey,
        ipWhitelist: dto.ipWhitelist || [],
        isActive: true,
        testStatus: null,
        lastTestedAt: null,
      },
      create: {
        userId,
        memberId: dto.memberId,
        loginUserId: dto.loginUserId,
        apiSecretEnc,
        memberLicenseKeyEnc,
        ivApiSecret,
        ivMemberLicenseKey,
        ipWhitelist: dto.ipWhitelist || [],
      },
    })

    return {
      isConfigured: true,
      memberId: credential.memberId,
      loginUserId: credential.loginUserId,
      ipWhitelist: credential.ipWhitelist,
      isActive: credential.isActive,
      lastTestedAt: credential.lastTestedAt,
      testStatus: credential.testStatus,
    }
  }

  async testConnection(userId: string): Promise<{ success: boolean; message: string }> {
    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      await this.prisma.nsePartnerCredential.update({
        where: { userId },
        data: {
          lastTestedAt: new Date(),
          testStatus: 'SUCCESS (mock)',
        },
      })
      return { success: true, message: 'NSE connection successful (mock mode)' }
    }

    const creds = await this.getDecryptedCredentials(userId)

    try {
      // Use KYC_CHECK as a lightweight test endpoint
      const response = await this.httpClient.jsonRequest(
        NSE_ENDPOINTS.KYC_CHECK,
        { pan: 'AAAAA0000A' },
        creds,
        userId,
        'TEST_CONNECTION',
      )

      // Any non-auth-error response means credentials work
      const isAuthError = response.parsed?.status?.toUpperCase()?.includes('INVALID_AUTH')
        || response.parsed?.status?.toUpperCase()?.includes('INVALID_MEMBER')
        || response.statusCode === 401

      if (isAuthError) {
        throw new Error('Authentication failed')
      }

      await this.prisma.nsePartnerCredential.update({
        where: { userId },
        data: {
          lastTestedAt: new Date(),
          testStatus: 'SUCCESS',
        },
      })

      return { success: true, message: 'NSE connection successful' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'

      await this.prisma.nsePartnerCredential.update({
        where: { userId },
        data: {
          lastTestedAt: new Date(),
          testStatus: `FAILED: ${errorMessage}`,
        },
      })

      return { success: false, message: errorMessage }
    }
  }

  async getDecryptedCredentials(userId: string) {
    const credential = await this.prisma.nsePartnerCredential.findUnique({
      where: { userId },
    })

    if (!credential) {
      throw new NotFoundException('NSE credentials not configured')
    }

    if (!credential.isActive) {
      throw new BadRequestException('NSE credentials are inactive')
    }

    return {
      memberId: credential.memberId,
      loginUserId: credential.loginUserId,
      apiSecret: this.crypto.decrypt(credential.apiSecretEnc, credential.ivApiSecret),
      memberLicenseKey: this.crypto.decrypt(credential.memberLicenseKeyEnc, credential.ivMemberLicenseKey),
    }
  }
}
