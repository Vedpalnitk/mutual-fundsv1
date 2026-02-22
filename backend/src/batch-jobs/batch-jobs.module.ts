import { Module } from '@nestjs/common'
import { BatchJobsController } from './batch-jobs.controller'
import { BatchJobsService } from './batch-jobs.service'

@Module({
  controllers: [BatchJobsController],
  providers: [BatchJobsService],
})
export class BatchJobsModule {}
