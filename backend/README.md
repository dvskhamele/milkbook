# MilkBook Backend Architecture

## 🎯 Philosophy (LOCKED)

**Frontend is FINAL. Backend must ADAPT to frontend, not the other way around.**

### Core Principles:

1. **Every module is independent** in data, shared only by identity references
2. **NO global auth today** - App-scoped authentication only
3. **NO schema rewrite later** - Future-proof via `external_ref_id`, `external_source`, `external_meta`
4. **Simple auth** - Supabase Auth (Email/Phone/Google)
5. **Phase-1 backend** - Dairy Shop app only

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Frontend (FINAL)                   │
│  index.html, pos-demo.html, netlify-client.js  │
└───────────────────┬─────────────────────────────┘
                    │ HTTP/REST
                    ▼
┌─────────────────────────────────────────────────┐
│         Vercel Serverless Functions             │
│  /api/farmers, /api/milk-entries, etc.         │
└───────────────────┬─────────────────────────────┘
                    │ PostgreSQL
                    ▼
┌─────────────────────────────────────────────────┐
│              Supabase Database                  │
│  shops, users, farmers, milk_entries, etc.     │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Authentication

### What We Use:
- ✅ **Supabase Auth** only
- ✅ Email / Phone / Google login
- ✅ App-scoped tokens (valid ONLY for milkrecord-dairy)

### What We DON'T Use (Now):
- ❌ SSO federation
- ❌ Cross-app auth
- ❌ External Identity Providers

### Critical Rule:
> **Auth is app-scoped.** Token is valid ONLY for milkrecord-dairy.
> Later: Other apps will have their own auth.
> Linking happens by `external_user_ref`, NOT shared login.

---

## 📊 Database Design

### The One Rule:
> **Every module is independent in data, shared only by identity references.**

### Future-Proofing Fields (EVERY table):
```sql
external_ref_id TEXT NULL,
external_source TEXT NULL, -- 'bmc', 'servicetrack', 'cheque', etc
external_meta JSONB NULL
```

**This is the entire future-proofing mechanism.**

---

## 🗄️ Required Tables

### 1. **shops**
```sql
- id (UUID)
- name (TEXT)
- location (TEXT)
- timezone (TEXT)
- created_at, updated_at
```

### 2. **users** (Profile, linked to Supabase Auth)
```sql
- id (UUID, same as auth.uid)
- role (TEXT) -- 'admin', 'user'
- shop_id (UUID, FK)
- created_at, updated_at
```

### 3. **farmers**
```sql
- id (UUID)
- shop_id (UUID, FK)
- name (TEXT)
- phone (TEXT)
- balance (DECIMAL)
- external_ref_id, external_source, external_meta (NULLable)
- created_at, updated_at
```

### 4. **milk_intake_entries**
```sql
- id (UUID)
- shop_id, farmer_id (UUID, FK)
- date (DATE)
- shift (TEXT) -- 'Morning', 'Evening'
- animal (TEXT) -- 'cow', 'buffalo'
- quantity, fat, snf, rate_per_l, amount (DECIMAL)
- reading_mode (TEXT) -- 'manual', 'analyzer'
- images (JSONB)
- edited (BOOLEAN), edited_at (TIMESTAMP)
- external_ref_id, external_source, external_meta (NULLable)
- created_at, updated_at
```

### 5. **retail_sales**
```sql
- id (UUID)
- shop_id (UUID, FK)
- customer_name, customer_phone (TEXT)
- items (JSONB) -- [{name, qty, rate, amount}]
- total_amount (DECIMAL)
- payment_mode (TEXT) -- 'cash', 'upi', 'credit'
- external_ref_id, external_source, external_meta (NULLable)
- created_at, updated_at
```

