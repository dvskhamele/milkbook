-- ============================================
-- MilkRecord POS - Complete Inventory & Reconciliation Schema
-- ADDITIVE - Does not remove any existing tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 0. SHIFTS TABLE (Required for reconciliation)
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL, -- morning, evening, night
    shift_date DATE NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'open', -- open, closed, reconciled
    
    -- Opening balances
    opening_milk_cow DECIMAL(10,2) DEFAULT 0,
    opening_milk_buff DECIMAL(10,2) DEFAULT 0,
    opening_cash DECIMAL(10,2) DEFAULT 0,
    
    -- Auto-calculated totals
    total_milk_collected DECIMAL(10,2) DEFAULT 0,
    total_milk_converted DECIMAL(10,2) DEFAULT 0,
    total_milk_sold DECIMAL(10,2) DEFAULT 0,
    total_sales_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Closing balances
    closing_milk_cow DECIMAL(10,2),
    closing_milk_buff DECIMAL(10,2),
    closing_cash DECIMAL(10,2),
    
    -- Variance
    milk_variance DECIMAL(10,2) DEFAULT 0,
    milk_variance_percent DECIMAL(5,2) DEFAULT 0,
    cash_variance DECIMAL(10,2) DEFAULT 0,
    
    -- Reconciliation
    reconciled_by TEXT,
    reconciled_at TIMESTAMPTZ,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_shop ON shifts(shop_id);
CREATE INDEX idx_shifts_date ON shifts(shift_date);
CREATE INDEX idx_shifts_status ON shifts(status);

-- ============================================
-- 1. INVENTORY CURRENT TABLE (New - Real-time stock)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_current (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- milk_cow, milk_buff, paneer, curd, ghee, butter, sweets, etc.
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL, -- L, kg, g, ml
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(shop_id, item_type)
);

CREATE INDEX idx_inventory_current_shop ON inventory_current(shop_id);
CREATE INDEX idx_inventory_current_type ON inventory_current(item_type);

