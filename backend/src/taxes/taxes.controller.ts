import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TaxesService } from './taxes.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('taxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/me/taxes')
export class TaxesController {
  constructor(private taxesService: TaxesService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get tax summary for financial year' })
  @ApiResponse({ status: 200, description: 'Tax summary with LTCG/STCG details' })
  @ApiQuery({ name: 'fy', required: false, description: 'Financial year (e.g., 2024-25)' })
  async getTaxSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('fy') financialYear?: string,
  ) {
    return this.taxesService.getTaxSummary(user.id, financialYear);
  }

  @Get('capital-gains')
  @ApiOperation({ summary: 'Get capital gains records' })
  @ApiResponse({ status: 200, description: 'Capital gains transaction history' })
  @ApiQuery({ name: 'fy', required: false, description: 'Financial year (e.g., 2024-25)' })
  async getCapitalGains(
    @CurrentUser() user: AuthenticatedUser,
    @Query('fy') financialYear?: string,
  ) {
    return this.taxesService.getCapitalGains(user.id, financialYear);
  }
}
