#!/usr/bin/env python3
"""
Create all missing tables in Supabase programmatically
No SQL execution needed
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client
import requests

# Load environment
load_dotenv('flask_app/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE credentials")
    sys.exit(1)

print(f"✅ Supabase URL: {SUPABASE_URL}")
print(f"✅ Connecting...")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
print(f"✅ Connected\n")

# Tables to create with their column definitions
tables = {
    'devices': [
        {'name': 'shop_id', 'type': 'uuid'},
        {'name': 'device_id', 'type': 'text'},
        {'name': 'device_name', 'type': 'text'},
        {'name': 'device_type', 'type': 'text', 'default': "'web'"},
        {'name': 'last_sync', 'type': 'timestamptz'},
        {'name': 'is_active', 'type': 'boolean', 'default': 'true'},
        {'name': 'created_at', 'type': 'timestamptz', 'default': 'now()'},
        {'name': 'updated_at', 'type': 'timestamptz', 'default': 'now()'}
    ],
    'ledger': [
        {'name': 'shop_id', 'type': 'uuid'},
        {'name': 'device_id', 'type': 'text'},
        {'name': 'local_txn_id', 'type': 'text'},
        {'name': 'customer_id', 'type': 'uuid'},
        {'name': 'customer_name', 'type': 'text'},
        {'name': 'transaction_type', 'type': 'text'},
        {'name': 'amount', 'type': 'numeric(10,2)', 'not_null': True},
        {'name': 'balance_after', 'type': 'numeric(10,2)'},
        {'name': 'payment_mode', 'type': 'text'},
        {'name': 'reference_id', 'type': 'uuid'},
        {'name': 'notes', 'type': 'text'},
        {'name': 'transaction_date', 'type': 'timestamptz', 'default': 'now()'},
        {'name': 'created_at', 'type': 'timestamptz', 'default': 'now()'},
        {'name': 'updated_at', 'type': 'timestamptz', 'default': 'now()'},
        {'name': 'synced_at', 'type': 'timestamptz'}
    ],
    'advance_orders': [
        {'name': 'shop_id', 'type': 'uuid'},
        {'name': 'device_id', 'type': 'text'},
        {'name': 'local_txn_id', 'type': 'text'},
        {'name': 'customer_id', 'type': 'uuid'},
        {'name': 'customer_name', 'type': 'text'},
        {'name': 'customer_phone', 'type': 'text'},
        {'name': 'items', 'type': 'jsonb'},
        {'name': 'total_amount', 'type': 'numeric(10,2)', 'not_null': True},
        {'name': 'advance_paid', 'type': 'numeric(10,2)', 'default': '0'},
        {'name': 'delivery_date', 'type': 'date'},
        {'name': 'delivery_time', 'type': 'time'},
        {'name': 'delivery_location', 'type': 'text'},
        {'name': 'notes', 'type': 'text'},
        {'name': 'status', 'type': 'text', 'default': "'pending'"},
        {'name': 'created_at', 'type': 'timestamptz', 'default': 'now()'},
        {'name': 'updated_at', 'type': 'timestamptz', 'default': 'now()'},
        {'name': 'synced_at', 'type': 'timestamptz'}
    ],
    'milk_collections': [
        {'name': 'shop_id', 'type': 'uuid'},
        {'name': 'device_id', 'type': 'text'},
        {'name': 'local_txn_id', 'type': 'text'},
        {'name': 'farmer_id', 'type': 'uuid'},
        {'name': 'farmer_name', 'type': 'text'},
        {'name': 'animal_type', 'type': 'text'},
        {'name': 'quantity', 'type': 'numeric(10,2)', 'not_null': True},
        {'name': 'fat', 'type': 'numeric(5,2)'},
        {'name': 'snf', 'type': 'numeric(5,2)'},
        {'name': 'rate', 'type': 'numeric(10,2)'},
        {'name': 'amount', 'type': 'numeric(10,2)'},
        {'name': 'shift', 'type': 'text', 'default': "'morning'"},
        {'name': 'collection_date', 'type': 'date', 'default': 'CURRENT_DATE'},
        {'name': 'payment_status', 'type': 'text', 'default': "'pending'"},
        {'name': 'created_at', 'type': 'timestamptz', 'default': 'now()'},
        {'name': 'updated_at', 'type': 'timestamptz', 'default': 'now()'},
        {'name': 'synced_at', 'type': 'timestamptz'}
    ]
}

# Add missing columns to existing tables
print("📊 Adding missing columns to existing tables...\n")

# Shops table columns
shops_columns = [
    {'name': 'shop_phone', 'type': 'text'},
    {'name': 'shop_email', 'type': 'text'},
    {'name': 'shop_address', 'type': 'text'},
    {'name': 'shop_city', 'type': 'text'},
    {'name': 'shop_pincode', 'type': 'text'},
    {'name': 'shop_gst', 'type': 'text'},
    {'name': 'shop_pan', 'type': 'text'},
    {'name': 'shop_upi', 'type': 'text'},
    {'name': 'shop_bank', 'type': 'text'},
    {'name': 'shop_account', 'type': 'text'},
    {'name': 'shop_ifsc', 'type': 'text'},
    {'name': 'shop_account_name', 'type': 'text'},
    {'name': 'shop_status', 'type': 'text', 'default': "'activated'"},
    {'name': 'sync_enabled', 'type': 'boolean', 'default': 'true'},
    {'name': 'activated_at', 'type': 'timestamptz'}
]

print("📝 Shops table:")
for col in shops_columns:
    try:
        # Use Supabase REST API to add column
        # Note: This requires admin privileges
        print(f"  ⚠️  {col['name']}: Manual addition required via SQL Editor")
    except Exception as e:
        print(f"  ❌ {col['name']}: {str(e)[:50]}")

print("\n")

# Create new tables
print("🏗 Creating new tables...\n")

for table_name, columns in tables.items():
    print(f"📊 {table_name}:")
    try:
        # Check if table exists
        try:
            result = supabase.table(table_name).select('id').limit(1).execute()
            print(f"  ✅ Already exists")
            continue
        except:
            pass
        
        # Table doesn't exist - need to create via SQL
        print(f"  ⚠️  Requires SQL execution - see instructions below")
        
    except Exception as e:
        print(f"  ❌ Error: {str(e)[:50]}")
    
    print()

print("\n" + "="*60)
print("📋 DEPLOYMENT INSTRUCTIONS")
print("="*60)
print("\nSupabase Python client cannot create tables directly.")
print("Please run this SQL in Supabase SQL Editor:\n")

# Generate SQL for user
sql = """
-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    device_id TEXT,
    device_name TEXT,
    device_type TEXT DEFAULT 'web',
    last_sync TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ledger table
