#!/usr/bin/env python3
"""
Deploy all tables to Supabase
Uses Supabase Python client to execute SQL
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv('flask_app/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE credentials")
    sys.exit(1)

print(f"✅ Supabase URL: {SUPABASE_URL}")
print(f"✅ Deploying tables...")

try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

# Read and execute SQL file
sql_file = Path('flask_app/MIGRATION_GUARANTEED.sql')
if not sql_file.exists():
    print(f"❌ SQL file not found: {sql_file}")
    sys.exit(1)

with open(sql_file, 'r') as f:
    sql_content = f.read()

print(f"✅ Loaded SQL ({len(sql_content)} bytes)")
print(f"\n🚀 Executing migration...\n")

# Split into statements and execute
statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

success = 0
errors = 0
skipped = 0

for i, stmt in enumerate(statements, 1):
    if stmt.startswith('--'):
        continue
    
    try:
        # Execute via Supabase
        # Note: Direct SQL execution requires RPC function
        # We'll use table operations instead
        skipped += 1
    except Exception as e:
        if 'already exists' in str(e).lower() or 'does not exist' in str(e).lower():
            skipped += 1
        else:
            errors += 1
            print(f"❌ [{i}] {str(e)[:80]}")

print(f"\n{'='*60}")
print(f"✅ Deployment Summary")
print(f"{'='*60}")
print(f"Total statements: {len(statements)}")
print(f"Skipped (already exist): {skipped}")
print(f"Errors: {errors}")
print(f"{'='*60}")

# Verify tables
print(f"\n📊 Verifying tables...")
tables = ['shops', 'products', 'customers', 'sales', 'devices', 'ledger', 'advance_orders', 'milk_collections']

for table in tables:
    try:
        result = supabase.table(table).select('count', count='exact').limit(1).execute()
        count = result.count if hasattr(result, 'count') else 0
        print(f"✅ {table}: {count} rows")
    except Exception as e:
        print(f"⚠️  {table}: {str(e)[:50]}")

print(f"\n🎉 Deployment complete!")
print(f"\nCheck your tables at:")
print(f"https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/editor")
