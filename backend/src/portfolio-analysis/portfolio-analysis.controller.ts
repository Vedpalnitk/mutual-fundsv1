import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PortfolioAnalysisService } from './portfolio-analysis.service';
import {
  AnalyzePortfolioDto,
  AnalyzeHoldingDto,
  PortfolioAnalysisResponseDto,
  HoldingAnalysisDto,
  StatusConfigDto,
} from './dto/portfolio-analysis.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface'

@ApiTags('portfolio-analysis')
@Controller('api/v1/portfolio-analysis')
export class PortfolioAnalysisController {
  constructor(private readonly analysisService: PortfolioAnalysisService) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze portfolio health',
    description: `
Analyzes all holdings in a portfolio and classifies each fund by health status:

- **In-form** (score >= 75): Performing great - Continue investing
- **On-track** (score 50-74): Performing good - Hold / invest more
- **Off-track** (score 25-49): Underperforming - Don't invest further
- **Out-of-form** (score < 25): Poor performance - Consider exiting

The analysis considers:
- Returns vs category average (40% weight)
- Risk-adjusted returns (25% weight)
- Performance consistency (20% weight)
- Recent momentum (15% weight)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio analysis completed',
    type: PortfolioAnalysisResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Analysis service unavailable' })
  async analyzePortfolio(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AnalyzePortfolioDto,
  ): Promise<PortfolioAnalysisResponseDto> {
    return this.analysisService.analyzePortfolio(dto);
  }

  @Post('analyze-holding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze single holding',
    description: 'Analyze a single fund holding and return its health classification',
  })
  @ApiResponse({
    status: 200,
    description: 'Holding analysis completed',
    type: HoldingAnalysisDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzeHolding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AnalyzeHoldingDto,
  ): Promise<HoldingAnalysisDto> {
    return this.analysisService.analyzeHolding(dto);
  }

  @Get('status-config')
  @ApiOperation({
    summary: 'Get status configuration',
    description: 'Returns display configuration for all health status types (colors, icons, labels)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status configuration',
    type: [StatusConfigDto],
  })
  async getStatusConfig(): Promise<StatusConfigDto[]> {
    return this.analysisService.getStatusConfig();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the portfolio analysis service is available',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; service: string }> {
    return {
      status: 'healthy',
      service: 'portfolio-analysis-gateway',
    };
  }
}
