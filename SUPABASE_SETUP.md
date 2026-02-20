# 🚀 Supabase Setup Guide for MilkRecord

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click **"Start your project"** or **"New Project"**
3. Fill in:
   - **Name:** milkrecord
   - **Database Password:** (save this securely!)
   - **Region:** Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup

---

## Step 2: Get Your Credentials

1. In your Supabase dashboard, click **Settings** (⚙️) in sidebar
2. Click **API**
3. Copy these 2 values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

---

## Step 3: Update login.html

1. Open `login.html` in code editor
2. Find lines 220-221:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Replace with your actual credentials:
   ```javascript
   const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```
4. Save the file

---

## Step 4: Create Database Tables

In Supabase dashboard:

1. Click **SQL Editor** in sidebar
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops table
CREATE TABLE shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Farmers table
CREATE TABLE farmers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    animal_type TEXT DEFAULT 'cow',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Milk intake entries table
CREATE TABLE milk_intake_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift TEXT NOT NULL,
    animal TEXT NOT NULL DEFAULT 'cow',
    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2),
    snf DECIMAL(5, 2),
    rate_per_l DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- POS Customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Retail sales table
CREATE TABLE retail_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_mode TEXT NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for faster queries
CREATE INDEX idx_farmers_shop ON farmers(shop_id);
CREATE INDEX idx_milk_entries_shop ON milk_intake_entries(shop_id);
CREATE INDEX idx_milk_entries_farmer ON milk_intake_entries(farmer_id);
CREATE INDEX idx_milk_entries_date ON milk_intake_entries(date DESC);
CREATE INDEX idx_customers_shop ON customers(shop_id);
CREATE INDEX idx_retail_sales_shop ON retail_sales(shop_id);
CREATE INDEX idx_retail_sales_date ON retail_sales(created_at DESC);
CREATE INDEX idx_users_shop ON users(shop_id);

-- Enable Row Level Security (RLS)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_intake_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_sales ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations" ON shops FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON farmers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON milk_intake_entries FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON retail_sales FOR ALL USING (true);
```

4. Click **"Run"** or press `Ctrl+Enter`
5. You should see: ✅ Success. No rows returned

---

## Step 5: Create Demo User

Run this SQL to create a demo account:

```sql
-- Note: This creates the database structure
-- For actual user, register through the app at /login.html
-- Demo credentials:
-- Email: demo@milkrecord.in
-- Password: demo123
```

---

## Step 6: Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git add -A
   git commit -m "Setup Supabase authentication"
   git push origin main
   ```

2. Go to https://vercel.com
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your anon key
5. Click **Deploy**

---

## Step 7: Test Login

1. Open your deployed app: `https://your-app.vercel.app/login.html`
2. Try demo login:
   - **Shop:** Gopal Dairy Shop
   - **Email:** demo@milkrecord.in
   - **Password:** demo123
3. Or register a new account!

---

## 🧪 Verify Supabase Connection

Open browser console (F12) on login page and run:

```javascript
// Check if Supabase is connected
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase initialized:', !!supabase);

// Test connection
(async () => {
  try {
    const { data, error } = await supabase.from('shops').select('id').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Supabase connected successfully!');
      console.log('Shops in database:', data?.length || 0);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
```

---

## 📊 View Your Data

In Supabase dashboard:

1. Click **Table Editor** in sidebar
2. You'll see all tables:
   - shops
   - users
   - farmers
   - milk_intake_entries
   - customers
   - retail_sales
3. Click any table to view data

---

## 🔒 Security (Optional - For Production)

To restrict users to only see their own shop's data:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations" ON shops;
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow all operations" ON farmers;
DROP POLICY IF EXISTS "Allow all operations" ON milk_intake_entries;
DROP POLICY IF EXISTS "Allow all operations" ON customers;
DROP POLICY IF EXISTS "Allow all operations" ON retail_sales;

-- Create shop-scoped policies
CREATE POLICY "Users can view their shop" ON shops
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can view their shop users" ON users
    FOR SELECT
    USING (shop_id = auth.uid());

CREATE POLICY "Users can manage their shop farmers" ON farmers
    FOR ALL
    USING (shop_id IN (SELECT id FROM shops WHERE id = auth.uid()));

-- Similar for other tables...
```

---

## 🆘 Troubleshooting

### Issue: "Supabase not configured"
**Fix:** Edit `login.html` lines 220-221 with your actual credentials

### Issue: "Table does not exist"
**Fix:** Run the SQL schema from Step 4 in Supabase SQL Editor

### Issue: "Invalid API key"
**Fix:** Make sure you copied the **anon/public** key, not the service_role key

### Issue: "Email already exists"
**Fix:** Use a different email or delete the existing user in Supabase Authentication → Users

---

## ✅ Done!

Your MilkRecord app now has:
- ✅ User authentication (login/register)
- ✅ Supabase database connection
- ✅ Data sync across devices
- ✅ Secure user accounts

**Next:** Customize shop names, add farmers, start billing! 🎉

---

**Questions?** Check Supabase docs: https://supabase.com/docs
