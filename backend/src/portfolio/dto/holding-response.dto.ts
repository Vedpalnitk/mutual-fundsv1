import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HoldingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fundName: string;

  @ApiProperty()
  fundSchemeCode: string;

  @ApiProperty()
  fundCategory: string;

  @ApiProperty()
  assetClass: string;

  @ApiProperty()
  folioNumber: string;

  @ApiProperty()
  units: number;

  @ApiProperty()
  avgNav: number;

  @ApiProperty()
  currentNav: number;

  @ApiProperty()
  investedValue: number;

  @ApiProperty()
  currentValue: number;

  @ApiProperty()
  absoluteGain: number;

  @ApiProperty()
  absoluteGainPercent: number;

  @ApiPropertyOptional()
  xirr?: number;

  @ApiProperty()
  lastTransactionDate: string;
}
