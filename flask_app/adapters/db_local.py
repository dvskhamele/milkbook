"""
Database Adapter - Local SQLite with Sync Support
For Desktop/EXE deployment with offline-first architecture
Stores records with sync_status for later Supabase sync
"""

import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from uuid6 import uuid7

# Database path - stored in user data directory for EXE compatibility
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database')
DB_PATH = os.path.join(DB_DIR, 'milkrecord.db')

# Ensure database directory exists
os.makedirs(DB_DIR, exist_ok=True)


def get_device_id() -> str:
    """
    Generate unique device ID based on system info
    Stored in config file for persistence
    """
    config_path = os.path.join(DB_DIR, 'device_config.json')
    
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
            return config.get('device_id')
    
    # Generate new device ID
    try:
        import psutil
        # Use MAC address + timestamp for unique ID
        mac = ':'.join(['{:02x}'.format((uuid7().int >> 64) & (1 << 48) | i) 
                       for i in range(6)])
        device_id = f"device_{mac}_{datetime.now().strftime('%Y%m%d')}"
    except:
        device_id = f"device_{uuid7().hex}"
    
    # Save config
    with open(config_path, 'w') as f:
        json.dump({'device_id': device_id, 'created_at': datetime.now().isoformat()}, f)
    
    return device_id


def get_connection():
    """Get SQLite connection with foreign keys enabled"""
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute('PRAGMA foreign_keys = ON')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database schema with sync fields"""
    conn = get_connection()
    c = conn.cursor()
    
    # Device tracking table
    c.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            device_name TEXT,
            device_type TEXT,
            last_sync TEXT,
            created_at TEXT
        )
    ''')
    
    # Farmers table with sync fields
    c.execute('''
        CREATE TABLE IF NOT EXISTS farmers (
            id TEXT PRIMARY KEY,
            device_id TEXT,
            name TEXT NOT NULL,
            phone TEXT,
            animal_type TEXT,
            balance REAL DEFAULT 0,
            sync_status TEXT DEFAULT 'pending',
            version INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )
    ''')
    
    # Milk collections table with sync fields
    c.execute('''
        CREATE TABLE IF NOT EXISTS milk_collections (
            id TEXT PRIMARY KEY,
            device_id TEXT,
            farmer_id TEXT,
            quantity REAL,
            fat REAL,
            snf REAL,
            rate REAL,
            amount REAL,
            shift TEXT,
            collection_date TEXT,
            sync_status TEXT DEFAULT 'pending',
            version INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (farmer_id) REFERENCES farmers(id)
        )
    ''')
    
    # Customers table with sync fields
    c.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            device_id TEXT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            balance REAL DEFAULT 0,
            sync_status TEXT DEFAULT 'pending',
            version INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )
    ''')
    
    # Sales table with sync fields
    c.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            device_id TEXT,
            customer_id TEXT,
            customer_name TEXT,
            items TEXT,
            total_amount REAL,
            paid_amount REAL,
            payment_mode TEXT,
            sync_status TEXT DEFAULT 'pending',
            version INTEGER DEFAULT 1,
            sale_date TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
    ''')
    
    # Products table with sync fields
    c.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            device_id TEXT,
            name TEXT NOT NULL,
            category TEXT,
            price REAL,
            unit TEXT,
            emoji TEXT,
            sync_status TEXT DEFAULT 'pending',
            version INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )
    ''')
    
    # Sync logs table for tracking
    c.execute('''
        CREATE TABLE IF NOT EXISTS sync_logs (
            id TEXT PRIMARY KEY,
            device_id TEXT,
            table_name TEXT,
            record_id TEXT,
            action TEXT,
            status TEXT,
            error_message TEXT,
            created_at TEXT
        )
    ''')
    
    # Create indexes for sync performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_sync_status ON farmers(sync_status)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_sync_status_sales ON sales(sync_status)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_device_id ON farmers(device_id)')
    
    # Register this device
    device_id = get_device_id()
    c.execute('''
        INSERT OR IGNORE INTO devices (device_id, device_name, device_type, created_at)
        VALUES (?, ?, ?, ?)
    ''', (device_id, 'Desktop POS', 'desktop', datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized with device_id: {device_id}")


# ============================================
# Helper Functions
# ============================================

def generate_uuid() -> str:
    """Generate UUID v7 for records"""
    return uuid7().hex


def get_timestamp() -> str:
    """Get current ISO timestamp"""
    return datetime.now().isoformat()


# ============================================
# Farmer Repository
# ============================================

def farmer_save(farmer: Dict) -> bool:
    """Save farmer with sync tracking"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        # Add sync fields if not present
        if 'id' not in farmer or not farmer['id']:
            farmer['id'] = generate_uuid()
        
        farmer['device_id'] = get_device_id()
        farmer['sync_status'] = farmer.get('sync_status', 'pending')
        farmer['version'] = farmer.get('version', 1)
        farmer['created_at'] = farmer.get('created_at', get_timestamp())
        farmer['updated_at'] = get_timestamp()
        
        c.execute('''
            INSERT OR REPLACE INTO farmers 
            (id, device_id, name, phone, animal_type, balance, sync_status, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            farmer['id'],
            farmer['device_id'],
            farmer['name'],
            farmer.get('phone'),
            farmer.get('animal_type', 'cow'),
            farmer.get('balance', 0.0),
            farmer['sync_status'],
            farmer['version'],
            farmer['created_at'],
            farmer['updated_at']
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving farmer: {e}")
        return False


def farmer_get_all() -> List[Dict]:
    """Get all farmers"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM farmers ORDER BY name')
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting farmers: {e}")
        return []


def farmer_get_pending_sync() -> List[Dict]:
    """Get farmers pending sync to Supabase"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            SELECT * FROM farmers 
            WHERE sync_status = 'pending' 
            ORDER BY created_at
            LIMIT 100
        ''')
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting pending farmers: {e}")
        return []


