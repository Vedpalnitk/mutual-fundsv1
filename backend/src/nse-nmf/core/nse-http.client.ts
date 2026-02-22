import { Injectable, Logger, Inject, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue, ConnectionOptions } from 'bullmq'
import CircuitBreaker from 'opossum'
import { PrismaService } from '../../prisma/prisma.service'
import { NseAuthBuilder } from './nse-auth.builder'
import { NSE_TIMEOUTS } from './constants/endpoints'
import { withRetry } from '../../common/utils/retry'
import { BULLMQ_CONNECTION } from '../../common/queue/queue.module'
import { ApiLogJobData } from '../../common/queue/api-log.processor'

export interface NseHttpResponse {
  statusCode: number
  body: string
  parsed?: any
}

@Injectable()
export class NseHttpClient {
  private readonly logger = new Logger(NseHttpClient.name)
  private readonly baseUrl: string
  private readonly logQueue: Queue<ApiLogJobData>
  private readonly breaker: CircuitBreaker

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private authBuilder: NseAuthBuilder,
    @Inject(BULLMQ_CONNECTION) connection: any,
  ) {
    this.baseUrl = this.config.get<string>('nmf.baseUrl') || 'https://nseinvestuat.nseindia.com'
    this.logQueue = new Queue('api-logs', { connection })

    this.breaker = new CircuitBreaker(this._executeRequest.bind(this), {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 60000,
      volumeThreshold: 5,
    })
    this.breaker.fallback(() => {
      throw new ServiceUnavailableException('NSE NMF API temporarily unavailable — circuit breaker open')
    })
    this.breaker.on('open', () => this.logger.warn('NSE circuit breaker OPEN'))
    this.breaker.on('halfOpen', () => this.logger.log('NSE circuit breaker HALF-OPEN'))
    this.breaker.on('close', () => this.logger.log('NSE circuit breaker CLOSED'))
  }

  private async _executeRequest(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    return withRetry(
      () => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout))
      },
      {
        maxRetries: 2,
        baseDelayMs: 500,
        shouldRetry: (error) =>
          error instanceof Error && (
            error.message.includes('fetch failed') ||
            error.name === 'AbortError' ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('ETIMEDOUT')
          ),
      },
    )
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

      const response = await this.breaker.fire(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }, timeoutMs) as Response

      const responseBody = await response.text()
      const latencyMs = Date.now() - startTime

      let parsed: any
      try {
        parsed = JSON.parse(responseBody)
      } catch {
        parsed = undefined
      }

      const responseCode = parsed?.status || parsed?.Status || parsed?.response_status || null
      await this.logApiCall(advisorId, apiName, url, 'POST', body, parsed || responseBody, response.status, latencyMs, undefined, responseCode)

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
    responseCode?: string | null,
  ) {
    try {
      const sanitizedRequest = this.sanitize(requestData)
      const sanitizedResponse = this.sanitize(responseData)

      await this.logQueue.add('nse-log', {
        table: 'nseApiLog',
        data: {
          advisorId,
          apiName,
          endpoint,
          method,
          requestData: sanitizedRequest,
          responseData: sanitizedResponse,
          responseCode: responseCode ? String(responseCode) : null,
          statusCode,
          latencyMs,
          errorMessage,
        },
      }, {
        priority: 10,
        removeOnComplete: { age: 3600, count: 500 },
        removeOnFail: { age: 86400, count: 1000 },
      })
    } catch (err) {
      this.logger.warn('Failed to enqueue NSE API log', err)
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
