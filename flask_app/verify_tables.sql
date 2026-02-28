-- ============================================
-- Verify MilkBook Tables Created
-- Run this in Supabase SQL Editor after migration
-- ============================================

-- 1. Check all required tables exist
SELECT 
    '✅ Tables Created' as status,
    string_agg(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'customers', 'sales', 'farmers', 'milk_collections');

-- 2. Count rows in each table
SELECT 'products' as table_name, count(*) as row_count FROM products
UNION ALL
SELECT 'customers', count(*) FROM customers
UNION ALL
SELECT 'sales', count(*) FROM sales
UNION ALL
SELECT 'farmers', count(*) FROM farmers
UNION ALL
SELECT 'milk_collections', count(*) FROM milk_collections;

-- 3. Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('products', 'customers', 'sales', 'farmers', 'milk_collections')
ORDER BY tablename;

-- 4. Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('products', 'customers', 'sales')
ORDER BY tablename, indexname;

-- 5. Sample data check (products)
SELECT 
    'Sample Products' as info,
    count(*) as total_products,
    string_agg(DISTINCT category, ', ') as categories
FROM products;

-- 6. Test insert (uncomment to test)
-- INSERT INTO customers (name, phone, email)
-- VALUES ('Test Customer', '9999999999', 'test@test.com');

-- 7. Verify test customer was created
-- SELECT * FROM customers WHERE phone = '9999999999';

-- 8. Clean up test data (uncomment after testing)
-- DELETE FROM customers WHERE phone = '9999999999';

-- ============================================
-- Expected Output:
-- ============================================
-- 1. All 5 tables should be listed
-- 2. Row counts may vary (products should have 10 sample)
-- 3. RLS should be 'true' for all tables
-- 4. Indexes should exist for category, phone, date columns
-- 5. Should show product categories: milk, paneer, ghee, curd, sweets, bakery
