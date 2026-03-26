"""
GEO (Generative Engine Optimization) Validator

Measures how likely AI systems (ChatGPT, Perplexity, Gemini, etc.) are to
cite or surface this content when answering user queries.

Six signal categories — each grounded in published GEO research:

1. Direct Answer Score      — concise answers immediately after question headings
2. Citation Structure Score — numbered lists, definition blocks, comparison tables
3. E-E-A-T Score           — Experience, Expertise, Authoritativeness, Trustworthiness signals
4. Entity Clarity Score     — named entities, specific facts, proper nouns, numbers
5. Query Match Score        — how well content mirrors natural language questions
6. Authority Score          — depth, original framing, sourced claims

Overall GEO = weighted average of the six signals.
"""

import re
from typing import List, Tuple
from app.schemas.validation import GEOMetrics
from app.schemas.keyword import KeywordCluster
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class GEOValidator:
    """Scores content for Generative Engine Optimization"""

    # ── Signal 1: Direct Answer ──────────────────────────────────────────────
    # AI systems strongly prefer content that answers a question in the first
    # 40-60 words after a question heading (paragraph 0 of that section).

    _QUESTION_HEADING = re.compile(
        r'^#{2,3}\s+((?:what|how|why|when|where|who|which|can|does|is|are|will|should).+)',
        re.IGNORECASE | re.MULTILINE
    )

    def _score_direct_answers(self, content: str) -> float:
        question_headings = self._QUESTION_HEADING.findall(content)
        if not question_headings:
            return 0.0

        # Split content into sections by heading
        sections = re.split(r'\n#{2,6}\s+', content)
        answered = 0

        for section in sections[1:]:  # skip preamble
            lines = [l.strip() for l in section.split('\n') if l.strip()]
            if not lines:
                continue
            # First non-heading line is the "answer paragraph"
            first_para = ' '.join(lines[:3])
            words = first_para.split()
            # Good direct answer: 20-80 words, doesn't start with a list marker
            if 20 <= len(words) <= 80 and not first_para.startswith(('-', '*', '1.')):
                answered += 1

        ratio = answered / max(len(question_headings), 1)
        # Bonus for having many question headings (more citation opportunities)
        heading_bonus = min(20.0, len(question_headings) * 4)
        return min(100.0, round(ratio * 80 + heading_bonus, 2))

    # ── Signal 2: Citation Structure ────────────────────────────────────────
    # Numbered lists, definition-style blocks, and comparison tables are the
    # formats AI systems most frequently extract and cite verbatim.

    def _score_citation_structure(self, content: str) -> float:
        score = 0.0

        # Numbered lists (step-by-step = highly citable)
        numbered = len(re.findall(r'^\s*\d+\.\s+\S', content, re.MULTILINE))
        score += min(30.0, numbered * 3)

        # Bullet lists
        bullets = len(re.findall(r'^\s*[-*]\s+\S', content, re.MULTILINE))
        score += min(20.0, bullets * 1.5)

        # Tables (comparison tables = very citable)
        table_rows = len(re.findall(r'^\|.+\|', content, re.MULTILINE))
        score += min(20.0, table_rows * 2)

        # Definition-style patterns: "X is a Y that Z" or "X: definition"
        definitions = len(re.findall(
            r'(?:^|\n)(?:\*\*)?[A-Z][^.]{2,40}(?:\*\*)?\s*(?:is|are|refers to|means|defined as)\s+',
            content, re.MULTILINE
        ))
        score += min(15.0, definitions * 5)

        # Code blocks (technical content — highly citable for how-to queries)
        code_blocks = len(re.findall(r'```[\s\S]*?```', content))
        score += min(15.0, code_blocks * 5)

        return min(100.0, round(score, 2))

    # ── Signal 3: E-E-A-T ───────────────────────────────────────────────────
    # Google's E-E-A-T framework is also used by AI systems to assess
    # trustworthiness. Signals: statistics, expert references, sourced claims,
    # first-hand experience language, recency markers.

    _STAT_PATTERN = re.compile(
        r'\b\d+(?:\.\d+)?(?:\s*%|\s*percent|\s*million|\s*billion|\s*thousand)\b',
        re.IGNORECASE
    )
    _AUTHORITY_PHRASES = [
        'according to', 'research shows', 'studies show', 'study found',
        'experts say', 'data shows', 'survey found', 'report shows',
        'published in', 'university', 'institute', 'journal', 'findings',
        'evidence suggests', 'analysis shows', 'researchers found'
    ]
    _EXPERIENCE_PHRASES = [
        'in practice', 'in our experience', 'we found', 'when we tested',
        'real-world', 'case study', 'example:', 'for instance', 'for example',
        'in this case', 'specifically', 'to illustrate'
    ]

    def _score_eeat(self, text: str) -> float:
        score = 0.0
        text_lower = text.lower()

        # Statistics and numbers (trustworthiness signal)
        stats = len(self._STAT_PATTERN.findall(text))
        score += min(30.0, stats * 4)

        # Authority phrases
        authority_hits = sum(1 for p in self._AUTHORITY_PHRASES if p in text_lower)
        score += min(35.0, authority_hits * 5)

        # Experience / first-hand signals
        experience_hits = sum(1 for p in self._EXPERIENCE_PHRASES if p in text_lower)
        score += min(25.0, experience_hits * 5)

        # Year/recency markers (AI systems prefer recent content)
        years = len(re.findall(r'\b20(?:2[0-9]|3[0-9])\b', text))
        score += min(10.0, years * 3)

        return min(100.0, round(score, 2))

    # ── Signal 4: Entity Clarity ─────────────────────────────────────────────
    # AI systems build knowledge graphs from named entities. Content with
    # clear, specific entities (people, places, products, organisations,
    # technologies) is more likely to be cited as a factual source.

    def _score_entity_clarity(self, text: str) -> float:
        score = 0.0

        # Capitalised proper nouns (rough NER without spaCy)
        proper_nouns = re.findall(r'\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*\b', text)
        unique_entities = len(set(proper_nouns))
        score += min(30.0, unique_entities * 1.5)

        # Specific version numbers / product names (e.g. "Python 3.11", "GPT-4")
        versions = len(re.findall(r'\b[A-Za-z]+\s*\d+(?:\.\d+)*\b', text))
        score += min(20.0, versions * 4)

        # URLs / domain references (external authority)
        urls = len(re.findall(r'https?://\S+|www\.\S+|\b\w+\.(?:com|org|io|gov|edu)\b', text))
        score += min(20.0, urls * 5)

        # Specific numbers / measurements (concrete facts)
        specifics = len(re.findall(r'\b\d{1,4}(?:\.\d+)?\s*(?:ms|kb|mb|gb|px|km|kg|lb|hrs?|mins?|secs?|days?|weeks?|months?|years?)\b', text, re.IGNORECASE))
        score += min(15.0, specifics * 5)

        # Quoted text (direct quotes = high citation value)
        quotes = len(re.findall(r'"[^"]{10,150}"', text))
        score += min(15.0, quotes * 8)

        return min(100.0, round(score, 2))

    # ── Signal 5: Query Match ────────────────────────────────────────────────
    # AI systems retrieve content that semantically matches the user's natural
    # language query. Content that mirrors question phrasing and uses
    # conversational language scores higher.

    def _score_query_match(self, content: str, cluster: KeywordCluster) -> float:
        score = 0.0
        content_lower = content.lower()

        # Primary keyword appears in first 200 chars (intro paragraph)
        intro = content_lower[:200]
        if cluster.primary.lower() in intro:
            score += 25.0

        # Related questions appear as headings (direct query mirroring)
        question_headings = self._QUESTION_HEADING.findall(content)
        heading_text = ' '.join(question_headings).lower()

        matched_questions = sum(
            1 for q in cluster.related_questions
            if any(word in heading_text for word in q.lower().split() if len(word) > 3)
        )
        score += min(30.0, matched_questions * 6)

        # Long-tail keywords present (matches specific queries)
        lt_matches = sum(1 for lt in cluster.long_tail if lt.lower() in content_lower)
        score += min(25.0, lt_matches * 3)

        # Conversational phrases (matches how people ask AI questions)
        conversational = [
            "you can", "you should", "you need to", "you'll want to",
            "here's how", "here are", "the best way", "one of the",
            "it's important", "keep in mind", "worth noting"
        ]
        conv_hits = sum(1 for p in conversational if p in content_lower)
        score += min(20.0, conv_hits * 3)

        return min(100.0, round(score, 2))

    # ── Signal 6: Authority / Depth ──────────────────────────────────────────
    # AI systems prefer comprehensive, authoritative content over thin pages.
    # Signals: word count relative to topic complexity, unique framing,
    # FAQ sections, conclusion with synthesis.

    def _score_authority(self, content: str, clean_text: str) -> float:
        score = 0.0
        words = clean_text.split()
        word_count = len(words)

        # Word count depth (more comprehensive = more authoritative)
        if word_count >= 2000:
            score += 25.0
        elif word_count >= 1500:
            score += 20.0
        elif word_count >= 1000:
            score += 12.0
        else:
            score += 5.0

        # FAQ section present (directly answers common queries)
        if re.search(r'##\s*(?:FAQ|Frequently Asked|Common Questions)', content, re.IGNORECASE):
            score += 20.0

        # Conclusion / summary section (synthesis = authority signal)
        if re.search(r'##\s*(?:Conclusion|Summary|Final Thoughts|Takeaway)', content, re.IGNORECASE):
            score += 15.0

        # Heading hierarchy depth (H2 → H3 → H4 = structured expertise)
        h2 = len(re.findall(r'^##\s+', content, re.MULTILINE))
        h3 = len(re.findall(r'^###\s+', content, re.MULTILINE))
        if h2 >= 5 and h3 >= 3:
            score += 20.0
        elif h2 >= 3:
            score += 10.0

        # Unique vocabulary ratio (avoids repetitive/thin content)
        if words:
            unique_ratio = len(set(w.lower() for w in words)) / len(words)
            score += min(20.0, unique_ratio * 30)

        return min(100.0, round(score, 2))

    # ── Main entry point ─────────────────────────────────────────────────────

    async def calculate_geo_score(
        self,
        content: str,
        clean_text: str,
        cluster: KeywordCluster
    ) -> GEOMetrics:
        """
        Calculate the full GEO score for a piece of content.

        Weights (sum = 1.0):
          Direct Answer      0.25  — most important: AI needs a citable answer
          Citation Structure 0.20  — format determines extractability
          E-E-A-T            0.20  — trust signals
          Entity Clarity     0.15  — factual grounding
          Query Match        0.10  — semantic relevance
          Authority          0.10  — depth and comprehensiveness
        """
        direct_answer   = self._score_direct_answers(content)
        citation_struct = self._score_citation_structure(content)
        eeat            = self._score_eeat(clean_text)
        entity_clarity  = self._score_entity_clarity(content)
        query_match     = self._score_query_match(content, cluster)
        authority       = self._score_authority(content, clean_text)

        geo_score = round(
            direct_answer   * 0.25 +
            citation_struct * 0.20 +
            eeat            * 0.20 +
            entity_clarity  * 0.15 +
            query_match     * 0.10 +
            authority       * 0.10,
            2
        )

        strengths, improvements = self._generate_geo_insights(
            direct_answer, citation_struct, eeat, entity_clarity, query_match, authority
        )

        logger.info(f"GEO score: {geo_score} | DA={direct_answer} CS={citation_struct} "
                    f"EEAT={eeat} EC={entity_clarity} QM={query_match} AU={authority}")

        return GEOMetrics(
            geo_score=geo_score,
            direct_answer_score=direct_answer,
            citation_structure_score=citation_struct,
            eeat_score=eeat,
            entity_clarity_score=entity_clarity,
            query_match_score=query_match,
            authority_score=authority,
            geo_strengths=strengths,
            geo_improvements=improvements,
        )

    def _generate_geo_insights(
        self,
        direct: float, citation: float, eeat: float,
        entity: float, query: float, authority: float
    ) -> Tuple[List[str], List[str]]:
        strengths, improvements = [], []

        if direct >= 70:
            strengths.append("Strong direct answers — high AI citation potential")
        elif direct < 40:
            improvements.append("Add concise 40-60 word answers immediately after question headings")

        if citation >= 70:
            strengths.append("Well-structured for AI extraction (lists, tables, definitions)")
        elif citation < 40:
            improvements.append("Add numbered lists, comparison tables, or definition blocks")

        if eeat >= 60:
            strengths.append("Good E-E-A-T signals — statistics and authority phrases present")
        elif eeat < 30:
            improvements.append("Include statistics, research citations, and expert references")

        if entity >= 60:
            strengths.append("Clear entity references — factually grounded content")
        elif entity < 30:
            improvements.append("Add specific named entities, version numbers, and concrete facts")

        if query >= 60:
            strengths.append("Content mirrors natural language queries effectively")
        elif query < 30:
            improvements.append("Use question-style headings that match how users ask AI systems")

        if authority >= 60:
            strengths.append("Comprehensive depth — authoritative coverage of the topic")
        elif authority < 30:
            improvements.append("Add FAQ section, conclusion, and increase content depth")

        return strengths, improvements
