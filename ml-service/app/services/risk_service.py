"""
Risk assessment service.
Analyzes portfolio risk and provides recommendations.
"""

import time
from typing import List, Dict, Optional

from app.schemas.risk import RiskFactor


# Risk thresholds by persona
PERSONA_RISK_THRESHOLDS = {
    "capital-guardian": {
        "max_equity": 0.35,
        "max_single_fund": 0.25,
        "max_volatility": 10.0,
        "acceptable_risk_score": 30,
    },
    "balanced-voyager": {
        "max_equity": 0.65,
        "max_single_fund": 0.30,
        "max_volatility": 18.0,
        "acceptable_risk_score": 55,
    },
    "accelerated-builder": {
        "max_equity": 0.90,
        "max_single_fund": 0.35,
        "max_volatility": 25.0,
        "acceptable_risk_score": 75,
    },
}

# Category to asset class mapping
EQUITY_CATEGORIES = {
    "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "Multi Cap",
    "ELSS", "Focused", "Value", "Contra", "Dividend Yield", "Sectoral", "Thematic",
}

DEBT_CATEGORIES = {
    "Liquid", "Ultra Short Duration", "Low Duration", "Money Market",
    "Short Duration", "Medium Duration", "Corporate Bond", "Banking and PSU",
    "Gilt", "Dynamic Bond", "Credit Risk",
}


