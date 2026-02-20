import { ApiProperty } from '@nestjs/swagger'

export class FaCapitalGainRowDto {
  @ApiProperty()
  fundName: string

  @ApiProperty()
  schemeCode: string

  @ApiProperty()
  folio: string

  @ApiProperty({ enum: ['LTCG', 'STCG'] })
  gainType: 'LTCG' | 'STCG'

  @ApiProperty()
  purchaseDate: string

  @ApiProperty()
  saleDate: string

  @ApiProperty()
  holdingDays: number

  @ApiProperty()
  purchaseValue: number

  @ApiProperty()
  saleValue: number

  @ApiProperty()
  rawGain: number

  @ApiProperty()
  taxableGain: number

  @ApiProperty()
  estimatedTax: number
}

export class FaCapitalGainsResponseDto {
  @ApiProperty()
  clientId: string

  @ApiProperty()
  clientName: string

  @ApiProperty()
  financialYear: string

  @ApiProperty({ type: [FaCapitalGainRowDto] })
  rows: FaCapitalGainRowDto[]

  @ApiProperty()
  totalLtcg: number

  @ApiProperty()
  totalStcg: number

  @ApiProperty()
  ltcgTaxEstimate: number

  @ApiProperty()
  stcgTaxEstimate: number

  @ApiProperty()
  ltcgExemptionUsed: number
}