-- ============================================
-- 2. INVENTORY MOVEMENTS TABLE (New - Complete audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    
    -- Movement details
    movement_type TEXT NOT NULL, -- collection, conversion_in, conversion_out, sale, waste, adjustment
    direction TEXT NOT NULL, -- IN, OUT
    item_type TEXT NOT NULL, -- milk_cow, milk_buff, paneer, curd, etc.
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    
    -- Reference tracking
    reference_type TEXT, -- collection_entry, production_batch, sale_invoice, waste_entry
    reference_id UUID,
    
    -- Additional info
    batch_number TEXT,
    notes TEXT,
    created_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_shop ON inventory_movements(shop_id);
CREATE INDEX idx_inventory_movements_shift ON inventory_movements(shift_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_item ON inventory_movements(item_type);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at);

-- ============================================
-- 3. PRODUCTION BATCHES TABLE (Enhanced)
-- ============================================
DROP TABLE IF EXISTS production_batches CASCADE;

CREATE TABLE production_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    batch_number TEXT UNIQUE NOT NULL,
    
    -- Input (FROM)
    from_item_type TEXT NOT NULL, -- milk_cow, milk_buff, paneer, etc.
    from_quantity DECIMAL(10,3) NOT NULL,
    from_unit TEXT NOT NULL,
    
    -- Output (TO)
    to_item_type TEXT NOT NULL, -- paneer, ghee, curd, sweets, etc.
    to_quantity DECIMAL(10,3) NOT NULL,
    to_unit TEXT NOT NULL,
    
    -- Conversion details
    conversion_ratio DECIMAL(5,2), -- e.g., 5.00 for 5L → 1kg
    expected_ratio DECIMAL(5,2),
    variance_percent DECIMAL(5,2) DEFAULT 0,
    yield_efficiency DECIMAL(5,2) DEFAULT 0,
    
    -- Quality
    avg_fat DECIMAL(5,2),
    avg_snf DECIMAL(5,2),
    waste_percent DECIMAL(5,2) DEFAULT 0,
    quality_grade TEXT, -- A, B, C
    
    -- Operator
    operator_name TEXT,
    notes TEXT,
    
    -- Status
    status TEXT DEFAULT 'completed', -- completed, cancelled, flagged
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_batches_shop ON production_batches(shop_id);
CREATE INDEX idx_production_batches_shift ON production_batches(shift_id);
CREATE INDEX idx_production_batches_date ON production_batches(created_at);
CREATE INDEX idx_production_batches_from ON production_batches(from_item_type);
CREATE INDEX idx_production_batches_to ON production_batches(to_item_type);

-- ============================================
-- 4. SHIFT RECONCILIATION TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS shift_reconciliation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    
    -- Period
    shift_date DATE NOT NULL,
    shift_name TEXT NOT NULL, -- morning, evening
    
    -- Milk reconciliation
    milk_opening DECIMAL(10,2) DEFAULT 0,
    milk_collected DECIMAL(10,2) DEFAULT 0,
    milk_converted DECIMAL(10,2) DEFAULT 0,
    milk_sold_raw DECIMAL(10,2) DEFAULT 0,
    milk_waste DECIMAL(10,2) DEFAULT 0,
    milk_expected_closing DECIMAL(10,2) DEFAULT 0,
    milk_actual_closing DECIMAL(10,2) DEFAULT 0,
    milk_variance DECIMAL(10,2) DEFAULT 0,
    milk_variance_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Product reconciliation (per product type)
    product_opening DECIMAL(10,2) DEFAULT 0,
    product_produced DECIMAL(10,2) DEFAULT 0,
    product_sold DECIMAL(10,2) DEFAULT 0,
    product_waste DECIMAL(10,2) DEFAULT 0,
    product_expected_closing DECIMAL(10,2) DEFAULT 0,
    product_actual_closing DECIMAL(10,2) DEFAULT 0,
    product_variance DECIMAL(10,2) DEFAULT 0,
    product_variance_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Cash reconciliation
    cash_opening DECIMAL(10,2) DEFAULT 0,
    cash_sales DECIMAL(10,2) DEFAULT 0,
    cash_other_in DECIMAL(10,2) DEFAULT 0,
    cash_expenses DECIMAL(10,2) DEFAULT 0,
    cash_expected_closing DECIMAL(10,2) DEFAULT 0,
    cash_actual_closing DECIMAL(10,2) DEFAULT 0,
    cash_variance DECIMAL(10,2) DEFAULT 0,
    cash_variance_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, reconciled, variance_detected
    reconciled_by TEXT,
    reconciled_at TIMESTAMPTZ,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shift_reconciliation_shop ON shift_reconciliation(shop_id);
CREATE INDEX idx_shift_reconciliation_date ON shift_reconciliation(shift_date);
CREATE INDEX idx_shift_reconciliation_status ON shift_reconciliation(status);

-- ============================================
-- 5. FARMER YIELD ANALYTICS TABLE (Enhanced)
-- ============================================
DROP TABLE IF EXISTS farmer_yield_analytics CASCADE;

CREATE TABLE farmer_yield_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL,
    farmer_name TEXT NOT NULL,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Period
    analysis_date DATE DEFAULT CURRENT_DATE,
    shift_name TEXT,
    
    -- Milk quality
    total_quantity DECIMAL(10,2) DEFAULT 0,
    avg_fat DECIMAL(5,2),
    avg_snf DECIMAL(5,2),
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Conversion yield (auto-calculated from production batches)
    paneer_yield_per_liter DECIMAL(5,3), -- kg per liter
    ghee_yield_per_liter DECIMAL(5,3),
    curd_yield_per_liter DECIMAL(5,3),
    
    -- Profitability
    profit_per_liter DECIMAL(10,2),
    cost_per_liter DECIMAL(10,2),
    
    -- Quality score (auto-calculated)
    quality_score DECIMAL(5,2), -- 0-100
    quality_grade TEXT, -- A, B, C
    
    -- Recommendations
    recommendation TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_farmer_yield_farmer ON farmer_yield_analytics(farmer_id);
CREATE INDEX idx_farmer_yield_shop ON farmer_yield_analytics(shop_id);
CREATE INDEX idx_farmer_yield_date ON farmer_yield_analytics(analysis_date);
CREATE INDEX idx_farmer_yield_score ON farmer_yield_analytics(quality_score DESC);

-- ============================================
-- 6. WASTE TRACKING TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS waste_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    
    -- Waste details
    waste_type TEXT NOT NULL, -- milk, product
    item_type TEXT NOT NULL, -- milk_cow, milk_buff, paneer, curd, etc.
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    
    -- Reason
    reason TEXT NOT NULL, -- spoiled, damaged, expired, other
    notes TEXT,
    
    -- Financial impact
    cost_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Approval
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waste_tracking_shop ON waste_tracking(shop_id);
CREATE INDEX idx_waste_tracking_shift ON waste_tracking(shift_id);
CREATE INDEX idx_waste_tracking_type ON waste_tracking(waste_type);
CREATE INDEX idx_waste_tracking_date ON waste_tracking(created_at);

-- ============================================
-- 7. LEDGER VIEWS (For User Display)
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

-- Sales Ledger View (uses existing sales table)
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
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_production_batches_updated_at BEFORE UPDATE ON production_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_yield_analytics_updated_at BEFORE UPDATE ON farmer_yield_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES (Enable but permissive)
-- ============================================

ALTER TABLE inventory_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_yield_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all access for inventory_current" ON inventory_current;
DROP POLICY IF EXISTS "Enable all access for inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Enable all access for production_batches" ON production_batches;
DROP POLICY IF EXISTS "Enable all access for shift_reconciliation" ON shift_reconciliation;
DROP POLICY IF EXISTS "Enable all access for farmer_yield_analytics" ON farmer_yield_analytics;
DROP POLICY IF EXISTS "Enable all access for waste_tracking" ON waste_tracking;

-- Create permissive policies
CREATE POLICY "Enable all access for inventory_current" ON inventory_current FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for production_batches" ON production_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for shift_reconciliation" ON shift_reconciliation FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for farmer_yield_analytics" ON farmer_yield_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for waste_tracking" ON waste_tracking FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SAMPLE DATA FOR INVENTORY CURRENT
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
-- VERIFICATION
-- ============================================

SELECT 
    '✅ Complete Inventory & Reconciliation Schema Deployed (ADDITIVE)' as status,
    (SELECT count(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('inventory_current', 'inventory_movements', 'production_batches', 
                        'shift_reconciliation', 'farmer_yield_analytics', 'waste_tracking')) as new_tables_created,
    (SELECT count(*) FROM information_schema.views 
     WHERE table_schema = 'public' 
     AND table_name IN ('milk_ledger', 'production_ledger', 'inventory_ledger', 
                        'sales_ledger', 'cash_credit_ledger')) as ledger_views_created;
