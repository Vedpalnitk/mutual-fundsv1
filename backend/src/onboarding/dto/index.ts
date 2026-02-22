import { IsInt, IsOptional, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class CompleteStepDto {
  @ApiProperty({ description: 'Step number (1-7)' })
  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  step: number

  @ApiPropertyOptional({ description: 'Step-specific data' })
  @IsOptional()
  data?: any
}

export class SkipStepDto {
  @ApiProperty({ description: 'Step number to skip (4, 5, or 6 only)' })
  @IsInt()
  @Min(4)
  @Max(6)
  @Type(() => Number)
  step: number
}
