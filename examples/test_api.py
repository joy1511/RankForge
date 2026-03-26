"""Example script to test RankForge API"""

import asyncio
import httpx
import json
from datetime import datetime


async def test_health_check():
    """Test health check endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/api/v1/health")
        print("Health Check:", response.json())


async def test_keyword_analysis():
    """Test keyword analysis endpoint"""
    payload = {
        "primary_keyword": "Python web scraping tutorial",
        "target_location": "United States",
        "content_type": "tutorial"
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("\n" + "="*80)
        print("Testing Keyword Analysis Endpoint")
        print("="*80)
        
        response = await client.post(
            "http://localhost:8000/api/v1/analyze-keywords",
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n Keyword Analysis Successful")
            print(f"\nPrimary Keyword: {result['keyword_cluster']['primary']}")
            print(f"Search Intent: {result['keyword_cluster']['search_intent']}")
            print(f"Difficulty Score: {result['keyword_cluster']['difficulty_score']}")
            print(f"\nSecondary Keywords ({len(result['keyword_cluster']['secondary'])}):")
            for kw in result['keyword_cluster']['secondary'][:5]:
                print(f"  - {kw}")
            
            print(f"\nTraffic Projection:")
            print(f"  - Monthly Searches: {result['traffic_projection']['estimated_monthly_searches']}")
            print(f"  - Ranking Probability: {result['traffic_projection']['ranking_probability']}%")
            print(f"  - Projected Traffic: {result['traffic_projection']['projected_monthly_traffic']}/month")
            
            print(f"\nSERP Gap - Missing Topics ({len(result['serp_gap']['missing_topics'])}):")
            for topic in result['serp_gap']['missing_topics'][:3]:
                print(f"  - {topic}")
        else:
            print(f" Error: {response.status_code}")
            print(response.text)


async def test_full_generation():
    """Test full blog generation endpoint"""
    payload = {
        "keyword_input": {
            "primary_keyword": "machine learning for beginners",
            "target_location": "Global",
            "secondary_keywords": [
                "ML basics",
                "machine learning tutorial",
                "AI fundamentals"
            ],
            "content_type": "guide"
        },
        "tone": "professional",
        "include_faq": True
    }
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        print("\n" + "="*80)
        print("Testing Full Blog Generation Endpoint")
        print("="*80)
        print("\nThis may take 2-3 minutes...")
        
        start_time = datetime.now()
        
        response = await client.post(
            "http://localhost:8000/api/v1/generate",
            json=payload
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n Blog Generation Successful (took {duration:.1f}s)")
            
            # Display metadata
            metadata = result['metadata']
            print("\n" + "="*80)
            print("SCORING REPORT")
            print("="*80)
            print(f"\nOverall Score: {metadata['overall_score']}/100")
            print(f"\nDetailed Metrics:")
            print(f"  ├─ SEO Optimization: {metadata['seo_metrics']['seo_optimization_percentage']}%")
            print(f"  ├─ Snippet Readiness: {metadata['snippet_analysis']['snippet_readiness_probability']}%")
            print(f"  ├─ Naturalness Score: {metadata['naturalness_analysis']['naturalness_score']}%")
            print(f"  ├─ AI Detection Risk: {metadata['naturalness_analysis']['ai_detection_probability']}%")
            print(f"  ├─ Keyword Density Compliant: {metadata['seo_metrics']['keyword_density_compliance']}")
            print(f"  └─ Content Depth: {metadata['content_quality']['depth_score']}%")
            
            print(f"\nContent Stats:")
            print(f"  - Word Count: {metadata['content_quality']['word_count']}")
            print(f"  - Q&A Pairs: {metadata['snippet_analysis']['question_answer_pairs']}")
            print(f"  - List Usage: {metadata['snippet_analysis']['list_format_usage']}")
            
            print(f"\nStrengths ({len(metadata['strengths'])}):")
            for strength in metadata['strengths'][:3]:
                print(f"  • {strength}")
            
            if metadata['improvements_needed']:
                print(f"\nImprovements Needed ({len(metadata['improvements_needed'])}):")
                for improvement in metadata['improvements_needed'][:3]:
                    print(f"  • {improvement}")
            
            # Save blog content
            with open("generated_blog.md", "w", encoding="utf-8") as f:
                f.write(result['blog_content'])
            print(f"\n Blog content saved to: generated_blog.md")
            
            # Save full report
            with open("generation_report.json", "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
            print(f" Full report saved to: generation_report.json")
            
        else:
            print(f" Error: {response.status_code}")
            print(response.text)


async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("RANKFORGE API TEST SUITE")
    print("="*80)
    
    try:
        # Test 1: Health check
        await test_health_check()
        
        # Test 2: Keyword analysis
        await test_keyword_analysis()
        
        # Test 3: Full generation (commented out by default due to time)
        # Uncomment to test full generation
        # await test_full_generation()
        
        print("\n" + "="*80)
        print("ALL TESTS COMPLETED")
        print("="*80)
        
    except Exception as e:
        print(f"\n Test failed with error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())
