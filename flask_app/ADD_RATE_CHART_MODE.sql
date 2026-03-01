-- ============================================
-- Rate Chart Mode - Additive Implementation
-- ============================================

-- 1. Add rate_mode to settings
ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS rate_mode TEXT DEFAULT 'formula' CHECK (rate_mode IN ('formula', 'chart'));

-- 2. Create rate_chart table
CREATE TABLE IF NOT EXISTS rate_chart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    milk_type TEXT NOT NULL CHECK (milk_type IN ('cow', 'buffalo')),
    fat_value DECIMAL(4,2) NOT NULL,
    rate_value DECIMAL(10,2) NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    UNIQUE(shop_id, milk_type, fat_value, effective_from)
);

CREATE INDEX idx_rate_chart_shop ON rate_chart(shop_id);
CREATE INDEX idx_rate_chart_type ON rate_chart(milk_type);
CREATE INDEX idx_rate_chart_fat ON rate_chart(fat_value);
CREATE INDEX idx_rate_chart_active ON rate_chart(active);

-- 3. Add rate_mode to milk_collections
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS rate_mode TEXT DEFAULT 'formula';
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS rate_source TEXT DEFAULT 'formula';
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS chart_version TEXT;

-- 4. RLS Policies
ALTER TABLE rate_chart ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for rate_chart" ON rate_chart;
CREATE POLICY "Enable all access for rate_chart" ON rate_chart FOR ALL USING (true) WITH CHECK (true);

-- 5. Initialize default rate chart (example)
INSERT INTO rate_chart (shop_id, milk_type, fat_value, rate_value) VALUES
    (NULL, 'cow', 3.5, 35.00),
    (NULL, 'cow', 4.0, 40.00),
    (NULL, 'cow', 4.5, 45.00),
    (NULL, 'cow', 5.0, 50.00),
    (NULL, 'buffalo', 5.0, 45.00),
    (NULL, 'buffalo', 5.5, 50.00),
    (NULL, 'buffalo', 6.0, 55.00),
    (NULL, 'buffalo', 6.5, 60.00)
ON CONFLICT (shop_id, milk_type, fat_value) DO NOTHING;
