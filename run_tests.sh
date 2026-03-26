#!/bin/bash

# RankForge Quick Test Runner
# This script runs all essential tests for the hackathon demo

set -e  # Exit on error

echo "=================================="
echo "RankForge Test Suite"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running${NC}"
    echo ""
    echo "Please start the server first:"
    echo "  uvicorn app.main:app --reload"
    exit 1
fi

echo ""

# Test 1: Health Check
echo "=================================="
echo "Test 1: Health Check"
echo "=================================="
HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/v1/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

echo ""

# Test 2: Keyword Analysis
echo "=================================="
echo "Test 2: Keyword Analysis"
echo "=================================="
echo "Testing with keyword: 'AI blog automation'"
echo "This should take ~20-30 seconds..."
echo ""

KEYWORD_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/analyze-keywords" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_keyword": "AI blog automation",
    "target_location": "India",
    "content_type": "guide"
  }')

if echo "$KEYWORD_RESPONSE" | grep -q "keyword_cluster"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo ""
    echo "Key Results:"
    echo "$KEYWORD_RESPONSE" | jq -r '
        "  Primary Keyword: \(.keyword_cluster.primary)",
        "  Search Intent: \(.keyword_cluster.search_intent)",
        "  Difficulty Score: \(.keyword_cluster.difficulty_score)",
        "  Secondary Keywords: \(.keyword_cluster.secondary | length) found",
        "  Estimated Monthly Searches: \(.traffic_projection.estimated_monthly_searches)",
        "  Projected Traffic: \(.traffic_projection.projected_monthly_traffic)/month",
        "  Missing Topics: \(.serp_gap.missing_topics | length) identified"
    '
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $KEYWORD_RESPONSE"
    exit 1
fi

echo ""

# Test 3: Quick Blog Generation (Optional - takes 2-3 minutes)
echo "=================================="
echo "Test 3: Full Blog Generation"
echo "=================================="
echo -e "${YELLOW}⚠ This test takes 2-3 minutes${NC}"
read -p "Run full blog generation test? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Generating blog for: 'Python basics tutorial'"
    echo "Please wait..."
    echo ""
    
    START_TIME=$(date +%s)
    
    BLOG_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/generate" \
      -H "Content-Type: application/json" \
      -d '{
        "keyword_input": {
          "primary_keyword": "Python basics tutorial",
          "target_location": "Global",
          "content_type": "tutorial"
        },
        "tone": "conversational",
        "include_faq": true
      }')
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    if echo "$BLOG_RESPONSE" | grep -q "blog_content"; then
        echo -e "${GREEN}✓ PASSED${NC} (took ${DURATION}s)"
        echo ""
        
        # Save outputs
        echo "$BLOG_RESPONSE" | jq -r '.blog_content' > test_blog.md
        echo "$BLOG_RESPONSE" | jq '.' > test_report.json
        
        echo "Scoring Report:"
        echo "$BLOG_RESPONSE" | jq -r '
            "  Overall Score: \(.metadata.overall_score)/100",
            "  SEO Optimization: \(.metadata.seo_metrics.seo_optimization_percentage)%",
            "  Snippet Readiness: \(.metadata.snippet_analysis.snippet_readiness_probability)%",
            "  Naturalness Score: \(.metadata.naturalness_analysis.naturalness_score)%",
            "  AI Detection Risk: \(.metadata.naturalness_analysis.ai_detection_probability)%",
            "  Word Count: \(.metadata.content_quality.word_count)",
            "  Keyword Density OK: \(.metadata.seo_metrics.keyword_density_compliance)"
        '
        
        echo ""
        echo "Files saved:"
        echo "  - test_blog.md (blog content)"
        echo "  - test_report.json (full report)"
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $BLOG_RESPONSE"
        exit 1
    fi
else
    echo "Skipping full generation test"
fi

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Your RankForge instance is working correctly."
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:8000/docs for API documentation"
echo "  2. Review TESTING_GUIDE.md for detailed testing instructions"
echo "  3. Run 'python examples/test_api.py' for more comprehensive tests"
echo "  4. Check HACKATHON_DEMO.md for demo presentation script"
echo ""
