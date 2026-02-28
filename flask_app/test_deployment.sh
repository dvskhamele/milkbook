#!/bin/bash
# MilkRecord POS - Deployment Test Script
# Run this after deploying to Vercel

set -e

echo "🧪 MilkRecord POS - Deployment Test"
echo "===================================="
echo ""

# Get Vercel URL from user
read -p "Enter your Vercel URL (e.g., milkbook-pos.vercel.app): " VERCEL_URL

# Remove https:// if present
VERCEL_URL=$(echo $VERCEL_URL | sed 's|https://||g' | sed 's|/||g')

BASE_URL="https://$VERCEL_URL"

echo ""
echo "📍 Testing: $BASE_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HEALTH_CODE" = "200" ] && echo "$HEALTH_BODY" | grep -q "healthy"; then
    echo "   ✅ Health Check PASSED"
    echo "   Response: $HEALTH_BODY"
else
    echo "   ❌ Health Check FAILED (HTTP $HEALTH_CODE)"
    echo "   Response: $HEALTH_BODY"
fi
echo ""

# Test 2: Products API
echo "2️⃣  Testing Products API..."
PRODUCTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/products")
PRODUCTS_CODE=$(echo "$PRODUCTS_RESPONSE" | tail -n1)
PRODUCTS_BODY=$(echo "$PRODUCTS_RESPONSE" | head -n-1)

if [ "$PRODUCTS_CODE" = "200" ] && echo "$PRODUCTS_BODY" | grep -q "success"; then
    echo "   ✅ Products API PASSED"
    PRODUCT_COUNT=$(echo "$PRODUCTS_BODY" | grep -o '"products":\[' | wc -l)
    echo "   Products endpoint responding"
else
    echo "   ❌ Products API FAILED (HTTP $PRODUCTS_CODE)"
fi
echo ""

# Test 3: Customers API
echo "3️⃣  Testing Customers API..."
CUSTOMERS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/customers")
CUSTOMERS_CODE=$(echo "$CUSTOMERS_RESPONSE" | tail -n1)
CUSTOMERS_BODY=$(echo "$CUSTOMERS_RESPONSE" | head -n-1)

if [ "$CUSTOMERS_CODE" = "200" ] && echo "$CUSTOMERS_BODY" | grep -q "success"; then
    echo "   ✅ Customers API PASSED"
    echo "   Customers endpoint responding"
else
    echo "   ❌ Customers API FAILED (HTTP $CUSTOMERS_CODE)"
fi
echo ""

# Test 4: User API
echo "4️⃣  Testing User Info API..."
USER_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/user")
USER_CODE=$(echo "$USER_RESPONSE" | tail -n1)
USER_BODY=$(echo "$USER_RESPONSE" | head -n-1)

if [ "$USER_CODE" = "200" ]; then
    echo "   ✅ User Info API PASSED"
    echo "   Response: $USER_BODY"
else
    echo "   ❌ User Info API FAILED (HTTP $USER_CODE)"
fi
echo ""

# Test 5: Static Files
echo "5️⃣  Testing Static File Serving..."
HTML_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/pos" -o /dev/null)
HTML_CODE=$(echo "$HTML_RESPONSE" | tail -n1)

if [ "$HTML_CODE" = "200" ]; then
    echo "   ✅ POS Page Loading PASSED"
else
    echo "   ❌ POS Page Loading FAILED (HTTP $HTML_CODE)"
fi
echo ""

# Summary
echo "===================================="
echo "📊 Test Summary:"
echo "===================================="
echo ""
echo "🌐 Your Application URLs:"
echo "   POS App:     $BASE_URL/pos"
echo "   Collection:  $BASE_URL/collection"
echo "   API Health:  $BASE_URL/api/health"
echo "   API Products: $BASE_URL/api/products"
echo ""
echo "📝 Next Steps:"
echo "   1. Open POS App in browser"
echo "   2. Add a test customer"
echo "   3. Create a test sale"
echo "   4. Check Supabase Table Editor"
echo "   5. Verify data saved correctly"
echo ""
echo "🔍 Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/uoeswfuiwjluqomgepar"
echo ""
echo "===================================="
echo "✅ Testing Complete!"
echo "===================================="
