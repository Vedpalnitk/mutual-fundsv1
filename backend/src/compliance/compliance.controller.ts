import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { ComplianceService } from './compliance.service';
import { CreateComplianceDto, UpdateComplianceDto, ComplianceFilterDto } from './dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/compliance')
@Controller('api/v1/compliance')
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Get('records')
  @ApiOperation({ summary: 'List compliance records' })
  listRecords(@CurrentUser() user: AuthenticatedUser, @Query() filters: ComplianceFilterDto) {
    return this.complianceService.listRecords(getEffectiveAdvisorId(user), filters);
  }

  @Post('records')
  @ApiOperation({ summary: 'Create compliance record' })
  createRecord(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateComplianceDto) {
    return this.complianceService.createRecord(
      getEffectiveAdvisorId(user),
      user.id,
      dto,
    );
  }

  @Put('records/:id')
  @ApiOperation({ summary: 'Update compliance record' })
  updateRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateComplianceDto,
  ) {
    return this.complianceService.updateRecord(
      id,
      getEffectiveAdvisorId(user),
      user.id,
      dto,
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Compliance dashboard summary' })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.complianceService.getDashboard(getEffectiveAdvisorId(user));
  }

  @Get('risk-check/:clientId')
  @ApiOperation({ summary: 'Risk suitability check for a client' })
  riskCheck(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Query('schemeId') schemeId?: string,
  ) {
    return this.complianceService.riskCheck(getEffectiveAdvisorId(user), clientId, schemeId);
  }
}
