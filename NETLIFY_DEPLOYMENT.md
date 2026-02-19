# MilkBook Netlify Deployment Guide

## 🚀 Quick Deploy

### 1. One-Click Deploy (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/dvskhamele/milkbook)

### 2. Manual Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Deploy
netlify deploy --prod
```

---

## ⚙️ Configuration

### Environment Variables Required

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 📁 File Structure

```
milkbook/
├── netlify/
│   └── functions/
│       ├── farmers.js          # Farmers CRUD API
│       ├── milk-entries.js     # Milk entries CRUD API
│       └── package.json        # Function dependencies
├── netlify.toml                # Netlify configuration
├── netlify-client.js           # Frontend API client
├── index.html                  # Main app
└── pos-demo.html              # POS demo
```

---

## 🔌 API Endpoints

Once deployed, your APIs will be available at:

```
GET    /.netlify/functions/farmers
POST   /.netlify/functions/farmers
PUT    /.netlify/functions/farmers/:id
DELETE /.netlify/functions/farmers/:id

GET    /.netlify/functions/milk-entries
POST   /.netlify/functions/milk-entries
PUT    /.netlify/functions/milk-entries/:id
DELETE /.netlify/functions/milk-entries/:id
```

---

## 💻 Using the API Client

Include in your HTML:

```html
<script src="netlify-client.js"></script>
```

### Example Usage:

```javascript
// Get all farmers
const { farmers } = await window.MilkBookAPI.farmers.getAll();

// Create farmer
const { farmer } = await window.MilkBookAPI.farmers.create({
  name: 'Ram Kishaan',
  mobile: '9876543210',
  dairy_center_id: 'your-center-id'
});

// Create milk entry
const { entry } = await window.MilkBookAPI.milkEntries.create({
  farmer_id: 'farmer-id',
  day: '2024-02-19',
  session: 'Morning',
  animal: 'cow',
  qty: 10.5,
  fat: 3.5,
  snf: 8.5,
  rate_per_l: 40,
  amount: 420
});
```

---

## 🔄 Hybrid Mode (API + localStorage)

The client supports **hybrid mode** - uses API when available, falls back to localStorage:

```javascript
// In netlify-client.js, set:
const USE_API = true;  // Use Netlify functions
// or
const USE_API = false; // Use localStorage (default)
```

**Benefits**:
- ✅ Works offline (localStorage)
- ✅ Syncs when online (API)
- ✅ Zero downtime during migration

---

## 🧪 Local Development

```bash
# Install dependencies
cd netlify/functions
npm install

# Start local dev server
netlify dev

# Access at http://localhost:8888
```

---

## 📊 Database Schema

The functions work with these Supabase tables:

### farmers
- id (UUID)
- dairy_center_id (UUID)
- name (TEXT)
- mobile (TEXT)
- address (TEXT)
- advance (DECIMAL)
- balance (DECIMAL)
- animal_type (TEXT)
- active (BOOLEAN)
- image_data (TEXT)
- gst_no (TEXT)

### milk_entries
- id (UUID)
- dairy_center_id (UUID)
- farmer_id (UUID)
- day (DATE)
- session (TEXT)
- animal (TEXT)
- qty (DECIMAL)
- fat (DECIMAL)
- snf (DECIMAL)
- rate_per_l (DECIMAL)
- amount (DECIMAL)
- collection_point_id (UUID)
- slip_number (TEXT)
- images (JSONB)
- edited (BOOLEAN)
- edited_at (TIMESTAMP)

---

## 🔐 Security

### CORS
All functions include CORS headers for cross-origin requests.

### Rate Limiting
Netlify provides automatic rate limiting:
- 125,000 function invocations/month (Free tier)
- Unlimited on paid plans

### Authentication
For production, add Supabase auth:

```javascript
const authHeader = event.headers.authorization;
if (!authHeader) {
  return { statusCode: 401, body: 'Unauthorized' };
}

// Validate JWT token
const { data: { user } } = await supabase.auth.getUser(
  authHeader.replace('Bearer ', '')
);
```

---

## 📈 Monitoring

### Netlify Dashboard
- Function logs: Site → Functions → Logs
- Error tracking: Site → Deploys → Deploy logs

### Supabase Dashboard
- Database logs: Database → Logs
- API usage: Settings → API

---

## 🚨 Troubleshooting

### "Function not found"
- Check `netlify.toml` functions path
- Ensure function files are in `netlify/functions/`

### "CORS error"
- Verify CORS headers in function
- Check Netlify redirects in `netlify.toml`

### "Supabase connection failed"
- Verify environment variables
- Check Supabase project status

### "Function timeout"
- Optimize database queries
- Add pagination for large datasets
- Consider upgrading Netlify plan

---

## 💰 Cost Estimation

**Free Tier** (Hobby):
- 100GB bandwidth/month
- 125k function invocations/month
- Perfect for development

**Pro Tier** ($19/month):
- 1TB bandwidth/month
- 1M function invocations/month
- Recommended for production

---

## 🎯 Next Steps

1. ✅ Deploy to Netlify
2. ✅ Set environment variables
3. ✅ Test API endpoints
4. ✅ Enable `USE_API = true` in client
5. ✅ Monitor usage in dashboard

---

## 📞 Support

- Netlify Docs: [docs.netlify.com](https://docs.netlify.com)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- MilkBook Issues: GitHub Issues

---

**Deployed with ❤️ using Netlify + Supabase**
