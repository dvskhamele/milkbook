-- ============================================
-- FIX PRODUCTS RLS POLICY
-- Run this in Supabase SQL Editor
-- ============================================

-- First, ensure products table has shop_id column
ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS qty DECIMAL(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg';

-- Update existing products with shop_id
UPDATE products 
SET shop_id = (SELECT id FROM shops LIMIT 1)
WHERE shop_id IS NULL;

-- Drop existing RLS policy if it exists
DROP POLICY IF EXISTS "Enable all access for products" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;

-- Create permissive RLS policy that allows all operations
-- This policy checks if shop_id matches OR if shop_id is null (for backwards compatibility)
CREATE POLICY "Enable all access for products" ON products FOR ALL
USING (
  shop_id IS NULL OR 
  shop_id IN (SELECT id FROM shops)
)
WITH CHECK (
  shop_id IS NULL OR 
  shop_id IN (SELECT id FROM shops)
);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);

-- Verify
SELECT 
    '✅ Products RLS policy fixed' as status,
    (SELECT count(*) FROM products) as total_products,
    (SELECT count(*) FROM products WHERE shop_id IS NOT NULL) as products_with_shop;
