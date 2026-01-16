import { Injectable, Logger } from '@nestjs/common';

/**
 * MFAPI.in - Free Indian Mutual Fund API
 * Docs: https://www.mfapi.in/
 *
 * Endpoints:
 * - GET /mf - List all schemes (47000+ funds)
 * - GET /mf/search?q={query} - Search funds
 * - GET /mf/{schemeCode} - Get fund details with NAV history
 */

const MFAPI_BASE_URL = 'https://api.mfapi.in/mf';

// Cache duration in milliseconds
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export interface MFScheme {
  schemeCode: number;
  schemeName: string;
}

export interface MFNavData {
  date: string;
  nav: string;
}

export interface MFMeta {
  fund_house: string;
  scheme_type: string;
  scheme_category: string;
  scheme_code: number;
  scheme_name: string;
  isin_growth: string | null;
  isin_div_reinvestment: string | null;
}

export interface MFDetails {
  meta: MFMeta;
  data: MFNavData[];
  status: string;
}

export interface FundWithMetrics {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  schemeType: string;
  currentNav: number;
  previousNav: number;
  dayChange: number;
  dayChangePercent: number;
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  assetClass: string;
}

// Map categories to asset classes
const CATEGORY_TO_ASSET_CLASS: Record<string, string> = {
  // Equity
  'Large Cap Fund': 'equity',
  'Large & Mid Cap Fund': 'equity',
  'Mid Cap Fund': 'equity',
  'Small Cap Fund': 'equity',
  'Multi Cap Fund': 'equity',
  'Flexi Cap Fund': 'equity',
  'Focused Fund': 'equity',
  'ELSS': 'equity',
  'Value Fund': 'equity',
  'Contra Fund': 'equity',
  'Dividend Yield Fund': 'equity',
  'Sectoral/Thematic': 'equity',
  // Debt
  'Liquid Fund': 'liquid',
  'Ultra Short Duration Fund': 'debt',
  'Low Duration Fund': 'debt',
  'Short Duration Fund': 'debt',
  'Medium Duration Fund': 'debt',
  'Medium to Long Duration Fund': 'debt',
  'Long Duration Fund': 'debt',
  'Dynamic Bond Fund': 'debt',
  'Corporate Bond Fund': 'debt',
  'Credit Risk Fund': 'debt',
  'Banking and PSU Fund': 'debt',
  'Gilt Fund': 'debt',
  'Gilt Fund with 10 year constant duration': 'debt',
  'Floater Fund': 'debt',
  'Money Market Fund': 'liquid',
  'Overnight Fund': 'liquid',
  // Hybrid
  'Aggressive Hybrid Fund': 'hybrid',
  'Conservative Hybrid Fund': 'hybrid',
  'Balanced Advantage Fund': 'hybrid',
  'Multi Asset Allocation Fund': 'hybrid',
  'Arbitrage Fund': 'hybrid',
  'Equity Savings Fund': 'hybrid',
  // Gold
  'Gold': 'gold',
  'Gold ETF': 'gold',
  // International
  'International': 'international',
  'Fund of Funds (Overseas)': 'international',
};

@Injectable()
export class MfApiService {
  private readonly logger = new Logger(MfApiService.name);

  // Simple in-memory cache
  private cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * Search for mutual funds by name
   */
  async searchFunds(query: string): Promise<MFScheme[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = this.getFromCache<MFScheme[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${MFAPI_BASE_URL}/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`MFAPI returned ${response.status}`);
      }

