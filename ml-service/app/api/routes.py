"""
API routes for ML service.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from app.schemas import (
    ClassifyRequest,
    ClassifyResponse,
    BlendedClassifyResponse,
    PersonaDistributionItem,
    AllocationBreakdown,
    PersonaResult,
    OptimizeRequest,
    OptimizeResponse,
    RecommendationRequest,
    RecommendationResponse,
    BlendedRecommendationRequest,
    BlendedRecommendationResponse,
    AllocationTarget,
    RiskRequest,
    RiskResponse,
)
from app.services import (
    PersonaService,
    PortfolioService,
    RecommendationService,
    RiskService,
)

router = APIRouter()

# Service instances
persona_service = PersonaService()
portfolio_service = PortfolioService()
recommendation_service = RecommendationService()
risk_service = RiskService()


@router.post("/classify", response_model=ClassifyResponse, tags=["Persona"])
async def classify_profile(request: ClassifyRequest) -> ClassifyResponse:
    """
    Classify a user profile into an investment persona.

    Returns the matched persona with confidence score and probability distribution.
    """
    try:
        persona, confidence, probabilities, latency_ms = persona_service.classify(
            request.profile
        )

        return ClassifyResponse(
            request_id=request.request_id,
            persona=persona,
            confidence=confidence,
            probabilities=probabilities,
            model_version=persona_service.get_model_version(),
            latency_ms=latency_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify/blended", response_model=BlendedClassifyResponse, tags=["Persona"])
async def classify_profile_blended(request: ClassifyRequest) -> BlendedClassifyResponse:
    """
    Classify a user profile with blended persona distribution.

    Returns:
    - Weighted distribution across ALL personas (not just the winner)
    - Blended asset allocation calculated from persona weights
    - Each persona's individual allocation strategy

    This allows for nuanced investment recommendations that consider
    the user's mixed investment needs, not just their primary persona.

    Example: A user might be 45% Balanced, 30% Conservative, 25% Aggressive
    Their blended allocation would combine all three strategies proportionally.
    """
    try:
        result = persona_service.classify_blended(request.profile)

        # Convert distribution to response format
        distribution_items = []
        for item in result.distribution:
            distribution_items.append(
                PersonaDistributionItem(
                    persona=PersonaResult(
                        id=item["persona"]["id"],
                        name=item["persona"]["name"],
                        slug=item["persona"]["slug"],
                        risk_band=item["persona"]["risk_band"],
                        description=item["persona"].get("description"),
                    ),
                    weight=item["weight"],
                    allocation=AllocationBreakdown(**item["allocation"]),
                )
            )

        return BlendedClassifyResponse(
            request_id=request.request_id,
            primary_persona=result.primary_persona,
            distribution=distribution_items,
            blended_allocation=AllocationBreakdown(**result.blended_allocation),
            confidence=result.confidence,
            model_version=result.model_version,
            latency_ms=result.latency_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize", response_model=OptimizeResponse, tags=["Portfolio"])
async def optimize_portfolio(request: OptimizeRequest) -> OptimizeResponse:
    """
    Optimize portfolio allocation based on persona and constraints.

    Returns optimized fund allocations with expected metrics.
    """
    try:
        allocations, metrics, latency_ms = portfolio_service.optimize(
            persona_id=request.persona_id,
            profile=request.profile,
            available_funds=request.available_funds,
            constraints=request.constraints,
        )

        return OptimizeResponse(
            request_id=request.request_id,
            allocations=allocations,
            expected_metrics=metrics,
            model_version=portfolio_service.get_model_version(),
            latency_ms=latency_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
async def recommend_funds(request: RecommendationRequest) -> RecommendationResponse:
    """
    Get fund recommendations based on persona and preferences.

    Returns ranked fund recommendations with allocation suggestions.
    """
    try:
        recommendations, persona_alignment, latency_ms = recommendation_service.recommend(
            persona_id=request.persona_id,
            profile=request.profile,
            top_n=request.top_n,
            category_filters=request.category_filters,
            exclude_funds=request.exclude_funds,
        )

        return RecommendationResponse(
            request_id=request.request_id,
            recommendations=recommendations,
            persona_alignment=persona_alignment,
            model_version=recommendation_service.get_model_version(),
            latency_ms=latency_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend/blended", response_model=BlendedRecommendationResponse, tags=["Recommendations"])
async def recommend_funds_blended(request: BlendedRecommendationRequest) -> BlendedRecommendationResponse:
    """
    Get fund recommendations based on blended allocation targets.

    This endpoint accepts blended allocation targets (from blended persona classification)
    and returns fund recommendations that match the target asset allocation percentages.

    Example: If the blended allocation is 40% equity, 30% debt, 20% hybrid, 10% gold,
    the returned funds will be selected to match these percentages as closely as possible.

    Returns:
    - Fund recommendations with asset class tags
    - Asset class breakdown showing target vs actual allocation
    - Alignment score indicating how well recommendations match targets
    - Suggested investment amounts if total investment is provided
    """
    try:
        # Convert request allocation to AllocationTarget
        blended_allocation = AllocationTarget(
            equity=request.blended_allocation.equity,
            debt=request.blended_allocation.debt,
            hybrid=request.blended_allocation.hybrid,
            gold=request.blended_allocation.gold,
            international=request.blended_allocation.international,
            liquid=request.blended_allocation.liquid,
        )

        (
            recommendations,
            asset_class_breakdown,
            alignment_score,
            alignment_message,
            latency_ms,
        ) = recommendation_service.recommend_blended(
            blended_allocation=blended_allocation,
            profile=request.profile,
            top_n=request.top_n,
            investment_amount=request.investment_amount,
            category_filters=request.category_filters,
            exclude_funds=request.exclude_funds,
        )

        return BlendedRecommendationResponse(
            request_id=request.request_id,
            recommendations=recommendations,
            asset_class_breakdown=asset_class_breakdown,
            target_allocation=blended_allocation,
            alignment_score=alignment_score,
            alignment_message=alignment_message,
            model_version=f"{recommendation_service.get_model_version()}-blended",
            latency_ms=latency_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/risk", response_model=RiskResponse, tags=["Risk"])
async def assess_risk(request: RiskRequest) -> RiskResponse:
    """
    Assess portfolio risk and get recommendations.

    Returns risk level, score, factors, and mitigation recommendations.
    """
    try:
        (
            risk_level,
            risk_score,
            risk_factors,
            recommendations,
            persona_alignment,
            latency_ms,
        ) = risk_service.assess(
            profile=request.profile,
            current_portfolio=request.current_portfolio,
            proposed_portfolio=request.proposed_portfolio,
        )

        return RiskResponse(
            request_id=request.request_id,
            risk_level=risk_level,
            risk_score=risk_score,
            risk_factors=risk_factors,
            recommendations=recommendations,
            persona_alignment=persona_alignment,
            model_version=risk_service.get_model_version(),
            latency_ms=latency_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/funds", tags=["Funds"])
async def get_funds_universe(
    asset_class: Optional[str] = None,
    category: Optional[str] = None,
    source: str = "live",  # "live" or "cache"
):
    """
    Get the complete fund universe available for recommendations.

    - source: "live" fetches real data from MFAPI.in, "cache" uses cached data
    - Optionally filter by asset_class (equity, debt, hybrid, gold, international, liquid)
    - Optionally filter by category (Flexi Cap, Mid Cap, etc.)
    """
    from app.services.fund_data_service import fund_data_service, CATEGORY_TO_ASSET_CLASS

    # Fetch real fund data
    all_funds = await fund_data_service.get_all_funds()

    funds = []
    for fund in all_funds:
        fund_asset_class = CATEGORY_TO_ASSET_CLASS.get(fund.category, "equity")

        # Apply filters
        if asset_class and fund_asset_class != asset_class:
            continue
        if category and fund.category != category:
            continue

        funds.append({
            "scheme_code": fund.scheme_code,
            "scheme_name": fund.scheme_name,
            "fund_house": fund.fund_house,
            "category": fund.category,
            "return_1y": fund.return_1y or 0,
            "return_3y": fund.return_3y or 0,
            "return_5y": fund.return_5y or 0,
            "volatility": fund.volatility or 0,
            "sharpe_ratio": fund.sharpe_ratio or 0,
            "expense_ratio": fund.expense_ratio or 0,
            "asset_class": fund_asset_class,
            "nav": fund.nav,
            "last_updated": fund.last_updated.isoformat() if fund.last_updated else None,
        })

    # Get unique categories and asset classes for filters
    all_categories = sorted(set(f.category for f in all_funds))
    all_asset_classes = sorted(set(CATEGORY_TO_ASSET_CLASS.get(f.category, "equity") for f in all_funds))

    return {
        "funds": funds,
        "total": len(funds),
        "filters": {
            "categories": all_categories,
            "asset_classes": all_asset_classes,
        },
        "data_source": "mfapi.in",
        "cache_expiry": fund_data_service._cache_expiry.isoformat() if fund_data_service._cache_expiry else None,
    }


@router.get("/funds/stats", tags=["Funds"])
async def get_funds_stats():
    """Get statistics about the fund universe (real data from MFAPI.in)."""
    from app.services.fund_data_service import fund_data_service, CATEGORY_TO_ASSET_CLASS

    all_funds = await fund_data_service.get_all_funds()

    if not all_funds:
        return {
            "total_funds": 0,
            "by_asset_class": {},
            "by_category": {},
            "averages": {"return_1y": 0, "return_3y": 0, "expense_ratio": 0},
            "data_source": "mfapi.in",
        }

    # Count by asset class
    asset_class_counts = {}
    category_counts = {}

    for fund in all_funds:
        asset_class = CATEGORY_TO_ASSET_CLASS.get(fund.category, "equity")
        asset_class_counts[asset_class] = asset_class_counts.get(asset_class, 0) + 1
        category_counts[fund.category] = category_counts.get(fund.category, 0) + 1

    # Calculate averages
    returns_1y = [f.return_1y for f in all_funds if f.return_1y is not None]
    returns_3y = [f.return_3y for f in all_funds if f.return_3y is not None]
    expenses = [f.expense_ratio for f in all_funds if f.expense_ratio is not None]

    avg_return_1y = sum(returns_1y) / len(returns_1y) if returns_1y else 0
    avg_return_3y = sum(returns_3y) / len(returns_3y) if returns_3y else 0
    avg_expense_ratio = sum(expenses) / len(expenses) if expenses else 0

    return {
        "total_funds": len(all_funds),
        "by_asset_class": asset_class_counts,
        "by_category": category_counts,
        "averages": {
            "return_1y": round(avg_return_1y, 2),
            "return_3y": round(avg_return_3y, 2),
            "expense_ratio": round(avg_expense_ratio, 2),
        },
        "data_source": "mfapi.in",
    }


@router.post("/funds/refresh", tags=["Funds"])
async def refresh_funds():
    """Refresh fund data from MFAPI.in (admin endpoint)."""
    from app.services.fund_data_service import fund_data_service

    await fund_data_service.refresh_all_funds()

    return {
        "status": "refreshed",
        "total_funds": len(fund_data_service._cache),
        "cache_expiry": fund_data_service._cache_expiry.isoformat() if fund_data_service._cache_expiry else None,
    }


@router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "persona_classifier": persona_service.get_model_version(),
            "portfolio_optimizer": portfolio_service.get_model_version(),
            "fund_recommender": recommendation_service.get_model_version(),
            "risk_assessor": risk_service.get_model_version(),
        },
    }


@router.get("/models", tags=["Models"])
async def list_models():
    """List all available ML models and their versions."""
    return {
        "models": [
            {
                "name": "Persona Classifier",
                "slug": "persona-classifier",
                "version": persona_service.get_model_version(),
                "type": "rules-based",
                "description": "Classifies users into investment personas",
            },
            {
                "name": "Portfolio Optimizer",
                "slug": "portfolio-optimizer",
                "version": portfolio_service.get_model_version(),
                "type": "mean-variance",
                "description": "Optimizes portfolio allocation using MVO",
            },
            {
                "name": "Fund Recommender",
                "slug": "fund-recommender",
                "version": recommendation_service.get_model_version(),
                "type": "scoring-based",
                "description": "Recommends funds based on persona preferences",
            },
            {
                "name": "Risk Assessor",
                "slug": "risk-assessor",
                "version": risk_service.get_model_version(),
                "type": "rules-based",
                "description": "Assesses portfolio risk and provides recommendations",
            },
        ]
    }
