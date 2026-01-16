export type RiskBand = 'Low' | 'Moderate' | 'Elevated' | 'High';

export type MutualFundHolding = {
  name: string;
  allocation: number;
  sector: string;
};

export type MutualFund = {
  id: string;
  name: string;
  fundHouse: string;
  category: string;
  subCategory: string;
  risk: RiskBand;
  aumCr: number;
  expenseRatio: number;
  exitLoad: string;
  minSip: number;
  minLumpSum: number;
  returns1y: number;
  returns3y: number;
  returns5y: number;
  benchmark: string;
  manager: string;
  inception: string;
  description: string;
  holdings: MutualFundHolding[];
  performance: { date: string; value: number }[];
};

export type InvestorProfile = {
  fullName: string;
  age: number;
  city: string;
  profession: string;
  annualIncome: number;
  dependents: number;
  monthlySip: number;
  lumpSumCapacity: number;
  timeHorizonYears: number;
  liquidityNeeds: 'Low' | 'Medium' | 'High';
  riskTolerance: 'Conservative' | 'Moderate' | 'Growth' | 'Aggressive';
  investmentKnowledge: 'Beginner' | 'Intermediate' | 'Advanced';
  volatilityComfort: 'Low' | 'Medium' | 'High';
  taxBracket: '5%' | '10%' | '20%' | '30%';
  goal: {
    name: string;
    targetAmount: number;
    targetYear: number;
    priority: 'Core' | 'Aspirational';
  };
  existingExposure: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
};

export type PersonaProfile = {
  name: string;
  description: string;
  riskBand: 'Balanced Growth' | 'Accelerated Growth' | 'Capital Preservation';
  behaviorSignals: string[];
  allocationBias: {
    equity: number;
    debt: number;
    hybrid: number;
    alternatives: number;
  };
};

export type InvestorProfileSummary = {
  id: string;
  name: string;
  persona: string;
  riskTolerance: string;
  horizonYears: number;
  monthlySip: number;
  goal: string;
  status: 'Active' | 'Review';
};

export const investorProfile: InvestorProfile = {
  fullName: 'Aarav Mehta',
  age: 29,
  city: 'Bengaluru',
  profession: 'Product Manager',
  annualIncome: 1650000,
  dependents: 1,
  monthlySip: 32000,
  lumpSumCapacity: 200000,
  timeHorizonYears: 12,
  liquidityNeeds: 'Low',
  riskTolerance: 'Aggressive',
  investmentKnowledge: 'Intermediate',
  volatilityComfort: 'High',
  taxBracket: '30%',
  goal: {
    name: 'Wealth Accumulation + Home Upgrade',
    targetAmount: 8500000,
    targetYear: 2036,
    priority: 'Core'
  },
  existingExposure: {
    equity: 62,
    debt: 18,
    gold: 8,
    cash: 12
  }
};

export const personaProfile: PersonaProfile = {
  name: 'Accelerated Builder',
  description:
    'Long horizon, high income stability, and strong volatility tolerance place this investor in an aggressive growth band with equity-heavy bias.',
  riskBand: 'Accelerated Growth',
  behaviorSignals: [
    'Age under 32 with a 10+ year horizon',
    'High SIP capacity relative to income',
    'Comfortable with interim drawdowns for long-term upside',
    'Goal prioritizes wealth compounding over near-term liquidity'
  ],
  allocationBias: {
    equity: 75,
    debt: 15,
    hybrid: 8,
    alternatives: 2
  }
};

