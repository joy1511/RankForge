"""SEO validation and scoring engine"""

import re
from typing import Dict, List, Tuple
from collections import Counter
from app.schemas.validation import (
    SEOMetrics, SnippetAnalysis, NaturalnessAnalysis,
    ContentQuality, ValidationReport
)
from app.schemas.keyword import KeywordCluster
from app.engines.geo_validator import GEOValidator
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class SEOValidator:
    """Validates and scores content for SEO and GEO optimization"""

    def __init__(self):
        self.logger = logger
        self.geo_validator = GEOValidator()

    async def validate_content(
        self,
        content: str,
        keyword_cluster: KeywordCluster,
        target_word_count: int
    ) -> ValidationReport:
        self.logger.info("Starting SEO + GEO validation")

        clean_text = self._clean_markdown(content)

        seo_metrics    = await self._calculate_seo_metrics(content, clean_text, keyword_cluster)
        geo_metrics    = await self.geo_validator.calculate_geo_score(content, clean_text, keyword_cluster)
        snippet_analysis = await self._analyze_snippet_readiness(content, keyword_cluster)
        naturalness    = await self._analyze_naturalness(clean_text)
        quality        = await self._analyze_content_quality(clean_text, target_word_count)

        overall_score = self._calculate_overall_score(seo_metrics, geo_metrics, snippet_analysis, naturalness, quality)
        strengths, improvements = self._generate_insights(seo_metrics, geo_metrics, snippet_analysis, naturalness, quality)

        report = ValidationReport(
            seo_metrics=seo_metrics,
            geo_metrics=geo_metrics,
            snippet_analysis=snippet_analysis,
            naturalness_analysis=naturalness,
            content_quality=quality,
            overall_score=overall_score,
            strengths=strengths,
            improvements_needed=improvements,
            editor_notes=self._generate_editor_notes(overall_score)
        )

        self.logger.info(f"Validation complete. Overall={overall_score:.2f} SEO={seo_metrics.seo_optimization_percentage:.1f} GEO={geo_metrics.geo_score:.1f}")
        return report
    
    def _clean_markdown(self, content: str) -> str:
        """Remove markdown formatting for text analysis"""
        # Remove code blocks
        text = re.sub(r'```[\s\S]*?```', '', content)
        # Remove inline code
        text = re.sub(r'`[^`]+`', '', text)
        # Remove links but keep text
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        # Remove images
        text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', '', text)
        # Remove headers markers
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
        # Remove bold/italic
        text = re.sub(r'[*_]{1,2}([^*_]+)[*_]{1,2}', r'\1', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    async def _calculate_seo_metrics(
        self, 
        content: str, 
        clean_text: str, 
        keyword_cluster: KeywordCluster
    ) -> SEOMetrics:
        """Calculate SEO optimization metrics"""
        
        # Keyword density analysis
        keyword_density = self._calculate_keyword_density(clean_text, keyword_cluster)
        
        # Check density compliance (1-3% for primary, 0.5-2% for secondary)
        primary_density = keyword_density.get(keyword_cluster.primary, 0)
        density_compliant = 1.0 <= primary_density <= 3.0
        
        # Title optimization
        title_score = self._score_title(content, keyword_cluster)
        
        # Meta description (if present)
        meta_score = self._score_meta_description(content, keyword_cluster)
        
        # Heading structure
        heading_score = self._score_heading_structure(content, keyword_cluster)
        
        # Internal linking
        internal_link_score = self._score_internal_links(content)
        
        # Readability
        readability_score = self._calculate_readability(clean_text)
        
        # Overall SEO percentage
        seo_percentage = (
            title_score * 0.20 +
            meta_score * 0.15 +
            heading_score * 0.20 +
            internal_link_score * 0.15 +
            readability_score * 0.15 +
            (100 if density_compliant else 50) * 0.15
        )
        
        return SEOMetrics(
            seo_optimization_percentage=round(seo_percentage, 2),
            keyword_density=keyword_density,
            keyword_density_compliance=density_compliant,
            title_optimization_score=title_score,
            meta_description_score=meta_score,
            heading_structure_score=heading_score,
            internal_linking_score=internal_link_score,
            readability_score=readability_score
        )
    
    def _calculate_keyword_density(self, text: str, cluster: KeywordCluster) -> Dict[str, float]:
        """Calculate keyword density percentages"""
        text_lower = text.lower()
        words = text_lower.split()
        total_words = len(words)
        
        if total_words == 0:
            return {}
        
        density = {}
        
        # Primary keyword
        primary_count = text_lower.count(cluster.primary.lower())
        density[cluster.primary] = round((primary_count / total_words) * 100, 2)
        
        # Secondary keywords
        for keyword in cluster.secondary[:5]:
            count = text_lower.count(keyword.lower())
            density[keyword] = round((count / total_words) * 100, 2)
        
        return density
    
    def _score_title(self, content: str, cluster: KeywordCluster) -> float:
        """Score title optimization"""
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if not title_match:
            return 0.0
        
        title = title_match.group(1).lower()
        score = 0.0
        
        # Primary keyword in title
        if cluster.primary.lower() in title:
            score += 50.0
        
        # Title length (50-60 chars optimal)
        title_len = len(title)
        if 50 <= title_len <= 60:
            score += 30.0
        elif 40 <= title_len <= 70:
            score += 20.0
        else:
            score += 10.0
        
        # Power words
        power_words = ['best', 'guide', 'complete', 'ultimate', 'essential', 'proven']
        if any(word in title for word in power_words):
            score += 20.0
        
        return min(100.0, score)
    
    def _score_meta_description(self, content: str, cluster: KeywordCluster) -> float:
        """Score meta description if present"""
        # Look for meta description in content
        meta_match = re.search(r'meta[_\s]description[:\s]+(.+)', content, re.IGNORECASE)
        if not meta_match:
            return 70.0  # Neutral score if not found
        
        meta = meta_match.group(1).lower()
        score = 0.0
        
        # Primary keyword present
        if cluster.primary.lower() in meta:
            score += 50.0
        
        # Length check (150-160 chars optimal)
        meta_len = len(meta)
        if 150 <= meta_len <= 160:
            score += 50.0
        elif 140 <= meta_len <= 170:
            score += 30.0
        else:
            score += 10.0
        
        return score
    
    def _score_heading_structure(self, content: str, cluster: KeywordCluster) -> float:
        """Score heading structure and keyword usage"""
        headings = re.findall(r'^#{2,6}\s+(.+)$', content, re.MULTILINE)
        
        if not headings:
            return 0.0
        
        score = 0.0
        
        # Number of headings (5-10 optimal)
        h_count = len(headings)
        if 5 <= h_count <= 10:
            score += 40.0
        elif 3 <= h_count <= 15:
            score += 25.0
        else:
            score += 10.0
        
        # Keywords in headings
        headings_text = ' '.join(headings).lower()
        if cluster.primary.lower() in headings_text:
            score += 30.0
        
        # Secondary keywords in headings
        secondary_in_headings = sum(
            1 for kw in cluster.secondary[:5] 
            if kw.lower() in headings_text
        )
        score += min(30.0, secondary_in_headings * 10)
        
        return min(100.0, score)
    
    def _score_internal_links(self, content: str) -> float:
        """Score internal linking"""
        # Count markdown links
        links = re.findall(r'\[([^\]]+)\]\(([^\)]+)\)', content)
        internal_links = [l for l in links if not l[1].startswith('http')]
        
        link_count = len(internal_links)
        
        if link_count >= 5:
            return 100.0
        elif link_count >= 3:
            return 75.0
        elif link_count >= 1:
            return 50.0
        else:
            return 25.0
    
    def _calculate_readability(self, text: str) -> float:
        """Calculate readability score (simplified Flesch-Kincaid)"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return 0.0
        
        words = text.split()
        total_words = len(words)
        total_sentences = len(sentences)
        
        if total_sentences == 0:
            return 0.0
        
        # Average sentence length (15-20 words optimal)
        avg_sentence_length = total_words / total_sentences
        
        if 15 <= avg_sentence_length <= 20:
            score = 100.0
        elif 10 <= avg_sentence_length <= 25:
            score = 80.0
        else:
            score = 60.0
        
        return score
    
    async def _analyze_snippet_readiness(
        self, 
        content: str, 
        cluster: KeywordCluster
    ) -> SnippetAnalysis:
        """Analyze featured snippet optimization"""
        
        # Find question-answer patterns
        qa_pairs = len(re.findall(r'^#{2,3}\s+(?:What|How|Why|When|Where|Who)', content, re.MULTILINE | re.IGNORECASE))
        
        # Count lists
        list_usage = len(re.findall(r'^\s*[-*]\s+', content, re.MULTILINE))
        
        # Count tables
        table_usage = len(re.findall(r'\|.*\|', content))
        
        # Identify snippet-optimized sections
        snippet_sections = re.findall(
            r'^#{2,3}\s+((?:What|How|Why|When|Where|Who).+)$', 
            content, 
            re.MULTILINE | re.IGNORECASE
        )
        
        # Calculate probability
        probability = 0.0
        if qa_pairs > 0:
            probability += 30.0
        if list_usage >= 3:
            probability += 25.0
        if table_usage > 0:
            probability += 20.0
        if len(snippet_sections) >= 3:
            probability += 25.0
        
        return SnippetAnalysis(
            snippet_readiness_probability=min(100.0, probability),
            snippet_optimized_sections=snippet_sections[:10],
            question_answer_pairs=qa_pairs,
            list_format_usage=list_usage,
            table_usage=table_usage
        )
    
    async def _analyze_naturalness(self, text: str) -> NaturalnessAnalysis:
        """Analyze content naturalness and AI detection probability"""
        
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return NaturalnessAnalysis(
                naturalness_score=0.0,
                ai_detection_probability=100.0,
                sentence_variety_score=0.0,
                vocabulary_richness=0.0,
                transition_quality=0.0
            )
        
        # Sentence variety (length variation)
        sentence_lengths = [len(s.split()) for s in sentences]
        avg_length = sum(sentence_lengths) / len(sentence_lengths)
        length_variance = sum((l - avg_length) ** 2 for l in sentence_lengths) / len(sentence_lengths)
        sentence_variety = min(100.0, (length_variance / avg_length) * 20)
        
        # Vocabulary richness (unique words ratio)
        words = text.lower().split()
        unique_ratio = len(set(words)) / len(words) if words else 0
        vocab_richness = unique_ratio * 100
        
        # Transition quality (presence of transition words)
        transitions = ['however', 'moreover', 'furthermore', 'additionally', 'consequently', 
                      'therefore', 'meanwhile', 'nevertheless', 'nonetheless', 'thus']
        transition_count = sum(1 for t in transitions if t in text.lower())
        transition_quality = min(100.0, transition_count * 15)
        
        # Human-like patterns
        patterns = []
        if any(word in text.lower() for word in ['i think', 'in my experience', 'personally']):
            patterns.append("First-person perspective")
        if re.search(r'[!]{1,2}(?![!])', text):
            patterns.append("Natural exclamations")
        if re.search(r'\?', text):
            patterns.append("Rhetorical questions")
        if transition_count > 3:
            patterns.append("Smooth transitions")
        
        # Calculate naturalness score
        naturalness = (sentence_variety * 0.3 + vocab_richness * 0.4 + transition_quality * 0.3)
        
        # AI detection probability (inverse of naturalness)
        ai_detection = 100 - naturalness
        
        return NaturalnessAnalysis(
            naturalness_score=round(naturalness, 2),
            ai_detection_probability=round(ai_detection, 2),
            sentence_variety_score=round(sentence_variety, 2),
            vocabulary_richness=round(vocab_richness, 2),
            transition_quality=round(transition_quality, 2),
            human_like_patterns=patterns
        )
    
    async def _analyze_content_quality(self, text: str, target_word_count: int) -> ContentQuality:
        """Analyze overall content quality"""
        
        words = text.split()
        word_count = len(words)
        
        # Unique value score (based on depth indicators)
        depth_indicators = ['example', 'specifically', 'research shows', 'study', 'data', 
                          'according to', 'expert', 'case study', 'statistics']
        depth_count = sum(1 for indicator in depth_indicators if indicator in text.lower())
        unique_value = min(100.0, depth_count * 12)
        
        # Depth score (word count vs target)
        word_count_ratio = word_count / target_word_count if target_word_count > 0 else 0
        if 0.9 <= word_count_ratio <= 1.2:
            depth_score = 100.0
        elif 0.7 <= word_count_ratio <= 1.4:
            depth_score = 80.0
        else:
            depth_score = 60.0
        
        # Actionability (presence of action words)
        action_words = ['step', 'how to', 'guide', 'implement', 'create', 'build', 
                       'start', 'follow', 'use', 'apply']
        action_count = sum(1 for word in action_words if word in text.lower())
        actionability = min(100.0, action_count * 15)
        
        # Engagement potential
        engagement_indicators = ['?', '!', 'you', 'your', 'tip:', 'note:', 'important:']
        engagement_count = sum(text.count(indicator) for indicator in engagement_indicators)
        engagement = min(100.0, engagement_count * 8)
        
        return ContentQuality(
            word_count=word_count,
            unique_value_score=round(unique_value, 2),
            depth_score=round(depth_score, 2),
            actionability_score=round(actionability, 2),
            engagement_potential=round(engagement, 2)
        )
    
    def _calculate_overall_score(
        self,
        seo: SEOMetrics,
        geo,
        snippet: SnippetAnalysis,
        naturalness: NaturalnessAnalysis,
        quality: ContentQuality
    ) -> float:
        """Weighted overall score — SEO + GEO + content quality signals"""
        return round(
            seo.seo_optimization_percentage * 0.25 +
            geo.geo_score                   * 0.25 +
            snippet.snippet_readiness_probability * 0.15 +
            naturalness.naturalness_score   * 0.20 +
            quality.depth_score             * 0.10 +
            quality.actionability_score     * 0.05,
            2
        )

    def _generate_insights(
        self,
        seo: SEOMetrics,
        geo,
        snippet: SnippetAnalysis,
        naturalness: NaturalnessAnalysis,
        quality: ContentQuality
    ) -> Tuple[List[str], List[str]]:
        """Generate strengths and improvement suggestions"""
        
        strengths = []
        improvements = []

        # SEO
        if seo.seo_optimization_percentage >= 80:
            strengths.append("Excellent SEO optimization")
        elif seo.seo_optimization_percentage < 60:
            improvements.append("Improve keyword placement and density")

        if seo.keyword_density_compliance:
            strengths.append("Optimal keyword density")
        else:
            improvements.append("Adjust keyword density to 1-3% range")

        # GEO
        strengths.extend(geo.geo_strengths)
        improvements.extend(geo.geo_improvements)

        # Snippet readiness
        if snippet.snippet_readiness_probability >= 70:
            strengths.append("High featured snippet potential")
        else:
            improvements.append("Add more Q&A sections and structured lists")

        # Naturalness
        if naturalness.naturalness_score >= 75:
            strengths.append("Natural, human-like writing style")
        elif naturalness.naturalness_score < 60:
            improvements.append("Increase sentence variety and vocabulary richness")

        # Quality
        if quality.actionability_score >= 70:
            strengths.append("Highly actionable content")
        else:
            improvements.append("Add more practical steps and implementation guidance")

        if quality.engagement_potential >= 70:
            strengths.append("Strong engagement potential")

        return strengths, improvements
    
    def _generate_editor_notes(self, overall_score: float) -> str:
        """Generate editor notes based on overall score"""
        
        if overall_score >= 90:
            return "Exceptional content quality. Ready for publication with minimal edits."
        elif overall_score >= 80:
            return "Strong content with good SEO optimization. Minor improvements recommended."
        elif overall_score >= 70:
            return "Good foundation. Address improvement areas for better performance."
        elif overall_score >= 60:
            return "Acceptable quality. Significant improvements needed for optimal ranking."
        else:
            return "Content requires substantial revision. Focus on SEO, naturalness, and depth."
