import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// ============= Tier 2: Deep Analysis Response DTOs =============

export class PersonaAlignmentDto {
  @ApiProperty({ description: 'Primary persona name' })
  primaryPersona: string

  @ApiProperty({ description: 'Primary persona risk band' })
  riskBand: string

  @ApiPropertyOptional({ description: 'Primary persona description' })
  description?: string

  @ApiProperty({ description: 'Classification confidence (0-1)' })
  confidence: number

  @ApiProperty({ description: 'Blended allocation recommendation' })
  blendedAllocation: Record<string, number>

  @ApiProperty({ description: 'Distribution across personas with weights' })
  distribution: { persona: string; weight: number }[]
}

export class RiskAssessmentDto {
  @ApiProperty({ description: 'Overall risk level' })
  riskLevel: string

  @ApiProperty({ description: 'Risk score (0-100)' })
  riskScore: number

  @ApiProperty({ description: 'Risk factors with severity and contribution' })
  riskFactors: {
    name: string
    contribution: number
    severity: string
    description?: string
  }[]

  @ApiProperty({ description: 'Risk mitigation recommendations' })
  recommendations: string[]
}

export class RebalancingRoadmapDto {
  @ApiProperty({ description: 'Whether portfolio is aligned with target' })
  isAligned: boolean

  @ApiProperty({ description: 'Alignment score (0-1)' })
  alignmentScore: number

  @ApiProperty({ description: 'Primary issues identified' })
  primaryIssues: string[]

  @ApiProperty({ description: 'Rebalancing actions to achieve target' })
  actions: {
    action: string
    priority: string
    schemeName: string
    assetClass: string
    currentValue?: number
    targetValue: number
    transactionAmount: number
    taxStatus?: string
    reason: string
  }[]

  @ApiProperty({ description: 'Total sell amount' })
  totalSellAmount: number

  @ApiProperty({ description: 'Total buy amount' })
  totalBuyAmount: number

  @ApiProperty({ description: 'Tax impact summary' })
  taxImpactSummary: string
}

export class DeepAnalysisSectionDto<T> {
  @ApiProperty({ description: 'Section status', enum: ['success', 'error'] })
  status: 'success' | 'error'

  @ApiPropertyOptional({ description: 'Section data (present on success)' })
  data?: T

  @ApiPropertyOptional({ description: 'Error message (present on error)' })
  error?: string
}

export class DeepAnalysisResponseDto {
  @ApiProperty({ description: 'Client ID' })
  clientId: string

  @ApiProperty({ description: 'Client name' })
  clientName: string

  @ApiProperty({ description: 'ML-powered persona alignment analysis' })
  persona: DeepAnalysisSectionDto<PersonaAlignmentDto>

  @ApiProperty({ description: 'ML-powered risk assessment' })
  risk: DeepAnalysisSectionDto<RiskAssessmentDto>

  @ApiProperty({ description: 'ML-powered rebalancing roadmap' })
  rebalancing: DeepAnalysisSectionDto<RebalancingRoadmapDto>
}
