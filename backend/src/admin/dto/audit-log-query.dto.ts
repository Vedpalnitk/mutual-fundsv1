import { IsOptional, IsString, IsDateString } from 'class-validator'
import { PaginationDto } from './pagination.dto'

export class AuditLogQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  action?: string

  @IsOptional()
  @IsString()
  entityType?: string

  @IsOptional()
  @IsString()
  userId?: string

  @IsOptional()
  @IsDateString()
  from?: string

  @IsOptional()
  @IsDateString()
  to?: string
}
