"""
Database Adapter - Supabase Cloud
For Vercel serverless and cloud sync
Uses Supabase Python client with RLS
"""

import os
from datetime import datetime
from typing import List, Dict, Optional, Any

# Import Supabase client
try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    print("Warning: Supabase client not installed. Cloud features disabled.")

# Initialize Supabase client
supabase: Optional[Client] = None

def init_supabase():
    """Initialize Supabase client from environment variables"""
    global supabase
    
    if not HAS_SUPABASE:
        return None
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')  # Use anon key for client safety
    
    if not supabase_url or not supabase_key:
        print("Warning: SUPABASE_URL or SUPABASE_KEY not set")
        return None
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase client initialized")
        return supabase
    except Exception as e:
        print(f"Error initializing Supabase: {e}")
        return None


def get_client() -> Optional[Client]:
    """Get Supabase client instance"""
    if supabase is None:
        return init_supabase()
    return supabase


# ============================================
# Farmer Repository - Supabase
# ============================================

def farmer_save(farmer: Dict) -> bool:
    """Save farmer to Supabase"""
    try:
        client = get_client()
        if not client:
            return False
        
        # Ensure timestamps
        farmer['updated_at'] = datetime.now().isoformat()
        
        # Upsert (insert or update)
        result = client.table('farmers').upsert(farmer).execute()
        
        print(f"✅ Farmer saved to Supabase: {farmer['id']}")
        return True
    except Exception as e:
        print(f"Error saving farmer to Supabase: {e}")
        return False


def farmer_get_all() -> List[Dict]:
    """Get all farmers from Supabase"""
    try:
        client = get_client()
        if not client:
            return []
        
        result = client.table('farmers').select('*').order('name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting farmers from Supabase: {e}")
        return []


def farmer_get_by_id(farmer_id: str) -> Optional[Dict]:
    """Get farmer by ID from Supabase"""
    try:
        client = get_client()
        if not client:
            return None
        
        result = client.table('farmers').select('*').eq('id', farmer_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error getting farmer from Supabase: {e}")
        return None


# ============================================
# Sale Repository - Supabase
# ============================================

def sale_save(sale: Dict) -> bool:
    """Save sale to Supabase"""
    try:
        client = get_client()
        if not client:
            return False
        
        # Ensure timestamps
        sale['updated_at'] = datetime.now().isoformat()
        
        # Insert sale
        result = client.table('sales').insert(sale).execute()
        
        print(f"✅ Sale saved to Supabase: {sale['id']}")
        return True
    except Exception as e:
        print(f"Error saving sale to Supabase: {e}")
        return False


def sale_get_all(limit: int = 100) -> List[Dict]:
    """Get all sales from Supabase"""
    try:
        client = get_client()
        if not client:
            return []
        
        result = client.table('sales').select('*').order('sale_date', desc=True).limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting sales from Supabase: {e}")
        return []


def sale_get_by_id(sale_id: str) -> Optional[Dict]:
    """Get sale by ID from Supabase"""
    try:
        client = get_client()
        if not client:
            return None
        
        result = client.table('sales').select('*').eq('id', sale_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error getting sale from Supabase: {e}")
        return None


# ============================================
# Customer Repository - Supabase
# ============================================

def customer_save(customer: Dict) -> bool:
    """Save customer to Supabase"""
    try:
        client = get_client()
        if not client:
            return False
        
        customer['updated_at'] = datetime.now().isoformat()
        
        result = client.table('customers').upsert(customer).execute()
        
        print(f"✅ Customer saved to Supabase: {customer['id']}")
        return True
    except Exception as e:
        print(f"Error saving customer to Supabase: {e}")
        return False


def customer_get_all() -> List[Dict]:
    """Get all customers from Supabase"""
    try:
        client = get_client()
        if not client:
            return []
        
        result = client.table('customers').select('*').order('name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting customers from Supabase: {e}")
        return []


# ============================================
# Product Repository - Supabase
# ============================================

def product_save(product: Dict) -> bool:
    """Save product to Supabase"""
    try:
        client = get_client()
        if not client:
            return False
        
        product['updated_at'] = datetime.now().isoformat()
        
        result = client.table('products').upsert(product).execute()
        
        print(f"✅ Product saved to Supabase: {product['id']}")
        return True
    except Exception as e:
        print(f"Error saving product to Supabase: {e}")
        return False


def product_get_all() -> List[Dict]:
    """Get all products from Supabase"""
    try:
        client = get_client()
        if not client:
            return []
        
        result = client.table('products').select('*').order('category', 'name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Error getting products from Supabase: {e}")
        return []


# ============================================
# Sync Log Repository - Supabase
# ============================================

def log_sync(device_id: str, table_name: str, record_id: str, action: str, status: str, error_message: str = None) -> bool:
    """Log sync attempt to Supabase"""
    try:
        client = get_client()
        if not client:
            return False
        
        log_entry = {
            'device_id': device_id,
            'table_name': table_name,
            'record_id': record_id,
            'action': action,
            'status': status,
            'error_message': error_message,
            'created_at': datetime.now().isoformat()
        }
        
        result = client.table('sync_logs').insert(log_entry).execute()
        return True
    except Exception as e:
        print(f"Error logging sync to Supabase: {e}")
        return False


# ============================================
# Conflict Resolution
# ============================================

def check_conflict(table_name: str, record_id: str, version: int) -> Dict:
    """
    Check for version conflicts
    Returns: {'has_conflict': bool, 'remote_version': int, 'remote_data': Dict}
    """
    try:
        client = get_client()
        if not client:
            return {'has_conflict': False, 'remote_version': 0, 'remote_data': None}
        
        result = client.table(table_name).select('*').eq('id', record_id).execute()
        
        if not result.data:
            return {'has_conflict': False, 'remote_version': 0, 'remote_data': None}
        
        remote_data = result.data[0]
        remote_version = remote_data.get('version', 0)
        
        # Conflict if remote version is higher
        has_conflict = remote_version > version
        
        return {
            'has_conflict': has_conflict,
            'remote_version': remote_version,
            'remote_data': remote_data
        }
    except Exception as e:
        print(f"Error checking conflict: {e}")
        return {'has_conflict': False, 'remote_version': 0, 'remote_data': None}
