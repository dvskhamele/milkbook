-- =====================================================
-- MilkBook - COMPLETE Database Setup
-- Run this ENTIRE script ONCE in Supabase SQL Editor
-- Creates ALL tables, functions, triggers, and policies
-- =====================================================

-- Enable UUID extension (required for UUID primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Shops table (stores shop/business information)
CREATE TABLE IF NOT EXISTS shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shop_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- DAIRY COLLECTION TABLES
-- =====================================================

-- Farmers table (milk suppliers)
CREATE TABLE IF NOT EXISTS farmers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    animal_type TEXT DEFAULT 'cow',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Milk intake entries (daily milk collection records)
CREATE TABLE IF NOT EXISTS milk_intake_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift TEXT NOT NULL,
    animal TEXT NOT NULL DEFAULT 'cow',
    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2),
    snf DECIMAL(5, 2),
    rate_per_l DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- POS/RETAIL TABLES
-- =====================================================

-- POS Customers (retail customers)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Retail sales (POS transactions)
CREATE TABLE IF NOT EXISTS retail_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_mode TEXT NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- INDEXES (for query performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_farmers_shop ON farmers(shop_id);
CREATE INDEX IF NOT EXISTS idx_farmers_active ON farmers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_milk_entries_shop ON milk_intake_entries(shop_id);
CREATE INDEX IF NOT EXISTS idx_milk_entries_farmer ON milk_intake_entries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_milk_entries_date ON milk_intake_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_retail_sales_shop ON retail_sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_retail_sales_date ON retail_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_shop ON users(shop_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_intake_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (Permissive - allows all operations)
-- =====================================================

-- Shops: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on shops" ON shops;
CREATE POLICY "Allow all operations on shops" ON shops
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Users: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Farmers: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on farmers" ON farmers;
CREATE POLICY "Allow all operations on farmers" ON farmers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Milk Entries: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on milk_intake_entries" ON milk_intake_entries;
CREATE POLICY "Allow all operations on milk_intake_entries" ON milk_intake_entries
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Customers: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
CREATE POLICY "Allow all operations on customers" ON customers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Retail Sales: Allow all operations
DROP POLICY IF EXISTS "Allow all operations on retail_sales" ON retail_sales;
CREATE POLICY "Allow all operations on retail_sales" ON retail_sales
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update farmer balance (called by API)
CREATE OR REPLACE FUNCTION update_farmer_balance(p_farmer_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE farmers 
    SET balance = balance + p_amount 
    WHERE id = p_farmer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile after signup (trigger)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO users (id, shop_id, shop_name, phone, role)
    VALUES (
        NEW.id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'shop_name', 'Unknown Shop'),
        NEW.raw_user_meta_data->>'phone',
        'admin'
    )
    ON CONFLICT (id) DO UPDATE 
    SET shop_name = COALESCE(NEW.raw_user_meta_data->>'shop_name', 'Unknown Shop'),
        phone = NEW.raw_user_meta_data->>'phone';
    
    -- Insert into shops table
    INSERT INTO shops (id, name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'shop_name', 'Unknown Shop'),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(NEW.raw_user_meta_data->>'shop_name', 'Unknown Shop'),
        phone = NEW.raw_user_meta_data->>'phone';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to create user profile after signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- You can uncomment this to create a test shop
-- INSERT INTO shops (id, name, phone) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Gopal Dairy Shop', '9876543210')
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all tables created
SELECT 
    '✅ Tables Created' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show all functions
SELECT 
    '✅ Functions Created' as status,
    COUNT(*) as total_functions
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

-- Show all triggers
SELECT 
    '✅ Triggers Created' as status,
    COUNT(*) as total_triggers
FROM pg_trigger 
WHERE tgname LIKE 'on_auth_user%';

-- =====================================================
-- DONE! ✅
-- =====================================================

-- All tables, functions, triggers, and policies are now created!
-- Your MilkBook backend is ready to use!
