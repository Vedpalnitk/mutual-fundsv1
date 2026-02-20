import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NseHttpClient } from '../core/nse-http.client'
import { NseErrorMapper } from '../core/nse-error.mapper'
import { NseCredentialsService } from '../credentials/nse-credentials.service'
import { NSE_ENDPOINTS, NSE_TIMEOUTS } from '../core/constants/endpoints'

const UPLOAD_ENDPOINTS: Record<string, string> = {
  aof: NSE_ENDPOINTS.AOF_IMAGE,
  fatca: NSE_ENDPOINTS.FATCA_IMAGE,
  poa: NSE_ENDPOINTS.POA_UPLOAD,
  'cancel-cheque': NSE_ENDPOINTS.CANCEL_CHEQUE,
  'elog-bank': NSE_ENDPOINTS.ELOG_BANK,
  mandate: NSE_ENDPOINTS.MANDATE_IMAGE,
  nft: NSE_ENDPOINTS.NFT_IMAGE,
}

@Injectable()
export class NseUploadService {
  private readonly logger = new Logger(NseUploadService.name)

  constructor(
    private httpClient: NseHttpClient,
    private errorMapper: NseErrorMapper,
    private credentialsService: NseCredentialsService,
    private config: ConfigService,
  ) {}

  async uploadFile(advisorId: string, uploadType: string, data: {
    clientCode: string
    fileData: string // base64
    fileName: string
    [key: string]: any
  }) {
    const endpoint = UPLOAD_ENDPOINTS[uploadType]
    if (!endpoint) {
      return { success: false, message: `Unknown upload type: ${uploadType}` }
    }

    const isMockMode = this.config.get<boolean>('nmf.mockMode')

    if (isMockMode) {
      return {
        status: 'SUCCESS',
        remark: `${uploadType} uploaded successfully (mock)`,
      }
    }

    const credentials = await this.credentialsService.getDecryptedCredentials(advisorId)

    const requestBody = {
      client_code: data.clientCode,
      file_data: data.fileData,
      file_name: data.fileName,
      ...data,
    }

    const response = await this.httpClient.jsonRequest(
      endpoint,
      requestBody,
      credentials,
      advisorId,
      `UPLOAD_${uploadType.toUpperCase().replace(/-/g, '_')}`,
      NSE_TIMEOUTS.UPLOAD,
    )

    return this.errorMapper.parseResponse(response.parsed)
  }
}
