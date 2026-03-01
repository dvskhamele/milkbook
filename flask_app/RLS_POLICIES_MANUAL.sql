-- ============================================
-- RLS POLICIES - MANUAL DEPLOYMENT
-- Run this AFTER deploy_tables_non_interactive.py completes
-- ============================================

-- ENABLE RLS ON ALL TABLES
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_yield_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_tracking ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES (if any)
DROP POLICY IF EXISTS "Enable all access for shifts" ON shifts;
DROP POLICY IF EXISTS "Enable all access for inventory_current" ON inventory_current;
DROP POLICY IF EXISTS "Enable all access for inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Enable all access for production_batches" ON production_batches;
DROP POLICY IF EXISTS "Enable all access for shift_reconciliation" ON shift_reconciliation;
DROP POLICY IF EXISTS "Enable all access for farmer_yield_analytics" ON farmer_yield_analytics;
DROP POLICY IF EXISTS "Enable all access for waste_tracking" ON waste_tracking;

-- CREATE PERMISSIVE POLICIES (Allow all for now - can be restricted later)
CREATE POLICY "Enable all access for shifts" ON shifts 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all access for inventory_current" ON inventory_current 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all access for inventory_movements" ON inventory_movements 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all access for production_batches" ON production_batches 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all access for shift_reconciliation" ON shift_reconciliation 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all access for farmer_yield_analytics" ON farmer_yield_analytics 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all access for waste_tracking" ON waste_tracking 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'shifts',
    'inventory_current',
    'inventory_movements',
    'production_batches',
    'shift_reconciliation',
    'farmer_yield_analytics',
    'waste_tracking'
)
ORDER BY tablename, policyname;

-- Expected: 7 policies (one per table)
