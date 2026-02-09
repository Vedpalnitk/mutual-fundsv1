import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHoldingDto {
  @ApiProperty({ example: 'Axis Bluechip Fund - Direct Growth' })
  @IsString()
  fundName: string;

  @ApiProperty({ example: '120503' })
  @IsString()
  fundSchemeCode: string;

  @ApiProperty({ example: 'Large Cap Fund' })
  @IsString()
  fundCategory: string;

  @ApiProperty({ example: 'Equity' })
  @IsString()
  assetClass: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  folioNumber: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0)
  units: number;

  @ApiProperty({ example: 45.5 })
  @IsNumber()
  @Min(0)
  avgNav: number;

  @ApiProperty({ example: 52.3 })
  @IsNumber()
  @Min(0)
  currentNav: number;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  lastTransactionDate?: string;
}

export class UpdateHoldingDto {
  @ApiPropertyOptional({ example: 150.75 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  units?: number;

  @ApiPropertyOptional({ example: 46.2 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  avgNav?: number;

  @ApiPropertyOptional({ example: 53.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentNav?: number;

  @ApiPropertyOptional({ example: '2024-02-15' })
  @IsDateString()
  @IsOptional()
  lastTransactionDate?: string;
}