export const personaProfiles: PersonaProfile[] = [
  {
    name: 'Capital Guardian',
    description:
      'Shorter horizon with higher liquidity needs. Focused on capital stability and drawdown protection.',
    riskBand: 'Capital Preservation',
    behaviorSignals: [
      'Horizon under 5 years',
      'Liquidity needs marked high',
      'Prefers predictability over upside capture'
    ],
    allocationBias: {
      equity: 30,
      debt: 55,
      hybrid: 12,
      alternatives: 3
    }
  },
  {
    name: 'Balanced Voyager',
    description:
      'Mid-term goals with steady cash flow. Balanced across equity and debt to smooth volatility.',
    riskBand: 'Balanced Growth',
    behaviorSignals: [
      'Horizon between 5-9 years',
      'Moderate risk tolerance and drawdown comfort',
      'Goal priorities split between growth and stability'
    ],
    allocationBias: {
      equity: 55,
      debt: 30,
      hybrid: 12,
      alternatives: 3
    }
  },
  {
    name: 'Accelerated Builder',
    description:
      'Long horizon, high income stability, and strong volatility tolerance place this investor in an aggressive growth band with equity-heavy bias.',
    riskBand: 'Accelerated Growth',
    behaviorSignals: [
      'Age under 32 with a 10+ year horizon',
      'High SIP capacity relative to income',
      'Comfortable with interim drawdowns for long-term upside',
      'Goal prioritizes wealth compounding over near-term liquidity'
    ],
    allocationBias: {
      equity: 75,
      debt: 15,
      hybrid: 8,
      alternatives: 2
    }
  }
];

