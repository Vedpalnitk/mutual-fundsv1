import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { AdvisorDashboardService } from './advisor-dashboard.service'

@ApiTags('advisor-dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/dashboard')
@Controller('api/v1/advisor')
export class AdvisorDashboardController {
  constructor(private dashboardService: AdvisorDashboardService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get advisor dashboard data with KPIs, top performers, SIPs, and growth metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard data returned successfully' })
  async getDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getDashboard(getEffectiveAdvisorId(user))
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get advisor insights: portfolio health, rebalancing, tax harvesting, goal alerts' })
  @ApiResponse({ status: 200, description: 'Insights data returned successfully' })
  async getInsights(@CurrentUser() user: any) {
    return this.dashboardService.getInsights(getEffectiveAdvisorId(user))
  }

  @Post('insights/deep/:clientId')
  @ApiOperation({ summary: 'Get deep ML-powered analysis for a specific client' })
  @ApiResponse({ status: 200, description: 'Deep analysis returned successfully' })
  async getDeepAnalysis(@CurrentUser() user: any, @Param('clientId') clientId: string) {
    return this.dashboardService.getDeepAnalysis(getEffectiveAdvisorId(user), clientId)
  }

  @Get('insights/strategic')
  @ApiOperation({ summary: 'Get cross-portfolio strategic intelligence' })
  @ApiResponse({ status: 200, description: 'Strategic insights returned successfully' })
  async getStrategicInsights(@CurrentUser() user: any) {
    return this.dashboardService.getStrategicInsights(getEffectiveAdvisorId(user))
  }
}
