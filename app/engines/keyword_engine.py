"""Keyword clustering and analysis engine"""

from typing import List, Dict
import re
from app.schemas.keyword import KeywordInput, KeywordCluster, SERPGap, TrafficProjection, StrategyBrief
from app.utils.logger import setup_logger
from app.utils.exceptions import KeywordEngineError

logger = setup_logger(__name__)


class KeywordEngine:
    """Handles keyword clustering and strategic analysis"""
    
    def __init__(self):
        self.logger = logger
    
    async def analyze_keywords(self, keyword_input: KeywordInput) -> StrategyBrief:
        """
        Perform comprehensive keyword analysis
        
        Args:
            keyword_input: Keyword input data
            
        Returns:
            Complete strategy brief
            
        Raises:
            KeywordEngineError: If analysis fails
        """
        try:
            self.logger.info(f"Starting keyword analysis for: {keyword_input.primary_keyword}")
            
            # Phase 1.1: Cluster keywords
            keyword_cluster = await self._cluster_keywords(keyword_input)
            
            # Phase 1.2: Identify SERP gaps
            serp_gap = await self._identify_serp_gaps(keyword_cluster, keyword_input)
            
            # Phase 1.3: Project traffic potential
            traffic_projection = await self._project_traffic(keyword_cluster, keyword_input)
            
            # Phase 1.4: Generate content angle
            content_angle = self._generate_content_angle(keyword_cluster, keyword_input)
            
            # Phase 1.5: Define structural requirements
            structural_requirements = self._define_structure(serp_gap, traffic_projection)
            
            strategy_brief = StrategyBrief(
                keyword_cluster=keyword_cluster,
                serp_gap=serp_gap,
                traffic_projection=traffic_projection,
                target_location=keyword_input.target_location,
                content_angle=content_angle,
                structural_requirements=structural_requirements,
                internal_linking_opportunities=self._identify_linking_opportunities(keyword_cluster)
            )
            
            self.logger.info("Keyword analysis completed successfully")
            return strategy_brief
            
        except Exception as e:
            self.logger.error(f"Keyword analysis failed: {str(e)}")
            raise KeywordEngineError(f"Failed to analyze keywords: {str(e)}")
    
    async def _cluster_keywords(self, keyword_input: KeywordInput) -> KeywordCluster:
        """Cluster keywords into primary, secondary, and long-tail"""
        primary = keyword_input.primary_keyword.lower()
        
        # Generate secondary keywords
        secondary = list(set(keyword_input.secondary_keywords or []))
        if not secondary:
            secondary = self._generate_secondary_keywords(primary)
        
        # Generate long-tail variations
        long_tail = self._generate_long_tail_keywords(primary, keyword_input.target_location)
        
        # Generate related questions
        related_questions = self._generate_related_questions(primary)
        
        # Determine search intent
        search_intent = self._determine_search_intent(primary)
        
        # Calculate difficulty score
        difficulty_score = self._calculate_difficulty(primary, len(secondary))
        
        return KeywordCluster(
            primary=primary,
            secondary=secondary[:10],
            long_tail=long_tail[:15],
            related_questions=related_questions[:10],
            search_intent=search_intent,
            difficulty_score=difficulty_score
        )
    
    def _generate_secondary_keywords(self, primary: str) -> List[str]:
        """Generate semantically related secondary keywords"""
        words = primary.split()
        secondary = []
        
        # Add variations
        if len(words) > 1:
            secondary.append(" ".join(words[:-1]))
            secondary.append(" ".join(words[1:]))
        
        # Add common modifiers
        modifiers = ["best", "top", "how to", "guide", "tutorial", "tips", "benefits", "vs"]
        for modifier in modifiers:
            if modifier not in primary:
                secondary.append(f"{modifier} {primary}")
        
        return list(set(secondary))[:10]
    
    def _generate_long_tail_keywords(self, primary: str, location: str) -> List[str]:
        """Generate long-tail keyword variations"""
        long_tail = [
            f"{primary} in {location}",
            f"best {primary} for {location}",
            f"how to use {primary}",
            f"{primary} guide for beginners",
            f"{primary} tips and tricks",
            f"{primary} step by step",
            f"complete {primary} tutorial",
            f"{primary} best practices",
            f"{primary} for small business",
            f"affordable {primary} in {location}",
            f"{primary} comparison",
            f"{primary} pros and cons",
            f"why use {primary}",
            f"{primary} features",
            f"{primary} pricing"
        ]
        return list(set(long_tail))
    
    def _generate_related_questions(self, primary: str) -> List[str]:
        """Generate related questions for snippet optimization"""
        questions = [
            f"What is {primary}?",
            f"How does {primary} work?",
            f"Why is {primary} important?",
            f"When should you use {primary}?",
            f"Who needs {primary}?",
            f"Where can I find {primary}?",
            f"How much does {primary} cost?",
            f"What are the benefits of {primary}?",
            f"How to get started with {primary}?",
            f"What are the best {primary} options?"
        ]
        return questions
    
    def _determine_search_intent(self, keyword: str) -> str:
        """Determine the search intent of the keyword"""
        keyword_lower = keyword.lower()
        
        if any(word in keyword_lower for word in ["buy", "price", "cost", "cheap", "discount"]):
            return "transactional"
        elif any(word in keyword_lower for word in ["how to", "guide", "tutorial", "tips"]):
            return "informational"
        elif any(word in keyword_lower for word in ["best", "top", "vs", "review", "compare"]):
            return "commercial"
        else:
            return "informational"
    
    def _calculate_difficulty(self, keyword: str, secondary_count: int) -> float:
        """Calculate keyword difficulty score"""
        base_difficulty = 50.0
        word_count = len(keyword.split())
        
        # Longer keywords are typically easier
        if word_count >= 4:
            base_difficulty -= 20
        elif word_count >= 3:
            base_difficulty -= 10
        
        # More secondary keywords suggest higher competition
        if secondary_count > 10:
            base_difficulty += 15
        
        return max(10.0, min(90.0, base_difficulty))
    
    async def _identify_serp_gaps(self, cluster: KeywordCluster, keyword_input: KeywordInput) -> SERPGap:
        """Identify gaps in current SERP results"""
        # Simulate SERP gap analysis
        missing_topics = [
            f"Detailed implementation guide for {cluster.primary}",
            f"Common mistakes when using {cluster.primary}",
            f"Advanced {cluster.primary} strategies",
            f"{cluster.primary} case studies from {keyword_input.target_location}",
            f"Future trends in {cluster.primary}"
        ]
        
        underserved_questions = [q for q in cluster.related_questions[:5]]
        
        content_opportunities = [
            f"Create comprehensive FAQ section",
            f"Include step-by-step tutorials",
            f"Add comparison tables",
            f"Provide downloadable resources",
            f"Include expert quotes and statistics"
        ]
        
        competitor_weaknesses = [
            f"Lack of local {keyword_input.target_location} examples",
            "Missing actionable implementation steps",
            "No visual aids or diagrams",
            "Outdated information",
            "Poor mobile optimization"
        ]
        
        # Calculate recommended word count based on competition
        recommended_word_count = 2000 if cluster.difficulty_score > 60 else 1500
        
        return SERPGap(
            missing_topics=missing_topics,
            underserved_questions=underserved_questions,
            content_opportunities=content_opportunities,
            competitor_weaknesses=competitor_weaknesses,
            recommended_word_count=recommended_word_count
        )
    
    async def _project_traffic(self, cluster: KeywordCluster, keyword_input: KeywordInput) -> TrafficProjection:
        """Project potential traffic based on keyword analysis"""
        # Simulate traffic projection
        base_searches = 1000
        
        # Adjust based on keyword characteristics
        word_count = len(cluster.primary.split())
        if word_count <= 2:
            base_searches *= 3
        elif word_count == 3:
            base_searches *= 2
        
        # Determine competition level
        if cluster.difficulty_score > 70:
            competition = "high"
            ranking_prob = 30.0
        elif cluster.difficulty_score > 40:
            competition = "medium"
            ranking_prob = 60.0
        else:
            competition = "low"
            ranking_prob = 85.0
        
        # Calculate CTR based on projected ranking
        if ranking_prob > 70:
            ctr = 25.0  # Top 3 positions
        elif ranking_prob > 50:
            ctr = 10.0  # Positions 4-7
        else:
            ctr = 5.0   # Positions 8-10
        
        projected_traffic = int(base_searches * (ctr / 100) * (ranking_prob / 100))
        
        return TrafficProjection(
            estimated_monthly_searches=base_searches,
            competition_level=competition,
            ranking_probability=ranking_prob,
            projected_monthly_traffic=projected_traffic,
            ctr_estimate=ctr
        )
    
    def _generate_content_angle(self, cluster: KeywordCluster, keyword_input: KeywordInput) -> str:
        """Generate unique content angle"""
        intent = cluster.search_intent
        location = keyword_input.target_location
        
        if intent == "informational":
            return f"Comprehensive guide to {cluster.primary} with {location}-specific insights and actionable steps"
        elif intent == "commercial":
            return f"Data-driven comparison of {cluster.primary} options for {location} market"
        elif intent == "transactional":
            return f"Complete buying guide for {cluster.primary} in {location} with pricing analysis"
        else:
            return f"Expert analysis of {cluster.primary} tailored for {location} audience"
    
    def _define_structure(self, serp_gap: SERPGap, traffic_projection: TrafficProjection) -> Dict[str, int]:
        """Define structural requirements based on analysis"""
        word_count = serp_gap.recommended_word_count
        
        # Calculate sections based on word count
        h2_sections = max(5, word_count // 300)
        h3_subsections = max(10, word_count // 150)
        
        return {
            "min_h2_sections": h2_sections,
            "min_h3_subsections": h3_subsections,
            "target_word_count": word_count,
            "min_internal_links": 5,
            "min_external_links": 3
        }
    
    def _identify_linking_opportunities(self, cluster: KeywordCluster) -> List[str]:
        """Identify internal linking opportunities"""
        opportunities = []
        
        for keyword in cluster.secondary[:5]:
            opportunities.append(f"Link to: {keyword} guide")
        
        opportunities.extend([
            f"Related: {cluster.primary} best practices",
            f"See also: {cluster.primary} case studies",
            f"Learn more: Advanced {cluster.primary} techniques"
        ])
        
        return opportunities[:8]
