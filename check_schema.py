#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('flask_app/.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

print("🔍 Checking your actual database schema...\n")

# Check each table's actual columns
tables = ['shops', 'products', 'customers', 'sales', 'milk_collections']

for table in tables:
    print(f"📊 {table}:")
    try:
        # Try to get schema by attempting different common column names
        test_columns = ['id', 'name', 'shop_name', 'phone', 'shop_phone', 'customer_name', 'farmer_name', 'quantity', 'price', 'total_amount', 'amount', 'shop_id', 'customer_id', 'farmer_id']
        
        for col in test_columns:
            try:
                result = supabase.table(table).select(col).limit(1).execute()
                print(f"  ✅ {col}")
            except:
                pass
    except Exception as e:
        print(f"  ❌ Error: {str(e)[:100]}")
    print()
