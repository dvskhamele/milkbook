-- ============================================
-- MilkRecord POS - FINAL Migration Script
-- STEP 1: Add ALL columns first
-- STEP 2: Create ALL indexes after
-- Safe to run multiple times
-- ============================================

-- ============================================
-- STEP 1: ADD ALL COLUMNS
-- ============================================

-- SHOPS TABLE
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_phone') THEN ALTER TABLE shops ADD COLUMN shop_phone TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_email') THEN ALTER TABLE shops ADD COLUMN shop_email TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_address') THEN ALTER TABLE shops ADD COLUMN shop_address TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_city') THEN ALTER TABLE shops ADD COLUMN shop_city TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_pincode') THEN ALTER TABLE shops ADD COLUMN shop_pincode TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_gst') THEN ALTER TABLE shops ADD COLUMN shop_gst TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_pan') THEN ALTER TABLE shops ADD COLUMN shop_pan TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_upi') THEN ALTER TABLE shops ADD COLUMN shop_upi TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_bank') THEN ALTER TABLE shops ADD COLUMN shop_bank TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_account') THEN ALTER TABLE shops ADD COLUMN shop_account TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_ifsc') THEN ALTER TABLE shops ADD COLUMN shop_ifsc TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_account_name') THEN ALTER TABLE shops ADD COLUMN shop_account_name TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'shop_status') THEN ALTER TABLE shops ADD COLUMN shop_status TEXT DEFAULT 'activated'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'sync_enabled') THEN ALTER TABLE shops ADD COLUMN sync_enabled BOOLEAN DEFAULT true; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'activated_at') THEN ALTER TABLE shops ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE; END IF; END $$;

-- PRODUCTS TABLE
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'local_txn_id') THEN ALTER TABLE products ADD COLUMN local_txn_id TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shop_id') THEN ALTER TABLE products ADD COLUMN shop_id UUID; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'synced_at') THEN ALTER TABLE products ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE; END IF; END $$;

-- CUSTOMERS TABLE
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'local_txn_id') THEN ALTER TABLE customers ADD COLUMN local_txn_id TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'shop_id') THEN ALTER TABLE customers ADD COLUMN shop_id UUID; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'synced_at') THEN ALTER TABLE customers ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE; END IF; END $$;

-- SALES TABLE
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'local_txn_id') THEN ALTER TABLE sales ADD COLUMN local_txn_id TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'shop_id') THEN ALTER TABLE sales ADD COLUMN shop_id UUID; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'synced_at') THEN ALTER TABLE sales ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE; END IF; END $$;

-- ============================================
-- STEP 2: CREATE TABLES IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID,
    device_id TEXT UNIQUE NOT NULL,
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
-- STEP 3: ADD CONSTRAINTS
-- ============================================

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'products' AND constraint_name = 'unique_product_local_txn') THEN ALTER TABLE products ADD CONSTRAINT unique_product_local_txn UNIQUE (local_txn_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'customers' AND constraint_name = 'unique_customer_local_txn') THEN ALTER TABLE customers ADD CONSTRAINT unique_customer_local_txn UNIQUE (local_txn_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'sales' AND constraint_name = 'unique_sale_local_txn') THEN ALTER TABLE sales ADD CONSTRAINT unique_sale_local_txn UNIQUE (local_txn_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'ledger' AND constraint_name = 'unique_ledger_local_txn') THEN ALTER TABLE ledger ADD CONSTRAINT unique_ledger_local_txn UNIQUE (local_txn_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'advance_orders' AND constraint_name = 'unique_advance_order_local_txn') THEN ALTER TABLE advance_orders ADD CONSTRAINT unique_advance_order_local_txn UNIQUE (local_txn_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'milk_collections' AND constraint_name = 'unique_collection_local_txn') THEN ALTER TABLE milk_collections ADD CONSTRAINT unique_collection_local_txn UNIQUE (local_txn_id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'devices' AND constraint_name = 'devices_device_id_key') THEN ALTER TABLE devices ADD CONSTRAINT devices_device_id_key UNIQUE (device_id); END IF; END $$;

-- ============================================
-- STEP 4: CREATE ALL INDEXES (after all columns exist)
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
-- STEP 5: ENABLE RLS
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
