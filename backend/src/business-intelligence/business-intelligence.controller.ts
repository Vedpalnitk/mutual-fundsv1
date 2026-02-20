import {
  Controller, Get, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { BusinessIntelligenceService } from './business-intelligence.service';

@ApiTags('business-intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/business')
@Controller('api/v1/bi')
export class BusinessIntelligenceController {
  constructor(private biService: BusinessIntelligenceService) {}

  @Get('aum')
  @ApiOperation({ summary: 'Total AUM overview by AMC, category' })
  getAumOverview(@CurrentUser() user: any) {
    return this.biService.getAumOverview(getEffectiveAdvisorId(user));
  }

  @Get('aum/by-branch')
  @ApiOperation({ summary: 'AUM breakdown by branch' })
  getAumByBranch(@CurrentUser() user: any) {
    return this.biService.getAumByBranch(getEffectiveAdvisorId(user));
  }

  @Get('aum/by-rm')
  @ApiOperation({ summary: 'AUM breakdown by RM' })
  getAumByRm(@CurrentUser() user: any) {
    return this.biService.getAumByRm(getEffectiveAdvisorId(user));
  }

  @Get('aum/by-client')
  @ApiOperation({ summary: 'Top clients by AUM' })
  @ApiQuery({ name: 'topN', required: false, type: Number })
  getAumByClient(@CurrentUser() user: any, @Query('topN') topN?: string) {
    return this.biService.getAumByClient(getEffectiveAdvisorId(user), parseInt(topN || '20'));
  }

  @Get('aum/snapshots')
  @ApiOperation({ summary: 'Historical AUM snapshots for trend charts' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getAumSnapshots(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.biService.getAumSnapshots(getEffectiveAdvisorId(user), parseInt(days || '90'));
  }

  @Get('net-flows')
  @ApiOperation({ summary: 'Purchases minus redemptions by period' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getNetFlows(@CurrentUser() user: any, @Query('months') months?: string) {
    return this.biService.getNetFlows(getEffectiveAdvisorId(user), parseInt(months || '6'));
  }

  @Get('sip-health')
  @ApiOperation({ summary: 'SIP health: active, paused, cancelled, mandate expiry' })
  getSipHealth(@CurrentUser() user: any) {
    return this.biService.getSipHealth(getEffectiveAdvisorId(user));
  }

  @Get('revenue-projection')
  @ApiOperation({ summary: '12-month forward trail revenue projection' })
  getRevenueProjection(@CurrentUser() user: any) {
    return this.biService.getRevenueProjection(getEffectiveAdvisorId(user));
  }

  @Get('client-concentration')
  @ApiOperation({ summary: 'Top N client concentration analysis (Pareto)' })
  @ApiQuery({ name: 'topN', required: false, type: Number })
  getClientConcentration(@CurrentUser() user: any, @Query('topN') topN?: string) {
    return this.biService.getClientConcentration(getEffectiveAdvisorId(user), parseInt(topN || '10'));
  }

  @Get('dormant-clients')
  @ApiOperation({ summary: 'Clients with no transaction in 12+ months' })
  getDormantClients(@CurrentUser() user: any) {
    return this.biService.getDormantClients(getEffectiveAdvisorId(user));
  }

  @Get('monthly-scorecard')
  @ApiOperation({ summary: 'Month-over-month scorecard: AUM, flows, SIP book, client count deltas' })
  getMonthlyScorecard(@CurrentUser() user: any) {
    return this.biService.getMonthlyScorecard(getEffectiveAdvisorId(user));
  }

  @Get('revenue-attribution')
  @ApiOperation({ summary: 'Trail income breakdown by AMC with estimated revenue' })
  getRevenueAttribution(@CurrentUser() user: any) {
    return this.biService.getRevenueAttribution(getEffectiveAdvisorId(user));
  }

  @Get('client-segmentation')
  @ApiOperation({ summary: 'Client tier segmentation: Diamond, Gold, Silver, Bronze' })
  getClientSegmentation(@CurrentUser() user: any) {
    return this.biService.getClientSegmentation(getEffectiveAdvisorId(user));
  }

  @Post('snapshot')
  @ApiOperation({ summary: 'Manually trigger AUM snapshot capture' })
  triggerSnapshot(@CurrentUser() user: any) {
    return this.biService.triggerSnapshot(getEffectiveAdvisorId(user));
  }
}
