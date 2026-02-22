import { Injectable, Logger } from '@nestjs/common';

const AMFI_NAV_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';

export interface AmfiNavRecord {
  schemeCode: number;
  isinGrowth: string | null;
  isinReinvestment: string | null;
  schemeName: string;
  nav: number;
  navDate: Date;
  fundHouse: string;
  schemeCategory: string;
  schemeType: 'Open Ended Schemes' | 'Close Ended Schemes' | 'Interval Fund Schemes';
}

@Injectable()
export class AmfiService {
  private readonly logger = new Logger(AmfiService.name);

  /**
   * Download and parse the full AMFI NAVAll.txt file (~2MB, semicolon-separated).
   *
   * File structure (not flat CSV — has context headers):
   *   Open Ended Schemes(Equity Scheme - Large Cap Fund)    ← category header
   *                                                          ← blank line
   *   HDFC Mutual Fund                                       ← fund house header
   *   120503;INF846K01EW2;-;Axis ELSS...;105.9450;12-Feb-2026  ← data row
   */
  async fetchAndParseNavAll(): Promise<AmfiNavRecord[]> {
    this.logger.log('Fetching AMFI NAVAll.txt...');

    const response = await fetch(AMFI_NAV_URL);
    if (!response.ok) {
      throw new Error(`AMFI fetch failed: HTTP ${response.status}`);
    }

    const text = await response.text();
    this.logger.log(`Downloaded ${(text.length / 1024).toFixed(0)}KB from AMFI`);

    return this.parseNavAllText(text);
  }

  /**
   * Parse the raw NAVAll.txt content into structured records.
   */
  parseNavAllText(text: string): AmfiNavRecord[] {
    const lines = text.split('\n');
    const records: AmfiNavRecord[] = [];

    let currentCategory = '';
    let currentFundHouse = '';
    let currentSchemeType: AmfiNavRecord['schemeType'] = 'Open Ended Schemes';

    // Category header pattern: "Open Ended Schemes(Equity Scheme - Large Cap Fund)"
    const categoryHeaderRegex = /^(Open Ended Schemes|Close Ended Schemes|Interval Fund Schemes)\s*\((.+)\)\s*$/;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Skip empty lines
      if (!line) continue;

      // Skip the column header line
      if (line.startsWith('Scheme Code;')) continue;

      // Check for category header
      const categoryMatch = line.match(categoryHeaderRegex);
      if (categoryMatch) {
        currentSchemeType = categoryMatch[1] as AmfiNavRecord['schemeType'];
        const fullCategory = categoryMatch[2]; // e.g. "Equity Scheme - Large Cap Fund"
        // Extract after the " - " if present
        const dashIdx = fullCategory.indexOf(' - ');
        currentCategory = dashIdx >= 0 ? fullCategory.substring(dashIdx + 3).trim() : fullCategory.trim();
        continue;
      }

      // Data rows have semicolons
      const parts = line.split(';');

      if (parts.length >= 5) {
        // This is a data row: schemeCode;isinGrowth;isinReinvestment;schemeName;nav;date
        const schemeCode = parseInt(parts[0], 10);
        if (isNaN(schemeCode)) {
          // Not a data row — could be a fund house header (no semicolons parsed oddly)
          continue;
        }

        const navStr = parts[4]?.trim();
        if (!navStr || navStr === 'N.A.') continue;

        const nav = parseFloat(navStr);
        if (isNaN(nav) || nav <= 0) continue;

        const dateStr = parts[5]?.trim();
        if (!dateStr) continue;

        const navDate = this.parseAmfiDate(dateStr);
        if (!navDate) continue;

        const isinGrowth = parts[1]?.trim() || null;
        const isinReinvestment = parts[2]?.trim() || null;

        records.push({
          schemeCode,
          isinGrowth: isinGrowth && isinGrowth !== '-' ? isinGrowth : null,
          isinReinvestment: isinReinvestment && isinReinvestment !== '-' ? isinReinvestment : null,
          schemeName: parts[3]?.trim() || '',
          nav,
          navDate,
          fundHouse: currentFundHouse,
          schemeCategory: currentCategory,
          schemeType: currentSchemeType,
        });
      } else {
        // No semicolons or fewer than 5 parts — this is a fund house header
        // Fund house headers are plain text lines (e.g. "HDFC Mutual Fund")
        if (line.length > 3 && !line.includes(';')) {
          currentFundHouse = line;
        }
      }
    }

    this.logger.log(`Parsed ${records.length} records from AMFI file`);
    return records;
  }

  /**
   * Parse AMFI date format: "12-Feb-2026" → Date
   */
  private parseAmfiDate(dateStr: string): Date | null {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };

    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = months[parts[1]];
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || month === undefined || isNaN(year)) return null;

    return new Date(year, month, day);
  }
}
