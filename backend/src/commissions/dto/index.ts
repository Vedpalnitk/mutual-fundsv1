import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============= Rate Master DTOs =============

export class CreateRateDto {
  @ApiProperty()
  @IsString()
  amcId: string;

  @ApiProperty()
  @IsString()
  schemeCategory: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  trailRatePercent: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  upfrontRatePercent?: number;

  @ApiProperty()
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

export class UpdateRateDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  trailRatePercent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  upfrontRatePercent?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

// ============= Commission Record DTOs =============

export class CommissionFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  period?: string; // "2026-01"

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  amcId?: string;

  @ApiPropertyOptional()
  @IsEnum(['EXPECTED', 'RECEIVED', 'DISCREPANCY', 'RECONCILED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  arnNumber?: string;
}

export class CalculateExpectedDto {
  @ApiProperty({ description: 'Period like 2026-01' })
  @IsString()
  period: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  arnNumber?: string;
}

export class ReconcileDto {
  @ApiProperty({ description: 'Period like 2026-01' })
  @IsString()
  period: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  arnNumber?: string;
}

export class ReconcileAndComputeDto {
  @ApiProperty({ description: 'Period like 2026-01' })
  @IsString()
  period: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  arnNumber?: string;
}
