# RankForge Quick Start Guide

Get RankForge up and running in 5 minutes.

## Prerequisites

- Python 3.11 or higher
- OpenAI API key
- 4GB RAM minimum
- Internet connection

## Installation

### Step 1: Clone or Download

```bash
cd rankforge
```

### Step 2: Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Running the Application

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Verify Installation

Open your browser and navigate to:

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health

## Your First Blog Generation

### Option 1: Using the Interactive API Docs

1. Go to http://localhost:8000/docs
2. Click on `POST /api/v1/generate`
3. Click "Try it out"
4. Use this example request:

```json
{
  "keyword_input": {
    "primary_keyword": "Python automation tutorial",
    "target_location": "United States",
    "content_type": "tutorial"
  },
  "tone": "professional",
  "include_faq": true
}
```

5. Click "Execute"
6. Wait 2-3 minutes for generation
7. View the complete blog and metrics in the response

### Option 2: Using cURL

```bash
curl -X POST "http://localhost:8000/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword_input": {
      "primary_keyword": "Python automation tutorial",
      "target_location": "United States",
      "content_type": "tutorial"
    },
    "tone": "professional",
    "include_faq": true
  }' | jq > output.json
```

### Option 3: Using Python

```bash
python examples/test_api.py
```

## Understanding the Output

The API returns a `FinalOutput` object with:

### 1. Blog Content
Complete Markdown-formatted blog post ready for publication.

### 2. Metadata - SEO Metrics
- **SEO Optimization Percentage**: Overall SEO score (0-100)
- **Keyword Density**: Percentage for each keyword
- **Title Optimization Score**: How well the title is optimized
- **Heading Structure Score**: Quality of H2/H3 hierarchy
- **Internal Linking Score**: Internal link quality
- **Readability Score**: Content readability

### 3. Metadata - Snippet Analysis
- **Snippet Readiness Probability**: Chance of featured snippet (0-100)
- **Question-Answer Pairs**: Count of Q&A sections
- **List Format Usage**: Number of lists
- **Snippet-Optimized Sections**: Sections likely to rank

### 4. Metadata - Naturalness Analysis
- **Naturalness Score**: How human-like the content is (0-100)
- **AI Detection Probability**: Risk of AI detection (0-100)
- **Sentence Variety Score**: Sentence structure diversity
- **Vocabulary Richness**: Unique word ratio

### 5. Metadata - Content Quality
- **Word Count**: Total words
- **Depth Score**: Content comprehensiveness
- **Actionability Score**: Practical value
- **Engagement Potential**: Reader engagement likelihood

### 6. Overall Score
Weighted composite score (0-100) combining all metrics.

## Example Output Structure

```json
{
  "blog_content": "# Your SEO-Optimized Title\n\n...",
  "metadata": {
    "overall_score": 87.5,
    "seo_metrics": {
      "seo_optimization_percentage": 92.3,
      "keyword_density_compliance": true,
      ...
    },
    "snippet_analysis": {
      "snippet_readiness_probability": 85.0,
      ...
    },
    "naturalness_analysis": {
      "naturalness_score": 78.5,
      "ai_detection_probability": 21.5,
      ...
    },
    "content_quality": {
      "word_count": 2150,
      "depth_score": 88.0,
      ...
    },
    "strengths": [
      "Excellent SEO optimization",
      "High featured snippet potential",
      ...
    ],
    "improvements_needed": [
      "Add more practical examples",
      ...
    ]
  },
  "strategy_brief": {
    "primary_keyword": "python automation tutorial",
    "estimated_monthly_searches": 2000,
    "projected_monthly_traffic": 300,
    ...
  },
  "generation_timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

## Testing Individual Phases

### Phase 1: Keyword Analysis Only

```bash
curl -X POST "http://localhost:8000/api/v1/analyze-keywords" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_keyword": "machine learning basics",
    "target_location": "Global",
    "content_type": "guide"
  }'
```

This returns:
- Keyword clusters
- SERP gap analysis
- Traffic projections
- Content strategy

## Common Use Cases

### 1. Blog Post Generation
```json
{
  "keyword_input": {
    "primary_keyword": "how to learn Python",
    "target_location": "United States",
    "content_type": "guide"
  },
  "tone": "conversational"
}
```

### 2. Technical Tutorial
```json
{
  "keyword_input": {
    "primary_keyword": "Docker container tutorial",
    "target_location": "Global",
    "content_type": "tutorial"
  },
  "tone": "technical"
}
```

### 3. Product Comparison
```json
{
  "keyword_input": {
    "primary_keyword": "best project management tools",
    "target_location": "United States",
    "secondary_keywords": ["Asana vs Trello", "project software"],
    "content_type": "article"
  },
  "tone": "professional"
}
```

### 4. Local SEO Content
```json
{
  "keyword_input": {
    "primary_keyword": "digital marketing services",
    "target_location": "Mumbai, India",
    "content_type": "blog"
  },
  "tone": "professional"
}
```

## Performance Tips

1. **First Request**: May take 2-3 minutes (LLM processing)
2. **Concurrent Requests**: Limit to 2-3 simultaneous generations
3. **Timeout**: Set client timeout to at least 300 seconds
4. **Caching**: Enable caching in production for repeated keywords

## Troubleshooting

### Issue: "Connection refused"
**Solution**: Ensure the server is running on port 8000

### Issue: "OpenAI API key not found"
**Solution**: Check your `.env` file has `OPENAI_API_KEY` set

### Issue: "Request timeout"
**Solution**: Increase client timeout to 300+ seconds

### Issue: "Rate limit exceeded"
**Solution**: Wait a moment and retry, or upgrade OpenAI plan

### Issue: "Low quality scores"
**Solution**: Try different keywords or adjust tone parameter

## Next Steps

1. **Read Architecture**: See `ARCHITECTURE.md` for system design
2. **Deploy to Production**: See `DEPLOYMENT.md` for deployment guide
3. **Run Tests**: Execute `pytest tests/` to verify installation
4. **Customize Prompts**: Modify agent prompts in `app/agents/`
5. **Add Features**: Extend the pipeline with custom validators

## API Endpoints Reference

| Endpoint | Method | Purpose | Time |
|----------|--------|---------|------|
| `/api/v1/health` | GET | Health check | <1s |
| `/api/v1/analyze-keywords` | POST | Keyword analysis only | 10-20s |
| `/api/v1/generate` | POST | Full blog generation | 2-3min |
| `/docs` | GET | Interactive API docs | <1s |

## Configuration Options

Edit `app/config.py` or `.env` to customize:

- **Models**: Change GPT-4 to GPT-3.5 for faster/cheaper generation
- **Temperature**: Adjust creativity (0.0-1.0)
- **Max Tokens**: Control response length
- **Workers**: Adjust concurrent processing
- **Timeout**: Change request timeout limits

## Support and Resources

- **API Documentation**: http://localhost:8000/docs
- **Architecture Guide**: `ARCHITECTURE.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Example Scripts**: `examples/` directory

## Production Checklist

Before deploying to production:

- [ ] Set `ENVIRONMENT=production` in `.env`
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Use secrets manager for API keys
- [ ] Set up SSL/TLS certificates
- [ ] Configure auto-scaling
- [ ] Set up backup and recovery
- [ ] Test with production load
- [ ] Document custom configurations

---

**Congratulations!** You're now ready to generate production-grade, SEO-optimized blog content with RankForge.
