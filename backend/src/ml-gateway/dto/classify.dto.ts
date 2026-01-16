import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Liquidity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum RiskTolerance {
  Conservative = 'Conservative',
  Moderate = 'Moderate',
  Aggressive = 'Aggressive',
}

export enum Knowledge {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export enum VolatilityComfort {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export class ProfileDto {
  @ApiProperty({ description: 'User age', example: 29 })
  @IsNumber()
  @Min(18)
  @Max(100)
  age: number;

  @ApiPropertyOptional({ description: 'Investment goal', example: 'Retirement' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ description: 'Target amount in INR', example: 8500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  target_amount?: number;

  @ApiPropertyOptional({ description: 'Target year', example: 2036 })
  @IsOptional()
  @IsNumber()
  target_year?: number;

  @ApiPropertyOptional({ description: 'Monthly SIP amount', example: 32000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_sip?: number;

  @ApiPropertyOptional({ description: 'Lump sum investment', example: 200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lump_sum?: number;

  @ApiProperty({ enum: Liquidity, description: 'Liquidity needs', example: 'Medium' })
  @IsEnum(Liquidity)
  liquidity: Liquidity = Liquidity.Medium;

  @ApiProperty({ enum: RiskTolerance, description: 'Risk tolerance level', example: 'Aggressive' })
  @IsEnum(RiskTolerance)
  risk_tolerance: RiskTolerance = RiskTolerance.Moderate;

  @ApiProperty({ enum: Knowledge, description: 'Investment knowledge', example: 'Intermediate' })
  @IsEnum(Knowledge)
  knowledge: Knowledge = Knowledge.Intermediate;

  @ApiProperty({ enum: VolatilityComfort, description: 'Volatility comfort level', example: 'High' })
  @IsEnum(VolatilityComfort)
  volatility: VolatilityComfort = VolatilityComfort.Medium;

  @ApiProperty({ description: 'Investment horizon in years', example: 12 })
  @IsNumber()
  @Min(1)
  @Max(40)
  horizon_years: number;
}

export class ClassifyRequestDto {
  @ApiPropertyOptional({ description: 'Request ID for tracking' })
  @IsOptional()
  @IsString()
  request_id?: string;

  @ApiProperty({ type: ProfileDto })
  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;

  @ApiPropertyOptional({ description: 'Specific model version to use' })
  @IsOptional()
  @IsString()
  model_version?: string;
}

export class PersonaDto {
  @ApiProperty({ description: 'Persona ID' })
  id: string;

  @ApiProperty({ description: 'Persona name' })
  name: string;

  @ApiProperty({ description: 'Persona slug' })
  slug: string;

  @ApiProperty({ description: 'Risk band' })
  risk_band: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;
}

export class ClassifyResponseDto {
  @ApiPropertyOptional({ description: 'Request ID' })
  request_id?: string;

  @ApiProperty({ type: PersonaDto })
  persona: PersonaDto;

  @ApiProperty({ description: 'Classification confidence (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Probability for each persona' })
  probabilities: Record<string, number>;

  @ApiProperty({ description: 'Model version used' })
  model_version: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  latency_ms: number;
}

// ============= Blended Classification DTOs =============

export class AllocationBreakdownDto {
  @ApiProperty({ description: 'Equity allocation (0-1)', example: 0.40 })
  equity: number;

  @ApiProperty({ description: 'Debt allocation (0-1)', example: 0.30 })
  debt: number;

  @ApiProperty({ description: 'Hybrid allocation (0-1)', example: 0.15 })
  hybrid: number;

  @ApiProperty({ description: 'Gold allocation (0-1)', example: 0.05 })
  gold: number;

  @ApiProperty({ description: 'International allocation (0-1)', example: 0.05 })
  international: number;

  @ApiProperty({ description: 'Liquid/Cash allocation (0-1)', example: 0.05 })
  liquid: number;
}

export class PersonaDistributionItemDto {
  @ApiProperty({ type: PersonaDto, description: 'Persona details' })
  persona: PersonaDto;

  @ApiProperty({ description: 'Weight in distribution (0-1)', example: 0.45 })
  weight: number;

  @ApiProperty({ type: AllocationBreakdownDto, description: 'This persona allocation strategy' })
  allocation: AllocationBreakdownDto;
}

export class BlendedClassifyResponseDto {
  @ApiPropertyOptional({ description: 'Request ID' })
  request_id?: string;

  @ApiProperty({ type: PersonaDto, description: 'Highest-weighted persona' })
  primary_persona: PersonaDto;

  @ApiProperty({
    type: [PersonaDistributionItemDto],
    description: 'Full distribution across all personas, sorted by weight descending',
  })
  distribution: PersonaDistributionItemDto[];

  @ApiProperty({
    type: AllocationBreakdownDto,
    description: 'Weighted blend of all persona allocations',
  })
  blended_allocation: AllocationBreakdownDto;

  @ApiProperty({ description: 'Primary persona confidence (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Model version used' })
  model_version: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  latency_ms: number;
}
