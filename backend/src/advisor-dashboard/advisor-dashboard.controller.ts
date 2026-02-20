import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { AdvisorDashboardService } from './advisor-dashboard.service'
import { ExecuteRebalanceDto } from './dto/execute-rebalance.dto'

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

  @Get('insights/cross-sell')
  @ApiOperation({ summary: 'Cross-sell gap analysis for each client' })
  @ApiResponse({ status: 200, description: 'Cross-sell opportunities returned successfully' })
  async getCrossSellOpportunities(@CurrentUser() user: any) {
    return this.dashboardService.getCrossSellOpportunities(getEffectiveAdvisorId(user))
  }

  @Get('insights/churn-risk')
  @ApiOperation({ summary: 'Churn risk assessment per client' })
  @ApiResponse({ status: 200, description: 'Churn risk data returned successfully' })
  async getChurnRisk(@CurrentUser() user: any) {
    return this.dashboardService.getChurnRisk(getEffectiveAdvisorId(user))
  }

  @Post('rebalancing/execute')
  @ApiOperation({ summary: 'Execute rebalancing actions via BSE/NSE' })
  @ApiResponse({ status: 200, description: 'Rebalancing execution results' })
  async executeRebalancing(@CurrentUser() user: any, @Body() dto: ExecuteRebalanceDto) {
    return this.dashboardService.executeRebalancing(getEffectiveAdvisorId(user), dto)
  }

  @Get('action-calendar')
  @ApiOperation({ summary: 'Unified action calendar: SIP expiry, birthdays, follow-ups, upcoming SIPs' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Action calendar returned successfully' })
  async getActionCalendar(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.dashboardService.getActionCalendar(getEffectiveAdvisorId(user), parseInt(days || '30'))
  }
}
