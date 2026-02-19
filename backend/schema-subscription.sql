-- =====================================================
-- MilkBook Dairy Shop - Subscription & Module System
-- Supabase Schema with Trial, Annual Plans & Modules
-- =====================================================
-- Philosophy:
-- - 1 month FREE trial, then ₹2000/year
-- - Module-based feature access
-- - API enforcement (not frontend)
-- - Data never deleted, never blocked for reading
-- - Future-proof for paid modules
-- =====================================================

-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'annual'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled'
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    paid_start TIMESTAMP WITH TIME ZONE,
    paid_end TIMESTAMP WITH TIME ZONE,
    amount_paid INTEGER DEFAULT 0, -- in paise (₹2000 = 200000)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_subscriptions_shop ON subscriptions(shop_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(trial_end, paid_end);

-- Unique constraint (one active subscription per shop)
CREATE UNIQUE INDEX idx_subscriptions_active_per_shop 
ON subscriptions(shop_id) 
WHERE status = 'active';

-- =====================================================
-- 2. BILLING EVENTS TABLE
-- =====================================================
CREATE TABLE billing_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'trial_started', 'payment_received', 'expired', 'cancelled'
    amount INTEGER DEFAULT 0, -- in paise
    reference TEXT, -- Payment reference/note
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_billing_events_shop ON billing_events(shop_id);
CREATE INDEX idx_billing_events_type ON billing_events(type);
CREATE INDEX idx_billing_events_date ON billing_events(created_at DESC);

-- =====================================================
-- 3. MODULES TABLE (Available Modules)
-- =====================================================
CREATE TABLE modules (
    id TEXT PRIMARY KEY, -- 'retail_pos', 'farmer_collection', 'cheque', etc.
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER DEFAULT 0, -- annual price in paise
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert base modules
INSERT INTO modules (id, name, description, price, is_active) VALUES
('retail_pos', 'Retail POS', 'Point of sale for dairy shop', 0, TRUE),
('farmer_collection', 'Farmer Collection', 'Milk collection from farmers', 0, TRUE),
('export', 'Data Export', 'Export data to CSV/Excel', 0, TRUE),
('reports', 'Basic Reports', 'Daily and monthly reports', 0, TRUE),
('cheque', 'Cheque Management', 'Track cheque payments', 50000, TRUE), -- ₹500/year
('loan', 'Loan Management', 'Manage loans and advances', 50000, TRUE), -- ₹500/year
('servicetrack', 'Service Track', 'Equipment maintenance tracking', 75000, TRUE), -- ₹750/year
('advanced_reports', 'Advanced Reports', 'Detailed analytics', 100000, TRUE), -- ₹1000/year
('multi_user', 'Multi-User', 'Multiple cashiers/users', 50000, TRUE) -- ₹500/year
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. SHOP MODULES TABLE (Enabled Modules per Shop)
-- =====================================================
CREATE TABLE shop_modules (
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (shop_id, module_id)
);

-- Indexes
CREATE INDEX idx_shop_modules_shop ON shop_modules(shop_id);
CREATE INDEX idx_shop_modules_module ON shop_modules(module_id);
CREATE INDEX idx_shop_modules_enabled ON shop_modules(enabled);

-- =====================================================
-- 5. UPDATE EXISTING TABLES (Future-Proof Fields)
-- =====================================================

-- Add subscription/module tracking to key tables
ALTER TABLE farmers 
ADD COLUMN external_ref_id TEXT NULL,
ADD COLUMN external_source TEXT NULL,
ADD COLUMN external_meta JSONB NULL;

ALTER TABLE milk_intake_entries 
ADD COLUMN external_ref_id TEXT NULL,
ADD COLUMN external_source TEXT NULL,
ADD COLUMN external_meta JSONB NULL;

ALTER TABLE retail_sales 
ADD COLUMN external_ref_id TEXT NULL,
ADD COLUMN external_source TEXT NULL,
ADD COLUMN external_meta JSONB NULL;

ALTER TABLE balances 
ADD COLUMN external_ref_id TEXT NULL,
ADD COLUMN external_source TEXT NULL,
ADD COLUMN external_meta JSONB NULL;

-- Indexes for external refs
CREATE INDEX idx_farmers_external ON farmers(external_ref_id, external_source);
CREATE INDEX idx_milk_entries_external ON milk_intake_entries(external_ref_id, external_source);
CREATE INDEX idx_retail_sales_external ON retail_sales(external_ref_id, external_source);
CREATE INDEX idx_balances_external ON balances(external_ref_id, external_source);

-- =====================================================
-- 6. AUTO-UPDATE TRIGGERS
-- =====================================================

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(p_shop_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
    v_trial_end TIMESTAMP WITH TIME ZONE;
    v_paid_end TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT status, trial_end, paid_end 
    INTO v_status, v_trial_end, v_paid_end
    FROM subscriptions 
    WHERE shop_id = p_shop_id 
    AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if expired
    IF v_status = 'active' THEN
        IF v_paid_end IS NOT NULL AND v_paid_end < NOW() THEN
            -- Update status to expired
            UPDATE subscriptions 
            SET status = 'expired', updated_at = NOW()
            WHERE shop_id = p_shop_id;
            RETURN FALSE;
        ELSIF v_trial_end IS NOT NULL AND v_trial_end < NOW() AND v_paid_end IS NULL THEN
            -- Trial expired, no paid subscription
            UPDATE subscriptions 
            SET status = 'expired', updated_at = NOW()
            WHERE shop_id = p_shop_id;
            RETURN FALSE;
        END IF;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if module is enabled
CREATE OR REPLACE FUNCTION is_module_enabled(p_shop_id UUID, p_module_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_enabled BOOLEAN;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT enabled, expires_at 
    INTO v_enabled, v_expires_at
    FROM shop_modules 
    WHERE shop_id = p_shop_id 
    AND module_id = p_module_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if expired
    IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
        RETURN FALSE;
    END IF;
    
    RETURN v_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create trial subscription for new shop
CREATE OR REPLACE FUNCTION create_trial_subscription(p_shop_id UUID)
RETURNS UUID AS $$
DECLARE
    v_subscription_id UUID;
    v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate trial end (30 days from now)
    v_trial_end := NOW() + INTERVAL '30 days';
    
    -- Create trial subscription
    INSERT INTO subscriptions (
        shop_id,
        plan_type,
        status,
        trial_start,
        trial_end,
        amount_paid
    ) VALUES (
        p_shop_id,
        'trial',
        'active',
        NOW(),
        v_trial_end,
        0
    ) RETURNING id INTO v_subscription_id;
    
    -- Log billing event
    INSERT INTO billing_events (
        shop_id,
        type,
        reference
    ) VALUES (
        p_shop_id,
        'trial_started',
        'Automatic 30-day trial'
    );
    
    -- Enable base modules
    INSERT INTO shop_modules (shop_id, module_id, enabled, activated_at)
    SELECT p_shop_id, id, TRUE, NOW()
    FROM modules
    WHERE price = 0; -- Free modules
    
    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade to annual plan
CREATE OR REPLACE FUNCTION upgrade_to_annual(p_shop_id UUID, p_amount INTEGER)
RETURNS UUID AS $$
DECLARE
    v_subscription_id UUID;
    v_paid_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate paid end (365 days from now)
    v_paid_end := NOW() + INTERVAL '365 days';
    
    -- Deactivate old subscription
    UPDATE subscriptions 
    SET status = 'cancelled', updated_at = NOW()
    WHERE shop_id = p_shop_id 
    AND status = 'active';
    
    -- Create new annual subscription
    INSERT INTO subscriptions (
        shop_id,
        plan_type,
        status,
        paid_start,
        paid_end,
        amount_paid
    ) VALUES (
        p_shop_id,
        'annual',
        'active',
        NOW(),
        v_paid_end,
        p_amount
    ) RETURNING id INTO v_subscription_id;
    
    -- Log billing event
    INSERT INTO billing_events (
        shop_id,
        type,
        amount,
        reference
    ) VALUES (
        p_shop_id,
        'payment_received',
        p_amount,
        'Annual plan upgrade'
    );
    
    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable module for shop
CREATE OR REPLACE FUNCTION enable_shop_module(p_shop_id UUID, p_module_id TEXT, p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO shop_modules (shop_id, module_id, enabled, activated_at, expires_at)
    VALUES (p_shop_id, p_module_id, TRUE, NOW(), p_expires_at)
    ON CONFLICT (shop_id, module_id) DO UPDATE
    SET enabled = TRUE, 
        activated_at = NOW(),
        expires_at = p_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable module for shop
CREATE OR REPLACE FUNCTION disable_shop_module(p_shop_id UUID, p_module_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE shop_modules 
    SET enabled = FALSE 
    WHERE shop_id = p_shop_id 
    AND module_id = p_module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_modules ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can see their own shop's subscription
CREATE POLICY subscriptions_shop_select ON subscriptions
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Billing events: Users can see their own shop's events
CREATE POLICY billing_events_shop_select ON billing_events
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Modules: Everyone can read available modules
CREATE POLICY modules_select ON modules
    FOR SELECT
    USING (TRUE);

-- Shop modules: Users can see their own shop's modules
CREATE POLICY shop_modules_shop_select ON shop_modules
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- =====================================================
-- 9. TRIGGERS FOR NEW SHOPS
-- =====================================================

-- Auto-create trial subscription when new shop is created
CREATE OR REPLACE FUNCTION auto_create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_trial_subscription(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_trial_subscription
    AFTER INSERT ON shops
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_trial_subscription();

-- =====================================================
-- 10. SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Sample shop with trial
-- INSERT INTO shops (id, name, location)
-- VALUES ('shop-001', 'Gopal Dairy Shop', 'Vadgaon, Pune');

-- Subscription will be auto-created by trigger

-- =====================================================
-- END OF SUBSCRIPTION & MODULE SCHEMA
-- =====================================================
