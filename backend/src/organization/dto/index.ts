import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator'

export class CreateArnDto {
  @IsString()
  @Matches(/^ARN-\d{1,6}$/, { message: 'ARN must be in format ARN-XXXXXX' })
  arnNumber: string

  @IsOptional()
  @IsString()
  label?: string
}

export class UpdateArnDto {
  @IsOptional()
  @IsString()
  label?: string

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