### 6. **balances** (Udhar / Advance)
```sql
- id (UUID)
- shop_id (UUID, FK)
- entity_type (TEXT) -- 'farmer', 'customer'
- entity_id (UUID)
- amount (DECIMAL)
- balance_type (TEXT) -- 'udhar', 'advance'
- external_ref_id, external_source, external_meta (NULLable)
- created_at, updated_at
```

### 7. **audit_events** (Local trace only)
```sql
- id (UUID)
- shop_id, user_id (UUID, FK)
- action (TEXT) -- 'create', 'update', 'delete'
- entity (TEXT), entity_id (UUID)
- before, after (JSONB)
- created_at
```

---

## 🔒 Security (RLS)

### Row Level Security Rules:

1. **User can only see data for their shop_id**
2. **Admin can see all for shop**
3. **No cross-shop access**
4. **No complex role engines**

### Example Policy:
```sql
CREATE POLICY farmers_shop_select ON farmers
    FOR SELECT
    USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );
```

---

## 🌐 API Pattern

### DO:
- ✅ `/api/intake/create`
- ✅ `/api/sales/create`
- ✅ `/api/farmers/update`
- ✅ `/api/export/daily`

### DO NOT:
- ❌ Giant generic endpoints
- ❌ Cross-module APIs
- ❌ Assume future module presence

---

## 🚀 Deployment

### Vercel Functions:
```bash
# Install dependencies
cd backend/functions
npm install

# Deploy
vercel --prod
```

### Environment Variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🔮 Future Integration (NO REFACTOR)

### Example: Cheque Module Added Later

**Cheque app:**
- Has its own auth
- Own database
- Own UI

**Integration happens by:**
- Writing `external_ref_id` into this app's records
- OR linking via shared `shop_id` + date

**NO schema change required.**

### Example: ServiceTrack Added Later

**ServiceTrack:**
- Logs equipment failures
- Has its own DB

**MilkRecord:**
- Shows "Equipment issue not recorded"
- Later can pull summary via API, not DB join

**Again: no refactor.**

---

## 📝 Usage Examples

### Create Farmer:
```javascript
const response = await fetch('/api/farmers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Ram Kishaan',
    phone: '9876543210',
    balance: 0
  })
});

const { farmer } = await response.json();
```

### Create Milk Entry:
```javascript
const response = await fetch('/api/milk-entries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    farmer_id: 'farmer-uuid',
    date: '2024-02-19',
    shift: 'Morning',
    animal: 'cow',
    quantity: 10.5,
    fat: 3.5,
    snf: 8.5,
    rate_per_l: 40,
    amount: 420
  })
});

const { entry } = await response.json();
```

### Get Daily Summary:
```javascript
const response = await fetch(
  '/api/milk-entries?date=2024-02-19',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { entries } = await response.json();
```

---

## 🧪 Testing

### Local Development:
```bash
# Start Supabase local (optional)
supabase start

# Run migrations
supabase db push

# Test functions
curl http://localhost:3000/api/farmers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Production:
```bash
# Deploy to Vercel
vercel --prod

# Test endpoint
curl https://your-site.vercel.app/api/farmers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Monitoring

### Supabase Dashboard:
- Database logs: **Database** → **Logs**
- API usage: **Settings** → **API**
- Auth users: **Authentication** → **Users**

### Vercel Dashboard:
- Function logs: **Deployments** → **View Logs**
- Performance: **Analytics** → **Functions**

---

## 💰 Cost Estimation

**Supabase Free Tier:**
- 500MB database
- 50,000 monthly active users
- 2GB bandwidth

**Vercel Free Tier:**
- 100GB bandwidth
- 100GB function runtime
- Unlimited deployments

**Perfect for Phase-1!**

---

## 🎯 Checklist

- [x] Schema created with future-proof fields
- [x] RLS policies implemented
- [x] Auth flow documented
- [x] API endpoints created
- [x] Audit logging implemented
- [x] Helper functions created
- [x] Documentation complete

---

**Backend is READY. Frontend is FINAL. Let's build! 🚀**
