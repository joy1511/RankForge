"""Custom exceptions for RankForge"""

from typing import Optional, Dict, Any


class RankForgeException(Exception):
    """Base exception for RankForge"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class KeywordEngineError(RankForgeException):
    """Raised when keyword analysis fails"""
    pass


class AgentExecutionError(RankForgeException):
    """Raised when an agent fails to execute"""
    pass


class ValidationError(RankForgeException):
    """Raised when validation fails"""
    pass


class PipelineError(RankForgeException):
    """Raised when pipeline orchestration fails"""
    pass


class APIError(RankForgeException):
    """Raised when external API calls fail"""
    pass
