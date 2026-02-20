import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RebalanceActionItemDto {
  @ApiProperty()
  @IsString()
  schemeCode: string

  @ApiProperty({ enum: ['SELL', 'BUY', 'ADD_NEW'] })
  @IsEnum(['SELL', 'BUY', 'ADD_NEW'])
  action: 'SELL' | 'BUY' | 'ADD_NEW'

  @ApiProperty()
  @IsNumber()
  @Min(0)
  transactionAmount: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toSchemeCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiProperty()
  @IsString()
  schemeName: string

  @ApiProperty()
  @IsString()
  assetClass: string
}

export class ExecuteRebalanceDto {
  @ApiProperty()
  @IsString()
  clientId: string

  @ApiProperty({ type: [RebalanceActionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RebalanceActionItemDto)
  actions: RebalanceActionItemDto[]

  @ApiProperty({ enum: ['BSE', 'NSE'] })
  @IsEnum(['BSE', 'NSE'])
  exchange: 'BSE' | 'NSE'

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  analysisId?: string
}
