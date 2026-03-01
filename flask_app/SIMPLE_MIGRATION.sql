-- ============================================
-- SIMPLE MIGRATION - Works with existing schema
-- Only creates missing tables (ledger)
-- No ALTER TABLE, no new columns
-- ============================================

-- Create ledger table only (missing table)
CREATE TABLE IF NOT EXISTS ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID,
    customer_name TEXT,
    transaction_type TEXT,
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2),
    payment_mode TEXT,
    notes TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON ledger(customer_id);

-- Enable RLS
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Enable all access for ledger" ON ledger FOR ALL USING (true);

-- Verify
SELECT '✅ Migration Complete' as status, 
       (SELECT count(*) FROM ledger) as ledger_rows;
