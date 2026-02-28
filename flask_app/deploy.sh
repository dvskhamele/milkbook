#!/bin/bash
# MilkRecord Vercel Deployment Script
# Automates the entire deployment process

set -e  # Exit on error

echo "🚀 MilkRecord Vercel Deployment"
echo "================================"
echo ""

# Check if in correct directory
if [ ! -f "vercel_app.py" ]; then
    echo "❌ Please run this script from flask_app directory"
    echo "   cd flask_app"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel login..."
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel:"
    vercel login
fi

# Check environment variables
echo ""
echo "⚙️  Environment Variables Check:"
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your Supabase credentials:"
    echo "   SUPABASE_URL=..."
    echo "   SUPABASE_KEY=..."
    echo ""
    read -p "Press Enter after updating .env..."
fi

# Verify Supabase credentials
if grep -q "your-project.supabase.co" .env 2>/dev/null; then
    echo "⚠️  Supabase credentials not configured in .env"
    echo "📝 Please update .env with actual Supabase URL and key"
    echo ""
    read -p "Press Enter after updating .env..."
fi

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

# Get deployment URL
DEPLOY_URL=$(vercel --prod | grep "https://" | head -1 | awk '{print $2}')

if [ -z "$DEPLOY_URL" ]; then
    echo "❌ Deployment failed or URL not found"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "🌐 Your app is live at:"
echo "   $DEPLOY_URL"
echo ""
echo "📱 Access points:"
echo "   POS Billing: $DEPLOY_URL/pos"
echo "   Collection:  $DEPLOY_URL/collection"
echo "   API Health:  $DEPLOY_URL/api/health"
echo ""
echo "🧪 Testing API endpoints..."
echo ""

# Test health endpoint
HEALTH_URL="$DEPLOY_URL/api/health"
if curl -s "$HEALTH_URL" | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed (might be cold start)"
    echo "   Try again in a few seconds: curl $HEALTH_URL"
fi

echo ""
echo "📝 Next Steps:"
echo "   1. Open $DEPLOY_URL/pos in your browser"
echo "   2. Test creating a sale"
echo "   3. Check Supabase dashboard for data"
echo "   4. Set up environment variables in Vercel dashboard if needed"
echo ""
echo "🎉 Deployment complete!"
