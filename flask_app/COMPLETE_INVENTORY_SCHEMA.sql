-- ============================================
-- MilkRecord POS - Complete Inventory & Reconciliation Schema
-- Production, Stock Movements, Shift Reconciliation
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. INVENTORY MOVEMENTS TABLE (Core Stock Ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    
    -- Movement type
    movement_type TEXT NOT NULL, -- IN, OUT, TRANSFORM, SALE, WASTE
    source_type TEXT NOT NULL, -- milk, product
    source_id UUID, -- Reference to source (collection_id, production_id, etc.)
    destination_type TEXT, -- product, sale, waste
    destination_id UUID,
    
    -- Quantities
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL, -- L, kg, g, ml
    
    -- Product info (for transformations)
    product_type TEXT, -- paneer, ghee, curd, sweets, cream
    conversion_ratio DECIMAL(5,2), -- L per kg
    
    -- Metadata
    batch_number TEXT,
    notes TEXT,
    created_by TEXT, -- Operator name
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for fast lookups
    CONSTRAINT chk_movement_type CHECK (movement_type IN ('IN', 'OUT', 'TRANSFORM', 'SALE', 'WASTE')),
    CONSTRAINT chk_source_type CHECK (source_type IN ('milk', 'product'))
);

CREATE INDEX idx_inventory_movements_shop ON inventory_movements(shop_id);
CREATE INDEX idx_inventory_movements_shift ON inventory_movements(shift_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_source ON inventory_movements(source_type, source_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at);

-- ============================================
-- 2. PRODUCT STOCK TABLE (Enhanced)
-- ============================================
DROP TABLE IF EXISTS product_stock CASCADE;

CREATE TABLE product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL, -- Paneer, Ghee, Curd, etc.
    product_type TEXT NOT NULL, -- paneer, ghee, curd, sweets, bakery
    
    -- Stock tracking (auto-calculated)
    opening_stock DECIMAL(10,3) DEFAULT 0,
    produced_today DECIMAL(10,3) DEFAULT 0,
    sold_today DECIMAL(10,3) DEFAULT 0,
    wasted_today DECIMAL(10,3) DEFAULT 0,
    closing_stock DECIMAL(10,3) DEFAULT 0,
    
    -- Unit
    unit TEXT DEFAULT 'kg',
    
    -- Cost tracking (auto-calculated)
    avg_cost_per_unit DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    
    -- Timestamps
    stock_date DATE DEFAULT CURRENT_DATE,
    shift_id UUID REFERENCES shifts(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(shop_id, product_name, stock_date)
);

CREATE INDEX idx_product_stock_shop ON product_stock(shop_id);
CREATE INDEX idx_product_stock_date ON product_stock(stock_date);
CREATE INDEX idx_product_stock_type ON product_stock(product_type);

-- ============================================
-- 3. PRODUCTION BATCHES TABLE (Enhanced)
-- ============================================
DROP TABLE IF EXISTS conversion_batches CASCADE;

CREATE TABLE production_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    batch_number TEXT UNIQUE NOT NULL,
    
    -- Milk input
    milk_source TEXT NOT NULL, -- cow, buff, mixed
    milk_quantity_cow DECIMAL(10,2) DEFAULT 0,
    milk_quantity_buff DECIMAL(10, 2) DEFAULT 0,
    milk_quantity_total DECIMAL(10,2) NOT NULL,
    
    -- Product output
    product_type TEXT NOT NULL, -- paneer, ghee, curd, sweets, cream
    product_quantity DECIMAL(10,2) NOT NULL,
    product_unit TEXT DEFAULT 'kg',
    
    -- Conversion details
    conversion_ratio DECIMAL(5,2), -- L per kg
    expected_ratio DECIMAL(5,2), -- Standard ratio
    variance_percent DECIMAL(5,2) DEFAULT 0, -- vs expected
    yield_efficiency DECIMAL(5,2) DEFAULT 0, -- % efficiency
    
    -- Quality control
    waste_percent DECIMAL(5,2) DEFAULT 0,
    quality_grade TEXT, -- A, B, C
    notes TEXT,
    
    -- Operator
    operator_name TEXT,
    created_by TEXT,
    
    -- Status
    status TEXT DEFAULT 'completed', -- completed, cancelled, flagged
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_batches_shop ON production_batches(shop_id);
CREATE INDEX idx_production_batches_shift ON production_batches(shift_id);
CREATE INDEX idx_production_batches_date ON production_batches(created_at);
CREATE INDEX idx_production_batches_product ON production_batches(product_type);
CREATE INDEX idx_production_batches_status ON production_batches(status);

-- ============================================
-- 4. STOCK VARIANCE ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_variance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    
    -- Variance type
    variance_type TEXT NOT NULL, -- milk, product, cash
    expected_value DECIMAL(10,2) NOT NULL,
    actual_value DECIMAL(10,2) NOT NULL,
    variance_amount DECIMAL(10,2) NOT NULL,
    variance_percent DECIMAL(5,2) NOT NULL,
    
    -- Threshold
    threshold_percent DECIMAL(5,2) DEFAULT 2.0,
    is_critical BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, reviewed, resolved
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_variance_shop ON stock_variance_alerts(shop_id);
CREATE INDEX idx_stock_variance_shift ON stock_variance_alerts(shift_id);
CREATE INDEX idx_stock_variance_status ON stock_variance_alerts(status);
CREATE INDEX idx_stock_variance_type ON stock_variance_alerts(variance_type);

-- ============================================
-- 5. DAILY SUMMARY TABLE (Auto-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL UNIQUE,
    
    -- Milk summary
    milk_opening DECIMAL(10,2) DEFAULT 0,
    milk_collected DECIMAL(10,2) DEFAULT 0,
    milk_converted DECIMAL(10,2) DEFAULT 0,
    milk_sold DECIMAL(10,2) DEFAULT 0,
    milk_waste DECIMAL(10,2) DEFAULT 0,
    milk_closing DECIMAL(10,2) DEFAULT 0,
    
    -- Product summary
    products_opening DECIMAL(10,2) DEFAULT 0,
    products_produced DECIMAL(10,2) DEFAULT 0,
    products_sold DECIMAL(10,2) DEFAULT 0,
    products_waste DECIMAL(10,2) DEFAULT 0,
    products_closing DECIMAL(10,2) DEFAULT 0,
    
    -- Financial summary
    revenue DECIMAL(10,2) DEFAULT 0,
    milk_cost DECIMAL(10,2) DEFAULT 0,
    gross_margin DECIMAL(10,2) DEFAULT 0,
    
    -- Shift summaries
    morning_shift_id UUID,
    evening_shift_id UUID,
    
    -- Reconciliation status
    reconciled BOOLEAN DEFAULT false,
    reconciled_by TEXT,
    reconciled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_summaries_shop ON daily_summaries(shop_id);
CREATE INDEX idx_daily_summaries_date ON daily_summaries(summary_date);
CREATE INDEX idx_daily_summaries_reconciled ON daily_summaries(reconciled);

-- ============================================
-- 6. FARMER YIELD ANALYTICS TABLE (Enhanced)
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
-- 7. WASTE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS waste_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    
    -- Waste type
    waste_type TEXT NOT NULL, -- milk, product
    product_type TEXT, -- paneer, ghee, curd, etc.
    
    -- Quantity
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
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_stock_updated_at BEFORE UPDATE ON product_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_batches_updated_at BEFORE UPDATE ON production_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON daily_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_yield_analytics_updated_at BEFORE UPDATE ON farmer_yield_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_variance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_yield_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Enable all access for product_stock" ON product_stock;
DROP POLICY IF EXISTS "Enable all access for production_batches" ON production_batches;
DROP POLICY IF EXISTS "Enable all access for stock_variance_alerts" ON stock_variance_alerts;
DROP POLICY IF EXISTS "Enable all access for daily_summaries" ON daily_summaries;
DROP POLICY IF EXISTS "Enable all access for farmer_yield_analytics" ON farmer_yield_analytics;
DROP POLICY IF EXISTS "Enable all access for waste_tracking" ON waste_tracking;

-- Create permissive policies
CREATE POLICY "Enable all access for inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for product_stock" ON product_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for production_batches" ON production_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for stock_variance_alerts" ON stock_variance_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for daily_summaries" ON daily_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for farmer_yield_analytics" ON farmer_yield_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for waste_tracking" ON waste_tracking FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    '✅ Complete Inventory & Reconciliation Schema Deployed' as status,
    (SELECT count(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('inventory_movements', 'product_stock', 'production_batches', 
                        'stock_variance_alerts', 'daily_summaries', 
                        'farmer_yield_analytics', 'waste_tracking')) as tables_created;
