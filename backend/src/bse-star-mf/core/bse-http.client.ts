import { Injectable, Logger, Inject, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue, ConnectionOptions } from 'bullmq'
import CircuitBreaker from 'opossum'
import { PrismaService } from '../../prisma/prisma.service'
import { BseSoapBuilder } from './bse-soap.builder'
import { BSE_TIMEOUTS } from './bse-config'
import { withRetry } from '../../common/utils/retry'
import { BULLMQ_CONNECTION } from '../../common/queue/queue.module'
import { ApiLogJobData } from '../../common/queue/api-log.processor'

export interface BseHttpResponse {
  statusCode: number
  body: string
  parsed?: any
}

@Injectable()
export class BseHttpClient {
  private readonly logger = new Logger(BseHttpClient.name)
  private readonly baseUrl: string
  private readonly logQueue: Queue<ApiLogJobData>
  private readonly breaker: CircuitBreaker

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private soapBuilder: BseSoapBuilder,
    @Inject(BULLMQ_CONNECTION) connection: any,
  ) {
    this.baseUrl = this.config.get<string>('bse.baseUrl') || 'https://bsestarmfdemo.bseindia.com'
    this.logQueue = new Queue('api-logs', { connection })

    this.breaker = new CircuitBreaker(this._executeRequest.bind(this), {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 60000,
      volumeThreshold: 5,
    })
    this.breaker.fallback(() => {
      throw new ServiceUnavailableException('BSE API temporarily unavailable — circuit breaker open')
    })
    this.breaker.on('open', () => this.logger.warn('BSE circuit breaker OPEN'))
    this.breaker.on('halfOpen', () => this.logger.log('BSE circuit breaker HALF-OPEN'))
    this.breaker.on('close', () => this.logger.log('BSE circuit breaker CLOSED'))
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

  async soapRequest(
    endpoint: string,
    soapAction: string,
    body: string,
    advisorId: string,
    apiName: string,
    timeoutMs = BSE_TIMEOUTS.DEFAULT,
  ): Promise<BseHttpResponse> {
    const url = `${this.baseUrl}${endpoint}`
    const envelope = this.soapBuilder.buildEnvelope(soapAction, body)
    const startTime = Date.now()

    try {
      const response = await this.breaker.fire(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          SOAPAction: soapAction,
        },
        body: envelope,
      }, timeoutMs) as Response

      const responseBody = await response.text()
      const latencyMs = Date.now() - startTime

      await this.logApiCall(advisorId, apiName, url, 'POST', envelope, responseBody, response.status, latencyMs)

      return {
        statusCode: response.status,
        body: responseBody,
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.logApiCall(advisorId, apiName, url, 'POST', null, null, 0, latencyMs, errorMessage)
      throw error
    }
  }

  async jsonRequest(
    endpoint: string,
    method: 'GET' | 'POST',
    body: any,
    advisorId: string,
    apiName: string,
    headers: Record<string, string> = {},
    timeoutMs = BSE_TIMEOUTS.DEFAULT,
  ): Promise<BseHttpResponse> {
    const url = `${this.baseUrl}${endpoint}`
    const startTime = Date.now()

    try {
      const response = await this.breaker.fire(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
      }, timeoutMs) as Response

      const responseBody = await response.text()
      const latencyMs = Date.now() - startTime

      let parsed: any
      try {
        parsed = JSON.parse(responseBody)
      } catch {
        parsed = undefined
      }

      await this.logApiCall(advisorId, apiName, url, method, body, parsed || responseBody, response.status, latencyMs)

      return {
        statusCode: response.status,
        body: responseBody,
        parsed,
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await this.logApiCall(advisorId, apiName, url, method, body, null, 0, latencyMs, errorMessage)
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

      await this.logQueue.add('bse-log', {
        table: 'bseApiLog',
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
      }, {
        priority: 10,
        removeOnComplete: { age: 3600, count: 500 },
        removeOnFail: { age: 86400, count: 1000 },
      })
    } catch (err) {
      this.logger.warn('Failed to enqueue BSE API log', err)
    }
  }

  private sanitize(data: any): any {
    if (!data) return null
    if (typeof data === 'string') {
      // Mask passwords and tokens in SOAP XML
      return data
        .replace(/<Password>[^<]*<\/Password>/gi, '<Password>***</Password>')
        .replace(/<PassKey>[^<]*<\/PassKey>/gi, '<PassKey>***</PassKey>')
        .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '***PAN***')
    }
    if (typeof data === 'object') {
      const sanitized = { ...data }
      const sensitiveKeys = ['password', 'passKey', 'Password', 'PassKey', 'token', 'Token', 'pan', 'PAN']
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