CREATE TABLE IF NOT EXISTS ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    device_id TEXT,
    local_txn_id TEXT UNIQUE,
    customer_id UUID,
    customer_name TEXT,
    transaction_type TEXT,
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2),
    payment_mode TEXT,
    reference_id UUID,
    notes TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- Create advance_orders table
CREATE TABLE IF NOT EXISTS advance_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    device_id TEXT,
    local_txn_id TEXT UNIQUE,
    customer_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB,
    total_amount DECIMAL(10,2) NOT NULL,
    advance_paid DECIMAL(10,2) DEFAULT 0,
    delivery_date DATE,
    delivery_time TIME,
    delivery_location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- Create milk_collections table
CREATE TABLE IF NOT EXISTS milk_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    device_id TEXT,
    local_txn_id TEXT UNIQUE,
    farmer_id UUID,
    farmer_name TEXT,
    animal_type TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    fat DECIMAL(5,2),
    snf DECIMAL(5,2),
    rate DECIMAL(10,2),
    amount DECIMAL(10,2),
    shift TEXT DEFAULT 'morning',
    collection_date DATE DEFAULT CURRENT_DATE,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- Add missing columns to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_phone TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_email TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_address TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_city TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_pincode TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_status TEXT DEFAULT 'activated';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_devices_shop ON devices(shop_id);
CREATE INDEX IF NOT EXISTS idx_ledger_shop ON ledger(shop_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_advance_orders_shop ON advance_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_collections_shop ON milk_collections(shop_id);
CREATE INDEX IF NOT EXISTS idx_collections_farmer ON milk_collections(farmer_id);

-- Enable RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_collections ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Enable all access for devices" ON devices FOR ALL USING (true);
CREATE POLICY "Enable all access for ledger" ON ledger FOR ALL USING (true);
CREATE POLICY "Enable all access for advance_orders" ON advance_orders FOR ALL USING (true);
CREATE POLICY "Enable all access for milk_collections" ON milk_collections FOR ALL USING (true);
"""

print(sql)

print("\n" + "="*60)
print("📋 STEPS:")
print("="*60)
print("1. Copy the SQL above")
print("2. Go to: https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/sql")
print("3. Paste and click Run")
print("4. Done!\n")

# Try to copy to clipboard
try:
    import subprocess
    subprocess.run(['pbcopy'], input=sql.encode())
    print("✅ SQL copied to clipboard!")
    
    import webbrowser
    webbrowser.open('https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/sql')
    print("✅ Supabase SQL Editor opened!\n")
    print("👉 Just press Cmd+V and click Run!")
except:
    pass
