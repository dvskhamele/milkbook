-- ============================================
-- MilkRecord POS - Complete Reconciliation Schema
-- Anti-theft, minimal entry, maximum insight
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SHIFTS TABLE (Core reconciliation unit)
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL, -- Morning, Evening, Night
    shift_date DATE NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'open', -- open, closed, reconciled
    
    -- Opening balances (entered at shift start)
    opening_milk_cow DECIMAL(10,2) DEFAULT 0,
    opening_milk_buff DECIMAL(10,2) DEFAULT 0,
    opening_cash DECIMAL(10,2) DEFAULT 0,
    
    -- Closing balances (entered at shift end)
    closing_milk_cow DECIMAL(10,2),
    closing_milk_buff DECIMAL(10,2),
    closing_cash DECIMAL(10,2),
    
    -- Auto-calculated totals
    total_milk_collected DECIMAL(10,2) DEFAULT 0,
    total_milk_converted DECIMAL(10,2) DEFAULT 0,
    total_milk_sold DECIMAL(10,2) DEFAULT 0,
    total_sales_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Variance detection
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
-- 2. CONVERSION BATCHES TABLE (Milk → Product)
-- ============================================
CREATE TABLE IF NOT EXISTS conversion_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    batch_number TEXT, -- Auto-generated: BATCH-20260301-001
    
    -- Milk input
    milk_source TEXT NOT NULL, -- cow, buff, mixed
    milk_quantity_cow DECIMAL(10,2) DEFAULT 0,
    milk_quantity_buff DECIMAL(10,2) DEFAULT 0,
    milk_quantity_total DECIMAL(10,2) NOT NULL,
    
    -- Product output
    product_type TEXT NOT NULL, -- paneer, ghee, curd, sweets
    product_quantity DECIMAL(10,2) NOT NULL,
    product_unit TEXT DEFAULT 'kg',
    
    -- Conversion details
    conversion_ratio DECIMAL(5,2), -- L per kg (e.g., 5.00 for paneer)
    expected_ratio DECIMAL(5,2), -- Standard ratio for comparison
    variance_percent DECIMAL(5,2) DEFAULT 0, -- vs expected
    
    -- Quality (optional)
    waste_percent DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    
    -- Operator
    operator_name TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversion_shop ON conversion_batches(shop_id);
CREATE INDEX idx_conversion_shift ON conversion_batches(shift_id);
CREATE INDEX idx_conversion_date ON conversion_batches(created_at);
CREATE INDEX idx_conversion_product ON conversion_batches(product_type);

-- ============================================
-- 3. PRODUCT STOCK TABLE (Real-time inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL, -- Paneer, Ghee, Curd, etc.
    product_type TEXT, -- paneer, ghee, curd, sweets, bakery
    
    -- Stock tracking
    opening_stock DECIMAL(10,2) DEFAULT 0,
    produced_today DECIMAL(10,2) DEFAULT 0,
    sold_today DECIMAL(10,2) DEFAULT 0,
    wasted_today DECIMAL(10,2) DEFAULT 0,
    closing_stock DECIMAL(10,2) DEFAULT 0,
    
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
-- 4. MILK COLLECTION SUMMARY (Daily aggregation)
-- ============================================
CREATE TABLE IF NOT EXISTS milk_collection_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
    collection_date DATE NOT NULL,
    shift_name TEXT NOT NULL,
    
    -- Totals
    total_quantity DECIMAL(10,2) DEFAULT 0,
    cow_quantity DECIMAL(10,2) DEFAULT 0,
    buff_quantity DECIMAL(10,2) DEFAULT 0,
    
    -- Quality averages
    avg_fat DECIMAL(5,2),
    avg_snf DECIMAL(5,2),
    avg_rate DECIMAL(10,2),
    
    -- Financial
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(shop_id, collection_date, shift_name)
);

CREATE INDEX idx_milk_summary_shop ON milk_collection_summary(shop_id);
CREATE INDEX idx_milk_summary_date ON milk_collection_summary(collection_date);

-- ============================================
-- 5. FARMER YIELD ANALYTICS (Auto-derived)
-- ============================================
CREATE TABLE IF NOT EXISTS farmer_yield_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID,
    farmer_name TEXT,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Period
    analysis_date DATE DEFAULT CURRENT_DATE,
    shift_name TEXT,
    
    -- Milk quality
    total_quantity DECIMAL(10,2) DEFAULT 0,
    avg_fat DECIMAL(5,2),
    avg_snf DECIMAL(5,2),
    
    -- Conversion yield (auto-calculated from conversion batches)
    paneer_yield_per_liter DECIMAL(5,3), -- kg per liter
    ghee_yield_per_liter DECIMAL(5,3),
    curd_yield_per_liter DECIMAL(5,3),
    
    -- Quality score (auto-calculated)
    quality_score DECIMAL(5,2), -- 0-100
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_farmer_yield_farmer ON farmer_yield_analytics(farmer_id);
CREATE INDEX idx_farmer_yield_shop ON farmer_yield_analytics(shop_id);
CREATE INDEX idx_farmer_yield_date ON farmer_yield_analytics(analysis_date);

