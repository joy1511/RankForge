"""Keyword and SEO analysis schemas"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field, field_validator


class KeywordInput(BaseModel):
    """Input for keyword analysis"""
    primary_keyword: str = Field(..., min_length=2, max_length=200)
    target_location: str = Field(..., min_length=2, max_length=100)
    secondary_keywords: Optional[List[str]] = Field(default_factory=list)
    target_audience: Optional[str] = None
    content_type: str = Field(default="blog", pattern="^(blog|article|guide|tutorial)$")
    
    @field_validator("primary_keyword", "target_location")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()


class KeywordCluster(BaseModel):
    """Clustered keywords with metadata"""
    primary: str
    secondary: List[str] = Field(default_factory=list)
    long_tail: List[str] = Field(default_factory=list)
    related_questions: List[str] = Field(default_factory=list)
    search_intent: str = Field(default="informational")
    difficulty_score: float = Field(ge=0.0, le=100.0, default=50.0)


class SERPGap(BaseModel):
    """SERP gap analysis results"""
    missing_topics: List[str] = Field(default_factory=list)
    underserved_questions: List[str] = Field(default_factory=list)
    content_opportunities: List[str] = Field(default_factory=list)
    competitor_weaknesses: List[str] = Field(default_factory=list)
    recommended_word_count: int = Field(ge=500, le=10000, default=2000)


class TrafficProjection(BaseModel):
    """Traffic potential estimation"""
    estimated_monthly_searches: int = Field(ge=0, default=0)
    competition_level: str = Field(default="medium")
    ranking_probability: float = Field(ge=0.0, le=100.0, default=50.0)
    projected_monthly_traffic: int = Field(ge=0, default=0)
    ctr_estimate: float = Field(ge=0.0, le=100.0, default=5.0)


class StrategyBrief(BaseModel):
    """Complete strategy brief from Phase 1"""
    keyword_cluster: KeywordCluster
    serp_gap: SERPGap
    traffic_projection: TrafficProjection
    target_location: str
    content_angle: str
    structural_requirements: Dict[str, int] = Field(
        default_factory=lambda: {
            "min_h2_sections": 5,
            "min_h3_subsections": 10,
            "target_word_count": 2000
        }
    )
    internal_linking_opportunities: List[str] = Field(default_factory=list)
