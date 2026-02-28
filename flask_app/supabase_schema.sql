-- MilkRecord Supabase Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DEVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    device_name TEXT,
    device_type TEXT,
    plant_code TEXT,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FARMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT REFERENCES devices(device_id),
    name TEXT NOT NULL,
    phone TEXT,
    animal_type TEXT DEFAULT 'cow',
    balance DECIMAL(10, 2) DEFAULT 0,
    sync_status TEXT DEFAULT 'pending',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for sync performance
CREATE INDEX IF NOT EXISTS idx_farmers_sync ON farmers(sync_status);
CREATE INDEX IF NOT EXISTS idx_farmers_device ON farmers(device_id);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT REFERENCES devices(device_id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance DECIMAL(10, 2) DEFAULT 0,
    sync_status TEXT DEFAULT 'pending',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_sync ON customers(sync_status);
CREATE INDEX IF NOT EXISTS idx_customers_device ON customers(device_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT REFERENCES devices(device_id),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'all',
    price DECIMAL(10, 2) NOT NULL,
    unit TEXT DEFAULT 'unit',
    emoji TEXT DEFAULT '📦',
    sync_status TEXT DEFAULT 'pending',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sync ON products(sync_status);

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT REFERENCES devices(device_id),
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    items JSONB,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_mode TEXT DEFAULT 'cash',
    sync_status TEXT DEFAULT 'pending',
    version INTEGER DEFAULT 1,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_sync ON sales(sync_status);
CREATE INDEX IF NOT EXISTS idx_sales_device ON sales(device_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date DESC);

-- ============================================
-- MILK COLLECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS milk_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT REFERENCES devices(device_id),
    farmer_id UUID REFERENCES farmers(id),
    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2),
    snf DECIMAL(5, 2),
    rate DECIMAL(10, 2),
    amount DECIMAL(10, 2),
    shift TEXT DEFAULT 'morning',
    collection_date DATE DEFAULT CURRENT_DATE,
    sync_status TEXT DEFAULT 'pending',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_sync ON milk_collections(sync_status);
CREATE INDEX IF NOT EXISTS idx_collections_farmer ON milk_collections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_collections_date ON milk_collections(collection_date DESC);

-- ============================================
-- SYNC LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT REFERENCES devices(device_id),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_device ON sync_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all
CREATE POLICY "Allow authenticated read" ON farmers FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON customers FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON products FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON sales FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON milk_collections FOR SELECT
    TO authenticated USING (true);

-- Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON farmers FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON customers FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON products FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON sales FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON milk_collections FOR INSERT
    TO authenticated WITH CHECK (true);

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON farmers FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON customers FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON products FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON sales FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON milk_collections FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

-- Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON farmers FOR DELETE
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON customers FOR DELETE
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON products FOR DELETE
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON sales FOR DELETE
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON milk_collections FOR DELETE
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

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON milk_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Insert sample products
INSERT INTO products (id, name, category, price, unit, emoji, sync_status, version) VALUES
    (uuid_generate_v4(), 'Cow Milk', 'milk', 64.00, 'L', '🥛', 'synced', 1),
    (uuid_generate_v4(), 'Buffalo Milk', 'milk', 72.00, 'L', '🥛', 'synced', 1),
    (uuid_generate_v4(), 'Paneer', 'paneer', 400.00, 'kg', '🧀', 'synced', 1),
    (uuid_generate_v4(), 'Ghee', 'ghee', 600.00, 'L', '🧈', 'synced', 1),
    (uuid_generate_v4(), 'Curd', 'curd', 80.00, 'kg', '🥣', 'synced', 1),
    (uuid_generate_v4(), 'Lassi', 'curd', 60.00, 'glass', '🥣', 'synced', 1),
    (uuid_generate_v4(), 'Barfi', 'sweets', 300.00, 'kg', '🍬', 'synced', 1),
    (uuid_generate_v4(), 'Jalebi', 'sweets', 200.00, 'kg', '🍬', 'synced', 1),
    (uuid_generate_v4(), 'Bread', 'bakery', 40.00, 'pkt', '🥐', 'synced', 1),
    (uuid_generate_v4(), 'Biscuits', 'bakery', 30.00, 'pkt', '🥐', 'synced', 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTES
-- ============================================
-- 1. All tables use UUID for primary keys
-- 2. All tables have sync_status for offline sync
-- 3. All tables have version for conflict resolution
-- 4. RLS is enabled for security
-- 5. Use anon key in client apps, service role key only in backend
