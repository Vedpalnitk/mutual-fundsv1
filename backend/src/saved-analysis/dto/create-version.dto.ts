import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVersionDto {
  @ApiProperty({ description: 'Updated rebalancing roadmap data' })
  @IsObject()
  rebalancingData: any;

  @ApiPropertyOptional({ example: 'Replaced HDFC Flexi Cap with Parag Parikh Flexi Cap for better diversification' })
  @IsString()
  @IsOptional()
  editNotes?: string;
}
