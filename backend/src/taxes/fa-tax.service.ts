import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { FaCapitalGainRowDto, FaCapitalGainsResponseDto } from './dto/fa-tax.dto'

interface FifoLot {
  date: Date
  units: number
  nav: number
  amount: number
}

@Injectable()
export class FaTaxService {
  constructor(private prisma: PrismaService) {}

  // Indian tax rates for FY 2024-25 onwards
  private readonly EQUITY_LTCG_RATE = 0.10
  private readonly EQUITY_STCG_RATE = 0.15
  private readonly DEBT_LTCG_RATE = 0.20
  private readonly DEBT_STCG_RATE = 0.30 // slab rate approximation
  private readonly LTCG_EXEMPTION_LIMIT = 100000

  async getCapitalGains(clientId: string, advisorId: string, fy?: string): Promise<FaCapitalGainsResponseDto> {
    const client = await this.verifyClient(clientId, advisorId)
    const financialYear = fy || this.getCurrentFy()
    const { startDate, endDate } = this.parseFy(financialYear)

    // Get all SELL, SWP, SWITCH (out) transactions in the FY
    const sellTxns = await this.prisma.fATransaction.findMany({
      where: {
        clientId,
        type: { in: ['SELL', 'SWP', 'SWITCH'] },
        date: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      orderBy: { date: 'asc' },
    })

    // Get all BUY, SIP, STP (in), SWITCH (in) transactions up to FY end
    const buyTxns = await this.prisma.fATransaction.findMany({
      where: {
        clientId,
        type: { in: ['BUY', 'SIP', 'STP', 'SWITCH'] },
        date: { lte: endDate },
        status: 'COMPLETED',
      },
      orderBy: { date: 'asc' },
    })

    const rows = this.computeFifoGains(buyTxns, sellTxns)

    let totalLtcg = 0
    let totalStcg = 0
    let ltcgTaxEstimate = 0
    let stcgTaxEstimate = 0

    for (const row of rows) {
      if (row.gainType === 'LTCG') {
        totalLtcg += row.rawGain
      } else {
        totalStcg += row.rawGain
      }
    }

    // Apply LTCG exemption (₹1L for equity)
    const taxableLtcg = Math.max(0, totalLtcg - this.LTCG_EXEMPTION_LIMIT)
    const ltcgExemptionUsed = Math.min(totalLtcg, this.LTCG_EXEMPTION_LIMIT)

    // Estimate taxes (simplified: assume all equity for now)
    ltcgTaxEstimate = Math.round(taxableLtcg * this.EQUITY_LTCG_RATE)
    stcgTaxEstimate = Math.round(Math.max(0, totalStcg) * this.EQUITY_STCG_RATE)

    // Update estimated tax per row
    for (const row of rows) {
      if (row.gainType === 'LTCG') {
        const fraction = totalLtcg > 0 ? row.rawGain / totalLtcg : 0
        row.taxableGain = Math.round(Math.max(0, row.rawGain - fraction * ltcgExemptionUsed))
        row.estimatedTax = Math.round(row.taxableGain * this.EQUITY_LTCG_RATE)
      } else {
        row.taxableGain = Math.max(0, row.rawGain)
        row.estimatedTax = Math.round(row.taxableGain * this.EQUITY_STCG_RATE)
      }
    }

    return {
      clientId,
      clientName: client.name,
      financialYear,
      rows,
      totalLtcg: Math.round(totalLtcg),
      totalStcg: Math.round(totalStcg),
      ltcgTaxEstimate,
      stcgTaxEstimate,
      ltcgExemptionUsed,
    }
  }

  async getTaxSummary(clientId: string, advisorId: string, fy?: string) {
    const gains = await this.getCapitalGains(clientId, advisorId, fy)
    return {
      clientId: gains.clientId,
      clientName: gains.clientName,
      financialYear: gains.financialYear,
      totalLtcg: gains.totalLtcg,
      totalStcg: gains.totalStcg,
      ltcgTaxEstimate: gains.ltcgTaxEstimate,
      stcgTaxEstimate: gains.stcgTaxEstimate,
      totalTaxEstimate: gains.ltcgTaxEstimate + gains.stcgTaxEstimate,
      ltcgExemptionUsed: gains.ltcgExemptionUsed,
      transactionCount: gains.rows.length,
    }
  }

  async downloadCsv(clientId: string, advisorId: string, fy?: string): Promise<string> {
    const gains = await this.getCapitalGains(clientId, advisorId, fy)

    const headers = [
      'Fund Name', 'Scheme Code', 'Folio', 'Gain Type',
      'Purchase Date', 'Sale Date', 'Holding Days',
      'Purchase Value', 'Sale Value', 'Gain', 'Taxable Gain', 'Estimated Tax',
    ]

    const csvRows = [headers.join(',')]
    for (const row of gains.rows) {
      csvRows.push([
        `"${row.fundName}"`,
        row.schemeCode,
        row.folio,
        row.gainType,
        row.purchaseDate,
        row.saleDate,
        row.holdingDays,
        row.purchaseValue.toFixed(2),
        row.saleValue.toFixed(2),
        row.rawGain.toFixed(2),
        row.taxableGain.toFixed(2),
        row.estimatedTax.toFixed(2),
      ].join(','))
    }

    // Summary rows
    csvRows.push('')
    csvRows.push(`Summary for FY ${gains.financialYear}`)
    csvRows.push(`Total LTCG,${gains.totalLtcg.toFixed(2)}`)
    csvRows.push(`Total STCG,${gains.totalStcg.toFixed(2)}`)
    csvRows.push(`LTCG Exemption Used,${gains.ltcgExemptionUsed.toFixed(2)}`)
    csvRows.push(`LTCG Tax Estimate,${gains.ltcgTaxEstimate.toFixed(2)}`)
    csvRows.push(`STCG Tax Estimate,${gains.stcgTaxEstimate.toFixed(2)}`)

    return csvRows.join('\n')
  }

  private computeFifoGains(buyTxns: any[], sellTxns: any[]): FaCapitalGainRowDto[] {
    // Build FIFO lots grouped by (schemeCode, folio)
    const lotMap = new Map<string, FifoLot[]>()
    for (const txn of buyTxns) {
      const key = `${txn.fundSchemeCode}|${txn.folioNumber}`
      if (!lotMap.has(key)) lotMap.set(key, [])
      lotMap.get(key)!.push({
        date: txn.date,
        units: Number(txn.units),
        nav: Number(txn.nav),
        amount: Number(txn.amount),
      })
    }

    const rows: FaCapitalGainRowDto[] = []

    for (const sell of sellTxns) {
      const key = `${sell.fundSchemeCode}|${sell.folioNumber}`
      const lots = lotMap.get(key) || []
      let remainingUnits = Number(sell.units)
      const saleNav = Number(sell.nav)
      const saleDate = sell.date

      while (remainingUnits > 0.001 && lots.length > 0) {
        const lot = lots[0]
        const matchedUnits = Math.min(remainingUnits, lot.units)
        const purchaseValue = matchedUnits * lot.nav
        const saleValue = matchedUnits * saleNav

        const holdingDays = Math.floor(
          (saleDate.getTime() - lot.date.getTime()) / (1000 * 60 * 60 * 24),
        )

        const gainType = this.classifyGain(sell.fundCategory, holdingDays)
        const rawGain = saleValue - purchaseValue

        rows.push({
          fundName: sell.fundName,
          schemeCode: sell.fundSchemeCode,
          folio: sell.folioNumber,
          gainType,
          purchaseDate: lot.date.toISOString().split('T')[0],
          saleDate: saleDate.toISOString().split('T')[0],
          holdingDays,
          purchaseValue: Math.round(purchaseValue * 100) / 100,
          saleValue: Math.round(saleValue * 100) / 100,
          rawGain: Math.round(rawGain * 100) / 100,
          taxableGain: 0, // computed later after exemption
          estimatedTax: 0,
        })

        lot.units -= matchedUnits
        remainingUnits -= matchedUnits

        if (lot.units < 0.001) {
          lots.shift()
        }
      }
    }

    return rows
  }

  private classifyGain(fundCategory: string, holdingDays: number): 'LTCG' | 'STCG' {
    const category = (fundCategory || '').toLowerCase()
    const isDebt = category.includes('debt') || category.includes('liquid') ||
      category.includes('gilt') || category.includes('money market') ||
      category.includes('overnight') || category.includes('ultra short')

    if (isDebt) {
      return holdingDays > 1095 ? 'LTCG' : 'STCG' // 3 years for debt
    }
    return holdingDays > 365 ? 'LTCG' : 'STCG' // 1 year for equity
  }

  private parseFy(fy: string): { startDate: Date; endDate: Date } {
    // FY format: "2024-25"
    const parts = fy.split('-')
    const startYear = parseInt(parts[0])
    return {
      startDate: new Date(startYear, 3, 1), // April 1
      endDate: new Date(startYear + 1, 2, 31), // March 31
    }
  }

  private getCurrentFy(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    if (month >= 4) {
      return `${year}-${(year + 1).toString().slice(-2)}`
    }
    return `${year - 1}-${year.toString().slice(-2)}`
  }

  private async verifyClient(clientId: string, advisorId: string) {
    const client = await this.prisma.fAClient.findFirst({
      where: { id: clientId, advisorId },
    })
    if (!client) {
      throw new NotFoundException('Client not found')
    }
    return client
  }
}