      const data = await response.json() as MFScheme[];
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed fund information including NAV history
   */
  async getFundDetails(schemeCode: number): Promise<MFDetails> {
    const cacheKey = `fund:${schemeCode}`;
    const cached = this.getFromCache<MFDetails>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${MFAPI_BASE_URL}/${schemeCode}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Fund not found');
        }
        throw new Error(`MFAPI returned ${response.status}`);
      }

      const data = await response.json() as MFDetails;

      if (data.status !== 'SUCCESS') {
        throw new Error('Fund not found');
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      this.logger.error(`GetFundDetails failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get fund with calculated metrics (returns, volatility, etc.)
   */
  async getFundWithMetrics(schemeCode: number): Promise<FundWithMetrics> {
    const details = await this.getFundDetails(schemeCode);

    const currentNavData = details.data[0];
    const previousNavData = details.data[1];

    const currentNav = parseFloat(currentNavData.nav);
    const previousNav = parseFloat(previousNavData.nav);
    const dayChange = currentNav - previousNav;
    const dayChangePercent = (dayChange / previousNav) * 100;

    // Extract category from scheme_category (format: "Equity Scheme - Large Cap Fund")
    const categoryParts = details.meta.scheme_category.split(' - ');
    const category = categoryParts.length > 1 ? categoryParts[1] : details.meta.scheme_category;

    // Calculate returns
    const returns = this.calculateReturns(details.data);

    return {
      schemeCode: details.meta.scheme_code,
      schemeName: details.meta.scheme_name,
      fundHouse: details.meta.fund_house,
      category,
      schemeType: details.meta.scheme_type,
      currentNav,
      previousNav,
      dayChange,
      dayChangePercent,
      return1Y: returns.return1Y,
      return3Y: returns.return3Y,
      return5Y: returns.return5Y,
      assetClass: this.getAssetClass(category),
    };
  }

  /**
   * Get multiple funds in parallel (with rate limiting)
   */
  async getMultipleFunds(schemeCodes: number[]): Promise<FundWithMetrics[]> {
    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    const results: FundWithMetrics[] = [];

    for (let i = 0; i < schemeCodes.length; i += batchSize) {
      const batch = schemeCodes.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(code => this.getFundWithMetrics(code))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }

      // Small delay between batches
      if (i + batchSize < schemeCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  /**
   * Get popular/recommended funds
   */
  async getPopularFunds(): Promise<FundWithMetrics[]> {
    // Curated list of popular Direct Growth funds
    const popularCodes = [
      // Large Cap
      120586, // ICICI Prudential Bluechip Fund Direct Growth
      119598, // SBI Blue Chip Fund Direct Growth
      // Flexi Cap
      118989, // HDFC Flexi Cap Fund Direct Growth
      122639, // Parag Parikh Flexi Cap Fund Direct Growth
      // Mid Cap
      120505, // Quant Mid Cap Fund Direct Growth
      118834, // Mirae Asset Midcap Fund Direct Growth
      // Small Cap
      119064, // Nippon India Small Cap Fund Direct Growth
      130503, // SBI Small Cap Fund Direct Growth
      // Hybrid
      118988, // HDFC Balanced Advantage Fund Direct Growth
      // Debt
      120716, // HDFC Corporate Bond Fund Direct Growth
      // Liquid
      119243, // ICICI Prudential Liquid Fund Direct Growth
    ];

    return this.getMultipleFunds(popularCodes);
  }

  /**
   * Search and get funds by category
   */
  async searchByCategory(category: string, limit: number = 10): Promise<MFScheme[]> {
    const results = await this.searchFunds(category);

    // Filter for Direct Growth plans only
    const directGrowth = results.filter(fund =>
      fund.schemeName.includes('Direct') &&
      fund.schemeName.includes('Growth')
    );

    return directGrowth.slice(0, limit);
  }

  // ============= Private Helpers =============

  private calculateReturns(navData: MFNavData[]): { return1Y?: number; return3Y?: number; return5Y?: number } {
    if (navData.length < 2) {
      return {};
    }

    const currentNav = parseFloat(navData[0].nav);
    const currentDate = this.parseNavDate(navData[0].date);

    const getDateAgo = (months: number): Date => {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - months);
      return date;
    };

    const findNavByDate = (targetDate: Date): number | null => {
      const targetTime = targetDate.getTime();

      for (const nav of navData) {
        const navDate = this.parseNavDate(nav.date);
        const diff = Math.abs(navDate.getTime() - targetTime);

        // Within 7 days (to handle weekends/holidays)
        if (diff <= 7 * 24 * 60 * 60 * 1000) {
          return parseFloat(nav.nav);
        }
      }
      return null;
    };

    const calculateCAGR = (pastNav: number, years: number): number => {
      if (pastNav <= 0 || years <= 0) return 0;
      return (Math.pow(currentNav / pastNav, 1 / years) - 1) * 100;
    };

    const nav1Y = findNavByDate(getDateAgo(12));
    const nav3Y = findNavByDate(getDateAgo(36));
    const nav5Y = findNavByDate(getDateAgo(60));

    return {
      return1Y: nav1Y ? calculateCAGR(nav1Y, 1) : undefined,
      return3Y: nav3Y ? calculateCAGR(nav3Y, 3) : undefined,
      return5Y: nav5Y ? calculateCAGR(nav5Y, 5) : undefined,
    };
  }

  private parseNavDate(dateStr: string): Date {
    // Format: DD-MM-YYYY
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private getAssetClass(category: string): string {
    // Try exact match
    if (CATEGORY_TO_ASSET_CLASS[category]) {
      return CATEGORY_TO_ASSET_CLASS[category];
    }

    // Try partial match
    for (const [key, value] of Object.entries(CATEGORY_TO_ASSET_CLASS)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // Default based on keywords
    const lower = category.toLowerCase();
    if (lower.includes('equity') || lower.includes('cap')) return 'equity';
    if (lower.includes('debt') || lower.includes('bond') || lower.includes('gilt')) return 'debt';
    if (lower.includes('liquid') || lower.includes('money') || lower.includes('overnight')) return 'liquid';
    if (lower.includes('hybrid') || lower.includes('balanced')) return 'hybrid';
    if (lower.includes('gold')) return 'gold';
    if (lower.includes('international') || lower.includes('overseas') || lower.includes('global')) return 'international';

    return 'equity'; // Default
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Cleanup old entries if cache gets too large
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > CACHE_DURATION) {
          this.cache.delete(k);
        }
      }
    }
  }
}
