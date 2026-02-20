"""
API routes for ML service.
"""

import asyncio
import io
import structlog

from fastapi import APIRouter, HTTPException, UploadFile, Form
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
    PortfolioAnalysisRequest,
    PortfolioAnalysisResponse,
    CASParseResponse,
    CASFolioOut,
    CASSchemeOut,
    CASTransactionOut,
)
from app.services import (
    PersonaService,
    PortfolioService,
    RecommendationService,
    RiskService,
    portfolio_analysis_service,
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


@router.post("/analyze/portfolio", response_model=PortfolioAnalysisResponse, tags=["Portfolio Analysis"])
async def analyze_portfolio(request: PortfolioAnalysisRequest) -> PortfolioAnalysisResponse:
    """
    Analyze current portfolio against target allocation.

    This endpoint accepts:
    - Current portfolio holdings (with amounts/units and optional purchase dates)
    - Target allocation from persona classification

    Returns:
    - Current vs target allocation breakdown
    - Gap analysis by asset class
    - Rebalancing actions (SELL/BUY/HOLD/ADD_NEW)
    - Tax implications (LTCG/STCG flags)
    - Transaction amounts and priorities

    Tax Awareness:
    - Holdings >365 days are flagged as LTCG (10% tax above 1L)
    - Holdings <=365 days are flagged as STCG (15% tax)
    - Tax-loss harvesting opportunities are identified
    - Recent STCG purchases may be flagged as HOLD

    Rebalancing Priority:
    - HIGH: >15% off target or single fund >40% of portfolio
    - MEDIUM: 5-15% off target or category >35%
    - LOW: <5% adjustments
    """
    try:
        result = await portfolio_analysis_service.analyze(
            holdings=request.holdings,
            target_allocation=request.target_allocation,
            profile=request.profile,
        )

        return PortfolioAnalysisResponse(
            request_id=request.request_id,
            current_allocation=result.current_allocation,
            target_allocation=result.target_allocation,
            allocation_gaps=result.allocation_gaps,
            current_metrics=result.current_metrics,
            holdings=result.holdings,
            rebalancing_actions=result.rebalancing_actions,
            summary=result.summary,
            model_version=result.model_version,
            latency_ms=result.latency_ms,
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


logger = structlog.get_logger(__name__)

MAX_CAS_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _parse_cas_sync(file_bytes: bytes, password: str):
    """Run casparser in sync context (CPU-bound)."""
    import casparser
    return casparser.read_cas_pdf(io.BytesIO(file_bytes), password)


def _transform_cas_data(data) -> CASParseResponse:
    """Transform casparser CASData into our response schema."""
    folios = []
    total_schemes = 0
    total_current_value = 0.0

    for folio in data.folios:
        schemes = []
        for scheme in folio.schemes:
            transactions = []
            for txn in scheme.transactions:
                transactions.append(CASTransactionOut(
                    date=str(txn.date) if txn.date else "",
                    description=txn.description or "",
                    amount=float(txn.amount) if txn.amount is not None else None,
                    units=float(txn.units) if txn.units is not None else None,
                    nav=float(txn.nav) if txn.nav is not None else None,
                    balance=float(txn.balance) if txn.balance is not None else None,
                    type=txn.type or "UNKNOWN",
                ))

            valuation = getattr(scheme, "valuation", None)
            val_date = str(valuation.date) if valuation and valuation.date else None
            val_nav = float(valuation.nav) if valuation and valuation.nav is not None else None
            val_value = float(valuation.value) if valuation and valuation.value is not None else None

            if val_value:
                total_current_value += val_value

            cost = float(scheme.cost) if hasattr(scheme, "cost") and scheme.cost is not None else None

            schemes.append(CASSchemeOut(
                scheme=scheme.scheme or "",
                isin=getattr(scheme, "isin", None),
                amfi=str(scheme.amfi) if getattr(scheme, "amfi", None) else None,
                rta=scheme.rta or "",
                rta_code=getattr(scheme, "rta_code", "") or "",
                advisor=getattr(scheme, "advisor", None),
                type=getattr(scheme, "type", None),
                open=float(scheme.open) if scheme.open is not None else 0.0,
                close=float(scheme.close) if scheme.close is not None else 0.0,
                valuation_date=val_date,
                valuation_nav=val_nav,
                valuation_value=val_value,
                cost=cost,
                transactions=transactions,
            ))
            total_schemes += 1

        folios.append(CASFolioOut(
            folio=folio.folio or "",
            amc=folio.amc or "",
            pan=getattr(folio, "PAN", None) or getattr(folio, "pan", None),
            kyc=getattr(folio, "KYC", None) or getattr(folio, "kyc", None),
            schemes=schemes,
        ))

    investor = getattr(data, "investor_info", None)
    statement_period = getattr(data, "statement_period", None)

    return CASParseResponse(
        investor_name=investor.name if investor and investor.name else "",
        investor_email=investor.email if investor and investor.email else "",
        investor_mobile=investor.mobile if investor and hasattr(investor, "mobile") and investor.mobile else "",
        cas_type=data.cas_type if hasattr(data, "cas_type") and data.cas_type else "DETAILED",
        file_type=data.file_type if hasattr(data, "file_type") and data.file_type else "CAMS",
        statement_period_from=str(statement_period.from_) if statement_period and hasattr(statement_period, "from_") else "",
        statement_period_to=str(statement_period.to) if statement_period and hasattr(statement_period, "to") else "",
        folios=folios,
        total_schemes=total_schemes,
        total_current_value=round(total_current_value, 2),
    )


@router.post("/cas/parse", response_model=CASParseResponse, tags=["CAS Import"])
async def parse_cas_pdf(file: UploadFile, password: str = Form(...)):
    """Parse a CAS PDF and return structured portfolio data."""
    # Read and validate size
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(file_bytes) > MAX_CAS_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    # Validate PDF magic bytes
    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File must be a valid PDF")

    try:
        # Run CPU-bound parsing in thread executor
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(None, _parse_cas_sync, file_bytes, password)
        return _transform_cas_data(data)
    except Exception as e:
        error_msg = str(e).lower()
        if "password" in error_msg or "incorrect" in error_msg or "decrypt" in error_msg:
            raise HTTPException(status_code=400, detail="Incorrect CAS PDF password")
        elif "parse" in error_msg or "invalid" in error_msg:
            raise HTTPException(status_code=422, detail=f"Could not parse CAS PDF: {e}")
        else:
            logger.error("CAS parse error", error=str(e))
            raise HTTPException(status_code=500, detail=f"Parser error: {e}")


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
