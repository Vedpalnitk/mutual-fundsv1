import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor'
import { FaTaxService } from './fa-tax.service'
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('fa-taxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/clients')
@Controller('api/v1/clients/:clientId/taxes')
export class FaTaxController {
  constructor(private faTaxService: FaTaxService) {}

  @Get('capital-gains')
  @ApiOperation({ summary: 'Get capital gains for a client with FIFO matching' })
  @ApiResponse({ status: 200, description: 'Capital gains computed via FIFO' })
  @ApiQuery({ name: 'fy', required: false, description: 'Financial year (e.g., 2024-25)' })
  async getCapitalGains(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Query('fy') fy?: string,
  ) {
    return this.faTaxService.getCapitalGains(clientId, getEffectiveAdvisorId(user), fy)
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get tax summary for a client' })
  @ApiResponse({ status: 200, description: 'Aggregated tax totals' })
  @ApiQuery({ name: 'fy', required: false, description: 'Financial year (e.g., 2024-25)' })
  async getTaxSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Query('fy') fy?: string,
  ) {
    return this.faTaxService.getTaxSummary(clientId, getEffectiveAdvisorId(user), fy)
  }

  @Get('capital-gains/csv')
  @ApiOperation({ summary: 'Download capital gains as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiQuery({ name: 'fy', required: false, description: 'Financial year (e.g., 2024-25)' })
  async downloadCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Query('fy') fy: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.faTaxService.downloadCsv(clientId, getEffectiveAdvisorId(user), fy)
    const financialYear = fy || 'current'
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=capital-gains-${financialYear}.csv`)
    res.send(csv)
  }
}
