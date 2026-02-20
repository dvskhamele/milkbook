# 🚀 Vercel + Supabase Deployment Guide

## ✅ Complete Setup for MilkBook

---

## Step 1: Configure Supabase Credentials

Edit `supabase-client.js` (lines 7-8):

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**Get these from:**
1. Go to https://supabase.com
2. Open your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

---

## Step 2: Create Supabase Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops table
CREATE TABLE shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Farmers table
CREATE TABLE farmers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
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

-- Customers table (for POS)
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
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
CREATE INDEX idx_milk_entries_date ON milk_intake_entries(date DESC);
CREATE INDEX idx_customers_shop ON customers(shop_id);
CREATE INDEX idx_retail_sales_shop ON retail_sales(shop_id);
CREATE INDEX idx_retail_sales_date ON retail_sales(created_at DESC);
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd /Users/test/startups/deprecated-milkbook

# Deploy
vercel --prod
```

### Option B: Deploy via GitHub

1. Push code to GitHub:
   ```bash
   git add -A
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Click **Deploy**

---

## Step 4: Set Environment Variables on Vercel

After deployment:

1. Go to your project on Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these variables:
   ```
   SUPABASE_URL = https://your-project-id.supabase.co
   SUPABASE_ANON_KEY = your-anon-key-here
   ```
4. Click **Save**
5. Redeploy (Settings → Deployments → Redeploy)

---

## Step 5: Enable Supabase Mode

Open your deployed app and run in browser console (F12):

```javascript
// Enable Supabase mode
localStorage.setItem('milkbook_use_supabase', 'true');
location.reload();
```

You should see in console:
```
📊 MilkBook: ✅ Supabase Connected
```

---

## Step 6: Verify Database Connection

### Test 1: Check Console Logs
Open browser console (F12) on your deployed app:
- Should show: `📊 MilkBook: ✅ Supabase Connected`
- No errors about connection

### Test 2: Add Farmer
1. Go to Collection page
2. Add a new farmer
3. Check console - should show:
   ```
   💾 Saving farmer...
   ✅ Farmer saved to Supabase
   ```

### Test 3: Check Supabase Dashboard
1. Go to Supabase dashboard
2. Go to **Table Editor**
3. Check `farmers` table
4. Your new farmer should be there! ✅

### Test 4: Make POS Sale
1. Go to POS page
2. Add products to cart
3. Complete sale
4. Check console:
   ```
   💾 Saving sale...
   ✅ Sale saved to Supabase
   ```
5. Check Supabase `retail_sales` table

---

## 🧪 Quick Verification Commands

### In Browser Console (F12):

```javascript
// Check if Supabase is connected
console.log('Configured:', window.IS_CONFIGURED);
console.log('Using Supabase:', window.USE_SUPABASE);

// Test database connection
const result = await window.MilkBookDB.farmers.getAll();
console.log('Farmers in database:', result.farmers.length);

// Test creating a farmer
const newFarmer = await window.MilkBookDB.farmers.create({
  shop_id: 'your-shop-id',
  name: 'Test Farmer',
  phone: '9876543210',
  balance: 0
});
console.log('Created farmer:', newFarmer);

// Enable Supabase mode
localStorage.setItem('milkbook_use_supabase', 'true');
location.reload();
```

---

## 📊 What Gets Saved Where

### LocalStorage (Always):
- ✅ User session
- ✅ UI preferences
- ✅ Cached data (for offline)

### Supabase Database (When enabled):
- ✅ Farmers
- ✅ Milk intake entries
- ✅ POS customers
- ✅ Retail sales
- ✅ User accounts

---

## 🚨 Troubleshooting

### Issue: "Supabase not configured"
**Fix:** Edit `supabase-client.js` with correct credentials

### Issue: "Table does not exist"
**Fix:** Run the SQL schema in Supabase SQL Editor

### Issue: "Permission denied"
**Fix:** Enable Row Level Security (RLS) or add policies:
```sql
-- Allow all operations for now (development only!)
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON farmers FOR ALL USING (true);

ALTER TABLE milk_intake_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON milk_intake_entries FOR ALL USING (true);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON customers FOR ALL USING (true);

ALTER TABLE retail_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON retail_sales FOR ALL USING (true);
```

### Issue: "Data not syncing"
**Fix:** 
1. Check browser console for errors
2. Verify `USE_SUPABASE` is true
3. Check Vercel environment variables
4. Test with verification commands above

---

## ✅ Deployment Checklist

- [ ] Supabase credentials in `supabase-client.js`
- [ ] Database tables created (run SQL)
- [ ] Deployed to Vercel
- [ ] Environment variables set on Vercel
- [ ] Supabase mode enabled (`localStorage.setItem('milkbook_use_supabase', 'true')`)
- [ ] Console shows `✅ Supabase Connected`
- [ ] Test farmer creation works
- [ ] Test POS sale works
- [ ] Data appears in Supabase dashboard

---

## 🎯 Your Deployed App URL

After deployment, Vercel will give you a URL like:
```
https://your-project.vercel.app
```

Share this URL to access your app from anywhere! 🌐

---

**Need Help?**
- Check browser console (F12) for errors
- Verify Supabase credentials
- Check Vercel deployment logs
- Test with verification commands above

**Good luck with deployment! 🚀**
