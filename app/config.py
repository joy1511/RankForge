"""Configuration management for RankForge"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # API Keys
    groq_api_key: str
    anthropic_api_key: Optional[str] = None
    
    # MongoDB
    mongodb_uri: str = Field(default="")
    
    # JWT
    jwt_secret: str = Field(default="rankforge-jwt-secret-change-me")
    
    # Application
    app_name: str = "RankForge"
    app_version: str = "1.0.0"
    environment: str = "production"
    
    # Performance
    max_workers: int = 4
    enable_caching: bool = True
    cache_ttl: int = 3600
    request_timeout: int = 300
    max_retries: int = 3
    
    # Logging
    log_level: str = "INFO"
    enable_metrics: bool = True
    
    # AI Models (Groq-compatible)
    researcher_model: str = "llama-3.3-70b-versatile"
    writer_model: str = "llama-3.3-70b-versatile"
    editor_model: str = "llama-3.3-70b-versatile"
    temperature: float = 0.7
    max_tokens: int = 4000
    
    # Rate Limiting
    rate_limit_rpm: int = 60
    rate_limit_per_hour: int = 100


settings = Settings()
