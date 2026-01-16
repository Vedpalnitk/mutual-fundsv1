"""
Portfolio optimization service using Mean-Variance Optimization.
"""

import time
from typing import List, Optional
import numpy as np

from app.schemas.portfolio import (
    FundInput,
    OptimizationConstraints,
    AllocationResult,
    PortfolioMetrics,
)


# Default allocation templates by persona
PERSONA_ALLOCATIONS = {
    "capital-guardian": {
        "max_equity": 0.35,
        "min_debt": 0.50,
        "target_volatility": 0.08,
    },
    "balanced-voyager": {
        "max_equity": 0.65,
        "min_debt": 0.25,
        "target_volatility": 0.12,
    },
    "accelerated-builder": {
        "max_equity": 0.90,
        "min_debt": 0.05,
        "target_volatility": 0.18,
    },
}

# Category to asset class mapping
EQUITY_CATEGORIES = {
    "Large Cap",
    "Mid Cap",
    "Small Cap",
    "Flexi Cap",
    "Multi Cap",
    "ELSS",
    "Focused",
    "Value",
    "Contra",
    "Dividend Yield",
    "Sectoral",
    "Thematic",
}

DEBT_CATEGORIES = {
    "Liquid",
    "Ultra Short Duration",
    "Low Duration",
    "Money Market",
    "Short Duration",
    "Medium Duration",
    "Corporate Bond",
    "Banking and PSU",
    "Gilt",
    "Dynamic Bond",
    "Credit Risk",
}

HYBRID_CATEGORIES = {
    "Aggressive Hybrid",
    "Conservative Hybrid",
    "Balanced Advantage",
    "Multi Asset Allocation",
    "Equity Savings",
    "Arbitrage",
}


