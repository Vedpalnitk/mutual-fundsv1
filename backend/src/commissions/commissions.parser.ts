import { Injectable, BadRequestException } from '@nestjs/common';

export interface ParsedBrokerageRow {
  amcName: string;
  schemeCategory: string;
  schemeName: string;
  schemeCode: string;
  isin: string;
  folioNo: string;
  investorName: string;
  amount: number;
  transactionType: string;
  brokerageAmount: number;
  grossCommission: number;
  tds: number;
  netCommission: number;
  arnNumber: string;
  euin: string;
}

export type BrokerageSourceType = 'CAMS' | 'KFINTECH' | 'MANUAL';
export type FileGranularity = 'SCHEME_LEVEL' | 'AMC_SUMMARY';

export interface ParseResult {
  source: BrokerageSourceType;
  granularity: FileGranularity;
  detectedArn: string | null;
  rows: ParsedBrokerageRow[];
}

@Injectable()
export class CommissionsParser {
  /**
   * Detect CSV source format and parse rows.
   * CAMS CSVs typically have "AMC Name" column, KFintech uses "Fund House"
   */
  parse(csvContent: string): ParseResult {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    const header = lines[0].toLowerCase();
    const source = this.detectSource(header);
    const columns = this.parseCSVLine(lines[0]);
    const colMap = this.buildColumnMap(columns, source);
    const detectedArn = this.extractArn(lines);

    const rows: ParsedBrokerageRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = this.parseCSVLine(lines[i]);
      if (cells.length < 3) continue; // skip malformed rows

      try {
        const grossCommission = this.parseNumber(cells[colMap.grossCommission]);
        const tds = this.parseNumber(cells[colMap.tds]);
        const netCommission = this.parseNumber(cells[colMap.netCommission]);
        const brokerageAmount = this.parseNumber(cells[colMap.brokerageAmount]);

        rows.push({
          amcName: (cells[colMap.amcName] || '').trim(),
          schemeCategory: (cells[colMap.schemeCategory] || '').trim(),
          schemeName: (cells[colMap.schemeName] || '').trim(),
          schemeCode: (cells[colMap.schemeCode] || '').trim(),
          isin: (cells[colMap.isin] || '').trim(),
          folioNo: (cells[colMap.folioNo] || '').trim(),
          investorName: (cells[colMap.investorName] || '').trim(),
          amount: this.parseNumber(cells[colMap.amount]),
          transactionType: (cells[colMap.transactionType] || '').trim(),
          brokerageAmount: brokerageAmount || netCommission || grossCommission,
          grossCommission,
          tds,
          netCommission,
          arnNumber: (cells[colMap.arnNumber] || '').trim(),
          euin: (cells[colMap.euin] || '').trim(),
        });
      } catch {
        // skip unparseable rows
      }
    }

    const granularity = this.detectGranularity(rows);

    return { source, granularity, detectedArn, rows };
  }

  private detectSource(headerLine: string): BrokerageSourceType {
    if (headerLine.includes('amc name') || headerLine.includes('amc_name')) {
      return 'CAMS';
    }
    if (headerLine.includes('fund house') || headerLine.includes('fund_house')) {
      return 'KFINTECH';
    }
    return 'MANUAL';
  }

  private detectGranularity(rows: ParsedBrokerageRow[]): FileGranularity {
    if (rows.length === 0) return 'AMC_SUMMARY';
    const withDetail = rows.filter(r => r.schemeName || r.folioNo);
    return withDetail.length > rows.length * 0.5 ? 'SCHEME_LEVEL' : 'AMC_SUMMARY';
  }

  private extractArn(lines: string[]): string | null {
    // Scan first 10 lines (headers/metadata) for ARN pattern
    const scanLines = lines.slice(0, Math.min(10, lines.length));
    for (const line of scanLines) {
      const match = line.match(/ARN-?\d{1,6}/i);
      if (match) return match[0].toUpperCase();
    }
    // Also check data rows for a consistent ARN
    for (const line of lines.slice(1, Math.min(20, lines.length))) {
      const match = line.match(/ARN-?\d{1,6}/i);
      if (match) return match[0].toUpperCase();
    }
    return null;
  }

  private buildColumnMap(columns: string[], source: BrokerageSourceType) {
    const lower = columns.map(c => c.toLowerCase().trim());

    const common = {
      schemeCode: this.findCol(lower, ['scheme code', 'scheme_code', 'amfi code', 'amfi_code']),
      isin: this.findCol(lower, ['isin', 'isin code', 'isin_code']),
      investorName: this.findCol(lower, ['investor name', 'investor_name', 'name', 'client name', 'client_name']),
      grossCommission: this.findCol(lower, ['gross commission', 'gross_commission', 'gross brokerage', 'gross_brokerage']),
      tds: this.findCol(lower, ['tds', 'tds amount', 'tds_amount', 'tax deducted']),
      netCommission: this.findCol(lower, ['net commission', 'net_commission', 'net brokerage', 'net_brokerage', 'net amount']),
      arnNumber: this.findCol(lower, ['arn', 'arn number', 'arn_number', 'arn no', 'arn_no']),
      euin: this.findCol(lower, ['euin', 'euin number', 'euin_number', 'euin no']),
    };

    if (source === 'CAMS') {
      return {
        amcName: this.findCol(lower, ['amc name', 'amc_name', 'amc']),
        schemeCategory: this.findCol(lower, ['scheme category', 'category', 'scheme_category']),
        schemeName: this.findCol(lower, ['scheme name', 'scheme_name', 'scheme']),
        folioNo: this.findCol(lower, ['folio no', 'folio_no', 'folio number', 'folio']),
        amount: this.findCol(lower, ['amount', 'transaction amount', 'txn amount', 'aum', 'market value']),
        transactionType: this.findCol(lower, ['transaction type', 'txn type', 'type']),
        brokerageAmount: this.findCol(lower, ['brokerage', 'commission', 'brokerage amount', 'trail']),
        ...common,
      };
    }

    // KFintech format
    return {
      amcName: this.findCol(lower, ['fund house', 'fund_house', 'amc']),
      schemeCategory: this.findCol(lower, ['scheme category', 'category', 'scheme_category', 'asset class']),
      schemeName: this.findCol(lower, ['scheme name', 'scheme_name', 'scheme']),
      folioNo: this.findCol(lower, ['folio no', 'folio_no', 'folio', 'folio number']),
      amount: this.findCol(lower, ['amount', 'transaction amount', 'txn_amount', 'aum', 'market value']),
      transactionType: this.findCol(lower, ['transaction type', 'txn_type', 'type']),
      brokerageAmount: this.findCol(lower, ['brokerage', 'commission', 'brokerage_amount', 'trail commission']),
      ...common,
    };
  }

  private findCol(headers: string[], candidates: string[]): number {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx >= 0) return idx;
    }
    return 0; // fallback to first column
  }

  private parseNumber(val: string | undefined): number {
    if (!val) return 0;
    const cleaned = val.replace(/[^0-9.\-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
}
