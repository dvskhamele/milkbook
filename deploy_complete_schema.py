#!/usr/bin/env python3
"""
COMPLETE END-TO-END SUPABASE DEPLOYMENT
No simplifications - Full enterprise schema
Creates all tables, columns, indexes, RLS policies programmatically
"""

import os
import sys
import json
import requests
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv('flask_app/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing SUPABASE credentials in .env")
    sys.exit(1)

# Extract project ref
PROJECT_REF = SUPABASE_URL.split('//')[1].split('.')[0]

print(f"{'='*70}")
print(f"🚀 COMPLETE END-TO-END SUPABASE DEPLOYMENT")
print(f"{'='*70}")
print(f"✅ Project: {PROJECT_REF}")
print(f"✅ URL: {SUPABASE_URL}")
print(f"✅ Using Service Role Key")
print()

# ============================================
# STEP 1: CONNECT TO SUPABASE
# ============================================

print("📡 Step 1: Connecting to Supabase...")
try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Connected to Supabase\n")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

# ============================================
# STEP 2: EXECUTE SQL VIA MANAGEMENT API
# ============================================

print("🔧 Step 2: Deploying Schema via Management API...")

# Supabase Management API endpoint
MGMT_URL = f"https://api.supabase.com/api/v1/sql/{PROJECT_REF}"

MGMT_HEADERS = {
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'tx=commit'
}

# Complete SQL schema - NO SIMPLIFICATIONS
COMPLETE_SQL = """
-- ============================================
-- COMPLETE ENTERPRISE SCHEMA
-- All tables, columns, indexes, RLS policies
-- ============================================

-- Drop existing tables if they exist (for clean deployment)
DROP TABLE IF EXISTS ledger CASCADE;
DROP TABLE IF EXISTS advance_orders CASCADE;
DROP TABLE IF EXISTS milk_collections CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;

-- ============================================
-- 1. SHOPS TABLE (Complete)
-- ============================================
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    shop_phone TEXT,
    shop_email TEXT,
    shop_address TEXT,
    shop_city TEXT,
    shop_pincode TEXT,
    shop_gst TEXT,
    shop_pan TEXT,
    shop_upi TEXT,
    shop_bank TEXT,
    shop_account TEXT,
    shop_ifsc TEXT,
    shop_account_name TEXT,
    shop_status TEXT DEFAULT 'activated',
    sync_enabled BOOLEAN DEFAULT true,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shops_phone ON shops(shop_phone);
CREATE INDEX idx_shops_email ON shops(shop_email);
CREATE INDEX idx_shops_status ON shops(shop_status);

-- ============================================
-- 2. PRODUCTS TABLE (Complete)
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'all',
    price DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'unit',
    emoji TEXT DEFAULT '📦',
    qty DECIMAL(10,2) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_local_txn ON products(local_txn_id);
CREATE INDEX idx_products_name ON products(name);

-- ============================================
-- 3. CUSTOMERS TABLE (Complete)
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance DECIMAL(10,2) DEFAULT 0,
    gst_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_shop ON customers(shop_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_local_txn ON customers(local_txn_id);

-- ============================================
-- 4. SALES TABLE (Complete)
-- ============================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT UNIQUE,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_mode TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'paid',
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX idx_sales_shop ON sales(shop_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(sale_date DESC);
CREATE INDEX idx_sales_local_txn ON sales(local_txn_id);
CREATE INDEX idx_sales_payment ON sales(payment_mode);

-- ============================================
-- 5. DEVICES TABLE (Complete)
-- ============================================
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT UNIQUE NOT NULL,
    device_name TEXT,
    device_type TEXT DEFAULT 'web',
    last_sync TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devices_shop ON devices(shop_id);
CREATE INDEX idx_devices_device ON devices(device_id);
CREATE UNIQUE INDEX idx_devices_shop_device ON devices(shop_id, device_id);

-- ============================================
-- 6. LEDGER TABLE (Complete)
-- ============================================
CREATE TABLE ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT UNIQUE,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    transaction_type TEXT,
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2),
    payment_mode TEXT,
    reference_id UUID REFERENCES sales(id),
    notes TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX idx_ledger_shop ON ledger(shop_id);
CREATE INDEX idx_ledger_customer ON ledger(customer_id);
CREATE INDEX idx_ledger_date ON ledger(transaction_date DESC);
CREATE INDEX idx_ledger_local_txn ON ledger(local_txn_id);

-- ============================================
-- 7. ADVANCE ORDERS TABLE (Complete)
-- ============================================
CREATE TABLE advance_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT UNIQUE,
    customer_id UUID REFERENCES customers(id),
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

CREATE INDEX idx_advance_orders_shop ON advance_orders(shop_id);
CREATE INDEX idx_advance_orders_customer ON advance_orders(customer_id);
CREATE INDEX idx_advance_orders_date ON advance_orders(delivery_date);
CREATE INDEX idx_advance_orders_status ON advance_orders(status);
CREATE INDEX idx_advance_orders_local_txn ON advance_orders(local_txn_id);

-- ============================================
-- 8. MILK COLLECTIONS TABLE (Complete)
-- ============================================
CREATE TABLE milk_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
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

CREATE INDEX idx_collections_shop ON milk_collections(shop_id);
CREATE INDEX idx_collections_farmer ON milk_collections(farmer_id);
CREATE INDEX idx_collections_date ON milk_collections(collection_date DESC);
CREATE INDEX idx_collections_local_txn ON milk_collections(local_txn_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for now - can be restricted later)
CREATE POLICY "Enable all access for shops" ON shops FOR ALL USING (true);
CREATE POLICY "Enable all access for products" ON products FOR ALL USING (true);
CREATE POLICY "Enable all access for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Enable all access for sales" ON sales FOR ALL USING (true);
CREATE POLICY "Enable all access for devices" ON devices FOR ALL USING (true);
CREATE POLICY "Enable all access for ledger" ON ledger FOR ALL USING (true);
CREATE POLICY "Enable all access for advance_orders" ON advance_orders FOR ALL USING (true);
CREATE POLICY "Enable all access for milk_collections" ON milk_collections FOR ALL USING (true);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ledger_updated_at BEFORE UPDATE ON ledger
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advance_orders_updated_at BEFORE UPDATE ON advance_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milk_collections_updated_at BEFORE UPDATE ON milk_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO shops (name, shop_phone, shop_email, shop_city, shop_status)
VALUES ('Gopal Dairy', '9876543210', 'info@gopaldairy.com', 'Pune', 'activated');

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    '✅ Complete Schema Deployed' as status,
    (SELECT count(*) FROM shops) as shops_count,
    (SELECT count(*) FROM products) as products_count,
    (SELECT count(*) FROM customers) as customers_count,
    (SELECT count(*) FROM sales) as sales_count,
    (SELECT count(*) FROM devices) as devices_count,
    (SELECT count(*) FROM ledger) as ledger_count,
    (SELECT count(*) FROM advance_orders) as advance_orders_count,
    (SELECT count(*) FROM milk_collections) as collections_count;
"""

print("📝 Executing complete SQL schema...")
print(f"   SQL size: {len(COMPLETE_SQL)} bytes")
print()

# Execute SQL via Management API
try:
    response = requests.post(
        MGMT_URL,
        headers=MGMT_HEADERS,
        json={'query': COMPLETE_SQL},
        timeout=60
    )
    
    if response.status_code in [200, 201, 204]:
        print("✅ Schema deployed successfully via Management API\n")
    else:
        print(f"⚠️  Management API response: {response.status_code}")
        print(f"   {response.text[:200]}\n")
except Exception as e:
    print(f"⚠️  Management API error: {str(e)[:200]}\n")
    print("   Continuing with verification...\n")

# ============================================
# STEP 3: VERIFY DEPLOYMENT
# ============================================

print("📊 Step 3: Verifying deployment...\n")

tables_to_verify = [
    'shops', 'products', 'customers', 'sales',
    'devices', 'ledger', 'advance_orders', 'milk_collections'
]

verified_tables = []
failed_tables = []

for table in tables_to_verify:
    try:
        result = supabase.table(table).select('count', count='exact').execute()
        count = result.count if hasattr(result, 'count') else 0
        print(f"✅ {table}: {count} rows")
        verified_tables.append(table)
    except Exception as e:
        print(f"❌ {table}: {str(e)[:50]}")
        failed_tables.append(table)

print()

# ============================================
# STEP 4: VERIFY COLUMNS
# ============================================

print("📊 Step 4: Verifying columns...\n")

# Check shops table has all columns
shops_columns = [
    'id', 'name', 'phone', 'shop_phone', 'shop_email',
    'shop_address', 'shop_city', 'shop_pincode', 'shop_status',
    'sync_enabled', 'activated_at', 'created_at', 'updated_at'
]

print("📝 Shops table columns:")
for col in shops_columns:
    try:
        result = supabase.table('shops').select(col).limit(1).execute()
        print(f"  ✅ {col}")
    except:
        print(f"  ❌ {col}")

print()

# ============================================
# STEP 5: TEST API
# ============================================

print("🧪 Step 5: Testing Flask API...\n")

import subprocess

try:
    # Test shop settings
    result = subprocess.run(
        ['curl', '-s', '-X', 'POST', 'http://localhost:5000/api/shop-settings',
         '-H', 'Content-Type: application/json',
         '-d', '{"shop_name": "Test Dairy", "shop_phone": "9876543210", "shop_email": "test@dairy.com"}'],
        capture_output=True, text=True, timeout=10
    )
    
    if result.returncode == 0:
        response = json.loads(result.stdout)
        if response.get('success'):
            print("✅ Shop Settings API: Working")
        else:
            print(f"⚠️  Shop Settings API: {response.get('error', 'Unknown')}")
    else:
        print("❌ Flask API not responding")
except Exception as e:
    print(f"❌ API test failed: {str(e)[:100]}")

print()

# ============================================
# FINAL SUMMARY
# ============================================

print(f"{'='*70}")
print(f"📋 DEPLOYMENT SUMMARY")
print(f"{'='*70}")
print(f"Tables verified: {len(verified_tables)}/{len(tables_to_verify)}")
print(f"Tables failed: {len(failed_tables)}")
print()

if failed_tables:
    print(f"⚠️  Failed tables: {', '.join(failed_tables)}")
    print()
    print("🔧 These tables need manual creation via SQL Editor:")
    print("   1. Go to: https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/sql")
    print("   2. Copy SQL from: flask_app/MIGRATION_GUARANTEED.sql")
    print("   3. Paste and click Run")
    print()
else:
    print("✅ All tables deployed successfully!")
    print()

print(f"{'='*70}")
print(f"🎯 NEXT STEPS")
print(f"{'='*70}")
print()
print("1. Test POS app: http://localhost:5000/pos")
print()
print("2. Verify in Supabase:")
print("   https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar/editor")
print()
print("3. Test all APIs:")
print("   curl http://localhost:5000/api/health")
print("   curl http://localhost:5000/api/products")
print("   curl http://localhost:5000/api/customers")
print("   curl http://localhost:5000/api/shop-settings")
print()
print(f"{'='*70}")
print(f"✅ COMPLETE END-TO-END DEPLOYMENT FINISHED")
print(f"{'='*70}")
print()
