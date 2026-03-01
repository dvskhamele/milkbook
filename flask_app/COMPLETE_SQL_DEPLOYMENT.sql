-- ============================================
-- COMPLETE END-TO-END SQL DEPLOYMENT
-- Run this ONCE in Supabase SQL Editor
-- Includes: Tables, Indexes, Views, Initial Data
-- RLS Policies: NOT INCLUDED (you'll add manually)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SHIFTS TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_shifts_shop ON shifts(shop_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

-- ============================================
-- 2. INVENTORY CURRENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_current (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id),
    item_type TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shop_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_inventory_current_shop ON inventory_current(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_current_type ON inventory_current(item_type);

-- ============================================
-- 3. INVENTORY MOVEMENTS TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_inventory_movements_shop ON inventory_movements(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_shift ON inventory_movements(shift_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);

-- ============================================
-- 4. PRODUCTION BATCHES TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_production_batches_shop ON production_batches(shop_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_shift ON production_batches(shift_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_date ON production_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_production_batches_from ON production_batches(from_item_type);
CREATE INDEX IF NOT EXISTS idx_production_batches_to ON production_batches(to_item_type);

-- ============================================
-- 5. SHIFT RECONCILIATION TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_shift_reconciliation_shop ON shift_reconciliation(shop_id);
CREATE INDEX IF NOT EXISTS idx_shift_reconciliation_date ON shift_reconciliation(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_reconciliation_status ON shift_reconciliation(status);

-- ============================================
-- 6. FARMER YIELD ANALYTICS TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_farmer_yield_farmer ON farmer_yield_analytics(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_yield_shop ON farmer_yield_analytics(shop_id);
CREATE INDEX IF NOT EXISTS idx_farmer_yield_date ON farmer_yield_analytics(analysis_date);
CREATE INDEX IF NOT EXISTS idx_farmer_yield_score ON farmer_yield_analytics(quality_score DESC);

-- ============================================
-- 7. WASTE TRACKING TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_waste_tracking_shop ON waste_tracking(shop_id);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_shift ON waste_tracking(shift_id);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_type ON waste_tracking(waste_type);
CREATE INDEX IF NOT EXISTS idx_waste_tracking_date ON waste_tracking(created_at);

-- ============================================
-- 8. LEDGER VIEWS
-- ============================================

-- Milk Ledger View
CREATE OR REPLACE VIEW milk_ledger AS
SELECT 
    im.created_at,
    im.movement_type,
    im.direction,
    im.item_type,
    im.quantity,
    im.unit,
    im.reference_type,
    im.reference_id,
    im.notes,
    CASE 
        WHEN im.direction = 'IN' THEN im.quantity
        ELSE -im.quantity
    END as running_balance
FROM inventory_movements im
WHERE im.item_type IN ('milk_cow', 'milk_buff')
ORDER BY im.created_at DESC;

-- Production Ledger View
CREATE OR REPLACE VIEW production_ledger AS
SELECT 
    pb.created_at,
    pb.batch_number,
    pb.from_item_type as input_type,
    pb.from_quantity as input_qty,
    pb.to_item_type as output_type,
    pb.to_quantity as output_qty,
    pb.conversion_ratio,
    pb.yield_efficiency,
    pb.operator_name,
    pb.status
FROM production_batches pb
ORDER BY pb.created_at DESC;

-- Inventory Ledger View
CREATE OR REPLACE VIEW inventory_ledger AS
SELECT 
    ic.item_type,
    ic.quantity as current_stock,
    ic.unit,
    ic.last_updated,
    COALESCE(SUM(CASE WHEN im.direction = 'IN' THEN im.quantity ELSE -im.quantity END), 0) as total_movements
FROM inventory_current ic
LEFT JOIN inventory_movements im ON ic.item_type = im.item_type AND ic.shop_id = im.shop_id
GROUP BY ic.item_type, ic.quantity, ic.unit, ic.last_updated
ORDER BY ic.item_type;

-- Sales Ledger View
CREATE OR REPLACE VIEW sales_ledger AS
SELECT 
    s.sale_date,
    s.customer_name,
    s.items,
    s.total_amount,
    s.payment_mode,
    s.payment_status,
    CASE 
        WHEN s.payment_mode = 'cash' THEN s.total_amount
        ELSE 0
    END as cash_sales,
    CASE 
        WHEN s.payment_mode IN ('credit', 'account') THEN s.total_amount
        ELSE 0
    END as credit_sales
FROM sales s
ORDER BY s.sale_date DESC;

-- Cash/Credit Ledger View
CREATE OR REPLACE VIEW cash_credit_ledger AS
SELECT 
    s.sale_date as transaction_date,
    s.customer_name,
    'Sale' as transaction_type,
    s.total_amount as amount,
    s.payment_mode,
    CASE 
        WHEN s.payment_mode = 'cash' THEN 'IN'
        WHEN s.payment_mode IN ('credit', 'account') THEN 'RECEIVABLE'
        ELSE 'OUT'
    END as direction
FROM sales s
UNION ALL
SELECT 
    wt.created_at,
    'Waste: ' || wt.item_type,
    'Waste',
    wt.cost_amount,
    'cash',
    'OUT'
FROM waste_tracking wt
ORDER BY transaction_date DESC;

-- ============================================
-- 9. INITIALIZE INVENTORY
-- ============================================

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

-- ============================================
-- 10. VERIFICATION QUERY
-- ============================================

SELECT 
    '✅ Complete Inventory & Reconciliation Schema Deployed' as status,
    (SELECT count(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('shifts', 'inventory_current', 'inventory_movements', 
                        'production_batches', 'shift_reconciliation', 
                        'farmer_yield_analytics', 'waste_tracking')) as tables_created,
    (SELECT count(*) FROM information_schema.views 
     WHERE table_schema = 'public' 
     AND viewname IN ('milk_ledger', 'production_ledger', 'inventory_ledger', 
                      'sales_ledger', 'cash_credit_ledger')) as views_created;

-- ============================================
-- END OF DEPLOYMENT
-- ============================================
