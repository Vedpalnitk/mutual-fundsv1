"""
Fund recommendation service.
Recommends funds based on persona and user profile.
Supports both single-persona and blended allocation recommendations.
"""

import time
from typing import List, Optional, Dict, Tuple
from dataclasses import dataclass

from app.schemas.recommendation import (
    FundRecommendation,
    AllocationTarget,
    AssetClassBreakdown,
)


# Sample fund database (in production, this would come from database/cache)
SAMPLE_FUNDS = [
    {
        "scheme_code": 120503,
        "scheme_name": "Quant Flexi Cap Fund Direct Growth",
        "fund_house": "Quant Mutual Fund",
        "category": "Flexi Cap",
        "return_1y": 28.5,
        "return_3y": 24.3,
        "return_5y": 22.1,
        "volatility": 18.5,
        "sharpe_ratio": 1.2,
        "expense_ratio": 0.58,
    },
    {
        "scheme_code": 119598,
        "scheme_name": "Parag Parikh Flexi Cap Fund Direct Growth",
        "fund_house": "PPFAS Mutual Fund",
        "category": "Flexi Cap",
        "return_1y": 22.4,
        "return_3y": 18.7,
        "return_5y": 19.2,
        "volatility": 14.2,
        "sharpe_ratio": 1.1,
        "expense_ratio": 0.63,
    },
    {
        "scheme_code": 120505,
        "scheme_name": "Quant Mid Cap Fund Direct Growth",
        "fund_house": "Quant Mutual Fund",
        "category": "Mid Cap",
        "return_1y": 35.2,
        "return_3y": 28.5,
        "return_5y": 25.3,
        "volatility": 22.1,
        "sharpe_ratio": 1.15,
        "expense_ratio": 0.62,
    },
    {
        "scheme_code": 118989,
        "scheme_name": "HDFC Mid-Cap Opportunities Fund Direct Growth",
        "fund_house": "HDFC Mutual Fund",
        "category": "Mid Cap",
        "return_1y": 30.1,
        "return_3y": 25.2,
        "return_5y": 21.8,
        "volatility": 19.8,
        "sharpe_ratio": 1.08,
        "expense_ratio": 0.78,
    },
    {
        "scheme_code": 119064,
        "scheme_name": "Nippon India Small Cap Fund Direct Growth",
        "fund_house": "Nippon India Mutual Fund",
        "category": "Small Cap",
        "return_1y": 42.3,
        "return_3y": 32.1,
        "return_5y": 28.5,
        "volatility": 26.3,
        "sharpe_ratio": 1.18,
        "expense_ratio": 0.86,
    },
    {
        "scheme_code": 118551,
        "scheme_name": "SBI Large & Midcap Fund Direct Growth",
        "fund_house": "SBI Mutual Fund",
        "category": "Large & Mid Cap",
        "return_1y": 24.5,
        "return_3y": 20.3,
        "return_5y": 18.9,
        "volatility": 16.5,
        "sharpe_ratio": 1.02,
        "expense_ratio": 0.82,
    },
    {
        "scheme_code": 119097,
        "scheme_name": "ICICI Prudential Bluechip Fund Direct Growth",
        "fund_house": "ICICI Prudential Mutual Fund",
        "category": "Large Cap",
        "return_1y": 18.2,
        "return_3y": 15.8,
        "return_5y": 14.2,
        "volatility": 13.5,
        "sharpe_ratio": 0.92,
        "expense_ratio": 0.88,
    },
    {
        "scheme_code": 120716,
        "scheme_name": "HDFC Corporate Bond Fund Direct Growth",
        "fund_house": "HDFC Mutual Fund",
        "category": "Corporate Bond",
        "return_1y": 7.8,
        "return_3y": 7.2,
        "return_5y": 7.5,
        "volatility": 2.1,
        "sharpe_ratio": 0.58,
        "expense_ratio": 0.28,
    },
    {
        "scheme_code": 119243,
        "scheme_name": "ICICI Prudential Liquid Fund Direct Growth",
        "fund_house": "ICICI Prudential Mutual Fund",
        "category": "Liquid",
        "return_1y": 6.5,
        "return_3y": 5.8,
        "return_5y": 5.5,
        "volatility": 0.3,
        "sharpe_ratio": 0.35,
        "expense_ratio": 0.18,
    },
    {
        "scheme_code": 118778,
        "scheme_name": "HDFC Balanced Advantage Fund Direct Growth",
        "fund_house": "HDFC Mutual Fund",
        "category": "Balanced Advantage",
        "return_1y": 16.5,
        "return_3y": 14.2,
        "return_5y": 13.8,
        "volatility": 10.2,
        "sharpe_ratio": 0.85,
        "expense_ratio": 0.92,
    },
    # Gold Funds
    {
        "scheme_code": 120828,
        "scheme_name": "SBI Gold Fund Direct Growth",
        "fund_house": "SBI Mutual Fund",
        "category": "Gold",
        "return_1y": 14.2,
        "return_3y": 12.8,
        "return_5y": 11.5,
        "volatility": 12.5,
        "sharpe_ratio": 0.72,
        "expense_ratio": 0.35,
    },
    {
        "scheme_code": 119190,
        "scheme_name": "Nippon India Gold Savings Fund Direct Growth",
        "fund_house": "Nippon India Mutual Fund",
        "category": "Gold",
        "return_1y": 13.8,
        "return_3y": 12.5,
        "return_5y": 11.2,
        "volatility": 12.8,
        "sharpe_ratio": 0.68,
        "expense_ratio": 0.32,
    },
    {
        "scheme_code": 120847,
        "scheme_name": "HDFC Gold Fund Direct Growth",
        "fund_house": "HDFC Mutual Fund",
        "category": "Gold",
        "return_1y": 14.5,
        "return_3y": 13.1,
        "return_5y": 11.8,
        "volatility": 12.3,
        "sharpe_ratio": 0.75,
        "expense_ratio": 0.38,
    },
    # International Funds
    {
        "scheme_code": 125494,
        "scheme_name": "Motilal Oswal Nasdaq 100 FOF Direct Growth",
        "fund_house": "Motilal Oswal Mutual Fund",
        "category": "FOF - International",
        "return_1y": 32.5,
        "return_3y": 15.2,
        "return_5y": 18.8,
        "volatility": 22.5,
        "sharpe_ratio": 0.92,
        "expense_ratio": 0.52,
    },
    {
        "scheme_code": 145552,
        "scheme_name": "ICICI Prudential US Bluechip Equity Fund Direct Growth",
        "fund_house": "ICICI Prudential Mutual Fund",
        "category": "FOF - International",
        "return_1y": 28.3,
        "return_3y": 12.8,
        "return_5y": 14.5,
        "volatility": 20.2,
        "sharpe_ratio": 0.78,
        "expense_ratio": 0.58,
    },
    {
        "scheme_code": 119718,
        "scheme_name": "Edelweiss Greater China Equity Off-Shore Fund Direct Growth",
        "fund_house": "Edelweiss Mutual Fund",
        "category": "FOF - International",
        "return_1y": -5.2,
        "return_3y": -8.5,
        "return_5y": 2.3,
        "volatility": 25.8,
        "sharpe_ratio": -0.15,
        "expense_ratio": 1.12,
    },
]

