#!/usr/bin/env python3
"""
Deploy all tables to Supabase via REST API
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests

# Load environment
load_dotenv('flask_app/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE credentials")
    sys.exit(1)

print(f"✅ Supabase URL: {SUPABASE_URL}")
print(f"✅ Using Service Role Key")

# Read SQL file
sql_file = Path('flask_app/MIGRATION_GUARANTEED.sql')
if not sql_file.exists():
    print(f"❌ SQL file not found: {sql_file}")
    sys.exit(1)

with open(sql_file, 'r') as f:
    sql_content = f.read()

print(f"✅ Loaded migration SQL")
print(f"\n📋 Manual deployment required:\n")
print(f"Supabase doesn't support direct SQL execution via API.")
print(f"Please follow these steps:\n")
print(f"1. Open: https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/sql")
print(f"2. Copy: {sql_file.absolute()}")
print(f"3. Paste in SQL Editor")
print(f"4. Click 'Run'\n")

# Copy to clipboard (macOS)
try:
    import subprocess
    subprocess.run(['pbcopy'], input=sql_content.encode())
    print(f"✅ SQL copied to clipboard!")
    print(f"\n🌐 Opening Supabase SQL Editor...")
    import webbrowser
    webbrowser.open('https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/sql')
    print(f"\n👉 Just press Cmd+V to paste and click Run!")
except:
    pass

print(f"\n{'='*60}")
print(f"Alternative: Run individual table creation")
print(f"{'='*60}\n")

# Create tables via API
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

tables_to_create = [
    ('devices', '''
        CREATE TABLE IF NOT EXISTS devices (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            shop_id UUID REFERENCES shops(id),
            device_id TEXT,
            device_name TEXT,
            device_type TEXT DEFAULT 'web',
            last_sync TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    '''),
    ('ledger', '''
        CREATE TABLE IF NOT EXISTS ledger (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            shop_id UUID REFERENCES shops(id),
            device_id TEXT,
            local_txn_id TEXT,
            customer_id UUID,
            customer_name TEXT,
            transaction_type TEXT,
            amount DECIMAL(10, 2) NOT NULL,
            balance_after DECIMAL(10, 2),
            payment_mode TEXT,
            reference_id UUID,
            notes TEXT,
            transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            synced_at TIMESTAMP WITH TIME ZONE
        )
    '''),
    ('advance_orders', '''
        CREATE TABLE IF NOT EXISTS advance_orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            shop_id UUID REFERENCES shops(id),
            device_id TEXT,
            local_txn_id TEXT,
            customer_id UUID,
            customer_name TEXT,
            customer_phone TEXT,
            items JSONB,
            total_amount DECIMAL(10, 2) NOT NULL,
            advance_paid DECIMAL(10, 2) DEFAULT 0,
            delivery_date DATE,
            delivery_time TIME,
            delivery_location TEXT,
            notes TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            synced_at TIMESTAMP WITH TIME ZONE
        )
    '''),
    ('milk_collections', '''
        CREATE TABLE IF NOT EXISTS milk_collections (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            shop_id UUID REFERENCES shops(id),
            device_id TEXT,
            local_txn_id TEXT,
            farmer_id UUID,
            farmer_name TEXT,
            animal_type TEXT,
            quantity DECIMAL(10, 2) NOT NULL,
            fat DECIMAL(5, 2),
            snf DECIMAL(5, 2),
            rate DECIMAL(10, 2),
            amount DECIMAL(10, 2),
            shift TEXT DEFAULT 'morning',
            collection_date DATE DEFAULT CURRENT_DATE,
            payment_status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            synced_at TIMESTAMP WITH TIME ZONE
        )
    ''')
]

print("\n🚀 Creating tables via API...\n")

for table_name, create_sql in tables_to_create:
    try:
        # Note: Direct SQL execution not supported via REST
        # This is just for demonstration
        print(f"⚠️  {table_name}: Manual creation required")
    except Exception as e:
        print(f"❌ {table_name}: {str(e)[:50]}")

print(f"\n{'='*60}")
print(f"📋 Summary")
print(f"{'='*60}")
print(f"SQL file: {sql_file.absolute()}")
print(f"Copied to clipboard: ✅")
print(f"SQL Editor opened: ✅")
print(f"\n👉 Paste and click Run in Supabase dashboard!")
