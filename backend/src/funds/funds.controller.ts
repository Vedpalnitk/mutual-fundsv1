import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { MfApiService, FundWithMetrics, MFScheme } from './mfapi.service';

@ApiTags('Funds (Live Data)')
@Controller('api/v1/funds/live')
export class FundsController {
  constructor(private readonly mfApiService: MfApiService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search mutual funds by name (Live from MFAPI.in)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 characters)' })
  @ApiQuery({ name: 'direct_only', required: false, type: Boolean, description: 'Filter for Direct plans only' })
  @ApiQuery({ name: 'growth_only', required: false, type: Boolean, description: 'Filter for Growth plans only' })
  async searchFunds(
    @Query('q') query: string,
    @Query('direct_only') directOnly?: string,
    @Query('growth_only') growthOnly?: string,
  ): Promise<MFScheme[]> {
    let results = await this.mfApiService.searchFunds(query);

    // Apply filters
    if (directOnly === 'true') {
      results = results.filter(fund => fund.schemeName.includes('Direct'));
    }
    if (growthOnly === 'true') {
      results = results.filter(fund => fund.schemeName.includes('Growth'));
    }

    return results.slice(0, 50); // Limit results
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Get popular mutual funds with metrics (Live from MFAPI.in)' })
  async getPopularFunds(): Promise<FundWithMetrics[]> {
    return this.mfApiService.getPopularFunds();
  }

  @Public()
  @Get('category/:category')
  @ApiOperation({ summary: 'Search funds by category (Live from MFAPI.in)' })
  @ApiParam({ name: 'category', description: 'Fund category (e.g., "Large Cap", "Mid Cap", "Small Cap")' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 10)' })
  async searchByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: string,
  ): Promise<MFScheme[]> {
    return this.mfApiService.searchByCategory(category, limit ? parseInt(limit) : 10);
  }

  @Public()
  @Get(':schemeCode')
  @ApiOperation({ summary: 'Get fund details with metrics (Live from MFAPI.in)' })
  @ApiParam({ name: 'schemeCode', description: 'AMFI Scheme Code' })
  async getFundDetails(
    @Param('schemeCode', ParseIntPipe) schemeCode: number,
  ): Promise<FundWithMetrics> {
    return this.mfApiService.getFundWithMetrics(schemeCode);
  }

  @Public()
  @Get('batch/details')
  @ApiOperation({ summary: 'Get multiple funds by scheme codes (Live from MFAPI.in)' })
  @ApiQuery({ name: 'codes', required: true, description: 'Comma-separated scheme codes' })
  async getBatchDetails(
    @Query('codes') codes: string,
  ): Promise<FundWithMetrics[]> {
    const schemeCodes = codes.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c));

    if (schemeCodes.length === 0) {
      return [];
    }

    if (schemeCodes.length > 20) {
      throw new Error('Maximum 20 funds per request');
    }

    return this.mfApiService.getMultipleFunds(schemeCodes);
  }
}
