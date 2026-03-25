"""Integration tests for RankForge pipeline"""

import pytest
from app.schemas.keyword import KeywordInput
from app.schemas.generation import GenerationRequest
from app.orchestration.pipeline import RankForgePipeline


@pytest.mark.asyncio
async def test_keyword_analysis():
    """Test Phase 1: Keyword analysis"""
    pipeline = RankForgePipeline()
    
    keyword_input = KeywordInput(
        primary_keyword="AI blog automation tool",
        target_location="India",
        secondary_keywords=["blog automation", "AI writing tool"],
        content_type="blog"
    )
    
    strategy_brief = await pipeline.analyze_keywords_only(keyword_input)
    
    assert strategy_brief is not None
    assert strategy_brief.keyword_cluster.primary == "ai blog automation tool"
    assert len(strategy_brief.keyword_cluster.secondary) > 0
    assert strategy_brief.traffic_projection.estimated_monthly_searches > 0
    assert len(strategy_brief.serp_gap.missing_topics) > 0


@pytest.mark.asyncio
async def test_full_pipeline():
    """Test complete pipeline execution"""
    pipeline = RankForgePipeline()
    
    keyword_input = KeywordInput(
        primary_keyword="Python web scraping",
        target_location="United States",
        content_type="guide"
    )
    
    request = GenerationRequest(
        keyword_input=keyword_input,
        tone="professional",
        include_faq=True
    )
    
    result = await pipeline.execute(request)
    
    assert result is not None
    assert len(result.blog_content) > 500
    assert result.metadata.overall_score > 0
    assert result.metadata.seo_metrics.seo_optimization_percentage > 0
    assert result.metadata.snippet_analysis.snippet_readiness_probability >= 0


@pytest.mark.asyncio
async def test_pipeline_with_different_tones():
    """Test pipeline with different content tones"""
    pipeline = RankForgePipeline()
    
    tones = ["professional", "casual", "technical"]
    
    for tone in tones:
        keyword_input = KeywordInput(
            primary_keyword="machine learning basics",
            target_location="Global",
            content_type="tutorial"
        )
        
        request = GenerationRequest(
            keyword_input=keyword_input,
            tone=tone,
            include_faq=False
        )
        
        result = await pipeline.execute(request)
        
        assert result is not None
        assert len(result.blog_content) > 500


def test_keyword_input_validation():
    """Test keyword input validation"""
    
    # Valid input
    valid_input = KeywordInput(
        primary_keyword="test keyword",
        target_location="India"
    )
    assert valid_input.primary_keyword == "test keyword"
    
    # Test whitespace trimming
    input_with_spaces = KeywordInput(
        primary_keyword="  test keyword  ",
        target_location="  India  "
    )
    assert input_with_spaces.primary_keyword == "test keyword"
    assert input_with_spaces.target_location == "India"


def test_generation_request_defaults():
    """Test generation request default values"""
    
    keyword_input = KeywordInput(
        primary_keyword="test",
        target_location="test"
    )
    
    request = GenerationRequest(keyword_input=keyword_input)
    
    assert request.enable_serp_analysis is True
    assert request.enable_traffic_projection is True
    assert request.tone == "professional"
    assert request.include_faq is True
