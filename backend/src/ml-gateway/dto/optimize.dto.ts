import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FundInputDto {
  @ApiProperty({ description: 'Scheme code' })
  @IsNumber()
  scheme_code: number;

  @ApiProperty({ description: 'Scheme name' })
  @IsString()
  scheme_name: string;

  @ApiProperty({ description: 'Fund category' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: '1-year return' })
  @IsOptional()
  @IsNumber()
  return_1y?: number;

  @ApiPropertyOptional({ description: '3-year CAGR' })
  @IsOptional()
  @IsNumber()
  return_3y?: number;

  @ApiPropertyOptional({ description: '5-year CAGR' })
  @IsOptional()
  @IsNumber()
  return_5y?: number;

  @ApiPropertyOptional({ description: 'Volatility' })
  @IsOptional()
  @IsNumber()
  volatility?: number;

  @ApiPropertyOptional({ description: 'Sharpe ratio' })
  @IsOptional()
  @IsNumber()
  sharpe_ratio?: number;

  @ApiPropertyOptional({ description: 'Expense ratio' })
  @IsOptional()
  @IsNumber()
  expense_ratio?: number;

  @ApiPropertyOptional({ description: 'Portfolio weight (0-1)' })
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class OptimizationConstraintsDto {
  @ApiProperty({ description: 'Max equity allocation %', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  max_equity_pct: number = 100;

  @ApiProperty({ description: 'Min debt allocation %', example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  min_debt_pct: number = 0;

  @ApiProperty({ description: 'Max single fund weight %', example: 30 })
  @IsNumber()
  @Min(0)
  @Max(100)
  max_single_fund_pct: number = 30;

  @ApiProperty({ description: 'Minimum number of funds', example: 3 })
  @IsNumber()
  @Min(1)
  min_funds: number = 3;

  @ApiProperty({ description: 'Maximum number of funds', example: 10 })
  @IsNumber()
  @Min(1)
  max_funds: number = 10;

  @ApiPropertyOptional({ description: 'Target annual return' })
  @IsOptional()
  @IsNumber()
  target_return?: number;

  @ApiPropertyOptional({ description: 'Maximum portfolio volatility' })
  @IsOptional()
  @IsNumber()
  max_volatility?: number;
}

export class OptimizeRequestDto {
  @ApiPropertyOptional({ description: 'Request ID for tracking' })
  @IsOptional()
  @IsString()
  request_id?: string;

  @ApiProperty({ description: 'User persona ID', example: 'accelerated-builder' })
  @IsString()
  persona_id: string;

  @ApiProperty({ description: 'User profile data' })
  @IsObject()
  profile: Record<string, string>;

  @ApiProperty({ type: [FundInputDto], description: 'Available funds to choose from' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FundInputDto)
  available_funds: FundInputDto[];

  @ApiPropertyOptional({ type: OptimizationConstraintsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OptimizationConstraintsDto)
  constraints?: OptimizationConstraintsDto;
}

export class AllocationResultDto {
  @ApiProperty({ description: 'Scheme code' })
  scheme_code: number;

  @ApiProperty({ description: 'Scheme name' })
  scheme_name: string;

  @ApiProperty({ description: 'Fund category' })
  category: string;

  @ApiProperty({ description: 'Portfolio weight (0-1)' })
  weight: number;

  @ApiPropertyOptional({ description: 'Suggested SIP amount' })
  monthly_sip?: number;
}

export class PortfolioMetricsDto {
  @ApiProperty({ description: 'Expected annual return' })
  expected_return: number;

  @ApiProperty({ description: 'Expected annual volatility' })
  expected_volatility: number;

  @ApiProperty({ description: 'Portfolio Sharpe ratio' })
  sharpe_ratio: number;

  @ApiPropertyOptional({ description: 'Expected max drawdown' })
  max_drawdown?: number;

  @ApiPropertyOptional({ description: 'Projected portfolio value' })
  projected_value?: number;
}

export class OptimizeResponseDto {
  @ApiPropertyOptional({ description: 'Request ID' })
  request_id?: string;

  @ApiProperty({ type: [AllocationResultDto] })
  allocations: AllocationResultDto[];

  @ApiProperty({ type: PortfolioMetricsDto })
  expected_metrics: PortfolioMetricsDto;

  @ApiProperty({ description: 'Model version used' })
  model_version: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  latency_ms: number;
}
