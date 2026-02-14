import { Injectable, Logger } from '@nestjs/common';

/**
 * MFAPI.in - Free Indian Mutual Fund API
 * Docs: https://www.mfapi.in/
 *
 * Used only for historical NAV backfill via getFundDetails().
 */

const MFAPI_BASE_URL = 'https://api.mfapi.in/mf';

// Cache duration in milliseconds
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

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

@Injectable()
export class MfApiService {
  private readonly logger = new Logger(MfApiService.name);

  // Simple in-memory cache
  private cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * Get detailed fund information including NAV history.
   * Used by BackfillService to fetch historical NAV data.
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
