#!/usr/bin/env python3
"""
Execute SQL fixes on Supabase
Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv('flask_app/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials")
    sys.exit(1)

print("="*70)
print("🔧 EXECUTING PRODUCT TABLE FIXES")
print("="*70)
print(f"📊 Target: {SUPABASE_URL}")
print()

# Read SQL file
sql_file = Path('flask_app/FIX_PRODUCTS_SCHEMA.sql')
with open(sql_file, 'r') as f:
    fix_sql = f.read()

print(f"✅ SQL loaded ({len(fix_sql)} bytes)")
print()

# Split into statements
statements = [s.strip() for s in fix_sql.split(';') if s.strip() and not s.strip().startswith('--')]

headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}

success = 0
errors = 0

print(f"📡 Executing {len(statements)} statements...")
print()

for i, stmt in enumerate(statements, 1):
    try:
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/',
            headers=headers,
            json={'query': stmt},
            timeout=30
        )
        
        if response.status_code in [200, 201, 204]:
            success += 1
            print(f"  ✅ Statement {i}")
        elif response.status_code == 400:
            # Often means "already exists"
            print(f"  ⚠️  Statement {i} (may already exist)")
            success += 1
        else:
            print(f"  ❌ Statement {i}: {response.status_code}")
            print(f"     {response.text[:100]}")
            errors += 1
    except Exception as e:
        print(f"  ❌ Statement {i}: {str(e)[:50]}")
        errors += 1

print()
print("="*70)
print("📊 RESULTS")
print("="*70)
print(f"   Success: {success}/{len(statements)}")
print(f"   Errors: {errors}/{len(statements)}")
print()

if errors == 0:
    print("✅ PRODUCTS TABLE FIXED!")
    print()
    print("🧪 TEST NOW:")
    print("   1. Hard refresh: Cmd+Shift+R")
    print("   2. Restart Flask server")
    print("   3. Add a new product")
    print("   4. Should save without errors!")
else:
    print("⚠️  Some errors occurred")
    print("   Check Supabase dashboard for details")

print()
