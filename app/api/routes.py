"""API route handlers"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Dict, Any
from app.schemas import (
    KeywordInput,
    GenerationRequest,
    FinalOutput,
    StrategyBrief
)
from app.orchestration.pipeline import RankForgePipeline
from app.utils.logger import setup_logger
from app.utils.exceptions import RankForgeException

logger = setup_logger(__name__)
router = APIRouter(prefix="/api/v1", tags=["RankForge"])


def _check_api_key_error(error: Exception) -> bool:
    """Check if the error is related to an invalid API key"""
    error_str = str(error).lower()
    return any(keyword in error_str for keyword in [
        "invalid api key", "invalid_api_key", "authentication",
        "401", "unauthorized", "api key not found", "api_key_invalid"
    ])


@router.post(
    "/generate",
    response_model=FinalOutput,
    status_code=status.HTTP_200_OK,
    summary="Generate complete SEO-optimized blog",
    description="Execute the full RankForge pipeline to generate a complete blog with SEO analysis"
)
async def generate_blog(request: GenerationRequest) -> FinalOutput:
    """
    Generate a complete SEO-optimized blog post
    
    This endpoint executes all three phases:
    1. Keyword & SEO analysis
    2. Multi-agent content generation
    3. Automated validation & scoring
    
    Returns the final blog content with comprehensive metadata.
    """
    logger.info(f"Received generation request for keyword: {request.keyword_input.primary_keyword}")
    
    try:
        pipeline = RankForgePipeline()
        result = await pipeline.execute(request)
        
        logger.info("Blog generation completed successfully")
        return result
        
    except RankForgeException as e:
        logger.error(f"RankForge error: {e.message}")
        if _check_api_key_error(e):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Invalid Groq API Key", "message": "Your GROQ_API_KEY is invalid or expired. Please update it in your .env file and restart the backend server."}
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": e.message, "details": e.details}
        )
    except Exception as e:
        logger.error(f"Unexpected error in generate: {str(e)}")
        if _check_api_key_error(e):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Invalid Groq API Key", "message": "Your GROQ_API_KEY is invalid or expired. Please update it in your .env file and restart the backend server."}
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal server error", "message": str(e)}
        )


@router.post(
    "/analyze-keywords",
    response_model=StrategyBrief,
    status_code=status.HTTP_200_OK,
    summary="Analyze keywords only",
    description="Execute Phase 1 only: keyword clustering, SERP gap analysis, and traffic projection"
)
async def analyze_keywords(keyword_input: KeywordInput) -> StrategyBrief:
    """
    Analyze keywords and generate strategy brief
    
    This endpoint executes only Phase 1:
    - Keyword clustering
    - SERP gap identification
    - Traffic potential projection
    
    Useful for strategy planning before content generation.
    """
    logger.info(f"Received keyword analysis request: {keyword_input.primary_keyword}")
    
    try:
        pipeline = RankForgePipeline()
        result = await pipeline.analyze_keywords_only(keyword_input)
        
        logger.info("Keyword analysis completed successfully")
        return result
        
    except RankForgeException as e:
        logger.error(f"RankForge error in keywords: {e.message}")
        if _check_api_key_error(e):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Invalid Groq API Key", "message": "Your GROQ_API_KEY is invalid or expired. Please update it in your .env file and restart the backend server."}
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": e.message, "details": e.details}
        )
    except Exception as e:
        logger.error(f"Unexpected error in keywords: {str(e)}")
        if _check_api_key_error(e):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Invalid Groq API Key", "message": "Your GROQ_API_KEY is invalid or expired. Please update it in your .env file and restart the backend server."}
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal server error", "message": str(e)}
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check if the API is running"
)
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "RankForge",
        "version": "1.0.0"
    }
