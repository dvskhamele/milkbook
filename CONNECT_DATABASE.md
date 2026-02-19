# 🚀 Connect MilkBook to Your Supabase Database

## ✅ Quick Setup (5 Minutes)

### Step 1: Your .env File

You've already added keys to `.env`. Make sure it looks like this:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get these from:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values

---

### Step 2: Test Database Connection

Open this file in your browser:

```
file:///Users/test/startups/deprecated-milkbook/test-db.html
```

**You should see:**
- ✅ Supabase Configuration: Pass
- ✅ Database Connection: Pass  
- ✅ Tables Check: Pass (if you ran schema.sql)
- ✅ Sample Data: Shows your data

**If you see errors:**
- Check your .env file
- Make sure Supabase project is active
- Run `backend/schema.sql` in Supabase SQL Editor

---

### Step 3: Run Database Schema

If tables don't exist yet:

1. Go to Supabase **SQL Editor**
2. Copy contents of `backend/schema.sql`
3. Paste and click **Run**
4. Copy contents of `backend/functions.sql`
5. Paste and click **Run**

**This creates:**
- shops table
- users table
- farmers table
- milk_intake_entries table
- retail_sales table
- balances table
- audit_events table
- Helper functions

---

### Step 4: Create Sample User

Run this SQL to create a test user:

```sql
-- Create sample shop
INSERT INTO shops (id, name, location)
VALUES ('shop-001', 'Gopal Dairy Shop', 'Vadgaon, Pune');

-- Create sample user with PIN 123456
INSERT INTO users (id, shop_id, role, pin_hash)
VALUES (
  'user-001',
  'shop-001',
  'admin',
  123456 * 12345  -- PIN * 12345 (simple hash)
);
```

**Login credentials:**
- Shop ID: `shop-001`
- User ID: `user-001`
- PIN: `123456`

---

### Step 5: Test Login

1. Open `login.html` in your browser
2. Enter credentials above
3. Click **Login**
4. Should redirect to `index.html`

---

## 🔧 Troubleshooting

### "Supabase not configured"

**Problem:** config.js can't read .env

**Solution:**
1. Make sure .env file exists in project root
2. Check variable names match exactly
3. No quotes around values
4. Restart your browser

---

### "Connection failed"

**Problem:** Can't connect to Supabase

**Solution:**
1. Check SUPABASE_URL is correct
2. Check SUPABASE_ANON_KEY is correct
3. Make sure project is active on Supabase
4. Check browser console for errors

---

### "Table does not exist"

**Problem:** Schema not run

**Solution:**
1. Run `backend/schema.sql` in Supabase SQL Editor
2. Refresh test-db.html
3. All tables should show ✅

---

### "Invalid PIN"

**Problem:** PIN hash doesn't match

**Solution:**
1. PIN hash = PIN * 12345
2. For PIN 123456: hash = 123456 * 12345 = 1524058320
3. Update user record with correct hash

---

## 📊 What's Connected

### Frontend Files:
- ✅ `login.html` - Uses Supabase Auth
- ✅ `index.html` - Checks auth, loads from backend
- ✅ `config.js` - Manages Supabase connection
- ✅ `netlify-client.js` - API calls with auth

### Backend Files:
- ✅ `backend/schema.sql` - Database schema
- ✅ `backend/functions.sql` - Helper functions
- ✅ `netlify/functions/auth-verify-pin.js` - PIN auth
- ✅ `netlify/functions/farmers.js` - Farmers API
- ✅ `netlify/functions/milk-entries.js` - Entries API

### Test Files:
- ✅ `test-db.html` - Database connection test
- ✅ `.env.example` - Environment template

---

## 🎯 Next Steps

### 1. Enable API Mode

Edit `netlify-client.js`:

```javascript
const USE_API = true;  // Change from false to true
```

Now data syncs to Supabase!

### 2. Deploy Functions

```bash
cd netlify/functions
npm install
netlify deploy --prod
```

### 3. Test Full Flow

1. Login with PIN
2. Create farmer
3. Create milk entry
4. Check Supabase dashboard → Data should be there!

---

## 📞 Support

**Check these files for details:**
- `SETUP_GUIDE.md` - Complete setup guide
- `backend/README.md` - Backend architecture
- `NETLIFY_DEPLOYMENT.md` - Deployment guide

**Test connection anytime:**
- Open `test-db.html` in browser
- All tests should pass ✅

---

**You're connected! 🎉**
