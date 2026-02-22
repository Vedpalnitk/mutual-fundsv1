import { Injectable } from '@nestjs/common'

export interface WbrRecord {
  amcCode: string
  amcName: string
  folioNo: string
  investorName: string
  pan: string
  email?: string
  mobile?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  schemeName: string
  isin?: string
  amfiCode?: string
  units: number
  nav: number
  navDate: Date
  currentValue: number
  costValue?: number
  dividendOption?: string
  planType?: string
  brokerCode?: string
}

export interface ParseResult {
  records: WbrRecord[]
  errors: { row: number; field: string; message: string }[]
}

// Column header aliases (CAMS WBR can have slight variations)
const COLUMN_MAP: Record<string, keyof WbrRecord> = {
  'AMC_CODE': 'amcCode',
  'AMC CODE': 'amcCode',
  'AMC_NAME': 'amcName',
  'AMC NAME': 'amcName',
  'FOLIO_NO': 'folioNo',
  'FOLIO NO': 'folioNo',
  'FOLIO': 'folioNo',
  'INVESTOR_NAME': 'investorName',
  'INVESTOR NAME': 'investorName',
  'NAME': 'investorName',
  'PAN': 'pan',
  'PAN_NO': 'pan',
  'EMAIL': 'email',
  'EMAIL_ID': 'email',
  'MOBILE': 'mobile',
  'MOBILE_NO': 'mobile',
  'ADDRESS': 'address',
  'CITY': 'city',
  'STATE': 'state',
  'PINCODE': 'pincode',
  'PIN_CODE': 'pincode',
  'SCHEME_NAME': 'schemeName',
  'SCHEME NAME': 'schemeName',
  'SCHEME': 'schemeName',
  'ISIN': 'isin',
  'ISIN_NO': 'isin',
  'AMFI_CODE': 'amfiCode',
  'AMFI CODE': 'amfiCode',
  'UNITS': 'units',
  'NAV': 'nav',
  'NAV_DATE': 'navDate',
  'NAV DATE': 'navDate',
  'CURRENT_VALUE': 'currentValue',
  'CURRENT VALUE': 'currentValue',
  'MARKET_VALUE': 'currentValue',
  'COST_VALUE': 'costValue',
  'COST VALUE': 'costValue',
  'COST': 'costValue',
  'DIVIDEND_OPTION': 'dividendOption',
  'DIVIDEND OPTION': 'dividendOption',
  'PLAN_TYPE': 'planType',
  'PLAN TYPE': 'planType',
  'BROKER_CODE': 'brokerCode',
  'BROKER CODE': 'brokerCode',
  'ARN': 'brokerCode',
  'ARN_NO': 'brokerCode',
}

@Injectable()
export class CamsWbrParser {
  parse(content: string): ParseResult {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length < 2) {
      return { records: [], errors: [{ row: 0, field: '', message: 'File is empty or has no data rows' }] }
    }

    // Detect delimiter (comma or tab)
    const delimiter = lines[0].includes('\t') ? '\t' : ','

    // Parse header
    const headers = this.parseCsvLine(lines[0], delimiter).map(h => h.trim().toUpperCase())
    const columnIndices = new Map<keyof WbrRecord, number>()
    for (let i = 0; i < headers.length; i++) {
      const mapped = COLUMN_MAP[headers[i]]
      if (mapped) columnIndices.set(mapped, i)
    }

    // Validate required columns
    const requiredFields: (keyof WbrRecord)[] = ['investorName', 'pan', 'schemeName', 'units']
    const missingFields = requiredFields.filter(f => !columnIndices.has(f))
    if (missingFields.length > 0) {
      return {
        records: [],
        errors: [{ row: 0, field: missingFields.join(', '), message: `Missing required columns: ${missingFields.join(', ')}` }],
      }
    }

    const records: WbrRecord[] = []
    const errors: { row: number; field: string; message: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCsvLine(lines[i], delimiter)
        const getValue = (field: keyof WbrRecord): string | undefined => {
          const idx = columnIndices.get(field)
          if (idx === undefined || idx >= values.length) return undefined
          const val = values[idx]?.trim()
          return val || undefined
        }

        const pan = getValue('pan')
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

        const navStr = getValue('nav')
        const currentValueStr = getValue('currentValue')
        const costValueStr = getValue('costValue')
        const navDateStr = getValue('navDate')

        records.push({
          amcCode: getValue('amcCode') || '',
          amcName: getValue('amcName') || '',
          folioNo: getValue('folioNo') || '',
          investorName: investorName,
          pan: pan || '',
          email: getValue('email'),
          mobile: getValue('mobile'),
          address: getValue('address'),
          city: getValue('city'),
          state: getValue('state'),
          pincode: getValue('pincode'),
          schemeName: schemeName,
          isin: getValue('isin'),
          amfiCode: getValue('amfiCode'),
          units,
          nav: navStr ? parseFloat(navStr) : 0,
          navDate: navDateStr ? new Date(navDateStr) : new Date(),
          currentValue: currentValueStr ? parseFloat(currentValueStr) : 0,
          costValue: costValueStr ? parseFloat(costValueStr) : undefined,
          dividendOption: getValue('dividendOption'),
          planType: getValue('planType'),
          brokerCode: getValue('brokerCode'),
        })
      } catch (err) {
        errors.push({ row: i + 1, field: '', message: `Failed to parse row: ${(err as Error).message}` })
      }
    }

    return { records, errors }
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    if (delimiter === '\t') return line.split('\t')

    // Handle quoted CSV fields
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
