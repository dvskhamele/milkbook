-- MilkBook Database Integration Script
-- Run this in Supabase SQL Editor to create missing tables
-- OR adapt to work with existing MilkBook tables

-- ============================================
-- Check if tables exist (MilkBook existing schema)
-- ============================================

-- This script will:
-- 1. Check for existing MilkBook tables
-- 2. Create missing tables for POS functionality
-- 3. Add compatibility columns if needed

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'all',
    price DECIMAL(10, 2) NOT NULL,
    unit TEXT DEFAULT 'unit',
    emoji TEXT DEFAULT '📦',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance DECIMAL(10, 2) DEFAULT 0,
    gst_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    items JSONB,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_mode TEXT DEFAULT 'cash', -- cash, upi, credit
    payment_status TEXT DEFAULT 'paid', -- paid, partial, unpaid
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(payment_mode);

-- ============================================
-- FARMERS TABLE (if not exists in MilkBook)
-- ============================================
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    animal_type TEXT DEFAULT 'cow', -- cow, buffalo, both
    balance DECIMAL(10, 2) DEFAULT 0,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);
CREATE INDEX IF NOT EXISTS idx_farmers_active ON farmers(is_active);

-- ============================================
-- MILK COLLECTIONS TABLE (MilkBook existing)
-- ============================================
CREATE TABLE IF NOT EXISTS milk_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES farmers(id),
    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2),
    snf DECIMAL(5, 2),
    rate DECIMAL(10, 2),
    amount DECIMAL(10, 2),
    shift TEXT DEFAULT 'morning',
    collection_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_farmer ON milk_collections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_collections_date ON milk_collections(collection_date DESC);

-- ============================================
-- RLS POLICIES (Row Level Security)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_collections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all
CREATE POLICY "Allow authenticated read products" ON products FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read customers" ON customers FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read sales" ON sales FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read farmers" ON farmers FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read collections" ON milk_collections FOR SELECT
    TO authenticated USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert products" ON products FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert customers" ON customers FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert sales" ON sales FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert farmers" ON farmers FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert collections" ON milk_collections FOR INSERT
    TO authenticated WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update products" ON products FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated update customers" ON customers FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated update sales" ON sales FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated update farmers" ON farmers FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated update collections" ON milk_collections FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete products" ON products FOR DELETE
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete customers" ON customers FOR DELETE
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete sales" ON sales FOR DELETE
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete farmers" ON farmers FOR DELETE
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete collections" ON milk_collections FOR DELETE
    TO authenticated USING (true);

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

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON milk_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample products if table is empty
INSERT INTO products (name, category, price, unit, emoji)
SELECT * FROM (VALUES
    ('Cow Milk', 'milk', 64.00, 'L', '🥛'),
    ('Buffalo Milk', 'milk', 72.00, 'L', '🥛'),
    ('Paneer', 'paneer', 400.00, 'kg', '🧀'),
    ('Ghee', 'ghee', 600.00, 'L', '🧈'),
    ('Curd', 'curd', 80.00, 'kg', '🥣'),
    ('Lassi', 'curd', 60.00, 'glass', '🥣'),
    ('Barfi', 'sweets', 300.00, 'kg', '🍬'),
    ('Jalebi', 'sweets', 200.00, 'kg', '🍬'),
    ('Bread', 'bakery', 40.00, 'pkt', '🥐'),
    ('Biscuits', 'bakery', 30.00, 'pkt', '🥐')
) AS v(name, category, price, unit, emoji)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify all tables are created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('products', 'customers', 'sales', 'farmers', 'milk_collections')
-- ORDER BY table_name;