-- ============================================
-- 6. DAILY RECONCILIATION SUMMARY
-- ============================================
CREATE TABLE IF NOT EXISTS daily_reconciliation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL,
    
    -- Milk reconciliation
    opening_milk DECIMAL(10,2) DEFAULT 0,
    milk_collected DECIMAL(10,2) DEFAULT 0,
    milk_converted DECIMAL(10,2) DEFAULT 0,
    milk_sold DECIMAL(10,2) DEFAULT 0,
    milk_waste DECIMAL(10,2) DEFAULT 0,
    expected_closing DECIMAL(10,2) DEFAULT 0,
    actual_closing DECIMAL(10,2) DEFAULT 0,
    milk_variance DECIMAL(10,2) DEFAULT 0,
    milk_variance_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Product reconciliation
    products_produced DECIMAL(10,2) DEFAULT 0,
    products_sold DECIMAL(10,2) DEFAULT 0,
    products_waste DECIMAL(10,2) DEFAULT 0,
    expected_product_closing DECIMAL(10,2) DEFAULT 0,
    actual_product_closing DECIMAL(10,2) DEFAULT 0,
    product_variance DECIMAL(10,2) DEFAULT 0,
    
    -- Cash reconciliation
    opening_cash DECIMAL(10,2) DEFAULT 0,
    sales_collection DECIMAL(10,2) DEFAULT 0,
    other_income DECIMAL(10,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0,
    expected_closing_cash DECIMAL(10,2) DEFAULT 0,
    actual_closing_cash DECIMAL(10,2) DEFAULT 0,
    cash_variance DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, reconciled, variance_detected
    reconciled_by TEXT,
    reconciled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(shop_id, reconciliation_date)
);

CREATE INDEX idx_daily_recon_shop ON daily_reconciliation(shop_id);
CREATE INDEX idx_daily_recon_date ON daily_reconciliation(reconciliation_date);
CREATE INDEX idx_daily_recon_status ON daily_reconciliation(status);

-- ============================================
-- 7. VARIANCE THRESHOLDS (Configurable)
-- ============================================
CREATE TABLE IF NOT EXISTS variance_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Variance limits
    milk_variance_limit DECIMAL(5,2) DEFAULT 2.0, -- 2%
    cash_variance_limit DECIMAL(5,2) DEFAULT 1.0, -- 1%
    product_variance_limit DECIMAL(5,2) DEFAULT 3.0, -- 3%
    
    -- Auto-blocking
    block_shift_close BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversion_batches_updated_at BEFORE UPDATE ON conversion_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_stock_updated_at BEFORE UPDATE ON product_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_yield_analytics_updated_at BEFORE UPDATE ON farmer_yield_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reconciliation_updated_at BEFORE UPDATE ON daily_reconciliation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variance_thresholds_updated_at BEFORE UPDATE ON variance_thresholds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_collection_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_yield_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE variance_thresholds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all access for shifts" ON shifts;
DROP POLICY IF EXISTS "Enable all access for conversion_batches" ON conversion_batches;
DROP POLICY IF EXISTS "Enable all access for product_stock" ON product_stock;
DROP POLICY IF EXISTS "Enable all access for milk_collection_summary" ON milk_collection_summary;
DROP POLICY IF EXISTS "Enable all access for farmer_yield_analytics" ON farmer_yield_analytics;
DROP POLICY IF EXISTS "Enable all access for daily_reconciliation" ON daily_reconciliation;
DROP POLICY IF EXISTS "Enable all access for variance_thresholds" ON variance_thresholds;

-- Create permissive policies
CREATE POLICY "Enable all access for shifts" ON shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for conversion_batches" ON conversion_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for product_stock" ON product_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for milk_collection_summary" ON milk_collection_summary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for farmer_yield_analytics" ON farmer_yield_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for daily_reconciliation" ON daily_reconciliation FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for variance_thresholds" ON variance_thresholds FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DEFAULT VARIANCE THRESHOLDS
-- ============================================

INSERT INTO variance_thresholds (shop_id, milk_variance_limit, cash_variance_limit, product_variance_limit, block_shift_close)
SELECT NULL, 2.0, 1.0, 3.0, true
WHERE NOT EXISTS (SELECT 1 FROM variance_thresholds);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    '✅ Complete Reconciliation Schema Deployed' as status,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('shifts', 'conversion_batches', 'product_stock', 'milk_collection_summary', 'farmer_yield_analytics', 'daily_reconciliation', 'variance_thresholds')) as tables_created;
