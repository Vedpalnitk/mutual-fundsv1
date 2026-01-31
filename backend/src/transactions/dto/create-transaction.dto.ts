import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  SIP = 'SIP',
  SWP = 'SWP',
  SWITCH = 'SWITCH',
  STP = 'STP',
}

export enum PaymentMode {
  NET_BANKING = 'Net Banking',
  UPI = 'UPI',
  NACH = 'NACH',
  CHEQUE = 'Cheque',
}

export class CreateTransactionDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty({ example: 'Axis Bluechip Fund - Direct Growth' })
  @IsString()
  fundName: string;

  @ApiProperty({ example: '120503' })
  @IsString()
  fundSchemeCode: string;

  @ApiProperty({ example: 'Large Cap Fund' })
  @IsString()
  fundCategory: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 52.5 })
  @IsNumber()
  @Min(0)
  nav: number;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  folioNumber: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ enum: PaymentMode })
  @IsEnum(PaymentMode)
  @IsOptional()
  paymentMode?: PaymentMode;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateTransactionStatusDto {
  @ApiProperty({ enum: ['COMPLETED', 'PENDING', 'PROCESSING', 'FAILED', 'CANCELLED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

// DTO for trade requests submitted by managed users (not FAs)
export class CreateTradeRequestDto {
  @ApiProperty({ example: 'Axis Bluechip Fund - Direct Growth' })
  @IsString()
  fundName: string;

  @ApiProperty({ example: '120503' })
  @IsString()
  fundSchemeCode: string;

  @ApiProperty({ example: 'Large Cap Fund' })
  @IsString()
  fundCategory: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}
