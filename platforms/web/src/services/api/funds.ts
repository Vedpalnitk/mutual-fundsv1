/**
 * Funds API — liveFundsApi, mfApi, dbFundsApi
 */
import { request } from '../api'

// ============= Live Funds API =============

export interface LiveFundScheme {
  schemeCode: number;
  schemeName: string;
}

export interface LiveFundWithMetrics {
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
  // Risk data from Kuvera
  isin?: string;
  riskRating?: number;      // 1-5 scale
  crisilRating?: string;    // Original CRISIL text
  volatility?: number;      // Percentage
  // Additional Kuvera data
  fundRating?: number;      // Star rating 1-5
  expenseRatio?: number;    // TER percentage
  aum?: number;             // Assets Under Management in Crores
  fundManager?: string;     // Fund manager name
}

export const liveFundsApi = {
  search: (query: string, directOnly = true, growthOnly = true) => {
    const params = new URLSearchParams({ q: query });
    if (directOnly) params.append('direct_only', 'true');
    if (growthOnly) params.append('growth_only', 'true');
    return request<LiveFundScheme[]>(`/api/v1/funds/live/search?${params.toString()}`);
  },
  getPopular: () => request<LiveFundWithMetrics[]>('/api/v1/funds/live/popular'),
  // Get funds by category with full metrics (large_cap, mid_cap, small_cap, flexi_cap, elss, hybrid, debt, liquid, index, sectoral, international, gold)
  getByCategory: (category: string, limit = 20) =>
    request<LiveFundWithMetrics[]>(`/api/v1/funds/live/category/${encodeURIComponent(category)}?limit=${limit}`),
  // Search by category name (returns basic scheme info)
  searchByCategory: (category: string, limit = 10) =>
    request<LiveFundScheme[]>(`/api/v1/funds/live/search-category/${encodeURIComponent(category)}?limit=${limit}`),
  getDetails: (schemeCode: number) =>
    request<LiveFundWithMetrics>(`/api/v1/funds/live/${schemeCode}`),
  getBatchDetails: (schemeCodes: number[]) =>
    request<LiveFundWithMetrics[]>(`/api/v1/funds/live/batch/details?codes=${schemeCodes.join(',')}`),
};

// ============= Direct MFAPI.in API (for NAV history) =============

export interface NavDataPoint {
  date: string;  // DD-MM-YYYY format from MFAPI.in
  nav: string;   // NAV as string from API
}

export interface FundNavHistory {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: NavDataPoint[];
  status: string;
}

export const mfApi = {
  getNavHistory: async (schemeCode: number): Promise<FundNavHistory> => {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!res.ok) throw new Error('Failed to fetch NAV history');
    return res.json();
  }
};

// ============= Database-Backed Funds API (New Single Source of Truth) =============

// Raw API response format (snake_case from backend)
interface RawDatabaseFund {
  scheme_code: number;
  scheme_name: string;
  fund_house: string;
  category: string;
  sub_category?: string;
  asset_class: string;
  nav?: number;
  nav_date?: string;
  day_change?: number;
  day_change_percent?: number;
  return_1m?: number;
  return_3m?: number;
  return_6m?: number;
  return_1y?: number;
  return_3y?: number;
  return_5y?: number;
  risk_rating?: number;
  fund_rating?: number;
  expense_ratio?: number;
  aum?: number;
  fund_manager?: string;
  benchmark?: string;
  min_investment?: number;
  min_sip_amount?: number;
  exit_load?: string;
  launch_date?: string;
  volatility?: number;
  sharpe_ratio?: number;
  beta?: number;
  alpha?: number;
  sortino?: number;
  max_drawdown?: number;
  top_holdings?: { name: string; percentage: number }[];
}

