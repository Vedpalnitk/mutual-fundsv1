import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePersonaDto {
  @ApiProperty({ example: 'Capital Guardian' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'capital-guardian' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Conservative investor focused on capital preservation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Capital Preservation', enum: ['Capital Preservation', 'Balanced Growth', 'Accelerated Growth'] })
  @IsString()
  riskBand: string;

  @ApiPropertyOptional({ example: 'shield-outline' })
  @IsString()
  @IsOptional()
  iconName?: string;

  @ApiPropertyOptional({ example: '#4CAF50' })
  @IsString()
  @IsOptional()
  colorPrimary?: string;

  @ApiPropertyOptional({ example: '#81C784' })
  @IsString()
  @IsOptional()
  colorSecondary?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePersonaDto {
  @ApiPropertyOptional({ example: 'Capital Guardian' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Conservative investor focused on capital preservation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Capital Preservation' })
  @IsString()
  @IsOptional()
  riskBand?: string;

  @ApiPropertyOptional({ example: 'shield-outline' })
  @IsString()
  @IsOptional()
  iconName?: string;

  @ApiPropertyOptional({ example: '#4CAF50' })
  @IsString()
  @IsOptional()
  colorPrimary?: string;

  @ApiPropertyOptional({ example: '#81C784' })
  @IsString()
  @IsOptional()
  colorSecondary?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreatePersonaRuleDto {
  @ApiProperty({ example: 'horizon', enum: ['horizon', 'liquidity', 'risk_tolerance', 'volatility', 'knowledge'] })
  @IsString()
  ruleType: string;

  @ApiProperty({ example: 'lte', enum: ['eq', 'lte', 'gte', 'lt', 'gt', 'in'] })
  @IsString()
  operator: string;

  @ApiProperty({ example: 5, description: 'Value or array of values for comparison' })
  value: any;

  @ApiPropertyOptional({ example: 10, description: 'Higher priority rules are evaluated first' })
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreatePersonaInsightDto {
  @ApiProperty({ example: 'Focus on capital preservation with minimal risk exposure' })
  @IsString()
  insightText: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class PersonaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  riskBand: string;

  @ApiPropertyOptional()
  iconName?: string;

  @ApiPropertyOptional()
  colorPrimary?: string;

  @ApiPropertyOptional()
  colorSecondary?: string;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => [PersonaRuleResponseDto] })
  rules?: PersonaRuleResponseDto[];

  @ApiPropertyOptional({ type: () => [PersonaInsightResponseDto] })
  insights?: PersonaInsightResponseDto[];
}

export class PersonaRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ruleType: string;

  @ApiProperty()
  operator: string;

  @ApiProperty()
  value: any;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class PersonaInsightResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  insightText: string;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  createdAt: Date;
}

// Bulk Operations DTOs
export class BulkCreatePersonaDto {
  @ApiProperty({ type: [CreatePersonaDto], description: 'Array of personas to create' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePersonaDto)
  personas: CreatePersonaDto[];
}

export class BulkCreateResultDto {
  @ApiProperty({ description: 'Successfully created personas' })
  created: PersonaResponseDto[];

  @ApiProperty({ description: 'Personas that failed to create' })
  failed: Array<{ persona: CreatePersonaDto; error: string }>;
}

// Classification Result DTOs
export class ClassifyProfileDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @IsOptional()
  horizonYears?: number;

  @ApiProperty({ example: 'Low' })
  @IsString()
  @IsOptional()
  liquidity?: string;

  @ApiProperty({ example: 'Conservative' })
  @IsString()
  @IsOptional()
  riskTolerance?: string;

  @ApiProperty({ example: 'Low' })
  @IsString()
  @IsOptional()
  volatility?: string;

  @ApiProperty({ example: 'Beginner' })
  @IsString()
  @IsOptional()
  knowledge?: string;
}

export class SaveClassificationResultDto {
  @ApiProperty({ description: 'Profile data to classify' })
  @ValidateNested()
  @Type(() => ClassifyProfileDto)
  profile: ClassifyProfileDto;

  @ApiPropertyOptional({ description: 'User name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'User email (for lookup/create)' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'User age' })
  @IsInt()
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ description: 'Target amount for investment goal' })
  @IsNumber()
  @IsOptional()
  targetAmount?: number;

  @ApiPropertyOptional({ description: 'Monthly SIP amount' })
  @IsNumber()
  @IsOptional()
  monthlySip?: number;
}

export class ClassificationResultResponseDto {
  @ApiProperty({ description: 'Assigned persona' })
  persona: PersonaResponseDto;

  @ApiProperty({ description: 'Classification confidence score (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Method used for classification' })
  method: string;

  @ApiPropertyOptional({ description: 'Profile ID if saved' })
  profileId?: string;

  @ApiPropertyOptional({ description: 'Inference log ID' })
  inferenceLogId?: string;
}
