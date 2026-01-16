"""
Persona classification service.
Rules-based classification with blended persona distribution.
Returns weighted distribution across all personas and blended allocation strategy.
"""

import time
from typing import Dict, Tuple, List
from dataclasses import dataclass, field

from app.schemas.profile import ProfileInput, PersonaResult


@dataclass
class Persona:
    id: str
    name: str
    slug: str
    risk_band: str
    description: str


@dataclass
class AllocationStrategy:
    """Asset allocation percentages for a persona"""
    equity: float
    debt: float
    hybrid: float
    gold: float
    international: float
    liquid: float


@dataclass
class PersonaWeight:
    """Persona with its weight in the distribution"""
    persona: Persona
    weight: float  # 0.0 - 1.0


@dataclass
class BlendedClassificationResult:
    """Full classification result with distribution and blended allocation"""
    primary_persona: PersonaResult
    distribution: List[Dict]  # [{persona: PersonaResult, weight: float}, ...]
    blended_allocation: Dict[str, float]  # {equity: 0.4, debt: 0.3, ...}
    confidence: float
    latency_ms: int
    model_version: str


# Predefined personas matching the database seed
PERSONAS = {
    "capital-guardian": Persona(
        id="capital-guardian",
        name="Capital Guardian",
        slug="capital-guardian",
        risk_band="Capital Protection",
        description="Conservative investor prioritizing capital preservation with steady, low-risk returns",
    ),
    "balanced-voyager": Persona(
        id="balanced-voyager",
        name="Balanced Voyager",
        slug="balanced-voyager",
        risk_band="Balanced Growth",
        description="Balanced investor seeking moderate growth with controlled risk exposure",
    ),
    "accelerated-builder": Persona(
        id="accelerated-builder",
        name="Accelerated Builder",
        slug="accelerated-builder",
        risk_band="Accelerated Growth",
        description="Aggressive investor focused on long-term wealth creation through high-growth investments",
    ),
}

# Allocation strategies for each persona
ALLOCATION_STRATEGIES = {
    "capital-guardian": AllocationStrategy(
        equity=0.15,
        debt=0.55,
        hybrid=0.15,
        gold=0.05,
        international=0.00,
        liquid=0.10,
    ),
    "balanced-voyager": AllocationStrategy(
        equity=0.40,
        debt=0.30,
        hybrid=0.15,
        gold=0.05,
        international=0.05,
        liquid=0.05,
    ),
    "accelerated-builder": AllocationStrategy(
        equity=0.65,
        debt=0.10,
        hybrid=0.10,
        gold=0.00,
        international=0.10,
        liquid=0.05,
    ),
}


