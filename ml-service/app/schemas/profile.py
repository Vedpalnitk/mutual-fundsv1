from pydantic import BaseModel, Field
from typing import Optional, Dict
from enum import Enum


class Liquidity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class RiskTolerance(str, Enum):
    CONSERVATIVE = "Conservative"
    MODERATE = "Moderate"
    AGGRESSIVE = "Aggressive"


class Knowledge(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class Volatility(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class ProfileInput(BaseModel):
    """User profile input for persona classification."""

    age: int = Field(..., ge=18, le=100, description="User age")
    goal: Optional[str] = Field(None, description="Investment goal")
    target_amount: Optional[float] = Field(None, ge=0, description="Target amount in INR")
    target_year: Optional[int] = Field(None, description="Target year")
    monthly_sip: Optional[float] = Field(None, ge=0, description="Monthly SIP amount")
    lump_sum: Optional[float] = Field(None, ge=0, description="Lump sum investment")
    liquidity: Liquidity = Field(Liquidity.MEDIUM, description="Liquidity needs")
    risk_tolerance: RiskTolerance = Field(
        RiskTolerance.MODERATE, description="Risk tolerance level"
    )
    knowledge: Knowledge = Field(
        Knowledge.INTERMEDIATE, description="Investment knowledge"
    )
    volatility: Volatility = Field(
        Volatility.MEDIUM, description="Volatility comfort level"
    )
    horizon_years: int = Field(..., ge=1, le=40, description="Investment horizon in years")

    class Config:
        json_schema_extra = {
            "example": {
                "age": 29,
                "goal": "Retirement",
                "target_amount": 8500000,
                "target_year": 2036,
                "monthly_sip": 32000,
                "lump_sum": 200000,
                "liquidity": "Medium",
                "risk_tolerance": "Aggressive",
                "knowledge": "Intermediate",
                "volatility": "High",
                "horizon_years": 12,
            }
        }


class ClassifyRequest(BaseModel):
    """Request for persona classification."""

    request_id: Optional[str] = Field(None, description="Unique request ID")
    profile: ProfileInput
    model_version: Optional[str] = Field(None, description="Specific model version to use")


class PersonaResult(BaseModel):
    """Persona classification result."""

    id: str
    name: str
    slug: str
    risk_band: str
    description: Optional[str] = None


class ClassifyResponse(BaseModel):
    """Response from persona classification."""

    request_id: Optional[str] = None
    persona: PersonaResult
    confidence: float = Field(..., ge=0, le=1, description="Classification confidence")
    probabilities: Dict[str, float] = Field(
        default_factory=dict, description="Probability for each persona"
    )
    model_version: str = Field(..., description="Model version used")
    latency_ms: int = Field(..., description="Processing time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "req-123",
                "persona": {
                    "id": "uuid-here",
                    "name": "Accelerated Builder",
                    "slug": "accelerated-builder",
                    "risk_band": "Accelerated Growth",
                    "description": "Aggressive investor focused on long-term wealth creation",
                },
                "confidence": 0.92,
                "probabilities": {
                    "capital-guardian": 0.05,
                    "balanced-voyager": 0.03,
                    "accelerated-builder": 0.92,
                },
                "model_version": "rules-v1",
                "latency_ms": 12,
            }
        }


class AllocationBreakdown(BaseModel):
    """Asset allocation percentages."""

    equity: float = Field(..., ge=0, le=1, description="Equity allocation")
    debt: float = Field(..., ge=0, le=1, description="Debt allocation")
    hybrid: float = Field(..., ge=0, le=1, description="Hybrid allocation")
    gold: float = Field(..., ge=0, le=1, description="Gold allocation")
    international: float = Field(..., ge=0, le=1, description="International allocation")
    liquid: float = Field(..., ge=0, le=1, description="Liquid/Cash allocation")


class PersonaDistributionItem(BaseModel):
    """Single item in persona distribution."""

    persona: PersonaResult
    weight: float = Field(..., ge=0, le=1, description="Weight in distribution (0-1)")
    allocation: AllocationBreakdown = Field(..., description="This persona's allocation strategy")


class BlendedClassifyResponse(BaseModel):
    """Response from blended persona classification."""

    request_id: Optional[str] = None
    primary_persona: PersonaResult = Field(..., description="Highest-weighted persona")
    distribution: list[PersonaDistributionItem] = Field(
        ..., description="Full distribution across all personas, sorted by weight descending"
    )
    blended_allocation: AllocationBreakdown = Field(
        ..., description="Weighted blend of all persona allocations"
    )
    confidence: float = Field(..., ge=0, le=1, description="Primary persona confidence")
    model_version: str = Field(..., description="Model version used")
    latency_ms: int = Field(..., description="Processing time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "req-456",
                "primary_persona": {
                    "id": "balanced-voyager",
                    "name": "Balanced Voyager",
                    "slug": "balanced-voyager",
                    "risk_band": "Balanced Growth",
                    "description": "Balanced investor seeking moderate growth",
                },
                "distribution": [
                    {
                        "persona": {
                            "id": "balanced-voyager",
                            "name": "Balanced Voyager",
                            "slug": "balanced-voyager",
                            "risk_band": "Balanced Growth",
                        },
                        "weight": 0.45,
                        "allocation": {
                            "equity": 0.40,
                            "debt": 0.30,
                            "hybrid": 0.15,
                            "gold": 0.05,
                            "international": 0.05,
                            "liquid": 0.05,
                        },
                    },
                    {
                        "persona": {
                            "id": "capital-guardian",
                            "name": "Capital Guardian",
                            "slug": "capital-guardian",
                            "risk_band": "Capital Protection",
                        },
                        "weight": 0.30,
                        "allocation": {
                            "equity": 0.15,
                            "debt": 0.55,
                            "hybrid": 0.15,
                            "gold": 0.05,
                            "international": 0.00,
                            "liquid": 0.10,
                        },
                    },
                    {
                        "persona": {
                            "id": "accelerated-builder",
                            "name": "Accelerated Builder",
                            "slug": "accelerated-builder",
                            "risk_band": "Accelerated Growth",
                        },
                        "weight": 0.25,
                        "allocation": {
                            "equity": 0.65,
                            "debt": 0.10,
                            "hybrid": 0.10,
                            "gold": 0.00,
                            "international": 0.10,
                            "liquid": 0.05,
                        },
                    },
                ],
                "blended_allocation": {
                    "equity": 0.385,
                    "debt": 0.32,
                    "hybrid": 0.135,
                    "gold": 0.035,
                    "international": 0.045,
                    "liquid": 0.06,
                },
                "confidence": 0.45,
                "model_version": "rules-v2-blended",
                "latency_ms": 8,
            }
        }
