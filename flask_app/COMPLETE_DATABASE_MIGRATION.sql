-- ============================================
-- MilkBook + MilkRecord POS - SIMPLE SAFE Migration
-- Run this ONCE in Supabase SQL Editor
-- Creates ONLY NEW tables (won't touch existing MilkBook tables)
-- Safe to run multiple times
-- ============================================

-- ============================================
-- 1. PRODUCTS TABLE (POS New)
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

-- ============================================
-- 2. CUSTOMERS TABLE (POS New)
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

-- ============================================
-- 3. SALES TABLE (POS New)
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_name TEXT,
    items JSONB,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_mode TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'paid',
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. SHOP SETTINGS TABLE (POS New)
-- ============================================
CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name TEXT NOT NULL,
    shop_phone TEXT,
    shop_email TEXT,
    shop_address TEXT,
    shop_city TEXT,
    shop_pincode TEXT,
    shop_gst TEXT,
    shop_pan TEXT,
    shop_upi TEXT,
    shop_bank TEXT,
    shop_account TEXT,
    shop_ifsc TEXT,
    shop_account_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. ADVANCE ORDERS TABLE (POS New)
-- ============================================
CREATE TABLE IF NOT EXISTS advance_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_name TEXT,
    items JSONB,
    total_amount DECIMAL(10, 2) NOT NULL,
    advance_paid DECIMAL(10, 2) DEFAULT 0,
    delivery_date DATE,
    delivery_time TIME,
    delivery_location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. SYNC LOGS TABLE (For Offline Sync)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT,
    table_name TEXT NOT NULL,
    record_id UUID,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. DEVICES TABLE (For Multi-Device)
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name TEXT,
    device_type TEXT,
    device_id TEXT UNIQUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(payment_mode);

CREATE INDEX IF NOT EXISTS idx_advance_orders_customer ON advance_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_advance_orders_date ON advance_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_advance_orders_status ON advance_orders(status);

CREATE INDEX IF NOT EXISTS idx_sync_logs_device ON sync_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_date ON sync_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(is_active);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated read" ON products;
DROP POLICY IF EXISTS "Allow authenticated read" ON customers;
DROP POLICY IF EXISTS "Allow authenticated read" ON sales;
DROP POLICY IF EXISTS "Allow authenticated read" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated read" ON advance_orders;
DROP POLICY IF EXISTS "Allow authenticated read" ON sync_logs;
DROP POLICY IF EXISTS "Allow authenticated read" ON devices;

DROP POLICY IF EXISTS "Allow authenticated insert" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert" ON customers;
DROP POLICY IF EXISTS "Allow authenticated insert" ON sales;
DROP POLICY IF EXISTS "Allow authenticated insert" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated insert" ON advance_orders;
DROP POLICY IF EXISTS "Allow authenticated insert" ON sync_logs;
DROP POLICY IF EXISTS "Allow authenticated insert" ON devices;

DROP POLICY IF EXISTS "Allow authenticated update" ON products;
DROP POLICY IF EXISTS "Allow authenticated update" ON customers;
DROP POLICY IF EXISTS "Allow authenticated update" ON sales;
DROP POLICY IF EXISTS "Allow authenticated update" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated update" ON advance_orders;
DROP POLICY IF EXISTS "Allow authenticated update" ON sync_logs;
DROP POLICY IF EXISTS "Allow authenticated update" ON devices;

DROP POLICY IF EXISTS "Allow authenticated delete" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete" ON customers;
DROP POLICY IF EXISTS "Allow authenticated delete" ON sales;
DROP POLICY IF EXISTS "Allow authenticated delete" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated delete" ON advance_orders;
DROP POLICY IF EXISTS "Allow authenticated delete" ON sync_logs;
DROP POLICY IF EXISTS "Allow authenticated delete" ON devices;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Read policies
CREATE POLICY "Allow authenticated read" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON shop_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON advance_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON sync_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON devices FOR SELECT TO authenticated USING (true);

-- Insert policies
CREATE POLICY "Allow authenticated insert" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON shop_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON advance_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON sync_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert" ON devices FOR INSERT TO authenticated WITH CHECK (true);

-- Update policies
CREATE POLICY "Allow authenticated update" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON sales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON shop_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON advance_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON sync_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON devices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Delete policies
CREATE POLICY "Allow authenticated delete" ON products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON customers FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON sales FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON shop_settings FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON advance_orders FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON sync_logs FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON devices FOR DELETE TO authenticated USING (true);

-- ============================================
-- CREATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
DROP TRIGGER IF EXISTS update_shop_settings_updated_at ON shop_settings;
DROP TRIGGER IF EXISTS update_advance_orders_updated_at ON advance_orders;
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON shop_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advance_orders_updated_at BEFORE UPDATE ON advance_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT SAMPLE PRODUCTS (only if empty)
-- ============================================

INSERT INTO products (name, category, price, unit, emoji)
SELECT * FROM (VALUES
    ('Cow Milk', 'milk', 64.00, 'L', '🥛'),
    ('Buffalo Milk', 'milk', 72.00, 'L', '🥛'),
    ('Paneer', 'paneer', 400.00, 'kg', '🧀'),
    ('Paneer 500g', 'paneer', 200.00, '500g', '🧀'),
    ('Paneer 250g', 'paneer', 100.00, '250g', '🧀'),
    ('Ghee', 'ghee', 600.00, 'L', '🧈'),
    ('Ghee 500ml', 'ghee', 300.00, '500ml', '🧈'),
    ('Curd', 'curd', 80.00, 'kg', '🥣'),
    ('Curd 500g', 'curd', 40.00, '500g', '🥣'),
    ('Lassi', 'curd', 60.00, 'glass', '🥣'),
    ('Barfi', 'sweets', 300.00, 'kg', '🍬'),
    ('Jalebi', 'sweets', 200.00, 'kg', '🍬'),
    ('Milk Cake', 'sweets', 250.00, 'kg', '🍬'),
    ('Bread', 'bakery', 40.00, 'pkt', '🥐'),
    ('Biscuits', 'bakery', 30.00, 'pkt', '🥐'),
    ('Rusk', 'bakery', 50.00, 'pkt', '🥐'),
    ('Khoya', 'milk', 400.00, 'kg', '🥛'),
    ('Khoya 250g', 'milk', 100.00, '250g', '🥛'),
    ('Cake', 'sweets', 250.00, 'Birthday Box', '🎂'),
    ('Cake 500g', 'sweets', 150.00, '500g', '🎂')
) AS v(name, category, price, unit, emoji)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- ============================================
-- INSERT DEFAULT SHOP SETTINGS (only if empty)
-- ============================================

INSERT INTO shop_settings (shop_name, shop_phone, shop_city, shop_pincode)
SELECT 'Gopal Dairy', '9876543210', 'Pune', '411001'
WHERE NOT EXISTS (SELECT 1 FROM shop_settings LIMIT 1);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    '✅ Migration Complete' as status,
    (SELECT count(*) FROM products) as products_count,
    (SELECT count(*) FROM customers) as customers_count,
    (SELECT count(*) FROM sales) as sales_count,
    (SELECT count(*) FROM shop_settings) as settings_count,
    (SELECT count(*) FROM advance_orders) as advance_orders_count,
    (SELECT count(*) FROM sync_logs) as sync_logs_count,
    (SELECT count(*) FROM devices) as devices_count;

-- ============================================
-- END OF SIMPLE SAFE MIGRATION
-- ============================================