export const investorProfiles: InvestorProfileSummary[] = [
  {
    id: 'inv-001',
    name: 'Aarav Mehta',
    persona: 'Accelerated Builder',
    riskTolerance: 'Aggressive',
    horizonYears: 12,
    monthlySip: 32000,
    goal: 'Wealth Accumulation + Home Upgrade',
    status: 'Active'
  },
  {
    id: 'inv-002',
    name: 'Sana Iyer',
    persona: 'Balanced Voyager',
    riskTolerance: 'Moderate',
    horizonYears: 7,
    monthlySip: 18000,
    goal: 'Child education fund',
    status: 'Active'
  },
  {
    id: 'inv-003',
    name: 'Rajiv Khanna',
    persona: 'Capital Guardian',
    riskTolerance: 'Conservative',
    horizonYears: 4,
    monthlySip: 12000,
    goal: 'Capital protection for retirement',
    status: 'Review'
  },
  {
    id: 'inv-004',
    name: 'Priya Sharma',
    persona: 'Accelerated Builder',
    riskTolerance: 'Aggressive',
    horizonYears: 15,
    monthlySip: 45000,
    goal: 'Early retirement corpus',
    status: 'Active'
  },
  {
    id: 'inv-005',
    name: 'Vikram Patel',
    persona: 'Balanced Voyager',
    riskTolerance: 'Moderate',
    horizonYears: 8,
    monthlySip: 25000,
    goal: 'Dream home down payment',
    status: 'Active'
  },
  {
    id: 'inv-006',
    name: 'Ananya Reddy',
    persona: 'Capital Guardian',
    riskTolerance: 'Conservative',
    horizonYears: 3,
    monthlySip: 15000,
    goal: 'Emergency fund building',
    status: 'Active'
  },
  {
    id: 'inv-007',
    name: 'Karthik Nair',
    persona: 'Accelerated Builder',
    riskTolerance: 'Growth',
    horizonYears: 10,
    monthlySip: 35000,
    goal: 'Children higher education abroad',
    status: 'Active'
  },
  {
    id: 'inv-008',
    name: 'Meera Gupta',
    persona: 'Balanced Voyager',
    riskTolerance: 'Moderate',
    horizonYears: 6,
    monthlySip: 20000,
    goal: 'Wedding expenses fund',
    status: 'Review'
  },
  {
    id: 'inv-009',
    name: 'Arjun Singh',
    persona: 'Capital Guardian',
    riskTolerance: 'Conservative',
    horizonYears: 2,
    monthlySip: 8000,
    goal: 'Short-term savings goal',
    status: 'Active'
  },
  {
    id: 'inv-010',
    name: 'Deepika Joshi',
    persona: 'Accelerated Builder',
    riskTolerance: 'Aggressive',
    horizonYears: 20,
    monthlySip: 50000,
    goal: 'Generational wealth creation',
    status: 'Active'
  },
  {
    id: 'inv-011',
    name: 'Rahul Verma',
    persona: 'Balanced Voyager',
    riskTolerance: 'Growth',
    horizonYears: 9,
    monthlySip: 28000,
    goal: 'Business expansion fund',
    status: 'Active'
  },
  {
    id: 'inv-012',
    name: 'Sneha Kulkarni',
    persona: 'Capital Guardian',
    riskTolerance: 'Conservative',
    horizonYears: 5,
    monthlySip: 10000,
    goal: 'Car purchase fund',
    status: 'Review'
  },
  {
    id: 'inv-013',
    name: 'Aditya Rao',
    persona: 'Accelerated Builder',
    riskTolerance: 'Aggressive',
    horizonYears: 18,
    monthlySip: 40000,
    goal: 'Financial independence',
    status: 'Active'
  },
  {
    id: 'inv-014',
    name: 'Kavitha Menon',
    persona: 'Balanced Voyager',
    riskTolerance: 'Moderate',
    horizonYears: 7,
    monthlySip: 22000,
    goal: 'Vacation home purchase',
    status: 'Active'
  },
  {
    id: 'inv-015',
    name: 'Suresh Kumar',
    persona: 'Capital Guardian',
    riskTolerance: 'Conservative',
    horizonYears: 3,
    monthlySip: 12000,
    goal: 'Medical emergency fund',
    status: 'Active'
  },
  {
    id: 'inv-016',
    name: 'Nisha Agarwal',
    persona: 'Accelerated Builder',
    riskTolerance: 'Growth',
    horizonYears: 14,
    monthlySip: 38000,
    goal: 'Startup investment corpus',
    status: 'Active'
  },
  {
    id: 'inv-017',
    name: 'Manish Tiwari',
    persona: 'Balanced Voyager',
    riskTolerance: 'Moderate',
    horizonYears: 6,
    monthlySip: 16000,
    goal: 'Home renovation fund',
    status: 'Review'
  },
  {
    id: 'inv-018',
    name: 'Pooja Desai',
    persona: 'Capital Guardian',
    riskTolerance: 'Conservative',
    horizonYears: 4,
    monthlySip: 14000,
    goal: 'Debt repayment fund',
    status: 'Active'
  },
  {
    id: 'inv-019',
    name: 'Siddharth Malhotra',
    persona: 'Accelerated Builder',
    riskTolerance: 'Aggressive',
    horizonYears: 16,
    monthlySip: 55000,
    goal: 'Multiple property investments',
    status: 'Active'
  },
  {
    id: 'inv-020',
    name: 'Ritu Saxena',
    persona: 'Balanced Voyager',
    riskTolerance: 'Growth',
    horizonYears: 8,
    monthlySip: 24000,
    goal: 'Sabbatical travel fund',
    status: 'Active'
  },
  {
    id: 'inv-021',
    name: 'Gaurav Bhatt',
    persona: 'Capital Guardian',
    riskTolerance: 'Conservative',
    horizonYears: 2,
    monthlySip: 9000,
    goal: 'Tax saving investments',
    status: 'Active'
  },
  {
    id: 'inv-022',
    name: 'Anjali Kapoor',
    persona: 'Accelerated Builder',
    riskTolerance: 'Aggressive',
    horizonYears: 12,
    monthlySip: 42000,
    goal: 'Passive income generation',
    status: 'Review'
  },
  {
    id: 'inv-023',
    name: 'Vivek Srinivasan',
    persona: 'Balanced Voyager',
    riskTolerance: 'Moderate',
    horizonYears: 10,
    monthlySip: 30000,
    goal: 'Parents healthcare fund',
    status: 'Active'
  },
  {
    id: 'inv-024',
    name: 'Shreya Banerjee',
    persona: 'Capital Guardian',
    riskTolerance: 'Conservative',
    horizonYears: 5,
    monthlySip: 11000,
    goal: 'Education loan prepayment',
    status: 'Active'
  },
  {
    id: 'inv-025',
    name: 'Nikhil Chauhan',
    persona: 'Accelerated Builder',
    riskTolerance: 'Growth',
    horizonYears: 11,
    monthlySip: 36000,
    goal: 'Tech startup investment',
    status: 'Active'
  }
];

export const personaRules = [
  {
    label: 'Age & horizon',
    detail: 'Investors below 35 with a 10+ year horizon are routed to growth-oriented personas unless liquidity needs are high.'
  },
  {
    label: 'Cash-flow resilience',
    detail: 'Stable income and 6+ months emergency coverage allow equity tilts above 65% without breaching risk guardrails.'
  },
  {
    label: 'Drawdown tolerance',
    detail: 'Self-reported comfort with 20-30% drawdowns increases allocation to flexi-cap and mid-cap funds.'
  },
  {
    label: 'Goal urgency',
    detail: 'Goals under 5 years trigger capital preservation mode with >55% debt and short-duration exposure.'
  }
];

