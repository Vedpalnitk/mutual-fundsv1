import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { AdminAnalyticsService } from '../services/admin-analytics.service'
import { AnalyticsTrendQueryDto } from '../dto/analytics-query.dto'

@ApiTags('admin-analytics')
@Controller('api/v1/admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminAnalyticsController {
  constructor(private service: AdminAnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.service.getOverview()
  }

  @Get('trends')
  getTrends(@Query() query: AnalyticsTrendQueryDto) {
    return this.service.getTrends(query)
  }

  @Get('distribution')
  getDistribution() {
    return this.service.getDistribution()
  }
}
