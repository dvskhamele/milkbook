-- Create shop_settings table in Supabase
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated insert shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated update shop_settings" ON shop_settings;

-- Create policies
CREATE POLICY "Allow authenticated read shop_settings" ON shop_settings FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert shop_settings" ON shop_settings FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update shop_settings" ON shop_settings FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON shop_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings if table is empty
INSERT INTO shop_settings (shop_name, shop_phone)
SELECT 'Gopal Dairy', '9876543210'
WHERE NOT EXISTS (SELECT 1 FROM shop_settings LIMIT 1);

-- Verify
SELECT 'Shop Settings Table Created' as status, count(*) as rows FROM shop_settings;
