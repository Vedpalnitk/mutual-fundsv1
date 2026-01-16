from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 3502
    GRPC_PORT: int = 3503
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3500",
        "http://localhost:3501",
        "http://localhost:8081",
    ]

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # Model storage
    MODEL_STORE_PATH: str = "./models_store"

    # Backend
    BACKEND_URL: str = "http://localhost:3501"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
