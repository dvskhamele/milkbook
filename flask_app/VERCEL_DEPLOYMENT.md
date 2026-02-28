# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: https://vercel.com/signup
2. **Supabase Account**: https://supabase.com
3. **Vercel CLI**: `npm install -g vercel`

---

## Step 1: Setup Supabase

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Wait for project to initialize

### 1.2 Run Database Schema
1. Go to SQL Editor in Supabase
2. Copy `supabase_schema.sql`
3. Run all queries
4. Verify tables created

### 1.3 Get API Credentials
1. Go to Settings → API
2. Copy **Project URL** → `SUPABASE_URL`
3. Copy **anon public** key → `SUPABASE_KEY`

---

## Step 2: Configure Environment

Create `.env` file in `flask_app/`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
SECRET_KEY=your-secret-key-change-this
FLASK_ENV=production
```

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
cd flask_app

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set root directory to `flask_app`
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SECRET_KEY`
5. Click Deploy

---

## Step 4: Add Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = your-anon-key
SECRET_KEY = your-secret-key
PYTHON_VERSION = 3.9
FLASK_ENV = production
RUNTIME = cloud
VERCEL = 1
```

---

## Step 5: Test Deployment

### 5.1 Check Health
```bash
curl https://your-app.vercel.app/api/health
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

### 5.2 Test Products
```bash
curl https://your-app.vercel.app/api/products
```

### 5.3 Test Sales
```bash
curl -X POST https://your-app.vercel.app/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "items": [],
    "total_amount": 100.0,
    "paid_amount": 100.0,
    "payment_mode": "cash"
  }'
```

---

## Step 6: Access POS

Open in browser:
```
https://your-app.vercel.app/pos
```

---

## 📁 Project Structure for Vercel

```
flask_app/
├── vercel_app.py          ← Vercel entry point
├── vercel.json            ← Vercel configuration
├── requirements.txt       ← Python dependencies
├── .env                   ← Environment variables (DO NOT COMMIT)
├── .env.example          ← Template (safe to commit)
├── core/
│   ├── services.py       ← Business logic
│   └── sync_engine.py    ← Background sync (desktop only)
├── adapters/
│   ├── db_supabase.py    ← Supabase client
│   └── db_local.py       ← SQLite (desktop only)
└── apps/
    ├── dairy-pos-billing-software-india.html  ← POS UI
    └── collection.html     ← Collection UI
```

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Check Python version
vercel --debug

# Check requirements
pip install -r requirements.txt
```

### API Returns 500
```bash
# Check Vercel logs
vercel logs

# Check environment variables
vercel env ls
```

### Supabase Connection Fails
- Verify `SUPABASE_URL` is correct
- Verify `SUPABASE_KEY` is anon key (not service role)
- Check RLS policies in Supabase

---

## 🎯 Features Working on Vercel

✅ Product management
✅ Customer management
✅ Sales tracking
✅ Supabase sync
✅ Real-time data
✅ Multi-device support
✅ Offline-first (when back online)

---

## 📊 Monitoring

### Vercel Dashboard
- Analytics
- Function logs
- Deployment history

### Supabase Dashboard
- Database rows
- API logs
- Real-time subscriptions

---

## 🚀 Quick Deploy Commands

```bash
# First time
cd flask_app
vercel login
vercel --prod

# Subsequent deployments
vercel --prod
```

---

## 💡 Tips

1. **Use `.vercelignore`** to exclude unnecessary files
2. **Enable Vercel Analytics** for performance monitoring
3. **Set up custom domain** in Vercel settings
4. **Use preview deployments** for testing
5. **Monitor Supabase usage** to stay within free tier

---

**Deployed with ❤️ for Indian Dairy Shops**
