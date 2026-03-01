-- ============================================
-- FIX PRODUCTS TABLE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS qty DECIMAL(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg';
ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for shop_id
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);

-- Verify columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- ============================================
-- FIX: Add shop_id to existing products
-- ============================================
UPDATE products 
SET shop_id = (SELECT id FROM shops LIMIT 1)
WHERE shop_id IS NULL;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    '✅ Products table schema fixed' as status,
    (SELECT count(*) FROM products) as total_products,
    (SELECT count(*) FROM products WHERE shop_id IS NOT NULL) as products_with_shop;