class RiskService:
    """Service for portfolio risk assessment."""

    def __init__(self):
        self.model_version = "risk-v1"

    def assess(
        self,
        profile: dict,
        current_portfolio: Optional[List[dict]] = None,
        proposed_portfolio: Optional[List[dict]] = None,
    ) -> tuple:
        """
        Assess portfolio risk.

        Returns:
            Tuple of (risk_level, risk_score, risk_factors, recommendations, persona_alignment, latency_ms)
        """
        start_time = time.time()

        # Use proposed portfolio if available, otherwise current
        portfolio = proposed_portfolio or current_portfolio or []

        if not portfolio:
            latency_ms = int((time.time() - start_time) * 1000)
            return (
                "Unknown",
                0,
                [],
                ["Please add funds to your portfolio for risk assessment"],
                "Unable to assess without portfolio data",
                latency_ms,
            )

        # Determine persona from profile
        risk_tolerance = profile.get("risk_tolerance", "Moderate")
        if risk_tolerance == "Conservative":
            persona_id = "capital-guardian"
        elif risk_tolerance == "Aggressive":
            persona_id = "accelerated-builder"
        else:
            persona_id = "balanced-voyager"

        thresholds = PERSONA_RISK_THRESHOLDS[persona_id]

        # Calculate risk factors
        risk_factors = []
        risk_score = 0

        # 1. Equity concentration risk
        equity_pct, equity_factor = self._assess_equity_concentration(portfolio, thresholds)
        if equity_factor:
            risk_factors.append(equity_factor)
            risk_score += equity_factor.contribution * 100

        # 2. Single fund concentration risk
        concentration_factor = self._assess_fund_concentration(portfolio, thresholds)
        if concentration_factor:
            risk_factors.append(concentration_factor)
            risk_score += concentration_factor.contribution * 100

        # 3. Sector concentration risk (simplified)
        sector_factor = self._assess_sector_concentration(portfolio)
        if sector_factor:
            risk_factors.append(sector_factor)
            risk_score += sector_factor.contribution * 100

        # 4. Volatility risk
        volatility_factor = self._assess_volatility_risk(portfolio, thresholds)
        if volatility_factor:
            risk_factors.append(volatility_factor)
            risk_score += volatility_factor.contribution * 100

        # 5. Horizon mismatch risk
        horizon_factor = self._assess_horizon_risk(portfolio, profile)
        if horizon_factor:
            risk_factors.append(horizon_factor)
            risk_score += horizon_factor.contribution * 100

        # Normalize risk score
        risk_score = min(100, risk_score)

        # Determine risk level
        risk_level = self._get_risk_level(risk_score)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            risk_factors, equity_pct, thresholds, profile
        )

        # Persona alignment
        acceptable = thresholds["acceptable_risk_score"]
        if risk_score <= acceptable:
            persona_alignment = f"Risk level appropriate for {self._persona_name(persona_id)} profile"
        elif risk_score <= acceptable + 15:
            persona_alignment = f"Risk slightly elevated for {self._persona_name(persona_id)} profile"
        else:
            persona_alignment = f"Risk significantly higher than recommended for {self._persona_name(persona_id)} profile"

        latency_ms = int((time.time() - start_time) * 1000)

        return risk_level, risk_score, risk_factors, recommendations, persona_alignment, latency_ms

    def _assess_equity_concentration(
        self, portfolio: List[dict], thresholds: dict
    ) -> tuple:
        """Assess equity concentration risk."""
        equity_weight = 0
        for fund in portfolio:
            category = fund.get("category", "")
            weight = fund.get("weight", 0)
            if category in EQUITY_CATEGORIES:
                equity_weight += weight

        max_equity = thresholds["max_equity"]

        if equity_weight > max_equity:
            excess = equity_weight - max_equity
            contribution = min(0.45, 0.15 + excess)
            severity = "High" if excess > 0.2 else "Moderate"
            return equity_weight, RiskFactor(
                name="Equity Concentration",
                contribution=round(contribution, 2),
                severity=severity,
                description=f"{equity_weight*100:.0f}% equity exposure exceeds {max_equity*100:.0f}% threshold",
            )
        elif equity_weight > max_equity * 0.8:
            return equity_weight, RiskFactor(
                name="Equity Concentration",
                contribution=0.1,
                severity="Low",
                description=f"{equity_weight*100:.0f}% equity exposure approaching limit",
            )

        return equity_weight, None

    def _assess_fund_concentration(
        self, portfolio: List[dict], thresholds: dict
    ) -> Optional[RiskFactor]:
        """Assess single fund concentration risk."""
        max_weight = 0
        max_fund = ""

        for fund in portfolio:
            weight = fund.get("weight", 0)
            if weight > max_weight:
                max_weight = weight
                max_fund = fund.get("scheme_name", "Unknown")

        threshold = thresholds["max_single_fund"]

        if max_weight > threshold:
            excess = max_weight - threshold
            contribution = min(0.30, 0.10 + excess * 0.5)
            return RiskFactor(
                name="Fund Concentration",
                contribution=round(contribution, 2),
                severity="High" if excess > 0.15 else "Moderate",
                description=f"{max_fund[:30]}... has {max_weight*100:.0f}% allocation, exceeding {threshold*100:.0f}% limit",
            )

        return None

    def _assess_sector_concentration(
        self, portfolio: List[dict]
    ) -> Optional[RiskFactor]:
        """Assess sector/category concentration risk."""
        category_weights: Dict[str, float] = {}

        for fund in portfolio:
            category = fund.get("category", "Unknown")
            weight = fund.get("weight", 0)
            category_weights[category] = category_weights.get(category, 0) + weight

        if not category_weights:
            return None

        # Check for concentration in any single category
        max_category = max(category_weights, key=category_weights.get)
        max_weight = category_weights[max_category]

        if max_weight > 0.5:
            return RiskFactor(
                name="Sector Concentration",
                contribution=0.25,
                severity="Moderate",
                description=f"{max_weight*100:.0f}% concentrated in {max_category}",
            )
        elif max_weight > 0.35:
            return RiskFactor(
                name="Sector Concentration",
                contribution=0.10,
                severity="Low",
                description=f"Diversified across sectors, {max_category} is largest at {max_weight*100:.0f}%",
            )

        return None

    def _assess_volatility_risk(
        self, portfolio: List[dict], thresholds: dict
    ) -> Optional[RiskFactor]:
        """Assess portfolio volatility risk."""
        weighted_vol = 0
        total_weight = 0

        for fund in portfolio:
            vol = fund.get("volatility", 15)  # Default 15% if unknown
            weight = fund.get("weight", 0)
            weighted_vol += vol * weight
            total_weight += weight

        if total_weight == 0:
            return None

        avg_vol = weighted_vol / total_weight
        max_vol = thresholds["max_volatility"]

        if avg_vol > max_vol:
            excess = avg_vol - max_vol
            contribution = min(0.35, 0.15 + excess / 100)
            return RiskFactor(
                name="Volatility Risk",
                contribution=round(contribution, 2),
                severity="High" if excess > 10 else "Moderate",
                description=f"Portfolio volatility of {avg_vol:.1f}% exceeds {max_vol}% threshold",
            )

        return None

    def _assess_horizon_risk(
        self, portfolio: List[dict], profile: dict
    ) -> Optional[RiskFactor]:
        """Assess investment horizon vs portfolio risk mismatch."""
        horizon_raw = profile.get("horizon_years", 10)
        horizon = int(horizon_raw) if isinstance(horizon_raw, str) else horizon_raw

        # Calculate equity exposure
        equity_weight = sum(
            f.get("weight", 0)
            for f in portfolio
            if f.get("category", "") in EQUITY_CATEGORIES
        )

        # Short horizon with high equity
        if horizon <= 3 and equity_weight > 0.4:
            return RiskFactor(
                name="Horizon Mismatch",
                contribution=0.25,
                severity="High",
                description=f"High equity ({equity_weight*100:.0f}%) inappropriate for {horizon}-year horizon",
            )
        elif horizon <= 5 and equity_weight > 0.6:
            return RiskFactor(
                name="Horizon Mismatch",
                contribution=0.15,
                severity="Moderate",
                description=f"Consider reducing equity for {horizon}-year horizon",
            )

        return None

    def _get_risk_level(self, score: float) -> str:
        """Convert risk score to level."""
        if score <= 25:
            return "Low"
        elif score <= 45:
            return "Moderate"
        elif score <= 65:
            return "Moderate-High"
        elif score <= 80:
            return "High"
        else:
            return "Very High"

    def _generate_recommendations(
        self,
        risk_factors: List[RiskFactor],
        equity_pct: float,
        thresholds: dict,
        profile: dict,
    ) -> List[str]:
        """Generate risk mitigation recommendations."""
        recommendations = []

        for factor in risk_factors:
            if factor.severity in ["High", "Critical"]:
                if "Equity" in factor.name:
                    debt_needed = equity_pct - thresholds["max_equity"]
                    recommendations.append(
                        f"Consider adding {debt_needed*100:.0f}% allocation to debt funds for stability"
                    )
                elif "Concentration" in factor.name and "Fund" in factor.name:
                    recommendations.append(
                        "Diversify by reducing largest fund allocation below 30%"
                    )
                elif "Sector" in factor.name:
                    recommendations.append(
                        "Add funds from different sectors to improve diversification"
                    )
                elif "Volatility" in factor.name:
                    recommendations.append(
                        "Consider adding low-volatility debt or hybrid funds"
                    )
                elif "Horizon" in factor.name:
                    horizon = profile.get("horizon_years", 10)
                    recommendations.append(
                        f"Reduce equity exposure for your {horizon}-year investment horizon"
                    )

        # Generic recommendations if few specific ones
        if len(recommendations) < 2:
            recommendations.append("Maintain SIP discipline during market corrections")
            recommendations.append("Review portfolio allocation annually")

        return recommendations[:5]  # Limit to 5 recommendations

    def _persona_name(self, persona_id: str) -> str:
        """Get display name for persona."""
        names = {
            "capital-guardian": "Capital Guardian",
            "balanced-voyager": "Balanced Voyager",
            "accelerated-builder": "Accelerated Builder",
        }
        return names.get(persona_id, "your investment")

    def get_model_version(self) -> str:
        return self.model_version
