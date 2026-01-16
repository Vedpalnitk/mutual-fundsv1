# Fund Ranking System - Implementation Document

## Overview

This document outlines the implementation plan for a comprehensive mutual fund ranking system that goes beyond simple return-based scoring to include risk-adjusted metrics, qualitative factors, and user-specific personalization.

---

## Table of Contents

1. [Goals & Objectives](#1-goals--objectives)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Requirements](#3-data-requirements)
4. [Ranking Algorithm](#4-ranking-algorithm)
5. [Implementation Phases](#5-implementation-phases)
6. [API Design](#6-api-design)
7. [Database Schema](#7-database-schema)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Goals & Objectives

### Primary Goals
- Rank funds using multi-factor scoring (quantitative + qualitative + user fit)
- Ensure diversification in recommendations (avoid overlapping holdings)
- Provide transparent, explainable rankings with reasoning

### Success Metrics
- Recommended portfolios outperform category benchmarks by 1-2% annually
- User satisfaction score > 4.0/5.0 on recommendation quality
- < 30% holdings overlap between any two recommended funds

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA INGESTION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  MFAPI.in    │  AMFI Portal  │  AMC Websites  │  NSE/BSE APIs   │
│  (NAV, basic)│  (AUM, ER)    │  (Holdings)    │  (Benchmarks)   │
└──────┬───────┴───────┬───────┴───────┬────────┴────────┬────────┘
       │               │               │                 │
       ▼               ▼               ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA PROCESSING LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ NAV Processor│  │Holdings     │  │ Metrics Calculator      │  │
│  │ - Returns   │  │Analyzer     │  │ - Sharpe, Sortino       │  │
│  │ - Volatility│  │ - Overlap   │  │ - Alpha, Beta           │  │
│  │ - Drawdown  │  │ - Sector    │  │ - Information Ratio     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       RANKING ENGINE                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Filter      │─▶│ Score       │─▶│ Diversify   │─▶ Final Rank │
│  │ Stage       │  │ Stage       │  │ Stage       │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Requirements

### 3.1 Data Sources

| Data Type | Source | Endpoint/Method | Refresh |
|-----------|--------|-----------------|---------|
| NAV History | MFAPI.in | `GET /mf/{scheme_code}` | Daily |
| Fund List | MFAPI.in | `GET /mf` | Weekly |
| AUM Data | AMFI | Scrape monthly reports | Monthly |
| Expense Ratio | AMFI / AMC | Scrape factsheets | Monthly |
| Holdings | AMC Websites | Scrape portfolio disclosure | Monthly |
| Benchmark NAV | NSE/BSE | Index APIs | Daily |
| Fund Manager | AMC Websites | Scrape fund pages | Quarterly |

### 3.2 Data Models

```python
@dataclass
class FundMetrics:
    scheme_code: int
    scheme_name: str
    category: str
    asset_class: str

    # Basic Info
    aum: float                    # in Crores
    expense_ratio: float          # percentage
    fund_manager: str
    manager_tenure_years: float
    fund_house: str
    inception_date: date

    # Return Metrics
    return_1m: float
    return_3m: float
    return_6m: float
    return_1y: float
    return_3y: float              # CAGR
    return_5y: float              # CAGR
    return_since_inception: float

    # Risk Metrics
    volatility_1y: float          # Annualized std dev
    volatility_3y: float
    sharpe_ratio_1y: float
    sharpe_ratio_3y: float
    sortino_ratio_3y: float
    max_drawdown_1y: float
    max_drawdown_3y: float
    beta: float                   # vs benchmark
    alpha: float                  # vs benchmark
    information_ratio: float

    # Rolling Returns
    rolling_return_consistency: float  # % of periods beating benchmark

    # Holdings Analysis
    top_10_concentration: float   # % in top 10 holdings
    sector_concentration: float   # % in top sector
    holdings_count: int

    # Timestamps
    nav_updated_at: datetime
    metrics_calculated_at: datetime


@dataclass
class FundHoldings:
    scheme_code: int
    as_of_date: date
    holdings: List[Holding]       # List of {isin, name, sector, weight}


@dataclass
class BenchmarkData:
    index_code: str               # NIFTY50, NIFTYMIDCAP100, etc.
    index_name: str
    nav_history: List[NavPoint]   # date, value pairs
```

### 3.3 Benchmark Mapping

| Fund Category | Primary Benchmark | Secondary Benchmark |
|---------------|-------------------|---------------------|
| Large Cap | Nifty 50 TRI | Nifty 100 TRI |
| Mid Cap | Nifty Midcap 150 TRI | Nifty Midcap 100 TRI |
| Small Cap | Nifty Smallcap 250 TRI | Nifty Smallcap 100 TRI |
| Flexi Cap | Nifty 500 TRI | Nifty 200 TRI |
| ELSS | Nifty 500 TRI | Nifty 200 TRI |
| Large & Mid Cap | Nifty LargeMidcap 250 TRI | - |
| Focused | Nifty 50 TRI | - |
| Value | Nifty 500 Value 50 TRI | - |
| Debt - Short Duration | CRISIL Short Term Bond Index | - |
| Debt - Corporate Bond | CRISIL Corporate Bond Index | - |
| Liquid | CRISIL Liquid Fund Index | - |
| Hybrid - Aggressive | 65% Nifty 50 + 35% CRISIL Composite Bond | - |
| Gold | Gold Spot Price (MCX) | - |

---

## 4. Ranking Algorithm

### 4.1 Three-Tier Scoring System

```
Final Score = (0.60 × Quantitative) + (0.25 × Qualitative) + (0.15 × User Fit)
```

### 4.2 Tier 1: Quantitative Metrics (60%)

#### 4.2.1 Risk-Adjusted Returns (15%)

```python
def calculate_risk_adjusted_score(fund: FundMetrics) -> float:
    """
    Combines Sharpe and Sortino ratios.
    Sharpe = (Return - Risk Free Rate) / Volatility
    Sortino = (Return - Risk Free Rate) / Downside Volatility
    """
    risk_free_rate = 0.065  # 6.5% (10Y G-Sec yield)

    # Sharpe Ratio (3Y)
    sharpe_score = normalize(fund.sharpe_ratio_3y, min=0, max=2.0)

    # Sortino Ratio (3Y) - better for downside risk
    sortino_score = normalize(fund.sortino_ratio_3y, min=0, max=2.5)

    return 0.5 * sharpe_score + 0.5 * sortino_score
```

#### 4.2.2 Rolling Returns Consistency (10%)

```python
def calculate_consistency_score(nav_history: List[NavPoint], benchmark: List[NavPoint]) -> float:
    """
    Measures how often the fund beats benchmark over rolling periods.
    More consistent = higher score.
    """
    rolling_periods = [
        ("1Y", 252),   # trading days
        ("3Y", 756),
        ("5Y", 1260)
    ]

    beat_counts = []
    for period_name, days in rolling_periods:
        periods_evaluated = 0
        periods_beaten = 0

        for start in range(0, len(nav_history) - days, 21):  # monthly rolling
            fund_return = calculate_return(nav_history, start, start + days)
            bench_return = calculate_return(benchmark, start, start + days)

            periods_evaluated += 1
            if fund_return > bench_return:
                periods_beaten += 1

        beat_counts.append(periods_beaten / periods_evaluated)

    # Weight recent consistency higher
    weights = [0.5, 0.3, 0.2]  # 1Y, 3Y, 5Y
    return sum(w * c for w, c in zip(weights, beat_counts))
```

#### 4.2.3 Downside Protection (10%)

```python
def calculate_downside_score(fund: FundMetrics) -> float:
    """
    Lower max drawdown = higher score.
    Also considers recovery time.
    """
    # Max Drawdown Score (inverted - lower is better)
    drawdown_score = 1 - normalize(abs(fund.max_drawdown_3y), min=0, max=50)

    # Capture Ratio = Upside Capture / Downside Capture
    # > 1 means fund captures more upside than downside
    capture_ratio = fund.upside_capture / max(fund.downside_capture, 0.01)
    capture_score = normalize(capture_ratio, min=0.5, max=1.5)

    return 0.6 * drawdown_score + 0.4 * capture_score
```

#### 4.2.4 Alpha Generation (10%)

```python
def calculate_alpha_score(fund: FundMetrics) -> float:
    """
    Jensen's Alpha = Actual Return - Expected Return (CAPM)
    Expected Return = Risk Free + Beta * (Benchmark Return - Risk Free)
    """
    # Normalize alpha: -5% to +5% range typical
    alpha_score = normalize(fund.alpha, min=-5, max=5)

    # Penalize high beta with low alpha (taking risk without reward)
    if fund.beta > 1.1 and fund.alpha < 1:
        alpha_score *= 0.8

    return alpha_score
```

#### 4.2.5 Information Ratio (5%)

```python
def calculate_ir_score(fund: FundMetrics) -> float:
    """
    Information Ratio = Active Return / Tracking Error
    Measures consistency of outperformance.
    """
    # Good IR is > 0.5, excellent is > 1.0
    return normalize(fund.information_ratio, min=-0.5, max=1.5)
```

#### 4.2.6 Expense Ratio (5%)

```python
def calculate_expense_score(fund: FundMetrics, category_avg: float) -> float:
    """
    Lower expense ratio relative to category = higher score.
    """
    relative_expense = fund.expense_ratio / category_avg

    # Score: 1.0 if 50% of avg, 0.5 if equal to avg, 0 if 150% of avg
    return max(0, 1 - (relative_expense - 0.5))
```

#### 4.2.7 AUM Stability (5%)

```python
def calculate_aum_score(fund: FundMetrics, aum_history: List[float]) -> float:
    """
    Stable/growing AUM = higher score.
    Massive outflows indicate problems.
    """
    # Check AUM trend over last 12 months
    if len(aum_history) < 12:
        return 0.5  # Neutral if insufficient data

    # Calculate month-over-month changes
    changes = [(aum_history[i] - aum_history[i-1]) / aum_history[i-1]
               for i in range(1, len(aum_history))]

    # Penalize funds with > 20% outflow in any month
    severe_outflows = sum(1 for c in changes if c < -0.20)
    if severe_outflows > 0:
        return max(0, 0.5 - severe_outflows * 0.1)

    # Reward stable/growing funds
    avg_change = sum(changes) / len(changes)
    return normalize(avg_change, min=-0.05, max=0.10)
```

### 4.3 Tier 2: Qualitative Factors (25%)

#### 4.3.1 Fund Manager Tenure (8%)

```python
def calculate_manager_score(fund: FundMetrics) -> float:
    """
    Longer tenure with good performance = higher score.
    """
    tenure = fund.manager_tenure_years

    if tenure < 1:
        return 0.2   # New manager, risky
    elif tenure < 2:
        return 0.4
    elif tenure < 3:
        return 0.6
    elif tenure < 5:
        return 0.8
    else:
        return 1.0   # 5+ years, proven track record
```

#### 4.3.2 Fund House Reputation (7%)

```python
# Tier classification based on AUM, track record, governance
FUND_HOUSE_TIERS = {
    "tier_1": [  # Top AMCs
        "SBI", "HDFC", "ICICI Prudential", "Axis", "Kotak",
        "Nippon India", "Aditya Birla Sun Life", "UTI", "DSP"
    ],
    "tier_2": [  # Established AMCs
        "Mirae Asset", "Tata", "Franklin Templeton", "Invesco",
        "IDFC", "L&T", "Sundaram", "Canara Robeco", "HSBC"
    ],
    "tier_3": [  # Smaller/Newer AMCs
        "Parag Parikh", "Quant", "PPFAS", "Motilal Oswal",
        "Edelweiss", "Bandhan", "Mahindra Manulife"
    ]
}

def calculate_fund_house_score(fund: FundMetrics) -> float:
    fund_house = fund.fund_house.lower()

    for tier, houses in FUND_HOUSE_TIERS.items():
        if any(h.lower() in fund_house for h in houses):
            if tier == "tier_1":
                return 1.0
            elif tier == "tier_2":
                return 0.8
            else:
                return 0.6

    return 0.4  # Unknown fund house
```

#### 4.3.3 Portfolio Concentration (5%)

```python
def calculate_concentration_score(fund: FundMetrics) -> float:
    """
    Lower concentration = better diversification = higher score.
    But too low concentration in focused funds is expected.
    """
    if "Focused" in fund.category:
        # Focused funds are expected to be concentrated
        ideal_top10 = 60  # 60% in top 10 is fine
    else:
        ideal_top10 = 40  # Regular funds should be more diversified

    deviation = abs(fund.top_10_concentration - ideal_top10)
    return max(0, 1 - deviation / 30)  # 30% deviation = 0 score
```

#### 4.3.4 Holdings Overlap Penalty (5%)

```python
def calculate_overlap_penalty(fund: FundMetrics, portfolio: List[FundMetrics]) -> float:
    """
    Penalize funds that have high overlap with already selected funds.
    """
    if not portfolio:
        return 1.0  # No penalty for first fund

    max_overlap = 0
    for existing_fund in portfolio:
        overlap = calculate_holdings_overlap(fund.holdings, existing_fund.holdings)
        max_overlap = max(max_overlap, overlap)

    # > 50% overlap = 0 score, < 20% overlap = full score
    if max_overlap > 0.5:
        return 0
    elif max_overlap > 0.2:
        return 1 - (max_overlap - 0.2) / 0.3
    else:
        return 1.0


def calculate_holdings_overlap(holdings_a: List[Holding], holdings_b: List[Holding]) -> float:
    """
    Calculate overlap using ISIN matching and weight.
    """
    isins_a = {h.isin: h.weight for h in holdings_a}
    isins_b = {h.isin: h.weight for h in holdings_b}

    common_isins = set(isins_a.keys()) & set(isins_b.keys())

    overlap = sum(min(isins_a[isin], isins_b[isin]) for isin in common_isins)
    return overlap / 100  # Convert to ratio
```

### 4.4 Tier 3: User-Specific Fit (15%)

#### 4.4.1 Risk Profile Match (5%)

```python
def calculate_risk_match_score(fund: FundMetrics, user_risk_tolerance: str) -> float:
    """
    Match fund volatility to user's risk tolerance.
    """
    risk_thresholds = {
        "conservative": {"ideal": 8, "max": 12},
        "moderate": {"ideal": 15, "max": 20},
        "aggressive": {"ideal": 22, "max": 30}
    }

    thresholds = risk_thresholds[user_risk_tolerance]
    fund_vol = fund.volatility_3y

    if fund_vol <= thresholds["ideal"]:
        return 1.0
    elif fund_vol <= thresholds["max"]:
        return 0.7
    else:
        return 0.3  # Too risky for user
```

#### 4.4.2 Goal Alignment (5%)

```python
def calculate_goal_alignment(fund: FundMetrics, user_goal: str, horizon_years: int) -> float:
    """
    Match fund type to user's goal and time horizon.
    """
    goal_preferences = {
        "retirement": {
            "long": ["Flexi Cap", "Large Cap", "Index"],      # > 10 years
            "medium": ["Large & Mid Cap", "Balanced Advantage"],  # 5-10 years
            "short": ["Conservative Hybrid", "Short Duration"]    # < 5 years
        },
        "wealth_creation": {
            "long": ["Small Cap", "Mid Cap", "Flexi Cap"],
            "medium": ["Flexi Cap", "Large & Mid Cap"],
            "short": ["Large Cap", "Balanced Advantage"]
        },
        "tax_saving": {
            "long": ["ELSS"],
            "medium": ["ELSS"],
            "short": ["ELSS"]  # 3 year lock-in anyway
        },
        "emergency_fund": {
            "long": ["Liquid", "Ultra Short Duration"],
            "medium": ["Liquid", "Ultra Short Duration"],
            "short": ["Liquid", "Overnight"]
        }
    }

    horizon_bucket = "long" if horizon_years > 10 else "medium" if horizon_years > 5 else "short"
    preferred_categories = goal_preferences.get(user_goal, {}).get(horizon_bucket, [])

    if fund.category in preferred_categories:
        return 1.0
    elif fund.asset_class == "equity" and horizon_bucket == "long":
        return 0.7  # Equity is generally good for long term
    else:
        return 0.4
```

#### 4.4.3 Tax Efficiency (5%)

```python
def calculate_tax_efficiency(fund: FundMetrics, user_profile: UserProfile) -> float:
    """
    Consider tax implications based on user's tax bracket and holding period.
    """
    # ELSS gives 80C deduction
    if fund.category == "ELSS" and not user_profile.has_maxed_80c:
        return 1.0  # High value for tax saving

    # Equity funds held > 1 year = LTCG (10% above 1L)
    # Debt funds held > 3 years = LTCG with indexation
    if user_profile.horizon_years >= 3 and fund.asset_class == "debt":
        return 0.9  # Indexation benefit

    if user_profile.horizon_years >= 1 and fund.asset_class == "equity":
        return 0.8  # LTCG is favorable

    return 0.5  # Neutral
```

### 4.5 Final Ranking Pipeline

```python
class FundRankingEngine:

    def rank_funds(
        self,
        funds: List[FundMetrics],
        user_profile: UserProfile,
        target_allocation: Dict[str, float],
        top_n: int = 10
    ) -> List[RankedFund]:

        # Stage 1: Filter
        filtered = self._filter_funds(funds, user_profile)

        # Stage 2: Score
        scored = []
        for fund in filtered:
            quant_score = self._calculate_quantitative_score(fund)
            qual_score = self._calculate_qualitative_score(fund)
            fit_score = self._calculate_user_fit_score(fund, user_profile)

            final_score = (
                0.60 * quant_score +
                0.25 * qual_score +
                0.15 * fit_score
            )

            scored.append((fund, final_score, {
                "quantitative": quant_score,
                "qualitative": qual_score,
                "user_fit": fit_score
            }))

        # Stage 3: Sort by score
        scored.sort(key=lambda x: x[1], reverse=True)

        # Stage 4: Diversification pass
        selected = self._apply_diversification(scored, target_allocation, top_n)

        # Stage 5: Generate explanations
        return [
            RankedFund(
                fund=fund,
                rank=i + 1,
                score=score,
                score_breakdown=breakdown,
                reasoning=self._generate_reasoning(fund, breakdown)
            )
            for i, (fund, score, breakdown) in enumerate(selected)
        ]

    def _filter_funds(self, funds: List[FundMetrics], user_profile: UserProfile) -> List[FundMetrics]:
        """Remove funds that don't meet basic criteria."""
        filtered = []

        for fund in funds:
            # AUM filter (liquidity)
            if fund.aum < 500:  # < 500 Cr
                continue

            # Manager tenure filter
            if fund.manager_tenure_years < 1:
                continue

            # Expense ratio filter (not too expensive)
            category_avg = self._get_category_avg_expense(fund.category)
            if fund.expense_ratio > category_avg * 1.5:
                continue

            # Track record filter
            if fund.inception_date > date.today() - timedelta(days=365 * 3):
                continue  # At least 3 years old

            filtered.append(fund)

        return filtered

    def _apply_diversification(
        self,
        scored: List[Tuple[FundMetrics, float, dict]],
        target_allocation: Dict[str, float],
        top_n: int
    ) -> List[Tuple[FundMetrics, float, dict]]:
        """Select funds ensuring diversification."""
        selected = []
        fund_house_count = {}

        # Allocate slots per asset class
        slots = self._allocate_slots(target_allocation, top_n)
        slots_filled = {ac: 0 for ac in slots}

        for fund, score, breakdown in scored:
            asset_class = fund.asset_class
            fund_house = fund.fund_house

            # Check if asset class has slots
            if slots_filled.get(asset_class, 0) >= slots.get(asset_class, 0):
                continue

            # Limit 2 funds per fund house
            if fund_house_count.get(fund_house, 0) >= 2:
                continue

            # Check holdings overlap with selected funds
            overlap_penalty = self._calculate_overlap_penalty(fund, [f for f, _, _ in selected])
            if overlap_penalty < 0.3:  # Too much overlap
                continue

            # Select fund
            selected.append((fund, score * overlap_penalty, breakdown))
            slots_filled[asset_class] = slots_filled.get(asset_class, 0) + 1
            fund_house_count[fund_house] = fund_house_count.get(fund_house, 0) + 1

            if len(selected) >= top_n:
                break

        return selected
```

---

## 5. Implementation Phases

### Phase 1: Data Infrastructure (Week 1-2)

**Objective**: Set up data collection and storage

| Task | Description | Deliverable |
|------|-------------|-------------|
| 1.1 | Enhance MFAPI integration | NAV history for all funds |
| 1.2 | Build AMFI scraper | AUM, expense ratio data |
| 1.3 | Build holdings scraper | Monthly holdings for top 200 funds |
| 1.4 | Set up benchmark data | Index NAV history |
| 1.5 | Database schema | PostgreSQL tables for metrics |
| 1.6 | Data refresh scheduler | Daily/monthly cron jobs |

**Files to Create/Modify**:
```
ml-service/
├── app/
│   ├── services/
│   │   ├── fund_data_service.py      # Modify
│   │   ├── amfi_scraper.py           # New
│   │   ├── holdings_scraper.py       # New
│   │   └── benchmark_service.py      # New
│   └── models/
│       └── fund_metrics.py           # New
```

### Phase 2: Metrics Calculation (Week 3-4)

**Objective**: Calculate all quantitative metrics

| Task | Description | Deliverable |
|------|-------------|-------------|
| 2.1 | Return calculations | 1M, 3M, 6M, 1Y, 3Y, 5Y CAGR |
| 2.2 | Risk metrics | Volatility, Sharpe, Sortino |
| 2.3 | Drawdown analysis | Max drawdown, recovery time |
| 2.4 | Alpha/Beta calculation | vs appropriate benchmark |
| 2.5 | Rolling returns | Consistency scores |
| 2.6 | Holdings analysis | Concentration, overlap |

**Files to Create**:
```
ml-service/
├── app/
│   └── services/
│       ├── metrics_calculator.py     # New
│       ├── risk_analyzer.py          # New
│       └── holdings_analyzer.py      # New
```

### Phase 3: Ranking Engine (Week 5-6)

**Objective**: Implement the three-tier ranking system

| Task | Description | Deliverable |
|------|-------------|-------------|
| 3.1 | Quantitative scorer | 60% weight component |
| 3.2 | Qualitative scorer | 25% weight component |
| 3.3 | User fit scorer | 15% weight component |
| 3.4 | Diversification logic | Overlap penalty, fund house limits |
| 3.5 | Ranking pipeline | End-to-end ranking |
| 3.6 | Explanation generator | Human-readable reasoning |

**Files to Create/Modify**:
```
ml-service/
├── app/
│   └── services/
│       ├── ranking_engine.py         # New
│       ├── recommendation_service.py # Modify to use ranking
│       └── explanation_generator.py  # New
```

### Phase 4: API & Integration (Week 7-8)

**Objective**: Expose ranking via API, integrate with frontend

| Task | Description | Deliverable |
|------|-------------|-------------|
| 4.1 | Ranking API endpoint | `/api/v1/funds/rank` |
| 4.2 | Detailed fund endpoint | `/api/v1/funds/{code}/analysis` |
| 4.3 | Backend integration | NestJS gateway updates |
| 4.4 | Frontend updates | Display scores, breakdown |
| 4.5 | Caching layer | Redis for computed metrics |
| 4.6 | Documentation | API docs, Swagger |

---

## 6. API Design

### 6.1 Get Ranked Funds

```
POST /api/v1/funds/rank

Request:
{
    "user_profile": {
        "age": 30,
        "risk_tolerance": "moderate",
        "goal": "wealth_creation",
        "horizon_years": 10,
        "has_maxed_80c": false
    },
    "target_allocation": {
        "equity": 0.70,
        "debt": 0.15,
        "hybrid": 0.10,
        "gold": 0.05
    },
    "filters": {
        "min_aum": 500,
        "min_track_record_years": 3,
        "exclude_fund_houses": [],
        "exclude_categories": []
    },
    "top_n": 10
}

Response:
{
    "ranked_funds": [
        {
            "rank": 1,
            "scheme_code": 119598,
            "scheme_name": "Parag Parikh Flexi Cap Fund Direct Growth",
            "category": "Flexi Cap",
            "asset_class": "equity",
            "suggested_allocation": 0.25,
            "suggested_amount": 25000,
            "scores": {
                "final": 0.87,
                "quantitative": 0.89,
                "qualitative": 0.85,
                "user_fit": 0.82
            },
            "score_breakdown": {
                "risk_adjusted_returns": 0.92,
                "consistency": 0.88,
                "downside_protection": 0.85,
                "alpha": 0.91,
                "expense_efficiency": 0.90,
                "manager_tenure": 1.0,
                "fund_house": 0.8,
                "risk_match": 0.85,
                "goal_alignment": 0.80
            },
            "key_metrics": {
                "return_3y": 18.7,
                "sharpe_ratio": 1.1,
                "max_drawdown": -15.2,
                "alpha": 3.2,
                "expense_ratio": 0.63
            },
            "reasoning": [
                "Excellent risk-adjusted returns (Sharpe: 1.1)",
                "Consistent outperformance - beat benchmark in 78% of rolling 1Y periods",
                "Experienced fund manager with 8+ years tenure",
                "Low expense ratio (37% below category average)",
                "Well-suited for moderate risk profile with 10Y horizon"
            ]
        },
        // ... more funds
    ],
    "portfolio_summary": {
        "expected_return": 14.2,
        "expected_volatility": 15.5,
        "sharpe_ratio": 0.92,
        "diversification_score": 0.85,
        "alignment_score": 0.95
    }
}
```

### 6.2 Get Fund Analysis

```
GET /api/v1/funds/{scheme_code}/analysis

Response:
{
    "scheme_code": 119598,
    "scheme_name": "Parag Parikh Flexi Cap Fund Direct Growth",
    "fund_house": "PPFAS Mutual Fund",
    "category": "Flexi Cap",
    "inception_date": "2013-05-24",

    "returns": {
        "1m": 2.3,
        "3m": 8.5,
        "6m": 12.1,
        "1y": 22.4,
        "3y": 18.7,
        "5y": 19.2,
        "since_inception": 18.5
    },

    "risk_metrics": {
        "volatility_1y": 14.2,
        "volatility_3y": 15.1,
        "sharpe_ratio_1y": 1.05,
        "sharpe_ratio_3y": 1.1,
        "sortino_ratio_3y": 1.35,
        "max_drawdown_1y": -8.5,
        "max_drawdown_3y": -15.2,
        "beta": 0.85,
        "alpha": 3.2,
        "information_ratio": 0.78
    },

    "benchmark_comparison": {
        "benchmark": "Nifty 500 TRI",
        "fund_return_3y": 18.7,
        "benchmark_return_3y": 15.5,
        "outperformance": 3.2,
        "tracking_error": 4.1,
        "rolling_beat_rate": 0.78
    },

    "portfolio_analysis": {
        "aum": 48520,
        "expense_ratio": 0.63,
        "holdings_count": 45,
        "top_10_concentration": 42.5,
        "sector_allocation": {
            "Financial Services": 28.5,
            "Technology": 22.1,
            "Consumer": 15.3,
            // ...
        },
        "market_cap_allocation": {
            "large_cap": 65,
            "mid_cap": 25,
            "small_cap": 10
        }
    },

    "fund_manager": {
        "name": "Rajeev Thakkar",
        "tenure_years": 10.5,
        "other_funds": ["PPFAS Tax Saver Fund"]
    },

    "peer_comparison": {
        "category_rank": 3,
        "category_total": 25,
        "percentile": 92
    }
}
```

---

## 7. Database Schema

```sql
-- Fund basic info (refreshed weekly)
CREATE TABLE funds (
    scheme_code INTEGER PRIMARY KEY,
    scheme_name VARCHAR(255) NOT NULL,
    fund_house VARCHAR(100),
    category VARCHAR(50),
    asset_class VARCHAR(20),
    inception_date DATE,
    is_direct BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Fund metrics (refreshed daily)
CREATE TABLE fund_metrics (
    id SERIAL PRIMARY KEY,
    scheme_code INTEGER REFERENCES funds(scheme_code),

    -- AUM & Expense
    aum DECIMAL(12, 2),
    expense_ratio DECIMAL(5, 4),

    -- Returns
    return_1m DECIMAL(8, 4),
    return_3m DECIMAL(8, 4),
    return_6m DECIMAL(8, 4),
    return_1y DECIMAL(8, 4),
    return_3y DECIMAL(8, 4),
    return_5y DECIMAL(8, 4),

    -- Risk Metrics
    volatility_1y DECIMAL(8, 4),
    volatility_3y DECIMAL(8, 4),
    sharpe_ratio_1y DECIMAL(8, 4),
    sharpe_ratio_3y DECIMAL(8, 4),
    sortino_ratio_3y DECIMAL(8, 4),
    max_drawdown_1y DECIMAL(8, 4),
    max_drawdown_3y DECIMAL(8, 4),
    beta DECIMAL(8, 4),
    alpha DECIMAL(8, 4),
    information_ratio DECIMAL(8, 4),

    -- Consistency
    rolling_beat_rate_1y DECIMAL(5, 4),
    rolling_beat_rate_3y DECIMAL(5, 4),

    calculated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(scheme_code, calculated_at::DATE)
);

-- NAV history (daily)
CREATE TABLE nav_history (
    id SERIAL PRIMARY KEY,
    scheme_code INTEGER REFERENCES funds(scheme_code),
    nav_date DATE NOT NULL,
    nav DECIMAL(12, 4) NOT NULL,

    UNIQUE(scheme_code, nav_date)
);

-- Holdings (monthly)
CREATE TABLE fund_holdings (
    id SERIAL PRIMARY KEY,
    scheme_code INTEGER REFERENCES funds(scheme_code),
    as_of_date DATE NOT NULL,
    isin VARCHAR(20),
    security_name VARCHAR(255),
    sector VARCHAR(100),
    weight DECIMAL(5, 2),

    UNIQUE(scheme_code, as_of_date, isin)
);

-- Fund managers
CREATE TABLE fund_managers (
    id SERIAL PRIMARY KEY,
    scheme_code INTEGER REFERENCES funds(scheme_code),
    manager_name VARCHAR(100),
    since_date DATE,

    UNIQUE(scheme_code, manager_name)
);

-- Benchmark data
CREATE TABLE benchmarks (
    id SERIAL PRIMARY KEY,
    index_code VARCHAR(20) NOT NULL,
    index_name VARCHAR(100),
    nav_date DATE NOT NULL,
    nav DECIMAL(12, 4) NOT NULL,

    UNIQUE(index_code, nav_date)
);

-- Category benchmark mapping
CREATE TABLE category_benchmarks (
    category VARCHAR(50) PRIMARY KEY,
    primary_benchmark VARCHAR(20) REFERENCES benchmarks(index_code),
    secondary_benchmark VARCHAR(20)
);

-- Indices
CREATE INDEX idx_fund_metrics_scheme ON fund_metrics(scheme_code);
CREATE INDEX idx_nav_history_scheme_date ON nav_history(scheme_code, nav_date);
CREATE INDEX idx_holdings_scheme_date ON fund_holdings(scheme_code, as_of_date);
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```python
# tests/test_metrics_calculator.py

def test_sharpe_ratio_calculation():
    """Test Sharpe ratio with known values."""
    returns = [0.02, -0.01, 0.03, 0.01, -0.02, 0.04]  # Monthly returns
    risk_free = 0.005  # Monthly risk-free rate

    sharpe = calculate_sharpe_ratio(returns, risk_free)

    # Expected: (mean_excess_return / std_dev) * sqrt(12)
    assert 0.5 < sharpe < 1.5


def test_max_drawdown_calculation():
    """Test max drawdown calculation."""
    nav_history = [100, 105, 103, 95, 92, 98, 102, 108]

    max_dd = calculate_max_drawdown(nav_history)

    # Peak was 105, trough was 92 = -12.4% drawdown
    assert abs(max_dd - (-12.38)) < 0.1


def test_holdings_overlap():
    """Test holdings overlap calculation."""
    holdings_a = [
        {"isin": "INE001", "weight": 10},
        {"isin": "INE002", "weight": 8},
        {"isin": "INE003", "weight": 7},
    ]
    holdings_b = [
        {"isin": "INE001", "weight": 12},  # Overlap
        {"isin": "INE004", "weight": 9},
        {"isin": "INE003", "weight": 5},   # Overlap
    ]

    overlap = calculate_holdings_overlap(holdings_a, holdings_b)

    # Overlap = min(10,12) + min(7,5) = 10 + 5 = 15%
    assert abs(overlap - 0.15) < 0.01
```

### 8.2 Integration Tests

```python
# tests/test_ranking_engine.py

def test_ranking_produces_diversified_portfolio():
    """Ensure ranking doesn't over-concentrate in one fund house."""
    engine = FundRankingEngine()

    result = engine.rank_funds(
        funds=load_test_funds(),
        user_profile=UserProfile(risk_tolerance="moderate"),
        target_allocation={"equity": 0.7, "debt": 0.3},
        top_n=10
    )

    fund_houses = [f.fund.fund_house for f in result]
    fund_house_counts = Counter(fund_houses)

    # No fund house should have more than 2 funds
    assert max(fund_house_counts.values()) <= 2


def test_ranking_respects_asset_allocation():
    """Ensure ranking allocates to all asset classes."""
    engine = FundRankingEngine()

    result = engine.rank_funds(
        funds=load_test_funds(),
        user_profile=UserProfile(risk_tolerance="moderate"),
        target_allocation={"equity": 0.6, "debt": 0.2, "gold": 0.1, "hybrid": 0.1},
        top_n=10
    )

    asset_classes = set(f.fund.asset_class for f in result)

    # All target asset classes should be represented
    assert "equity" in asset_classes
    assert "debt" in asset_classes
    assert "gold" in asset_classes
    assert "hybrid" in asset_classes
```

### 8.3 Backtesting

```python
# tests/test_backtesting.py

def test_recommended_portfolio_beats_benchmark():
    """
    Backtest: Take recommendations from 3 years ago,
    verify they outperformed benchmark.
    """
    # Get historical data from 3 years ago
    historical_date = date.today() - timedelta(days=365 * 3)

    # Get what recommendations would have been
    recommendations = get_historical_recommendations(
        as_of_date=historical_date,
        user_profile=UserProfile(risk_tolerance="moderate"),
        target_allocation={"equity": 0.7, "debt": 0.3}
    )

    # Calculate actual portfolio return over 3 years
    portfolio_return = calculate_portfolio_return(
        recommendations,
        start_date=historical_date,
        end_date=date.today()
    )

    # Calculate benchmark return
    benchmark_return = calculate_benchmark_return(
        benchmark="Nifty 500 TRI",
        start_date=historical_date,
        end_date=date.today()
    )

    # Portfolio should beat benchmark by at least 1%
    assert portfolio_return > benchmark_return + 1.0
```

---

## Appendix A: Normalization Function

```python
def normalize(value: float, min_val: float, max_val: float) -> float:
    """
    Normalize a value to 0-1 range.
    Values below min become 0, above max become 1.
    """
    if value <= min_val:
        return 0.0
    if value >= max_val:
        return 1.0
    return (value - min_val) / (max_val - min_val)
```

---

## Appendix B: Category Average Expense Ratios

| Category | Average ER (Direct) |
|----------|---------------------|
| Large Cap | 0.85% |
| Mid Cap | 0.95% |
| Small Cap | 1.05% |
| Flexi Cap | 0.80% |
| ELSS | 0.90% |
| Index | 0.20% |
| Liquid | 0.20% |
| Short Duration | 0.35% |
| Corporate Bond | 0.40% |
| Balanced Advantage | 0.85% |
| Aggressive Hybrid | 0.90% |

---

## Appendix C: Risk-Free Rate

Use the **10-Year Government Bond Yield** as the risk-free rate:
- Current (Jan 2025): ~6.5% annually
- Source: RBI / CCIL
- Update: Monthly

For Sharpe/Sortino calculations, convert to the appropriate period:
- Monthly: 6.5% / 12 = 0.54%
- Daily: 6.5% / 252 = 0.026%
