import { Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { PanCryptoService } from './services/pan-crypto.service'
import { BatchJobsTracker } from './batch-jobs.tracker'
import { DistributedLockService } from './services/distributed-lock.service'
import { CacheService } from './services/cache.service'
import { ApiLogProcessor } from './queue/api-log.processor'
import { LogCleanupJob } from './jobs/log-cleanup.job'
import { MetricsService } from './metrics/metrics.service'
import { MetricsController } from './metrics/metrics.controller'
import { MetricsInterceptor } from './metrics/metrics.interceptor'

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    PanCryptoService,
    BatchJobsTracker,
    DistributedLockService,
    CacheService,
    ApiLogProcessor,
    LogCleanupJob,
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [PanCryptoService, BatchJobsTracker, DistributedLockService, CacheService, MetricsService],
})
export class CommonModule {}
