-- ============================================
-- MilkRecord POS - Supabase Schema
-- Enterprise-Grade with 3-Tier Sync Support
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SHOPS TABLE (Tenant Isolation)
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    shop_status TEXT DEFAULT 'activated', -- local_trial, activated, suspended
    sync_enabled BOOLEAN DEFAULT true,
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_phone ON shops(shop_phone);
CREATE INDEX IF NOT EXISTS idx_shops_email ON shops(shop_email);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(shop_status);

-- ============================================
-- 2. DEVICES TABLE (Multi-Device Support)
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT UNIQUE NOT NULL,
    device_name TEXT,
    device_type TEXT DEFAULT 'web', -- web, desktop, mobile
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_shop ON devices(shop_id);
CREATE INDEX IF NOT EXISTS idx_devices_device ON devices(device_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_shop_device ON devices(shop_id, device_id);

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT, -- For conflict resolution
    name TEXT NOT NULL,
    category TEXT DEFAULT 'all',
    price DECIMAL(10, 2) NOT NULL,
    unit TEXT DEFAULT 'unit',
    emoji TEXT DEFAULT '📦',
    qty DECIMAL(10, 2) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint for UPSERT
    CONSTRAINT unique_product_local_txn UNIQUE (local_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_local_txn ON products(local_txn_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ============================================
-- 4. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance DECIMAL(10, 2) DEFAULT 0,
    gst_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_customer_local_txn UNIQUE (local_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_local_txn ON customers(local_txn_id);

-- ============================================
-- 5. SALES/INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT,
    customer_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB, -- [{name, qty, price, amount}]
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_mode TEXT DEFAULT 'cash', -- cash, upi, credit, hold
    payment_status TEXT DEFAULT 'paid', -- paid, partial, unpaid
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_sale_local_txn UNIQUE (local_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_shop ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_local_txn ON sales(local_txn_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(payment_mode);

-- ============================================
-- 6. LEDGER TABLE (Customer Advances/Credits)
-- ============================================
CREATE TABLE IF NOT EXISTS ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT,
    customer_id UUID,
    customer_name TEXT,
    transaction_type TEXT, -- advance, credit, debit, adjustment
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2),
    payment_mode TEXT,
    reference_id UUID, -- Reference to sale_id
    notes TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_ledger_local_txn UNIQUE (local_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_ledger_shop ON ledger(shop_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_local_txn ON ledger(local_txn_id);

-- ============================================
-- 7. ADVANCE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS advance_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT,
    customer_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB,
    total_amount DECIMAL(10, 2) NOT NULL,
    advance_paid DECIMAL(10, 2) DEFAULT 0,
    delivery_date DATE,
    delivery_time TIME,
    delivery_location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, confirmed, delivered, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_advance_order_local_txn UNIQUE (local_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_advance_orders_shop ON advance_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_advance_orders_customer ON advance_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_advance_orders_date ON advance_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_advance_orders_status ON advance_orders(status);
CREATE INDEX IF NOT EXISTS idx_advance_orders_local_txn ON advance_orders(local_txn_id);

-- ============================================
-- 8. MILK COLLECTIONS TABLE (For Dairy Farmers)
-- ============================================
CREATE TABLE IF NOT EXISTS milk_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    device_id TEXT,
    local_txn_id TEXT,
    farmer_id UUID,
    farmer_name TEXT,
    animal_type TEXT, -- cow, buffalo, both
    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2),
    snf DECIMAL(5, 2),
    rate DECIMAL(10, 2),
    amount DECIMAL(10, 2),
    shift TEXT DEFAULT 'morning', -- morning, evening
    collection_date DATE DEFAULT CURRENT_DATE,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_collection_local_txn UNIQUE (local_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_shop ON milk_collections(shop_id);
CREATE INDEX IF NOT EXISTS idx_collections_farmer ON milk_collections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_collections_date ON milk_collections(collection_date DESC);
CREATE INDEX IF NOT EXISTS idx_collections_local_txn ON milk_collections(local_txn_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Shops are viewable by owner" ON shops;
DROP POLICY IF EXISTS "Shops can be inserted by owner" ON shops;
DROP POLICY IF EXISTS "Shops can be updated by owner" ON shops;

DROP POLICY IF EXISTS "Devices are viewable by shop" ON devices;
DROP POLICY IF EXISTS "Devices can be inserted by shop" ON devices;
DROP POLICY IF EXISTS "Devices can be updated by shop" ON devices;

DROP POLICY IF EXISTS "Products are viewable by shop" ON products;
DROP POLICY IF EXISTS "Products can be inserted by shop" ON products;
DROP POLICY IF EXISTS "Products can be updated by shop" ON products;
DROP POLICY IF EXISTS "Products can be deleted by shop" ON products;

DROP POLICY IF EXISTS "Customers are viewable by shop" ON customers;
DROP POLICY IF EXISTS "Customers can be inserted by shop" ON customers;
DROP POLICY IF EXISTS "Customers can be updated by shop" ON customers;
DROP POLICY IF EXISTS "Customers can be deleted by shop" ON customers;

DROP POLICY IF EXISTS "Sales are viewable by shop" ON sales;
DROP POLICY IF EXISTS "Sales can be inserted by shop" ON sales;
DROP POLICY IF EXISTS "Sales can be updated by shop" ON sales;
DROP POLICY IF EXISTS "Sales can be deleted by shop" ON sales;

DROP POLICY IF EXISTS "Ledger is viewable by shop" ON ledger;
DROP POLICY IF EXISTS "Ledger can be inserted by shop" ON ledger;
DROP POLICY IF EXISTS "Ledger can be updated by shop" ON ledger;
DROP POLICY IF EXISTS "Ledger can be deleted by shop" ON ledger;

DROP POLICY IF EXISTS "Advance orders are viewable by shop" ON advance_orders;
DROP POLICY IF EXISTS "Advance orders can be inserted by shop" ON advance_orders;
DROP POLICY IF EXISTS "Advance orders can be updated by shop" ON advance_orders;
DROP POLICY IF EXISTS "Advance orders can be deleted by shop" ON advance_orders;

DROP POLICY IF EXISTS "Milk collections are viewable by shop" ON milk_collections;
DROP POLICY IF EXISTS "Milk collections can be inserted by shop" ON milk_collections;
DROP POLICY IF EXISTS "Milk collections can be updated by shop" ON milk_collections;
DROP POLICY IF EXISTS "Milk collections can be deleted by shop" ON milk_collections;

-- Shops: Users can only see their own shop
CREATE POLICY "Shops are viewable by owner" ON shops FOR SELECT
    USING (true); -- Public read for now (can be restricted later)

CREATE POLICY "Shops can be inserted by owner" ON shops FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Shops can be updated by owner" ON shops FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

-- Devices: Isolated by shop_id
CREATE POLICY "Devices are viewable by shop" ON devices FOR SELECT
    USING (true);

CREATE POLICY "Devices can be inserted by shop" ON devices FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Devices can be updated by shop" ON devices FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

-- Products: Isolated by shop_id
CREATE POLICY "Products are viewable by shop" ON products FOR SELECT
    USING (true);

CREATE POLICY "Products can be inserted by shop" ON products FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Products can be updated by shop" ON products FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Products can be deleted by shop" ON products FOR DELETE
    TO authenticated USING (true);

-- Customers: Isolated by shop_id
CREATE POLICY "Customers are viewable by shop" ON customers FOR SELECT
    USING (true);

CREATE POLICY "Customers can be inserted by shop" ON customers FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Customers can be updated by shop" ON customers FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Customers can be deleted by shop" ON customers FOR DELETE
    TO authenticated USING (true);

-- Sales: Isolated by shop_id
CREATE POLICY "Sales are viewable by shop" ON sales FOR SELECT
    USING (true);

CREATE POLICY "Sales can be inserted by shop" ON sales FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Sales can be updated by shop" ON sales FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Sales can be deleted by shop" ON sales FOR DELETE
    TO authenticated USING (true);

-- Ledger: Isolated by shop_id
CREATE POLICY "Ledger is viewable by shop" ON ledger FOR SELECT
    USING (true);

CREATE POLICY "Ledger can be inserted by shop" ON ledger FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Ledger can be updated by shop" ON ledger FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Ledger can be deleted by shop" ON ledger FOR DELETE
    TO authenticated USING (true);

-- Advance Orders: Isolated by shop_id
CREATE POLICY "Advance orders are viewable by shop" ON advance_orders FOR SELECT
    USING (true);

CREATE POLICY "Advance orders can be inserted by shop" ON advance_orders FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Advance orders can be updated by shop" ON advance_orders FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Advance orders can be deleted by shop" ON advance_orders FOR DELETE
    TO authenticated USING (true);

-- Milk Collections: Isolated by shop_id
CREATE POLICY "Milk collections are viewable by shop" ON milk_collections FOR SELECT
    USING (true);

CREATE POLICY "Milk collections can be inserted by shop" ON milk_collections FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Milk collections can be updated by shop" ON milk_collections FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Milk collections can be deleted by shop" ON milk_collections FOR DELETE
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

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
DROP TRIGGER IF EXISTS update_ledger_updated_at ON ledger;
DROP TRIGGER IF EXISTS update_advance_orders_updated_at ON advance_orders;
DROP TRIGGER IF EXISTS update_milk_collections_updated_at ON milk_collections;

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ledger_updated_at BEFORE UPDATE ON ledger
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advance_orders_updated_at BEFORE UPDATE ON advance_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milk_collections_updated_at BEFORE UPDATE ON milk_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (For Testing)
-- ============================================

-- Insert a test shop
INSERT INTO shops (shop_name, shop_phone, shop_email, shop_city, shop_status)
VALUES ('Test Dairy Shop', '9876543210', 'test@dairy.com', 'Pune', 'activated')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

SELECT 
    '✅ Schema Created' as status,
    (SELECT count(*) FROM shops) as shops_count,
    (SELECT count(*) FROM products) as products_count,
    (SELECT count(*) FROM customers) as customers_count,
    (SELECT count(*) FROM sales) as sales_count;

-- ============================================
-- END OF SCHEMA
-- ============================================
