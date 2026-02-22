import { Injectable } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'
import * as Minio from 'minio'

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
  private readonly client: Minio.Client

  constructor(private config: ConfigService) {
    super()
    this.client = new Minio.Client({
      endPoint: this.config.get('minio.endpoint') || 'localhost',
      port: this.config.get<number>('minio.port') || 9000,
      useSSL: this.config.get('minio.useSSL') === true,
      accessKey: this.config.get('minio.accessKey') || 'minioadmin',
      secretKey: this.config.get('minio.secretKey') || 'minioadmin',
    })
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.client.listBuckets()
      return this.getStatus(key, true)
    } catch (error) {
      throw new HealthCheckError('MinIO check failed', this.getStatus(key, false, { message: (error as Error).message }))
    }
  }
}
