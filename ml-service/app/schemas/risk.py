from pydantic import BaseModel, Field
from typing import List, Optional


class RiskFactor(BaseModel):
    """Individual risk factor assessment."""

    name: str = Field(..., description="Risk factor name")
    contribution: float = Field(..., ge=0, le=1, description="Contribution to total risk")
    severity: str = Field(..., description="Low, Moderate, High, Critical")
    description: Optional[str] = Field(None, description="Detailed description")


class RiskRequest(BaseModel):
    """Request for portfolio risk assessment."""

    request_id: Optional[str] = None
    profile: dict = Field(..., description="User profile data")
    current_portfolio: Optional[List[dict]] = Field(
        None, description="Current fund allocations"
    )
    proposed_portfolio: Optional[List[dict]] = Field(
        None, description="Proposed fund allocations"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "risk-123",
                "profile": {"age": 29, "horizon_years": 12, "risk_tolerance": "Aggressive"},
                "current_portfolio": [
                    {"scheme_code": 120503, "weight": 0.26, "category": "Flexi Cap"}
                ],
            }
        }


class RiskResponse(BaseModel):
    """Response from risk assessment."""

    request_id: Optional[str] = None
    risk_level: str = Field(..., description="Overall risk level")
    risk_score: float = Field(..., ge=0, le=100, description="Risk score 0-100")
    risk_factors: List[RiskFactor] = Field(..., description="Individual risk factors")
    recommendations: List[str] = Field(..., description="Risk mitigation recommendations")
    persona_alignment: str = Field(
        ..., description="How portfolio risk aligns with persona"
    )
    model_version: str
    latency_ms: int

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "risk-123",
                "risk_level": "Moderate-High",
                "risk_score": 68,
                "risk_factors": [
                    {
                        "name": "Equity Concentration",
                        "contribution": 0.45,
                        "severity": "Moderate",
                        "description": "70% equity exposure creates market dependency",
                    },
                    {
                        "name": "Sector Concentration",
                        "contribution": 0.25,
                        "severity": "Low",
                        "description": "Diversified across sectors",
                    },
                ],
                "recommendations": [
                    "Consider adding 5% allocation to debt funds for stability",
                    "Maintain SIP discipline during market corrections",
                ],
                "persona_alignment": "Risk level appropriate for Accelerated Builder profile",
                "model_version": "risk-v1",
                "latency_ms": 15,
            }
        }
