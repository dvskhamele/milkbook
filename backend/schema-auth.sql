-- =====================================================
-- MilkBook Dairy Shop - Account Creation & Auth System
-- Supabase Auth with Password/PIN Login
-- =====================================================
-- Philosophy:
-- - Simple account creation (Shop + User in one flow)
-- - Password OR 6-digit PIN login
-- - Hard backend blocking on subscription expiry
-- - Module-level access control
-- - No OAuth (email/password or mobile/PIN only)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" FOR password hashing;

-- =====================================================
-- 1. UPDATE USERS TABLE (Add Password/PIN Fields)
-- =====================================================

-- Add password_hash and pin_hash to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT NULL,
ADD COLUMN IF NOT EXISTS pin_hash TEXT NULL,
ADD COLUMN IF NOT EXISTS mobile TEXT NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE NULL;

-- Index for login lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- =====================================================
-- 2. HELPER FUNCTIONS FOR AUTH
-- =====================================================

-- Function to hash password (bcrypt-style using pgcrypto)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (hash = crypt(password, hash));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash PIN (6-digit numeric)
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Validate PIN is 6 digits
    IF pin !~ '^[0-9]{6}$' THEN
        RAISE EXCEPTION 'PIN must be 6 digits';
    END IF;
    
    -- Simple hash: PIN * secret + timestamp
    RETURN md5(pin || 'milkbook_secret_salt_' || EXTRACT(EPOCH FROM NOW())::TEXT);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify PIN
