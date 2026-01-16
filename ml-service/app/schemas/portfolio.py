from pydantic import BaseModel, Field
from typing import List, Optional


class FundInput(BaseModel):
    """Fund data for portfolio optimization."""

    scheme_code: int = Field(..., description="Mutual fund scheme code")
    scheme_name: str = Field(..., description="Fund name")
    category: str = Field(..., description="Fund category")
    return_1y: Optional[float] = Field(None, description="1-year return")
    return_3y: Optional[float] = Field(None, description="3-year CAGR")
    return_5y: Optional[float] = Field(None, description="5-year CAGR")
    volatility: Optional[float] = Field(None, description="Annualized volatility")
    sharpe_ratio: Optional[float] = Field(None, description="Sharpe ratio")
    expense_ratio: Optional[float] = Field(None, description="Expense ratio")


class OptimizationConstraints(BaseModel):
    """Constraints for portfolio optimization."""

    max_equity_pct: float = Field(100, ge=0, le=100, description="Max equity allocation")
    min_debt_pct: float = Field(0, ge=0, le=100, description="Min debt allocation")
    max_single_fund_pct: float = Field(30, ge=0, le=100, description="Max single fund weight")
    min_funds: int = Field(3, ge=1, description="Minimum number of funds")
    max_funds: int = Field(10, ge=1, description="Maximum number of funds")
    target_return: Optional[float] = Field(None, description="Target annual return")
    max_volatility: Optional[float] = Field(None, description="Maximum portfolio volatility")


class OptimizeRequest(BaseModel):
    """Request for portfolio optimization."""

    request_id: Optional[str] = None
    persona_id: str = Field(..., description="User's persona ID")
    profile: dict = Field(..., description="User profile data")
    available_funds: List[FundInput] = Field(..., description="Funds to choose from")
    constraints: Optional[OptimizationConstraints] = None

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "opt-123",
                "persona_id": "accelerated-builder-uuid",
                "profile": {"horizon_years": 12, "monthly_sip": 32000},
                "available_funds": [
                    {
                        "scheme_code": 120503,
                        "scheme_name": "Quant Flexi Cap Fund",
                        "category": "Flexi Cap",
                        "return_3y": 24.3,
                        "volatility": 18.5,
                    }
                ],
                "constraints": {"max_equity_pct": 85, "min_debt_pct": 10},
            }
        }


class AllocationResult(BaseModel):
    """Single fund allocation in optimized portfolio."""

    scheme_code: int
    scheme_name: str
    category: str
    weight: float = Field(..., ge=0, le=1, description="Portfolio weight (0-1)")
    monthly_sip: Optional[float] = Field(None, description="Suggested SIP amount")


class PortfolioMetrics(BaseModel):
    """Expected metrics for the optimized portfolio."""

    expected_return: float = Field(..., description="Expected annual return")
    expected_volatility: float = Field(..., description="Expected annual volatility")
    sharpe_ratio: float = Field(..., description="Portfolio Sharpe ratio")
    max_drawdown: Optional[float] = Field(None, description="Expected max drawdown")
    projected_value: Optional[float] = Field(None, description="Projected portfolio value")


class OptimizeResponse(BaseModel):
    """Response from portfolio optimization."""

    request_id: Optional[str] = None
    allocations: List[AllocationResult]
    expected_metrics: PortfolioMetrics
    model_version: str
    latency_ms: int

    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "opt-123",
                "allocations": [
                    {
                        "scheme_code": 120503,
                        "scheme_name": "Quant Flexi Cap Fund",
                        "category": "Flexi Cap",
                        "weight": 0.26,
                        "monthly_sip": 8320,
                    }
                ],
                "expected_metrics": {
                    "expected_return": 0.132,
                    "expected_volatility": 0.16,
                    "sharpe_ratio": 0.82,
                    "projected_value": 8600000,
                },
                "model_version": "mvo-v1",
                "latency_ms": 45,
            }
        }
