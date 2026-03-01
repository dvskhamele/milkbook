#!/usr/bin/env python3
"""
Deploy Migration to Supabase Directly
Uses Supabase Python client with service role key
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE')  # Use service role for admin operations

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE not found in .env")
    print("Please check your .env file")
    sys.exit(1)

print(f"✅ Supabase URL: {SUPABASE_URL}")
print(f"✅ Using Service Role Key")

try:
    from supabase import create_client
except ImportError:
    print("❌ Installing supabase package...")
    os.system('pip install supabase')
    from supabase import create_client

# Create Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Failed to connect: {e}")
    sys.exit(1)

# Read migration SQL
migration_file = Path(__file__).parent / 'MIGRATION_GUARANTEED.sql'
if not migration_file.exists():
    print(f"❌ Error: Migration file not found: {migration_file}")
    sys.exit(1)

with open(migration_file, 'r') as f:
    migration_sql = f.read()

print(f"✅ Loaded migration SQL ({len(migration_sql)} bytes)")

# Split into individual statements
statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]

print(f"\n📊 Found {len(statements)} SQL statements")
print(f"\n🚀 Executing migration...\n")

success = 0
errors = 0

for i, stmt in enumerate(statements, 1):
    if stmt.startswith('--'):
        continue
    
    try:
        # Try to execute via Supabase RPC
        # Note: This requires a custom RPC function in Supabase
        # For now, we'll just print what would be executed
        print(f"⚠️  [{i}/{len(statements)}] SQL execution via API not supported")
        print(f"   Please run MIGRATION_GUARANTEED.sql manually in Supabase SQL Editor")
        break
        
    except Exception as e:
        errors += 1
        print(f"❌ [{i}/{len(statements)}] {str(e)[:100]}")

print(f"\n{'='*60}")
print(f"⚠️  Direct SQL execution via API is not supported by Supabase")
print(f"{'='*60}")
print(f"\n📋 Please follow these steps:")
print(f"1. Open: https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/sql")
print(f"2. Copy: {migration_file.absolute()}")
print(f"3. Paste in SQL Editor")
print(f"4. Click 'Run'")
print(f"\n📁 File location: {migration_file.absolute()}")
print(f"\nOr copy from GitHub:")
print(f"https://github.com/dvskhamele/milkbook/blob/main/flask_app/MIGRATION_GUARANTEED.sql")
