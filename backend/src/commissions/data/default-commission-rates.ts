export interface DefaultRate {
  amcShortName: string
  schemeCategory: string
  trailRatePercent: number
  upfrontRatePercent: number
}

// Industry-standard trail commission rates by AMC and SEBI L2 category
// These are typical Regular plan trail rates for MFDs in India
export const DEFAULT_COMMISSION_RATES: DefaultRate[] = [
  // ── HDFC Mutual Fund ──
  { amcShortName: 'HDFC', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.75, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Equity - Large & Mid Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Equity - Multi Cap', trailRatePercent: 0.90, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Equity - Sectoral/Thematic', trailRatePercent: 0.90, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.10, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Debt - Short Duration', trailRatePercent: 0.25, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Debt - Medium Duration', trailRatePercent: 0.35, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Debt - Corporate Bond', trailRatePercent: 0.30, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.65, upfrontRatePercent: 0 },
  { amcShortName: 'HDFC', schemeCategory: 'Hybrid - Aggressive', trailRatePercent: 0.75, upfrontRatePercent: 0 },

  // ── SBI Mutual Fund ──
  { amcShortName: 'SBI', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.70, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 0.95, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Equity - Large & Mid Cap', trailRatePercent: 0.80, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Equity - Sectoral/Thematic', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.08, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Debt - Short Duration', trailRatePercent: 0.20, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Debt - Corporate Bond', trailRatePercent: 0.25, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.60, upfrontRatePercent: 0 },
  { amcShortName: 'SBI', schemeCategory: 'Hybrid - Aggressive', trailRatePercent: 0.70, upfrontRatePercent: 0 },

  // ── ICICI Prudential ──
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.70, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 0.95, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.80, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Equity - ELSS', trailRatePercent: 0.95, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Equity - Sectoral/Thematic', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.10, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Debt - Short Duration', trailRatePercent: 0.25, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.65, upfrontRatePercent: 0 },
  { amcShortName: 'ICICI Prudential', schemeCategory: 'Hybrid - Aggressive', trailRatePercent: 0.70, upfrontRatePercent: 0 },

  // ── Axis Mutual Fund ──
  { amcShortName: 'Axis', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.75, upfrontRatePercent: 0 },
  { amcShortName: 'Axis', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Axis', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.10, upfrontRatePercent: 0 },
  { amcShortName: 'Axis', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'Axis', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Axis', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.10, upfrontRatePercent: 0 },
  { amcShortName: 'Axis', schemeCategory: 'Debt - Short Duration', trailRatePercent: 0.25, upfrontRatePercent: 0 },
  { amcShortName: 'Axis', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.65, upfrontRatePercent: 0 },

  // ── Kotak Mutual Fund ──
  { amcShortName: 'Kotak', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.70, upfrontRatePercent: 0 },
  { amcShortName: 'Kotak', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 0.95, upfrontRatePercent: 0 },
  { amcShortName: 'Kotak', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Kotak', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.80, upfrontRatePercent: 0 },
  { amcShortName: 'Kotak', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Kotak', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.08, upfrontRatePercent: 0 },
  { amcShortName: 'Kotak', schemeCategory: 'Debt - Short Duration', trailRatePercent: 0.20, upfrontRatePercent: 0 },
  { amcShortName: 'Kotak', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.60, upfrontRatePercent: 0 },

  // ── Nippon India (Reliance) ──
  { amcShortName: 'Nippon India', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.75, upfrontRatePercent: 0 },
  { amcShortName: 'Nippon India', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Nippon India', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.10, upfrontRatePercent: 0 },
  { amcShortName: 'Nippon India', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'Nippon India', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Nippon India', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.10, upfrontRatePercent: 0 },
  { amcShortName: 'Nippon India', schemeCategory: 'Debt - Short Duration', trailRatePercent: 0.25, upfrontRatePercent: 0 },
  { amcShortName: 'Nippon India', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.65, upfrontRatePercent: 0 },

  // ── Aditya Birla Sun Life ──
  { amcShortName: 'ABSL', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.70, upfrontRatePercent: 0 },
  { amcShortName: 'ABSL', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 0.95, upfrontRatePercent: 0 },
  { amcShortName: 'ABSL', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'ABSL', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'ABSL', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'ABSL', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.10, upfrontRatePercent: 0 },
  { amcShortName: 'ABSL', schemeCategory: 'Debt - Short Duration', trailRatePercent: 0.25, upfrontRatePercent: 0 },
  { amcShortName: 'ABSL', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.65, upfrontRatePercent: 0 },

  // ── DSP Mutual Fund ──
  { amcShortName: 'DSP', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.75, upfrontRatePercent: 0 },
  { amcShortName: 'DSP', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'DSP', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.05, upfrontRatePercent: 0 },
  { amcShortName: 'DSP', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'DSP', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'DSP', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.10, upfrontRatePercent: 0 },
  { amcShortName: 'DSP', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.65, upfrontRatePercent: 0 },

  // ── Tata Mutual Fund ──
  { amcShortName: 'Tata', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.75, upfrontRatePercent: 0 },
  { amcShortName: 'Tata', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Tata', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.05, upfrontRatePercent: 0 },
  { amcShortName: 'Tata', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'Tata', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Tata', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.10, upfrontRatePercent: 0 },
  { amcShortName: 'Tata', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.60, upfrontRatePercent: 0 },

  // ── UTI Mutual Fund ──
  { amcShortName: 'UTI', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.70, upfrontRatePercent: 0 },
  { amcShortName: 'UTI', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 0.95, upfrontRatePercent: 0 },
  { amcShortName: 'UTI', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.80, upfrontRatePercent: 0 },
  { amcShortName: 'UTI', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'UTI', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.08, upfrontRatePercent: 0 },
  { amcShortName: 'UTI', schemeCategory: 'Hybrid - Balanced Advantage', trailRatePercent: 0.60, upfrontRatePercent: 0 },

  // ── Mirae Asset ──
  { amcShortName: 'Mirae Asset', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.70, upfrontRatePercent: 0 },
  { amcShortName: 'Mirae Asset', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 0.95, upfrontRatePercent: 0 },
  { amcShortName: 'Mirae Asset', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.80, upfrontRatePercent: 0 },
  { amcShortName: 'Mirae Asset', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Mirae Asset', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.08, upfrontRatePercent: 0 },
  { amcShortName: 'Mirae Asset', schemeCategory: 'Hybrid - Aggressive', trailRatePercent: 0.70, upfrontRatePercent: 0 },

  // ── Motilal Oswal ──
  { amcShortName: 'Motilal Oswal', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.75, upfrontRatePercent: 0 },
  { amcShortName: 'Motilal Oswal', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Motilal Oswal', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'Motilal Oswal', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },

  // ── PPFAS ──
  { amcShortName: 'PPFAS', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.55, upfrontRatePercent: 0 },
  { amcShortName: 'PPFAS', schemeCategory: 'Equity - ELSS', trailRatePercent: 0.70, upfrontRatePercent: 0 },

  // ── Quant Mutual Fund ──
  { amcShortName: 'Quant', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.80, upfrontRatePercent: 0 },
  { amcShortName: 'Quant', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.05, upfrontRatePercent: 0 },
  { amcShortName: 'Quant', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.15, upfrontRatePercent: 0 },
  { amcShortName: 'Quant', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.90, upfrontRatePercent: 0 },
  { amcShortName: 'Quant', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.10, upfrontRatePercent: 0 },

  // ── Canara Robeco ──
  { amcShortName: 'Canara Robeco', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.75, upfrontRatePercent: 0 },
  { amcShortName: 'Canara Robeco', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Canara Robeco', schemeCategory: 'Equity - Small Cap', trailRatePercent: 1.05, upfrontRatePercent: 0 },
  { amcShortName: 'Canara Robeco', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'Canara Robeco', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },

  // ── Bandhan (IDFC) ──
  { amcShortName: 'Bandhan', schemeCategory: 'Equity - Large Cap', trailRatePercent: 0.75, upfrontRatePercent: 0 },
  { amcShortName: 'Bandhan', schemeCategory: 'Equity - Mid Cap', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Bandhan', schemeCategory: 'Equity - Flexi Cap', trailRatePercent: 0.85, upfrontRatePercent: 0 },
  { amcShortName: 'Bandhan', schemeCategory: 'Equity - ELSS', trailRatePercent: 1.00, upfrontRatePercent: 0 },
  { amcShortName: 'Bandhan', schemeCategory: 'Debt - Liquid', trailRatePercent: 0.10, upfrontRatePercent: 0 },
]
