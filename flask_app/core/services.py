"""
Core Services - Unified Business Logic
Single source of truth for all operations
Works with both SQLite (desktop) and Supabase (cloud)
"""

import os
import sys
import requests
from datetime import datetime
from typing import Dict, List, Optional

# Import adapters
from adapters import db_local, db_supabase

# ============================================
# Runtime Detection
# ============================================

def is_desktop() -> bool:
    """Check if running as desktop EXE or local Flask"""
    return getattr(sys, 'frozen', False) or os.getenv('RUNTIME') == 'desktop'


def is_vercel() -> bool:
    """Check if running on Vercel"""
    return os.getenv('VERCEL') == '1'


def internet_available() -> bool:
    """Check if internet connection is available"""
    try:
        requests.get("https://google.com", timeout=3)
        return True
    except:
        return False


# Runtime flags
IS_DESKTOP = is_desktop()
IS_VERCEL = is_vercel()

print(f"🔧 Runtime: Desktop={IS_DESKTOP}, Vercel={IS_VERCEL}")


# ============================================
# Unified Save Functions
# ============================================

def save_farmer(data: Dict) -> Dict:
    """
    Save farmer with unified logic
    Desktop: Save to SQLite + try sync to Supabase
    Vercel: Save directly to Supabase
    """
    result = {'success': False, 'farmer': None, 'message': ''}
    
    try:
        if IS_DESKTOP:
            # Save to SQLite first (offline-first)
            data['sync_status'] = 'pending'
            success = db_local.farmer_save(data)
            
            if success:
                result['success'] = True
                result['farmer'] = data
                result['message'] = 'Saved locally'
                
                # Try to sync to Supabase if internet available
                if internet_available():
                    try:
                        # Remove sync fields for Supabase
                        supabase_data = {k: v for k, v in data.items() if k not in ['sync_status']}
                        supabase_data['sync_status'] = 'synced'
                        
                        if db_supabase.farmer_save(supabase_data):
                            db_local.farmer_mark_synced(data['id'])
                            result['message'] = 'Saved and synced to cloud'
                    except Exception as e:
                        print(f"Sync failed, will retry later: {e}")
                        db_local.log_sync(
                            data.get('device_id', 'unknown'),
                            'farmers',
                            data['id'],
                            'INSERT',
                            'failed',
                            str(e)
                        )
            else:
                result['message'] = 'Failed to save locally'
        
        else:
            # Vercel: Save directly to Supabase
            data['sync_status'] = 'synced'
            success = db_supabase.farmer_save(data)
            
            if success:
                result['success'] = True
                result['farmer'] = data
                result['message'] = 'Saved to cloud'
            else:
                result['message'] = 'Failed to save to cloud'
    
    except Exception as e:
        result['message'] = f'Error: {str(e)}'
        print(f"Error in save_farmer: {e}")
    
    return result


def save_sale(data: Dict) -> Dict:
    """
    Save sale with unified logic
    Desktop: Save to SQLite + try sync to Supabase
    Vercel: Save directly to Supabase
    """
    result = {'success': False, 'sale_id': None, 'message': ''}
    
    try:
        if IS_DESKTOP:
            # Save to SQLite first (offline-first)
            data['sync_status'] = 'pending'
            success = db_local.sale_save(data)
            
            if success:
                result['success'] = True
                result['sale_id'] = data['id']
                result['message'] = 'Saved locally'
                
                # Try to sync to Supabase if internet available
                if internet_available():
                    try:
                        supabase_data = {k: v for k, v in data.items() if k not in ['sync_status']}
                        supabase_data['sync_status'] = 'synced'
                        
                        if db_supabase.sale_save(supabase_data):
                            db_local.sale_mark_synced(data['id'])
                            result['message'] = 'Saved and synced to cloud'
                    except Exception as e:
                        print(f"Sync failed, will retry later: {e}")
                        db_local.log_sync(
                            data.get('device_id', 'unknown'),
                            'sales',
                            data['id'],
                            'INSERT',
                            'failed',
                            str(e)
                        )
            else:
                result['message'] = 'Failed to save locally'
        
        else:
            # Vercel: Save directly to Supabase
            data['sync_status'] = 'synced'
            success = db_supabase.sale_save(data)
            
            if success:
                result['success'] = True
                result['sale_id'] = data['id']
                result['message'] = 'Saved to cloud'
            else:
                result['message'] = 'Failed to save to cloud'
    
    except Exception as e:
        result['message'] = f'Error: {str(e)}'
        print(f"Error in save_sale: {e}")
    
    return result


