"""Editor Agent - Validates and scores content quality"""

import re
from app.agents.base import BaseAgent
from app.schemas.generation import BlogDraft
from app.schemas.keyword import StrategyBrief
from app.schemas.validation import ValidationReport
from app.engines.seo_validator import SEOValidator
from app.config import settings
from app.utils.exceptions import AgentExecutionError


class EditorAgent(BaseAgent):
    """
    Agent responsible for validating content quality, SEO optimization,
    and generating comprehensive scoring reports
    """
    
    def __init__(self):
        super().__init__(
            model_name=settings.editor_model,
            temperature=0.3  # Lower temperature for more consistent evaluation
        )
        self.seo_validator = SEOValidator()
    
    async def execute(
        self, 
        blog_draft: BlogDraft, 
        strategy_brief: StrategyBrief
    ) -> ValidationReport:
        """
        Validate and score blog content
        
        Args:
            blog_draft: Generated blog draft
            strategy_brief: Original strategy brief
            
        Returns:
            Comprehensive validation report
            
        Raises:
            AgentExecutionError: If validation fails
        """
        self.logger.info("Editor Agent: Starting content validation")
        
        try:
            # Phase 1: Automated SEO validation
            validation_report = await self.seo_validator.validate_content(
                content=blog_draft.markdown_content,
                keyword_cluster=strategy_brief.keyword_cluster,
                target_word_count=strategy_brief.serp_gap.recommended_word_count
            )
            
            # Phase 2: AI-powered qualitative review
            qualitative_insights = await self._perform_qualitative_review(
                blog_draft, 
                strategy_brief,
                validation_report
            )
            
            # Enhance report with qualitative insights
            validation_report = self._enhance_report(validation_report, qualitative_insights)
            
            self.logger.info(f"Validation complete. Overall score: {validation_report.overall_score}")
            return validation_report
            
        except Exception as e:
            self.logger.error(f"Editor Agent failed: {str(e)}")
            raise AgentExecutionError(
                f"Failed to validate content: {str(e)}",
                details={"agent": "EditorAgent", "error": str(e)}
            )
    
    async def _perform_qualitative_review(
        self,
        blog_draft: BlogDraft,
        strategy_brief: StrategyBrief,
        validation_report: ValidationReport
    ) -> dict:
        """Perform AI-powered qualitative content review"""
        
        system_prompt = self._build_editor_system_prompt()
        user_prompt = self._build_editor_user_prompt(
            blog_draft, 
            strategy_brief, 
            validation_report
        )
        
        try:
            response = await self._invoke_llm(system_prompt, user_prompt)
            insights = self._parse_qualitative_insights(response)
            return insights
        except Exception as e:
            self.logger.warning(f"Qualitative review failed: {str(e)}")
            return {
                "additional_strengths": [],
                "additional_improvements": [],
                "editorial_notes": "Automated validation completed successfully."
            }
    
    def _build_editor_system_prompt(self) -> str:
        """Build system prompt for editor agent"""
        return """You are a senior SEO content editor with expertise in evaluating blog quality, 
search engine optimization, and content effectiveness.

Your role is to provide qualitative insights that complement automated metrics. Focus on:

1. CONTENT DEPTH & UNIQUENESS
   - Does it provide unique value beyond surface-level information?
   - Are examples specific and actionable?
   - Does it demonstrate expertise?

2. USER EXPERIENCE
   - Is the content scannable and well-structured?
   - Does it maintain reader engagement?
   - Are transitions smooth and logical?

3. CONVERSION POTENTIAL
   - Does it build trust and authority?
   - Are CTAs natural and compelling?
   - Does it guide readers toward action?

4. COMPETITIVE ADVANTAGE
   - What makes this content stand out?
   - Does it address gaps competitors miss?
   - Is the angle differentiated?

Provide specific, actionable feedback in this format:
STRENGTHS:
- [Specific strength with example]
- [Another strength]

IMPROVEMENTS:
- [Specific improvement with rationale]
- [Another improvement]

EDITORIAL NOTES:
[2-3 sentences summarizing overall assessment and key recommendations]"""
    
    def _build_editor_user_prompt(
        self,
        blog_draft: BlogDraft,
        strategy_brief: StrategyBrief,
        validation_report: ValidationReport
    ) -> str:
        """Build user prompt for qualitative review"""
        
        cluster = strategy_brief.keyword_cluster
        
        # Get content preview (first 3000 chars — enough to cover most of the blog)
        content_preview = blog_draft.markdown_content[:3000]
        if len(blog_draft.markdown_content) > 3000:
            content_preview += "\n\n[... content continues ...]"
        
        prompt = f"""Review this blog content and provide qualitative insights:

CONTENT PREVIEW:
{content_preview}

TARGET KEYWORD: {cluster.primary}
SEARCH INTENT: {cluster.search_intent}
TARGET LOCATION: {strategy_brief.target_location}
CONTENT ANGLE: {strategy_brief.content_angle}

AUTOMATED METRICS:
- SEO Optimization: {validation_report.seo_metrics.seo_optimization_percentage}%
- Snippet Readiness: {validation_report.snippet_analysis.snippet_readiness_probability}%
- Naturalness Score: {validation_report.naturalness_analysis.naturalness_score}%
- Word Count: {blog_draft.word_count} (Target: {strategy_brief.serp_gap.recommended_word_count})
- Sections: {blog_draft.sections_count}

CURRENT STRENGTHS IDENTIFIED:
{chr(10).join(f'- {s}' for s in validation_report.strengths)}

CURRENT IMPROVEMENTS NEEDED:
{chr(10).join(f'- {i}' for i in validation_report.improvements_needed)}

Provide additional qualitative insights focusing on:
1. Content depth and unique value proposition
2. User experience and engagement potential
3. Competitive differentiation
4. Conversion optimization
5. Any critical issues not captured by automated metrics

Be specific and actionable in your feedback."""
        
        return prompt
    
    def _parse_qualitative_insights(self, response: str) -> dict:
        """Parse qualitative insights from LLM response"""
        
        insights = {
            "additional_strengths": [],
            "additional_improvements": [],
            "editorial_notes": ""
        }
        
        # Extract strengths
        strengths_match = re.search(
            r'STRENGTHS?:?\s*\n((?:[-•]\s*.+\n?)+)', 
            response, 
            re.IGNORECASE
        )
        if strengths_match:
            strengths_text = strengths_match.group(1)
            insights["additional_strengths"] = [
                s.strip('- •\n') 
                for s in strengths_text.split('\n') 
                if s.strip('- •\n')
            ]
        
        # Extract improvements
        improvements_match = re.search(
            r'IMPROVEMENTS?:?\s*\n((?:[-•]\s*.+\n?)+)', 
            response, 
            re.IGNORECASE
        )
        if improvements_match:
            improvements_text = improvements_match.group(1)
            insights["additional_improvements"] = [
                i.strip('- •\n') 
                for i in improvements_text.split('\n') 
                if i.strip('- •\n')
            ]
        
        # Extract editorial notes
        notes_match = re.search(
            r'EDITORIAL NOTES?:?\s*\n(.+?)(?:\n\n|\Z)', 
            response, 
            re.IGNORECASE | re.DOTALL
        )
        if notes_match:
            insights["editorial_notes"] = notes_match.group(1).strip()
        
        return insights
    
    def _enhance_report(
        self, 
        report: ValidationReport, 
        qualitative_insights: dict
    ) -> ValidationReport:
        """Enhance validation report with qualitative insights"""
        
        # Add additional strengths
        for strength in qualitative_insights.get("additional_strengths", []):
            if strength and strength not in report.strengths:
                report.strengths.append(strength)
        
        # Add additional improvements
        for improvement in qualitative_insights.get("additional_improvements", []):
            if improvement and improvement not in report.improvements_needed:
                report.improvements_needed.append(improvement)
        
        # Enhance editor notes
        if qualitative_insights.get("editorial_notes"):
            if report.editor_notes:
                report.editor_notes += f"\n\n{qualitative_insights['editorial_notes']}"
            else:
                report.editor_notes = qualitative_insights["editorial_notes"]
        
        return report


