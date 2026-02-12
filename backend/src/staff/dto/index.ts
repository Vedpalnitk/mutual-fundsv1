import { IsString, IsOptional, IsArray, IsBoolean, IsEmail, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  displayName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  allowedPages: string[];
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedPages?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
