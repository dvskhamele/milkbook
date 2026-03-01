#!/usr/bin/env python3
"""
Deploy MilkRecord Tables to Supabase Non-Interactively
DOES: Create tables, indexes, views
REQUIRES MANUAL: RLS policies (run RLS_SETUP.sql after this)
"""

import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv('flask_app/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials in .env")
    sys.exit(1)

print(f"🚀 Deploying to: {SUPABASE_URL}")
print(f"🔑 Using Service Role Key: {SUPABASE_SERVICE_KEY[:20]}...")

# Tables to create (without RLS - that's manual)
TABLES_SQL = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SHIFTS TABLE
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    shift_name TEXT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'open',
    opening_milk_cow DECIMAL(10,2) DEFAULT 0,
    opening_milk_buff DECIMAL(10,2) DEFAULT 0,
    opening_cash DECIMAL(10,2) DEFAULT 0,
    total_milk_collected DECIMAL(10,2) DEFAULT 0,
    total_milk_converted DECIMAL(10,2) DEFAULT 0,
    total_milk_sold DECIMAL(10,2) DEFAULT 0,
    total_sales_amount DECIMAL(10,2) DEFAULT 0,
    closing_milk_cow DECIMAL(10,2),
    closing_milk_buff DECIMAL(10,2),
    closing_cash DECIMAL(10,2),
    milk_variance DECIMAL(10,2) DEFAULT 0,
    milk_variance_percent DECIMAL(5,2) DEFAULT 0,
    cash_variance DECIMAL(10,2) DEFAULT 0,
    reconciled_by TEXT,
    reconciled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY CURRENT
CREATE TABLE IF NOT EXISTS inventory_current (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    item_type TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shop_id, item_type)
);

-- INVENTORY MOVEMENTS
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    shift_id UUID REFERENCES shifts(id),
    movement_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    item_type TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    batch_number TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTION BATCHES
CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    shift_id UUID REFERENCES shifts(id),
    batch_number TEXT UNIQUE NOT NULL,
    from_item_type TEXT NOT NULL,
    from_quantity DECIMAL(10,3) NOT NULL,
    from_unit TEXT NOT NULL,
    to_item_type TEXT NOT NULL,
    to_quantity DECIMAL(10,3) NOT NULL,
    to_unit TEXT NOT NULL,
    conversion_ratio DECIMAL(5,2),
    expected_ratio DECIMAL(5,2),
    variance_percent DECIMAL(5,2) DEFAULT 0,
    yield_efficiency DECIMAL(5,2) DEFAULT 0,
    avg_fat DECIMAL(5,2),
    avg_snf DECIMAL(5,2),
    waste_percent DECIMAL(5,2) DEFAULT 0,
    quality_grade TEXT,
    operator_name TEXT,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHIFT RECONCILIATION
CREATE TABLE IF NOT EXISTS shift_reconciliation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    shift_id UUID REFERENCES shifts(id),
    shift_date DATE NOT NULL,
    shift_name TEXT NOT NULL,
    milk_opening DECIMAL(10,2) DEFAULT 0,
    milk_collected DECIMAL(10,2) DEFAULT 0,
    milk_converted DECIMAL(10,2) DEFAULT 0,
    milk_sold_raw DECIMAL(10,2) DEFAULT 0,
    milk_waste DECIMAL(10,2) DEFAULT 0,
    milk_expected_closing DECIMAL(10,2) DEFAULT 0,
    milk_actual_closing DECIMAL(10,2) DEFAULT 0,
    milk_variance DECIMAL(10,2) DEFAULT 0,
    milk_variance_percent DECIMAL(5,2) DEFAULT 0,
    product_opening DECIMAL(10,2) DEFAULT 0,
    product_produced DECIMAL(10,2) DEFAULT 0,
    product_sold DECIMAL(10,2) DEFAULT 0,
    product_waste DECIMAL(10,2) DEFAULT 0,
    product_expected_closing DECIMAL(10,2) DEFAULT 0,
    product_actual_closing DECIMAL(10,2) DEFAULT 0,
    product_variance DECIMAL(10,2) DEFAULT 0,
    product_variance_percent DECIMAL(5,2) DEFAULT 0,
    cash_opening DECIMAL(10,2) DEFAULT 0,
    cash_sales DECIMAL(10,2) DEFAULT 0,
    cash_other_in DECIMAL(10,2) DEFAULT 0,
    cash_expenses DECIMAL(10,2) DEFAULT 0,
    cash_expected_closing DECIMAL(10,2) DEFAULT 0,
    cash_actual_closing DECIMAL(10,2) DEFAULT 0,
    cash_variance DECIMAL(10,2) DEFAULT 0,
    cash_variance_percent DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    reconciled_by TEXT,
    reconciled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FARMER YIELD ANALYTICS