export const engineModules = [
  {
    title: 'Risk capacity scoring',
    detail: 'Combines age, horizon, and liquidity buffer to establish safe equity limits.'
  },
  {
    title: 'Goal optimizer',
    detail: 'Maps SIP and lump-sum plans to target amount with volatility constraints.'
  },
  {
    title: 'Tax efficiency layer',
    detail: 'Optimizes ELSS and debt allocations based on tax bracket and goal priority.'
  },
  {
    title: 'Fund fit ranking',
    detail: 'Ranks funds by category quality, expense ratio, and consistency versus benchmark.'
  }
];

export const portfolioProjection = [100, 108, 117, 129, 142, 156, 171, 189, 208, 229, 251, 276, 304];

export const portfolioSummary = {
  projectedValue: 8600000,
  expectedCagr: 13.2,
  confidence: 'High',
  goalGap: -2.4
};

export const profileHighlights = [
  { label: 'Investor profile', value: 'Aggressive · Intermediate' },
  { label: 'Goal horizon', value: '12 years · Core goal' },
  { label: 'Monthly SIP', value: '₹32,000' },
  { label: 'Liquidity needs', value: 'Low' }
];

export const recommendedAllocation = [
  { label: 'Equity funds', value: 70, note: 'Flexi + large cap core' },
  { label: 'Mid/Small cap', value: 12, note: 'Satellite growth' },
  { label: 'Debt funds', value: 15, note: 'Stability + rebalancing buffer' },
  { label: 'Alternatives', value: 3, note: 'Gold + global' }
];

export const recommendedFunds = [
  {
    id: 'quant-flexi-cap',
    name: 'Quant Flexi Cap Fund (Direct)',
    category: 'Equity',
    subCategory: 'Flexi Cap',
    risk: 'High',
    returns3y: 24.3,
    returns5y: 18.4,
    allocation: 26,
    minSip: 1000
  },
  {
    id: 'parag-parikh-flexi',
    name: 'Parag Parikh Flexi Cap Fund (Direct)',
    category: 'Equity',
    subCategory: 'Flexi Cap',
    risk: 'Moderate',
    returns3y: 18.9,
    returns5y: 16.2,
    allocation: 18,
    minSip: 1000
  },
  {
    id: 'hdfc-mid-cap',
    name: 'HDFC Mid-Cap Opportunities (Direct)',
    category: 'Equity',
    subCategory: 'Mid Cap',
    risk: 'High',
    returns3y: 27.6,
    returns5y: 20.3,
    allocation: 12,
    minSip: 1000
  },
  {
    id: 'sbi-magnum-income',
    name: 'SBI Magnum Income Fund (Direct)',
    category: 'Debt',
    subCategory: 'Corporate Bond',
    risk: 'Moderate',
    returns3y: 7.4,
    returns5y: 7.2,
    allocation: 12,
    minSip: 500
  },
  {
    id: 'icici-short-term',
    name: 'ICICI Prudential Short Term Fund (Direct)',
    category: 'Debt',
    subCategory: 'Short Duration',
    risk: 'Low',
    returns3y: 6.8,
    returns5y: 6.9,
    allocation: 8,
    minSip: 500
  },
  {
    id: 'kotak-equity-hybrid',
    name: 'Kotak Equity Hybrid Fund (Direct)',
    category: 'Hybrid',
    subCategory: 'Aggressive Hybrid',
    risk: 'Moderate',
    returns3y: 14.2,
    returns5y: 12.6,
    allocation: 14,
    minSip: 1000
  },
  {
    id: 'sbi-gold',
    name: 'SBI Gold Fund (Direct)',
    category: 'Alternatives',
    subCategory: 'Gold',
    risk: 'Moderate',
    returns3y: 9.1,
    returns5y: 7.8,
    allocation: 4,
    minSip: 500
  },
  {
    id: 'motilal-nifty50',
    name: 'Motilal Oswal Nifty 50 Index (Direct)',
    category: 'Index',
    subCategory: 'Large Cap Index',
    risk: 'Moderate',
    returns3y: 16.4,
    returns5y: 12.1,
    allocation: 6,
    minSip: 500
  }
];

