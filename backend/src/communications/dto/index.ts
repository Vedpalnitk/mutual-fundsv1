import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';

export class PreviewCommunicationDto {
  @IsString()
  clientId: string;

  @IsString()
  type: string; // CommunicationType

  @IsOptional()
  @IsString()
  customSubject?: string;

  @IsOptional()
  @IsString()
  customBody?: string;

  @IsOptional()
  contextData?: Record<string, any>;
}

export class SendCommunicationDto {
  @IsString()
  clientId: string;

  @IsEnum(['EMAIL', 'WHATSAPP'])
  channel: 'EMAIL' | 'WHATSAPP';

  @IsString()
  type: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CommunicationHistoryFilterDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
