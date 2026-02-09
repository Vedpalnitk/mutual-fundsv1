import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HoldingResponseDto } from './holding-response.dto';

export class AssetAllocationDto {
  @ApiProperty()
  assetClass: string;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  value: number;

  @ApiProperty()
  color: string;
}

export class PortfolioResponseDto {
  @ApiProperty()
  clientId: string;

  @ApiProperty()
  totalInvested: number;

  @ApiProperty()
  currentValue: number;

  @ApiProperty()
  absoluteGain: number;

  @ApiProperty()
  absoluteGainPercent: number;

  @ApiProperty()
  xirr: number;

  @ApiProperty()
  dayChange: number;

  @ApiProperty()
  dayChangePercent: number;

  @ApiProperty({ type: [HoldingResponseDto] })
  holdings: HoldingResponseDto[];

  @ApiProperty({ type: [AssetAllocationDto] })
  assetAllocation: AssetAllocationDto[];

  @ApiProperty()
  lastUpdated: string;
}
