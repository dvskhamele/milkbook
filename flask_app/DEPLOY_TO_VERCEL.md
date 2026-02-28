# 🚀 Deploy to Vercel - Complete Guide

## Quick Deploy (3 Steps)

### Step 1: Setup Supabase (5 minutes)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up / Login
   - Click "New Project"

2. **Create Database Tables**
   - Go to SQL Editor in Supabase
   - Copy entire contents of `supabase_schema.sql`
   - Click "Run" to execute all queries
   - Verify 7 tables created:
     - farmers
     - customers
     - products
     - sales
     - milk_collections
     - sync_logs
     - devices

3. **Get API Credentials**
   - Go to Settings → API
   - Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy **anon public** key (long string starting with `eyJ...`)

---

### Step 2: Configure Environment (2 minutes)

1. **Create .env file**
   ```bash
   cd flask_app
   cp .env.example .env
   ```

2. **Edit .env file**
   ```bash
   nano .env  # or use your favorite editor
   ```

3. **Add your credentials**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SECRET_KEY=your-secret-key-change-this
   ```

---

### Step 3: Deploy to Vercel (3 minutes)

#### Option A: Using Deploy Script (Easiest)

```bash
cd flask_app
./deploy.sh
```

The script will:
- Check if you're logged in to Vercel
- Verify environment variables
- Deploy to Vercel
- Test the deployment
- Give you the live URL

#### Option B: Manual Deploy

```bash
cd flask_app

# Login to Vercel (first time only)
vercel login

# Deploy
vercel --prod
```

---

## 🎉 Your App is Live!

You'll get a URL like:
```
https://milkrecord-pos.vercel.app
```

### Access Points:

- **POS Billing**: https://your-app.vercel.app/pos
- **Collection**: https://your-app.vercel.app/collection
- **API Health**: https://your-app.vercel.app/api/health

---

## 🧪 Test Your Deployment

### 1. Test Health Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "runtime": "cloud",
  "platform": "vercel"
}
```

### 2. Test Products API
```bash
curl https://your-app.vercel.app/api/products
```

Expected: List of products (may be empty initially)

### 3. Test in Browser
1. Open: `https://your-app.vercel.app/pos`
2. Click "➕ Add" to add a customer
3. Add products to cart
4. Click "CASH" or "LIKH LO" to save sale
5. Check Supabase dashboard → Table Editor → sales table

---

## ⚙️ Configure Environment Variables in Vercel

If you didn't use .env file:

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add these variables:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = your-anon-key
SECRET_KEY = your-secret-key
PYTHON_VERSION = 3.9
FLASK_ENV = production
RUNTIME = cloud
VERCEL = 1
```

5. Click "Save"
6. Redeploy: `vercel --prod`

---

## 🐛 Troubleshooting

### Issue: Deployment Fails

**Check logs:**
```bash
vercel logs
```

**Common fixes:**
- Missing requirements: Check `requirements.txt`
- Python version: Ensure `PYTHON_VERSION=3.9` in Vercel
- Import errors: Check file paths in `vercel_app.py`

### Issue: API Returns 500 Error

**Check:**
1. Supabase credentials are correct
2. Database schema is deployed
3. RLS policies are enabled
4. Environment variables are set in Vercel

**View logs:**
```bash
vercel logs --follow
```

### Issue: Data Not Saving

**Check Supabase:**
1. Go to Supabase Dashboard
2. Table Editor
3. Check if tables have data
4. Check RLS policies allow inserts

**Test directly:**
```bash
curl -X POST https://your-app.vercel.app/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"1234567890"}'
```

### Issue: Cold Start (Slow First Load)

Vercel serverless functions have cold starts (~2-5 seconds).

**Solutions:**
- Use Vercel Pro (faster cold starts)
- Keep endpoint warm with ping service
- Accept it (subsequent requests are fast)

---

## 📊 Monitor Your Deployment

### Vercel Dashboard
- **Analytics**: View traffic and performance
- **Deployments**: See deployment history
- **Logs**: View function logs
- **Settings**: Configure domain, env vars, etc.

### Supabase Dashboard
- **Table Editor**: View/edit data
- **Logs**: API logs
- **Usage**: Track database usage
- **Settings**: Manage project

---

## 🔄 Update Deployment

After making changes:

```bash
cd flask_app
git add .
git commit -m "Your changes"
git push origin main

# Vercel auto-deploys from Git
# Or manually:
vercel --prod
```

---

## 🌐 Custom Domain (Optional)

1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Vercel: Project Settings → Domains
3. Add your domain
4. Update DNS records as shown
5. Wait for propagation (5-10 minutes)

---

## 💡 Pro Tips

1. **Use Preview Deployments**
   - Every git push creates a preview
   - Test before production deploy

2. **Enable Vercel Analytics**
   - Free analytics for your app
   - Settings → Analytics → Enable

3. **Set Up Alerts**
   - Vercel → Settings → Notifications
   - Get alerts for failed deployments

4. **Use Environment Variables**
   - Never commit .env to git
   - Use Vercel dashboard for production vars

5. **Monitor Supabase Usage**
   - Free tier: 500MB database, 2GB bandwidth
   - Check Usage page regularly

---

## 📞 Support

### Documentation
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **Flask**: https://flask.palletsprojects.com

### Community
- **Vercel Discord**: https://vercel.com/discord
- **Supabase Discord**: https://supabase.com/discord

### Logs
```bash
# View deployment logs
vercel logs

# Follow logs in real-time
vercel logs --follow

# View specific deployment logs
vercel logs [deployment-url]
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Environment variables set
- [ ] Test deployment successful
- [ ] All API endpoints tested
- [ ] Frontend loads correctly
- [ ] Data saves correctly
- [ ] No console errors
- [ ] Supabase data visible
- [ ] Mobile responsive tested
- [ ] Custom domain configured (optional)

---

**🎉 Congratulations! Your MilkRecord POS is live!**

**Built with ❤️ for Indian Dairy Shops**
