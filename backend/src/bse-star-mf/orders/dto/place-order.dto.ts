import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum BseBuySell {
  PURCHASE = 'P',
  REDEMPTION = 'R',
}

export enum BseBuySellType {
  FRESH = 'FRESH',
  ADDITIONAL = 'ADDITIONAL',
}

export class PlaceOrderDto {
  @ApiProperty() @IsString() clientId: string
  @ApiProperty() @IsString() schemeCode: string
  @ApiProperty({ enum: BseBuySell }) @IsEnum(BseBuySell) buySell: BseBuySell
  @ApiPropertyOptional({ enum: BseBuySellType }) @IsEnum(BseBuySellType) @IsOptional() buySellType?: BseBuySellType
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() amount?: number
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() units?: number
  @ApiPropertyOptional() @IsString() @IsOptional() folioNumber?: string
  @ApiPropertyOptional() @IsString() @IsOptional() dpTxnMode?: string
  @ApiPropertyOptional() @IsString() @IsOptional() transactionId?: string // Link to FATransaction
  @ApiPropertyOptional() @IsString() @IsOptional() remarks?: string
  @ApiPropertyOptional() @IsString() @IsOptional() euin?: string
  @ApiPropertyOptional() @IsString() @IsOptional() arnNumber?: string
}

export class PlaceSwitchDto {
  @ApiProperty() @IsString() clientId: string
  @ApiProperty() @IsString() fromSchemeCode: string
  @ApiProperty() @IsString() toSchemeCode: string
  @ApiPropertyOptional({ enum: BseBuySellType }) @IsEnum(BseBuySellType) @IsOptional() buySellType?: BseBuySellType
  @ApiPropertyOptional() @IsNumber() @IsOptional() amount?: number
  @ApiPropertyOptional() @IsNumber() @IsOptional() units?: number
  @ApiPropertyOptional() @IsString() @IsOptional() folioNumber?: string
  @ApiPropertyOptional() @IsString() @IsOptional() transactionId?: string
  @ApiPropertyOptional() @IsString() @IsOptional() euin?: string
  @ApiPropertyOptional() @IsString() @IsOptional() arnNumber?: string
}

export class PlaceSpreadDto {
  @ApiProperty() @IsString() clientId: string
  @ApiProperty() @IsString() schemeCode: string
  @ApiProperty() @IsNumber() @Min(0) amount: number
  @ApiPropertyOptional() @IsString() @IsOptional() folioNumber?: string
  @ApiPropertyOptional() @IsString() @IsOptional() transactionId?: string
  @ApiPropertyOptional() @IsString() @IsOptional() euin?: string
  @ApiPropertyOptional() @IsString() @IsOptional() arnNumber?: string
}
