import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum GoalAssetTypeEnum {
  MUTUAL_FUND = 'MUTUAL_FUND',
  FIXED_DEPOSIT = 'FIXED_DEPOSIT',
  INSURANCE_POLICY = 'INSURANCE_POLICY',
  REAL_ESTATE = 'REAL_ESTATE',
  GOLD = 'GOLD',
  EQUITY_STOCKS = 'EQUITY_STOCKS',
  PPF = 'PPF',
  NPS = 'NPS',
  OTHER = 'OTHER',
}

export class AddGoalAssetMappingDto {
  @ApiProperty({ enum: GoalAssetTypeEnum })
  @IsEnum(GoalAssetTypeEnum)
  assetType: GoalAssetTypeEnum

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  schemeCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  schemeName?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assetName?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assetIdentifier?: string

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  allocationPct: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currentValue?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string
}

export class UpdateGoalAssetMappingDto {
  @ApiPropertyOptional({ enum: GoalAssetTypeEnum })
  @IsEnum(GoalAssetTypeEnum)
  @IsOptional()
  assetType?: GoalAssetTypeEnum

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  schemeCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  schemeName?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assetName?: string

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  allocationPct?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currentValue?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string
}
