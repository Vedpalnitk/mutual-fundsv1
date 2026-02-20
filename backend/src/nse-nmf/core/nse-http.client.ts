import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NseAuthBuilder } from './nse-auth.builder'
import { NSE_TIMEOUTS } from './constants/endpoints'

export interface NseHttpResponse {
  statusCode: number
  body: string
  parsed?: any
}

@Injectable()
export class NseHttpClient {
  private readonly logger = new Logger(NseHttpClient.name)
  private readonly baseUrl: string

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private authBuilder: NseAuthBuilder,
  ) {
    this.baseUrl = this.config.get<string>('nmf.baseUrl') || 'https://nseinvestuat.nseindia.com'
  }

  /**
   * Send a JSON POST request to NSE NMF API
   * Automatically builds auth headers from decrypted credentials
   */
  async jsonRequest(
    endpoint: string,
    body: any,
    credentials: {
      memberId: string
      loginUserId: string
      apiSecret: string
      memberLicenseKey: string
    },
    advisorId: string,
    apiName: string,
    timeoutMs = NSE_TIMEOUTS.DEFAULT,
  ): Promise<NseHttpResponse> {
    const url = `${this.baseUrl}${endpoint}`
    const startTime = Date.now()

    try {
      const headers = this.authBuilder.buildHeaders(credentials)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const responseBody = await response.text()
      const latencyMs = Date.now() - startTime

      let parsed: any
      try {
        parsed = JSON.parse(responseBody)
      } catch {
        parsed = undefined
      }

      await this.logApiCall(advisorId, apiName, url, 'POST', body, parsed || responseBody, response.status, latencyMs)

      return {
        statusCode: response.status,
        body: responseBody,
        parsed,
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.logApiCall(advisorId, apiName, url, 'POST', body, null, 0, latencyMs, errorMessage)
      throw error
    }
  }

  private async logApiCall(
    advisorId: string,
    apiName: string,
    endpoint: string,
    method: string,
    requestData: any,
    responseData: any,
    statusCode: number,
    latencyMs: number,
    errorMessage?: string,
  ) {
    try {
      const sanitizedRequest = this.sanitize(requestData)
      const sanitizedResponse = this.sanitize(responseData)

      await this.prisma.nseApiLog.create({
        data: {
          advisorId,
          apiName,
          endpoint,
          method,
          requestData: sanitizedRequest,
          responseData: sanitizedResponse,
          statusCode,
          latencyMs,
          errorMessage,
        },
      })
    } catch (err) {
      this.logger.warn('Failed to log NSE API call', err)
    }
  }

  private sanitize(data: any): any {
    if (!data) return null
    if (typeof data === 'string') {
      // Mask PAN numbers
      return data.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '***PAN***')
    }
    if (typeof data === 'object') {
      const sanitized = { ...data }
      const sensitiveKeys = [
        'password', 'Password', 'api_secret', 'apiSecret',
        'member_license_key', 'memberLicenseKey', 'Authorization',
        'pan', 'PAN', 'ph_pan', 'account_no',
      ]
      for (const key of sensitiveKeys) {
        if (key in sanitized) {
          sanitized[key] = '***'
        }
      }
      return sanitized
    }
    return data
  }
}
