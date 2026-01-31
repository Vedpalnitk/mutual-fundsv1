import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  clientName: string;

  @ApiProperty()
  fundName: string;

  @ApiProperty()
  fundSchemeCode: string;

  @ApiProperty()
  fundCategory: string;

  @ApiProperty({ enum: ['Buy', 'Sell', 'SIP', 'SWP', 'Switch', 'STP'] })
  type: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  units: number;

  @ApiProperty()
  nav: number;

  @ApiProperty({ enum: ['Completed', 'Pending', 'Processing', 'Failed', 'Cancelled'] })
  status: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  folioNumber: string;

  @ApiPropertyOptional()
  orderId?: string;

  @ApiPropertyOptional({ enum: ['Net Banking', 'UPI', 'NACH', 'Cheque'] })
  paymentMode?: string;

  @ApiPropertyOptional()
  remarks?: string;
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
