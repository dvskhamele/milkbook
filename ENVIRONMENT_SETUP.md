# MilkBook Environment Variables

This document describes the environment variables required for MilkBook to work with Vercel Functions and Supabase.

## Required Environment Variables

### Supabase Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (keep secret!) | `eyJhbG...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Get Your Supabase Credentials

1. Go to Project Settings → API
2. Copy the **Project URL** → `SUPABASE_URL`
3. Copy the **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`
   ⚠️ **Important**: Never expose the service_role key in client-side code!

### 3. Set Up Database Schema

1. Go to SQL Editor in Supabase
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. Verify all tables are created successfully

### 4. Configure Vercel Environment Variables

#### Option A: Using Vercel Dashboard

1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy your project

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
vercel --prod
```

#### Option C: Using .env.local (Development Only)

Create a `.env.local` file in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Never commit `.env.local` to version control!** It's already in `.gitignore`.

### 5. Enable Row Level Security (RLS)

The schema includes RLS policies. Make sure they're enabled:

1. Go to Authentication → Policies in Supabase
2. Verify policies are created for each table
3. Test that users can only access their own data

### 6. Test the Integration

```bash
# Install dependencies
cd api
npm install

# Run locally
npm run dev

# Test an endpoint
curl http://localhost:3000/api/farmers?dairy_center_id=your-id
```

## Security Best Practices

1. **Never commit secrets**: Keep `.env.local` out of version control
2. **Use service_role key only in API**: Never expose it in frontend code
3. **Enable RLS**: Always use Row Level Security policies
4. **Validate input**: All API endpoints validate incoming data
5. **Use HTTPS**: Vercel automatically provides HTTPS

## Troubleshooting

### Common Issues

#### "Invalid API key"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Make sure you're using the service_role key, not the anon key

#### "Table does not exist"
- Run the `supabase-schema.sql` script in Supabase SQL Editor
- Check that all tables were created successfully

#### "CORS error"
- API endpoints include CORS headers
- For local development, ensure you're accessing via localhost

#### "Permission denied"
- Check RLS policies in Supabase
- Verify user has proper permissions

## API Endpoints

Once deployed, your API will be available at:

```
https://your-domain.vercel.app/api/farmers
https://your-domain.vercel.app/api/milk-entries
https://your-domain.vercel.app/api/payments
https://your-domain.vercel.app/api/sales
https://your-domain.vercel.app/api/auth/signup
```

## Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev

# Access API at http://localhost:3000/api/...
```

## Deployment

```bash
# Deploy to production
vercel --prod

# Or use git integration
# Push to main branch for automatic deployment
```

## Support

For issues or questions:
1. Check Supabase logs: Dashboard → Logs
2. Check Vercel logs: Dashboard → Deployments → View Logs
3. Review API function logs in Vercel dashboard
