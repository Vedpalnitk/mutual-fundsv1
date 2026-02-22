import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, Min, Max } from 'class-validator'

export class CreateSplitDto {
  @IsString()
  staffMemberId: string

  @IsNumber()
  @Min(0.01)
  @Max(100)
  splitPercent: number

  @IsDateString()
  effectiveFrom: string

  @IsOptional()
  @IsDateString()
  effectiveTo?: string
}

export class UpdateSplitDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  splitPercent?: number

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string

  @IsOptional()
  @IsDateString()
  effectiveTo?: string
}

export class ComputePayoutsDto {
  @IsString()
  period: string // "2026-01"
}

export enum PayoutStatusFilter {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
}

export class PayoutFilterDto {
  @IsOptional()
  @IsString()
  period?: string

  @IsOptional()
  @IsString()
  staffMemberId?: string

  @IsOptional()
  @IsEnum(PayoutStatusFilter)
  status?: PayoutStatusFilter
}