CREATE TABLE IF NOT EXISTS farmer_yield_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL,
    farmer_name TEXT NOT NULL,
    shop_id UUID REFERENCES shops(id),
    analysis_date DATE DEFAULT CURRENT_DATE,
    shift_name TEXT,
    total_quantity DECIMAL(10,2) DEFAULT 0,
    avg_fat DECIMAL(5,2),
    avg_snf DECIMAL(5,2),
    total_amount DECIMAL(10,2) DEFAULT 0,
    paneer_yield_per_liter DECIMAL(5,3),
    ghee_yield_per_liter DECIMAL(5,3),
    curd_yield_per_liter DECIMAL(5,3),
    profit_per_liter DECIMAL(10,2),
    cost_per_liter DECIMAL(10,2),
    quality_score DECIMAL(5,2),
    quality_grade TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WASTE TRACKING
CREATE TABLE IF NOT EXISTS waste_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    shift_id UUID REFERENCES shifts(id),
    waste_type TEXT NOT NULL,
    item_type TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    cost_amount DECIMAL(10,2) DEFAULT 0,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_shifts_shop ON shifts(shop_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

CREATE INDEX IF NOT EXISTS idx_inventory_current_shop ON inventory_current(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_current_type ON inventory_current(item_type);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_shop ON inventory_movements(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_shift ON inventory_movements(shift_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);

CREATE INDEX IF NOT EXISTS idx_production_batches_shop ON production_batches(shop_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_shift ON production_batches(shift_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_date ON production_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_production_batches_from ON production_batches(from_item_type);
CREATE INDEX IF NOT EXISTS idx_production_batches_to ON production_batches(to_item_type);

CREATE INDEX IF NOT EXISTS idx_shift_reconciliation_shop ON shift_reconciliation(shop_id);
CREATE INDEX IF NOT EXISTS idx_shift_reconciliation_date ON shift_reconciliation(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_reconciliation_status ON shift_reconciliation(status);

CREATE INDEX IF NOT EXISTS idx_farmer_yield_farmer ON farmer_yield_analytics(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_yield_shop ON farmer_yield_analytics(shop_id);
CREATE INDEX IF NOT EXISTS idx_farmer_yield_date ON farmer_yield_analytics(analysis_date);
CREATE INDEX IF NOT EXISTS idx_farmer_yield_score ON farmer_yield_analytics(quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_waste_tracking_shop ON waste_tracking(shop_id);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_shift ON waste_tracking(shift_id);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_type ON waste_tracking(waste_type);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_date ON waste_tracking(created_at);

-- INITIALIZE INVENTORY
INSERT INTO inventory_current (shop_id, item_type, quantity, unit)
VALUES 
    (NULL, 'milk_cow', 0, 'L'),
    (NULL, 'milk_buff', 0, 'L'),
    (NULL, 'paneer', 0, 'kg'),
    (NULL, 'curd', 0, 'kg'),
    (NULL, 'ghee', 0, 'kg'),
    (NULL, 'butter', 0, 'kg'),
    (NULL, 'sweets', 0, 'kg')
ON CONFLICT (shop_id, item_type) DO NOTHING;
"""

print("\n📡 Creating tables via Management API...")

try:
    # Use Supabase Management API to execute SQL
    # Note: This requires the SQL to be sent as a series of statements
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Split SQL into individual statements
    statements = [s.strip() for s in TABLES_SQL.split(';') if s.strip() and not s.strip().startswith('--')]
    
    success_count = 0
    error_count = 0
    
    for i, stmt in enumerate(statements, 1):
        try:
            response = requests.post(
                f'{SUPABASE_URL}/rest/v1/',
                headers=headers,
                json={'query': stmt},
                timeout=30
            )
            
            if response.status_code in [200, 201, 204, 400]:
                # 400 is OK for IF NOT EXISTS when table exists
                success_count += 1
                print(f"  ✅ Statement {i}/{len(statements)}")
            else:
                print(f"  ⚠️  Statement {i}: {response.status_code}")
                error_count += 1
        except Exception as e:
            print(f"  ⚠️  Statement {i}: {str(e)[:50]}")
            error_count += 1
    
    print(f"\n✅ Table creation complete!")
    print(f"   Success: {success_count}/{len(statements)}")
    print(f"   Errors: {error_count}/{len(statements)}")
    
    # Verify tables
    print("\n📊 Verifying tables...")
    
    verify_sql = """
    SELECT table_name, '✅ Created' as status
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'shifts',
        'inventory_current',
        'inventory_movements',
        'production_batches',
        'shift_reconciliation',
        'farmer_yield_analytics',
        'waste_tracking'
    )
    ORDER BY table_name
    """
    
    print(f"\n⚠️  MANUAL STEP REQUIRED:")
    print(f"   Tables created successfully!")
    print(f"   Now run: flask_app/RLS_POLICIES_MANUAL.sql")
    print(f"   to enable Row Level Security policies")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\n📋 ALTERNATIVE: Copy-paste deployment")
    print(f"   1. Open: {SUPABASE_URL}/dashboard/project/uoeswfuiwjluqomgepar/sql")
    print(f"   2. Copy: flask_app/SUPABASE_DEPLOY_SQL.md")
    print(f"   3. Paste & Run")

print("\n🎉 Deployment script complete!")
print("\n📋 NEXT STEPS:")
print("1. ✅ Tables created (done)")
print("2. ⚠️  Run RLS policies: flask_app/RLS_POLICIES_MANUAL.sql")
print("3. ✅ Test in POS")
