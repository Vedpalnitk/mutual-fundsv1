import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffPageGuard, RequiredPage } from '../common/guards/staff-page.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { getEffectiveAdvisorId } from '../common/utils/effective-advisor';
import { PortfolioService } from './portfolio.service';
import { CreateHoldingDto, UpdateHoldingDto } from './dto/create-holding.dto';
import { HoldingResponseDto } from './dto/holding-response.dto';
import { PortfolioResponseDto, AssetAllocationDto } from './dto/portfolio-response.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffPageGuard)
@RequiredPage('/advisor/clients')
@Controller('api/v1/portfolio')
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get('clients/:clientId/holdings')
  @ApiOperation({ summary: 'Get all holdings for a client' })
  @ApiResponse({ status: 200, type: [HoldingResponseDto] })
  async getClientHoldings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
  ) {
    return this.portfolioService.getClientHoldings(clientId, getEffectiveAdvisorId(user));
  }

  @Get('clients/:clientId/summary')
  @ApiOperation({ summary: 'Get portfolio summary for a client' })
  @ApiResponse({ status: 200, type: PortfolioResponseDto })
  async getPortfolioSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
  ) {
    return this.portfolioService.getPortfolioSummary(clientId, getEffectiveAdvisorId(user));
  }

  @Get('clients/:clientId/allocation')
  @ApiOperation({ summary: 'Get computed asset allocation for a client' })
  @ApiResponse({ status: 200, type: [AssetAllocationDto] })
  async getAssetAllocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
  ) {
    return this.portfolioService.getAssetAllocation(clientId, getEffectiveAdvisorId(user));
  }

  @Get('clients/:clientId/history')
  @ApiOperation({ summary: 'Get portfolio value history for a client' })
  async getPortfolioHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Query('period') period: string = '1Y',
  ) {
    return this.portfolioService.getPortfolioHistory(clientId, getEffectiveAdvisorId(user), period);
  }

  @Post('clients/:clientId/holdings')
  @ApiOperation({ summary: 'Add a new holding for a client' })
  @ApiResponse({ status: 201, type: HoldingResponseDto })
  async addHolding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId') clientId: string,
    @Body() dto: CreateHoldingDto,
  ) {
    return this.portfolioService.addHolding(clientId, getEffectiveAdvisorId(user), dto);
  }

  @Put('holdings/:id')
  @ApiOperation({ summary: 'Update a holding' })
  @ApiResponse({ status: 200, type: HoldingResponseDto })
  async updateHolding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateHoldingDto,
  ) {
    return this.portfolioService.updateHolding(id, getEffectiveAdvisorId(user), dto);
  }

  @Delete('holdings/:id')
  @ApiOperation({ summary: 'Delete a holding' })
  @ApiResponse({ status: 200 })
  async deleteHolding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.portfolioService.deleteHolding(id, getEffectiveAdvisorId(user));
  }

  @Post('holdings/sync-nav')
  @ApiOperation({ summary: 'Batch sync NAV for multiple holdings' })
  async syncNavBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updates: { holdingId: string; currentNav: number }[],
  ) {
    return this.portfolioService.syncNavBatch(getEffectiveAdvisorId(user), updates);
  }
}
