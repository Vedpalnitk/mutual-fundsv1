import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NseMockService } from '../mocks/nse-mock.service'
import { NSE_ENDPOINTS } from '../core/constants/endpoints'

@Injectable()
export class NseUtilitiesService {
  private readonly logger = new Logger(NseUtilitiesService.name)

  constructor(
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private mockService: NseMockService,
    private config: ConfigService,
  ) {}

  async updateUtr(advisorId: string, data: { orderId: string; utrNo: string }) {
    const isMockMode = this.config.get<boolean>('nmf.mockMode')
    if (isMockMode) return { status: 'SUCCESS', remark: 'UTR updated (mock)' }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.UTR_UPDATE,
      { order_id: data.orderId, utr_no: data.utrNo },
      credentials,
      advisorId,
      'UTR_UPDATE',
    )
    return this.errorMapper.parseResponse(response.parsed)
  }

  async mapSipUmrn(advisorId: string, data: { sipRegId: string; mandateId: string }) {
    const isMockMode = this.config.get<boolean>('nmf.mockMode')
    if (isMockMode) return { status: 'SUCCESS', remark: 'SIP UMRN mapped (mock)' }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.SIP_UMRN,
      { sip_reg_id: data.sipRegId, mandate_id: data.mandateId },
      credentials,
      advisorId,
      'SIP_UMRN_MAPPING',
    )
    return this.errorMapper.parseResponse(response.parsed)
  }

  async getShortUrl(advisorId: string, data: { orderId?: string; regId?: string }) {
    const isMockMode = this.config.get<boolean>('nmf.mockMode')
    if (isMockMode) return this.mockService.mockShortUrlResponse()

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.GET_LINK,
      data,
      credentials,
      advisorId,
      'GET_SHORT_URL',
    )
    return this.errorMapper.parseResponse(response.parsed)
  }

  async checkKyc(advisorId: string, data: { pan: string }) {
    const isMockMode = this.config.get<boolean>('nmf.mockMode')
    if (isMockMode) return this.mockService.mockKycCheckResponse(data.pan)

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.KYC_CHECK,
      { pan: data.pan },
      credentials,
      advisorId,
      'KYC_CHECK',
    )
    return this.errorMapper.parseResponse(response.parsed)
  }

  async resendCommunication(advisorId: string, data: { orderId?: string; regId?: string }) {
    const isMockMode = this.config.get<boolean>('nmf.mockMode')
    if (isMockMode) return { status: 'SUCCESS', remark: 'Communication resent (mock)' }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)
    const response = await this.httpClient.jsonRequest(
      NSE_ENDPOINTS.RESEND_COMM,
      data,
      credentials,
      advisorId,
      'RESEND_COMMUNICATION',
    )
    return this.errorMapper.parseResponse(response.parsed)
  }
}
