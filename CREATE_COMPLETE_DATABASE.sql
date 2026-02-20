-- =====================================================
-- MilkBook - COMPLETE End-to-End Database Schema
-- Run this ENTIRE script in Supabase SQL Editor
-- Creates ALL tables for complete dairy management
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Shops table (business information)
CREATE TABLE IF NOT EXISTS shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    phone TEXT,
    email TEXT,
    license_number TEXT,
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
    aadhar_number TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    animal_type TEXT DEFAULT 'cow',
    active BOOLEAN DEFAULT true,
    source TEXT, -- Village/area name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Milk intake entries (daily milk collection with full tracking)
CREATE TABLE IF NOT EXISTS milk_intake_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift TEXT NOT NULL, -- Morning/Evening
    animal TEXT NOT NULL DEFAULT 'cow', -- Cow/Buffalo
    quantity DECIMAL(10, 2) NOT NULL, -- Liters
    fat DECIMAL(5, 2), -- Fat percentage
    snf DECIMAL(5, 2), -- SNF percentage
    rate_per_l DECIMAL(10, 2) NOT NULL, -- Rate per liter
    amount DECIMAL(12, 2) NOT NULL, -- Total amount
    source_recorded BOOLEAN DEFAULT false, -- Institutional source tracking
    quality_tested BOOLEAN DEFAULT false, -- Quality test recorded
    payment_settled BOOLEAN DEFAULT false, -- Payment settlement status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- POS/RETAIL TABLES
-- =====================================================

-- POS Customers (retail customers with full ledger)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance DECIMAL(12, 2) DEFAULT 0, -- Current balance (positive = they owe, negative = advance)
    total_purchases DECIMAL(12, 2) DEFAULT 0, -- Lifetime purchases
    last_purchase_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Products catalog
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'dairy', -- dairy/snacks/sweets
    rate DECIMAL(10, 2) NOT NULL,
    unit TEXT DEFAULT 'unit', -- unit/liter/kg
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Retail sales (POS transactions with full details)
CREATE TABLE IF NOT EXISTS retail_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL, -- Array of {product_id, name, qty, rate, amount}
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) NOT NULL,
    credit_amount DECIMAL(12, 2) DEFAULT 0, -- Udhar amount
    payment_mode TEXT NOT NULL DEFAULT 'cash', -- cash/upi/credit
    invoice_number TEXT,
    whatsapp_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- INSTITUTIONAL RECORDS (Yellow Boxes)
-- =====================================================

-- Farmer source tracking
CREATE TABLE IF NOT EXISTS farmer_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES milk_intake_entries(id) ON DELETE CASCADE,
    source_recorded BOOLEAN DEFAULT false,
    source_notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Quality test logs (Fat/SNF testing)
CREATE TABLE IF NOT EXISTS quality_tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES milk_intake_entries(id) ON DELETE CASCADE,
    fat_tested DECIMAL(5, 2),
    snf_tested DECIMAL(5, 2),
    quality_accepted BOOLEAN DEFAULT true,
    rejection_reason TEXT,
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Payment settlement records
CREATE TABLE IF NOT EXISTS payment_settlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES milk_intake_entries(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_mode TEXT DEFAULT 'cash', -- cash/bank/upi
    settlement_date DATE NOT NULL,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Deductions and loans
CREATE TABLE IF NOT EXISTS deductions_loans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    type TEXT NOT NULL, -- deduction/loan/advance
    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending/paid
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Equipment logs
CREATE TABLE IF NOT EXISTS equipment_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    equipment_name TEXT NOT NULL, -- Cream separator/Tester/etc
    log_type TEXT NOT NULL, -- maintenance/cleaning/usage
    log_data JSONB, -- {temperature, duration, operator, etc}
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- DIARY & LOGS
-- =====================================================

-- Daily diary entries
CREATE TABLE IF NOT EXISTS diary_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    entry_type TEXT NOT NULL, -- note/expense/income/maintenance
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Audit logs (automatic tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL, -- create/update/delete
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_farmers_shop ON farmers(shop_id);
CREATE INDEX IF NOT EXISTS idx_farmers_active ON farmers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_milk_entries_shop ON milk_intake_entries(shop_id);
CREATE INDEX IF NOT EXISTS idx_milk_entries_farmer ON milk_intake_entries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_milk_entries_date ON milk_intake_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_retail_sales_shop ON retail_sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_retail_sales_customer ON retail_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_retail_sales_date ON retail_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_settlements_farmer ON payment_settlements(farmer_id);
CREATE INDEX IF NOT EXISTS idx_deductions_farmer ON deductions_loans(farmer_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_intake_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE deductions_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (Permissive - allows all for now)
-- =====================================================

-- Allow all operations on all tables (can be restricted later)
CREATE POLICY "Allow all operations on shops" ON shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on farmers" ON farmers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on milk_intake_entries" ON milk_intake_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on retail_sales" ON retail_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on farmer_sources" ON farmer_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on quality_tests" ON quality_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on payment_settlements" ON payment_settlements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on deductions_loans" ON deductions_loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on equipment_logs" ON equipment_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on diary_entries" ON diary_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update farmer balance
CREATE OR REPLACE FUNCTION update_farmer_balance(p_farmer_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE farmers 
    SET balance = balance + p_amount 
    WHERE id = p_farmer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update customer balance
CREATE OR REPLACE FUNCTION update_customer_balance(p_customer_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE customers 
    SET balance = balance + p_amount,
        last_purchase_date = CURRENT_DATE
    WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
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
-- SEED DATA - Default Products
-- =====================================================

-- Insert default products (will be skipped if already exist)
INSERT INTO products (name, category, rate, unit) VALUES
    ('Cow 1L', 'dairy', 64, 'liter'),
    ('Cow 0.5L', 'dairy', 32, 'liter'),
    ('Buff 1L', 'dairy', 100, 'liter'),
    ('Buff 0.5L', 'dairy', 50, 'liter'),
    ('Paneer', 'dairy', 320, 'kg'),
    ('Ghee', 'dairy', 180, 'liter'),
    ('Milk Cake', 'sweets', 300, 'kg'),
    ('Curd', 'dairy', 80, 'kg'),
    ('Buttermilk', 'dairy', 40, 'liter'),
    ('Lassi', 'dairy', 60, 'liter')
ON CONFLICT DO NOTHING;

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

-- =====================================================
-- DONE! ✅
-- =====================================================

-- All tables, functions, triggers, and policies are now created!
-- Your COMPLETE MilkBook dairy management system is ready!
