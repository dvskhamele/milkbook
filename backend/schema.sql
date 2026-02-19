-- =====================================================
-- MilkBook Dairy Shop - Phase 1 Backend Schema
-- Supabase + Vercel Serverless
-- =====================================================
-- Philosophy:
-- - Frontend is FINAL, backend adapts
-- - Every module independent, linked by identity refs
-- - Future-proof via external_ref_id, external_source, external_meta
-- - NO global auth, NO cross-module joins
-- - Simple RLS by shop_id
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SHOPS TABLE
-- =====================================================
CREATE TABLE shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for fast lookups
CREATE INDEX idx_shops_created ON shops(created_at DESC);

-- =====================================================
-- 2. USERS TABLE (Profile, linked to Supabase Auth)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user'
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_users_shop ON users(shop_id);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- 3. FARMERS TABLE
-- =====================================================
CREATE TABLE farmers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    
    -- Future-proofing fields
    external_ref_id TEXT NULL,
    external_source TEXT NULL, -- 'bmc', 'servicetrack', 'cheque', etc
    external_meta JSONB NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_farmers_shop ON farmers(shop_id);
CREATE INDEX idx_farmers_external ON farmers(external_ref_id, external_source);
CREATE INDEX idx_farmers_phone ON farmers(phone);

-- =====================================================
-- 4. MILK INTAKE ENTRIES TABLE
-- =====================================================
CREATE TABLE milk_intake_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    
    -- Entry details
    date DATE NOT NULL,
    shift TEXT NOT NULL, -- 'Morning', 'Evening'
    animal TEXT NOT NULL DEFAULT 'cow', -- 'cow', 'buffalo'
    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2),
    snf DECIMAL(5, 2),
    rate_per_l DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    
    -- Reading mode (manual / future analyzer)
    reading_mode TEXT DEFAULT 'manual', -- 'manual', 'analyzer'
    
    -- Collection point (optional)
    collection_point_id UUID NULL,
    collection_point_name TEXT NULL,
    slip_number TEXT NULL,
    
    -- Images (JSON array of base64 or URLs)
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Edit tracking
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Future-proofing fields
    external_ref_id TEXT NULL,
    external_source TEXT NULL,
    external_meta JSONB NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_milk_entries_shop ON milk_intake_entries(shop_id);
CREATE INDEX idx_milk_entries_farmer ON milk_intake_entries(farmer_id);
CREATE INDEX idx_milk_entries_date ON milk_intake_entries(date DESC);
CREATE INDEX idx_milk_entries_external ON milk_intake_entries(external_ref_id, external_source);

-- =====================================================
-- 5. RETAIL SALES TABLE
-- =====================================================
CREATE TABLE retail_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Customer details
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    
    -- Sale details
    items JSONB NOT NULL, -- [{name, qty, rate, amount}]
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_mode TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'upi', 'credit'
    
    -- Future-proofing fields
    external_ref_id TEXT NULL,
    external_source TEXT NULL,
    external_meta JSONB NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_retail_sales_shop ON retail_sales(shop_id);
CREATE INDEX idx_retail_sales_date ON retail_sales(created_at DESC);
CREATE INDEX idx_retail_sales_external ON retail_sales(external_ref_id, external_source);

-- =====================================================
-- 6. BALANCES TABLE (Udhar / Advance)
-- =====================================================
CREATE TABLE balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Entity reference (farmer or customer)
    entity_type TEXT NOT NULL, -- 'farmer', 'customer'
    entity_id UUID NOT NULL,
    
    -- Balance details
    amount DECIMAL(12, 2) NOT NULL,
    balance_type TEXT NOT NULL DEFAULT 'udhar', -- 'udhar', 'advance'
    notes TEXT,
    
    -- Future-proofing fields
    external_ref_id TEXT NULL,
    external_source TEXT NULL,
    external_meta JSONB NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_balances_shop ON balances(shop_id);
CREATE INDEX idx_balances_entity ON balances(entity_type, entity_id);
CREATE INDEX idx_balances_external ON balances(external_ref_id, external_source);

-- =====================================================
-- 7. AUDIT EVENTS TABLE (Local trace only)
-- =====================================================
CREATE TABLE audit_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action TEXT NOT NULL, -- 'create', 'update', 'delete'
    entity TEXT NOT NULL, -- 'farmer', 'milk_entry', 'sale'
    entity_id UUID NOT NULL,
    
    -- Before/After snapshots
    before JSONB NULL,
    after JSONB NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_audit_shop ON audit_events(shop_id);
CREATE INDEX idx_audit_user ON audit_events(user_id);
CREATE INDEX idx_audit_entity ON audit_events(entity, entity_id);
CREATE INDEX idx_audit_date ON audit_events(created_at DESC);

-- =====================================================
-- 8. AUTO-UPDATE TRIGGERS (updated_at timestamps)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milk_entries_updated_at BEFORE UPDATE ON milk_intake_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retail_sales_updated_at BEFORE UPDATE ON retail_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_intake_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Shops: Users can see their own shop
CREATE POLICY shops_users_select ON shops
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.shop_id = shops.id
            AND users.id = auth.uid()
        )
    );

-- Users: Can see users in their shop
CREATE POLICY users_shop_select ON users
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Farmers: Users can see farmers in their shop
CREATE POLICY farmers_shop_select ON farmers
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY farmers_shop_insert ON farmers
    FOR INSERT
    WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY farmers_shop_update ON farmers
    FOR UPDATE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY farmers_shop_delete ON farmers
    FOR DELETE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Milk Entries: Users can see entries in their shop
CREATE POLICY milk_entries_shop_select ON milk_intake_entries
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY milk_entries_shop_insert ON milk_intake_entries
    FOR INSERT
    WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY milk_entries_shop_update ON milk_intake_entries
    FOR UPDATE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY milk_entries_shop_delete ON milk_intake_entries
    FOR DELETE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Retail Sales: Users can see sales in their shop
CREATE POLICY retail_sales_shop_select ON retail_sales
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY retail_sales_shop_insert ON retail_sales
    FOR INSERT
    WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY retail_sales_shop_update ON retail_sales
    FOR UPDATE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY retail_sales_shop_delete ON retail_sales
    FOR DELETE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Balances: Users can see balances in their shop
CREATE POLICY balances_shop_select ON balances
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY balances_shop_insert ON balances
    FOR INSERT
    WITH CHECK (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY balances_shop_update ON balances
    FOR UPDATE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY balances_shop_delete ON balances
    FOR DELETE
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Audit Events: Users can see audit events in their shop
CREATE POLICY audit_events_shop_select ON audit_events
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Function to create audit event
CREATE OR REPLACE FUNCTION create_audit_event(
    p_shop_id UUID,
    p_action TEXT,
    p_entity TEXT,
    p_entity_id UUID,
    p_before JSONB,
    p_after JSONB
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO audit_events (
        shop_id,
        user_id,
        action,
        entity,
        entity_id,
        before,
        after
    )
    VALUES (
        p_shop_id,
        auth.uid(),
        p_action,
        p_entity,
        p_entity_id,
        p_before,
        p_after
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Insert sample shop
-- INSERT INTO shops (id, name, location)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Gopal Dairy Shop', 'Vadgaon, Pune');

-- =====================================================
-- END OF SCHEMA
-- =====================================================
