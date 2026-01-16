import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAllocationStrategyDto {
  @ApiProperty({ example: 'uuid-of-persona' })
  @IsString()
  personaId: string;

  @ApiProperty({ example: 'Conservative Allocation v1' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Focus on debt with limited equity exposure' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  version?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAllocationStrategyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateAllocationComponentDto {
  @ApiProperty({ example: 'Equity Funds' })
  @IsString()
  label: string;

  @ApiProperty({ example: 30, description: 'Percentage allocation (0-100)' })
  @IsNumber()
  allocationPercent: number;

  @ApiPropertyOptional({ example: 'Large cap + flexi cap blend' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: 'JSON filter criteria for fund selection' })
  @IsOptional()
  fundCategoryFilter?: any;

  @ApiPropertyOptional({ example: 'High', enum: ['Low', 'Moderate', 'High', 'Very High'] })
  @IsString()
  @IsOptional()
  riskLevel?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class CreateRiskConstraintDto {
  @ApiProperty({ example: 'max_equity', enum: ['max_equity', 'min_debt', 'max_single_fund', 'min_funds', 'max_funds'] })
  @IsString()
  constraintType: string;

  @ApiProperty({ example: 70, description: 'Constraint value (percentage or count)' })
  @IsNumber()
  constraintValue: number;

  @ApiPropertyOptional({ example: 'Maximum equity exposure limit' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AllocationStrategyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  personaId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  version: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  components?: AllocationComponentResponseDto[];

  @ApiPropertyOptional()
  constraints?: RiskConstraintResponseDto[];
}

export class AllocationComponentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  allocationPercent: number;

  @ApiPropertyOptional()
  note?: string;

  @ApiPropertyOptional()
  fundCategoryFilter?: any;

  @ApiPropertyOptional()
  riskLevel?: string;

  @ApiProperty()
  displayOrder: number;
}

export class RiskConstraintResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  constraintType: string;

  @ApiProperty()
  constraintValue: number;

  @ApiPropertyOptional()
  description?: string;
}
