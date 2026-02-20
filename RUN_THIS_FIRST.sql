-- =====================================================
-- RUN THIS FIRST! - Creates tables for POS to work
-- Copy ALL of this and paste in Supabase SQL Editor
-- =====================================================

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Retail sales table
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

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all on shops" ON shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on retail_sales" ON retail_sales FOR ALL USING (true) WITH CHECK (true);

-- Create default shop
INSERT INTO shops (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Shop')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION - Run this after to check
-- =====================================================

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shops', 'customers', 'retail_sales')
ORDER BY table_name;

-- Check retail_sales columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'retail_sales' 
ORDER BY ordinal_position;

-- =====================================================
-- DONE! Now POS will save to Supabase ✅
-- =====================================================
