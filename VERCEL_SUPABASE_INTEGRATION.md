# MilkBook - Vercel & Supabase Integration Guide

This guide explains how to connect MilkBook to Vercel Functions and Supabase database.

## 📋 Overview

This integration provides:
- **Cloud Database**: Supabase PostgreSQL database
- **Serverless API**: Vercel Functions for backend operations
- **Authentication**: Supabase Auth for user management
- **Real-time Sync**: Automatic data synchronization
- **Offline Support**: LocalStorage fallback for offline operations

## 🚀 Quick Start

### Step 1: Set Up Supabase

1. **Create Account**: Go to [supabase.com](https://supabase.com) and sign up
2. **Create Project**: Click "New Project" and fill in details
3. **Get Credentials**: 
   - Go to Settings → API
   - Copy `Project URL` and `service_role key`

### Step 2: Set Up Database

1. Open Supabase SQL Editor
2. Copy contents of `supabase-schema.sql`
3. Paste and run the script
4. Verify tables are created

### Step 3: Configure Environment Variables

Create `.env.local` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 5: Update Frontend

1. Open `supabase-client.js`
2. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY`
3. Include the script in your HTML pages

## 📁 Project Structure

```
deprecated-milkbook/
├── api/                          # Vercel Functions
│   ├── lib/
│   │   └── supabase.ts          # Supabase client utility
│   ├── auth/
│   │   └── signup.ts            # User signup endpoint
│   ├── farmers.ts               # Farmers CRUD API
│   ├── milk-entries.ts          # Milk entries CRUD API
│   ├── payments.ts              # Payments CRUD API
│   ├── sales.ts                 # Sales CRUD API
│   └── package.json             # API dependencies
├── supabase-schema.sql          # Database schema
├── supabase-client.js           # Browser Supabase client
├── vercel.json                  # Vercel configuration
├── ENVIRONMENT_SETUP.md         # Detailed environment setup
└── README.md                    # This file
```

## 🔌 API Endpoints

Once deployed, access APIs at:

```
GET    /api/farmers?dairy_center_id=xxx
POST   /api/farmers
PUT    /api/farmers?id=xxx
DELETE /api/farmers?id=xxx

GET    /api/milk-entries?dairy_center_id=xxx&date=2024-01-01
POST   /api/milk-entries
PUT    /api/milk-entries?id=xxx
DELETE /api/milk-entries?id=xxx

GET    /api/payments?dairy_center_id=xxx
POST   /api/payments
PUT    /api/payments?id=xxx
DELETE /api/payments?id=xxx

GET    /api/sales?dairy_center_id=xxx
POST   /api/sales
PUT    /api/sales?id=xxx
DELETE /api/sales?id=xxx

POST   /api/auth/signup
```

## 💻 Usage Examples

### Create Farmer

```javascript
const farmer = await window.milkbookApi.farmers.create({
  dairy_center_id: 'your-dairy-id',
  name: 'Ramesh Kumar',
  mobile: '9876543210',
  address: 'Vadgaon, Pune',
  advance_amount: 1000,
  animal_type: 'Cow'
});
```

### Get Milk Entries

```javascript
const entries = await window.milkbookApi.milkEntries.getAll({
  dairy_center_id: 'your-dairy-id',
  date: '2024-01-15',
  shift: 'Morning'
});
```

### Create Payment

```javascript
const payment = await window.milkbookApi.payments.create({
  dairy_center_id: 'your-dairy-id',
  farmer_id: 'farmer-id',
  date: '2024-01-15',
  type: 'Payment',
  amount: 5000,
  payment_mode: 'UPI',
  reference_number: 'UPI123456'
});
```

### Create Sale

```javascript
const sale = await window.milkbookApi.sales.create({
  dairy_center_id: 'your-dairy-id',
  customer_name: 'Shop Owner',
  customer_mobile: '9876543210',
  date: '2024-01-15',
  items: [
    { product_id: '1', name: 'Milk', quantity: 10, rate: 64, amount: 640 }
  ],
  total_amount: 640,
  payment_status: 'paid'
});
```

## 🔐 Authentication

### Sign Up

```javascript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    name: 'User Name',
    mobile: '9876543210'
  })
});
```

### Sign In (using Supabase client)

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
});
```

## 📊 Database Schema

### Main Tables

- **dairy_centers**: Dairy shop information
- **farmers**: Farmer details and advances
- **milk_entries**: Daily milk collection records
- **payments**: Payments to farmers
- **sales**: Milk/product sales
- **products**: Product catalog
- **inventory**: Stock management
- **evidence_records**: Audit trail (MilkLedger)
- **users**: User accounts

## 🔄 Data Synchronization

The system supports both online and offline modes:

### Online Mode
- Data is saved directly to Supabase
- Real-time sync across devices
- Automatic backup

### Offline Mode
- Data saved to localStorage
- Sync when connection restored
- Conflict resolution on sync

## 🛠️ Development

### Local Development

```bash
# Install dependencies
cd api
npm install

# Run locally
vercel dev

# Access at http://localhost:3000/api/...
```

### Testing APIs

```bash
# Test Farmers API
curl http://localhost:3000/api/farmers?dairy_center_id=test-id

# Test with POST
curl -X POST http://localhost:3000/api/farmers \
  -H "Content-Type: application/json" \
  -d '{"dairy_center_id":"test","name":"Test Farmer","mobile":"1234567890"}'
```

## 📝 Migration from LocalStorage

To migrate existing data from localStorage to Supabase:

```javascript
// Get existing data from localStorage
const state = JSON.parse(localStorage.getItem('milkbook_data'));

// Migrate farmers
for (const farmer of state.farmers || []) {
  await window.milkbookApi.farmers.create({
    dairy_center_id: state.dairyInfo.id,
    ...farmer
  });
}

// Migrate milk entries
for (const entry of state.milkEntries || []) {
  await window.milkbookApi.milkEntries.create({
    dairy_center_id: state.dairyInfo.id,
    ...entry
  });
}

// Continue for payments, sales, etc.
```

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their dairy center's data
- Service role key kept server-side only
- CORS configured for API endpoints
- Input validation on all endpoints

## 📈 Monitoring

### Supabase Logs
- Dashboard → Logs
- Database query logs
- Authentication logs

### Vercel Logs
- Dashboard → Deployments → View Logs
- Function execution logs
- Error tracking

## 🐛 Troubleshooting

### Common Issues

1. **API returns 404**
   - Check Vercel deployment status
   - Verify function paths in `vercel.json`

2. **Database connection error**
   - Verify `SUPABASE_URL` is correct
   - Check `SUPABASE_SERVICE_ROLE_KEY`

3. **Permission denied**
   - Check RLS policies in Supabase
   - Verify user has proper dairy_center_id

4. **CORS errors**
   - API includes CORS headers
   - Check browser console for details

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [PostgreSQL Documentation](https://postgresql.org/docs)

## 🤝 Support

For issues or questions:
1. Check logs in Supabase and Vercel dashboards
2. Review `ENVIRONMENT_SETUP.md` for detailed setup
3. Test APIs using curl or Postman
4. Check browser console for client-side errors

## 📄 License

This integration is part of the MilkBook project.
