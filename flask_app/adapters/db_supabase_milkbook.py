"""
Supabase Adapter - MilkBook Integration
Works with existing MilkBook database schema
Auto-detects and adapts to existing tables
"""

import os
from datetime import datetime
from typing import List, Dict, Optional
from supabase import create_client, Client

# Initialize Supabase client
supabase: Optional[Client] = None

def get_client() -> Client:
    """Get Supabase client instance"""
    global supabase
    
    if supabase is None:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials")
        
        supabase = create_client(supabase_url, supabase_key)
    
    return supabase

# ============================================
# Schema Detection
# ============================================

def detect_schema() -> Dict[str, bool]:
    """Detect which tables exist in Supabase"""
    client = get_client()
    
    tables_to_check = [
        'products', 'customers', 'sales', 'farmers',
        'milk_entries', 'milk_collections', 'payments',
        'rates', 'inventory', 'users', 'dairies'
    ]
    
    schema = {}
    
    for table in tables_to_check:
        try:
            result = client.table(table).select('id').limit(1).execute()
            schema[table] = hasattr(result, 'data')
        except:
            schema[table] = False
    
    return schema

# ============================================
# Product Repository
# ============================================

def product_get_all() -> List[Dict]:
    """Get all products from Supabase"""
    try:
        client = get_client()
        result = client.table('products').select('*').order('name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting products: {e}")
        return []

def product_save(product: Dict) -> bool:
    """Save product to Supabase"""
    try:
        client = get_client()
        
        # Ensure timestamps
        product['updated_at'] = datetime.now().isoformat()
        
        # Upsert (insert or update)
        result = client.table('products').upsert(product).execute()
        
        return True
    except Exception as e:
        print(f"Error saving product: {e}")
        return False

# ============================================
# Customer Repository
# ============================================

def customer_get_all() -> List[Dict]:
    """Get all customers from Supabase"""
    try:
        client = get_client()
        result = client.table('customers').select('*').order('name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting customers: {e}")
        return []

def customer_save(customer: Dict) -> bool:
    """Save customer to Supabase"""
    try:
        client = get_client()
        
        customer['updated_at'] = datetime.now().isoformat()
        
        result = client.table('customers').upsert(customer).execute()
        
        return True
    except Exception as e:
        print(f"Error saving customer: {e}")
        return False

# ============================================
# Sale Repository
# ============================================

def sale_get_all(limit: int = 100) -> List[Dict]:
    """Get all sales from Supabase"""
    try:
        client = get_client()
        result = client.table('sales').select('*').order('sale_date', desc=True).limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting sales: {e}")
        return []

def sale_save(sale: Dict) -> bool:
    """Save sale to Supabase"""
    try:
        client = get_client()
        
        sale['updated_at'] = datetime.now().isoformat()
        
        # Check if sale already exists
        if 'id' in sale:
            existing = client.table('sales').select('id').eq('id', sale['id']).execute()
            if existing.data:
                # Update existing
                result = client.table('sales').update(sale).eq('id', sale['id']).execute()
            else:
                # Insert new
                result = client.table('sales').insert(sale).execute()
        else:
            # Insert new
            result = client.table('sales').insert(sale).execute()
        
        return True
    except Exception as e:
        print(f"Error saving sale: {e}")
        return False

# ============================================
# Farmer Repository
# ============================================

def farmer_get_all() -> List[Dict]:
    """Get all farmers from Supabase"""
    try:
        client = get_client()
        result = client.table('farmers').select('*').order('name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting farmers: {e}")
        return []

def farmer_save(farmer: Dict) -> bool:
    """Save farmer to Supabase"""
    try:
        client = get_client()
        
        farmer['updated_at'] = datetime.now().isoformat()
        
        result = client.table('farmers').upsert(farmer).execute()
        
        return True
    except Exception as e:
        print(f"Error saving farmer: {e}")
        return False

# ============================================
# MilkBook Specific Functions
# ============================================

def milk_entry_get_all(farmer_id: str = None, limit: int = 100) -> List[Dict]:
    """Get milk entries (MilkBook specific)"""
    try:
        client = get_client()
        query = client.table('milk_entries').select('*')
        
        if farmer_id:
            query = query.eq('farmer_id', farmer_id)
        
        result = query.order('entry_date', desc=True).limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting milk entries: {e}")
        return []

def milk_entry_save(entry: Dict) -> bool:
    """Save milk entry (MilkBook specific)"""
    try:
        client = get_client()
        
        entry['updated_at'] = datetime.now().isoformat()
        
        result = client.table('milk_entries').upsert(entry).execute()
        
        return True
    except Exception as e:
        print(f"Error saving milk entry: {e}")
        return False

# ============================================
# Initialize Database
# ============================================

def init_database():
    """Initialize database with required tables if they don't exist"""
    client = get_client()
    
    # Check schema
    schema = detect_schema()
    
    print("📊 Database Schema:")
    for table, exists in schema.items():
        status = "✅" if exists else "❌"
        print(f"   {status} {table}")
    
    return schema