CREATE OR REPLACE FUNCTION verify_pin(pin TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    computed_hash TEXT;
BEGIN
    -- For PIN verification, we store the actual PIN hash
    -- This is simplified - in production use proper PIN verification
    RETURN (hash = md5(pin || 'milkbook_secret_salt'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. CREATE ACCOUNT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_dairy_account(
    p_shop_name TEXT,
    p_owner_name TEXT,
    p_mobile TEXT,
    p_password TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL
)
RETURNS TABLE (
    shop_id UUID,
    user_id UUID,
    subscription_id UUID,
    trial_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_shop_id UUID;
    v_user_id UUID;
    v_subscription_id UUID;
    v_trial_end TIMESTAMP WITH TIME ZONE;
    v_password_hash TEXT;
    v_pin_hash TEXT;
BEGIN
    -- Validate: Either password OR pin must be provided
    IF p_password IS NULL AND p_pin IS NULL THEN
        RAISE EXCEPTION 'Either password or PIN must be provided';
    END IF;
    
    -- Validate PIN format if provided
    IF p_pin IS NOT NULL AND p_pin !~ '^[0-9]{6}$' THEN
        RAISE EXCEPTION 'PIN must be 6 digits';
    END IF;
    
    -- Create shop
    INSERT INTO shops (name, location)
    VALUES (p_shop_name, p_location)
    RETURNING id INTO v_shop_id;
    
    -- Hash password/PIN
    IF p_password IS NOT NULL THEN
        v_password_hash := hash_password(p_password);
    END IF;
    
    IF p_pin IS NOT NULL THEN
        v_pin_hash := md5(p_pin || 'milkbook_secret_salt'); -- Simplified for demo
    END IF;
    
    -- Create user (admin role)
    -- First create in auth.users via Supabase RPC or use direct insert
    -- For simplicity, we'll insert directly (in production use Supabase Auth API)
    INSERT INTO users (
        shop_id,
        role,
        mobile,
        password_hash,
        pin_hash,
        is_active
    ) VALUES (
        v_shop_id,
        'admin',
        p_mobile,
        v_password_hash,
        v_pin_hash,
        TRUE
    )
    RETURNING id INTO v_user_id;
    
    -- Create trial subscription (30 days)
    v_trial_end := NOW() + INTERVAL '30 days';
    
    INSERT INTO subscriptions (
        shop_id,
        plan_type,
        status,
        trial_start,
        trial_end,
        amount_paid
    ) VALUES (
        v_shop_id,
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
        v_shop_id,
        'trial_started',
        'Account creation - 30 day trial'
    );
    
    -- Enable base modules (free ones)
    INSERT INTO shop_modules (shop_id, module_id, enabled, activated_at)
    SELECT v_shop_id, id, TRUE, NOW()
    FROM modules
    WHERE price = 0;
    
    -- Return account details
    RETURN QUERY SELECT v_shop_id, v_user_id, v_subscription_id, v_trial_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. LOGIN FUNCTION (Password or PIN)
-- =====================================================

CREATE OR REPLACE FUNCTION login_user(
    p_identifier TEXT, -- mobile number or user_id
    p_password TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    shop_id UUID,
    role TEXT,
    subscription_status TEXT,
    trial_days_remaining INTEGER,
    enabled_modules JSONB
) AS $$
DECLARE
    v_user RECORD;
    v_subscription subscriptions%ROWTYPE;
    v_days_remaining INTEGER;
    v_modules JSONB;
BEGIN
    -- Find user by mobile or ID
    SELECT * INTO v_user
    FROM users
    WHERE (mobile = p_identifier OR id::TEXT = p_identifier)
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or inactive';
    END IF;
    
    -- Verify password or PIN
    IF p_password IS NOT NULL THEN
        IF NOT verify_password(p_password, v_user.password_hash) THEN
            RAISE EXCEPTION 'Invalid password';
        END IF;
    ELSIF p_pin IS NOT NULL THEN
        IF NOT verify_pin(p_pin, v_user.pin_hash) THEN
            RAISE EXCEPTION 'Invalid PIN';
        END IF;
    ELSE
        RAISE EXCEPTION 'Password or PIN required';
    END IF;
    
    -- Update last login
    UPDATE users SET last_login = NOW() WHERE id = v_user.id;
    
    -- Get subscription status
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE shop_id = v_user.shop_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if expired
    IF v_subscription.id IS NOT NULL THEN
        IF v_subscription.paid_end IS NOT NULL AND v_subscription.paid_end < NOW() THEN
            UPDATE subscriptions 
            SET status = 'expired' 
            WHERE id = v_subscription.id;
            v_subscription.status := 'expired';
        ELSIF v_subscription.trial_end IS NOT NULL AND v_subscription.trial_end < NOW() 
              AND v_subscription.paid_end IS NULL THEN
            UPDATE subscriptions 
            SET status = 'expired' 
            WHERE id = v_subscription.id;
            v_subscription.status := 'expired';
        END IF;
        
        -- Calculate days remaining
        IF v_subscription.paid_end IS NOT NULL THEN
            v_days_remaining := EXTRACT(DAY FROM (v_subscription.paid_end - NOW()))::INTEGER;
        ELSIF v_subscription.trial_end IS NOT NULL THEN
            v_days_remaining := EXTRACT(DAY FROM (v_subscription.trial_end - NOW()))::INTEGER;
        ELSE
            v_days_remaining := 0;
        END IF;
    ELSE
        v_subscription.status := 'none';
        v_days_remaining := 0;
    END IF;
    
    -- Get enabled modules
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', m.module_id,
                'name', mod.name,
                'enabled', m.enabled
            )
        ),
        '[]'::jsonb
    ) INTO v_modules
    FROM shop_modules m
    LEFT JOIN modules mod ON m.module_id = mod.id
    WHERE m.shop_id = v_user.shop_id
    AND m.enabled = TRUE;
    
    -- Return login details
    RETURN QUERY SELECT 
        v_user.id,
        v_user.shop_id,
        v_user.role,
        v_subscription.status,
        v_days_remaining,
        v_modules;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. SUBSCRIPTION GUARD FUNCTION (Middleware Logic)
-- =====================================================

-- Function to check if user can perform write operations
CREATE OR REPLACE FUNCTION can_write_data(p_shop_id UUID)
RETURNS TABLE (
    allowed BOOLEAN,
    reason TEXT,
    subscription_status TEXT,
    trial_days_remaining INTEGER
) AS $$
DECLARE
    v_subscription subscriptions%ROWTYPE;
    v_days_remaining INTEGER;
BEGIN
    -- Get active subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE shop_id = p_shop_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE, 
            'No active subscription'::TEXT, 
            'none'::TEXT, 
            0;
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_subscription.paid_end IS NOT NULL AND v_subscription.paid_end < NOW() THEN
        UPDATE subscriptions SET status = 'expired' WHERE id = v_subscription.id;
        RETURN QUERY SELECT 
            FALSE, 
            'Subscription expired'::TEXT, 
            'expired'::TEXT, 
            0;
        RETURN;
    ELSIF v_subscription.trial_end IS NOT NULL AND v_subscription.trial_end < NOW() 
          AND v_subscription.paid_end IS NULL THEN
        UPDATE subscriptions SET status = 'expired' WHERE id = v_subscription.id;
        RETURN QUERY SELECT 
            FALSE, 
            'Trial expired'::TEXT, 
            'expired'::TEXT, 
            0;
        RETURN;
    END IF;
    
    -- Calculate days remaining
    IF v_subscription.paid_end IS NOT NULL THEN
        v_days_remaining := EXTRACT(DAY FROM (v_subscription.paid_end - NOW()))::INTEGER;
    ELSIF v_subscription.trial_end IS NOT NULL THEN
        v_days_remaining := EXTRACT(DAY FROM (v_subscription.trial_end - NOW()))::INTEGER;
    ELSE
        v_days_remaining := 0;
    END IF;
    
    -- Subscription is active
    RETURN QUERY SELECT 
        TRUE, 
        'OK'::TEXT, 
        v_subscription.status, 
        v_days_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. MODULE GUARD FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION can_use_module(p_shop_id UUID, p_module_id TEXT)
RETURNS TABLE (
    allowed BOOLEAN,
    reason TEXT,
    module_name TEXT
) AS $$
DECLARE
    v_module_enabled BOOLEAN;
    v_module_name TEXT;
BEGIN
    -- Check if module exists and is enabled
    SELECT m.enabled, mod.name 
    INTO v_module_enabled, v_module_name
    FROM shop_modules m
    LEFT JOIN modules mod ON m.module_id = mod.id
    WHERE m.shop_id = p_shop_id 
    AND m.module_id = p_module_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE, 
            'Module not found'::TEXT, 
            NULL::TEXT;
        RETURN;
    END IF;
    
    IF NOT v_module_enabled THEN
        RETURN QUERY SELECT 
            FALSE, 
            'Module not enabled'::TEXT, 
            v_module_name;
        RETURN;
    END IF;
    
    -- Module is enabled
    RETURN QUERY SELECT 
        TRUE, 
        'OK'::TEXT, 
        v_module_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. UPGRADE SUBSCRIPTION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION upgrade_subscription(
    p_shop_id UUID,
    p_amount INTEGER,
    p_payment_reference TEXT DEFAULT NULL
)
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
        COALESCE(p_payment_reference, 'Annual plan upgrade')
    );
    
    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. RLS POLICIES FOR AUTH
-- =====================================================

-- Users can only see their own profile
CREATE POLICY users_profile_select ON users
    FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY users_profile_update ON users
    FOR UPDATE
    USING (id = auth.uid());

-- =====================================================
-- 9. SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Create test account with password
-- SELECT * FROM create_dairy_account(
--     'Test Dairy Shop',
--     'Test Owner',
--     '9876543210',
--     'password123',  -- password
--     NULL,           -- no PIN
--     'Test Location'
-- );

-- Create test account with PIN
-- SELECT * FROM create_dairy_account(
--     'PIN Dairy Shop',
--     'PIN Owner',
--     '9876543211',
--     NULL,           -- no password
--     '123456',       -- 6-digit PIN
--     'Test Location'
-- );

-- Test login with password
-- SELECT * FROM login_user('9876543210', 'password123', NULL);

-- Test login with PIN
-- SELECT * FROM login_user('9876543211', NULL, '123456');

-- Test subscription guard
-- SELECT * FROM can_write_data('shop-id-here');

-- Test module guard
-- SELECT * FROM can_use_module('shop-id-here', 'retail_pos');

-- =====================================================
-- END OF AUTH & ACCOUNT CREATION SCHEMA
-- =====================================================
