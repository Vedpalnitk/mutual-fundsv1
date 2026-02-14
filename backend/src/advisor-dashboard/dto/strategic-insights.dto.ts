import { ApiProperty } from '@nestjs/swagger'

// ============= Tier 3: Strategic Intelligence Response DTOs =============

export class FundOverlapItemDto {
  @ApiProperty({ description: 'Fund/scheme name' })
  fundName: string

  @ApiProperty({ description: 'Number of clients holding this fund' })
  clientCount: number

  @ApiProperty({ description: 'Total AUM across all clients in this fund' })
  totalValue: number

  @ApiProperty({ description: 'Client names holding this fund' })
  clients: string[]
}

export class ConcentrationAlertDto {
  @ApiProperty({ description: 'Client ID' })
  clientId: string

  @ApiProperty({ description: 'Client name' })
  clientName: string

  @ApiProperty({ description: 'Type of concentration', enum: ['fund', 'category'] })
  type: 'fund' | 'category'

  @ApiProperty({ description: 'Name of the concentrated fund/category' })
  name: string

  @ApiProperty({ description: 'Concentration percentage' })
  percentage: number

  @ApiProperty({ description: 'Value in the concentrated position' })
  value: number
}

export class AumBucketDto {
  @ApiProperty({ description: 'Range label (e.g., "0-1L", "1L-5L")' })
  range: string

  @ApiProperty({ description: 'Number of clients in this bucket' })
  count: number

  @ApiProperty({ description: 'Total AUM in this bucket' })
  totalAum: number
}

export class RiskDistributionItemDto {
  @ApiProperty({ description: 'Risk profile label' })
  profile: string

  @ApiProperty({ description: 'Number of clients' })
  count: number

  @ApiProperty({ description: 'Percentage of total clients' })
  percentage: number
}

export class StrategicInsightsResponseDto {
  @ApiProperty({ description: 'Funds held by multiple clients', type: [FundOverlapItemDto] })
  fundOverlap: FundOverlapItemDto[]

  @ApiProperty({ description: 'Clients with high concentration in single fund/category', type: [ConcentrationAlertDto] })
  concentrationAlerts: ConcentrationAlertDto[]

  @ApiProperty({ description: 'AUM distribution across client buckets', type: [AumBucketDto] })
  aumDistribution: AumBucketDto[]

  @ApiProperty({ description: 'Distribution of clients across risk profiles', type: [RiskDistributionItemDto] })
  riskDistribution: RiskDistributionItemDto[]
}
