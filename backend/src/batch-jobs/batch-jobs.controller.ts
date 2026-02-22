import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { BatchJobsService } from './batch-jobs.service'

@ApiTags('admin/batch-jobs')
@Controller('api/v1/admin/batch-jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class BatchJobsController {
  constructor(private batchJobsService: BatchJobsService) {}

  @Get()
  @ApiOperation({ summary: 'List all batch jobs with latest run info' })
  async listJobs() {
    return this.batchJobsService.listJobsWithLatestRun()
  }

  @Get(':jobId/runs')
  @ApiOperation({ summary: 'Get paginated run history for a job' })
  async getJobRuns(
    @Param('jobId') jobId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.batchJobsService.getJobRuns(
      jobId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    )
  }

  @Post(':jobId/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger a batch job' })
  async triggerJob(@Param('jobId') jobId: string) {
    return this.batchJobsService.triggerJob(jobId)
  }
}
