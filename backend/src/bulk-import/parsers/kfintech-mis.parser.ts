import { Injectable } from '@nestjs/common'

export interface MisRecord {
  fundName: string
  schemeName: string
  folioNo: string
  investorName: string
  pan: string
  mobile?: string
  email?: string
  units: number
  amount: number
  currentValue: number
  isin?: string
  arnNo?: string
  subArn?: string
}

export interface MisParseResult {
  records: MisRecord[]
  errors: { row: number; field: string; message: string }[]
}

const COLUMN_MAP: Record<string, keyof MisRecord> = {
  'FUND': 'fundName',
  'FUND_NAME': 'fundName',
  'FUND NAME': 'fundName',
  'AMC': 'fundName',
  'SCHEME': 'schemeName',
  'SCHEME_NAME': 'schemeName',
  'SCHEME NAME': 'schemeName',
  'FOLIO_NO': 'folioNo',
  'FOLIO NO': 'folioNo',
  'FOLIO': 'folioNo',
  'NAME': 'investorName',
  'INVESTOR_NAME': 'investorName',
  'INVESTOR NAME': 'investorName',
  'PAN': 'pan',
  'PAN_NO': 'pan',
  'MOBILE_NO': 'mobile',
  'MOBILE': 'mobile',
  'EMAIL': 'email',
  'EMAIL_ID': 'email',
  'UNITS': 'units',
  'AMOUNT': 'amount',
  'COST': 'amount',
  'COST_VALUE': 'amount',
  'CURRENT_VALUE': 'currentValue',
  'CURRENT VALUE': 'currentValue',
  'MARKET_VALUE': 'currentValue',
  'ISIN': 'isin',
  'ISIN_NO': 'isin',
  'ARN_NO': 'arnNo',
  'ARN': 'arnNo',
  'ARN NO': 'arnNo',
  'SUB_ARN': 'subArn',
  'SUB ARN': 'subArn',
  'SUB_BROKER': 'subArn',
}

@Injectable()
export class KfintechMisParser {
  parse(content: string): MisParseResult {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length < 2) {
      return { records: [], errors: [{ row: 0, field: '', message: 'File is empty or has no data rows' }] }
    }

    const delimiter = lines[0].includes('\t') ? '\t' : ','

    const headers = this.parseCsvLine(lines[0], delimiter).map(h => h.trim().toUpperCase())
    const columnIndices = new Map<keyof MisRecord, number>()
    for (let i = 0; i < headers.length; i++) {
      const mapped = COLUMN_MAP[headers[i]]
      if (mapped) columnIndices.set(mapped, i)
    }

    const requiredFields: (keyof MisRecord)[] = ['investorName', 'schemeName', 'units']
    const missingFields = requiredFields.filter(f => !columnIndices.has(f))
    if (missingFields.length > 0) {
      return {
        records: [],
        errors: [{ row: 0, field: missingFields.join(', '), message: `Missing required columns: ${missingFields.join(', ')}` }],
      }
    }

    const records: MisRecord[] = []
    const errors: { row: number; field: string; message: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCsvLine(lines[i], delimiter)
        const getValue = (field: keyof MisRecord): string | undefined => {
          const idx = columnIndices.get(field)
          if (idx === undefined || idx >= values.length) return undefined
          const val = values[idx]?.trim()
          return val || undefined
        }

        const investorName = getValue('investorName')
        const schemeName = getValue('schemeName')
        const unitsStr = getValue('units')

        if (!investorName || !schemeName || !unitsStr) {
          errors.push({ row: i + 1, field: 'investorName/schemeName/units', message: 'Missing required fields' })
          continue
        }

        const units = parseFloat(unitsStr)
        if (isNaN(units) || units <= 0) {
          errors.push({ row: i + 1, field: 'units', message: `Invalid units: ${unitsStr}` })
          continue
        }

        const amountStr = getValue('amount')
        const currentValueStr = getValue('currentValue')

        records.push({
          fundName: getValue('fundName') || '',
          schemeName,
          folioNo: getValue('folioNo') || '',
          investorName,
          pan: getValue('pan') || '',
          mobile: getValue('mobile'),
          email: getValue('email'),
          units,
          amount: amountStr ? parseFloat(amountStr) : 0,
          currentValue: currentValueStr ? parseFloat(currentValueStr) : 0,
          isin: getValue('isin'),
          arnNo: getValue('arnNo'),
          subArn: getValue('subArn'),
        })
      } catch (err) {
        errors.push({ row: i + 1, field: '', message: `Failed to parse row: ${(err as Error).message}` })
      }
    }

    return { records, errors }
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    if (delimiter === '\t') return line.split('\t')

    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }
}
