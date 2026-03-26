#!/usr/bin/env python3
"""Quick test script to verify RankForge is working"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=10)
        print(f" Health check: {response.status_code}")
        print(f"  Response: {response.json()}")
        return True
    except Exception as e:
        print(f" Health check failed: {e}")
        return False

def test_keyword_analysis():
    """Test keyword analysis"""
    print("\nTesting keyword analysis...")
    payload = {
        "primary_keyword": "AI blog automation",
        "target_location": "India",
        "content_type": "guide"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/analyze-keywords",
            json=payload,
            timeout=60
        )
        print(f" Keyword analysis: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Primary keyword: {data['keyword_cluster']['primary']}")
            print(f"  Secondary keywords: {len(data['keyword_cluster']['secondary'])}")
            print(f"  Estimated searches: {data['traffic_projection']['estimated_monthly_searches']}")
        return True
    except Exception as e:
        print(f" Keyword analysis failed: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("RankForge Quick Test")
    print("="*60)
    
    # Test 1: Health
    if not test_health():
        print("\n Server is not responding. Make sure it's running:")
        print("   uvicorn app.main:app --reload")
        exit(1)
    
    # Test 2: Keyword Analysis
    test_keyword_analysis()
    
    print("\n" + "="*60)
    print(" Basic tests complete!")
    print("="*60)
