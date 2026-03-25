"""Configuration management for RankForge"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # API Keys
    openai_api_key: str
    anthropic_api_key: Optional[str] = None
    
    # Application
    app_name: str = "RankForge"
    app_version: str = "1.0.0"
    log_level: str = "INFO"
    environment: str = "production"
    
    # Performance
    max_workers: int = 4
    enable_caching: bool = True
    cache_ttl: int = 3600
    request_timeout: int = 300
    
    # AI Models
    researcher_model: str = "gpt-4-turbo-preview"
    writer_model: str = "gpt-4-turbo-preview"
    editor_model: str = "gpt-4-turbo-preview"
    temperature: float = 0.7
    max_tokens: int = 4000
    
    # Rate Limiting
    rate_limit_per_minute: int = 10
    rate_limit_per_hour: int = 100


settings = Settings()
