# 🚀 Deploy & Test Guide

## Quick Start (5 Minutes)

---

## Step 1: Create Supabase Tables (2 min)

### Option A: Run SQL in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar
   - Login with: pythonmatedivyesh@gmail.com

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Run Migration**
   - Open file: `flask_app/milkbook_schema_integration.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Tables Created**
   
   Run this query to check:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('products', 'customers', 'sales', 'farmers', 'milk_collections')
   ORDER BY table_name;
   ```
   
   Expected output:
   ```
   table_name
   ------------
   customers
   farmers
   milk_collections
   products
   sales
   ```

---

## Step 2: Deploy to Vercel (2 min)

### Deploy Command

```bash
cd /Users/test/startups/milkrecord_pos/flask_app

# Deploy to Vercel
vercel --prod
```

### If Not Logged In

```bash
# Login first
vercel login

# Then deploy
vercel --prod
```

### Note Your URL

After deployment, you'll see:
```
🔍  Inspect: https://vercel.com/your-username/your-project/xxxxx
✅  Production: https://milkbook-pos.vercel.app
```

**Save this URL!** You'll need it for testing.

---

## Step 3: Test Data Saves to Supabase (1 min)

### Test 1: Check API Health

Open in browser:
```
https://YOUR-VERCEL-URL.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "runtime": "cloud",
  "platform": "vercel",
  "timestamp": "2024-03-01T..."
}
```

### Test 2: Check Products API

Open in browser:
```
https://YOUR-VERCEL-URL.vercel.app/api/products
```

Expected response:
```json
{
  "products": [
    {
      "id": "uuid...",
      "name": "Cow Milk",
      "price": 64.0,
      "category": "milk",
      "unit": "L",
      "emoji": "🥛"
    },
    ... more products
  ],
  "success": true
}
```

### Test 3: Create Test Customer

Open POS app:
```
https://YOUR-VERCEL-URL.vercel.app/pos
```

1. **Click "➕ Add" button** (next to customer search)
2. **Fill in customer details:**
   - Name: `Test Customer`
   - Phone: `9876543210`
   - Email: `test@example.com` (optional)
   - Address: `Test Address` (optional)
3. **Click "✅ Add Customer"**
4. **Check if customer appears in search**

### Test 4: Verify in Supabase

1. **Go to Supabase Dashboard**
2. **Click "Table Editor"**
3. **Select "customers" table**
4. **You should see your test customer!**

Expected:
```
id | name | phone | email | address | balance
---|------|-------|-------|---------|--------
uuid... | Test Customer | 9876543210 | test@example.com | Test Address | 0
```

### Test 5: Create Test Sale

1. **Go back to POS app**
2. **Search and select your test customer**
3. **Add products to cart:**
   - Click on "Cow Milk" or any product
   - Quantity will be 1
4. **Click "CASH" button**
5. **Enter amount** (e.g., 100)
6. **Click "सही राशि!" or press Enter**

### Test 6: Verify Sale in Supabase

1. **Go to Supabase Dashboard**
2. **Click "Table Editor"**
3. **Select "sales" table**
4. **You should see your test sale!**

Expected:
```
id | customer_id | customer_name | items | total_amount | payment_mode
---|-------------|---------------|-------|--------------|-------------
uuid... | uuid... | Test Customer | [...] | 100.0 | cash
```

---

## 🧪 Complete Testing Checklist

### ✅ Database Setup
- [ ] SQL migration ran successfully
- [ ] All 5 tables created
- [ ] RLS policies enabled
- [ ] Sample products inserted

### ✅ Vercel Deployment
- [ ] Deployed successfully
- [ ] No build errors
- [ ] Environment variables set (via Doppler)
- [ ] URL noted

### ✅ API Testing
- [ ] `/api/health` returns healthy
- [ ] `/api/products` returns products
- [ ] `/api/customers` returns customers
- [ ] No 500 errors

### ✅ Form Testing
- [ ] Can add customer from POS
- [ ] Customer appears in Supabase
- [ ] Can create sale from POS
- [ ] Sale appears in Supabase
- [ ] Balance updates correctly

### ✅ Data Verification
- [ ] Check `customers` table in Supabase
- [ ] Check `sales` table in Supabase
- [ ] Check `products` table in Supabase
- [ ] Data matches what was submitted