// Normalized format for frontend use (camelCase)
export interface DatabaseFund {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  subCategory?: string;
  assetClass: string;
  currentNav: number;
  navDate?: string;
  dayChange: number;
  dayChangePercent: number;
  return1M?: number;
  return3M?: number;
  return6M?: number;
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  riskRating?: number;
  fundRating?: number;
  expenseRatio?: number;
  aum?: number;
  fundManager?: string;
  benchmark?: string;
  minInvestment?: number;
  minSipAmount?: number;
  exitLoad?: string;
  launchDate?: string;
  volatility?: number;
  sharpeRatio?: number;
  beta?: number;
  alpha?: number;
  sortino?: number;
  maxDrawdown?: number;
  topHoldings?: { name: string; percentage: number }[];
}

// Transform snake_case to camelCase
function transformFund(raw: RawDatabaseFund): DatabaseFund {
  return {
    schemeCode: raw.scheme_code,
    schemeName: raw.scheme_name,
    fundHouse: raw.fund_house,
    category: raw.category,
    subCategory: raw.sub_category,
    assetClass: raw.asset_class,
    currentNav: raw.nav || 0,
    navDate: raw.nav_date,
    dayChange: raw.day_change || 0,
    dayChangePercent: raw.day_change_percent || 0,
    return1M: raw.return_1m,
    return3M: raw.return_3m,
    return6M: raw.return_6m,
    return1Y: raw.return_1y,
    return3Y: raw.return_3y,
    return5Y: raw.return_5y,
    riskRating: raw.risk_rating,
    fundRating: raw.fund_rating,
    expenseRatio: raw.expense_ratio,
    aum: raw.aum,
    fundManager: raw.fund_manager,
    benchmark: raw.benchmark,
    minInvestment: raw.min_investment,
    minSipAmount: raw.min_sip_amount,
    exitLoad: raw.exit_load,
    launchDate: raw.launch_date,
    volatility: raw.volatility,
    sharpeRatio: raw.sharpe_ratio,
    beta: raw.beta,
    alpha: raw.alpha,
    sortino: raw.sortino,
    maxDrawdown: raw.max_drawdown,
    topHoldings: raw.top_holdings,
  };
}

export interface FundsStatsResponse {
  total: number;
  byAssetClass: Record<string, number>;
  byCategory: Record<string, number>;
}

export const dbFundsApi = {
  // Get all funds from database (single source of truth)
  getAllFunds: async (): Promise<DatabaseFund[]> => {
    const response = await request<{ funds: RawDatabaseFund[] }>('/api/v1/funds/live/ml/funds');
    return response.funds.map(transformFund);
  },

  // Get fund statistics
  getStats: () =>
    request<FundsStatsResponse>('/api/v1/funds/live/ml/funds/stats'),

  // Get single fund by scheme code
  getFund: async (schemeCode: number): Promise<DatabaseFund | null> => {
    try {
      const response = await request<{ fund: RawDatabaseFund }>(`/api/v1/funds/live/ml/funds/${schemeCode}`);
      return response.fund ? transformFund(response.fund) : null;
    } catch {
      return null;
    }
  },

  // Get multiple funds by scheme codes
  getBatchFunds: async (schemeCodes: number[]): Promise<DatabaseFund[]> => {
    const response = await request<{ funds: RawDatabaseFund[] }>(`/api/v1/funds/live/ml/funds/batch?codes=${schemeCodes.join(',')}`);
    return response.funds.map(transformFund);
  },

  // Search funds by name/AMC
  searchFunds: async (query: string): Promise<DatabaseFund[]> => {
    // Append "Direct Growth" to search for direct plans by default
    const searchQuery = query.toLowerCase().includes('direct') ? query : `${query} Direct Growth`;
    const response = await request<Array<{ schemeCode: number; schemeName: string }>>(`/api/v1/funds/live/search?q=${encodeURIComponent(searchQuery)}`);
    // Transform MFAPI response to DatabaseFund format
    return response.map(fund => ({
      schemeCode: fund.schemeCode,
      schemeName: fund.schemeName,
      fundHouse: fund.schemeName.split(' ')[0] || '',
      category: '',
      subCategory: '',
      assetClass: '',
      currentNav: 0,
      dayChange: 0,
      dayChangePercent: 0,
    }));
  },
};
