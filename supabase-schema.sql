-- MilkBook Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create dairy_centers table (main organization)
CREATE TABLE dairy_centers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT,
    rate_type TEXT DEFAULT 'Fat_SNF', -- Fat_SNF, Flat, Lactometer
    language TEXT DEFAULT 'EN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create farmers table
CREATE TABLE farmers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dairy_center_id UUID REFERENCES dairy_centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT,
    advance_amount DECIMAL(10, 2) DEFAULT 0,
    animal_type TEXT DEFAULT 'Cow', -- Cow, Buffalo, Both
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create milk_entries table (daily milk collection)
CREATE TABLE milk_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dairy_center_id UUID REFERENCES dairy_centers(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift TEXT NOT NULL, -- Morning, Evening
    milk_type TEXT NOT NULL, -- Cow, Buffalo
    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2),
    snf DECIMAL(5, 2),
    lactometer DECIMAL(5, 2),
    rate DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    is_synced BOOLEAN DEFAULT true,
    sync_status TEXT DEFAULT 'synced', -- synced, pending, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create payments table (payments to farmers)
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dairy_center_id UUID REFERENCES dairy_centers(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL, -- Payment, Advance, Deduction
    amount DECIMAL(10, 2) NOT NULL,
    payment_mode TEXT DEFAULT 'Cash', -- Cash, Bank, UPI
    reference_number TEXT,
    notes TEXT,
    is_synced BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create sales table (milk/product sales)
CREATE TABLE sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dairy_center_id UUID REFERENCES dairy_centers(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_mobile TEXT,
    date DATE NOT NULL,
    items JSONB NOT NULL, -- [{product_id, name, quantity, rate, amount}]
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'paid', -- paid, pending, partial
    is_synced BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create products table (for sales)
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dairy_center_id UUID REFERENCES dairy_centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    unit TEXT DEFAULT 'L', -- L, Kg, Pcs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create inventory table (stock management)
CREATE TABLE inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dairy_center_id UUID REFERENCES dairy_centers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_stock_level DECIMAL(10, 2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create evidence_records table (for MilkLedger transparency)
CREATE TABLE evidence_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dairy_center_id UUID REFERENCES dairy_centers(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL, -- milk_entry, payment, sale
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- create, update, delete
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create users table (for authentication - links to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    dairy_center_id UUID REFERENCES dairy_centers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- owner, manager, user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_farmers_dairy_center ON farmers(dairy_center_id);
CREATE INDEX idx_milk_entries_dairy_center ON milk_entries(dairy_center_id);
CREATE INDEX idx_milk_entries_farmer ON milk_entries(farmer_id);
CREATE INDEX idx_milk_entries_date ON milk_entries(date);
CREATE INDEX idx_payments_dairy_center ON payments(dairy_center_id);
CREATE INDEX idx_payments_farmer ON payments(farmer_id);
CREATE INDEX idx_sales_dairy_center ON sales(dairy_center_id);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_products_dairy_center ON products(dairy_center_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_dairy_centers_updated_at BEFORE UPDATE ON dairy_centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milk_entries_updated_at BEFORE UPDATE ON milk_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE dairy_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their dairy center's data)
CREATE POLICY "Users can view their dairy center" ON dairy_centers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = dairy_centers.id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can view their farmers" ON farmers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = farmers.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their farmers" ON farmers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = farmers.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their farmers" ON farmers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = farmers.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can view their milk entries" ON milk_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = milk_entries.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their milk entries" ON milk_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = milk_entries.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their milk entries" ON milk_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = milk_entries.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can view their payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = payments.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their payments" ON payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = payments.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can view their sales" ON sales
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = sales.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their sales" ON sales
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = sales.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

CREATE POLICY "Users can view their products" ON products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.dairy_center_id = products.dairy_center_id 
            AND users.id = auth.uid()
        )
    );

-- Create function to create a new user after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, name, mobile, role, dairy_center_id)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'mobile',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        (NEW.raw_user_meta_data->>'dairy_center_id')::UUID
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample dairy center (optional - for testing)
-- INSERT INTO dairy_centers (name, owner_name, mobile, address)
-- VALUES ('Gopal Dairy Shop', 'Ramesh Kumar', '9876543210', 'Vadgaon, Pune');
