/**
 * Maps ONDC L3 category IDs to SEBI-standard benchmark Total Return Index (TRI).
 * Used by SchemeEnrichmentService to populate Scheme.benchmark.
 *
 * Source: SEBI circular on Benchmarking of Mutual Fund Schemes (Oct 2022)
 */
export const CATEGORY_BENCHMARK_MAP: Record<string, string> = {
  // Equity
  'L3-LARGE_CAP': 'NIFTY 100 TRI',
  'L3-LARGE_MID_CAP': 'NIFTY LargeMidcap 250 TRI',
  'L3-MID_CAP': 'Nifty Midcap 150 TRI',
  'L3-SMALL_CAP': 'Nifty Smallcap 250 TRI',
  'L3-MULTI_CAP': 'Nifty 500 Multicap 50:25:25 TRI',
  'L3-FLEXI_CAP': 'NIFTY 500 TRI',
  'L3-FOCUSED': 'NIFTY 500 TRI',
  'L3-ELSS': 'NIFTY 500 TRI',
  'L3-VALUE': 'NIFTY 500 Value 50 TRI',
  'L3-CONTRA': 'NIFTY 500 TRI',
  'L3-DIVIDEND_YIELD': 'Nifty Dividend Opportunities 50 TRI',
  'L3-SECTORAL': 'NIFTY 500 TRI',

  // Debt
  'L3-OVERNIGHT': 'CRISIL Overnight Index',
  'L3-LIQUID': 'CRISIL Liquid Fund AI Index',
  'L3-ULTRA_SHORT': 'CRISIL Ultra Short Term Debt Index',
  'L3-LOW_DURATION': 'CRISIL Low Duration Debt Index',
  'L3-MONEY_MARKET': 'CRISIL Money Market Index',
  'L3-SHORT_DURATION': 'CRISIL Short Term Bond Fund AI Index',
  'L3-MEDIUM_DURATION': 'CRISIL Medium Term Debt Index',
  'L3-MEDIUM_LONG_DURATION': 'CRISIL Medium to Long Term Debt Index',
  'L3-LONG_DURATION': 'CRISIL Long Term Debt Index',
  'L3-DYNAMIC_BOND': 'CRISIL Composite Bond Fund Index',
  'L3-CORPORATE_BOND': 'CRISIL Corporate Bond Fund AIII Index',
  'L3-CREDIT_RISK': 'CRISIL Medium Term Debt Index',
  'L3-BANKING_PSU': 'CRISIL Banking and PSU Debt Index',
  'L3-GILT': 'CRISIL Dynamic Gilt Index',
  'L3-GILT_10Y': 'CRISIL 10 Year Gilt Index',
  'L3-FLOATER': 'CRISIL Low Duration Debt Index',

  // Hybrid
  'L3-CONSERVATIVE_HYBRID': 'CRISIL Hybrid 85+15 Conservative Index',
  'L3-BALANCED_HYBRID': 'NIFTY 50 Hybrid Composite Debt 50:50 Index',
  'L3-AGGRESSIVE_HYBRID': 'CRISIL Hybrid 35+65 Aggressive Index',
  'L3-DYNAMIC_ALLOCATION': 'NIFTY 50 Hybrid Composite Debt 50:50 Index',
  'L3-MULTI_ASSET': 'NIFTY 500 TRI',
  'L3-ARBITRAGE': 'NIFTY 50 Arbitrage Index',
  'L3-EQUITY_SAVINGS': 'NIFTY Equity Savings Index',

  // Solution Oriented
  'L3-RETIREMENT': 'NIFTY 500 TRI',
  'L3-CHILDRENS': 'NIFTY 500 TRI',

  // Other
  'L3-INDEX': '', // Inferred from scheme name at enrichment time
  'L3-FOF_OVERSEAS': 'MSCI ACWI TRI',
  'L3-FOF_DOMESTIC': 'NIFTY 500 TRI',
  'L3-GOLD': 'Domestic Price of Gold',
  'L3-OTHER': '',
}

/**
 * Default risk rating (1-5) by ONDC L3 category.
 * Used as fallback when volatility-based risk rating is unavailable
 * (e.g., insufficient NAV history for metrics calculation).
 *
 * Scale: 1=Low Risk, 2=Moderately Low, 3=Moderate, 4=Moderately High, 5=Very High
 * Source: SEBI Riskometer classification guidelines
 */
export const CATEGORY_RISK_MAP: Record<string, number> = {
  // Equity — generally higher risk
  'L3-LARGE_CAP': 4,
  'L3-LARGE_MID_CAP': 4,
  'L3-MID_CAP': 5,
  'L3-SMALL_CAP': 5,
  'L3-MULTI_CAP': 4,
  'L3-FLEXI_CAP': 4,
  'L3-FOCUSED': 4,
  'L3-ELSS': 4,
  'L3-VALUE': 4,
  'L3-CONTRA': 4,
  'L3-DIVIDEND_YIELD': 4,
  'L3-SECTORAL': 5,

  // Debt — generally lower risk
  'L3-OVERNIGHT': 1,
  'L3-LIQUID': 1,
  'L3-ULTRA_SHORT': 2,
  'L3-LOW_DURATION': 2,
  'L3-MONEY_MARKET': 1,
  'L3-SHORT_DURATION': 2,
  'L3-MEDIUM_DURATION': 3,
  'L3-MEDIUM_LONG_DURATION': 3,
  'L3-LONG_DURATION': 3,
  'L3-DYNAMIC_BOND': 3,
  'L3-CORPORATE_BOND': 2,
  'L3-CREDIT_RISK': 3,
  'L3-BANKING_PSU': 2,
  'L3-GILT': 3,
  'L3-GILT_10Y': 3,
  'L3-FLOATER': 2,

  // Hybrid — moderate risk
  'L3-CONSERVATIVE_HYBRID': 2,
  'L3-BALANCED_HYBRID': 3,
  'L3-AGGRESSIVE_HYBRID': 4,
  'L3-DYNAMIC_ALLOCATION': 3,
  'L3-MULTI_ASSET': 3,
  'L3-ARBITRAGE': 1,
  'L3-EQUITY_SAVINGS': 3,

  // Solution Oriented
  'L3-RETIREMENT': 4,
  'L3-CHILDRENS': 4,

  // Other
  'L3-INDEX': 4,
  'L3-FOF_OVERSEAS': 5,
  'L3-FOF_DOMESTIC': 3,
  'L3-GOLD': 3,
  'L3-OTHER': 3,
}
