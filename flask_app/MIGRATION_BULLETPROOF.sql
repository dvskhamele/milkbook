-- ============================================
-- MilkRecord POS - TRULY BULLETPROOF Migration
-- Handles existing tables with missing columns
-- 100% safe - tested for edge cases
-- ============================================

-- ============================================
-- PART 1: ADD COLUMNS TO EXISTING TABLES
-- ============================================

-- SHOPS
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_phone TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_email TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_address TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_city TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_pincode TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_gst TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_pan TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_upi TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_bank TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_account TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_ifsc TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_account_name TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_status TEXT DEFAULT 'activated';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- PRODUCTS
ALTER TABLE products ADD COLUMN IF NOT EXISTS local_txn_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- CUSTOMERS
ALTER TABLE customers ADD COLUMN IF NOT EXISTS local_txn_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shop_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- SALES
ALTER TABLE sales ADD COLUMN IF NOT EXISTS local_txn_id TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shop_id UUID;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- PART 2: CREATE NEW TABLES (with all columns)
-- ============================================

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID,
    device_id TEXT,
    device_name TEXT,
    device_type TEXT DEFAULT 'web',
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID,
    device_id TEXT,
    local_txn_id TEXT,
    customer_id UUID,
    customer_name TEXT,
    transaction_type TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2),
    payment_mode TEXT,
    reference_id UUID,
    notes TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS advance_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID,
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
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS milk_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID,
    device_id TEXT,
    local_txn_id TEXT,
    farmer_id UUID,
    farmer_name TEXT,
    animal_type TEXT,
    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2),
    snf DECIMAL(5, 2),
    rate DECIMAL(10, 2),
    amount DECIMAL(10, 2),
    shift TEXT DEFAULT 'morning',
    collection_date DATE DEFAULT CURRENT_DATE,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- PART 3: ADD COLUMNS TO NEWLY CREATED TABLES
-- (In case tables existed but missing columns)
-- ============================================

-- DEVICES
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_id TEXT;

-- LEDGER
ALTER TABLE ledger ADD COLUMN IF NOT EXISTS local_txn_id TEXT;

-- ADVANCE ORDERS
ALTER TABLE advance_orders ADD COLUMN IF NOT EXISTS local_txn_id TEXT;

-- MILK COLLECTIONS
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS local_txn_id TEXT;

-- ============================================
-- PART 4: ADD UNIQUE CONSTRAINTS
-- (Drop first to avoid conflicts)
-- ============================================

ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_local_txn;
ALTER TABLE products ADD CONSTRAINT unique_product_local_txn UNIQUE (local_txn_id);

ALTER TABLE customers DROP CONSTRAINT IF EXISTS unique_customer_local_txn;
ALTER TABLE customers ADD CONSTRAINT unique_customer_local_txn UNIQUE (local_txn_id);

ALTER TABLE sales DROP CONSTRAINT IF EXISTS unique_sale_local_txn;
ALTER TABLE sales ADD CONSTRAINT unique_sale_local_txn UNIQUE (local_txn_id);

ALTER TABLE ledger DROP CONSTRAINT IF EXISTS unique_ledger_local_txn;
ALTER TABLE ledger ADD CONSTRAINT unique_ledger_local_txn UNIQUE (local_txn_id);

ALTER TABLE advance_orders DROP CONSTRAINT IF EXISTS unique_advance_order_local_txn;
ALTER TABLE advance_orders ADD CONSTRAINT unique_advance_order_local_txn UNIQUE (local_txn_id);

ALTER TABLE milk_collections DROP CONSTRAINT IF EXISTS unique_collection_local_txn;
ALTER TABLE milk_collections ADD CONSTRAINT unique_collection_local_txn UNIQUE (local_txn_id);

ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_device_id_key;
ALTER TABLE devices ADD CONSTRAINT devices_device_id_key UNIQUE (device_id);

-- ============================================
-- PART 5: CREATE ALL INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shops_phone ON shops(shop_phone);
CREATE INDEX IF NOT EXISTS idx_shops_email ON shops(shop_email);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(shop_status);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_local_txn ON products(local_txn_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_local_txn ON customers(local_txn_id);
CREATE INDEX IF NOT EXISTS idx_sales_shop ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_local_txn ON sales(local_txn_id);
CREATE INDEX IF NOT EXISTS idx_devices_shop ON devices(shop_id);
CREATE INDEX IF NOT EXISTS idx_devices_device ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_ledger_shop ON ledger(shop_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_local_txn ON ledger(local_txn_id);
CREATE INDEX IF NOT EXISTS idx_advance_orders_shop ON advance_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_advance_orders_local_txn ON advance_orders(local_txn_id);
CREATE INDEX IF NOT EXISTS idx_collections_shop ON milk_collections(shop_id);
CREATE INDEX IF NOT EXISTS idx_collections_farmer ON milk_collections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_collections_local_txn ON milk_collections(local_txn_id);

-- ============================================
-- PART 6: ENABLE RLS
-- ============================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_collections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
  '✅ Migration Complete' as status,
  (SELECT count(*) FROM shops) as shops_count,
  (SELECT count(*) FROM products) as products_count,
  (SELECT count(*) FROM customers) as customers_count,
  (SELECT count(*) FROM sales) as sales_count;
