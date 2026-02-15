import {
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordPremiumPaymentDto {
  @ApiProperty({ example: 12000, description: 'Amount paid in INR' })
  @IsNumber()
  amountPaid: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ example: 'BANK_TRANSFER', description: 'BANK_TRANSFER | CHEQUE | UPI | AUTO_DEBIT' })
  @IsOptional()
  @IsString()
  paymentMode?: string;

  @ApiPropertyOptional({ example: 'REC-2026-001' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({ example: 'Annual premium paid via NEFT' })
  @IsOptional()
  @IsString()
  notes?: string;
}