def farmer_mark_synced(farmer_id: str) -> bool:
    """Mark farmer as synced"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            UPDATE farmers 
            SET sync_status = 'synced', updated_at = ?
            WHERE id = ?
        ''', (get_timestamp(), farmer_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error marking farmer synced: {e}")
        return False


# ============================================
# Sale Repository
# ============================================

def sale_save(sale: Dict) -> bool:
    """Save sale with sync tracking"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        # Add sync fields if not present
        if 'id' not in sale or not sale['id']:
            sale['id'] = generate_uuid()
        
        sale['device_id'] = get_device_id()
        sale['sync_status'] = sale.get('sync_status', 'pending')
        sale['version'] = sale.get('version', 1)
        sale['created_at'] = sale.get('created_at', get_timestamp())
        sale['updated_at'] = get_timestamp()
        
        c.execute('''
            INSERT OR REPLACE INTO sales 
            (id, device_id, customer_id, customer_name, items, total_amount, paid_amount, payment_mode, sync_status, version, sale_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            sale['id'],
            sale['device_id'],
            sale.get('customer_id'),
            sale.get('customer_name', 'Walking Customer'),
            sale.get('items', '[]'),
            sale['total_amount'],
            sale.get('paid_amount', 0.0),
            sale.get('payment_mode', 'cash'),
            sale['sync_status'],
            sale['version'],
            sale.get('sale_date', get_timestamp()),
            sale['created_at'],
            sale['updated_at']
        ))
        
        # Update customer balance if credit
        if sale.get('payment_mode') == 'credit' and sale.get('customer_id'):
            balance_due = sale['total_amount'] - sale.get('paid_amount', 0.0)
            c.execute('''
                UPDATE customers SET balance = balance + ? WHERE id = ?
            ''', (balance_due, sale['customer_id']))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving sale: {e}")
        return False


def sale_get_all(limit: int = 100) -> List[Dict]:
    """Get all sales"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            SELECT * FROM sales 
            ORDER BY sale_date DESC 
            LIMIT ?
        ''', (limit,))
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting sales: {e}")
        return []


def sale_get_pending_sync() -> List[Dict]:
    """Get sales pending sync to Supabase"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            SELECT * FROM sales 
            WHERE sync_status = 'pending' 
            ORDER BY created_at
            LIMIT 100
        ''')
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting pending sales: {e}")
        return []


def sale_mark_synced(sale_id: str) -> bool:
    """Mark sale as synced"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            UPDATE sales 
            SET sync_status = 'synced', updated_at = ?
            WHERE id = ?
        ''', (get_timestamp(), sale_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error marking sale synced: {e}")
        return False


# ============================================
# Customer Repository
# ============================================

def customer_save(customer: Dict) -> bool:
    """Save customer with sync tracking"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        if 'id' not in customer or not customer['id']:
            customer['id'] = generate_uuid()
        
        customer['device_id'] = get_device_id()
        customer['sync_status'] = customer.get('sync_status', 'pending')
        customer['version'] = customer.get('version', 1)
        customer['created_at'] = customer.get('created_at', get_timestamp())
        customer['updated_at'] = get_timestamp()
        
        c.execute('''
            INSERT OR REPLACE INTO customers 
            (id, device_id, name, phone, email, address, balance, sync_status, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            customer['id'],
            customer['device_id'],
            customer['name'],
            customer.get('phone'),
            customer.get('email'),
            customer.get('address'),
            customer.get('balance', 0.0),
            customer['sync_status'],
            customer['version'],
            customer['created_at'],
            customer['updated_at']
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving customer: {e}")
        return False


def customer_get_all() -> List[Dict]:
    """Get all customers"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM customers ORDER BY name')
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting customers: {e}")
        return []


# ============================================
# Product Repository
# ============================================

def product_save(product: Dict) -> bool:
    """Save product with sync tracking"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        if 'id' not in product or not product['id']:
            product['id'] = generate_uuid()
        
        product['device_id'] = get_device_id()
        product['sync_status'] = product.get('sync_status', 'pending')
        product['version'] = product.get('version', 1)
        product['created_at'] = product.get('created_at', get_timestamp())
        product['updated_at'] = get_timestamp()
        
        c.execute('''
            INSERT OR REPLACE INTO products 
            (id, device_id, name, category, price, unit, emoji, sync_status, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            product['id'],
            product['device_id'],
            product['name'],
            product.get('category', 'all'),
            product['price'],
            product.get('unit', 'unit'),
            product.get('emoji', '📦'),
            product['sync_status'],
            product['version'],
            product['created_at'],
            product['updated_at']
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving product: {e}")
        return False


def product_get_all() -> List[Dict]:
    """Get all products"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('SELECT * FROM products ORDER BY category, name')
        rows = c.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting products: {e}")
        return []


# ============================================
# Sync Log Repository
# ============================================

def log_sync(device_id: str, table_name: str, record_id: str, action: str, status: str, error_message: str = None) -> bool:
    """Log sync attempt"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute('''
            INSERT INTO sync_logs (id, device_id, table_name, record_id, action, status, error_message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            generate_uuid(),
            device_id,
            table_name,
            record_id,
            action,
            status,
            error_message,
            get_timestamp()
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error logging sync: {e}")
        return False
