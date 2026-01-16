"""
gRPC Server for ML Service.
"""

import grpc
from concurrent import futures
import logging

from app.grpc_generated import ml_service_pb2, ml_service_pb2_grpc
from app.services import (
    PersonaService,
    PortfolioService,
    RecommendationService,
    RiskService,
)
from app.schemas.profile import ProfileInput, Liquidity, RiskTolerance, Knowledge, Volatility
from app.schemas.portfolio import FundInput, OptimizationConstraints

logger = logging.getLogger(__name__)


class MLServiceServicer(ml_service_pb2_grpc.MLServiceServicer):
    """gRPC servicer implementing ML Service methods."""

    def __init__(self):
        self.persona_service = PersonaService()
        self.portfolio_service = PortfolioService()
        self.recommendation_service = RecommendationService()
        self.risk_service = RiskService()

    def ClassifyProfile(self, request, context):
        """Classify user profile into investment persona."""
        try:
            # Convert proto Profile to ProfileInput
            profile = self._proto_to_profile_input(request.profile)

            # Call service
            persona, confidence, probabilities, latency_ms = self.persona_service.classify(profile)

            # Build response
            response = ml_service_pb2.ClassifyResponse(
                request_id=request.request_id or "",
                persona=ml_service_pb2.Persona(
                    id=persona.id,
                    name=persona.name,
                    slug=persona.slug,
                    risk_band=persona.risk_band,
                    description=persona.description or "",
                ),
                confidence=confidence,
                probabilities=probabilities,
                model_version=self.persona_service.get_model_version(),
                latency_ms=latency_ms,
            )
            return response

        except Exception as e:
            logger.error(f"ClassifyProfile error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ml_service_pb2.ClassifyResponse()

    def GetRecommendations(self, request, context):
        """Get fund recommendations based on persona."""
        try:
            # Convert profile map to dict
            profile = dict(request.profile)

            # Call service
            recommendations, persona_alignment, latency_ms = self.recommendation_service.recommend(
                persona_id=request.persona_id,
                profile=profile,
                top_n=request.top_n or 5,
                category_filters=list(request.category_filters) if request.category_filters else None,
                exclude_funds=list(request.exclude_funds) if request.exclude_funds else None,
            )

            # Build response
            proto_recs = []
            for rec in recommendations:
                proto_rec = ml_service_pb2.FundRecommendation(
                    scheme_code=rec.scheme_code,
                    scheme_name=rec.scheme_name,
                    fund_house=rec.fund_house or "",
                    category=rec.category,
                    score=rec.score,
                    suggested_allocation=rec.suggested_allocation,
                    reasoning=rec.reasoning,
                    metrics={k: v for k, v in rec.metrics.items() if v is not None},
                )
                proto_recs.append(proto_rec)

            response = ml_service_pb2.RecommendationResponse(
                request_id=request.request_id or "",
                recommendations=proto_recs,
                persona_alignment=persona_alignment,
                model_version=self.recommendation_service.get_model_version(),
                latency_ms=latency_ms,
            )
            return response

        except Exception as e:
            logger.error(f"GetRecommendations error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ml_service_pb2.RecommendationResponse()

    def OptimizePortfolio(self, request, context):
        """Optimize portfolio allocation."""
        try:
            # Convert profile map to dict
            profile = dict(request.profile)

            # Convert funds
            available_funds = [
                FundInput(
                    scheme_code=f.scheme_code,
                    scheme_name=f.scheme_name,
                    category=f.category,
                    return_1y=f.return_1y if f.HasField('return_1y') else None,
                    return_3y=f.return_3y if f.HasField('return_3y') else None,
                    return_5y=f.return_5y if f.HasField('return_5y') else None,
                    volatility=f.volatility if f.HasField('volatility') else None,
                    sharpe_ratio=f.sharpe_ratio if f.HasField('sharpe_ratio') else None,
                    expense_ratio=f.expense_ratio if f.HasField('expense_ratio') else None,
                )
                for f in request.available_funds
            ]

            # Convert constraints
            constraints = None
            if request.HasField('constraints'):
                c = request.constraints
                constraints = OptimizationConstraints(
                    max_equity_pct=c.max_equity_pct or 100,
                    min_debt_pct=c.min_debt_pct or 0,
                    max_single_fund_pct=c.max_single_fund_pct or 30,
                    min_funds=c.min_funds or 3,
                    max_funds=c.max_funds or 10,
                    target_return=c.target_return if c.HasField('target_return') else None,
                    max_volatility=c.max_volatility if c.HasField('max_volatility') else None,
                )

            # Call service
            allocations, metrics, latency_ms = self.portfolio_service.optimize(
                persona_id=request.persona_id,
                profile=profile,
                available_funds=available_funds,
                constraints=constraints,
            )

            # Build response
            proto_allocs = [
                ml_service_pb2.AllocationResult(
                    scheme_code=a.scheme_code,
                    scheme_name=a.scheme_name,
                    category=a.category,
                    weight=a.weight,
                    monthly_sip=a.monthly_sip or 0,
                )
                for a in allocations
            ]

            proto_metrics = ml_service_pb2.PortfolioMetrics(
                expected_return=metrics.expected_return,
                expected_volatility=metrics.expected_volatility,
                sharpe_ratio=metrics.sharpe_ratio,
                max_drawdown=metrics.max_drawdown or 0,
                projected_value=metrics.projected_value or 0,
            )

            response = ml_service_pb2.OptimizeResponse(
                request_id=request.request_id or "",
                allocations=proto_allocs,
                expected_metrics=proto_metrics,
                model_version=self.portfolio_service.get_model_version(),
                latency_ms=latency_ms,
            )
            return response

        except Exception as e:
            logger.error(f"OptimizePortfolio error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ml_service_pb2.OptimizeResponse()

    def AssessRisk(self, request, context):
        """Assess portfolio risk."""
        try:
            # Convert profile map to dict
            profile = dict(request.profile)

            # Convert portfolios
            current_portfolio = [
                {
                    "scheme_code": f.scheme_code,
                    "scheme_name": f.scheme_name,
                    "category": f.category,
                    "weight": f.weight if f.weight else 0,
                    "volatility": f.volatility if f.volatility else 15,
                }
                for f in request.current_portfolio
            ] if request.current_portfolio else None

            proposed_portfolio = [
                {
                    "scheme_code": f.scheme_code,
                    "scheme_name": f.scheme_name,
                    "category": f.category,
                    "weight": f.weight if f.weight else 0,
                    "volatility": f.volatility if f.volatility else 15,
                }
                for f in request.proposed_portfolio
            ] if request.proposed_portfolio else None

            # Call service
            (
                risk_level,
                risk_score,
                risk_factors,
                recommendations,
                persona_alignment,
                latency_ms,
            ) = self.risk_service.assess(
                profile=profile,
                current_portfolio=current_portfolio,
                proposed_portfolio=proposed_portfolio,
            )

            # Build response
            proto_factors = [
                ml_service_pb2.RiskFactor(
                    name=f.name,
                    contribution=f.contribution,
                    severity=f.severity,
                    description=f.description or "",
                )
                for f in risk_factors
            ]

            response = ml_service_pb2.RiskResponse(
                request_id=request.request_id or "",
                risk_level=risk_level,
                risk_score=risk_score,
                risk_factors=proto_factors,
                recommendations=recommendations,
                persona_alignment=persona_alignment,
                model_version=self.risk_service.get_model_version(),
                latency_ms=latency_ms,
            )
            return response

        except Exception as e:
            logger.error(f"AssessRisk error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ml_service_pb2.RiskResponse()

    def HealthCheck(self, request, context):
        """Health check."""
        services = [
            ml_service_pb2.ServiceStatus(
                name="persona_classifier",
                version=self.persona_service.get_model_version(),
                healthy=True,
            ),
            ml_service_pb2.ServiceStatus(
                name="portfolio_optimizer",
                version=self.portfolio_service.get_model_version(),
                healthy=True,
            ),
            ml_service_pb2.ServiceStatus(
                name="fund_recommender",
                version=self.recommendation_service.get_model_version(),
                healthy=True,
            ),
            ml_service_pb2.ServiceStatus(
                name="risk_assessor",
                version=self.risk_service.get_model_version(),
                healthy=True,
            ),
        ]
        return ml_service_pb2.HealthResponse(status="healthy", services=services)

    def _proto_to_profile_input(self, proto_profile) -> ProfileInput:
        """Convert proto Profile to ProfileInput."""
        return ProfileInput(
            age=proto_profile.age,
            goal=proto_profile.goal if proto_profile.goal else None,
            target_amount=proto_profile.target_amount if proto_profile.target_amount else None,
            target_year=proto_profile.target_year if proto_profile.target_year else None,
            monthly_sip=proto_profile.monthly_sip if proto_profile.monthly_sip else None,
            lump_sum=proto_profile.lump_sum if proto_profile.lump_sum else None,
            liquidity=Liquidity(proto_profile.liquidity) if proto_profile.liquidity else Liquidity.MEDIUM,
            risk_tolerance=RiskTolerance(proto_profile.risk_tolerance) if proto_profile.risk_tolerance else RiskTolerance.MODERATE,
            knowledge=Knowledge(proto_profile.knowledge) if proto_profile.knowledge else Knowledge.INTERMEDIATE,
            volatility=Volatility(proto_profile.volatility) if proto_profile.volatility else Volatility.MEDIUM,
            horizon_years=proto_profile.horizon_years,
        )


def serve(port: int = 50051, max_workers: int = 10):
    """Start the gRPC server."""
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=max_workers))
    ml_service_pb2_grpc.add_MLServiceServicer_to_server(MLServiceServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info(f"gRPC server started on port {port}")
    return server


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    server = serve()
    server.wait_for_termination()
