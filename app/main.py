"""FastAPI application entry point"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
from app.config import settings
from app.api.routes import router
from app.api.auth import auth_router
from app.utils.logger import setup_logger
from app.utils.database import connect_db, close_db

logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("=" * 80)
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Log Level: {settings.log_level}")
    logger.info("=" * 80)
    await connect_db()
    yield
    await close_db()
    logger.info(f"Shutting down {settings.app_name}")


# Initialize FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    RankForge - Enterprise AI Blog Generation Engine
    
    A production-grade, multi-agent AI system for generating SEO-optimized, 
    high-ranking blog content through structured prompt flows.
    
    ## Features
    
    - **Phase 1**: Keyword clustering, SERP gap analysis, traffic projection
    - **Phase 2**: Multi-agent content generation (Researcher → Writer)
    - **Phase 3**: Automated SEO validation and scoring
    
    ## Pipeline Architecture
    
    1. **Intent & Strategy Engine**: Analyzes keywords and identifies opportunities
    2. **Multi-Agent Generation**: Creates structured, optimized content
    3. **Automated Validator**: Scores and validates SEO effectiveness
    
    ## Metrics Provided
    
    - SEO Optimization Percentage
    - Snippet Readiness Probability
    - Keyword Density Compliance
    - Naturalness Score (AI Detection Mitigation)
    - Content Quality Scores
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"{request.method} {request.url.path} - {process_time:.2f}s")
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "path": str(request.url.path)
        }
    )


# Include API routes
app.include_router(router)
app.include_router(auth_router)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/v1/health",
        "endpoints": {
            "generate_blog": "POST /api/v1/generate",
            "analyze_keywords": "POST /api/v1/analyze-keywords"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower()
    )
