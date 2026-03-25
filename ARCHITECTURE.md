# RankForge Architecture Documentation

## System Overview

RankForge is a production-grade, multi-agent AI blog generation engine designed for scalability, maintainability, and SEO excellence. The system follows a three-phase pipeline architecture with strict separation of concerns.

## Architecture Principles

1. **Modularity**: Each component is independent and replaceable
2. **Type Safety**: Full Pydantic validation throughout
3. **Async-First**: Leverages asyncio for performance
4. **Error Resilience**: Comprehensive error handling and fallbacks
5. **Observability**: Structured logging at every layer

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FastAPI Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Middleware  │  │   Schemas    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Orchestration Layer                        │
│                  ┌──────────────────┐                        │
│                  │ RankForgePipeline│                        │
│                  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   PHASE 1    │   │   PHASE 2    │   │   PHASE 3    │
│   Strategy   │──▶│  Generation  │──▶│  Validation  │
│    Engine    │   │    Agents    │   │    Engine    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Keyword    │   │  Researcher  │   │    Editor    │
│   Engine     │   │    Agent     │   │    Agent     │
│              │   │      +       │   │      +       │
│              │   │   Writer     │   │     SEO      │
│              │   │    Agent     │   │  Validator   │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Phase 1: Intent & Strategy Engine

### Purpose
Analyze keywords and identify content opportunities before generation begins.

### Components

#### KeywordEngine
- **Location**: `app/engines/keyword_engine.py`
- **Responsibilities**:
  - Keyword clustering (primary, secondary, long-tail)
  - Search intent determination
  - Difficulty scoring
  - Related question generation

#### SERP Analyzer
- **Integrated in**: KeywordEngine
- **Responsibilities**:
  - Identify missing topics in current SERP
  - Find underserved questions
  - Detect competitor weaknesses
  - Calculate recommended word count

#### Traffic Projector
- **Integrated in**: KeywordEngine
- **Responsibilities**:
  - Estimate monthly search volume
  - Calculate ranking probability
  - Project potential traffic
  - Determine competition level

### Data Flow

```
KeywordInput
    │
    ▼
┌─────────────────┐
│ Keyword Engine  │
├─────────────────┤
│ 1. Clustering   │
│ 2. SERP Gap     │
│ 3. Traffic Proj │
└─────────────────┘
    │
    ▼
StrategyBrief
```

### Output Schema

```python
StrategyBrief:
  - keyword_cluster: KeywordCluster
  - serp_gap: SERPGap
  - traffic_projection: TrafficProjection
  - target_location: str
  - content_angle: str
  - structural_requirements: Dict
  - internal_linking_opportunities: List[str]
```

## Phase 2: Multi-Agent Generation Core

### Purpose
Transform strategy into high-quality, SEO-optimized content through specialized agents.

### Agent Architecture

```
BaseAgent (Abstract)
    │
    ├── ResearcherAgent
    ├── WriterAgent
    └── EditorAgent
```

#### BaseAgent
- **Location**: `app/agents/base.py`
- **Provides**:
  - LLM initialization
  - Prompt invocation
  - Error handling
  - Logging infrastructure

#### ResearcherAgent
- **Location**: `app/agents/researcher.py`
- **Model**: GPT-4 Turbo (configurable)
- **Temperature**: 0.7
- **Responsibilities**:
  - Create hierarchical content outline
  - Identify snippet opportunities
  - Distribute keywords across sections
  - Plan internal linking strategy
  - Define section word counts

**System Prompt Strategy**:
- Expert SEO content strategist persona
- Structured JSON output format
- Emphasis on snippet optimization
- Hierarchical thinking (H2, H3, H4)

**Output**: ContentOutline with nested OutlineSection objects

#### WriterAgent
- **Location**: `app/agents/writer.py`
- **Model**: GPT-4 Turbo (configurable)
- **Temperature**: 0.7
- **Responsibilities**:
  - Generate complete Markdown content
  - Optimize for featured snippets
  - Ensure natural language flow
  - Implement internal linking
  - Maintain keyword density

**System Prompt Strategy**:
- Expert SEO content writer persona
- Naturalness guidelines (varied sentences, transitions)
- Snippet optimization techniques
- Markdown formatting rules
- Keyword usage best practices

**Output**: BlogDraft with Markdown content

### Agent Communication

```
StrategyBrief
    │
    ▼
┌──────────────────┐
│ ResearcherAgent  │
│  (Outline)       │
└──────────────────┘
    │
    ▼
ContentOutline
    │
    ▼
┌──────────────────┐
│  WriterAgent     │
│  (Content)       │
└──────────────────┘
    │
    ▼
BlogDraft
```

## Phase 3: Automated SEO Validator

### Purpose
Validate content quality and generate comprehensive scoring reports.

### Components

#### EditorAgent
- **Location**: `app/agents/editor.py`
- **Model**: GPT-4 Turbo (configurable)
- **Temperature**: 0.3 (lower for consistency)
- **Responsibilities**:
  - Coordinate validation process
  - Perform qualitative review
  - Generate editorial insights
  - Enhance automated reports