# Persona-specific category preferences
PERSONA_PREFERENCES = {
    "capital-guardian": {
        "preferred_categories": ["Liquid", "Corporate Bond", "Short Duration", "Balanced Advantage", "Large Cap"],
        "weight_preferences": {"debt": 0.6, "hybrid": 0.25, "equity": 0.15},
        "max_volatility": 10.0,
    },
    "balanced-voyager": {
        "preferred_categories": ["Flexi Cap", "Large & Mid Cap", "Large Cap", "Balanced Advantage", "Corporate Bond"],
        "weight_preferences": {"equity": 0.5, "hybrid": 0.3, "debt": 0.2},
        "max_volatility": 18.0,
    },
    "accelerated-builder": {
        "preferred_categories": ["Small Cap", "Mid Cap", "Flexi Cap", "Large & Mid Cap", "Sectoral"],
        "weight_preferences": {"equity": 0.85, "hybrid": 0.1, "debt": 0.05},
        "max_volatility": 30.0,
    },
}

# Map fund categories to asset classes
CATEGORY_TO_ASSET_CLASS = {
    # Equity categories
    "Large Cap": "equity",
    "Mid Cap": "equity",
    "Small Cap": "equity",
    "Flexi Cap": "equity",
    "Large & Mid Cap": "equity",
    "Multi Cap": "equity",
    "Focused": "equity",
    "ELSS": "equity",
    "Sectoral": "equity",
    "Thematic": "equity",
    "Index": "equity",
    "Contra": "equity",
    "Value": "equity",
    "Dividend Yield": "equity",
    # Equity (additional)
    "Equity Scheme - Sectoral/ Thematic": "equity",
    # Debt categories
    "Liquid": "liquid",
    "Overnight": "liquid",
    "Ultra Short Duration": "debt",
    "Income": "debt",
    "Low Duration": "debt",
    "Short Duration": "debt",
    "Medium Duration": "debt",
    "Medium to Long Duration": "debt",
    "Long Duration": "debt",
    "Dynamic Bond": "debt",
    "Corporate Bond": "debt",
    "Credit Risk": "debt",
    "Banking & PSU": "debt",
    "Gilt": "debt",
    "Floater": "debt",
    # Hybrid categories
    "Balanced Advantage": "hybrid",
    "Aggressive Hybrid": "hybrid",
    "Conservative Hybrid": "hybrid",
    "Multi Asset": "hybrid",
    "Equity Savings": "hybrid",
    "Arbitrage": "hybrid",
    # Gold
    "Gold": "gold",
    "Gold ETF": "gold",
    # International
    "International": "international",
    "FOF - International": "international",
}

