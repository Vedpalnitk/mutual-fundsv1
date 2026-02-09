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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PortfolioService } from './portfolio.service';
import { CreateHoldingDto, UpdateHoldingDto } from './dto/create-holding.dto';
import { HoldingResponseDto } from './dto/holding-response.dto';
import { PortfolioResponseDto, AssetAllocationDto } from './dto/portfolio-response.dto';

@ApiTags('portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/portfolio')
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get('clients/:clientId/holdings')
  @ApiOperation({ summary: 'Get all holdings for a client' })
  @ApiResponse({ status: 200, type: [HoldingResponseDto] })
  async getClientHoldings(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    return this.portfolioService.getClientHoldings(clientId, user.id);
  }

  @Get('clients/:clientId/summary')
  @ApiOperation({ summary: 'Get portfolio summary for a client' })
  @ApiResponse({ status: 200, type: PortfolioResponseDto })
  async getPortfolioSummary(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    return this.portfolioService.getPortfolioSummary(clientId, user.id);
  }

  @Get('clients/:clientId/allocation')
  @ApiOperation({ summary: 'Get computed asset allocation for a client' })
  @ApiResponse({ status: 200, type: [AssetAllocationDto] })
  async getAssetAllocation(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
  ) {
    return this.portfolioService.getAssetAllocation(clientId, user.id);
  }

  @Get('clients/:clientId/history')
  @ApiOperation({ summary: 'Get portfolio value history for a client' })
  async getPortfolioHistory(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Query('period') period: string = '1Y',
  ) {
    return this.portfolioService.getPortfolioHistory(clientId, user.id, period);
  }

  @Post('clients/:clientId/holdings')
  @ApiOperation({ summary: 'Add a new holding for a client' })
  @ApiResponse({ status: 201, type: HoldingResponseDto })
  async addHolding(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Body() dto: CreateHoldingDto,
  ) {
    return this.portfolioService.addHolding(clientId, user.id, dto);
  }

  @Put('holdings/:id')
  @ApiOperation({ summary: 'Update a holding' })
  @ApiResponse({ status: 200, type: HoldingResponseDto })
  async updateHolding(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateHoldingDto,
  ) {
    return this.portfolioService.updateHolding(id, user.id, dto);
  }

  @Delete('holdings/:id')
  @ApiOperation({ summary: 'Delete a holding' })
  @ApiResponse({ status: 200 })
  async deleteHolding(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.portfolioService.deleteHolding(id, user.id);
  }

  @Post('holdings/sync-nav')
  @ApiOperation({ summary: 'Batch sync NAV for multiple holdings' })
  async syncNavBatch(
    @CurrentUser() user: any,
    @Body() updates: { holdingId: string; currentNav: number }[],
  ) {
    return this.portfolioService.syncNavBatch(user.id, updates);
  }
}
