"""
ML Service - FastAPI application for investment portfolio AI.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import threading

from app.config import settings
from app.api import router
from app.grpc_server import serve as start_grpc_server

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global gRPC server reference
grpc_server = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global grpc_server

    # Startup
    logger.info("Starting ML Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # Initialize fund data service (pre-populate cache)
    try:
        from app.services.fund_data_service import fund_data_service
        await fund_data_service.initialize()
        logger.info("Fund data service initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize fund data service: {e}")

    # Start gRPC server in a separate thread
    grpc_server = start_grpc_server(port=settings.GRPC_PORT)
    logger.info(f"gRPC server started on port {settings.GRPC_PORT}")

    logger.info("ML Service started successfully")

    yield

    # Shutdown
    logger.info("Shutting down ML Service...")
    if grpc_server:
        grpc_server.stop(grace=5)
        logger.info("gRPC server stopped")

# Create FastAPI app
app = FastAPI(
    title="ML Service - Investment Portfolio AI",
    description="""
    AI-powered investment portfolio analysis and recommendations.

    ## Features

    * **Persona Classification** - Classify users into investment personas based on profile
    * **Portfolio Optimization** - Optimize fund allocation using Mean-Variance Optimization
    * **Fund Recommendations** - Get personalized fund recommendations
    * **Risk Assessment** - Analyze portfolio risk and get mitigation recommendations

    ## Personas

    * **Capital Guardian** - Conservative, capital preservation focused
    * **Balanced Voyager** - Moderate risk, balanced growth
    * **Accelerated Builder** - Aggressive, high growth focused
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "ML Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
