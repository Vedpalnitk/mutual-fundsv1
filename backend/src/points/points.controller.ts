import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PointsService } from './points.service';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('points')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/me/points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user points and tier information' })
  @ApiResponse({ status: 200, description: 'User points summary' })
  async getPoints(@CurrentUser() user: AuthenticatedUser) {
    return this.pointsService.getUserPoints(user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get points transaction history' })
  @ApiResponse({ status: 200, description: 'Points transaction history' })
  async getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 20;
    const numOffset = offset ? parseInt(offset, 10) : 0;
    return this.pointsService.getPointsTransactions(user.id, numLimit, numOffset);
  }
}
