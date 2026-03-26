"""Main orchestration pipeline for RankForge"""

from datetime import datetime
from typing import Optional
from app.schemas.keyword import KeywordInput, StrategyBrief
from app.schemas.generation import GenerationRequest, ContentOutline, BlogDraft
from app.schemas.validation import FinalOutput, ValidationReport
from app.engines.keyword_engine import KeywordEngine
from app.agents.researcher import ResearcherAgent
from app.agents.writer import WriterAgent
from app.agents.editor import EditorAgent
from app.utils.logger import setup_logger, log_agent_activity
from app.utils.exceptions import PipelineError
from app.config import settings

logger = setup_logger(__name__)


class RankForgePipeline:
    """
    Main orchestration pipeline that coordinates all phases of blog generation
    
    Pipeline Flow:
    1. Phase 1: Keyword & SEO Logic Engine
    2. Phase 2: Multi-Agent Generation (Researcher -> Writer)
    3. Phase 3: Validation & Scoring (Editor)
    """
    
    def __init__(self):
        self.logger = logger
        self.keyword_engine = KeywordEngine()
        self.researcher_agent = ResearcherAgent()
        self.writer_agent = WriterAgent()
        self.editor_agent = EditorAgent()
    
    async def execute(self, request: GenerationRequest) -> FinalOutput:
        """
        Execute the complete blog generation pipeline
        
        Args:
            request: Generation request with keyword input and options
            
        Returns:
            Final output with blog content and metadata
            
        Raises:
            PipelineError: If any phase fails
        """
        self.logger.info("=" * 80)
        self.logger.info("RANKFORGE PIPELINE EXECUTION STARTED")
        self.logger.info("=" * 80)
        
        try:
            # PHASE 1: Intent & Strategy Engine
            self.logger.info("\n[PHASE 1] Intent & Strategy Engine")
            strategy_brief = await self._execute_phase_1(request.keyword_input)
            
            # PHASE 2: Multi-Agent Generation Core
            self.logger.info("\n[PHASE 2] Multi-Agent Generation Core")
            blog_draft = await self._execute_phase_2(strategy_brief, request)
            
            # PHASE 3: Automated SEO Validator
            self.logger.info("\n[PHASE 3] Automated SEO Validator")
            validation_report = await self._execute_phase_3(blog_draft, strategy_brief)
            
            # Compile final output
            final_output = self._compile_final_output(
                blog_draft, 
                validation_report, 
                strategy_brief
            )
            
            self.logger.info("\n" + "=" * 80)
            self.logger.info("PIPELINE EXECUTION COMPLETED SUCCESSFULLY")
            self.logger.info(f"Overall Score: {validation_report.overall_score}/100")
            self.logger.info("=" * 80)
            
            return final_output
            
        except Exception as e:
            self.logger.error(f"Pipeline execution failed: {str(e)}")
            raise PipelineError(
                f"Pipeline execution failed: {str(e)}",
                details={"error": str(e), "phase": "unknown"}
            )
    
    async def _execute_phase_1(self, keyword_input: KeywordInput) -> StrategyBrief:
        """
        Phase 1: Keyword & SEO Logic Engine
        
        - Keyword clustering
        - SERP gap identification
        - Traffic potential projection
        """
        log_agent_activity(
            self.logger,
            "KeywordEngine",
            "Starting keyword analysis",
            {"keyword": keyword_input.primary_keyword}
        )
        
        try:
            strategy_brief = await self.keyword_engine.analyze_keywords(keyword_input)
            
            self.logger.info(f" Keyword clustering complete")
            self.logger.info(f"  - Primary: {strategy_brief.keyword_cluster.primary}")
            self.logger.info(f"  - Secondary keywords: {len(strategy_brief.keyword_cluster.secondary)}")
            self.logger.info(f"  - Long-tail keywords: {len(strategy_brief.keyword_cluster.long_tail)}")
            self.logger.info(f"  - Search intent: {strategy_brief.keyword_cluster.search_intent}")
            
            self.logger.info(f" SERP gap analysis complete")
            self.logger.info(f"  - Missing topics: {len(strategy_brief.serp_gap.missing_topics)}")
            self.logger.info(f"  - Content opportunities: {len(strategy_brief.serp_gap.content_opportunities)}")
            
            self.logger.info(f" Traffic projection complete")
            self.logger.info(f"  - Est. monthly searches: {strategy_brief.traffic_projection.estimated_monthly_searches}")
            self.logger.info(f"  - Ranking probability: {strategy_brief.traffic_projection.ranking_probability}%")
            self.logger.info(f"  - Projected traffic: {strategy_brief.traffic_projection.projected_monthly_traffic}/month")
            
            return strategy_brief
            
        except Exception as e:
            self.logger.error(f"Phase 1 failed: {str(e)}")
            raise PipelineError(
                f"Phase 1 (Keyword Analysis) failed: {str(e)}",
                details={"phase": "phase_1", "error": str(e)}
            )
    
    async def _execute_phase_2(
        self, 
        strategy_brief: StrategyBrief, 
        request: GenerationRequest
    ) -> BlogDraft:
        """
        Phase 2: Multi-Agent Generation Core
        
        - Researcher Agent: Creates outline
        - Writer Agent: Generates content
        """
        
        # Step 2.1: Researcher Agent
        log_agent_activity(
            self.logger,
            "ResearcherAgent",
            "Creating content outline"
        )
        
        try:
            outline = await self.researcher_agent.execute(
                strategy_brief=strategy_brief,
                tone=request.tone
            )
            
            self.logger.info(f" Content outline created")
            self.logger.info(f"  - Title: {outline.title}")
            self.logger.info(f"  - Main sections: {len(outline.sections)}")
            self.logger.info(f"  - Target word count: {outline.target_word_count}")
            
            # Count snippet opportunities
            snippet_count = sum(1 for s in outline.sections if s.snippet_opportunity)
            self.logger.info(f"  - Snippet opportunities: {snippet_count}")
            
        except Exception as e:
            self.logger.error(f"Researcher Agent failed: {str(e)}")
            raise PipelineError(
                f"Phase 2 (Researcher) failed: {str(e)}",
                details={"phase": "phase_2_researcher", "error": str(e)}
            )
        
        # Step 2.2: Writer Agent
        log_agent_activity(
            self.logger,
            "WriterAgent",
            "Generating blog content"
        )
        
        try:
            blog_draft = await self.writer_agent.execute(
                outline=outline,
                strategy_brief=strategy_brief,
                tone=request.tone,
                include_faq=request.include_faq
            )
            
            self.logger.info(f" Blog content generated")
            self.logger.info(f"  - Word count: {blog_draft.word_count}")
            self.logger.info(f"  - Sections: {blog_draft.sections_count}")
            self.logger.info(f"  - Keywords used: {len(blog_draft.keywords_used)}")
            self.logger.info(f"  - Internal links: {blog_draft.internal_links_added}")
            
            return blog_draft
            
        except Exception as e:
            self.logger.error(f"Writer Agent failed: {str(e)}")
            raise PipelineError(
                f"Phase 2 (Writer) failed: {str(e)}",
                details={"phase": "phase_2_writer", "error": str(e)}
            )
    
    async def _execute_phase_3(
        self, 
        blog_draft: BlogDraft, 
        strategy_brief: StrategyBrief
    ) -> ValidationReport:
        """
        Phase 3: Automated SEO Validator
        
        - Editor Agent: Validates and scores content
        """
        log_agent_activity(
            self.logger,
            "EditorAgent",
            "Validating content quality"
        )
        
        try:
            validation_report = await self.editor_agent.execute(
                blog_draft=blog_draft,
                strategy_brief=strategy_brief
            )
            
            self.logger.info(f" Content validation complete")
            self.logger.info(f"\n  SCORING REPORT:")
            self.logger.info(f"  ├─ SEO Optimization: {validation_report.seo_metrics.seo_optimization_percentage}%")
            self.logger.info(f"  ├─ Snippet Readiness: {validation_report.snippet_analysis.snippet_readiness_probability}%")
            self.logger.info(f"  ├─ Naturalness Score: {validation_report.naturalness_analysis.naturalness_score}%")
            self.logger.info(f"  ├─ AI Detection Risk: {validation_report.naturalness_analysis.ai_detection_probability}%")
            self.logger.info(f"  ├─ Content Depth: {validation_report.content_quality.depth_score}%")
            self.logger.info(f"  └─ Overall Score: {validation_report.overall_score}%")
            
            self.logger.info(f"\n  STRENGTHS ({len(validation_report.strengths)}):")
            for strength in validation_report.strengths[:3]:
                self.logger.info(f"    • {strength}")
            
            if validation_report.improvements_needed:
                self.logger.info(f"\n  IMPROVEMENTS NEEDED ({len(validation_report.improvements_needed)}):")
                for improvement in validation_report.improvements_needed[:3]:
                    self.logger.info(f"    • {improvement}")
            
            return validation_report
            
        except Exception as e:
            self.logger.error(f"Editor Agent failed: {str(e)}")
            raise PipelineError(
                f"Phase 3 (Validation) failed: {str(e)}",
                details={"phase": "phase_3", "error": str(e)}
            )
    
    def _compile_final_output(
        self,
        blog_draft: BlogDraft,
        validation_report: ValidationReport,
        strategy_brief: StrategyBrief
    ) -> FinalOutput:
        """Compile final output with all metadata"""
        
        return FinalOutput(
            blog_content=blog_draft.markdown_content,
            metadata=validation_report,
            strategy_brief={
                "primary_keyword": strategy_brief.keyword_cluster.primary,
                "target_location": strategy_brief.target_location,
                "search_intent": strategy_brief.keyword_cluster.search_intent,
                "content_angle": strategy_brief.content_angle,
                "estimated_monthly_searches": strategy_brief.traffic_projection.estimated_monthly_searches,
                "projected_monthly_traffic": strategy_brief.traffic_projection.projected_monthly_traffic,
                "ranking_probability": strategy_brief.traffic_projection.ranking_probability,
                "competition_level": strategy_brief.traffic_projection.competition_level
            },
            generation_timestamp=datetime.utcnow().isoformat() + "Z",
            version=settings.app_version
        )
    
    async def analyze_keywords_only(self, keyword_input: KeywordInput) -> StrategyBrief:
        """
        Execute only Phase 1 for keyword analysis
        
        Args:
            keyword_input: Keyword input data
            
        Returns:
            Strategy brief
        """
        self.logger.info("Executing keyword analysis only")
        return await self._execute_phase_1(keyword_input)