export const aiSignals = [
  {
    title: 'Risk alignment check',
    detail: 'Current equity exposure is 62%. Target band for persona is 72-78%.',
    impact: 'Increase equity by 8-10% over the next 2 SIP cycles.'
  },
  {
    title: 'Tax efficiency scan',
    detail: 'ELSS exposure is below optimal for 80C usage.',
    impact: 'Add 6% allocation to ELSS to maximize tax benefit.'
  },
  {
    title: 'Volatility buffer',
    detail: 'Debt duration is slightly high given rate outlook.',
    impact: 'Shift 4% to short-duration funds for stability.'
  }
];

export const fundWatchlist = [
  { name: 'Mirae Asset Large Cap Fund', category: 'Large Cap', nav: 71.2, change: 1.8 },
  { name: 'Axis Bluechip Fund', category: 'Large Cap', nav: 52.6, change: -0.4 },
  { name: 'DSP Tax Saver Fund', category: 'ELSS', nav: 42.9, change: 0.9 },
  { name: 'Nippon India Small Cap Fund', category: 'Small Cap', nav: 109.3, change: 2.7 }
];

export const mutualFundList: MutualFund[] = [
  {
    id: 'quant-flexi-cap',
    name: 'Quant Flexi Cap Fund (Direct)',
    fundHouse: 'Quant Mutual Fund',
    category: 'Equity',
    subCategory: 'Flexi Cap',
    risk: 'High',
    aumCr: 6350,
    expenseRatio: 0.61,
    exitLoad: '1% for exits within 12 months',
    minSip: 1000,
    minLumpSum: 5000,
    returns1y: 28.2,
    returns3y: 24.3,
    returns5y: 18.4,
    benchmark: 'NIFTY 500 TRI',
    manager: 'Sandeep Tandon',
    inception: '2018',
    description: 'High-conviction flexi-cap strategy with dynamic sector rotation and disciplined valuation checks.',
    holdings: [
      { name: 'Reliance Industries', allocation: 8.4, sector: 'Energy' },
      { name: 'Infosys', allocation: 6.9, sector: 'IT Services' },
      { name: 'HDFC Bank', allocation: 6.4, sector: 'Financials' },
      { name: 'Larsen & Toubro', allocation: 4.8, sector: 'Capital Goods' }
    ],
    performance: [
      { date: '2023-01-01', value: 100 },
      { date: '2023-06-01', value: 112 },
      { date: '2024-01-01', value: 128 },
      { date: '2024-06-01', value: 142 }
    ]
  },
  {
    id: 'parag-parikh-flexi',
    name: 'Parag Parikh Flexi Cap Fund (Direct)',
    fundHouse: 'PPFAS Mutual Fund',
    category: 'Equity',
    subCategory: 'Flexi Cap',
    risk: 'Moderate',
    aumCr: 5670,
    expenseRatio: 0.68,
    exitLoad: '2% within 365 days, 1% within 730 days',
    minSip: 1000,
    minLumpSum: 1000,
    returns1y: 19.5,
    returns3y: 18.9,
    returns5y: 16.2,
    benchmark: 'NIFTY 500 TRI',
    manager: 'Rajeev Thakkar',
    inception: '2013',
    description: 'Blend of domestic compounders and global leaders with a value-conscious buy discipline.',
    holdings: [
      { name: 'HDFC Bank', allocation: 7.6, sector: 'Financials' },
      { name: 'Alphabet Inc', allocation: 6.1, sector: 'Global Tech' },
      { name: 'ITC', allocation: 5.4, sector: 'Consumer Staples' },
      { name: 'Maruti Suzuki', allocation: 4.3, sector: 'Automotive' }
    ],
    performance: [
      { date: '2023-01-01', value: 100 },
      { date: '2023-06-01', value: 107 },
      { date: '2024-01-01', value: 118 },
      { date: '2024-06-01', value: 129 }
    ]
  },
  {
    id: 'hdfc-mid-cap',
    name: 'HDFC Mid-Cap Opportunities (Direct)',
    fundHouse: 'HDFC Mutual Fund',
    category: 'Equity',
    subCategory: 'Mid Cap',
    risk: 'High',
    aumCr: 4280,
    expenseRatio: 0.76,
    exitLoad: '1% for exits within 12 months',
    minSip: 1000,
    minLumpSum: 5000,
    returns1y: 32.1,
    returns3y: 27.6,
    returns5y: 20.3,
    benchmark: 'NIFTY Midcap 150 TRI',
    manager: 'Chirag Setalvad',
    inception: '2007',
    description: 'Growth-focused mid-cap portfolio with emphasis on quality and sustainable cash flow.',
    holdings: [
      { name: 'Tata Elxsi', allocation: 5.2, sector: 'IT Services' },
      { name: 'Trent', allocation: 4.8, sector: 'Retail' },
      { name: 'Dixon Technologies', allocation: 4.3, sector: 'Electronics' },
      { name: 'Aarti Industries', allocation: 3.9, sector: 'Chemicals' }
    ],
    performance: [
      { date: '2023-01-01', value: 100 },
      { date: '2023-06-01', value: 114 },
      { date: '2024-01-01', value: 134 },
      { date: '2024-06-01', value: 151 }
    ]
  },
  {
    id: 'kotak-equity-hybrid',
    name: 'Kotak Equity Hybrid Fund (Direct)',
    fundHouse: 'Kotak Mutual Fund',
    category: 'Hybrid',
    subCategory: 'Aggressive Hybrid',
    risk: 'Moderate',
    aumCr: 3120,
    expenseRatio: 0.88,
    exitLoad: '1% for exits within 12 months',
    minSip: 1000,
    minLumpSum: 5000,
    returns1y: 14.8,
    returns3y: 14.2,
    returns5y: 12.6,
    benchmark: 'CRISIL Hybrid 35+65 Aggressive Index',
    manager: 'Harsha Upadhyaya',
    inception: '2004',
    description: 'Balanced equity-debt exposure for smoother compounding and drawdown control.',
    holdings: [
      { name: 'ICICI Bank', allocation: 4.2, sector: 'Financials' },
      { name: 'Larsen & Toubro', allocation: 3.6, sector: 'Capital Goods' },
      { name: 'NTPC', allocation: 2.9, sector: 'Utilities' },
      { name: 'State Bank of India', allocation: 2.7, sector: 'Financials' }
    ],
    performance: [
      { date: '2023-01-01', value: 100 },
      { date: '2023-06-01', value: 106 },
      { date: '2024-01-01', value: 114 },
      { date: '2024-06-01', value: 121 }
    ]
  },
  {
    id: 'sbi-magnum-income',
    name: 'SBI Magnum Income Fund (Direct)',
    fundHouse: 'SBI Mutual Fund',
    category: 'Debt',
    subCategory: 'Corporate Bond',
    risk: 'Moderate',
    aumCr: 8550,
    expenseRatio: 0.45,
    exitLoad: 'Nil',
    minSip: 500,
    minLumpSum: 5000,
    returns1y: 6.9,
    returns3y: 7.4,
    returns5y: 7.2,
    benchmark: 'CRISIL Corporate Bond Index',
    manager: 'Saurabh Shukla',
    inception: '2005',
    description: 'High-quality corporate bond portfolio focused on steady accrual income.',
    holdings: [
      { name: 'PSU Bond AAA', allocation: 18.2, sector: 'PSU' },
      { name: 'Banking & Finance AAA', allocation: 16.7, sector: 'Financials' },
      { name: 'Power Finance Corp', allocation: 8.4, sector: 'Financials' },
      { name: 'NTPC', allocation: 6.1, sector: 'Utilities' }
    ],
    performance: [
      { date: '2023-01-01', value: 100 },
      { date: '2023-06-01', value: 102 },
      { date: '2024-01-01', value: 105 },
      { date: '2024-06-01', value: 108 }
    ]
  },
  {
    id: 'icici-short-term',
    name: 'ICICI Prudential Short Term Fund (Direct)',
    fundHouse: 'ICICI Prudential Mutual Fund',
    category: 'Debt',
    subCategory: 'Short Duration',
    risk: 'Low',
    aumCr: 4120,
    expenseRatio: 0.52,
    exitLoad: 'Nil',
    minSip: 500,
    minLumpSum: 1000,
    returns1y: 6.5,
    returns3y: 6.8,
    returns5y: 6.9,
    benchmark: 'CRISIL Short Duration Index',
    manager: 'Anish Tawakley',
    inception: '2002',
    description: 'Short duration debt strategy designed for liquidity and stable accruals.',
    holdings: [
      { name: 'Treasury Bills', allocation: 14.2, sector: 'Government' },
      { name: 'Banking & Finance AA', allocation: 12.6, sector: 'Financials' },
      { name: 'State Development Loans', allocation: 10.4, sector: 'Government' },
      { name: 'Tata Capital', allocation: 7.8, sector: 'Financials' }
    ],
    performance: [
      { date: '2023-01-01', value: 100 },
      { date: '2023-06-01', value: 101 },
      { date: '2024-01-01', value: 103 },
      { date: '2024-06-01', value: 104 }
    ]
  },
  {
    id: 'sbi-gold',
    name: 'SBI Gold Fund (Direct)',
    fundHouse: 'SBI Mutual Fund',
    category: 'Alternatives',
    subCategory: 'Gold',
    risk: 'Moderate',
    aumCr: 1370,
    expenseRatio: 0.71,
    exitLoad: 'Nil',
    minSip: 500,
    minLumpSum: 1000,
    returns1y: 12.2,
    returns3y: 9.1,
    returns5y: 7.8,
    benchmark: 'Domestic Gold Price',
    manager: 'N. Shrihari',
    inception: '2011',
    description: 'Gold exposure for diversification and inflation hedge.',
    holdings: [
      { name: 'SBI Gold ETF', allocation: 98.4, sector: 'Gold ETF' },
      { name: 'Cash & equivalents', allocation: 1.6, sector: 'Cash' }
    ],
    performance: [
      { date: '2023-01-01', value: 100 },
      { date: '2023-06-01', value: 105 },
      { date: '2024-01-01', value: 112 },
      { date: '2024-06-01', value: 118 }
    ]
  },
  {
    id: 'motilal-nifty50',
    name: 'Motilal Oswal Nifty 50 Index (Direct)',
    fundHouse: 'Motilal Oswal Mutual Fund',
    category: 'Index',
    subCategory: 'Large Cap Index',
    risk: 'Moderate',
    aumCr: 3860,
    expenseRatio: 0.2,
    exitLoad: 'Nil',
    minSip: 500,
    minLumpSum: 500,
    returns1y: 15.4,
    returns3y: 16.4,
    returns5y: 12.1,
    benchmark: 'NIFTY 50 TRI',
    manager: 'Rakesh Shetty',
    inception: '2010',
    description: 'Low-cost index exposure to India’s top 50 companies.',
    holdings: [
      { name: 'Reliance Industries', allocation: 10.1, sector: 'Energy' },
      { name: 'HDFC Bank', allocation: 8.7, sector: 'Financials' },
      { name: 'ICICI Bank', allocation: 7.4, sector: 'Financials' },
      { name: 'Infosys', allocation: 6.6, sector: 'IT Services' }
    ],
    performance: [
      { date: '2023-01-01', value: 100 },
      { date: '2023-06-01', value: 106 },
      { date: '2024-01-01', value: 116 },
      { date: '2024-06-01', value: 123 }
    ]
  }
];

export const discoverBanners = [
  {
    title: 'AI-powered portfolio diagnostics',
    description: 'Auto-scan 30+ funds and rebalance monthly with guardrails.',
    cta: 'Run diagnostics',
    tone: 'primary' as const
  },
  {
    title: 'Goal-based SIP plans',
    description: 'Set SIP ladders aligned to life goals with tax-optimized funds.',
    cta: 'Plan SIP',
    tone: 'neutral' as const
  }
];

export const popularThemes = [
  { name: 'Core Equity', funds: 14 },
  { name: 'Tax Saver (ELSS)', funds: 9 },
  { name: 'Short Duration Debt', funds: 6 },
  { name: 'Aggressive Hybrid', funds: 5 }
];

export const navLinks = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Fund Universe', href: '/nests' },
  { label: 'Investor Profile', href: '/nests/create' }
];
