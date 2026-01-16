import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { MlGatewayService } from './ml-gateway.service';
import {
  ClassifyRequestDto,
  ClassifyResponseDto,
  BlendedClassifyResponseDto,
  RecommendRequestDto,
  RecommendResponseDto,
  BlendedRecommendRequestDto,
  BlendedRecommendResponseDto,
  OptimizeRequestDto,
  OptimizeResponseDto,
  RiskRequestDto,
  RiskResponseDto,
} from './dto';

@ApiTags('ML Gateway')
@Controller('api/v1')
export class MlGatewayController {
  constructor(private readonly mlGatewayService: MlGatewayService) {}

  @Public()
  @Post('classify')
  @ApiOperation({ summary: 'Classify user profile into investment persona' })
  async classifyProfile(
    @Body() request: ClassifyRequestDto,
  ): Promise<ClassifyResponseDto> {
    return this.mlGatewayService.classifyProfile(request);
  }

  @Public()
  @Post('classify/blended')
  @ApiOperation({
    summary: 'Classify user profile with blended persona distribution',
    description:
      'Returns weighted distribution across ALL personas and a blended asset allocation. ' +
      'This allows for nuanced investment recommendations that consider the user\'s mixed needs.',
  })
  async classifyProfileBlended(
    @Body() request: ClassifyRequestDto,
  ): Promise<BlendedClassifyResponseDto> {
    return this.mlGatewayService.classifyProfileBlended(request);
  }

  @Public()
  @Post('recommendations')
  @ApiOperation({ summary: 'Get fund recommendations based on persona' })
  async getRecommendations(
    @Body() request: RecommendRequestDto,
  ): Promise<RecommendResponseDto> {
    return this.mlGatewayService.getRecommendations(request);
  }

  @Public()
  @Post('recommendations/blended')
  @ApiOperation({
    summary: 'Get fund recommendations based on blended allocation targets',
    description:
      'Accepts blended allocation targets (from blended persona classification) ' +
      'and returns fund recommendations that match the target asset allocation percentages. ' +
      'Includes asset class breakdown and alignment scoring.',
  })
  async getRecommendationsBlended(
    @Body() request: BlendedRecommendRequestDto,
  ): Promise<BlendedRecommendResponseDto> {
    return this.mlGatewayService.getRecommendationsBlended(request);
  }

  @Public()
  @Post('recommendations/portfolio')
  @ApiOperation({ summary: 'Get optimized portfolio allocation' })
  async optimizePortfolio(
    @Body() request: OptimizeRequestDto,
  ): Promise<OptimizeResponseDto> {
    return this.mlGatewayService.optimizePortfolio(request);
  }

  @Public()
  @Post('risk')
  @ApiOperation({ summary: 'Assess portfolio risk' })
  async assessRisk(@Body() request: RiskRequestDto): Promise<RiskResponseDto> {
    return this.mlGatewayService.assessRisk(request);
  }

  @Public()
  @Get('ml/health')
  @ApiOperation({ summary: 'Check ML service health' })
  async mlHealth() {
    return this.mlGatewayService.healthCheck();
  }

  @Public()
  @Get('funds')
  @ApiOperation({ summary: 'Get fund universe available for recommendations' })
  @ApiQuery({ name: 'asset_class', required: false, description: 'Filter by asset class (equity, debt, hybrid, gold, international, liquid)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by fund category' })
  async getFunds(
    @Query('asset_class') assetClass?: string,
    @Query('category') category?: string,
  ) {
    return this.mlGatewayService.getFunds(assetClass, category);
  }

  @Public()
  @Get('funds/stats')
  @ApiOperation({ summary: 'Get fund universe statistics' })
  async getFundsStats() {
    return this.mlGatewayService.getFundsStats();
  }
}
