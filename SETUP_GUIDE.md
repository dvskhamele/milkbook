# MilkBook End-to-End Backend Connection Guide

## 🚀 Complete Setup (Frontend + Backend + Auth)

### Step 1: Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for setup to complete

2. **Run Database Schema**
   - Go to **SQL Editor**
   - Copy contents of `backend/schema.sql`
   - Paste and run
   - Run `backend/functions.sql` for helper functions

3. **Get Credentials**
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** → `SUPABASE_URL`
     - **anon/public key** → `SUPABASE_ANON_KEY`
     - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 2: Netlify/Vercel Setup

#### Option A: Netlify (Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link project
netlify link

# Install function dependencies
cd netlify/functions
npm install

# Deploy
netlify deploy --prod
```

#### Option B: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

### Step 3: Environment Variables

Set these in your hosting platform:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

---

### Step 4: Update Frontend

#### 1. Update login.html

Replace these lines (around line 180):

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual credentials.

#### 2. Update netlify-client.js

Find the `USE_API` variable (around line 280):

```javascript
const USE_API = false; // Set to true to use Netlify functions
```

Change to:

```javascript
const USE_API = true; // Use backend API
```

---

### Step 5: Setup PIN Authentication

#### Create Users with PIN

Run this SQL in Supabase SQL Editor:

```sql
-- Insert sample user with PIN 123456
INSERT INTO users (id, shop_id, role, pin_hash)
VALUES (
  'user-001',
  'shop-001',
  'admin',
  123456 * 12345  -- PIN * 12345 (simple hash)
);

-- Insert sample shop
INSERT INTO shops (id, name, location)
VALUES ('shop-001', 'Gopal Dairy Shop', 'Vadgaon, Pune');
```

#### Default Login Credentials:

- **Shop ID**: `shop-001`
- **User ID**: `user-001`
- **PIN**: `123456`

---

### Step 6: Test Login Flow

1. **Open login.html**
   - Go to `http://localhost:8888/login.html` (Netlify dev)
   - OR `https://your-site.netlify.app/login.html`

2. **PIN Login**
   - Shop ID: `shop-001`
   - User ID: `user-001`
   - PIN: `123456`
   - Click Login

3. **Should redirect to index.html**
   - If not logged in, redirects back to login.html
   - If logged in, shows main app

---

### Step 7: Test Backend Connection

#### With API Mode ON (`USE_API = true`):

1. **Create Farmer**
   ```javascript
   const { farmer } = await window.MilkBookAPI.farmers.create({
     name: 'Ram Kishaan',
     phone: '9876543210'
   });
   ```

2. **Create Milk Entry**
   ```javascript
   const { entry } = await window.MilkBookAPI.milkEntries.create({
     farmer_id: farmer.id,
     date: '2024-02-19',
     quantity: 10.5,
     amount: 420
   });
   ```

3. **Fetch Data**
   ```javascript
   const { farmers } = await window.MilkBookAPI.farmers.getAll();
   const { entries } = await window.MilkBookAPI.milkEntries.getAll();
   ```

#### With API Mode OFF (`USE_API = false`):

- Uses localStorage (works offline)
- Syncs to backend when API mode enabled

---

## 📁 File Structure

```
milkbook/
├── login.html                  # Login page (PIN + Password)
├── index.html                  # Main app (with auth check)
├── pos-demo.html              # POS demo
├── netlify-client.js          # API client (with auth)
├── netlify/
│   └── functions/
│       ├── auth-verify-pin.js  # PIN verification
│       ├── farmers.js          # Farmers API
│       └── milk-entries.js     # Milk entries API
├── backend/
│   ├── schema.sql              # Database schema
│   ├── functions.sql           # Helper functions
│   └── README.md              # Backend docs
└── SETUP_GUIDE.md             # This file
```

---

## 🔐 Authentication Flow

### PIN Login:

```
User enters Shop ID + User ID + PIN
        ↓
Frontend calls /auth-verify-pin
        ↓
Backend verifies PIN hash
        ↓
Returns token + user info
        ↓
Frontend stores session in localStorage
        ↓
Redirects to index.html
```

### Password Login:

```
User enters email + password
        ↓
Supabase Auth verifies
        ↓
Returns JWT token
        ↓
Frontend gets user profile
        ↓
Stores session
        ↓
Redirects to app
```

---

## 🧪 Testing Checklist

- [ ] Login page loads
- [ ] PIN login works (shop-001, user-001, 123456)
- [ ] Password login works
- [ ] Redirects to index.html after login
- [ ] index.html checks authentication
- [ ] Redirects to login.html if not logged in
- [ ] Farmers load from backend (if USE_API = true)
- [ ] Milk entries save to backend
- [ ] Logout works
- [ ] Session expires after 24 hours

---

## 🚨 Troubleshooting

### "Invalid PIN"
- Check PIN hash in database (PIN * 12345)
- Verify Shop ID and User ID match

### "Unauthorized"
- Check token in localStorage
- Verify session not expired
- Check SUPABASE_SERVICE_ROLE_KEY

### "Failed to load data"
- Check API endpoints are deployed
- Verify CORS headers
- Check network tab for errors

### "CORS error"
- Verify CORS headers in functions
- Check Netlify/Vercel redirects

---

## 💡 Pro Tips

1. **Development Mode**
   - Set `USE_API = false` for offline development
   - Switch to `true` for production

2. **Session Management**
   - Sessions expire after 24 hours
   - Clear with `localStorage.removeItem('milkbook_session')`

3. **API Mode**
   - Works offline with localStorage
   - Syncs to backend when online
   - Best of both worlds!

4. **Security**
   - Never expose SUPABASE_SERVICE_ROLE_KEY in frontend
   - Use SUPABASE_ANON_KEY for client-side
   - All backend functions use service_role_key

---

## 📞 Support

- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Netlify Docs: [docs.netlify.com](https://docs.netlify.com)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)

---

**You're all set! Frontend + Backend + Auth = Complete! 🎉**
