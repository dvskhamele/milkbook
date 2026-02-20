# 🚀 Supabase Setup - Quick Guide

## Your Supabase Project

**Project Name:** Zenith Dev  
**Project ID:** `qfpvsyhtijwxkmyrqswa`  
**Dashboard:** https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa

---

## ⚠️ IMPORTANT: Project is Paused

Your Supabase project is currently paused. You need to unpause it first.

### Step 1: Unpause Project

1. Go to: https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa
2. Click **"Unpause Project"** (or upgrade plan)
3. Wait for project to become active

---

## Step 2: Get Your API Keys

Once project is active:

1. Go to: https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa/settings/api
2. Copy these 2 values:
   - **Project URL** (e.g., `https://qfpvsyhtijwxkmyrqswa.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

---

## Step 3: Configure App

### Option A: Web Setup (Easiest)

1. Open: https://milkrecord.in/setup.html
2. Paste your **Project URL** and **anon key**
3. Click **💾 Save & Continue**
4. ✅ Done!

### Option B: Manual Setup

1. Open `.env.local` file
2. Replace placeholder values:
   ```env
   SUPABASE_URL=https://qfpvsyhtijwxkmyrqswa.supabase.co
   SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```
3. Save file

---

## Step 4: Create Database Tables

1. Go to: https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa/sql/new
2. Open `supabase-schema.sql` file
3. Copy ALL the SQL code
4. Paste in SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. ✅ All tables created!

You should see:
```
✅ Success. No rows returned
```

---

## Step 5: Test Connection

1. Open: https://milkrecord.in/test-supabase.html
2. Click **🔌 Test Connection**
3. Should show: "✅ Connected & Working"

---

## Step 6: Login & Use!

1. Open: https://milkrecord.in/login.html
2. Use demo credentials:
   - Shop: `Gopal Dairy Shop`
   - Email: `demo@milkrecord.in`
   - Password: `demo123`
3. Start using POS!

---

## 🆘 Automated Setup (Optional)

If you have Supabase CLI installed:

```bash
# Make script executable
chmod +x setup-supabase.sh

# Run setup
./setup-supabase.sh
```

This will:
- Link your project
- Push database schema
- Save credentials

---

## ✅ Checklist

- [ ] Project unpaused in Supabase dashboard
- [ ] API keys copied
- [ ] Credentials saved (via setup.html or .env.local)
- [ ] Database tables created (run supabase-schema.sql)
- [ ] Connection tested (test-supabase.html)
- [ ] Logged in and using app!

---

## 📞 Quick Links

| Purpose | URL |
|---------|-----|
| **Dashboard** | https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa |
| **API Keys** | https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa/settings/api |
| **SQL Editor** | https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa/sql/new |
| **Table Editor** | https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa/editor |
| **App Setup** | https://milkrecord.in/setup.html |
| **Test Connection** | https://milkrecord.in/test-supabase.html |
| **Login** | https://milkrecord.in/login.html |

---

**Start here:** https://supabase.com/dashboard/project/qfpvsyhtijwxkmyrqswa

**Unpause project → Get API keys → Configure app → Done!** 🎉