#### SEOValidator
- **Location**: `app/engines/seo_validator.py`
- **Type**: Deterministic analyzer
- **Responsibilities**:
  - Calculate SEO metrics
  - Analyze snippet readiness
  - Evaluate naturalness
  - Assess content quality

### Validation Metrics

#### SEO Metrics
- SEO optimization percentage (weighted composite)
- Keyword density analysis
- Title optimization score
- Meta description score
- Heading structure score
- Internal linking score
- Readability score

#### Snippet Analysis
- Snippet readiness probability
- Question-answer pair count
- List format usage
- Table usage
- Snippet-optimized sections

#### Naturalness Analysis
- Naturalness score (inverse of AI detection)
- Sentence variety score
- Vocabulary richness
- Transition quality
- Human-like patterns

#### Content Quality
- Word count vs target
- Unique value score
- Depth score
- Actionability score
- Engagement potential

### Scoring Algorithm

```python
overall_score = (
    seo_optimization * 0.30 +
    snippet_readiness * 0.20 +
    naturalness_score * 0.25 +
    depth_score * 0.15 +
    actionability_score * 0.10
)
```

## Data Flow Architecture

### Complete Pipeline Flow

```
1. API Request
   └─▶ GenerationRequest (Pydantic validation)

2. Phase 1: Strategy
   └─▶ KeywordInput
       └─▶ KeywordEngine.analyze_keywords()
           └─▶ StrategyBrief

3. Phase 2: Generation
   └─▶ StrategyBrief
       └─▶ ResearcherAgent.execute()
           └─▶ ContentOutline
               └─▶ WriterAgent.execute()
                   └─▶ BlogDraft

4. Phase 3: Validation
   └─▶ BlogDraft + StrategyBrief
       └─▶ EditorAgent.execute()
           └─▶ SEOValidator.validate_content()
               └─▶ ValidationReport

5. Final Output
   └─▶ FinalOutput (blog + metadata)
       └─▶ API Response
```

## Error Handling Strategy

### Exception Hierarchy

```
RankForgeException (Base)
    │
    ├── KeywordEngineError
    ├── AgentExecutionError
    ├── ValidationError
    ├── PipelineError
    └── APIError
```

### Error Recovery

1. **Graceful Degradation**: Fallback outlines if JSON parsing fails
2. **Retry Logic**: Configurable retries for LLM calls
3. **Detailed Logging**: Full error context for debugging
4. **User-Friendly Messages**: Clean error responses via FastAPI

## Performance Considerations

### Async Architecture
- All I/O operations are async
- Concurrent LLM calls where possible
- Non-blocking pipeline execution

### Caching Strategy
- Strategy briefs can be cached by keyword
- Outlines can be reused for similar topics
- Configurable TTL via settings

### Resource Management
- Configurable worker count
- Request timeout controls
- Memory-efficient streaming where applicable

## Security Architecture

### Input Validation
- Pydantic models for all inputs
- Field validators for critical data
- Length limits on all text fields

### API Key Management
- Environment variable configuration
- No keys in code or logs
- Support for key rotation

### Rate Limiting
- Per-minute and per-hour limits
- Configurable thresholds
- IP-based tracking (future)

## Extensibility Points

### Adding New Agents
1. Inherit from `BaseAgent`
2. Implement `execute()` method
3. Define input/output schemas
4. Integrate into pipeline

### Custom Validators
1. Create validator class
2. Implement validation methods
3. Return structured metrics
4. Integrate into EditorAgent

### Alternative LLM Providers
1. Implement provider adapter
2. Update BaseAgent initialization
3. Configure via settings
4. Test with existing prompts

## Testing Strategy

### Unit Tests
- Individual component testing
- Mock external dependencies
- Schema validation tests

### Integration Tests
- Full pipeline execution
- Agent communication
- Error handling paths

### Load Tests
- Concurrent request handling
- Memory usage under load
- Response time benchmarks

## Monitoring and Observability

### Logging Levels
- **INFO**: Pipeline progress, agent activities
- **WARNING**: Fallback usage, parsing issues
- **ERROR**: Failures, exceptions

### Key Metrics
- Request latency by phase
- LLM token usage
- Success/failure rates
- Score distributions

### Health Checks
- API availability
- LLM connectivity
- Resource utilization

## Deployment Architecture

### Containerization
- Docker for consistent environments
- Multi-stage builds for optimization
- Health check integration

### Orchestration
- Docker Compose for local/dev
- Kubernetes for production scale
- Auto-scaling based on load

### CI/CD Pipeline
1. Code commit
2. Automated tests
3. Docker build
4. Push to registry
5. Deploy to environment
6. Health check verification

## Future Enhancements

### Planned Features
1. **Caching Layer**: Redis for strategy briefs
2. **Queue System**: Celery for async processing
3. **Multi-Language**: Support for non-English content
4. **Image Generation**: AI-generated featured images
5. **A/B Testing**: Multiple content variations
6. **Analytics Integration**: Track content performance

### Scalability Roadmap
1. **Horizontal Scaling**: Load balancer + multiple instances
2. **Database Layer**: Store generated content
3. **API Gateway**: Authentication and rate limiting
4. **CDN Integration**: Fast content delivery
5. **Microservices**: Split into specialized services
