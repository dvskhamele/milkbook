#!/usr/bin/env python3
"""
Deploy MilkRecord Schema to Supabase Non-Interactively
Uses Supabase Management API
"""

import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv('flask_app/.env')

# Get Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE') or os.getenv('SUPABASE_KEY')
PROJECT_REF = SUPABASE_URL.split('//')[1].split('.')[0] if SUPABASE_URL else ''

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing Supabase credentials")
    print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env")
    sys.exit(1)

print(f"🚀 Deploying to Supabase Project: {PROJECT_REF}")
print(f"📊 URL: {SUPABASE_URL}")

# Read schema file
schema_file = Path('flask_app/ADDITIVE_INVENTORY_RECONCILIATION_SCHEMA.sql')
if not schema_file.exists():
    print(f"❌ Error: Schema file not found: {schema_file}")
    sys.exit(1)

with open(schema_file, 'r') as f:
    schema_sql = f.read()

print(f"✅ Schema loaded ({len(schema_sql)} bytes)")

# Deploy via Supabase REST API
print("\n📡 Deploying schema to Supabase...")

try:
    # Use Supabase SQL endpoint
    response = requests.post(
        f'{SUPABASE_URL}/rest/v1/rpc/execute_sql',
        headers={
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        json={'query': schema_sql},
        timeout=60
    )
    
    if response.status_code in [200, 201, 204]:
        print("\n✅ Schema deployed successfully!")
        print("\n📊 Verifying tables...")
        
        # Verify tables created
        verify_sql = """
        SELECT 
            '✅ Complete Inventory & Reconciliation Schema Deployed' as status,
            (SELECT count(*) FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('shifts', 'inventory_current', 'inventory_movements', 
                                'production_batches', 'shift_reconciliation', 
                                'farmer_yield_analytics', 'waste_tracking')) as tables_created,
            (SELECT count(*) FROM information_schema.views 
             WHERE table_schema = 'public' 
             AND table_name IN ('milk_ledger', 'production_ledger', 'inventory_ledger', 
                                'sales_ledger', 'cash_credit_ledger')) as views_created
        """
        
        verify_response = requests.post(
            f'{SUPABASE_URL}/rest/v1/rpc/execute_sql',
            headers={
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'Content-Type': 'application/json'
            },
            json={'query': verify_sql},
            timeout=30
        )
        
        if verify_response.status_code == 200:
            result = verify_response.json()
            print(f"\n{result}")
        
        print("\n🎉 Deployment complete!")
        print("\n📋 Next steps:")
        print("1. Initialize inventory:")
        print("   Run: INSERT INTO inventory_current... (see DEPLOY_TO_SUPABASE_COMPLETE.md)")
        print("\n2. Test in POS:")
        print("   - Open http://localhost:5000/pos")
        print("   - Click 🏭 Production")
        print("   - Click 5 Ledger buttons")
        
    else:
        print(f"\n❌ Deployment failed: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        sys.exit(1)
        
except requests.exceptions.Timeout:
    print("\n❌ Error: Request timed out")
    print("The schema is large, please wait and verify in Supabase dashboard")
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