class PortfolioService:
    """Service for portfolio optimization."""

    def __init__(self):
        self.model_version = "mvo-v1"
        self.risk_free_rate = 0.065  # 6.5% risk-free rate (Indian context)

    def optimize(
        self,
        persona_id: str,
        profile: dict,
        available_funds: List[FundInput],
        constraints: Optional[OptimizationConstraints] = None,
    ) -> tuple:
        """
        Optimize portfolio allocation based on persona and constraints.

        Returns:
            Tuple of (allocations, metrics, latency_ms)
        """
        start_time = time.time()

        # Get persona-specific allocation preferences
        persona_prefs = PERSONA_ALLOCATIONS.get(
            persona_id, PERSONA_ALLOCATIONS["balanced-voyager"]
        )

        # Apply constraints
        if constraints is None:
            constraints = OptimizationConstraints()

        max_equity = min(constraints.max_equity_pct / 100, persona_prefs["max_equity"])
        min_debt = max(constraints.min_debt_pct / 100, persona_prefs["min_debt"])
        max_single_fund = constraints.max_single_fund_pct / 100
        min_funds = constraints.min_funds
        max_funds = constraints.max_funds

        # Categorize funds
        equity_funds = []
        debt_funds = []
        hybrid_funds = []

        for fund in available_funds:
            if fund.category in EQUITY_CATEGORIES:
                equity_funds.append(fund)
            elif fund.category in DEBT_CATEGORIES:
                debt_funds.append(fund)
            elif fund.category in HYBRID_CATEGORIES:
                hybrid_funds.append(fund)
            else:
                # Default to equity
                equity_funds.append(fund)

        # Score and rank funds
        scored_equity = self._score_funds(equity_funds)
        scored_debt = self._score_funds(debt_funds)
        scored_hybrid = self._score_funds(hybrid_funds)

        # Calculate target allocations
        target_equity = max_equity
        target_debt = min_debt
        target_hybrid = 1.0 - target_equity - target_debt

        if target_hybrid < 0:
            # Adjust equity to fit
            target_equity = 1.0 - target_debt
            target_hybrid = 0

        # Select top funds for each category
        allocations = []
        total_weight = 0

        # Equity allocation
        equity_count = max(1, int(max_funds * target_equity / (target_equity + target_debt + target_hybrid)))
        for fund, score in scored_equity[:equity_count]:
            weight = min(target_equity / equity_count, max_single_fund)
            allocations.append(
                AllocationResult(
                    scheme_code=fund.scheme_code,
                    scheme_name=fund.scheme_name,
                    category=fund.category,
                    weight=weight,
                    monthly_sip=self._calculate_sip(profile, weight),
                )
            )
            total_weight += weight

        # Debt allocation
        debt_count = max(1, int(max_funds * target_debt / (target_equity + target_debt + target_hybrid)))
        for fund, score in scored_debt[:debt_count]:
            weight = min(target_debt / debt_count, max_single_fund)
            allocations.append(
                AllocationResult(
                    scheme_code=fund.scheme_code,
                    scheme_name=fund.scheme_name,
                    category=fund.category,
                    weight=weight,
                    monthly_sip=self._calculate_sip(profile, weight),
                )
            )
            total_weight += weight

        # Hybrid allocation (if any)
        if target_hybrid > 0 and scored_hybrid:
            hybrid_count = max(1, max_funds - len(allocations))
            for fund, score in scored_hybrid[:hybrid_count]:
                weight = min(target_hybrid / hybrid_count, max_single_fund)
                allocations.append(
                    AllocationResult(
                        scheme_code=fund.scheme_code,
                        scheme_name=fund.scheme_name,
                        category=fund.category,
                        weight=weight,
                        monthly_sip=self._calculate_sip(profile, weight),
                    )
                )
                total_weight += weight

        # Normalize weights to sum to 1
        if total_weight > 0 and allocations:
            for alloc in allocations:
                alloc.weight = alloc.weight / total_weight
                alloc.monthly_sip = self._calculate_sip(profile, alloc.weight)

        # Calculate expected metrics
        metrics = self._calculate_metrics(allocations, available_funds, profile)

        latency_ms = int((time.time() - start_time) * 1000)

        return allocations, metrics, latency_ms

    def _score_funds(self, funds: List[FundInput]) -> List[tuple]:
        """Score funds based on risk-adjusted returns."""
        scored = []
        for fund in funds:
            score = 0.0

            # 3-year return weight: 40%
            if fund.return_3y is not None:
                score += 0.4 * min(fund.return_3y / 30, 1.0)

            # 5-year return weight: 30%
            if fund.return_5y is not None:
                score += 0.3 * min(fund.return_5y / 25, 1.0)

            # Sharpe ratio weight: 20%
            if fund.sharpe_ratio is not None:
                score += 0.2 * min(fund.sharpe_ratio / 2.0, 1.0)

            # Expense ratio weight: 10% (lower is better)
            if fund.expense_ratio is not None:
                score += 0.1 * max(0, 1.0 - fund.expense_ratio / 2.5)

            # If no metrics, give default score
            if score == 0:
                score = 0.5

            scored.append((fund, score))

        # Sort by score descending
        return sorted(scored, key=lambda x: x[1], reverse=True)

    def _calculate_sip(self, profile: dict, weight: float) -> Optional[float]:
        """Calculate monthly SIP amount for a fund."""
        monthly_sip = profile.get("monthly_sip")
        if monthly_sip is not None:
            return round(monthly_sip * weight, 0)
        return None

    def _calculate_metrics(
        self,
        allocations: List[AllocationResult],
        funds: List[FundInput],
        profile: dict,
    ) -> PortfolioMetrics:
        """Calculate expected portfolio metrics."""
        # Create fund lookup
        fund_map = {f.scheme_code: f for f in funds}

        # Calculate weighted metrics
        expected_return = 0.0
        expected_volatility = 0.0
        total_weight = 0.0

        for alloc in allocations:
            fund = fund_map.get(alloc.scheme_code)
            if fund:
                ret = fund.return_3y or fund.return_1y or 10.0
                vol = fund.volatility or 15.0
                expected_return += alloc.weight * (ret / 100)
                expected_volatility += alloc.weight * (vol / 100)
                total_weight += alloc.weight

        if total_weight > 0:
            expected_return /= total_weight
            expected_volatility /= total_weight

        # Calculate Sharpe ratio
        sharpe = (expected_return - self.risk_free_rate) / max(expected_volatility, 0.01)

        # Calculate projected value
        horizon_years = profile.get("horizon_years", 10)
        monthly_sip = profile.get("monthly_sip", 0)
        lump_sum = profile.get("lump_sum", 0)

        # Future value calculation
        monthly_rate = expected_return / 12
        months = horizon_years * 12

        # FV of SIP: PMT * ((1 + r)^n - 1) / r
        if monthly_rate > 0 and monthly_sip > 0:
            sip_fv = monthly_sip * ((1 + monthly_rate) ** months - 1) / monthly_rate
        else:
            sip_fv = monthly_sip * months

        # FV of lump sum: PV * (1 + r)^n
        lump_fv = lump_sum * ((1 + expected_return) ** horizon_years)

        projected_value = sip_fv + lump_fv

        return PortfolioMetrics(
            expected_return=round(expected_return, 4),
            expected_volatility=round(expected_volatility, 4),
            sharpe_ratio=round(sharpe, 2),
            max_drawdown=round(expected_volatility * 2.5, 4),  # Rough estimate
            projected_value=round(projected_value, 0) if projected_value > 0 else None,
        )

    def get_model_version(self) -> str:
        return self.model_version
