-- =====================================================
-- Audit Logs Table - Add to your database
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL, -- create, update, delete, login, logout
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop ON audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for now)
CREATE POLICY "Allow all on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Test query
-- =====================================================

-- View recent audit logs
SELECT 
    created_at,
    user_email,
    action,
    table_name,
    notes
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 50;

-- =====================================================
-- DONE! ✅
-- =====================================================
