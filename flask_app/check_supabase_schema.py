"""
Check Existing Supabase Database Schema
Analyzes existing tables and creates compatible adapters
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Initialize Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    print("❌ Missing Supabase credentials")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

def check_existing_tables():
    """Check what tables already exist in Supabase"""
    print("🔍 Checking existing database schema...\n")
    
    try:
        # Query information_schema to get all tables
        result = supabase.rpc('get_all_tables').execute()
        
        if hasattr(result, 'data') and result.data:
            print("✅ Existing tables found:")
            for table in result.data:
                print(f"   - {table.get('table_name', 'unknown')}")
            return result.data
        else:
            print("⚠️  No tables found or RPC function not available")
            return []
            
    except Exception as e:
        print(f"⚠️  Could not query tables: {e}")
        print("   This is normal for new Supabase projects")
        return []

def check_milkbook_tables():
    """Check for existing MilkBook tables"""
    print("\n🔍 Checking for MilkBook specific tables...\n")
    
    milkbook_tables = [
        'farmers',
        'customers', 
        'products',
        'sales',
        'milk_entries',
        'milk_collections',
        'payments',
        'rates',
        'inventory',
        'users',
        'dairies',
        'shifts'
    ]
    
    existing = []
    
    for table in milkbook_tables:
        try:
            result = supabase.table(table).select('id').limit(1).execute()
            if hasattr(result, 'data'):
                print(f"   ✅ {table} - EXISTS")
                existing.append(table)
            else:
                print(f"   ❌ {table} - NOT FOUND")
        except Exception as e:
            print(f"   ❌ {table} - NOT FOUND ({str(e)[:50]})")
    
    return existing

def get_table_schema(table_name):
    """Get schema for a specific table"""
    print(f"\n📋 Schema for {table_name}:")
    
    try:
        # Try to get one record to see structure
        result = supabase.table(table_name).select('*').limit(1).execute()
        
        if hasattr(result, 'data') and result.data and len(result.data) > 0:
            record = result.data[0]
            print("   Columns:")
            for key, value in record.items():
                value_type = type(value).__name__
                print(f"      - {key}: {value_type}")
        else:
            print("   ⚠️  Table exists but no data to inspect schema")
            
    except Exception as e:
        print(f"   ⚠️  Could not get schema: {e}")

def create_compatibility_layer(existing_tables):
    """Create adapter that works with existing schema"""
    print("\n🔧 Creating compatibility layer...\n")
    
    # Check what tables we need
    required_tables = ['products', 'customers', 'sales', 'farmers']
    missing_tables = [t for t in required_tables if t not in existing_tables]
    
    if missing_tables:
        print("⚠️  Missing tables for POS functionality:")
        for table in missing_tables:
            print(f"   - {table}")
        print("\n📝 Will create schema migration script...")
        return False
    else:
        print("✅ All required tables exist!")
        return True

def main():
    print("=" * 60)
    print("MilkBook Database Schema Analyzer")
    print("=" * 60)
    print(f"\nSupabase URL: {supabase_url}")
    print(f"Project ID: {os.getenv('SB_PROJECT_ID', 'unknown')}\n")
    
    # Check existing tables
    all_tables = check_existing_tables()
    
    # Check MilkBook tables
    milkbook_tables = check_milkbook_tables()
    
    # Get schema for existing tables
    for table in milkbook_tables[:3]:  # Check first 3 tables
        get_table_schema(table)
    
    # Create compatibility layer
    is_compatible = create_compatibility_layer(milkbook_tables)
    
    print("\n" + "=" * 60)
    if is_compatible:
        print("✅ Database is compatible with MilkRecord POS")
        print("\n🚀 Next steps:")
        print("   1. Review schema mapping in adapters/db_supabase.py")
        print("   2. Test API endpoints")
        print("   3. Deploy to Vercel")
    else:
        print("⚠️  Database needs migration")
        print("\n📝 Next steps:")
        print("   1. Run supabase_schema.sql to create missing tables")
        print("   2. Or manually create tables in Supabase dashboard")
        print("   3. Then test API endpoints")
    print("=" * 60)

if __name__ == '__main__':
    main()