# Asset class scoring preferences based on target allocation
ASSET_CLASS_VOLATILITY_LIMITS = {
    "equity": 30.0,
    "debt": 5.0,
    "hybrid": 15.0,
    "gold": 20.0,
    "international": 25.0,
    "liquid": 1.0,
}


def _get_real_fund_data() -> List[dict]:
    """Get fund data from the fund data service (real MFAPI.in data) or fallback to SAMPLE_FUNDS."""
    try:
        from app.services.fund_data_service import get_funds_as_dict_list
        funds = get_funds_as_dict_list()
        if funds:
            return funds
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to get real fund data: {e}, using fallback")
    return SAMPLE_FUNDS


class RecommendationService:
    """Service for fund recommendations."""

    def __init__(self):
        self.model_version = "recommender-v1"
        self._funds_cache = None
        self._cache_time = None

    @property
    def funds_db(self) -> List[dict]:
        """Get funds database with caching (refreshes every 5 minutes)."""
        import time as t
        now = t.time()

        # Refresh cache every 5 minutes
        if self._funds_cache is None or self._cache_time is None or (now - self._cache_time) > 300:
            self._funds_cache = _get_real_fund_data()
            self._cache_time = now

        return self._funds_cache

    def recommend(
        self,
        persona_id: str,
        profile: dict,
        top_n: int = 5,
        category_filters: Optional[List[str]] = None,
        exclude_funds: Optional[List[int]] = None,
    ) -> tuple:
        """
        Recommend funds based on persona and preferences.

        Returns:
            Tuple of (recommendations, persona_alignment, latency_ms)
        """
        start_time = time.time()

        # Get persona preferences
        prefs = PERSONA_PREFERENCES.get(
            persona_id, PERSONA_PREFERENCES["balanced-voyager"]
        )

        # Filter and score funds
        candidates = self._filter_funds(
            category_filters=category_filters,
            exclude_funds=exclude_funds or [],
            max_volatility=prefs["max_volatility"],
        )

        # Score funds based on persona preferences
        scored = self._score_funds(candidates, prefs, profile)

        # Select top N
        top_funds = scored[:top_n]

        # Calculate allocation weights
        total_score = sum(s for _, s in top_funds)
        recommendations = []

        for fund, score in top_funds:
            weight = score / total_score if total_score > 0 else 1 / len(top_funds)
            reasoning = self._generate_reasoning(fund, prefs, profile)

            rec = FundRecommendation(
                scheme_code=fund["scheme_code"],
                scheme_name=fund["scheme_name"],
                fund_house=fund.get("fund_house"),
                category=fund["category"],
                score=round(score, 2),
                suggested_allocation=round(weight, 2),
                reasoning=reasoning,
                metrics={
                    "return_1y": fund.get("return_1y"),
                    "return_3y": fund.get("return_3y"),
                    "volatility": fund.get("volatility"),
                    "sharpe_ratio": fund.get("sharpe_ratio"),
                },
            )
            recommendations.append(rec)

        # Generate persona alignment message
        persona_alignment = self._get_persona_alignment(persona_id, recommendations)

        latency_ms = int((time.time() - start_time) * 1000)

        return recommendations, persona_alignment, latency_ms

    def _filter_funds(
        self,
        category_filters: Optional[List[str]],
        exclude_funds: List[int],
        max_volatility: float,
    ) -> List[dict]:
        """Filter funds based on criteria."""
        filtered = []

        for fund in self.funds_db:
            # Exclude specific funds
            if fund["scheme_code"] in exclude_funds:
                continue

            # Filter by category
            if category_filters and fund["category"] not in category_filters:
                continue

            # Filter by volatility
            if fund.get("volatility", 0) > max_volatility:
                continue

            filtered.append(fund)

        return filtered

    def _score_funds(
        self, funds: List[dict], prefs: dict, profile: dict
    ) -> List[tuple]:
        """Score funds based on persona preferences and profile."""
        scored = []

        preferred_categories = prefs["preferred_categories"]

        for fund in funds:
            score = 0.0

            # Category preference bonus (0-0.3)
            if fund["category"] in preferred_categories:
                idx = preferred_categories.index(fund["category"])
                score += 0.3 * (1 - idx / len(preferred_categories))

            # Return score (0-0.3)
            return_3y = fund.get("return_3y", 0)
            score += 0.3 * min(return_3y / 30, 1.0)

            # Risk-adjusted return (0-0.2)
            sharpe = fund.get("sharpe_ratio", 0)
            score += 0.2 * min(sharpe / 1.5, 1.0)

            # Expense ratio (0-0.1, lower is better)
            expense = fund.get("expense_ratio", 2.0)
            score += 0.1 * max(0, 1 - expense / 2.0)

            # Volatility fit (0-0.1)
            volatility = fund.get("volatility", 20)
            max_vol = prefs["max_volatility"]
            if volatility <= max_vol:
                score += 0.1 * (1 - volatility / max_vol)

            scored.append((fund, score))

        # Sort by score descending
        return sorted(scored, key=lambda x: x[1], reverse=True)

    def _generate_reasoning(
        self, fund: dict, prefs: dict, profile: dict
    ) -> str:
        """Generate human-readable reasoning for recommendation."""
        reasons = []

        return_3y = fund.get("return_3y", 0)
        if return_3y > 20:
            reasons.append(f"Strong 3Y returns of {return_3y}%")
        elif return_3y > 10:
            reasons.append(f"Solid 3Y returns of {return_3y}%")

        sharpe = fund.get("sharpe_ratio", 0)
        if sharpe > 1.0:
            reasons.append(f"excellent risk-adjusted returns (Sharpe: {sharpe})")
        elif sharpe > 0.7:
            reasons.append(f"good risk-adjusted returns (Sharpe: {sharpe})")

        volatility = fund.get("volatility", 0)
        if volatility < 10:
            reasons.append("low volatility for stability")
        elif volatility < 18:
            reasons.append("moderate volatility")

        expense = fund.get("expense_ratio", 0)
        if expense < 0.5:
            reasons.append("very low expense ratio")
        elif expense < 0.8:
            reasons.append("competitive expense ratio")

        category = fund["category"]
        if category in prefs["preferred_categories"][:2]:
            reasons.append(f"ideal {category} exposure for your profile")

        return ", ".join(reasons) if reasons else f"Well-suited {category} fund for diversification"

    def _get_persona_alignment(
        self, persona_id: str, recommendations: List[FundRecommendation]
    ) -> str:
        """Generate persona alignment message."""
        persona_names = {
            "capital-guardian": "Capital Guardian",
            "balanced-voyager": "Balanced Voyager",
            "accelerated-builder": "Accelerated Builder",
        }
        persona_name = persona_names.get(persona_id, "your investment")

        # Calculate average volatility
        avg_vol = sum(r.metrics.get("volatility", 15) for r in recommendations) / len(recommendations) if recommendations else 0

        if persona_id == "capital-guardian":
            if avg_vol < 10:
                return f"Low volatility portfolio well-aligned with {persona_name} profile"
            return f"Conservative selection suitable for {persona_name} profile"
        elif persona_id == "balanced-voyager":
            return f"Balanced mix of growth and stability for {persona_name} profile"
        else:
            return f"High growth potential aligned with {persona_name} profile"

    def get_model_version(self) -> str:
        return self.model_version

    def recommend_blended(
        self,
        blended_allocation: AllocationTarget,
        profile: dict,
        top_n: int = 6,
        investment_amount: Optional[float] = None,
        category_filters: Optional[List[str]] = None,
        exclude_funds: Optional[List[int]] = None,
    ) -> Tuple[List[FundRecommendation], List[AssetClassBreakdown], float, str, int]:
        """
        Recommend funds based on blended allocation targets.

        Returns:
            Tuple of (recommendations, asset_class_breakdown, alignment_score, alignment_message, latency_ms)
        """
        start_time = time.time()

        # Convert allocation to dict
        target_alloc = {
            "equity": blended_allocation.equity,
            "debt": blended_allocation.debt,
            "hybrid": blended_allocation.hybrid,
            "gold": blended_allocation.gold,
            "international": blended_allocation.international,
            "liquid": blended_allocation.liquid,
        }

        # Filter out zero allocations
        active_allocations = {k: v for k, v in target_alloc.items() if v > 0}

        # Group funds by asset class
        funds_by_class = self._group_funds_by_asset_class(
            category_filters=category_filters,
            exclude_funds=exclude_funds or [],
        )

        # Determine funds per asset class based on allocation
        funds_per_class = self._allocate_fund_slots(active_allocations, top_n)

        # Select best funds for each asset class
        recommendations = []
        actual_allocations = {}

        for asset_class, num_funds in funds_per_class.items():
            if num_funds == 0 or asset_class not in funds_by_class:
                continue

            # Get volatility limit for this asset class
            max_vol = ASSET_CLASS_VOLATILITY_LIMITS.get(asset_class, 30.0)

            # Score and select funds for this asset class
            class_funds = funds_by_class[asset_class]
            scored = self._score_funds_for_asset_class(class_funds, max_vol, profile)
            selected = scored[:num_funds]

            for fund, score in selected:
                rec = FundRecommendation(
                    scheme_code=fund["scheme_code"],
                    scheme_name=fund["scheme_name"],
                    fund_house=fund.get("fund_house"),
                    category=fund["category"],
                    asset_class=asset_class,
                    score=round(score, 2),
                    suggested_allocation=0.0,  # Will be set below
                    suggested_amount=None,
                    reasoning=self._generate_blended_reasoning(fund, asset_class, target_alloc[asset_class]),
                    metrics={
                        "return_1y": fund.get("return_1y"),
                        "return_3y": fund.get("return_3y"),
                        "volatility": fund.get("volatility"),
                        "sharpe_ratio": fund.get("sharpe_ratio"),
                    },
                )
                recommendations.append(rec)
                actual_allocations[asset_class] = actual_allocations.get(asset_class, 0) + 1

        # Calculate suggested allocations based on target
        self._distribute_allocations(recommendations, target_alloc, investment_amount)

        # Build asset class breakdown
        breakdown = self._build_asset_class_breakdown(
            recommendations, target_alloc, investment_amount
        )

        # Calculate alignment score
        alignment_score = self._calculate_alignment_score(breakdown, target_alloc)
        alignment_message = self._generate_alignment_message(alignment_score, breakdown)

        latency_ms = int((time.time() - start_time) * 1000)

        return recommendations, breakdown, alignment_score, alignment_message, latency_ms

    def _group_funds_by_asset_class(
        self,
        category_filters: Optional[List[str]],
        exclude_funds: List[int],
    ) -> Dict[str, List[dict]]:
        """Group available funds by their asset class."""
        grouped = {}

        for fund in self.funds_db:
            if fund["scheme_code"] in exclude_funds:
                continue

            category = fund["category"]
            if category_filters and category not in category_filters:
                continue

            # Use asset_class from fund data if available, otherwise derive from category
            asset_class = fund.get("asset_class") or CATEGORY_TO_ASSET_CLASS.get(category, "equity")
            if asset_class not in grouped:
                grouped[asset_class] = []
            grouped[asset_class].append(fund)

        return grouped

    def _allocate_fund_slots(
        self, allocations: Dict[str, float], total_funds: int
    ) -> Dict[str, int]:
        """Determine how many funds to allocate to each asset class."""
        if not allocations:
            return {}

        # Normalize allocations
        total_alloc = sum(allocations.values())
        if total_alloc == 0:
            return {}

        normalized = {k: v / total_alloc for k, v in allocations.items()}

        # Count asset classes that need at least 1 fund (>= 3% allocation)
        min_allocation_classes = [k for k, v in normalized.items() if v >= 0.03]
        min_required = len(min_allocation_classes)

        # First pass: give each eligible asset class exactly 1 fund
        fund_counts = {}
        remaining = total_funds

        for asset_class in min_allocation_classes:
            fund_counts[asset_class] = 1
            remaining -= 1

        # Second pass: distribute remaining slots proportionally to weight
        if remaining > 0:
            # Calculate additional funds based on weight, excluding the 1 already given
            additional = {}
            for asset_class, weight in normalized.items():
                if weight >= 0.03:
                    # Proportional share of remaining slots
                    extra = round(weight * remaining)
                    additional[asset_class] = extra

            # Sort by additional count descending to prioritize high-allocation classes
            for asset_class, extra in sorted(additional.items(), key=lambda x: -x[1]):
                if remaining <= 0:
                    break
                to_add = min(extra, remaining)
                fund_counts[asset_class] += to_add
                remaining -= to_add

        # Final pass: distribute any remaining slots to highest allocation classes
        if remaining > 0:
            sorted_classes = sorted(normalized.items(), key=lambda x: -x[1])
            for asset_class, weight in sorted_classes:
                if remaining <= 0:
                    break
                if weight >= 0.03:
                    fund_counts[asset_class] += 1
                    remaining -= 1

        return fund_counts

    def _score_funds_for_asset_class(
        self, funds: List[dict], max_volatility: float, profile: dict
    ) -> List[Tuple[dict, float]]:
        """Score funds within an asset class."""
        scored = []

        for fund in funds:
            # Skip if volatility exceeds limit
            if fund.get("volatility", 0) > max_volatility:
                continue

            score = 0.0

            # Return score (0-0.35)
            return_3y = fund.get("return_3y", 0)
            score += 0.35 * min(return_3y / 30, 1.0)

            # Sharpe ratio (0-0.25)
            sharpe = fund.get("sharpe_ratio", 0)
            score += 0.25 * min(sharpe / 1.5, 1.0)

            # Expense ratio (0-0.2, lower is better)
            expense = fund.get("expense_ratio", 2.0)
            score += 0.2 * max(0, 1 - expense / 2.0)

            # Volatility fit (0-0.2, prefer lower within limit)
            volatility = fund.get("volatility", max_volatility)
            score += 0.2 * (1 - volatility / max_volatility)

            scored.append((fund, score))

        return sorted(scored, key=lambda x: x[1], reverse=True)

    def _distribute_allocations(
        self,
        recommendations: List[FundRecommendation],
        target_alloc: Dict[str, float],
        investment_amount: Optional[float],
    ) -> None:
        """Distribute allocation percentages across recommendations."""
        if not recommendations:
            return

        # Group recommendations by asset class
        by_class = {}
        for rec in recommendations:
            ac = rec.asset_class or "equity"
            if ac not in by_class:
                by_class[ac] = []
            by_class[ac].append(rec)

        # Distribute target allocation within each class
        for asset_class, recs in by_class.items():
            class_allocation = target_alloc.get(asset_class, 0)
            per_fund = class_allocation / len(recs) if recs else 0

            for rec in recs:
                rec.suggested_allocation = round(per_fund, 4)
                if investment_amount:
                    rec.suggested_amount = round(per_fund * investment_amount, 2)

    def _build_asset_class_breakdown(
        self,
        recommendations: List[FundRecommendation],
        target_alloc: Dict[str, float],
        investment_amount: Optional[float],
    ) -> List[AssetClassBreakdown]:
        """Build breakdown of recommendations by asset class."""
        breakdown = []

        # Calculate actual allocations
        actual = {}
        counts = {}
        for rec in recommendations:
            ac = rec.asset_class or "equity"
            actual[ac] = actual.get(ac, 0) + rec.suggested_allocation
            counts[ac] = counts.get(ac, 0) + 1

        # Build breakdown for each asset class with funds or targets
        all_classes = set(target_alloc.keys()) | set(actual.keys())

        for asset_class in sorted(all_classes):
            target = target_alloc.get(asset_class, 0)
            actual_alloc = actual.get(asset_class, 0)
            fund_count = counts.get(asset_class, 0)
            total_amount = round(actual_alloc * investment_amount, 2) if investment_amount else None

            breakdown.append(
                AssetClassBreakdown(
                    asset_class=asset_class,
                    target_allocation=round(target, 4),
                    actual_allocation=round(actual_alloc, 4),
                    fund_count=fund_count,
                    total_amount=total_amount,
                )
            )

        return breakdown

    def _calculate_alignment_score(
        self, breakdown: List[AssetClassBreakdown], target_alloc: Dict[str, float]
    ) -> float:
        """Calculate how well actual allocations match targets."""
        if not breakdown:
            return 0.0

        total_deviation = 0.0
        total_weight = 0.0

        for b in breakdown:
            target = b.target_allocation
            actual = b.actual_allocation
            if target > 0:
                deviation = abs(target - actual) / target
                total_deviation += deviation * target
                total_weight += target

        if total_weight == 0:
            return 1.0

        avg_deviation = total_deviation / total_weight
        return round(max(0, 1 - avg_deviation), 2)

    def _generate_alignment_message(
        self, score: float, breakdown: List[AssetClassBreakdown]
    ) -> str:
        """Generate human-readable alignment message."""
        if score >= 0.95:
            return f"Portfolio closely matches blended allocation targets with {int(score * 100)}% alignment"
        elif score >= 0.85:
            return f"Portfolio well-aligned with blended targets ({int(score * 100)}% alignment)"
        elif score >= 0.70:
            return f"Portfolio reasonably aligned with targets ({int(score * 100)}% alignment). Some asset classes have limited fund options."
        else:
            return f"Portfolio partially aligned ({int(score * 100)}%). Consider adjusting targets or expanding fund universe."

    def _generate_blended_reasoning(
        self, fund: dict, asset_class: str, target_allocation: float
    ) -> str:
        """Generate reasoning for blended recommendation."""
        reasons = []

        # Target allocation context
        target_pct = int(target_allocation * 100)
        reasons.append(f"Selected for {target_pct}% {asset_class} target")

        # Performance
        return_3y = fund.get("return_3y", 0)
        if return_3y > 20:
            reasons.append(f"strong 3Y returns ({return_3y}%)")
        elif return_3y > 10:
            reasons.append(f"solid 3Y returns ({return_3y}%)")

        # Risk-adjusted returns
        sharpe = fund.get("sharpe_ratio", 0)
        if sharpe > 1.0:
            reasons.append("excellent risk-adjusted performance")
        elif sharpe > 0.7:
            reasons.append("good risk-adjusted performance")

        # Volatility
        volatility = fund.get("volatility", 0)
        if volatility < 5:
            reasons.append("very low volatility")
        elif volatility < 12:
            reasons.append("low volatility")

        return ", ".join(reasons) if reasons else f"Well-suited {asset_class} fund for diversification"
