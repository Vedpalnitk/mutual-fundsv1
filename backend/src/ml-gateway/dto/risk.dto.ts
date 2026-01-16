import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FundInputDto } from './optimize.dto';

export class RiskRequestDto {
  @ApiPropertyOptional({ description: 'Request ID for tracking' })
  @IsOptional()
  @IsString()
  request_id?: string;

  @ApiProperty({ description: 'User profile data' })
  @IsObject()
  profile: Record<string, string>;

  @ApiPropertyOptional({ type: [FundInputDto], description: 'Current portfolio funds' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FundInputDto)
  current_portfolio?: FundInputDto[];

  @ApiPropertyOptional({ type: [FundInputDto], description: 'Proposed portfolio funds' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FundInputDto)
  proposed_portfolio?: FundInputDto[];
}

export class RiskFactorDto {
  @ApiProperty({ description: 'Risk factor name' })
  name: string;

  @ApiProperty({ description: 'Contribution to total risk (0-1)' })
  contribution: number;

  @ApiProperty({ description: 'Severity level' })
  severity: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  description?: string;
}

export class RiskResponseDto {
  @ApiPropertyOptional({ description: 'Request ID' })
  request_id?: string;

  @ApiProperty({ description: 'Overall risk level' })
  risk_level: string;

  @ApiProperty({ description: 'Risk score (0-100)' })
  risk_score: number;

  @ApiProperty({ type: [RiskFactorDto] })
  risk_factors: RiskFactorDto[];

  @ApiProperty({ type: [String], description: 'Risk mitigation recommendations' })
  recommendations: string[];

  @ApiProperty({ description: 'Persona alignment message' })
  persona_alignment: string;

  @ApiProperty({ description: 'Model version used' })
  model_version: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  latency_ms: number;
}
