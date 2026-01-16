import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export class RecommendRequestDto {
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

  @ApiProperty({ description: 'Number of recommendations to return', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(20)
  top_n: number = 5;

  @ApiPropertyOptional({
    description: 'Filter by fund categories',
    example: ['Flexi Cap', 'Mid Cap'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category_filters?: string[];

  @ApiPropertyOptional({
    description: 'Fund scheme codes to exclude',
    example: [120503],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  exclude_funds?: number[];
}

export class FundRecommendationDto {
  @ApiProperty({ description: 'Scheme code' })
  scheme_code: number;

  @ApiProperty({ description: 'Scheme name' })
  scheme_name: string;

  @ApiPropertyOptional({ description: 'Fund house' })
  fund_house?: string;

  @ApiProperty({ description: 'Fund category' })
  category: string;

  @ApiProperty({ description: 'Recommendation score (0-1)' })
  score: number;

  @ApiProperty({ description: 'Suggested allocation weight (0-1)' })
  suggested_allocation: number;

  @ApiProperty({ description: 'Recommendation reasoning' })
  reasoning: string;

  @ApiPropertyOptional({ description: 'Fund metrics' })
  metrics?: Record<string, number>;
}

export class RecommendResponseDto {
  @ApiPropertyOptional({ description: 'Request ID' })
  request_id?: string;

  @ApiProperty({ type: [FundRecommendationDto] })
  recommendations: FundRecommendationDto[];

  @ApiProperty({ description: 'Persona alignment message' })
  persona_alignment: string;

  @ApiProperty({ description: 'Model version used' })
  model_version: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  latency_ms: number;
}

// ============= Blended Recommendation DTOs =============

export class AllocationTargetDto {
  @ApiProperty({ description: 'Target equity allocation (0-1)', example: 0.4 })
  @IsNumber()
  @Min(0)
  @Max(1)
  equity: number = 0;

  @ApiProperty({ description: 'Target debt allocation (0-1)', example: 0.3 })
  @IsNumber()
  @Min(0)
  @Max(1)
  debt: number = 0;

  @ApiProperty({ description: 'Target hybrid allocation (0-1)', example: 0.15 })
  @IsNumber()
  @Min(0)
  @Max(1)
  hybrid: number = 0;

  @ApiProperty({ description: 'Target gold allocation (0-1)', example: 0.05 })
  @IsNumber()
  @Min(0)
  @Max(1)
  gold: number = 0;

  @ApiProperty({ description: 'Target international allocation (0-1)', example: 0.05 })
  @IsNumber()
  @Min(0)
  @Max(1)
  international: number = 0;

  @ApiProperty({ description: 'Target liquid allocation (0-1)', example: 0.05 })
  @IsNumber()
  @Min(0)
  @Max(1)
  liquid: number = 0;
}

export class BlendedRecommendRequestDto {
  @ApiPropertyOptional({ description: 'Request ID for tracking' })
  @IsOptional()
  @IsString()
  request_id?: string;

  @ApiProperty({ description: 'Blended allocation targets from persona classification', type: AllocationTargetDto })
  @IsObject()
  blended_allocation: AllocationTargetDto;

  @ApiPropertyOptional({ description: 'Persona distribution weights' })
  @IsOptional()
  @IsObject()
  persona_distribution?: Record<string, number>;

  @ApiProperty({ description: 'User profile data' })
  @IsObject()
  profile: Record<string, any>;

  @ApiProperty({ description: 'Number of recommendations to return', example: 6 })
  @IsNumber()
  @Min(1)
  @Max(20)
  top_n: number = 6;

  @ApiPropertyOptional({ description: 'Total investment amount for allocation calculation', example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  investment_amount?: number;

  @ApiPropertyOptional({
    description: 'Filter by fund categories',
    example: ['Flexi Cap', 'Mid Cap', 'Corporate Bond'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category_filters?: string[];

  @ApiPropertyOptional({
    description: 'Fund scheme codes to exclude',
    example: [120503],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  exclude_funds?: number[];
}

export class BlendedFundRecommendationDto {
  @ApiProperty({ description: 'Scheme code' })
  scheme_code: number;

  @ApiProperty({ description: 'Scheme name' })
  scheme_name: string;

  @ApiPropertyOptional({ description: 'Fund house' })
  fund_house?: string;

  @ApiProperty({ description: 'Fund category' })
  category: string;

  @ApiPropertyOptional({ description: 'Asset class (equity, debt, hybrid, gold, international, liquid)' })
  asset_class?: string;

  @ApiProperty({ description: 'Recommendation score (0-1)' })
  score: number;

  @ApiProperty({ description: 'Suggested allocation weight (0-1)' })
  suggested_allocation: number;

  @ApiPropertyOptional({ description: 'Suggested investment amount' })
  suggested_amount?: number;

  @ApiProperty({ description: 'Recommendation reasoning' })
  reasoning: string;

  @ApiPropertyOptional({ description: 'Fund metrics' })
  metrics?: Record<string, number>;
}

export class AssetClassBreakdownDto {
  @ApiProperty({ description: 'Asset class name' })
  asset_class: string;

  @ApiProperty({ description: 'Target allocation from blended profile (0-1)' })
  target_allocation: number;

  @ApiProperty({ description: 'Actual allocation in recommendations (0-1)' })
  actual_allocation: number;

  @ApiProperty({ description: 'Number of funds in this asset class' })
  fund_count: number;

  @ApiPropertyOptional({ description: 'Total amount allocated to this asset class' })
  total_amount?: number;
}

export class BlendedRecommendResponseDto {
  @ApiPropertyOptional({ description: 'Request ID' })
  request_id?: string;

  @ApiProperty({ type: [BlendedFundRecommendationDto] })
  recommendations: BlendedFundRecommendationDto[];

  @ApiProperty({ type: [AssetClassBreakdownDto], description: 'Distribution across asset classes' })
  asset_class_breakdown: AssetClassBreakdownDto[];

  @ApiProperty({ type: AllocationTargetDto, description: 'Original target allocation' })
  target_allocation: AllocationTargetDto;

  @ApiProperty({ description: 'How well recommendations match target allocation (0-1)' })
  alignment_score: number;

  @ApiProperty({ description: 'Human-readable alignment summary' })
  alignment_message: string;

  @ApiProperty({ description: 'Model version used' })
  model_version: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  latency_ms: number;
}
