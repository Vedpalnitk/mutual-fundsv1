import { IsString, IsBoolean, IsNumber, IsOptional, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PlaceCobDto {
  @ApiProperty()
  @IsString()
  clientId: string

  @ApiProperty()
  @IsString()
  schemeCode: string

  @ApiProperty()
  @IsString()
  folioNumber: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allUnits?: boolean

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  units?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromArn?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string
}
