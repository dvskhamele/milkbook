#!/usr/bin/env python3
"""
Test all API endpoints before deployment
Run this after starting the Flask server
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_endpoint(method, endpoint, data=None, expected_status=200):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=data)
        
        status = "✅" if response.status_code == expected_status else "❌"
        print(f"{status} {method} {endpoint} → {response.status_code}")
        
        if response.status_code == expected_status:
            if 'json' in response.headers.get('Content-Type', ''):
                result = response.json()
                if 'success' in result:
                    print(f"   Success: {result.get('success')}")
                if 'products' in result:
                    print(f"   Products: {len(result['products'])}")
                if 'customers' in result:
                    print(f"   Customers: {len(result['customers'])}")
                if 'sales' in result:
                    print(f"   Sales: {len(result['sales'])}")
        else:
            print(f"   Error: {response.text[:200]}")
        
        return response.status_code == expected_status
    except Exception as e:
        print(f"❌ {method} {endpoint} → ERROR: {e}")
        return False

def main():
    print("🧪 Testing MilkRecord API Endpoints\n")
    print(f"Base URL: {BASE_URL}\n")
    
    tests = [
        # Health check
        ('GET', '/api/health', None, 200),
        
        # User info
        ('GET', '/api/user', None, 200),
        
        # Products
        ('GET', '/api/products', None, 200),
        
        # Customers
        ('GET', '/api/customers', None, 200),
        
        # Sales
        ('GET', '/api/sales', None, 200),
        
        # Farmers
        ('GET', '/api/farmers', None, 200),
        
        # Test POST endpoints
        ('POST', '/api/products', {
            'name': 'Test Product',
            'price': 100.0,
            'category': 'test',
            'unit': 'unit',
            'emoji': '📦'
        }, 200),
        
        ('POST', '/api/customers', {
            'name': 'Test Customer',
            'phone': '9876543210'
        }, 200),
        
        ('POST', '/api/sales', {
            'customer_name': 'Test Customer',
            'items': [],
            'total_amount': 100.0,
            'paid_amount': 100.0,
            'payment_mode': 'cash'
        }, 200),
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        if test_endpoint(*test):
            passed += 1
        else:
            failed += 1
        print()
    
    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)
    
    if failed == 0:
        print("\n✅ All API endpoints working!")
        print("\n🚀 Ready to deploy to Vercel:")
        print("   cd flask_app")
        print("   vercel --prod")
    else:
        print("\n❌ Some endpoints failed. Check the errors above.")
        print("   Make sure Flask server is running:")
        print("   python vercel_app.py")

if __name__ == '__main__':
    main()
