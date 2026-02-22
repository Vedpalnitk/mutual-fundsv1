import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import IORedis from 'ioredis'

export const BULLMQ_CONNECTION = 'BULLMQ_CONNECTION'

@Global()
@Module({
  providers: [
    {
      provide: BULLMQ_CONNECTION,
      useFactory: (config: ConfigService) => {
        return new IORedis({
          host: config.get('redis.host') || 'localhost',
          port: config.get('redis.port') || 6379,
          maxRetriesPerRequest: null, // required by BullMQ
        })
      },
      inject: [ConfigService],
    },
  ],
  exports: [BULLMQ_CONNECTION],
})
export class QueueModule {}
