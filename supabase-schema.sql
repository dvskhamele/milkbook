-- MilkRecord Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Shops table
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

-- =============================================
-- DAIRY COLLECTION TABLES
-- =============================================

-- Farmers table
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

-- Milk intake entries table
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

-- =============================================
-- POS/RETAIL TABLES
-- =============================================

-- POS Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Retail sales table
CREATE TABLE IF NOT EXISTS retail_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_mode TEXT NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_farmers_shop ON farmers(shop_id);
CREATE INDEX IF NOT EXISTS idx_farmers_active ON farmers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_milk_entries_shop ON milk_intake_entries(shop_id);
CREATE INDEX IF NOT EXISTS idx_milk_entries_farmer ON milk_intake_entries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_milk_entries_date ON milk_intake_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_retail_sales_shop ON retail_sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_retail_sales_date ON retail_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_shop ON users(shop_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_intake_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (Permissive - allows all for now)
-- =============================================

-- Shops: Users can view their own shop
CREATE POLICY "Users can view their shop" ON shops
    FOR SELECT
    USING (auth.uid() = id);

-- Users: Users can view their own profile
CREATE POLICY "Users can view their profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Farmers: Users can manage farmers for their shop
CREATE POLICY "Users can manage farmers" ON farmers
    FOR ALL
    USING (true);

-- Milk Entries: Users can manage entries for their shop
CREATE POLICY "Users can manage milk entries" ON milk_intake_entries
    FOR ALL
    USING (true);

-- Customers: Users can manage customers for their shop
CREATE POLICY "Users can manage customers" ON customers
    FOR ALL
    USING (true);

-- Retail Sales: Users can manage sales for their shop
CREATE POLICY "Users can manage retail sales" ON retail_sales
    FOR ALL
    USING (true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, shop_id, shop_name, phone, role)
    VALUES (
        NEW.id,
        NEW.id,
        NEW.raw_user_meta_data->>'shop_name',
        NEW.raw_user_meta_data->>'phone',
        'admin'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- =============================================
-- DONE!
-- =============================================

-- Verify tables were created:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
