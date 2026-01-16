from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class AllocationTarget(BaseModel):
    """Target allocation percentages for blended recommendations."""

    equity: float = Field(0.0, ge=0, le=1, description="Target equity allocation")
    debt: float = Field(0.0, ge=0, le=1, description="Target debt allocation")
    hybrid: float = Field(0.0, ge=0, le=1, description="Target hybrid allocation")
    gold: float = Field(0.0, ge=0, le=1, description="Target gold allocation")
    international: float = Field(0.0, ge=0, le=1, description="Target international allocation")
    liquid: float = Field(0.0, ge=0, le=1, description="Target liquid allocation")


class RecommendationRequest(BaseModel):
    """Request for fund recommendations."""

    request_id: Optional[str] = None
    persona_id: str = Field(..., description="User's persona ID")
    profile: dict = Field(..., description="User profile data")
    top_n: int = Field(5, ge=1, le=20, description="Number of recommendations")
    category_filters: Optional[List[str]] = Field(
        None, description="Filter by fund categories"
    )
    exclude_funds: Optional[List[int]] = Field(
        None, description="Fund scheme codes to exclude"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "rec-123",
                "persona_id": "accelerated-builder-uuid",
                "profile": {"horizon_years": 12, "risk_tolerance": "Aggressive"},
                "top_n": 5,
                "category_filters": ["Flexi Cap", "Mid Cap", "Large Cap"],
            }
        }


class BlendedRecommendationRequest(BaseModel):
    """Request for fund recommendations using blended allocation."""

    request_id: Optional[str] = None
    blended_allocation: AllocationTarget = Field(
        ..., description="Target allocation from blended persona classification"
    )
    persona_distribution: Optional[Dict[str, float]] = Field(
        None, description="Weight distribution across personas"
    )
    profile: dict = Field(..., description="User profile data")
    top_n: int = Field(5, ge=1, le=20, description="Number of recommendations")
    investment_amount: Optional[float] = Field(
        None, ge=0, description="Total investment amount for allocation calculation"
    )
    category_filters: Optional[List[str]] = Field(
        None, description="Filter by fund categories"
    )
    exclude_funds: Optional[List[int]] = Field(
        None, description="Fund scheme codes to exclude"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "rec-456",
                "blended_allocation": {
                    "equity": 0.385,
                    "debt": 0.32,
                    "hybrid": 0.135,
                    "gold": 0.035,
                    "international": 0.045,
                    "liquid": 0.06,
                },
                "persona_distribution": {
                    "capital-guardian": 0.30,
                    "balanced-voyager": 0.45,
                    "accelerated-builder": 0.25,
                },
                "profile": {"horizon_years": 8, "risk_tolerance": "Moderate"},
                "top_n": 6,
                "investment_amount": 100000,
            }
        }


class FundRecommendation(BaseModel):
    """Single fund recommendation."""

    scheme_code: int
    scheme_name: str
    fund_house: Optional[str] = None
    category: str
    asset_class: Optional[str] = Field(None, description="Asset class (equity, debt, hybrid, etc.)")
    score: float = Field(..., ge=0, le=1, description="Recommendation score")
    suggested_allocation: float = Field(
        ..., ge=0, le=1, description="Suggested allocation weight"
    )
    suggested_amount: Optional[float] = Field(
        None, ge=0, description="Suggested investment amount if total provided"
    )
    reasoning: str = Field(..., description="Why this fund is recommended")
    metrics: Optional[dict] = Field(None, description="Fund performance metrics")


class RecommendationResponse(BaseModel):
    """Response from fund recommendation."""

    request_id: Optional[str] = None
    recommendations: List[FundRecommendation]
    persona_alignment: str = Field(..., description="How recommendations align with persona")
    model_version: str
    latency_ms: int

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "rec-123",
                "recommendations": [
                    {
                        "scheme_code": 120503,
                        "scheme_name": "Quant Flexi Cap Fund",
                        "fund_house": "Quant Mutual Fund",
                        "category": "Flexi Cap",
                        "score": 0.95,
                        "suggested_allocation": 0.26,
                        "reasoning": "Strong 3Y returns of 24.3% with moderate volatility, ideal for aggressive growth",
                        "metrics": {"return_3y": 24.3, "sharpe_ratio": 1.2},
                    }
                ],
                "persona_alignment": "High equity exposure aligned with Accelerated Builder profile",
                "model_version": "recommender-v1",
                "latency_ms": 28,
            }
        }


class AssetClassBreakdown(BaseModel):
    """Breakdown of recommendations by asset class."""

    asset_class: str
    target_allocation: float = Field(..., description="Target allocation from blended profile")
    actual_allocation: float = Field(..., description="Actual allocation in recommendations")
    fund_count: int = Field(..., description="Number of funds in this asset class")
    total_amount: Optional[float] = Field(None, description="Total amount allocated")


class BlendedRecommendationResponse(BaseModel):
    """Response from blended fund recommendation."""

    request_id: Optional[str] = None
    recommendations: List[FundRecommendation]
    asset_class_breakdown: List[AssetClassBreakdown] = Field(
        ..., description="How recommendations are distributed across asset classes"
    )
    target_allocation: AllocationTarget = Field(
        ..., description="Original target allocation from blended profile"
    )
    alignment_score: float = Field(
        ..., ge=0, le=1, description="How well recommendations match target allocation"
    )
    alignment_message: str = Field(..., description="Human-readable alignment summary")
    model_version: str
    latency_ms: int

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "rec-456",
                "recommendations": [
                    {
                        "scheme_code": 120503,
                        "scheme_name": "Quant Flexi Cap Fund",
                        "fund_house": "Quant Mutual Fund",
                        "category": "Flexi Cap",
                        "asset_class": "equity",
                        "score": 0.92,
                        "suggested_allocation": 0.20,
                        "suggested_amount": 20000,
                        "reasoning": "Strong returns aligned with 38.5% equity target",
                        "metrics": {"return_3y": 24.3, "sharpe_ratio": 1.2},
                    }
                ],
                "asset_class_breakdown": [
                    {
                        "asset_class": "equity",
                        "target_allocation": 0.385,
                        "actual_allocation": 0.40,
                        "fund_count": 3,
                        "total_amount": 40000,
                    },
                    {
                        "asset_class": "debt",
                        "target_allocation": 0.32,
                        "actual_allocation": 0.30,
                        "fund_count": 2,
                        "total_amount": 30000,
                    },
                ],
                "target_allocation": {
                    "equity": 0.385,
                    "debt": 0.32,
                    "hybrid": 0.135,
                    "gold": 0.035,
                    "international": 0.045,
                    "liquid": 0.06,
                },
                "alignment_score": 0.94,
                "alignment_message": "Portfolio closely matches blended allocation targets with 94% alignment",
                "model_version": "recommender-v2-blended",
                "latency_ms": 35,
            }
        }
