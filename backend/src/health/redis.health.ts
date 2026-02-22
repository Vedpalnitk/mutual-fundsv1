import { Injectable } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly redis: Redis

  constructor(private config: ConfigService) {
    super()
    this.redis = new Redis({
      host: this.config.get('redis.host') || 'localhost',
      port: this.config.get('redis.port') || 6379,
      lazyConnect: true,
    })
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redis.ping()
      if (result === 'PONG') {
        return this.getStatus(key, true)
      }
      throw new Error(`Unexpected PING response: ${result}`)
    } catch (error) {
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false, { message: (error as Error).message }))
    }
  }
}
