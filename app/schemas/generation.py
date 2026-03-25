"""Content generation schemas"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class OutlineSection(BaseModel):
    """Single section in content outline"""
    heading: str = Field(..., min_length=5, max_length=200)
    heading_level: int = Field(ge=2, le=4, default=2)
    target_keywords: List[str] = Field(default_factory=list)
    snippet_opportunity: bool = Field(default=False)
    estimated_word_count: int = Field(ge=50, le=2000, default=200)
    subsections: List["OutlineSection"] = Field(default_factory=list)


class ContentOutline(BaseModel):
    """Complete content outline from Researcher Agent"""
    title: str = Field(..., min_length=10, max_length=200)
    meta_description: str = Field(..., min_length=50, max_length=160)
    introduction_brief: str = Field(..., min_length=50, max_length=500)
    sections: List[OutlineSection]
    conclusion_brief: str = Field(..., min_length=50, max_length=500)
    target_word_count: int = Field(ge=500, le=10000)
    primary_cta: Optional[str] = None
    internal_links: List[Dict[str, str]] = Field(default_factory=list)


class BlogDraft(BaseModel):
    """Complete blog draft from Writer Agent"""
    title: str
    meta_description: str
    markdown_content: str = Field(..., min_length=500)
    word_count: int = Field(ge=500)
    sections_count: int = Field(ge=3)
    keywords_used: List[str] = Field(default_factory=list)
    snippet_optimized_sections: List[str] = Field(default_factory=list)
    internal_links_added: int = Field(ge=0, default=0)


class GenerationRequest(BaseModel):
    """Complete generation request"""
    keyword_input: "KeywordInput"
    enable_serp_analysis: bool = Field(default=True)
    enable_traffic_projection: bool = Field(default=True)
    custom_instructions: Optional[str] = None
    tone: str = Field(default="professional", pattern="^(professional|casual|technical|conversational)$")
    include_faq: bool = Field(default=True)


# Enable forward references
OutlineSection.model_rebuild()


from app.schemas.keyword import KeywordInput
GenerationRequest.model_rebuild()
