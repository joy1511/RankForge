#!/bin/bash

# RankForge API Examples using cURL

BASE_URL="http://localhost:8000"

echo "================================"
echo "RankForge API Examples"
echo "================================"

# 1. Health Check
echo -e "\n1. Health Check"
curl -X GET "${BASE_URL}/api/v1/health" \
  -H "Content-Type: application/json" | jq

# 2. Keyword Analysis
echo -e "\n2. Keyword Analysis"
curl -X POST "${BASE_URL}/api/v1/analyze-keywords" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_keyword": "AI content generation",
    "target_location": "United States",
    "content_type": "blog"
  }' | jq

# 3. Full Blog Generation
echo -e "\n3. Full Blog Generation (this will take 2-3 minutes)"
curl -X POST "${BASE_URL}/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword_input": {
      "primary_keyword": "Python automation scripts",
      "target_location": "Global",
      "secondary_keywords": ["automation tools", "Python scripting"],
      "content_type": "tutorial"
    },
    "tone": "professional",
    "include_faq": true
  }' | jq > output.json

echo -e "\n✓ Output saved to output.json"
