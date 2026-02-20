import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportCasDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'CAS PDF file' })
  file: any;

  @ApiProperty({ description: 'CAS PDF password (typically PAN + DOB in DDMMYYYY)' })
  password: string;

  @ApiPropertyOptional({ description: 'FA Client ID (if importing for a client)' })
  clientId?: string;
}

export class CASImportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  context: string;

  @ApiPropertyOptional()
  investorName?: string;

  @ApiPropertyOptional()
  investorEmail?: string;

  @ApiProperty()
  foliosImported: number;

  @ApiProperty()
  schemesImported: number;

  @ApiPropertyOptional()
  totalValue?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  errorMessage?: string;
}