def save_customer(data: Dict) -> Dict:
    """
    Save customer with unified logic
    """
    result = {'success': False, 'customer': None, 'message': ''}
    
    try:
        if IS_DESKTOP:
            data['sync_status'] = 'pending'
            success = db_local.customer_save(data)
            
            if success:
                result['success'] = True
                result['customer'] = data
                result['message'] = 'Saved locally'
                
                if internet_available():
                    try:
                        supabase_data = {k: v for k, v in data.items() if k not in ['sync_status']}
                        supabase_data['sync_status'] = 'synced'
                        
                        if db_supabase.customer_save(supabase_data):
                            result['message'] = 'Saved and synced to cloud'
                    except Exception as e:
                        print(f"Sync failed: {e}")
            else:
                result['message'] = 'Failed to save locally'
        
        else:
            data['sync_status'] = 'synced'
            success = db_supabase.customer_save(data)
            
            if success:
                result['success'] = True
                result['customer'] = data
                result['message'] = 'Saved to cloud'
            else:
                result['message'] = 'Failed to save to cloud'
    
    except Exception as e:
        result['message'] = f'Error: {str(e)}'
    
    return result


def save_product(data: Dict) -> Dict:
    """
    Save product with unified logic
    """
    result = {'success': False, 'product': None, 'message': ''}
    
    try:
        if IS_DESKTOP:
            data['sync_status'] = 'pending'
            success = db_local.product_save(data)
            
            if success:
                result['success'] = True
                result['product'] = data
                result['message'] = 'Saved locally'
                
                if internet_available():
                    try:
                        supabase_data = {k: v for k, v in data.items() if k not in ['sync_status']}
                        supabase_data['sync_status'] = 'synced'
                        
                        if db_supabase.product_save(supabase_data):
                            result['message'] = 'Saved and synced to cloud'
                    except Exception as e:
                        print(f"Sync failed: {e}")
            else:
                result['message'] = 'Failed to save locally'
        
        else:
            data['sync_status'] = 'synced'
            success = db_supabase.product_save(data)
            
            if success:
                result['success'] = True
                result['product'] = data
                result['message'] = 'Saved to cloud'
            else:
                result['message'] = 'Failed to save to cloud'
    
    except Exception as e:
        result['message'] = f'Error: {str(e)}'
    
    return result


# ============================================
# Get Functions (Read)
# ============================================

def get_farmers() -> List[Dict]:
    """Get farmers - prefer Supabase if available, fallback to SQLite"""
    try:
        if IS_VERCEL or (IS_DESKTOP and internet_available()):
            farmers = db_supabase.farmer_get_all()
            if farmers:
                return farmers
        
        # Fallback to SQLite
        return db_local.farmer_get_all()
    except:
        return db_local.farmer_get_all() if IS_DESKTOP else []


def get_customers() -> List[Dict]:
    """Get customers"""
    try:
        if IS_VERCEL or (IS_DESKTOP and internet_available()):
            customers = db_supabase.customer_get_all()
            if customers:
                return customers
        
        return db_local.customer_get_all() if IS_DESKTOP else []
    except:
        return db_local.customer_get_all() if IS_DESKTOP else []


def get_products() -> List[Dict]:
    """Get products"""
    try:
        if IS_VERCEL or (IS_DESKTOP and internet_available()):
            products = db_supabase.product_get_all()
            if products:
                return products
        
        return db_local.product_get_all() if IS_DESKTOP else []
    except:
        return db_local.product_get_all() if IS_DESKTOP else []


def get_sales(limit: int = 100) -> List[Dict]:
    """Get sales"""
    try:
        if IS_VERCEL or (IS_DESKTOP and internet_available()):
            sales = db_supabase.sale_get_all(limit)
            if sales:
                return sales
        
        return db_local.sale_get_all(limit) if IS_DESKTOP else []
    except:
        return db_local.sale_get_all(limit) if IS_DESKTOP else []
