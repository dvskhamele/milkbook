# MilkBook Local Development

## Quick Start

### 1. Set Environment Variables

Edit `.env.local` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Local Server

```bash
npm run dev
```

Server starts at: **http://localhost:3000**

---

## Available Endpoints

### Auth

```bash
# Create Account
curl -X POST http://localhost:3000/api/auth/create-account \
  -H "Content-Type: application/json" \
  -d '{
    "shop_name": "Gopal Dairy",
    "owner_name": "Ramesh",
    "mobile": "9876543210",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9876543210",
    "password": "password123"
  }'
```

### Subscription

```bash
# Get Subscription Status
curl http://localhost:3000/api/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Modules
curl http://localhost:3000/api/modules \
  -H "Authorization: Bearer YOUR_TOKEN"

# Upgrade to Annual
curl -X POST http://localhost:3000/api/subscription/upgrade \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 200000}'
```

### Farmers

```bash
# Get Farmers
curl http://localhost:3000/api/farmers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create Farmer
curl -X POST http://localhost:3000/api/farmers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramesh Kumar",
    "mobile": "9876543210"
  }'
```

---

## Test with Frontend

1. Start server: `npm run dev`
2. Open `login.html` in browser
3. Create account or login
4. Test all features

---

## Debugging

Server logs show:
- Request method & path
- Response status codes
- Errors

Example output:
```
🚀 Starting local serverless server on http://localhost:3000

POST /api/auth/create-account
  → 201
✅ Server ready at http://localhost:3000
```

---

## Stop Server

Press `Ctrl+C` in terminal
