import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator'
import { PaginationDto } from './pagination.dto'

export class AdminTransactionQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(['BSE', 'NSE', 'MANUAL'])
  source?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsDateString()
  from?: string

  @IsOptional()
  @IsDateString()
  to?: string
}
