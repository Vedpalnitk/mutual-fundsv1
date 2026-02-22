import { IsString, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class BulkImportFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  importType?: string // CAMS_WBR | KFINTECH_MIS

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string // PROCESSING | COMPLETED | FAILED | PARTIAL
}
