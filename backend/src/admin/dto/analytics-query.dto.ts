import { IsOptional, IsIn } from 'class-validator'

export class AnalyticsTrendQueryDto {
  @IsOptional()
  @IsIn(['users', 'aum', 'transactions'])
  metric?: string = 'users'

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  period?: string = 'daily'

  @IsOptional()
  @IsIn(['7d', '30d', '90d', '1y'])
  range?: string = '30d'
}
