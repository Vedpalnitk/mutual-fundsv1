import { IsOptional, IsString, IsIn } from 'class-validator'
import { PaginationDto } from './pagination.dto'

export class AdvisorQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(['aum', 'clients', 'transactions', 'lastLogin'])
  sortBy?: string = 'clients'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: string = 'desc'
}