class PersonaService:
    """Service for classifying user profiles into investment personas."""

    def __init__(self):
        self.model_version = "rules-v2-blended"

    def classify(
        self, profile: ProfileInput
    ) -> Tuple[PersonaResult, float, Dict[str, float], int]:
        """
        Classify a user profile into a persona (legacy method).

        Returns:
            Tuple of (persona, confidence, probabilities, latency_ms)
        """
        start_time = time.time()

        # Calculate scores for each persona
        scores = self._calculate_scores(profile)

        # Normalize to probabilities
        total = sum(scores.values())
        probabilities = {k: v / total for k, v in scores.items()}

        # Get the winning persona
        winning_slug = max(probabilities, key=probabilities.get)
        confidence = probabilities[winning_slug]

        persona = PERSONAS[winning_slug]
        result = PersonaResult(
            id=persona.id,
            name=persona.name,
            slug=persona.slug,
            risk_band=persona.risk_band,
            description=persona.description,
        )

        latency_ms = int((time.time() - start_time) * 1000)

        return result, confidence, probabilities, latency_ms

    def classify_blended(self, profile: ProfileInput) -> BlendedClassificationResult:
        """
        Classify a user profile with full distribution and blended allocation.

        Returns weighted distribution across all personas and calculates
        a blended asset allocation based on the weights.
        """
        start_time = time.time()

        # Calculate scores for each persona
        scores = self._calculate_scores(profile)

        # Normalize to probabilities (this is the distribution)
        total = sum(scores.values())
        distribution_weights = {k: v / total for k, v in scores.items()}

        # Calculate blended allocation
        blended_allocation = self._calculate_blended_allocation(distribution_weights)

        # Get the primary (highest weight) persona
        primary_slug = max(distribution_weights, key=distribution_weights.get)
        primary_persona_data = PERSONAS[primary_slug]
        primary_persona = PersonaResult(
            id=primary_persona_data.id,
            name=primary_persona_data.name,
            slug=primary_persona_data.slug,
            risk_band=primary_persona_data.risk_band,
            description=primary_persona_data.description,
        )

        # Build distribution list with persona details
        distribution = []
        for slug, weight in sorted(distribution_weights.items(), key=lambda x: -x[1]):
            persona_data = PERSONAS[slug]
            distribution.append({
                "persona": {
                    "id": persona_data.id,
                    "name": persona_data.name,
                    "slug": persona_data.slug,
                    "risk_band": persona_data.risk_band,
                    "description": persona_data.description,
                },
                "weight": round(weight, 4),
                "allocation": self._get_persona_allocation(slug),
            })

        latency_ms = int((time.time() - start_time) * 1000)

        return BlendedClassificationResult(
            primary_persona=primary_persona,
            distribution=distribution,
            blended_allocation=blended_allocation,
            confidence=distribution_weights[primary_slug],
            latency_ms=latency_ms,
            model_version=self.model_version,
        )

    def _calculate_blended_allocation(
        self, distribution: Dict[str, float]
    ) -> Dict[str, float]:
        """
        Calculate blended asset allocation based on persona distribution.

        For each asset class:
        blended_value = sum(persona_weight * persona_allocation[asset])
        """
        blended = {
            "equity": 0.0,
            "debt": 0.0,
            "hybrid": 0.0,
            "gold": 0.0,
            "international": 0.0,
            "liquid": 0.0,
        }

        for slug, weight in distribution.items():
            strategy = ALLOCATION_STRATEGIES[slug]
            blended["equity"] += weight * strategy.equity
            blended["debt"] += weight * strategy.debt
            blended["hybrid"] += weight * strategy.hybrid
            blended["gold"] += weight * strategy.gold
            blended["international"] += weight * strategy.international
            blended["liquid"] += weight * strategy.liquid

        # Round to 4 decimal places
        return {k: round(v, 4) for k, v in blended.items()}

    def _get_persona_allocation(self, slug: str) -> Dict[str, float]:
        """Get the allocation strategy for a specific persona."""
        strategy = ALLOCATION_STRATEGIES[slug]
        return {
            "equity": strategy.equity,
            "debt": strategy.debt,
            "hybrid": strategy.hybrid,
            "gold": strategy.gold,
            "international": strategy.international,
            "liquid": strategy.liquid,
        }

    def _calculate_scores(self, profile: ProfileInput) -> Dict[str, float]:
        """
        Calculate persona scores based on profile attributes.
        Logic matches mobile app's buildPersona function.
        """
        scores = {
            "capital-guardian": 0.0,
            "balanced-voyager": 0.0,
            "accelerated-builder": 0.0,
        }

        # Age-based scoring
        if profile.age >= 55:
            scores["capital-guardian"] += 3
            scores["balanced-voyager"] += 1
        elif profile.age >= 40:
            scores["capital-guardian"] += 1
            scores["balanced-voyager"] += 3
            scores["accelerated-builder"] += 1
        elif profile.age >= 30:
            scores["balanced-voyager"] += 2
            scores["accelerated-builder"] += 2
        else:  # Under 30
            scores["accelerated-builder"] += 3
            scores["balanced-voyager"] += 1

        # Investment horizon scoring
        if profile.horizon_years <= 3:
            scores["capital-guardian"] += 3
        elif profile.horizon_years <= 5:
            scores["capital-guardian"] += 2
            scores["balanced-voyager"] += 2
        elif profile.horizon_years <= 10:
            scores["balanced-voyager"] += 3
            scores["accelerated-builder"] += 1
        else:  # > 10 years
            scores["accelerated-builder"] += 3
            scores["balanced-voyager"] += 1

        # Risk tolerance scoring
        risk = profile.risk_tolerance.value
        if risk == "Conservative":
            scores["capital-guardian"] += 4
        elif risk == "Moderate":
            scores["balanced-voyager"] += 4
        else:  # Aggressive
            scores["accelerated-builder"] += 4

        # Volatility comfort scoring
        volatility = profile.volatility.value
        if volatility == "Low":
            scores["capital-guardian"] += 2
        elif volatility == "Medium":
            scores["balanced-voyager"] += 2
        else:  # High
            scores["accelerated-builder"] += 2

        # Liquidity needs scoring
        liquidity = profile.liquidity.value
        if liquidity == "High":
            scores["capital-guardian"] += 2
            scores["balanced-voyager"] += 1
        elif liquidity == "Medium":
            scores["balanced-voyager"] += 2
        else:  # Low
            scores["accelerated-builder"] += 2

        # Knowledge level scoring
        knowledge = profile.knowledge.value
        if knowledge == "Beginner":
            scores["capital-guardian"] += 1
            scores["balanced-voyager"] += 1
        elif knowledge == "Intermediate":
            scores["balanced-voyager"] += 1
            scores["accelerated-builder"] += 1
        else:  # Advanced
            scores["accelerated-builder"] += 2

        # Ensure minimum scores for probability calculation
        for key in scores:
            scores[key] = max(scores[key], 0.1)

        return scores

    def get_model_version(self) -> str:
        return self.model_version
