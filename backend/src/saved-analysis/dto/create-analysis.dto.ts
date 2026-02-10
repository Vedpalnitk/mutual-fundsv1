import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnalysisDto {
  @ApiProperty({ example: 'Deep Analysis - Rajesh Sharma' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'client-uuid' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'Persona alignment data from ML analysis' })
  @IsObject()
  personaData: any;

  @ApiProperty({ description: 'Risk assessment data from ML analysis' })
  @IsObject()
  riskData: any;

  @ApiProperty({ description: 'Rebalancing roadmap data from ML analysis' })
  @IsObject()
  rebalancingData: any;

  @ApiPropertyOptional({ example: 'Initial analysis based on current holdings' })
  @IsString()
  @IsOptional()
  editNotes?: string;
}
