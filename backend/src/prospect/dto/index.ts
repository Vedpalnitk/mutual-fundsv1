import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsUUID } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export enum ProspectStageDto {
  DISCOVERY = 'DISCOVERY',
  ANALYSIS = 'ANALYSIS',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export enum LeadSourceDto {
  REFERRAL = 'REFERRAL',
  WEBSITE = 'WEBSITE',
  LINKEDIN = 'LINKEDIN',
  EVENT = 'EVENT',
  COLD_CALL = 'COLD_CALL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  OTHER = 'OTHER',
}

export class CreateProspectDto {
  @ApiProperty({ example: 'Ananya Reddy' })
  @IsString()
  name: string

  @ApiProperty({ example: 'ananya@email.com' })
  @IsString()
  email: string

  @ApiProperty({ example: '+91 98765 11111' })
  @IsString()
  phone: string

  @ApiPropertyOptional({ example: 5000000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  potentialAum?: number

  @ApiPropertyOptional({ enum: LeadSourceDto })
  @IsEnum(LeadSourceDto)
  @IsOptional()
  source?: LeadSourceDto

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referredBy?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nextAction?: string

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsDateString()
  @IsOptional()
  nextActionDate?: string
}

export class UpdateProspectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  potentialAum?: number

  @ApiPropertyOptional({ enum: ProspectStageDto })
  @IsEnum(ProspectStageDto)
  @IsOptional()
  stage?: ProspectStageDto

  @ApiPropertyOptional({ enum: LeadSourceDto })
  @IsEnum(LeadSourceDto)
  @IsOptional()
  source?: LeadSourceDto

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referredBy?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nextAction?: string

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  nextActionDate?: string
}

export class ProspectFilterDto {
  @IsOptional() @IsString() stage?: string
  @IsOptional() @IsString() search?: string
  @IsOptional() @IsString() assignedTo?: string
}

export class ConvertProspectDto {
  @ApiProperty({ example: 'ABCDE1234F' })
  @IsString()
  pan: string

  @ApiProperty({ example: '1990-01-15' })
  @IsDateString()
  dateOfBirth: string

  @ApiPropertyOptional({ enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] })
  @IsString()
  @IsOptional()
  riskProfile?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pincode?: string
}

export class CreateMeetingNoteDto {
  @ApiProperty({ example: 'Initial discussion' })
  @IsString()
  title: string

  @ApiProperty({ example: 'Discussed risk appetite and investment goals.' })
  @IsString()
  content: string

  @ApiPropertyOptional({ example: 'CALL' })
  @IsString()
  @IsOptional()
  meetingType?: string

  @ApiProperty({ example: '2026-02-20' })
  @IsDateString()
  meetingDate: string
}
