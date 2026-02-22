import { IsNotEmpty, IsString, IsOptional } from 'class-validator'

export class UpdateSettingDto {
  @IsNotEmpty()
  value: any

  @IsOptional()
  @IsString()
  description?: string
}