---

## 🐛 Troubleshooting

### Issue: Tables not created

**Solution:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- If missing, run migration again
-- Copy from milkbook_schema_integration.sql
```

### Issue: Vercel deployment fails

**Check:**
```bash
# View deployment logs
vercel logs

# Check environment variables
vercel env ls

# Redeploy
vercel --prod
```

### Issue: API returns 500 error

**Check:**
1. Supabase credentials in Doppler
2. Doppler sync with Vercel
3. Vercel logs: `vercel logs --follow`
4. Supabase logs: Dashboard → Logs

### Issue: Form doesn't save data

**Check:**
1. Browser console for errors (F12)
2. Network tab - check API response
3. Supabase RLS policies
4. Vercel function logs

---

## 📊 Quick Test Script

Save this as `test_deployment.sh`:

```bash
#!/bin/bash

# Your Vercel URL (replace with actual)
VERCEL_URL="https://your-app.vercel.app"

echo "🧪 Testing MilkRecord POS Deployment"
echo "======================================"
echo ""

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
curl -s "$VERCEL_URL/api/health" | grep -q "healthy" && echo "   ✅ Health OK" || echo "   ❌ Health FAILED"

# Test 2: Products
echo "2️⃣  Testing products API..."
curl -s "$VERCEL_URL/api/products" | grep -q "success" && echo "   ✅ Products OK" || echo "   ❌ Products FAILED"

# Test 3: Customers
echo "3️⃣  Testing customers API..."
curl -s "$VERCEL_URL/api/customers" | grep -q "success" && echo "   ✅ Customers OK" || echo "   ❌ Customers FAILED"

echo ""
echo "======================================"
echo "🌐 Open in browser:"
echo "   POS App: $VERCEL_URL/pos"
echo "   Health:  $VERCEL_URL/api/health"
echo "   Products: $VERCEL_URL/api/products"
echo ""
```

Run it:
```bash
chmod +x test_deployment.sh
./test_deployment.sh
```

---

## 🎯 Expected Data Flow

```
User fills form in POS
       ↓
JavaScript calls fetch('/api/customers')
       ↓
Vercel Function (vercel_app.py)
       ↓
Flask route: @app.route('/api/customers', methods=['POST'])
       ↓
Service: services.save_customer(data)
       ↓
Adapter: db_supabase.customer_save(data)
       ↓
Supabase: client.table('customers').insert(data)
       ↓
Database: customers table
       ↓
✅ Data saved!
```

---

## 📝 Sample Test Data

### Test Customer:
```
Name: Rahul Kumar
Phone: 9876543210
Email: rahul@test.com
Address: Shop No 5, Market Road
```

### Test Sale:
```
Customer: Rahul Kumar
Products: 
  - Cow Milk (1 L) = ₹64
  - Paneer (250 g) = ₹100
Total: ₹164
Payment: Cash
```

### Expected in Supabase:

**customers table:**
```
id: uuid-xxxxx
name: Rahul Kumar
phone: 9876543210
email: rahul@test.com
address: Shop No 5, Market Road
balance: 0
```

**sales table:**
```
id: uuid-yyyyy
customer_id: uuid-xxxxx
customer_name: Rahul Kumar
items: [{"name":"Cow Milk","qty":1,"price":64},...]
total_amount: 164.0
paid_amount: 164.0
payment_mode: cash
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Vercel deployment shows "Ready"
2. ✅ `/api/health` returns `{"status": "healthy"}`
3. ✅ `/api/products` returns product list
4. ✅ Can add customer from POS UI
5. ✅ Customer appears in Supabase Table Editor
6. ✅ Can create sale from POS UI
7. ✅ Sale appears in Supabase Table Editor
8. ✅ No errors in browser console
9. ✅ No errors in Vercel logs
10. ✅ Data persists after page refresh

---

## 🚀 Quick Commands

```bash
# Deploy
cd flask_app
vercel --prod

# Check logs
vercel logs --follow

# Test locally first
python vercel_app.py

# Test API
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/products
curl https://your-app.vercel.app/api/customers
```

---

**Ready to deploy! Follow the steps above.** 🎉

**Built with ❤️ for Indian Dairy Shops**
