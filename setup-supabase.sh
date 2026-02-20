#!/bin/bash

# MilkRecord - Automated Supabase Setup Script
# Run this after unpausing your Supabase project

echo "🚀 MilkRecord Supabase Setup"
echo "=============================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Run: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"

# Link project
PROJECT_REF="qfpvsyhtijwxkmyrqswa"
echo ""
echo "🔗 Linking project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project. Make sure it's unpaused in Supabase dashboard"
    echo "   Go to: https://supabase.com/dashboard/project/$PROJECT_REF"
    exit 1
fi

echo "✅ Project linked"

# Push database schema
echo ""
echo "📊 Pushing database schema..."
supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema"
    exit 1
fi

echo "✅ Database schema pushed"

# Get project URL
echo ""
echo "📍 Getting project URL..."
PROJECT_URL=$(supabase projects api-keys --project-ref $PROJECT_REF 2>&1 | grep -o 'https://[^"]*supabase.co' | head -1)

if [ -z "$PROJECT_URL" ]; then
    PROJECT_URL="https://$PROJECT_REF.supabase.co"
fi

echo "✅ Project URL: $PROJECT_URL"

# Save to .env.local
echo ""
echo "💾 Saving credentials to .env.local..."

cat > .env.local << EOF
# Supabase Configuration (Auto-generated)
SUPABASE_URL=$PROJECT_URL
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
EOF

echo "✅ Credentials saved to .env.local"

# Instructions
echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo "=============================="
echo ""
echo "⚠️  IMPORTANT: You need to get your API keys manually:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo "2. Copy 'anon/public' key"
echo "3. Copy 'service_role' key"
echo "4. Paste them in .env.local"
echo ""
echo "Or use the web setup:"
echo "👉 https://milkrecord.in/setup.html"
echo ""
echo "Then run the SQL schema:"
echo "👉 Open supabase-schema.sql in Supabase SQL Editor"
echo ""
