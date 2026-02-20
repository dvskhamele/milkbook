-- =====================================================
-- MilkBook - MINIMUM VIABLE DATABASE
-- Run this FIRST before anything else!
-- Creates ONLY essential tables and columns
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ESSENTIAL TABLES (Minimum for POS to work)
-- =====================================================

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Customers table (for POS)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Retail sales table (for POS) - WITH ALL COLUMNS
CREATE TABLE IF NOT EXISTS retail_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID,
    customer_id UUID,
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2),
    credit_amount DECIMAL(12, 2) DEFAULT 0,
    payment_mode TEXT NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- ENABLE RLS (Row Level Security)
-- =====================================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ALLOW ALL OPERATIONS (for testing)
-- =====================================================

CREATE POLICY "Allow all on shops" ON shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on retail_sales" ON retail_sales FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- SEED DATA - Create a default shop
-- =====================================================

INSERT INTO shops (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Shop')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check tables exist
SELECT '✅ Tables Created' as status, COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('shops', 'customers', 'retail_sales');

-- List columns in retail_sales
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'retail_sales' 
ORDER BY ordinal_position;

-- =====================================================
-- DONE! ✅
-- =====================================================

-- Now your POS will save to Supabase!
