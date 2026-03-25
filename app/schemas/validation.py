"""Validation and scoring schemas"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class SEOMetrics(BaseModel):
    """SEO optimization metrics"""
    seo_optimization_percentage: float = Field(ge=0.0, le=100.0)
    keyword_density: Dict[str, float] = Field(default_factory=dict)
    keyword_density_compliance: bool = Field(default=True)
    title_optimization_score: float = Field(ge=0.0, le=100.0)
    meta_description_score: float = Field(ge=0.0, le=100.0)
    heading_structure_score: float = Field(ge=0.0, le=100.0)
    internal_linking_score: float = Field(ge=0.0, le=100.0)
    readability_score: float = Field(ge=0.0, le=100.0)


class SnippetAnalysis(BaseModel):
    """Featured snippet readiness analysis"""
    snippet_readiness_probability: float = Field(ge=0.0, le=100.0)
    snippet_optimized_sections: List[str] = Field(default_factory=list)
    question_answer_pairs: int = Field(ge=0, default=0)
    list_format_usage: int = Field(ge=0, default=0)
    table_usage: int = Field(ge=0, default=0)


class NaturalnessAnalysis(BaseModel):
    """Content naturalness and AI detection analysis"""
    naturalness_score: float = Field(ge=0.0, le=100.0)
    ai_detection_probability: float = Field(ge=0.0, le=100.0)
    sentence_variety_score: float = Field(ge=0.0, le=100.0)
    vocabulary_richness: float = Field(ge=0.0, le=100.0)
    transition_quality: float = Field(ge=0.0, le=100.0)
    human_like_patterns: List[str] = Field(default_factory=list)


class ContentQuality(BaseModel):
    """Overall content quality metrics"""
    word_count: int = Field(ge=0)
    unique_value_score: float = Field(ge=0.0, le=100.0)
    depth_score: float = Field(ge=0.0, le=100.0)
    actionability_score: float = Field(ge=0.0, le=100.0)
    engagement_potential: float = Field(ge=0.0, le=100.0)


class ValidationReport(BaseModel):
    """Complete validation report from Editor Agent"""
    seo_metrics: SEOMetrics
    snippet_analysis: SnippetAnalysis
    naturalness_analysis: NaturalnessAnalysis
    content_quality: ContentQuality
    overall_score: float = Field(ge=0.0, le=100.0)
    strengths: List[str] = Field(default_factory=list)
    improvements_needed: List[str] = Field(default_factory=list)
    editor_notes: Optional[str] = None


class FinalOutput(BaseModel):
    """Final output combining blog and metadata"""
    blog_content: str = Field(..., min_length=500)
    metadata: ValidationReport
    strategy_brief: Optional[Dict] = None
    generation_timestamp: str
    version: str = Field(default="1.0.0")
    
    class Config:
        json_schema_extra = {
            "example": {
                "blog_content": "# Your SEO-Optimized Blog Title\n\n...",
                "metadata": {
                    "seo_metrics": {
                        "seo_optimization_percentage": 92.5
                    }
                },
                "generation_timestamp": "2024-01-15T10:30:00Z",
                "version": "1.0.0"
            }
        }
